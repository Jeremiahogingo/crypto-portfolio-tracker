
/**
 * src/lib/api/upstream-coordinator.ts
 *
 * Shared process-level coordinator for external market-data requests.
 *
 * Responsibilities:
 * - Reuse successful upstream responses within their freshness window.
 * - Deduplicate concurrent requests with identical keys.
 * - Serve the last successful response when an upstream refresh fails.
 * - Apply a shared provider-wide cooldown after HTTP 429 responses.
 * - Honour Retry-After in either seconds or HTTP-date format.
 * - Keep cached data bounded by age and maximum entry count.
 *
 * Important:
 * This coordinator is process-local. It does not provide distributed
 * coordination across multiple production server instances.
 */

export type CoordinatedSource = "live" | "cached";

export interface CoordinatedResponse<T> {
  data: T;
  source: CoordinatedSource;
  fetchedAt: string;
}

interface CacheEntry {
  data: unknown;
  fetchedAtMs: number;
  maxStaleForMs: number;
}

interface CoordinatorOptions {
  now?: () => number;
  defaultCooldownMs?: number;
  maxEntries?: number;
}

interface ErrorWithUpstreamMetadata {
  status?: unknown;
  retryAfter?: unknown;
  headers?: {
    get?: (name: string) => string | null;
  };
}

const DEFAULT_COOLDOWN_MS = 60_000;
const DEFAULT_MAX_ENTRIES = 256;

/**
 * Read the upstream HTTP status without requiring a specific error class.
 * This supports both CoinGeckoError and coordinator-generated errors.
 */
