import test from "node:test";
import assert from "node:assert/strict";

import type { Transaction } from "../src/db/schema";

import {
  computeAnalyticsSummary,
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
