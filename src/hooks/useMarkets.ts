// src/hooks/useMarkets.ts
//
// Live market coin list. Serves the Markets page, Watchlist page, and the
// Portfolio holdings table.
//
// Returns `{ coins, meta, isLoading, isFetching, error, refetch }`. `coins`
// is the unwrapped array — callers never see the envelope. `meta.source`
// is exposed so the UI can show a "cached data" badge when CoinGecko is
// unreachable.
//
// Example:
//   const { coins, isLoading } = useMarkets({ per_page: 50, sparkline: true });
//
// For conditional fetching (e.g. watchlist ids come from user state):
//   const { coins } = useMarkets({ ids }, { enabled: ids.length > 0 });

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getJson } from "@/lib/api/client";
import { queryKeys } from "@/lib/query/keys";
import type { GetMarketsParams } from "@/lib/api/coingecko";
import type { ApiResponse, MarketCoin } from "@/types/market";

interface UseMarketsOptions {
  /** Skip the query entirely when false. Useful for conditional fetching. */
  enabled?: boolean;
}

export function useMarkets(
  params: GetMarketsParams = {},
  options: UseMarketsOptions = {}
) {
  const query = useQuery<ApiResponse<MarketCoin[]>>({
    queryKey: queryKeys.markets(params),
    queryFn: ({ signal }) => {
      const qs = new URLSearchParams();
      if (params.per_page) qs.set("per_page", String(params.per_page));
      if (params.page) qs.set("page", String(params.page));
      if (params.vs_currency) qs.set("vs_currency", params.vs_currency);
      if (params.ids?.length) qs.set("ids", params.ids.join(","));
      if (params.sparkline) qs.set("sparkline", "true");

      return getJson<MarketCoin[]>(
        `/api/crypto/markets?${qs.toString()}`,
        signal
      );
    },
    enabled: options.enabled ?? true,

    // Keep the previous list visible while a new query (different params)
    // loads. Without this, changing `per_page` or `ids` blanks the table
    // for a moment — jarring. With it, the old list fades to the new one.
    placeholderData: keepPreviousData,
  });

  return {
    coins: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}