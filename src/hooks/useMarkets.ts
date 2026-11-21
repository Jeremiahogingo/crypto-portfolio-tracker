// src/hooks/useMarkets.ts
//
// Shared market-data query for Markets, Watchlist and Portfolio.
//
// Query parameters participate in the React Query key, so changing
// pagination or ordering creates the correct cache entry.
//
// keepPreviousData prevents table flicker during page and sort changes.

"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { getJson } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { GetMarketsParams } from "@/lib/api/coingecko";
import type { ApiResponse, MarketCoin } from "@/types/market";

interface UseMarketsOptions {
  enabled?: boolean;
}

export function useMarkets(
  params: GetMarketsParams = {},
  options: UseMarketsOptions = {},
) {
  const query = useQuery<ApiResponse<MarketCoin[]>>({
    queryKey: queryKeys.markets(params),

    queryFn: ({ signal }) => {
      const qs = new URLSearchParams();

      if (params.per_page) {
        qs.set("per_page", String(params.per_page));
      }

      if (params.page) {
        qs.set("page", String(params.page));
      }

      if (params.vs_currency) {
        qs.set("vs_currency", params.vs_currency);
      }

      if (params.order) {
        qs.set("order", params.order);
      }

      if (params.ids?.length) {
        qs.set("ids", params.ids.join(","));
      }

      if (params.sparkline) {
        qs.set("sparkline", "true");
      }

      return getJson<MarketCoin[]>(
        `/api/crypto/markets?${qs.toString()}`,
        signal,
      );
    },

    enabled: options.enabled ?? true,

    placeholderData: keepPreviousData,
  });

  return {
    coins: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isPlaceholderData: query.isPlaceholderData,
    error: query.error,
    refetch: query.refetch,
  };
}