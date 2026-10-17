// src/lib/query/keys.ts
//
// Centralized query key factory.
//
// Why a factory instead of inline strings:
//   • Typos in keys are silent bugs — you get a stale cache you didn't want.
//     A factory makes every key a typed function, so mistakes surface at
//     compile time.
//   • When we add mutations later (e.g. creating an alert), we invalidate
//     caches by key. Having all keys in one place makes that trivial and
//     prevents "why isn't my data refreshing?" issues.
//   • React Query keys must be arrays for proper hashing. The factory
//     guarantees every key is array-shaped.
//
// Naming convention: [resource, ...params]. Extra params are included
// literally so that changing `per_page` produces a distinct cache entry.

import type { GetMarketsParams } from "@/lib/api/coingecko";

export const queryKeys = {
  /**
   * Market coin list.
   *
   * Example:
   *   queryKeys.markets({ per_page: 100 })    → ["markets", { per_page: 100 }]
   *   queryKeys.markets({ ids: ["bitcoin"] }) → ["markets", { ids: ["bitcoin"] }]
   *
   * Params must be serializable (plain objects). CoinGecko's param type is
   * pure primitives + array-of-strings, so this holds.
   */
  markets: (params: GetMarketsParams = {}) => ["markets", params] as const,

  /** Aggregate market stats. No params. */
  global: () => ["global"] as const,

  /** Trending coins. No params. */
  trending: () => ["trending"] as const,
};