// src/types/alerts.ts
//
// Display type for alerts.
// Stored alert data expresses user intent; current market values are
// fetched separately and must preserve their source and availability.

import type { PriceStatus } from "@/types/valuation";

export interface AlertWithPrice {
  id: string;
  coinId: string;
  symbol: string;
  condition: "above" | "below";
  targetPrice: number;
  enabled: boolean;
  createdAt: Date;

  coinName: string;
  logoUrl: string;

  /** Null means no usable market quote was returned. */
  currentPrice: number | null;

  /** Null means no verified 24-hour percentage change is available. */
  change24h: number | null;

  /** Identifies whether the quote is live, fallback or unavailable. */
  priceStatus: PriceStatus;
}