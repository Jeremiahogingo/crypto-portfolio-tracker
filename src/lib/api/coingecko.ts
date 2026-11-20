
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
 * Uses Next.js Data Cache with endpoint-specific revalidation.
 */

import "server-only";

import type {
  CGGlobal,
  CGMarketCoin,
  CGTrending,
} from "@/types/coingecko";
import { serverEnv } from "@/lib/env/server";

// --------------------------------------------------
// Configuration
// --------------------------------------------------

const BASE_URL = serverEnv.coinGeckoBaseUrl;
const API_KEY = serverEnv.coinGeckoDemoApiKey;

const REQUEST_TIMEOUT_MS = 10_000;

// --------------------------------------------------
// Error type
// --------------------------------------------------

export class CoinGeckoError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "CoinGeckoError";
  }
}

// --------------------------------------------------
// Fetch configuration
// --------------------------------------------------

interface FetchOptions {
  /** Next.js Data Cache lifetime in seconds. */
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
 * Executes an authenticated, cached GET request against CoinGecko.
 *
 * Every public function uses this wrapper so timeout, authentication,
 * response validation and error handling remain centralized.
 */
async function cgFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
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

  let response: Response;

  try {
    response = await fetch(url.toString(), {
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      next: {
        revalidate,
      },
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
      response.status
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

// --------------------------------------------------
// Public market API
// --------------------------------------------------

export interface GetMarketsParams {
  /** Target fiat or cryptocurrency currency. Defaults to USD. */
  vs_currency?: string;

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
 */
export async function getMarkets(
  params: GetMarketsParams = {}
): Promise<CGMarketCoin[]> {
  return cgFetch<CGMarketCoin[]>("/coins/markets", {
    revalidate: 60,
    params: {
      vs_currency: params.vs_currency ?? "usd",
      order: "market_cap_desc",
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
export async function getGlobal(): Promise<CGGlobal> {
  return cgFetch<CGGlobal>("/global", {
    revalidate: 120,
  });
}

/**
 * GET /search/trending
 */
export async function getTrending(): Promise<CGTrending> {
  return cgFetch<CGTrending>("/search/trending", {
    revalidate: 300,
  });
}
