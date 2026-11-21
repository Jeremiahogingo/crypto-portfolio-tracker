"use client";

import { useState } from "react";

import MarketOverview from "@/components/markets/MarketOverview";
import TrendingCoins from "@/components/markets/TrendingCoins";
import GainersLosers from "@/components/markets/GainersLosers";
import MarketsTable from "@/components/tables/MarketsTable";

import DataSourceBadge from "@/components/ui/DataSourceBadge";
import Card from "@/components/ui/Card";

import { useMarkets } from "@/hooks/useMarkets";
import type { MarketOrder } from "@/types/market";

const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_ORDER: MarketOrder = "market_cap_desc";

export default function MarketsPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [order, setOrder] = useState<MarketOrder>(DEFAULT_ORDER);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text">
          Markets
        </h1>

        <div className="flex items-center gap-3">
          {isFetching && (
            <span className="text-xs text-secondary">
              Updating…
            </span>
          )}

          <DataSourceBadge
            source={meta?.source}
            fetchedAt={meta?.fetchedAt}
          />

          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refresh
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
              Retry
            </button>
          </div>
        </Card>
      )}

      <MarketOverview />

      <TrendingCoins />

      <GainersLosers
        coins={coins}
        isLoading={isLoading}
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