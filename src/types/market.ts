// src/types/market.ts
//
// Domain types exposed to the client.
//
// These are the ONLY types UI components should import for crypto data.
// The CoinGecko-specific shapes in @/types/coingecko are internal to the
// server-side API client and should never leak into client code.
//
// Field naming follows camelCase because that's what the React components
// expect. All numeric fields are non-nullable — the normalizer fills in
// sensible defaults (usually 0) for the rare cases where CoinGecko returns
// null, so downstream code doesn't need null checks.

/**
 * A single coin as shown on Markets, Watchlist, and Portfolio tables.
 */
export interface MarketCoin {
  id: string;                 // CoinGecko slug, e.g. "bitcoin"
  symbol: string;             // Uppercase ticker, e.g. "BTC"
  name: string;               // Display name, e.g. "Bitcoin"

  /**
   * Logo image URL from CoinGecko's CDN.
   * In fallback data this may be a single emoji character instead of a URL —
   * renderers should check `logoUrl.startsWith("http")` to decide whether
   * to emit an <img> or a text node.
   */
  logoUrl: string;

  price: number;
  change24h: number;          // percentage, e.g. -2.4
  marketCap: number;
  volume24h: number;
  rank: number;               // market_cap_rank

  /** 7-day price array (168 hourly points). Only present if requested. */
  sparkline?: number[];
}

/**
 * Aggregate market statistics shown in the Markets overview cards.
 */
export interface GlobalMarketStats {
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;        // percentage, e.g. 52.3
  ethDominance: number;
  activeCoins: number;
  marketCapChange24h: number;  // percentage
}

/**
 * A coin in the Trending rail. Distinct from MarketCoin because CoinGecko's
 * /search/trending endpoint returns a different, smaller shape.
 */
export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  logoUrl: string;
  rank: number;
  price: number;
  change24h: number;
}

/**
 * Envelope returned by every /api/crypto/* route.
 *
 * `meta.source` tells the UI whether the response came from CoinGecko or
 * from the local fallback mock. This is used for two purposes:
 *   1. Dev observability — you can tell instantly when CoinGecko is down.
 *   2. Future UX — a subtle "showing cached data" indicator.
 */
export interface ApiResponse<T> {
  data: T;
  meta: {
    source: "live" | "fallback";
    fetchedAt: string;   // ISO timestamp
    count: number;       // number of items in `data` (or 1 for singletons)
  };
}