function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const status = (error as ErrorWithUpstreamMetadata).status;

  if (typeof status === "number" && Number.isFinite(status)) {
    return status;
  }

  if (typeof status === "string") {
    const parsed = Number(status);

    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

/**
 * Extract Retry-After from the typed provider error or its headers.
 */
function getRetryAfterHeader(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const metadata = error as ErrorWithUpstreamMetadata;

  if (typeof metadata.retryAfter === "string") {
    return metadata.retryAfter;
  }

  if (typeof metadata.headers?.get === "function") {
    return metadata.headers.get("retry-after");
  }

  return null;
}

/**
 * Convert Retry-After into milliseconds.
 *
 * Supported formats:
 * - Delta seconds: "30"
 * - HTTP date: "Sun, 22 Nov 2026 08:30:00 GMT"
 *
 * Delta seconds must be a non-negative integer.
 * Invalid, negative, fractional or unsafe values use fallbackMs.
 *
 * An absent or invalid header also uses fallbackMs.
 */
export function parseRetryAfter(
  value: string | null | undefined,
  now = Date.now(),
  fallbackMs = DEFAULT_COOLDOWN_MS
): number {
  const safeFallback =
    Number.isFinite(fallbackMs) && fallbackMs >= 0
      ? fallbackMs
      : DEFAULT_COOLDOWN_MS;

  if (!value?.trim()) {
    return safeFallback;
  }

  const normalized = value.trim();

  // Retry-After delta-seconds must be a non-negative integer.
  if (/^\d+$/.test(normalized)) {
    const seconds = Number(normalized);

    if (
      !Number.isSafeInteger(seconds) ||
      seconds > Number.MAX_SAFE_INTEGER / 1_000
    ) {
      return safeFallback;
    }

    return seconds * 1_000;
  }

  // Reject malformed numeric values before attempting date parsing.
  // Date.parse() can interpret values such as "-1" as calendar dates.
  const looksNumeric =
    /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(
      normalized
    );

  if (looksNumeric) {
    return safeFallback;
  }

  // Otherwise, attempt to parse an HTTP-date.
  const retryAt = Date.parse(normalized);

  if (!Number.isFinite(retryAt)) {
    return safeFallback;
  }

  return Math.max(0, retryAt - now);
}

/**
 * Raised when an upstream request is blocked by an active provider cooldown.
 */
export class UpstreamRateLimitError extends Error {
  readonly status = 429;

  readonly retryAfterMs: number;

  constructor(
    public readonly retryAt: number,
    now = Date.now()
  ) {
    const retryAfterMs = Math.max(0, retryAt - now);

    super(
      `CoinGecko rate limit cooldown is active. Retry in approximately ${Math.ceil(
        retryAfterMs / 1_000
      )} seconds.`
    );

    this.name = "UpstreamRateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Coordinates CoinGecko requests within one Node.js process.
 */
export class UpstreamRequestCoordinator {
  private readonly cache = new Map<string, CacheEntry>();

  private readonly inFlight = new Map<
    string,
    Promise<CoordinatedResponse<unknown>>
  >();

  private readonly now: () => number;
  private readonly defaultCooldownMs: number;
  private readonly maxEntries: number;

  /**
   * Provider-wide cooldown shared across all endpoint keys.
   */
  private cooldownUntil = 0;

  constructor(options: CoordinatorOptions = {}) {
    this.now = options.now ?? Date.now;

    this.defaultCooldownMs = Math.max(
      0,
      options.defaultCooldownMs ?? DEFAULT_COOLDOWN_MS
    );

    this.maxEntries = Math.max(
      1,
      options.maxEntries ?? DEFAULT_MAX_ENTRIES
    );
  }

  /**
   * Return successful upstream data or safely reuse a previous response.
   *
   * freshForMs:
   * How long successful data can be reused as fresh.
   *
   * maxStaleForMs:
   * Maximum acceptable age when an upstream request fails or the provider
   * is in cooldown.
   *
   * fetcher:
   * The actual upstream request.
   */
  async request<T>(
    key: string,
    freshForMs: number,
    maxStaleForMs: number,
    fetcher: () => Promise<T>
  ): Promise<CoordinatedResponse<T>> {
    if (!key.trim()) {
      throw new Error("An upstream request key is required.");
    }

    if (
      !Number.isFinite(freshForMs) ||
      !Number.isFinite(maxStaleForMs) ||
      freshForMs < 0 ||
      maxStaleForMs < freshForMs
    ) {
      throw new RangeError(
        "Cache durations must be finite, non-negative, and maxStaleForMs must be at least freshForMs."
      );
    }

    const currentTime = this.now();
    const existingEntry = this.cache.get(key);

    // Fresh successful data does not need another provider request.
    if (existingEntry) {
      const age = Math.max(
        0,
        currentTime - existingEntry.fetchedAtMs
      );

      if (age <= freshForMs) {
        return this.toResponse<T>(existingEntry, "live");
      }
    }

    // Share an already-running request for the same key.
    const pending = this.inFlight.get(key);

    if (pending) {
      return pending as Promise<CoordinatedResponse<T>>;
    }

    const staleEntry = this.getUsableCache(
      key,
      maxStaleForMs,
      currentTime
    );

    // Do not make any new provider request during the shared cooldown.
    if (currentTime < this.cooldownUntil) {
      if (staleEntry) {
        return this.toResponse<T>(staleEntry, "cached");
      }

      throw new UpstreamRateLimitError(
        this.cooldownUntil,
        currentTime
      );
    }

    // Schedule execution so that the in-flight entry is registered first.
    const operation: Promise<CoordinatedResponse<T>> =
      Promise.resolve().then(async () => {
        try {
          const data = await fetcher();
          const fetchedAtMs = this.now();

          const entry: CacheEntry = {
            data,
            fetchedAtMs,
            maxStaleForMs,
          };

          this.cache.delete(key);
          this.cache.set(key, entry);

          this.pruneCache(fetchedAtMs);

          return this.toResponse<T>(entry, "live");
        } catch (error) {
          // Any 429 starts or extends the provider-wide cooldown.
          if (getErrorStatus(error) === 429) {
            const rateLimitTime = this.now();

            const retryAfterMs = parseRetryAfter(
              getRetryAfterHeader(error),
              rateLimitTime,
              this.defaultCooldownMs
            );

            this.cooldownUntil = Math.max(
              this.cooldownUntil,
              rateLimitTime + retryAfterMs
            );
          }

          // Re-check the cache after the failed request.
          const fallbackEntry = this.getUsableCache(
            key,
            maxStaleForMs,
            this.now()
          );

          if (fallbackEntry) {
            return this.toResponse<T>(
              fallbackEntry,
              "cached"
            );
          }

          // No safe previous response exists.
          throw error;
        }
      });

    const trackedOperation =
      operation as Promise<CoordinatedResponse<unknown>>;

    this.inFlight.set(key, trackedOperation);

    try {
      return await operation;
    } finally {
      // Do not accidentally remove a newer operation.
      if (this.inFlight.get(key) === trackedOperation) {
        this.inFlight.delete(key);
      }
    }
  }

  /**
   * Return a cached response only when it is within the permitted stale age.
   */
  private getUsableCache(
    key: string,
    maxStaleForMs: number,
    now: number
  ): CacheEntry | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    const age = Math.max(0, now - entry.fetchedAtMs);

    if (age > maxStaleForMs) {
      this.cache.delete(key);
      return undefined;
    }

    return entry;
  }

  /**
   * Build a response without changing the original fetch timestamp.
   */
  private toResponse<T>(
    entry: CacheEntry,
    source: CoordinatedSource
  ): CoordinatedResponse<T> {
    return {
      data: entry.data as T,
      source,
      fetchedAt: new Date(entry.fetchedAtMs).toISOString(),
    };
  }

  /**
   * Remove expired entries and enforce the maximum cache size.
   */
  private pruneCache(now: number): void {
    for (const [key, entry] of this.cache.entries()) {
      const age = Math.max(0, now - entry.fetchedAtMs);

      if (age > entry.maxStaleForMs) {
        this.cache.delete(key);
      }
    }

    while (this.cache.size > this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;

      if (oldestKey === undefined) {
        break;
      }

      this.cache.delete(oldestKey);
    }
  }
}

/**
 * Preserve one coordinator across Next.js development hot reloads.
 *
 * This is process-local, not distributed between server instances.
 */
type CoinGeckoGlobal = typeof globalThis & {
  __cryptoTrackerCoinGeckoCoordinator?: UpstreamRequestCoordinator;
};

const globalState = globalThis as CoinGeckoGlobal;

export const coinGeckoCoordinator =
  globalState.__cryptoTrackerCoinGeckoCoordinator ??
  (globalState.__cryptoTrackerCoinGeckoCoordinator =
    new UpstreamRequestCoordinator());
