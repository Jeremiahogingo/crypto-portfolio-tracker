// src/types/coingecko.ts
//
// Raw response shapes for the CoinGecko API.
//
// These mirror CoinGecko's JSON and remain separate from the
// application-facing domain types.

export interface CGMarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;

  current_price: number | null;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;

  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number | null;

  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;

  ath: number;
  ath_change_percentage: number;
  atl: number;
  atl_change_percentage: number;

  last_updated: string;

  sparkline_in_7d?: {
    price: number[];
  };
}

type CGNumericRecord = Record<
  string,
  number | null | undefined
>;

export interface CGGlobal {
  data: {
    active_cryptocurrencies?: number | null;
    markets?: number | null;
    total_market_cap?: CGNumericRecord;
    total_volume?: CGNumericRecord;
    market_cap_percentage?: CGNumericRecord;
    market_cap_change_percentage_24h_usd?: number | null;
    updated_at?: number;
  };
}

export interface CGTrending {
  coins: Array<{
    item: {
      id: string;
      name: string;
      symbol: string;
      market_cap_rank: number | null;
      thumb: string;
      small: string;
      large: string;
      slug: string;
      price_btc: number;
      score: number;

      data?: {
        price?: number | null;
        price_btc?: string;
        price_change_percentage_24h?: CGNumericRecord;
        market_cap?: string;
        total_volume?: string;
      } | null;
    };
  }>;
}