// src/types/portfolio.ts
// Client-facing portfolio types. Database numeric columns are returned as
// strings by the PostgreSQL driver; the valuation layer parses them to numbers.

import type {
  HoldingWithValuation,
  PortfolioValuationSummary,
  ValuationInput,
} from "@/types/valuation";

export interface HoldingRowForDisplay extends ValuationInput {
  id: string;
  portfolioId: string;
  coinId: string;
  symbol: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Enriched DB row with numeric ledger fields and explicit price availability. */
export type HoldingWithPrice<
  T extends ValuationInput = HoldingRowForDisplay,
> = HoldingWithValuation<T>;

/** The valuation summary is the single summary contract used by the hook/UI. */
export type PortfolioSummary = PortfolioValuationSummary;

export interface AllocationSlice {
  coinId: string;
  symbol: string;
  value: number;
  /** Share of the live-priced subset, not necessarily the entire portfolio. */
  percent: number;
}
