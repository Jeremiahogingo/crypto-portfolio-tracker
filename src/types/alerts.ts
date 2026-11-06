// src/types/alerts.ts
//
// Display type for alerts. The DB row (Alert from @/db/schema) stores the
// minimum needed to express user intent: target price, condition, enabled.
// Everything else — coin name, logo, current price — is joined in at render
// time from live market data.
//
// This separation matters: if the DB stored currentPrice, it would go stale
// the moment we stored it. A target price is intent (stable); a current
// price is a snapshot (must be live).

export interface AlertWithPrice {
  id: string;
  coinId: string;
  symbol: string;
  condition: "above" | "below";
  targetPrice: number;
  enabled: boolean;
  createdAt: Date;

  // Joined from live market data — 0/"" if the coin isn't in the current
  // market snapshot (delisted, or CoinGecko unreachable).
  coinName: string;
  logoUrl: string;
  currentPrice: number;
  change24h: number;
}