"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import CoinLogo from "@/components/ui/CoinLogo";
import DataSourceBadge from "@/components/ui/DataSourceBadge";

import {
  getTopGainers,
  getTopLosers,
} from "@/lib/market-intelligence";

import type { MarketCoin } from "@/types/market";
import { formatPrice, formatPercent } from "@/utils/format";

interface GainersLosersProps {
  coins: MarketCoin[];
  source?: "live" | "fallback";
  fetchedAt?: string;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  onRetry: () => void;
}

function CoinRow({
  coin,
  direction,
}: {
  coin: MarketCoin & { change24h: number };
  direction: "gainer" | "loser";
}) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
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

      <div className="ml-2 flex-shrink-0 text-right">
        <p className="text-sm font-medium text-text">
          {coin.price === null
            ? "Price unavailable"
            : formatPrice(coin.price)}
        </p>

        <Badge
          variant={direction === "gainer" ? "success" : "danger"}
        >
          {formatPercent(coin.change24h)}
        </Badge>
      </div>
    </div>
  );
}

function RankingCard({
  title,
  coins,
  direction,
}: {
  title: string;
  coins: (MarketCoin & { change24h: number })[];
  direction: "gainer" | "loser";
}) {
  const emptyMessage =
    direction === "gainer"
      ? "No qualifying positive 24-hour movements are available."
      : "No qualifying negative 24-hour movements are available.";

  return (
    <Card>
      <h3 className="mb-2 text-sm font-semibold text-text">
        {title}
      </h3>

      {coins.length === 0 ? (
        <p className="py-4 text-sm text-secondary">
          {emptyMessage}
        </p>
      ) : (
        coins.map((coin) => (
          <CoinRow
            key={coin.id}
            coin={coin}
            direction={direction}
          />
        ))
      )}
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {[0, 1].map((index) => (
        <Card key={index}>
          <Skeleton className="mb-4 h-4 w-32" />

          {[0, 1, 2, 3].map((row) => (
            <Skeleton
              key={row}
              className="mb-2 h-12 w-full"
            />
          ))}
        </Card>
      ))}
    </div>
  );
}

export default function GainersLosers({
  coins,
  source,
  fetchedAt,
  isLoading,
  isFetching,
  error,
  onRetry,
}: GainersLosersProps) {
  if (isLoading && coins.length === 0) {
    return <LoadingState />;
  }

  if (error && coins.length === 0) {
    return (
      <Card>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text">
            Top gainers and losers
          </h2>

          <p role="alert" className="text-sm text-warning">
            Market movement rankings could not be loaded.
          </p>

          <button
            type="button"
            onClick={onRetry}
            disabled={isFetching}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFetching ? "Retrying..." : "Retry"}
          </button>
        </div>
      </Card>
    );
  }

  const gainers = getTopGainers(coins);
  const losers = getTopLosers(coins);

  return (
    <section
      aria-labelledby="market-movers-heading"
      className="space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="market-movers-heading"
            className="text-sm font-semibold text-text"
          >
            Top gainers and losers
          </h2>

          <p className="mt-1 text-xs text-secondary">
            Top 100 by market cap · Minimum market cap: $10M
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isFetching && (
            <span className="text-xs text-secondary">
              Updating...
            </span>
          )}

          <DataSourceBadge
            source={source}
            fetchedAt={fetchedAt}
          />
        </div>
      </div>

      {error !== null && error !== undefined && (
        <p role="status" className="text-xs text-warning">
          The latest refresh failed. Showing the last available response.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <RankingCard
          title="🚀 Top Gainers"
          coins={gainers}
          direction="gainer"
        />

        <RankingCard
          title="📉 Top Losers"
          coins={losers}
          direction="loser"
        />
      </div>
    </section>
  );
}