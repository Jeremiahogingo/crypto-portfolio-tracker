"use client";

import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import DataSourceBadge from "@/components/ui/DataSourceBadge";

import { useGlobalStats } from "@/hooks/useGlobalStats";
import {
  formatCompactCurrency,
  formatPercent,
} from "@/utils/format";

export default function MarketOverview() {
  const {
    stats,
    meta,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGlobalStats();

  if (isLoading && !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <Card key={index}>
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="h-7 w-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text">
            Global market overview
          </h2>

          <p className="text-sm text-secondary" role="alert">
            Global market statistics could not be loaded.
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

  const cards = [
    {
      label: "Global Market Cap",
      value:
        stats.totalMarketCap === null
          ? "—"
          : formatCompactCurrency(stats.totalMarketCap),
      sub:
        stats.marketCapChange24h === null
          ? "24h change unavailable"
          : `${formatPercent(stats.marketCapChange24h)} (24h)`,
      subPositive:
        stats.marketCapChange24h !== null &&
        stats.marketCapChange24h >= 0,
      hasChange: true,
    },
    {
      label: "24h Volume",
      value:
        stats.totalVolume === null
          ? "—"
          : formatCompactCurrency(stats.totalVolume),
    },
    {
      label: "BTC Dominance",
      value:
        stats.btcDominance === null
          ? "—"
          : `${stats.btcDominance.toFixed(1)}%`,
    },
    {
      label: "ETH Dominance",
      value:
        stats.ethDominance === null
          ? "—"
          : `${stats.ethDominance.toFixed(1)}%`,
    },
  ];

  return (
    <section aria-labelledby="global-market-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="global-market-heading"
          className="text-sm font-semibold text-text"
        >
          Global market overview
        </h2>

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
        <p
          role="status"
          className="text-xs text-warning"
        >
          The latest refresh failed. Showing the last available response.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} hover>
            <p className="text-sm text-secondary">
              {card.label}
            </p>

            <p className="mt-1 text-2xl font-bold text-text">
              {card.value}
            </p>

            {card.hasChange && card.sub && (
              <p
                className={`mt-1 text-xs ${
                  stats.marketCapChange24h === null
                    ? "text-secondary"
                    : card.subPositive
                      ? "text-success"
                      : "text-danger"
                }`}
              >
                {card.sub}
              </p>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}