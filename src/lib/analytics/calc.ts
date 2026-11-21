// src/lib/analytics/calc.ts
//
// Pure analytics computations. No DB, no HTTP, no React.
//
// Current valuation metrics are separated from ledger-derived metrics.
// Transaction-derived investment and activity remain calculable regardless
// of whether market prices are available.
//
// Fallback prices are indicative only.
// Missing prices are unknown, never implicit zeroes.

import type { Transaction } from "@/db/schema";
import type { HoldingWithPrice } from "@/types/portfolio";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InvestmentPoint {
  month: string;
  cumulative: number;
}

export interface ActivityPoint {
  month: string;
  buys: number;
  sells: number;
}

export interface PerformanceEntry {
  symbol: string;
  coinId: string;
  roiPercent: number;
  pnl: number;
  value: number;
  cost: number;
}

export interface ConcentrationEntry {
  symbol: string;
  value: number;
  percent: number;
}

export interface AnalyticsSummary {
  /** Cumulative BUY value less SELL proceeds, derived from the ledger. */
  totalInvested: number;

  /** Complete verified portfolio value; null when valuation is incomplete. */
  currentValue: number | null;

  /** Value of positions with verified live prices only. */
  knownValue: number;

  /** Indicative value of fallback-priced positions. */
  indicativeValue: number;

  /** Ledger-derived remaining cost basis. */
  totalCost: number;

  /** Null unless all active positions have verified live prices. */
  totalPnl: number | null;

  /** Null when total P&L or its denominator is unavailable. */
  totalPnlPercent: number | null;

  pricedCount: number;
  fallbackCount: number;
  unavailableCount: number;
  totalHoldings: number;
  valuationCoverage: number;
  hasCompleteValuation: boolean;

  bestPerformer: {
    symbol: string;
    roiPercent: number;
  } | null;

  worstPerformer: {
    symbol: string;
    roiPercent: number;
  } | null;
}

/**
 * A holding that has a verified live quote and all derived financial values.
 *
 * This type is intentionally narrower than HoldingWithPrice. It is used
 * only after a runtime check has established that nullable values exist.
 */
