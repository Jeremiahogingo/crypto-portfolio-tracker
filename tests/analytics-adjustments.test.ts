import test from "node:test";
import assert from "node:assert/strict";

import type { Transaction } from "../src/db/schema";
import type { HoldingWithPrice } from "../src/types/portfolio";

import {
  computeAnalyticsSummary,
  computeAssetPerformance,
  computeConcentration,
  computeInvestmentTimeline,
  computeMonthlyActivity,
} from "../src/lib/analytics/calc";

function makeTransaction(
  id: string,
  type: Transaction["type"],
  totalValue: string,
  executedAt: string
): Transaction {
  return {
    id,
    ledgerSequence: Number(id),
    portfolioId: "00000000-0000-4000-8000-000000000001",
    userId: "00000000-0000-4000-8000-000000000002",
    coinId: "bitcoin",
    symbol: "BTC",
    type,
    quantity: "1",
    pricePerUnit: totalValue,
    totalValue,
    executedAt: new Date(executedAt),
    notes: type === "adjustment" ? "Manual position correction" : null,
  };
}

function makeHolding(
  overrides: Partial<HoldingWithPrice> = {}
): HoldingWithPrice {
  const base: HoldingWithPrice = {
    id: "holding-1",
    portfolioId: "00000000-0000-4000-8000-000000000001",
    coinId: "bitcoin",
    symbol: "BTC",
    quantity: 1,
    costBasis: 100,
    createdAt: new Date("2026-10-01T00:00:00.000Z"),
    updatedAt: new Date("2026-10-01T00:00:00.000Z"),

    currentPrice: 120,
    change24h: 2,
    currentValue: 120,
    costTotal: 100,
    pnl: 20,
    pnlPercent: 20,
    priceStatus: "live",
  };

  return {
    ...base,
    ...overrides,
  };
}

const buy = makeTransaction(
  "1",
  "buy",
  "100",
  "2026-10-15T12:00:00.000Z"
);

const adjustment = makeTransaction(
  "2",
  "adjustment",
  "500",
  "2026-11-15T12:00:00.000Z"
);

const sell = makeTransaction(
  "3",
  "sell",
  "25",
  "2026-12-15T12:00:00.000Z"
);

// ---------------------------------------------------------------------------
// Ledger-derived analytics
// ---------------------------------------------------------------------------

test("adjustments do not change net investment", () => {
  const summary = computeAnalyticsSummary(
    [],
    [buy, adjustment, sell]
  );

  assert.equal(summary.totalInvested, 75);
});

test("adjustment-only months do not appear in investment timeline", () => {
  const timeline = computeInvestmentTimeline([
    buy,
    adjustment,
    sell,
  ]);

  assert.deepEqual(timeline, [
    { month: "Oct 26", cumulative: 100 },
    { month: "Dec 26", cumulative: 75 },
  ]);
});

test("monthly trading activity excludes adjustment values", () => {
  const activity = computeMonthlyActivity([
    buy,
    adjustment,
    sell,
  ]);

  assert.deepEqual(activity, [
    { month: "Oct 26", buys: 100, sells: 0 },
    { month: "Dec 26", buys: 0, sells: 25 },
  ]);
});

test("an adjustment-only history creates no monthly trading activity", () => {
  assert.deepEqual(
    computeMonthlyActivity([adjustment]),
    []
  );
});

// ---------------------------------------------------------------------------
// Price availability and valuation
// ---------------------------------------------------------------------------

test("missing prices do not produce a zero-value portfolio or false loss", () => {
  const unavailable = makeHolding({
    currentPrice: null,
    change24h: null,
    currentValue: null,
    pnl: null,
    pnlPercent: null,
    priceStatus: "unavailable",
  });

  const summary = computeAnalyticsSummary(
    [unavailable],
    [buy]
  );

  assert.equal(summary.totalInvested, 100);
  assert.equal(summary.currentValue, null);
  assert.equal(summary.knownValue, 0);
  assert.equal(summary.totalCost, 100);
  assert.equal(summary.totalPnl, null);
  assert.equal(summary.unavailableCount, 1);
  assert.equal(summary.hasCompleteValuation, false);
});

