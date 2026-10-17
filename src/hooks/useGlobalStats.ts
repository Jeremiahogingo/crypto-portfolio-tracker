// src/hooks/useGlobalStats.ts
//
// Aggregate market stats for the Markets overview cards.
//
// Returns `{ stats, meta, isLoading, error }`. `stats` is `null` until the
// first response lands — callers should render a skeleton during that window.

import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { ApiResponse, GlobalMarketStats } from "@/types/market";

export function useGlobalStats() {
  const query = useQuery<ApiResponse<GlobalMarketStats>>({
    queryKey: queryKeys.global(),
    queryFn: ({ signal }) =>
      getJson<GlobalMarketStats>("/api/crypto/global", signal),
  });

  return {
    stats: query.data?.data ?? null,
    meta: query.data?.meta,
    isLoading: query.isLoading,
    error: query.error,
  };
}