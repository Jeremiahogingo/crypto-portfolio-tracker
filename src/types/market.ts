// src/types/market.ts
//
// Domain types exposed to the client.
//
// CoinGecko-specific response shapes remain inside the server-side API
// adapter. These normalized types are shared by the API and UI.
//
// Financial/data integrity:
// - Missing prices and percentage changes remain null.
// - Provider-supplied numeric zero is a valid value.
// - Static fallback data is not represented as live data.

export const MARKET_ORDER_OPTIONS = [
  "market_cap_desc",
  "market_cap_asc",
  "volume_desc",
  "volume_asc",
  "id_asc",
  "id_desc",
] as const;

export type MarketOrder = (typeof MARKET_ORDER_OPTIONS)[number];

export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  logoUrl: string;

  price: number | null;
  change24h: number | null;

  marketCap: number;
  volume24h: number;
  rank: number;

  sparkline?: number[];
}

/** Aggregate market statistics shown in the Markets overview. */
export interface GlobalMarketStats {
  totalMarketCap: number | null;
  totalVolume: number | null;
  btcDominance: number | null;
  ethDominance: number | null;
  activeCoins: number | null;
  marketCapChange24h: number | null;
}

/**
 * A coin in the Trending rail.
 *
 * Trending responses can omit price and percentage data.
 * Preserve that absence rather than manufacturing zero values.
 */
export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  logoUrl: string;
  rank: number;
  price: number | null;
  change24h: number | null;
}

/** Envelope returned by the /api/crypto/* routes. */
export interface ApiResponse<T> {
  data: T;
  meta: {
    source: "live" | "fallback";
    fetchedAt: string;
    count: number;
  };
}