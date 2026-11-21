// src/lib/api/normalize.ts
//
// Maps CoinGecko raw responses into application domain types.
//
// Price availability is preserved explicitly:
// - number (including 0): provider supplied a valid numeric value
// - null: provider omitted or supplied an invalid value
//
// Never use the general zero-defaulting helper for market prices.

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

/** General numeric fallback for non-price statistics. */
const n = (value: number | null | undefined): number =>
  value ?? 0;

/** Accept finite, non-negative market prices. Preserve a genuine zero. */
function normalizePrice(
  value: number | null | undefined
): number | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return null;
  }

  return value;
}

/** Accept finite positive or negative percentage changes. */
function normalizePercentage(
  value: number | null | undefined
): number | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  return value;
}

export function normalizeCoin(cg: CGMarketCoin): MarketCoin {
  return {
    id: cg.id,
    symbol: cg.symbol.toUpperCase(),
    name: cg.name,
    logoUrl: cg.image,

    // Do not convert missing price information into a false $0 quote.
    price: normalizePrice(cg.current_price),
    change24h: normalizePercentage(
      cg.price_change_percentage_24h
    ),

    marketCap: n(cg.market_cap),
    volume24h: n(cg.total_volume),
    rank: n(cg.market_cap_rank),
    sparkline: cg.sparkline_in_7d?.price,
  };
}

export function normalizeGlobal(
  cg: CGGlobal
): GlobalMarketStats {
  const data = cg.data;

  return {
    totalMarketCap: data.total_market_cap.usd ?? 0,
    totalVolume: data.total_volume.usd ?? 0,
    btcDominance: data.market_cap_percentage.btc ?? 0,
    ethDominance: data.market_cap_percentage.eth ?? 0,
    activeCoins: data.active_cryptocurrencies ?? 0,
    marketCapChange24h:
      data.market_cap_change_percentage_24h_usd ?? 0,
  };
}

export function normalizeTrending(
  cg: CGTrending
): TrendingCoin[] {
  return cg.coins.map(({ item }) => ({
    id: item.id,
    name: item.name,
    symbol: item.symbol.toUpperCase(),
    logoUrl: item.small || item.thumb || item.large,
    rank: item.market_cap_rank ?? 0,
    price: item.data?.price ?? 0,
    change24h:
      item.data?.price_change_percentage_24h?.usd ?? 0,
  }));
}