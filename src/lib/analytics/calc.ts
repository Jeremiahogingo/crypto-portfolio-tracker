// src/lib/analytics/calc.ts
//
// Pure analytics computations. No DB, no HTTP, no React.
//
// Each function takes rows already in memory and returns chart-ready data.
// This mirrors src/lib/portfolio/calc.ts — same philosophy: if a business
// rule lives in one place, one test, and one definition, it can't drift
// between dashboard, analytics, and portfolio views.
//
// ─── Honesty constraint ──────────────────────────────────────────────────
// Everything in this file is computable from (holdings + transactions +
// live prices). We deliberately do NOT compute "historical portfolio value"
// or "daily profit" — those require snapshots we don't store. See the
// Phase 5 plan for the historical-snapshot infrastructure.
//
// ─── Windowing ───────────────────────────────────────────────────────────
// Timeline and activity charts cap at the last 12 months. Users with
// 5-year histories would otherwise get 60-bar charts that are unreadable.
// The cap is a display decision, not a data decision — the full ledger
// still exists in the transactions table.

import type { Transaction } from "@/db/schema";
import type { HoldingWithPrice } from "@/types/portfolio";

// ─── Types ───────────────────────────────────────────────────────────────

export interface InvestmentPoint {
  /** Short label like "Oct 26". */
  month: string;
  /** Cumulative net invested through the end of this month, in USD. */
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
  /**
   * Cumulative USD spent on buys minus USD received from sells.
   * Can be negative (user has realized more than they've put in) — that's
   * a correct and informative value, not a bug.
   */
  totalInvested: number;
  currentValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  bestPerformer: { symbol: string; roiPercent: number } | null;
  worstPerformer: { symbol: string; roiPercent: number } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * "2026-10" → "Oct 26".
 * Year suffix disambiguates across multi-year timelines without making
 * labels long enough to overlap on the x-axis.
 */
function formatMonthKey(key: string): string {
  const [year, month] = key.split("-");
  const idx = Number(month) - 1;
  return `${MONTH_NAMES[idx] ?? month} ${year.slice(-2)}`;
}

/** Sortable YYYY-MM key for a date — used to bucket by month. */
function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Summary ─────────────────────────────────────────────────────────────

export function computeAnalyticsSummary(
  holdings: HoldingWithPrice[],
  transactions: Transaction[]
): AnalyticsSummary {
  const totalInvested = transactions.reduce((sum, tx) => {
    const value = Number(tx.totalValue);
    return tx.type === "buy" ? sum + value : sum - value;
  }, 0);

  const currentValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalCost = holdings.reduce((s, h) => s + h.costTotal, 0);
  const totalPnl = currentValue - totalCost;
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  // Best/worst performer only considers positions where P&L is meaningful —
  // airdropped coins with costBasis 0 have undefined ROI and would sort as
  // infinite; a delisted coin with currentValue 0 has -100% ROI which
  // dominates the "worst" slot misleadingly.
  const performers = holdings
    .filter((h) => h.costTotal > 0 && h.currentValue > 0)
    .sort((a, b) => b.pnlPercent - a.pnlPercent);

  return {
    totalInvested,
    currentValue,
    totalPnl,
    totalPnlPercent,
    bestPerformer: performers[0]
      ? { symbol: performers[0].symbol, roiPercent: performers[0].pnlPercent }
      : null,
    worstPerformer: performers[performers.length - 1]
      ? {
          symbol: performers[performers.length - 1].symbol,
          roiPercent: performers[performers.length - 1].pnlPercent,
        }
      : null,
  };
}

// ─── Investment Timeline ─────────────────────────────────────────────────

/**
 * Cumulative net invested per month, last 12 months.
 *
 * Walk transactions in chronological order, maintaining a running total:
 *   buy  → running += totalValue
 *   sell → running -= totalValue
 *
 * The result is the classic "how much have I put into crypto" line. It
 * answers a different question than "how much is my portfolio worth" —
 * users often want both, and we only have data for the first.
 */
export function computeInvestmentTimeline(
  transactions: Transaction[]
): InvestmentPoint[] {
  if (transactions.length === 0) return [];

  const sorted = [...transactions].sort(
    (a, b) =>
      new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime()
  );

  const byMonth = new Map<string, number>();
  let cumulative = 0;

  for (const tx of sorted) {
    const value = Number(tx.totalValue);
    cumulative += tx.type === "buy" ? value : -value;
    // Last write wins for the month — we want the cumulative at the END of
    // the month, not at the first transaction in it.
    byMonth.set(monthKey(new Date(tx.executedAt)), cumulative);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, val]) => ({
      month: formatMonthKey(key),
      cumulative: val,
    }));
}

// ─── Monthly Activity ────────────────────────────────────────────────────

/**
 * Buy and sell totals per month, last 12 months.
 *
 * Distinct from the timeline: activity shows *pace* (am I trading more this
 * month?), timeline shows *position* (am I net in or out?). Users care
 * about both.
 */
export function computeMonthlyActivity(
  transactions: Transaction[]
): ActivityPoint[] {
  if (transactions.length === 0) return [];

  const byMonth = new Map<string, { buys: number; sells: number }>();

  for (const tx of transactions) {
    const key = monthKey(new Date(tx.executedAt));
    const bucket = byMonth.get(key) ?? { buys: 0, sells: 0 };
    const value = Number(tx.totalValue);
    if (tx.type === "buy") bucket.buys += value;
    else bucket.sells += value;
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

// ─── Asset Performance ───────────────────────────────────────────────────

/**
 * ROI per current holding, sorted best to worst.
 *
 * Filters out positions where ROI is undefined or misleading:
 *   • costTotal = 0  (airdrops)    → ROI is infinite, exclude
 *   • currentValue = 0 (delisted)  → ROI is -100%, exclude to avoid
 *                                    dominating "worst performer"
 */
export function computeAssetPerformance(
  holdings: HoldingWithPrice[]
): PerformanceEntry[] {
  return holdings
    .filter((h) => h.costTotal > 0 && h.currentValue > 0)
    .map((h) => ({
      symbol: h.symbol,
      coinId: h.coinId,
      roiPercent: h.pnlPercent,
      pnl: h.pnl,
      value: h.currentValue,
      cost: h.costTotal,
    }))
    .sort((a, b) => b.roiPercent - a.roiPercent);
}

// ─── Concentration ───────────────────────────────────────────────────────

/**
 * Top N holdings by current value, as percentage of portfolio.
 *
 * This is the honest replacement for the old "Risk Distribution" chart.
 * Over-concentration in one coin is the primary risk a retail portfolio
 * faces — this chart shows it directly. A "risk" classification (low/
 * medium/high) would be subjective; concentration is objective.
 *
 * Sorted descending so the largest positions dominate the chart visually
 * (which is the point — they represent the biggest risk).
 */
export function computeConcentration(
  holdings: HoldingWithPrice[],
  topN = 8
): ConcentrationEntry[] {
  const total = holdings.reduce((s, h) => s + h.currentValue, 0);
  if (total <= 0) return [];

  return holdings
    .filter((h) => h.currentValue > 0)
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, topN)
    .map((h) => ({
      symbol: h.symbol,
      value: h.currentValue,
      percent: (h.currentValue / total) * 100,
    }));
}