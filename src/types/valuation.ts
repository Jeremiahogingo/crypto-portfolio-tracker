/**
 * Price provenance and portfolio-valuation contracts.
 *
 * A live quote can contribute to verified portfolio values. A fallback quote
 * is indicative only. A missing quote is unknown, never an implicit zero.
 */
export type PriceSource = "live" | "fallback";
export type PriceStatus = PriceSource | "unavailable";

export interface MarketSnapshot {
  /** Provider quote. Null means that the provider did not supply a usable price. */
  price: number | null;
  /** Provider-reported 24-hour percentage movement. */
  change24h: number | null;
  /** Must come from the API response metadata, not be guessed by the caller. */
  source?: PriceSource;
}

export interface HoldingValuation {
  currentPrice: number | null;
  change24h: number | null;
  /** Null when no market quote is available. Fallback values are indicative. */
  currentValue: number | null;
  /** Ledger-derived remaining quantity multiplied by weighted-average unit cost. */
  costTotal: number;
  /** Only computed from a live quote. */
  pnl: number | null;
  pnlPercent: number | null;
  priceStatus: PriceStatus;
}

export interface ValuationInput {
  quantity: number | string;
  costBasis: number | string;
}

/**
 * Preserve the original row's other fields, but expose quantity and costBasis
 * as parsed numbers in the enriched display model.
 */
export type HoldingWithValuation<T extends ValuationInput> = Omit<
  T,
  "quantity" | "costBasis"
> & {
  quantity: number;
  costBasis: number;
} & HoldingValuation;

export interface PortfolioValuationSummary {
  /** Null unless every active position has a live quote. */
  totalValue: number | null;
  /** Live-priced portion of the portfolio. */
  knownValue: number;
  /** Fallback-priced portion; not included in verified totals. */
  indicativeValue: number;
  /** Ledger-derived cost basis for all current positions. */
  totalCost: number;
  /** Null unless every active position has a live quote. */
  totalPnl: number | null;
  totalPnlPercent: number | null;
  change24hValue: number | null;
  change24hPercent: number | null;
  pricedCount: number;
  fallbackCount: number;
  unavailableCount: number;
  /** Number of non-zero positions that require a market quote. */
  totalHoldings: number;
  /** Backwards-compatible count for existing summary-card consumers. */
  assetCount: number;
  /** Percentage of active positions with verified live quotes, from 0 to 100. */
  valuationCoverage: number;
  hasCompleteValuation: boolean;
  hasComplete24hChange: boolean;
}
