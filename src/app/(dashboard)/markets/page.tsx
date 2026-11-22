"use client";

import { useState } from "react";
import {
  useIsFetching,
  useQueryClient,
} from "@tanstack/react-query";

import MarketOverview from "@/components/markets/MarketOverview";
import TrendingCoins from "@/components/markets/TrendingCoins";
import GainersLosers from "@/components/markets/GainersLosers";
import MarketsTable from "@/components/tables/MarketsTable";

import DataSourceBadge from "@/components/ui/DataSourceBadge";
import Card from "@/components/ui/Card";

import { useMarkets } from "@/hooks/useMarkets";
import { queryKeys } from "@/lib/query/keys";

import {
  MARKET_INTELLIGENCE_LIMIT,
} from "@/lib/market-intelligence";

import type { MarketOrder } from "@/types/market";

const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_ORDER: MarketOrder = "market_cap_desc";

export default function MarketsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [order, setOrder] = useState<MarketOrder>(DEFAULT_ORDER);
  const [refreshRequested, setRefreshRequested] = useState(false);

  // User-controlled, paginated market table.
  const {
    coins,
    meta,
    isLoading,
    isFetching,
    isPlaceholderData,
    error,
    refetch,
  } = useMarkets({
    per_page: perPage,
    page,
    order,
  });

  // Independent, fixed dataset for market intelligence.
  const {
    coins: intelligenceCoins,
    meta: intelligenceMeta,
    isLoading: intelligenceIsLoading,
    isFetching: intelligenceIsFetching,
    error: intelligenceError,
    refetch: refetchIntelligence,
  } = useMarkets({
    per_page: MARKET_INTELLIGENCE_LIMIT,
    page: 1,
    order: "market_cap_desc",
  });

  // Track active queries across all visible market-data sections.
  const marketFetchCount = useIsFetching({
    queryKey: queryKeys.marketsRoot(),
  });

  const globalFetchCount = useIsFetching({
    queryKey: queryKeys.global(),
  });

  const trendingFetchCount = useIsFetching({
    queryKey: queryKeys.trending(),
  });

  const isRefreshing =
    refreshRequested ||
    marketFetchCount > 0 ||
    globalFetchCount > 0 ||
    trendingFetchCount > 0;

  const hasNextPage =
    !isPlaceholderData &&
    coins.length === perPage;

  function handleOrderChange(nextOrder: MarketOrder) {
    setPage(1);
    setOrder(nextOrder);
  }

  function handlePageSizeChange(nextPageSize: number) {
    setPage(1);
    setPerPage(nextPageSize);
  }

  async function handleRefreshAll() {
    if (refreshRequested) return;

    setRefreshRequested(true);

    try {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.marketsRoot(),
        }),

        queryClient.invalidateQueries({
          queryKey: queryKeys.global(),
        }),

        queryClient.invalidateQueries({
          queryKey: queryKeys.trending(),
        }),
      ]);
    } finally {
      setRefreshRequested(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text">
          Markets
        </h1>

        <div className="flex items-center gap-3">
          {isRefreshing && (
            <span
              role="status"
              className="text-xs text-secondary"
            >
              Updating market data...
            </span>
          )}

          <DataSourceBadge
            source={meta?.source}
            fetchedAt={meta?.fetchedAt}
          />

          <button
            type="button"
            onClick={() => void handleRefreshAll()}
            disabled={isRefreshing}
            aria-label="Refresh all market data"
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p role="alert" className="text-sm text-warning">
              Market data could not be refreshed. Check your connection
              and retry.
            </p>

            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text hover:bg-surface-muted disabled:opacity-50"
            >
              Retry table
            </button>
          </div>
        </Card>
      )}

      <MarketOverview />

      <TrendingCoins />

      <GainersLosers
        coins={intelligenceCoins}
        source={intelligenceMeta?.source}
        fetchedAt={intelligenceMeta?.fetchedAt}
        isLoading={intelligenceIsLoading}
        isFetching={intelligenceIsFetching}
        error={intelligenceError}
        onRetry={() => void refetchIntelligence()}
      />

      <Card>
        <MarketsTable
          coins={coins}
          isLoading={isLoading}
          isFetching={isFetching}
          isPlaceholderData={isPlaceholderData}
          error={error}
          page={page}
          perPage={perPage}
          order={order}
          hasNextPage={hasNextPage}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          onOrderChange={handleOrderChange}
          onRetry={() => void refetch()}
        />
      </Card>
    </div>
  );
}