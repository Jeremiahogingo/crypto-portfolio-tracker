// src/lib/api/normalize.ts
//
// Maps CoinGecko raw responses into application domain types.
//
// Price/data availability is preserved explicitly:
// - finite number: valid provider-supplied numeric value
// - null: missing or invalid provider value
//
// Never default missing market values to zero.

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

function normalizeNonNegativeNumber(
  value: number | null | undefined,
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
  value: number | null | undefined,
): number | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  return value;
}

function nonNegativeOrZero(
  value: number | null | undefined,
): number {
  return normalizeNonNegativeNumber(value) ?? 0;
}

export function normalizeCoin(cg: CGMarketCoin): MarketCoin {
  return {
    id: cg.id,
    symbol: cg.symbol.toUpperCase(),
    name: cg.name,
    logoUrl: cg.image,

    price: normalizeNonNegativeNumber(cg.current_price),
    change24h: normalizePercentage(
      cg.price_change_percentage_24h,
    ),

    marketCap: nonNegativeOrZero(cg.market_cap),
    volume24h: nonNegativeOrZero(cg.total_volume),
    rank: nonNegativeOrZero(cg.market_cap_rank),
    sparkline: cg.sparkline_in_7d?.price,
  };
}

export function normalizeGlobal(
  cg: CGGlobal,
): GlobalMarketStats {
  const data = cg.data;

  return {
    totalMarketCap: normalizeNonNegativeNumber(
      data.total_market_cap?.usd,
    ),

    totalVolume: normalizeNonNegativeNumber(
      data.total_volume?.usd,
    ),

    btcDominance: normalizeNonNegativeNumber(
      data.market_cap_percentage?.btc,
    ),

    ethDominance: normalizeNonNegativeNumber(
      data.market_cap_percentage?.eth,
    ),

    activeCoins: normalizeNonNegativeNumber(
      data.active_cryptocurrencies,
    ),

    marketCapChange24h: normalizePercentage(
      data.market_cap_change_percentage_24h_usd,
    ),
  };
}

export function normalizeTrending(
  cg: CGTrending,
): TrendingCoin[] {
  return cg.coins.map(({ item }) => ({
    id: item.id,
    name: item.name,
    symbol: item.symbol.toUpperCase(),

    logoUrl: item.small || item.thumb || item.large,

    rank: nonNegativeOrZero(item.market_cap_rank),

    price: normalizeNonNegativeNumber(
      item.data?.price,
    ),

    change24h: normalizePercentage(
      item.data?.price_change_percentage_24h?.usd,
    ),
  }));
}