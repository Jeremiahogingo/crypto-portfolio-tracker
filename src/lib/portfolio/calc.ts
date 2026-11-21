// src/lib/portfolio/calc.ts
// Pure financial display calculations. Ledger accounting remains in ledger.ts.

import type {
  AllocationSlice,
  HoldingWithPrice,
  PortfolioSummary,
} from "@/types/portfolio";
import type {
  HoldingValuation,
  MarketSnapshot,
  PriceStatus,
  ValuationInput,
} from "@/types/valuation";

export type { HoldingWithPrice } from "@/types/portfolio";

function toFiniteNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isValidPrice(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isValidPercentage(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function getPriceStatus(market?: MarketSnapshot): PriceStatus {
  if (!market || !isValidPrice(market.price)) return "unavailable";

  // Never assume a quote is live. Missing provenance is treated conservatively.
  return market.source === "live" ? "live" : "fallback";
}

/**
 * Enrich a DB holding with a quote without mutating or rewriting ledger data.
 * Missing price => null current value/P&L, not a fabricated zero-dollar loss.
 * A numeric quote of exactly zero remains a valid quote.
 */
export function enrichHolding<T extends ValuationInput>(
  holding: T,
  market?: MarketSnapshot,
): HoldingWithPrice<T> {
  const quantity = toFiniteNumber(holding.quantity);
  const costBasis = toFiniteNumber(holding.costBasis);
  const costTotal = quantity * costBasis;
  const priceStatus = getPriceStatus(market);

  const currentPrice = priceStatus === "unavailable" ? null : market!.price;
  const currentValue = currentPrice === null ? null : quantity * currentPrice;

  const change24h =
    priceStatus === "unavailable" || !isValidPercentage(market?.change24h)
      ? null
      : market!.change24h!;

  const hasVerifiedPrice = priceStatus === "live" && currentValue !== null;
  const pnl = hasVerifiedPrice ? currentValue - costTotal : null;
  const pnlPercent =
    hasVerifiedPrice && costTotal > 0 && pnl !== null
      ? (pnl / costTotal) * 100
      : null;

  const normalizedHolding = {
    ...holding,
    quantity,
    costBasis,
  } as Omit<T, "quantity" | "costBasis"> & {
    quantity: number;
    costBasis: number;
  };

  const valuation: HoldingValuation = {
    currentPrice,
    change24h,
    currentValue,
    costTotal,
    pnl,
    pnlPercent,
    priceStatus,
  };

  return { ...normalizedHolding, ...valuation } as HoldingWithPrice<T>;
}

/**
 * Aggregate verified portfolio metrics.
 *
 * `totalValue` and `totalPnl` are all-or-nothing: they are null whenever any
 * active holding is fallback-priced or unavailable. `knownValue` and
 * `indicativeValue` expose the partial components without mislabelling them.
 */
export function summarizePortfolio<T extends ValuationInput>(
  holdings: readonly HoldingWithPrice<T>[],
): PortfolioSummary {
  const activeHoldings = holdings.filter((holding) => holding.quantity !== 0);

  const liveHoldings = activeHoldings.filter(
    (holding) => holding.priceStatus === "live" && holding.currentValue !== null,
  );
  const fallbackHoldings = activeHoldings.filter(
    (holding) => holding.priceStatus === "fallback" && holding.currentValue !== null,
  );
  const unavailableHoldings = activeHoldings.filter(
    (holding) => holding.priceStatus === "unavailable" || holding.currentValue === null,
  );

  const knownValue = sum(liveHoldings.map((holding) => holding.currentValue!));
  const indicativeValue = sum(
    fallbackHoldings.map((holding) => holding.currentValue!),
  );
  const totalCost = sum(holdings.map((holding) => holding.costTotal));

  const hasCompleteValuation =
    unavailableHoldings.length === 0 && fallbackHoldings.length === 0;
  const totalValue = hasCompleteValuation ? knownValue : null;
  const totalPnl = totalValue === null ? null : totalValue - totalCost;
  const totalPnlPercent =
    totalPnl !== null && totalCost > 0 ? (totalPnl / totalCost) * 100 : null;

  const hasComplete24hChange =
    hasCompleteValuation &&
    liveHoldings.every((holding) => {
      if (holding.change24h === null || holding.currentPrice === null) return false;
      return 1 + holding.change24h / 100 > 0;
    });

  let change24hValue: number | null = null;
  let change24hPercent: number | null = null;

  if (hasComplete24hChange) {
    const previousValue = sum(
      liveHoldings.map((holding) => {
        const changeFactor = 1 + holding.change24h! / 100;
        return holding.currentValue! / changeFactor;
      }),
    );
    change24hValue = knownValue - previousValue;
    change24hPercent =
      previousValue > 0 ? (change24hValue / previousValue) * 100 : null;
  }

  const totalHoldings = activeHoldings.length;
  const pricedCount = liveHoldings.length;
  const fallbackCount = fallbackHoldings.length;
  const unavailableCount = unavailableHoldings.length;

  return {
    totalValue,
    knownValue,
    indicativeValue,
    totalCost,
    totalPnl,
    totalPnlPercent,
    change24hValue,
    change24hPercent,
    pricedCount,
    fallbackCount,
    unavailableCount,
    totalHoldings,
    assetCount: totalHoldings,
    valuationCoverage:
      totalHoldings === 0 ? 100 : (pricedCount / totalHoldings) * 100,
    hasCompleteValuation,
    hasComplete24hChange,
  };
}

/**
 * Allocation percentages describe only positions with verified live prices.
 * The UI must label a partial allocation as the allocation of priced holdings.
 */
export function computeAllocation<T extends ValuationInput & { coinId: string; symbol: string }>(
  holdings: readonly HoldingWithPrice<T>[],
): AllocationSlice[] {
  const priced = holdings.filter(
    (holding) =>
      holding.quantity !== 0 &&
      holding.priceStatus === "live" &&
      holding.currentValue !== null &&
      holding.currentValue > 0,
  );

  const total = sum(priced.map((holding) => holding.currentValue!));
  if (total <= 0) return [];

  return priced.map((holding) => ({
    coinId: holding.coinId,
    symbol: holding.symbol,
    value: holding.currentValue!,
    percent: (holding.currentValue! / total) * 100,
  }));
}
