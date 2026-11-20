// src/types/market.ts
//
// Domain types exposed to the client.
//
// CoinGecko-specific response shapes remain inside the server-side API
// adapter. These normalized types are shared by the API and UI.
//
// Important financial rule:
// A missing market quote is represented by null, not zero.
// A provider-supplied numeric zero remains a valid price.

export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  logoUrl: string;

  /** Null means CoinGecko did not provide a valid price. */
  price: number | null;

  /** Null means the 24-hour percentage change is unavailable. */
  change24h: number | null;

  marketCap: number;
  volume24h: number;
  rank: number;

  /** Seven-day price array (168 hourly points), when requested. */
  sparkline?: number[];
}

/** Aggregate market statistics shown in the Markets overview. */
export interface GlobalMarketStats {
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  ethDominance: number;
  activeCoins: number;
  marketCapChange24h: number;
}

/**
 * A coin in the Trending rail.
 *
 * This is distinct from MarketCoin because the trending endpoint returns
 * a smaller response shape. Its existing numeric price contract is retained.
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

/** Envelope returned by the /api/crypto/* routes. */
export interface ApiResponse<T> {
  data: T;
  meta: {
    source: "live" | "fallback";
    fetchedAt: string;
    count: number;
  };
}