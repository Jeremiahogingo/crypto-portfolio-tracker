// src/types/coingecko.ts
//
// Raw response shapes for the CoinGecko API.
//
// These mirror CoinGecko's JSON exactly — snake_case, nullable fields, and
// all. They are intentionally kept separate from our UI-facing domain types
// so that a CoinGecko schema change only ripples through this file and the
// mapping layer, not through every component.
//
// Reference: https://docs.coingecko.com/reference/coins-markets

/**
 * Response item from GET /coins/markets.
 * Only fields we actually consume are declared — the API returns more.
 */
export interface CGMarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;

  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;

  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;

  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;

  ath: number;
  ath_change_percentage: number;
  atl: number;
  atl_change_percentage: number;

  last_updated: string;

  /** Only present when `sparkline=true` is passed to /coins/markets. */
  sparkline_in_7d?: {
    price: number[];
  };
}

/**
 * Response from GET /global.
 * The nested `data` wrapper is CoinGecko's, not ours — we keep the shape
 * as-is so the mapping layer is the single point of translation.
 */
export interface CGGlobal {
  data: {
    active_cryptocurrencies: number;
    markets: number;
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
    updated_at: number;
  };
}

/**
 * Response from GET /search/trending.
 * Trending items are wrapped in `item`, and prices are nested one level
 * deeper still — this is CoinGecko's quirky shape, not ours.
 */
export interface CGTrending {
  coins: Array<{
    item: {
      id: string;
      name: string;
      symbol: string;
      market_cap_rank: number;
      thumb: string;
      small: string;
      large: string;
      slug: string;
      price_btc: number;
      score: number;
      data: {
        price: number;
        price_btc: string;
        price_change_percentage_24h: Record<string, number>;
        market_cap: string;
        total_volume: string;
      };
    };
  }>;
}