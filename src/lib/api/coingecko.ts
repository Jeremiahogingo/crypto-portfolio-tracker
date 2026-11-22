/**
 * src/lib/api/coingecko.ts
 *
 * Server-side CoinGecko API client.
 *
 * Security:
 * - Server-only module.
 * - API credentials remain in server-side request headers.
 * - Every upstream request has a bounded timeout.
 * - HTTP and malformed JSON responses become typed errors.
 *
 * Caching:
 * - Uses the shared UpstreamRequestCoordinator.
 * - Freshness remains endpoint-specific.
 * - Successful responses can be reused for up to 15 minutes when
 *   CoinGecko is unavailable or rate-limiting the application.
 */

import "server-only";

import type {
  CGGlobal,
  CGMarketCoin,
  CGTrending,
} from "@/types/coingecko";

import type { MarketOrder } from "@/types/market";
import { serverEnv } from "@/lib/env/server";
import { coinGeckoCoordinator } from "@/lib/api/upstream-coordinator";

// --------------------------------------------------
// Configuration
// --------------------------------------------------

const BASE_URL = serverEnv.coinGeckoBaseUrl;
const API_KEY = serverEnv.coinGeckoDemoApiKey;

const REQUEST_TIMEOUT_MS = 10_000;

// Maximum age for serving a previous successful response.
const MAX_STALE_MS = 15 * 60 * 1_000;

// --------------------------------------------------
// Error type
// --------------------------------------------------

export class CoinGeckoError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly retryAfter?: string | null
  ) {
    super(message);
    this.name = "CoinGeckoError";
  }
}

// --------------------------------------------------
// Fetch configuration
// --------------------------------------------------

interface FetchOptions {
  /** Successful-response freshness duration in seconds. */
  revalidate?: number;

  /** Optional upstream query parameters. */
  params?: Record<
    string,
    string | number | boolean | undefined
  >;
}

// --------------------------------------------------
// Internal fetch wrapper
// --------------------------------------------------

/**
 * Executes an authenticated GET request against CoinGecko.
 *
 * The shared coordinator controls caching, concurrent request deduplication
 * and rate-limit cooldown. This wrapper handles authentication, timeout,
 * response validation and error conversion.
 */
async function cgFetch<T>(
  path: string,
  options: FetchOptions = {}
) {
  const {
    revalidate = 60,
    params,
  } = options;

  const url = new URL(`${BASE_URL}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    accept: "application/json",
  };

  if (API_KEY) {
    headers["x-cg-demo-api-key"] = API_KEY;
  }

  // Include endpoint and query parameters in the key.
  // API credentials are never included in the cache key.
  const cacheKey = url.toString();

  return coinGeckoCoordinator.request<T>(
    cacheKey,
    revalidate * 1_000,
    MAX_STALE_MS,
    async () => {
      let response: Response;

      try {
        response = await fetch(url.toString(), {
          headers,
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),

          // The application-level coordinator owns caching.
          cache: "no-store",
        });
      } catch (cause) {
        const timedOut =
          cause instanceof Error &&
          (
            cause.name === "TimeoutError" ||
            cause.name === "AbortError"
          );

        if (timedOut) {
          throw new CoinGeckoError(
            "CoinGecko request timed out",
            504
          );
        }

        throw new CoinGeckoError(
          "Network error contacting CoinGecko"
        );
      }

      if (!response.ok) {
        throw new CoinGeckoError(
          `CoinGecko responded with HTTP ${response.status}`,
          response.status,
          response.headers.get("retry-after")
        );
      }

      try {
        return (await response.json()) as T;
      } catch {
        throw new CoinGeckoError(
          "CoinGecko returned an invalid JSON response",
          502
        );
      }
    }
  );
}

// --------------------------------------------------
// Public market API
// --------------------------------------------------

export interface GetMarketsParams {
  /** Target fiat or cryptocurrency currency. Defaults to USD. */
  vs_currency?: string;

  /** Server-side market sorting. */
  order?: MarketOrder;

  /** Number of coins per page (maximum 250). */
  per_page?: number;

  /** One-indexed page number. */
  page?: number;

  /** Optional list of CoinGecko coin IDs. */
  ids?: string[];

  /** Include seven-day sparkline data. */
  sparkline?: boolean;
}

/**
 * GET /coins/markets
 *
 * Used by Markets, Watchlist and Portfolio pages.
 *
 * Supported ordering and query parameters are validated by the application
 * API route before this function is called.
 */
export async function getMarkets(
  params: GetMarketsParams = {}
) {
  return cgFetch<CGMarketCoin[]>("/coins/markets", {
    revalidate: 60,

    params: {
      vs_currency: params.vs_currency ?? "usd",
      order: params.order ?? "market_cap_desc",
      per_page: params.per_page ?? 100,
      page: params.page ?? 1,
      sparkline: params.sparkline ?? false,
      price_change_percentage: "24h",
      ids: params.ids?.join(","),
    },
  });
}

/**
 * GET /global
 */
export async function getGlobal() {
  return cgFetch<CGGlobal>("/global", {
    revalidate: 120,
  });
}

/**
 * GET /search/trending
 */
export async function getTrending() {
  return cgFetch<CGTrending>("/search/trending", {
    revalidate: 300,
  });
}