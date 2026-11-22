// src/components/tables/MarketsTable.tsx
//
// Market leaderboard with:
// - Server-backed ordering and pagination.
// - Client-side search scoped to the currently loaded page.
// - Previous-page data retained during transitions.
// - Explicit loading, empty and error states.
// - Keyboard-accessible horizontal scrolling and semantic table headers.

"use client";

import { useMemo, useState } from "react";

import SearchInput from "@/components/ui/SearchInput";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import CoinLogo from "@/components/ui/CoinLogo";

import type { MarketCoin, MarketOrder } from "@/types/market";

import {
  formatPrice,
  formatPercent,
  formatCompactCurrency,
} from "@/utils/format";

interface MarketsTableProps {
  coins: MarketCoin[];

  isLoading: boolean;
  isFetching: boolean;
  isPlaceholderData: boolean;
  error: unknown;

  page: number;
  perPage: number;
  order: MarketOrder;
  hasNextPage: boolean;

  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onOrderChange: (order: MarketOrder) => void;
  onRetry: () => void;
}

const PAGE_SIZES = [10, 25, 50, 100] as const;

const ORDER_OPTIONS: Array<{
  value: MarketOrder;
  label: string;
}> = [
  {
    value: "market_cap_desc",
    label: "Market cap: highest first",
  },
  {
    value: "market_cap_asc",
    label: "Market cap: lowest first",
  },
  {
    value: "volume_desc",
    label: "24h volume: highest first",
  },
  {
    value: "volume_asc",
    label: "24h volume: lowest first",
  },
  {
    value: "id_asc",
    label: "Coin ID: A–Z",
  },
  {
    value: "id_desc",
    label: "Coin ID: Z–A",
  },
];

export default function MarketsTable({
  coins,
  isLoading,
  isFetching,
  isPlaceholderData,
  error,
  page,
  perPage,
  order,
  hasNextPage,
  onPageChange,
  onPageSizeChange,
  onOrderChange,
  onRetry,
}: MarketsTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return coins;

    return coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(query) ||
        coin.symbol.toLowerCase().includes(query) ||
        coin.id.toLowerCase().includes(query),
    );
  }, [coins, search]);

  const isTransitioning = isFetching || isPlaceholderData;
  const hasError = error !== null && error !== undefined;

  return (
    <section aria-labelledby="markets-table-heading">
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="markets-table-heading"
              className="text-sm font-semibold text-text"
            >
              All cryptocurrencies
            </h2>

            {!isLoading && (
              <p
                className="mt-1 text-xs text-secondary"
                aria-live="polite"
              >
                {filtered.length} of {coins.length} assets on this page
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="market-sort"
              className="text-xs text-secondary"
            >
              Sort by
            </label>

            <select
              id="market-sort"
              value={order}
              onChange={(event) =>
                onOrderChange(event.target.value as MarketOrder)
              }
              disabled={isTransitioning}
              className="max-w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            >
              {ORDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label
              htmlFor="market-page-size"
              className="text-xs text-secondary"
            >
              Rows
            </label>

            <select
              id="market-page-size"
              value={perPage}
              onChange={(event) =>
                onPageSizeChange(Number(event.target.value))
              }
              disabled={isTransitioning}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search this page by name, symbol or ID..."
            ariaLabel="Search the current market page by coin name, symbol, or ID"
            className="w-full sm:max-w-sm"
          />

          {isTransitioning && (
            <span
              role="status"
              className="text-xs text-secondary"
            >
              Loading market page...
            </span>
          )}
        </div>
      </div>

      {hasError && coins.length > 0 && (
        <div
          role="status"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/20 bg-warning/10 px-3 py-2"
        >
          <p className="text-xs text-warning">
            The latest request failed. Showing the last available results.
          </p>

          <button
            type="button"
            onClick={onRetry}
            disabled={isFetching}
            className="text-xs font-semibold text-text underline underline-offset-2 disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      )}

      <div
        role="region"
        aria-label="Cryptocurrency market data table"
        tabIndex={0}
        className="overflow-x-auto rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <table className="w-full min-w-[760px]">
          <caption className="sr-only">
            Cryptocurrency market data. Search filters the currently
            loaded page. Sorting and pagination are performed by the server.
          </caption>

          <thead>
            <tr className="border-b border-border">
              <th
                scope="col"
                className="py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary"
              >
                Rank
              </th>

              <th
                scope="col"
                className="py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary"
              >
                Asset
              </th>

              <th
                scope="col"
                className="py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary"
              >
                Price
              </th>

              <th
                scope="col"
                className="py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary"
              >
                24h change
              </th>

              <th
                scope="col"
                className="py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary"
              >
                Market cap
              </th>

              <th
                scope="col"
                className="py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary"
              >
                Volume (24h)
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading &&
              [0, 1, 2, 3, 4, 5].map((index) => (
                <tr key={index}>
                  <td colSpan={6} className="py-4">
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))}

            {!isLoading && hasError && coins.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <p role="alert" className="text-sm text-secondary">
                    Market data could not be loaded.
                  </p>

                  <button
                    type="button"
                    onClick={onRetry}
                    disabled={isFetching}
                    className="mt-3 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text hover:bg-surface-muted disabled:opacity-50"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            )}

            {!isLoading &&
              filtered.length === 0 &&
              (coins.length > 0 || !hasError) && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-sm text-secondary"
                  >
                    {coins.length === 0
                      ? "No market data is available for this page."
                      : `No assets on this page match "${search}".`}
                  </td>
                </tr>
              )}

            {!isLoading &&
              filtered.map((coin) => (
                <tr
                  key={coin.id}
                  className="border-b border-border transition-colors hover:bg-surface-muted"
                >
                  <td className="py-4 text-sm text-secondary">
                    {coin.rank > 0 ? coin.rank : "—"}
                  </td>

                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <CoinLogo
                        src={coin.logoUrl}
                        alt={coin.name}
                        size="sm"
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text">
                          {coin.name}
                        </p>

                        <p className="text-xs text-secondary">
                          {coin.symbol}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 text-right text-sm text-text">
                    {coin.price === null
                      ? "—"
                      : formatPrice(coin.price)}
                  </td>

                  <td className="py-4 text-right">
                    {coin.change24h === null ? (
                      <span className="text-sm text-secondary">
                        —
                      </span>
                    ) : (
                      <Badge
                        variant={
                          coin.change24h >= 0
                            ? "success"
                            : "danger"
                        }
                      >
                        {formatPercent(coin.change24h)}
                      </Badge>
                    )}
                  </td>

                  <td className="py-4 text-right text-sm text-text">
                    {formatCompactCurrency(coin.marketCap)}
                  </td>

                  <td className="py-4 text-right text-sm text-text">
                    {formatCompactCurrency(coin.volume24h)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-secondary">
          Page {page}
          {search.trim()
            ? ` · ${filtered.length} matching assets on this page`
            : ` · ${coins.length} assets`}
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous market page"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isTransitioning}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span
            aria-current="page"
            aria-label={`Page ${page}`}
            className="min-w-8 text-center text-sm font-medium text-text"
          >
            {page}
          </span>

          <button
            type="button"
            aria-label="Next market page"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage || isTransitioning}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}