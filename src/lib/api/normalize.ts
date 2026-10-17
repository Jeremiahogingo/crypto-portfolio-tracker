// src/lib/api/normalize.ts
//
// Maps CoinGecko raw responses into our domain types (see @/types/market).
//
// Kept separate from the client so it can be unit-tested without mocking
// fetch, and so that if CoinGecko changes a field name, the fix lands here
// rather than in every route handler.

import type {
  CGGlobal,
  CGMarketCoin,
  CGTrending,
} from "@/types/coingecko";
import type {
  GlobalMarketStats,
  MarketCoin,
  TrendingCoin,
} from "@/types/market";

/**
 * CoinGecko returns `null` for a handful of fields on low-cap coins (e.g.
 * `total_supply`, occasionally `price_change_percentage_24h` for coins
 * with no recent trades). Coerce to 0 so components don't need null guards.
 */
const n = (v: number | null | undefined): number => v ?? 0;

export function normalizeCoin(cg: CGMarketCoin): MarketCoin {
  return {
    id: cg.id,
    symbol: cg.symbol.toUpperCase(),
    name: cg.name,
    logoUrl: cg.image,
    price: n(cg.current_price),
    change24h: n(cg.price_change_percentage_24h),
    marketCap: n(cg.market_cap),
    volume24h: n(cg.total_volume),
    rank: n(cg.market_cap_rank),
    sparkline: cg.sparkline_in_7d?.price,
  };
}

export function normalizeGlobal(cg: CGGlobal): GlobalMarketStats {
  const d = cg.data;
  return {
    totalMarketCap: d.total_market_cap.usd ?? 0,
    totalVolume: d.total_volume.usd ?? 0,
    btcDominance: d.market_cap_percentage.btc ?? 0,
    ethDominance: d.market_cap_percentage.eth ?? 0,
    activeCoins: d.active_cryptocurrencies ?? 0,
    marketCapChange24h: d.market_cap_change_percentage_24h_usd ?? 0,
  };
}

export function normalizeTrending(cg: CGTrending): TrendingCoin[] {
  return cg.coins.map(({ item }) => ({
    id: item.id,
    name: item.name,
    symbol: item.symbol.toUpperCase(),
    logoUrl: item.small || item.thumb || item.large,
    rank: item.market_cap_rank ?? 0,
    price: item.data?.price ?? 0,
    // The 24h percentage is nested by currency — we only want USD.
    change24h: item.data?.price_change_percentage_24h?.usd ?? 0,
  }));
}