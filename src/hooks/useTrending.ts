// src/hooks/useTrending.ts
//
// Top trending coins. CoinGecko returns roughly 15 items; the UI may slice
// further. Callers can pass `limit` to cap the array at the hook level.
//
// Returns `{ coins, meta, isLoading, error }`.

import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { ApiResponse, TrendingCoin } from "@/types/market";

interface UseTrendingOptions {
  /** Cap the returned array. Useful if the caller only shows 7 cards. */
  limit?: number;
}

export function useTrending(options: UseTrendingOptions = {}) {
  const query = useQuery<ApiResponse<TrendingCoin[]>>({
    queryKey: queryKeys.trending(),
    queryFn: ({ signal }) =>
      getJson<TrendingCoin[]>("/api/crypto/trending", signal),
  });

  const all = query.data?.data ?? [];
  const coins = options.limit ? all.slice(0, options.limit) : all;

  return {
    coins,
    meta: query.data?.meta,
    isLoading: query.isLoading,
    error: query.error,
  };
}