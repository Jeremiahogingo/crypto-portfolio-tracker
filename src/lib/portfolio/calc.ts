// src/lib/portfolio/calc.ts
//
// Pure portfolio math. No DB, no API — takes raw rows + market prices,
// returns display-ready structures.
//
// Keeping calculations pure has three benefits:
//   1. Unit-testable without mocking anything.
//   2. Reusable on the server (initial render) and client (after hydration).
//   3. Single source of truth for P&L semantics — if the definition of
//      "cost basis" ever changes, it changes here, not in five components.

import type { Holding } from "@/db/schema";
import type {
  AllocationSlice,
  HoldingWithPrice,
  PortfolioSummary,
} from "@/types/portfolio";

interface MarketSnapshot {
  price: number;
  change24h: number;
}

/**
 * Merge a Drizzle holding row with its live market data.
 *
 * Returns 0s for current price/value if the coin isn't in the market
 * snapshot — happens if CoinGecko is unreachable or the coin was delisted.
 * The holding still renders so the user can see/edit it; only P&L is 0.
 */
export function enrichHolding(
  holding: Holding,
  market: MarketSnapshot | undefined
): HoldingWithPrice {
  const quantity = Number(holding.quantity);
  const costBasis = Number(holding.costBasis);

  const currentPrice = market?.price ?? 0;
  const change24h = market?.change24h ?? 0;

  const currentValue = quantity * currentPrice;
  const costTotal = quantity * costBasis;
  const pnl = currentValue - costTotal;
  // Guard against division by zero — a holding with cost basis 0 is
  // possible (airdrops) and the percentage is meaningless for those.
  const pnlPercent = costTotal > 0 ? (pnl / costTotal) * 100 : 0;

  return {
    id: holding.id,
    portfolioId: holding.portfolioId,
    coinId: holding.coinId,
    symbol: holding.symbol,
    quantity,
    costBasis,
    currentPrice,
    change24h,
    currentValue,
    costTotal,
    pnl,
    pnlPercent,
    createdAt: holding.createdAt,
    updatedAt: holding.updatedAt,
  };
}

/**
 * Aggregate enriched holdings into portfolio-level stats.
 *
 * 24h change calculation:
 *   currentValue = qty × price_now
 *   valueYesterday = qty × (price_now / (1 + change24h/100))
 *   change24hValue = currentValue - valueYesterday
 *
 * This weights by current holdings, so a large position moving 0.5% matters
 * more than a small one moving 5% — the "portfolio impact" number investors
 * actually want, not a naive average of percentage changes.
 */
export function summarizePortfolio(
  holdings: HoldingWithPrice[]
): PortfolioSummary {
  let totalValue = 0;
  let totalCost = 0;
  let valueYesterday = 0;

  for (const h of holdings) {
    totalValue += h.currentValue;
    totalCost += h.costTotal;
    // Reconstruct yesterday's value. Guard against -100% (impossible in
    // practice, but prevents NaN propagation through the summary).
    const denominator = 1 + h.change24h / 100;
    if (denominator > 0) {
      valueYesterday += h.currentValue / denominator;
    } else {
      valueYesterday += h.currentValue;
    }
  }

  const totalPnl = totalValue - totalCost;
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const change24hValue = totalValue - valueYesterday;
  const change24hPercent =
    valueYesterday > 0 ? (change24hValue / valueYesterday) * 100 : 0;

  return {
    totalValue,
    totalCost,
    totalPnl,
    totalPnlPercent,
    change24hValue,
    change24hPercent,
    assetCount: holdings.length,
  };
}

/**
 * Compute allocation slices sorted by value descending. Coins with zero
 * current value are dropped — a delisted coin shouldn't show up as 0% of
 * the pie, it just inflates the legend with noise.
 */
export function computeAllocation(
  holdings: HoldingWithPrice[]
): AllocationSlice[] {
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  if (totalValue <= 0) return [];

  return holdings
    .filter((h) => h.currentValue > 0)
    .map((h) => ({
      coinId: h.coinId,
      symbol: h.symbol,
      value: h.currentValue,
      percent: (h.currentValue / totalValue) * 100,
    }))
    .sort((a, b) => b.value - a.value);
}