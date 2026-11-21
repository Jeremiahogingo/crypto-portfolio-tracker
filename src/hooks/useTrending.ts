"use client";

import { useQuery } from "@tanstack/react-query";

import { getJson } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type {
  ApiResponse,
  TrendingCoin,
} from "@/types/market";

interface UseTrendingOptions {
  limit?: number;
}

export function useTrending(options: UseTrendingOptions = {}) {
  const query = useQuery<ApiResponse<TrendingCoin[]>>({
    queryKey: queryKeys.trending(),

    queryFn: ({ signal }) =>
      getJson<TrendingCoin[]>(
        "/api/crypto/trending",
        signal,
      ),
  });

  const all = query.data?.data ?? [];
  const coins = options.limit
    ? all.slice(0, options.limit)
    : all;

  return {
    coins,
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}