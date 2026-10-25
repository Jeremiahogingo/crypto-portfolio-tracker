// src/lib/query/keys.ts
//
// Centralized query key factory. See the original file header for rationale.
// Kept in the same order as the resources are added, so diffs stay small.

import type { GetMarketsParams } from "@/lib/api/coingecko";

export const queryKeys = {
  markets: (params: GetMarketsParams = {}) => ["markets", params] as const,
  global: () => ["global"] as const,
  trending: () => ["trending"] as const,

  /**
   * Aggregated news feed.
   *
   * `limit` is part of the key because the dashboard (limit=4) and the News
   * page (limit=30) intentionally maintain separate cache entries. React
   * Query dedupes within the same key; different limits diverge on purpose.
   */
  news: (limit: number) => ["news", { limit }] as const,
};