// src/lib/api/coingecko.ts
//
// Server-side CoinGecko API client.
//
// ─── Why this file exists ───────────────────────────────────────────────
// Calling CoinGecko directly from the browser would expose our Demo API key
// in the client bundle. Instead, every request flows through this module on
// the server, either from a Route Handler or a Server Component.
//
// ─── Caching strategy ───────────────────────────────────────────────────
// We rely on Next.js's built-in fetch cache via `next: { revalidate }`.
// Each endpoint declares its own revalidation window based on how volatile
// its data is:
//   • prices   → 60s    (feels live, stays under rate limits)
//   • global   → 120s   (aggregate stats move slowly)
//   • trending → 300s   (rankings shift over hours, not minutes)
//
// ─── Rate limits ────────────────────────────────────────────────────────
// CoinGecko Demo tier: ~30 calls/min keyless, 30 calls/min with a Demo key.
// Fetch caching plus React Query's staleTime keep us comfortably under that.
// A 429 raises `CoinGeckoError` with status 429 so callers can fall back.

import type { CGGlobal, CGMarketCoin, CGTrending } from "@/types/coingecko";

// ─── Configuration ───────────────────────────────────────────────────────

const BASE_URL =
  process.env.COINGECKO_BASE_URL ?? "https://api.coingecko.com/api/v3";

const API_KEY = process.env.COINGECKO_DEMO_API_KEY;

// ─── Error type ──────────────────────────────────────────────────────────

/**
 * Thrown by every failure path in this module so callers can distinguish
 * CoinGecko problems from generic network errors.
 */
export class CoinGeckoError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "CoinGeckoError";
  }
}

// ─── Internal fetch wrapper ──────────────────────────────────────────────

interface FetchOptions {
  /** Cache lifetime in seconds. Passed to Next's fetch revalidation. */
  revalidate?: number;
  /** Query string parameters. `undefined` and empty-string values are skipped. */
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Executes a GET request against CoinGecko with caching, auth, and typed
 * errors. Every public function in this file funnels through here so that
 * retry logic, header injection, and error semantics live in one place.
 */
async function cgFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { revalidate = 60, params } = options;

  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = { accept: "application/json" };
  // The Demo key is optional. Without it, CoinGecko serves the shared
  // keyless pool, which is fine for development and low-traffic deployments.
  if (API_KEY) {
    headers["x-cg-demo-api-key"] = API_KEY;
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers,
      next: { revalidate },
    });
  } catch (cause) {
    // Network-level failure (DNS, TLS, offline). Wrap for consistent handling.
    throw new CoinGeckoError(
      `Network error contacting CoinGecko: ${(cause as Error).message}`
    );
  }

  if (!res.ok) {
    throw new CoinGeckoError(
      `CoinGecko responded ${res.status} ${res.statusText} for ${path}`,
      res.status
    );
  }

  return (await res.json()) as T;
}

// ─── Public API ──────────────────────────────────────────────────────────

export interface GetMarketsParams {
  /** Target fiat or crypto currency. Defaults to "usd". */
  vs_currency?: string;
  /** Number of coins to return per page (max 250). Defaults to 100. */
  per_page?: number;
  /** 1-indexed page number. Defaults to 1. */
  page?: number;
  /** Restrict results to these CoinGecko IDs, e.g. ["bitcoin", "ethereum"]. */
  ids?: string[];
  /** Include 7-day price arrays for sparkline rendering. Defaults to false. */
  sparkline?: boolean;
}

/**
 * GET /coins/markets
 *
 * The workhorse endpoint for Markets, Watchlist, and Portfolio pages.
 * Returns current price, 24h change, market cap, and volume for the
 * requested coins, ordered by market cap descending.
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
      // CoinGecko expects a comma-separated string, not an array.
      ids: params.ids?.join(","),
    },
  });
}

/**
 * GET /global
 *
 * Aggregate market data: total market cap, 24h volume, BTC/ETH dominance,
 * and active cryptocurrency count. Feeds the Markets overview cards.
 */
export async function getGlobal(): Promise<CGGlobal> {
  return cgFetch<CGGlobal>("/global", { revalidate: 120 });
}

/**
 * GET /search/trending
 *
 * The 7 coins with the highest search volume over the past 24 hours.
 * Feeds the Trending rail on the Markets page.
 */
export async function getTrending(): Promise<CGTrending> {
  return cgFetch<CGTrending>("/search/trending", { revalidate: 300 });
}