type VerifiedHolding = HoldingWithPrice & {
  currentValue: number;
  pnl: number;
  pnlPercent: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2026-10" -> "Oct 26". */
function formatMonthKey(key: string): string {
  const [year, month] = key.split("-");
  const index = Number(month) - 1;

  return `${MONTH_NAMES[index] ?? month} ${year.slice(-2)}`;
}

/** Sortable YYYY-MM key for a date. */
function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * Runtime type guard.
 *
 * IMPORTANT:
 * Use this function directly as the Array.filter callback.
 * That makes TypeScript infer VerifiedHolding[] for all subsequent
 * operations instead of retaining nullable financial fields.
 */
function isVerifiedValuation(
  holding: HoldingWithPrice
): holding is VerifiedHolding {
  return (
    holding.priceStatus === "live" &&
    holding.currentValue !== null &&
    Number.isFinite(holding.currentValue) &&
    holding.pnl !== null &&
    Number.isFinite(holding.pnl) &&
    holding.pnlPercent !== null &&
    Number.isFinite(holding.pnlPercent)
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

export function computeAnalyticsSummary(
  holdings: HoldingWithPrice[],
  transactions: Transaction[]
): AnalyticsSummary {
  // Net investment is based on ledger activity, not market prices.
  const totalInvested = transactions.reduce(
    (sumValue, transaction) => {
      const value = Number(transaction.totalValue);

      if (!Number.isFinite(value)) {
        return sumValue;
      }

      if (transaction.type === "buy") {
        return sumValue + value;
      }

      if (transaction.type === "sell") {
        return sumValue - value;
      }

      // ADJUSTMENT changes a recorded position, not cash invested.
      return sumValue;
    },
    0
  );

  const activeHoldings = holdings.filter(
    (holding) => holding.quantity !== 0
  );

  const liveHoldings = activeHoldings.filter(
    (holding) =>
      holding.priceStatus === "live" &&
      holding.currentValue !== null
  );

  const fallbackHoldings = activeHoldings.filter(
    (holding) =>
      holding.priceStatus === "fallback" &&
      holding.currentValue !== null
  );

  const unavailableHoldings = activeHoldings.filter(
    (holding) =>
      holding.priceStatus === "unavailable" ||
      holding.currentValue === null
  );

  const knownValue = sum(
    liveHoldings.map((holding) => holding.currentValue!)
  );

  const indicativeValue = sum(
    fallbackHoldings.map((holding) => holding.currentValue!)
  );

  const totalCost = sum(
    activeHoldings.map((holding) => holding.costTotal)
  );

  const hasCompleteValuation =
    fallbackHoldings.length === 0 &&
    unavailableHoldings.length === 0;

  // Empty portfolios have a complete zero valuation.
  // Incomplete portfolios must not show a fabricated total.
  const currentValue = hasCompleteValuation
    ? knownValue
    : null;

  const totalPnl =
    currentValue === null
      ? null
      : currentValue - totalCost;

  const totalPnlPercent =
    totalPnl !== null && totalCost > 0
      ? (totalPnl / totalCost) * 100
      : null;

  // The direct type-predicate callback narrows every result to
  // VerifiedHolding, making the sort and result fields non-nullable.
  const performers = activeHoldings
    .filter(isVerifiedValuation)
    .filter((holding) => holding.costTotal > 0)
    .sort((a, b) => b.pnlPercent - a.pnlPercent);

  const pricedCount = liveHoldings.length;
  const fallbackCount = fallbackHoldings.length;
  const unavailableCount = unavailableHoldings.length;
  const totalHoldings = activeHoldings.length;

  const best = performers[0];
  const worst = performers[performers.length - 1];

  return {
    totalInvested,
    currentValue,
    knownValue,
    indicativeValue,
    totalCost,
    totalPnl,
    totalPnlPercent,
    pricedCount,
    fallbackCount,
    unavailableCount,
    totalHoldings,
    valuationCoverage:
      totalHoldings === 0
        ? 100
        : (pricedCount / totalHoldings) * 100,
    hasCompleteValuation,
    bestPerformer: best
      ? {
          symbol: best.symbol,
          roiPercent: best.pnlPercent,
        }
      : null,
    worstPerformer: worst
      ? {
          symbol: worst.symbol,
          roiPercent: worst.pnlPercent,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Investment timeline
// ---------------------------------------------------------------------------

/**
 * Cumulative net invested per month, last 12 months.
 *
 * BUY        -> increase cumulative investment.
 * SELL       -> decrease cumulative investment.
 * ADJUSTMENT -> no effect on cash invested.
 */
export function computeInvestmentTimeline(
  transactions: Transaction[]
): InvestmentPoint[] {
  if (transactions.length === 0) {
    return [];
  }

  const sorted = [...transactions].sort(
    (a, b) =>
      new Date(a.executedAt).getTime() -
      new Date(b.executedAt).getTime()
  );

  const byMonth = new Map<string, number>();
  let cumulative = 0;

  for (const transaction of sorted) {
    if (transaction.type === "adjustment") {
      continue;
    }

    const value = Number(transaction.totalValue);

    if (!Number.isFinite(value)) {
      continue;
    }

    if (transaction.type === "buy") {
      cumulative += value;
    } else {
      cumulative -= value;
    }

    // Last write wins for the month: retain the cumulative value
    // at the end of that month's transactions.
    byMonth.set(
      monthKey(new Date(transaction.executedAt)),
      cumulative
    );
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, value]) => ({
      month: formatMonthKey(key),
      cumulative: value,
    }));
}

// ---------------------------------------------------------------------------
// Monthly activity
// ---------------------------------------------------------------------------

/**
 * BUY and SELL totals per month, last 12 months.
 * ADJUSTMENT events do not create trading activity.
 */
export function computeMonthlyActivity(
  transactions: Transaction[]
): ActivityPoint[] {
  if (transactions.length === 0) {
    return [];
  }

  const byMonth = new Map<
    string,
    { buys: number; sells: number }
  >();

  for (const transaction of transactions) {
    if (transaction.type === "adjustment") {
      continue;
    }

    const value = Number(transaction.totalValue);

    if (!Number.isFinite(value)) {
      continue;
    }

    const key = monthKey(new Date(transaction.executedAt));

    const bucket = byMonth.get(key) ?? {
      buys: 0,
      sells: 0,
    };

    if (transaction.type === "buy") {
      bucket.buys += value;
    } else {
      bucket.sells += value;
    }

    byMonth.set(key, bucket);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, data]) => ({
      month: formatMonthKey(key),
      buys: data.buys,
      sells: data.sells,
    }));
}

// ---------------------------------------------------------------------------
// Asset performance
// ---------------------------------------------------------------------------

/**
 * ROI per current holding, sorted best to worst.
 *
 * Only verified live-priced holdings with positive cost basis are included.
 * Fallback and unavailable positions are excluded.
 *
 * A genuine live zero price remains valid and can correctly represent
 * a 100% loss.
 */
export function computeAssetPerformance(
  holdings: HoldingWithPrice[]
): PerformanceEntry[] {
  return holdings
    .filter(isVerifiedValuation)
    .filter((holding) => holding.costTotal > 0)
    .map((holding) => ({
      symbol: holding.symbol,
      coinId: holding.coinId,
      roiPercent: holding.pnlPercent,
      pnl: holding.pnl,
      value: holding.currentValue,
      cost: holding.costTotal,
    }))
    .sort((a, b) => b.roiPercent - a.roiPercent);
}

// ---------------------------------------------------------------------------
// Concentration
// ---------------------------------------------------------------------------

/**
 * Top N holdings by current value as a percentage of the live-priced subset.
 *
 * It is deliberately not described as the percentage of the entire
 * portfolio if any holding lacks a verified live quote.
 */
export function computeConcentration(
  holdings: HoldingWithPrice[],
  topN = 8
): ConcentrationEntry[] {
  const livePricedHoldings = holdings.filter(
    (holding) =>
      holding.quantity !== 0 &&
      holding.priceStatus === "live" &&
      holding.currentValue !== null &&
      holding.currentValue > 0
  );

  const total = sum(
    livePricedHoldings.map((holding) => holding.currentValue!)
  );

  if (total <= 0) {
    return [];
  }

  return livePricedHoldings
    .sort(
      (a, b) => b.currentValue! - a.currentValue!
    )
    .slice(0, topN)
    .map((holding) => ({
      symbol: holding.symbol,
      value: holding.currentValue!,
      percent: (holding.currentValue! / total) * 100,
    }));
}