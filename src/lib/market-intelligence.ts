// src/lib/market-intelligence.ts
//
// Shared selectors for market intelligence widgets.
//
// All ranking selectors use the same market universe and eligibility rules:
// - Assets ranked 1 through 100 by market capitalization.
// - Market capitalization strictly greater than $10 million.
// - A valid, finite 24-hour percentage change.
//
// Missing percentage changes are excluded. Zero change is not a gainer
// or loser, and does not count as meaningful movement.

import type { MarketCoin } from "@/types/market";

export const MARKET_INTELLIGENCE_LIMIT = 100;
export const MARKET_INTELLIGENCE_TOP_N = 4;
export const MARKET_INTELLIGENCE_MIN_MARKET_CAP = 10_000_000;

export type CoinWithMarketChange = MarketCoin & {
  change24h: number;
};

function isEligibleCoin(
  coin: MarketCoin,
): coin is CoinWithMarketChange {
  return (
    coin.change24h !== null &&
    Number.isFinite(coin.change24h) &&
    Number.isInteger(coin.rank) &&
    coin.rank >= 1 &&
    coin.rank <= MARKET_INTELLIGENCE_LIMIT &&
    Number.isFinite(coin.marketCap) &&
    coin.marketCap > MARKET_INTELLIGENCE_MIN_MARKET_CAP
  );
}

function getEligibleCoins(
  coins: MarketCoin[],
): CoinWithMarketChange[] {
  return coins.filter(isEligibleCoin);
}

/**
 * Deterministic tie-breaking keeps displayed rankings stable when two
 * assets have the same percentage movement.
 */
function compareMarketCapThenId(
  a: CoinWithMarketChange,
  b: CoinWithMarketChange,
): number {
  return (
    b.marketCap - a.marketCap ||
    a.id.localeCompare(b.id)
  );
}

function takeTop<T>(items: T[], limit: number): T[] {
  if (!Number.isFinite(limit) || limit <= 0) {
    return [];
  }

  return items.slice(0, Math.floor(limit));
}

/** Largest positive 24-hour percentage changes. */
export function getTopGainers(
  coins: MarketCoin[],
  limit = MARKET_INTELLIGENCE_TOP_N,
): CoinWithMarketChange[] {
  const gainers = getEligibleCoins(coins)
    .filter((coin) => coin.change24h > 0)
    .sort(
      (a, b) =>
        b.change24h - a.change24h ||
        compareMarketCapThenId(a, b),
    );

  return takeTop(gainers, limit);
}

/** Largest negative 24-hour percentage changes. */
export function getTopLosers(
  coins: MarketCoin[],
  limit = MARKET_INTELLIGENCE_TOP_N,
): CoinWithMarketChange[] {
  const losers = getEligibleCoins(coins)
    .filter((coin) => coin.change24h < 0)
    .sort(
      (a, b) =>
        a.change24h - b.change24h ||
        compareMarketCapThenId(a, b),
    );

  return takeTop(losers, limit);
}

/** Largest absolute 24-hour percentage changes in either direction. */
export function getTopMovers(
  coins: MarketCoin[],
  limit = MARKET_INTELLIGENCE_TOP_N,
): CoinWithMarketChange[] {
  const movers = getEligibleCoins(coins)
    .filter((coin) => coin.change24h !== 0)
    .sort(
      (a, b) =>
        Math.abs(b.change24h) - Math.abs(a.change24h) ||
        compareMarketCapThenId(a, b),
    );

  return takeTop(movers, limit);
}