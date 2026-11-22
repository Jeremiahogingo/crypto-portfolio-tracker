"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import CoinLogo from "@/components/ui/CoinLogo";
import DataSourceBadge from "@/components/ui/DataSourceBadge";

import { useMarkets } from "@/hooks/useMarkets";

import {
  getTopMovers,
  MARKET_INTELLIGENCE_LIMIT,
} from "@/lib/market-intelligence";

import type { MarketCoin } from "@/types/market";
import { formatPrice, formatPercent } from "@/utils/format";

type CoinWithChange = MarketCoin & {
  change24h: number;
};

function LoadingState() {
  return (
    <Card>
      <Skeleton className="mb-4 h-4 w-28" />

      {[0, 1, 2, 3].map((index) => (
        <Skeleton
          key={index}
          className="mb-2 h-12 w-full"
        />
      ))}
    </Card>
  );
}

export default function TopMovers() {
  const {
    coins,
    meta,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useMarkets({
    per_page: MARKET_INTELLIGENCE_LIMIT,
    page: 1,
    order: "market_cap_desc",
  });

  if (isLoading && coins.length === 0) {
    return <LoadingState />;
  }

  if (error && coins.length === 0) {
    return (
      <Card className="h-full">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text">
            Top Movers
          </h3>

          <p role="alert" className="text-sm text-warning">
            Market movement data could not be loaded.
          </p>

          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text hover:bg-surface-muted disabled:opacity-50"
          >
            {isFetching ? "Retrying..." : "Retry"}
          </button>
        </div>
      </Card>
    );
  }

  const movers: CoinWithChange[] = getTopMovers(coins);

  return (
    <Card className="h-full">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text">
            Top Movers
          </h3>

          <p className="mt-1 text-xs text-secondary">
            Top 100 by market cap
          </p>
        </div>

        <DataSourceBadge
          source={meta?.source}
          fetchedAt={meta?.fetchedAt}
        />
      </div>

      {isFetching && (
        <p className="mb-3 text-xs text-secondary">
          Updating...
        </p>
      )}

      {error !== null && error !== undefined && (
        <p role="status" className="mb-3 text-xs text-warning">
          The latest refresh failed. Showing the last available response.
        </p>
      )}

      {movers.length === 0 ? (
        <p className="py-2 text-sm text-secondary">
          No qualifying 24-hour movements are currently available.
        </p>
      ) : (
        <div className="space-y-3">
          {movers.map((coin) => (
            <div
              key={coin.id}
              className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-0"
            >
              <div className="flex min-w-0 items-center gap-2">
                <CoinLogo
                  src={coin.logoUrl}
                  alt={coin.name}
                  size="sm"
                />

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text">
                    {coin.symbol}
                  </p>

                  <p className="truncate text-xs text-secondary">
                    {coin.name}
                  </p>
                </div>
              </div>

              <span className="flex-shrink-0 text-xs text-secondary">
                {coin.price === null
                  ? "—"
                  : formatPrice(coin.price)}
              </span>

              <Badge
                variant={coin.change24h > 0 ? "success" : "danger"}
              >
                {formatPercent(coin.change24h)}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}