test("fallback prices remain indicative and are excluded from verified totals", () => {
  const fallback = makeHolding({
    currentPrice: 80,
    change24h: -5,
    currentValue: 80,
    pnl: null,
    pnlPercent: null,
    priceStatus: "fallback",
  });

  const summary = computeAnalyticsSummary(
    [fallback],
    [buy]
  );

  assert.equal(summary.currentValue, null);
  assert.equal(summary.knownValue, 0);
  assert.equal(summary.indicativeValue, 80);
  assert.equal(summary.totalPnl, null);
  assert.equal(summary.fallbackCount, 1);
  assert.equal(summary.hasCompleteValuation, false);

  assert.deepEqual(computeAssetPerformance([fallback]), []);
});

test("live-priced positions contribute to verified portfolio metrics", () => {
  const live = makeHolding();

  const summary = computeAnalyticsSummary(
    [live],
    [buy]
  );

  assert.equal(summary.currentValue, 120);
  assert.equal(summary.knownValue, 120);
  assert.equal(summary.totalCost, 100);
  assert.equal(summary.totalPnl, 20);
  assert.equal(summary.totalPnlPercent, 20);
  assert.equal(summary.pricedCount, 1);
  assert.equal(summary.hasCompleteValuation, true);
});

test("incomplete portfolios do not expose a misleading total P&L", () => {
  const live = makeHolding();

  const unavailable = makeHolding({
    id: "holding-2",
    coinId: "unknown-coin",
    symbol: "UNK",
    quantity: 2,
    costBasis: 50,
    currentPrice: null,
    change24h: null,
    currentValue: null,
    costTotal: 100,
    pnl: null,
    pnlPercent: null,
    priceStatus: "unavailable",
  });

  const summary = computeAnalyticsSummary(
    [live, unavailable],
    [buy]
  );

  assert.equal(summary.currentValue, null);
  assert.equal(summary.knownValue, 120);
  assert.equal(summary.totalCost, 200);
  assert.equal(summary.totalPnl, null);
  assert.equal(summary.pricedCount, 1);
  assert.equal(summary.unavailableCount, 1);
  assert.equal(summary.valuationCoverage, 50);
});

test("a genuine live zero price remains a valid valuation", () => {
  const zeroValue = makeHolding({
    currentPrice: 0,
    change24h: -100,
    currentValue: 0,
    costTotal: 100,
    pnl: -100,
    pnlPercent: -100,
    priceStatus: "live",
  });

  const summary = computeAnalyticsSummary(
    [zeroValue],
    [buy]
  );

  assert.equal(summary.currentValue, 0);
  assert.equal(summary.totalPnl, -100);
  assert.equal(summary.totalPnlPercent, -100);

  const performance = computeAssetPerformance([zeroValue]);

  assert.equal(performance.length, 1);
  assert.equal(performance[0].roiPercent, -100);
});

test("performance rankings include only live-priced holdings", () => {
  const live = makeHolding();

  const fallback = makeHolding({
    id: "holding-2",
    coinId: "ethereum",
    symbol: "ETH",
    priceStatus: "fallback",
    currentPrice: 200,
    change24h: 1,
    currentValue: 200,
    costTotal: 100,
    pnl: null,
    pnlPercent: null,
  });

  const unavailable = makeHolding({
    id: "holding-3",
    coinId: "unknown-coin",
    symbol: "UNK",
    priceStatus: "unavailable",
    currentPrice: null,
    change24h: null,
    currentValue: null,
    costTotal: 100,
    pnl: null,
    pnlPercent: null,
  });

  const performance = computeAssetPerformance([
    fallback,
    unavailable,
    live,
  ]);

  assert.equal(performance.length, 1);
  assert.equal(performance[0].symbol, "BTC");
  assert.equal(performance[0].roiPercent, 20);
});

test("concentration is calculated only from live-priced holdings", () => {
  const live = makeHolding();

  const fallback = makeHolding({
    id: "holding-2",
    coinId: "ethereum",
    symbol: "ETH",
    priceStatus: "fallback",
    currentPrice: 500,
    currentValue: 500,
    change24h: 3,
    costTotal: 400,
    pnl: null,
    pnlPercent: null,
  });

  const unavailable = makeHolding({
    id: "holding-3",
    coinId: "unknown-coin",
    symbol: "UNK",
    priceStatus: "unavailable",
    currentPrice: null,
    change24h: null,
    currentValue: null,
    costTotal: 100,
    pnl: null,
    pnlPercent: null,
  });

  const concentration = computeConcentration([
    live,
    fallback,
    unavailable,
  ]);

  assert.equal(concentration.length, 1);
  assert.equal(concentration[0].symbol, "BTC");
  assert.equal(concentration[0].value, 120);
  assert.equal(concentration[0].percent, 100);
});