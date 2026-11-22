// src/hooks/useMarkets.ts
//
// Shared market-data query for Markets, Watchlist, Portfolio,
// dashboard widgets, alerts, and market selectors.
//
// Query parameters participate in a canonical React Query key.
// keepPreviousData prevents table flicker during page and sort changes.

"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { getJson } from "@/lib/api/client";
import {
  normalizeMarketsParams,
  queryKeys,
} from "@/lib/query/keys";

import type { GetMarketsParams } from "@/lib/api/coingecko";
import type { ApiResponse, MarketCoin } from "@/types/market";

interface UseMarketsOptions {
  enabled?: boolean;
}

export function useMarkets(
  params: GetMarketsParams = {},
  options: UseMarketsOptions = {},
) {
  const normalizedParams = normalizeMarketsParams(params);

  const query = useQuery<ApiResponse<MarketCoin[]>>({
    queryKey: queryKeys.markets(normalizedParams),

    queryFn: ({ signal }) => {
      const qs = new URLSearchParams();

      qs.set("vs_currency", normalizedParams.vs_currency);
      qs.set("order", normalizedParams.order);
      qs.set("per_page", String(normalizedParams.per_page));
      qs.set("page", String(normalizedParams.page));

      if (normalizedParams.ids?.length) {
        qs.set("ids", normalizedParams.ids.join(","));
      }

      if (normalizedParams.sparkline) {
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