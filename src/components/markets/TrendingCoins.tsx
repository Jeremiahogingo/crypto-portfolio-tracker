// src/components/markets/TrendingCoins.tsx
//
// Horizontal rail of the most-searched coins.
//
// Missing prices and 24-hour changes remain unavailable rather than
// being rendered as zero. Source provenance is shown for this section.

"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import CoinLogo from "@/components/ui/CoinLogo";
import DataSourceBadge from "@/components/ui/DataSourceBadge";

import { useTrending } from "@/hooks/useTrending";
import {
  formatPrice,
  formatPercent,
} from "@/utils/format";

export default function TrendingCoins() {
  const {
    coins,
    meta,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useTrending({ limit: 7 });

  if (isLoading && coins.length === 0) {
    return (
      <Card>
        <Skeleton className="mb-4 h-4 w-28" />

        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2, 3, 4].map((index) => (
            <Skeleton
              key={index}
              className="h-28 w-40 flex-shrink-0"
            />
          ))}
        </div>
      </Card>
    );
  }

  if (error && coins.length === 0) {
    return (
      <Card>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text">
            Trending coins
          </h3>

          <p role="alert" className="text-sm text-secondary">
            Trending data could not be loaded.
          </p>

          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-muted disabled:opacity-50"
          >
            {isFetching ? "Retrying…" : "Retry"}
          </button>
        </div>
      </Card>
    );
  }

  if (coins.length === 0) {
    return (
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-text">
          Trending coins
        </h3>

        <p className="text-sm text-secondary">
          No trending data is currently available.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-text">
          Trending coins
        </h3>

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
        </div>
      </div>

      {error && (
        <p role="status" className="mb-3 text-xs text-warning">
          The latest refresh failed. Showing the last available response.
        </p>
      )}

      <div className="flex gap-3 overflow-x-auto pb-2">
        {coins.map((coin) => (
          <div
            key={coin.id}
            className="w-40 flex-shrink-0 rounded-xl border border-border bg-surface-muted p-4 transition-colors hover:bg-surface-elevated"
          >
            <div className="flex items-center gap-2">
              <CoinLogo
                src={coin.logoUrl}
                alt={coin.name}
                size="sm"
              />

              <span className="truncate text-sm font-medium text-text">
                {coin.symbol}
              </span>
            </div>

            <p className="mt-1 truncate text-xs text-secondary">
              {coin.name}
            </p>

            <p className="mt-2 text-sm font-semibold text-text">
              {coin.price === null
                ? "Price unavailable"
                : formatPrice(coin.price)}
            </p>

            <div className="mt-2">
              {coin.change24h === null ? (
                <span className="text-xs text-secondary">
                  24h change unavailable
                </span>
              ) : (
                <Badge
                  variant={coin.change24h >= 0 ? "success" : "danger"}
                >
                  {formatPercent(coin.change24h)}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}