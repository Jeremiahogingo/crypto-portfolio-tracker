import assert from "node:assert/strict";
import test from "node:test";

import {
  computeAllocation,
  enrichHolding,
  summarizePortfolio,
} from "../src/lib/portfolio/calc";

const baseHolding = {
  id: "holding-1",
  coinId: "bitcoin",
  symbol: "BTC",
  name: "Bitcoin",
  quantity: "0.5",
  costBasis: "40000",
};

test("a live quote produces current value and unrealized P&L", () => {
  const holding = enrichHolding(baseHolding, {
    price: 50_000,
    change24h: 2,
    source: "live",
  });

  assert.equal(holding.quantity, 0.5);
  assert.equal(holding.costBasis, 40_000);
  assert.equal(holding.priceStatus, "live");
  assert.equal(holding.currentPrice, 50_000);
  assert.equal(holding.currentValue, 25_000);
  assert.equal(holding.costTotal, 20_000);
  assert.equal(holding.pnl, 5_000);
  assert.equal(holding.pnlPercent, 25);
});

test("a missing quote stays unknown instead of becoming a zero-dollar loss", () => {
  const holding = enrichHolding(baseHolding, undefined);

  assert.equal(holding.priceStatus, "unavailable");
  assert.equal(holding.currentPrice, null);
  assert.equal(holding.currentValue, null);
  assert.equal(holding.pnl, null);
  assert.equal(holding.pnlPercent, null);
  assert.equal(holding.costTotal, 20_000);
});

test("a fallback quote is indicative and cannot create verified P&L", () => {
  const holding = enrichHolding(baseHolding, {
    price: 10_000,
    change24h: -5,
    source: "fallback",
  });

  assert.equal(holding.priceStatus, "fallback");
  assert.equal(holding.currentValue, 5_000);
  assert.equal(holding.pnl, null);
  assert.equal(holding.pnlPercent, null);
});

test("a provider-supplied numeric zero is preserved as a real quote", () => {
  const holding = enrichHolding(baseHolding, {
    price: 0,
    change24h: -100,
    source: "live",
  });

  assert.equal(holding.priceStatus, "live");
  assert.equal(holding.currentPrice, 0);
  assert.equal(holding.currentValue, 0);
  assert.equal(holding.pnl, -20_000);
  assert.equal(holding.pnlPercent, -100);
});

test("portfolio totals are withheld when at least one position is not live-priced", () => {
  const live = enrichHolding(baseHolding, {
    price: 50_000,
    change24h: 2,
    source: "live",
  });
  const missing = enrichHolding(
    { ...baseHolding, id: "holding-2", coinId: "delisted-coin", quantity: "2" },
    undefined,
  );

  const summary = summarizePortfolio([live, missing]);

  assert.equal(summary.totalValue, null);
  assert.equal(summary.totalPnl, null);
  assert.equal(summary.knownValue, 25_000);
  assert.equal(summary.indicativeValue, 0);
  assert.equal(summary.pricedCount, 1);
  assert.equal(summary.unavailableCount, 1);
  assert.equal(summary.valuationCoverage, 50);
  assert.equal(summary.assetCount, 2);
  assert.equal(summary.hasCompleteValuation, false);
});

test("complete live quotes produce a verified portfolio total and 24h movement", () => {
  const holding = enrichHolding(baseHolding, {
    price: 50_000,
    change24h: 25,
    source: "live",
  });

  const summary = summarizePortfolio([holding]);

  assert.equal(summary.totalValue, 25_000);
  assert.equal(summary.totalCost, 20_000);
  assert.equal(summary.totalPnl, 5_000);
  assert.equal(summary.hasCompleteValuation, true);
  assert.equal(summary.hasComplete24hChange, true);
  assert.ok(Math.abs((summary.change24hValue ?? 0) - 5_000) < 1e-8);
});

test("allocation includes live-priced positions only and returns percent", () => {
  const live = enrichHolding(baseHolding, {
    price: 50_000,
    change24h: 2,
    source: "live",
  });
  const fallback = enrichHolding(
    { ...baseHolding, id: "holding-2", coinId: "ethereum", quantity: "1" },
    { price: 3_000, change24h: 1, source: "fallback" },
  );

  const allocation = computeAllocation([live, fallback]);

  assert.equal(allocation.length, 1);
  assert.equal(allocation[0].coinId, "bitcoin");
  assert.equal(allocation[0].percent, 100);
});
