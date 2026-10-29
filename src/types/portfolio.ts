// src/types/portfolio.ts
//
// Display types for portfolio data.
//
// `Holding` from Drizzle has numeric fields as strings (Postgres preserves
// arbitrary precision as text; the JS driver doesn't auto-convert). Display
// code needs numbers. HoldingWithPrice is the bridge: Drizzle row + parsed
// numerics + live market data, all in one shape that components can render
// directly.
//
// Kept separate from the DB type so a display-layer change (adding
// unrealizedPnl, removing costTotal) never touches the schema.

export interface HoldingWithPrice {
  id: string;
  portfolioId: string;
  coinId: string;
  symbol: string;

  /** Parsed from numeric — original row stores this as string. */
  quantity: number;
  /** Average purchase price per unit, USD. */
  costBasis: number;

  /** Live market data — 0 if the coin isn't in the current market snapshot. */
  currentPrice: number;
  change24h: number;

  /** Derived fields — see src/lib/portfolio/calc.ts. */
  currentValue: number;
  costTotal: number;
  pnl: number;
  pnlPercent: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalPnl: number;
  totalPnlPercent: number;
  /** Absolute value change over the last 24h based on current holdings. */
  change24hValue: number;
  /** Percentage change over 24h (weighted). */
  change24hPercent: number;
  assetCount: number;
}

export interface AllocationSlice {
  coinId: string;
  symbol: string;
  value: number;
  percent: number;
}