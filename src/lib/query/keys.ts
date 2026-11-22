// src/lib/query/keys.ts
//
// Centralized query key factory.
//
// Market requests are normalized before being keyed so semantically
// equivalent requests share one React Query cache entry.

import type { GetMarketsParams } from "@/lib/api/coingecko";

export type NormalizedMarketsParams =
  Required<Omit<GetMarketsParams, "ids">> &
  Pick<GetMarketsParams, "ids">;

/**
 * Normalize values according to the defaults and input normalization
 * used by /api/crypto/markets.
 *
 * Coin IDs are lowercased and trimmed, matching route validation.
 * Their order is preserved because fallback selection preserves the
 * requested order.
 */
export function normalizeMarketsParams(
  params: GetMarketsParams = {},
): NormalizedMarketsParams {
  const ids =
    params.ids && params.ids.length > 0
      ? params.ids.map((id) => id.trim().toLowerCase())
      : undefined;

  return {
    vs_currency: (params.vs_currency ?? "usd")
      .trim()
      .toLowerCase(),

    order: params.order ?? "market_cap_desc",

    per_page: params.per_page ?? 100,

    page: params.page ?? 1,

    ...(ids ? { ids } : {}),

    sparkline: params.sparkline ?? false,
  };
}

export const queryKeys = {
  /** Prefix for invalidating all market-data queries. */
  marketsRoot: () => ["markets"] as const,

  /** A canonical, parameter-sensitive market query. */
  markets: (params: GetMarketsParams = {}) =>
    ["markets", normalizeMarketsParams(params)] as const,

  global: () => ["global"] as const,

  trending: () => ["trending"] as const,

  /**
   * Aggregated news feed.
   *
   * Dashboard and News page requests intentionally maintain separate
   * cache entries because their result limits differ.
   */
  news: (limit: number) => ["news", { limit }] as const,
};
