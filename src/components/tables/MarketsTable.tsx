// src/components/tables/MarketsTable.tsx
//
// Markets table with explicit unavailable-price handling.

"use client";

import { useState, useMemo } from "react";
import SearchInput from "@/components/ui/SearchInput";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import CoinLogo from "@/components/ui/CoinLogo";
import type { MarketCoin } from "@/types/market";
import {
  formatPrice,
  formatPercent,
  formatCompactCurrency,
} from "@/utils/format";

interface MarketsTableProps {
  coins: MarketCoin[];
  isLoading: boolean;
}

export default function MarketsTable({
  coins,
  isLoading,
}: MarketsTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return coins;

    return coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(query) ||
        coin.symbol.toLowerCase().includes(query)
    );
  }, [coins, search]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-text">
          All Cryptocurrencies

          {!isLoading && (
            <span className="ml-2 text-xs font-normal text-secondary">
              ({filtered.length})
            </span>
          )}
        </h3>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search coins..."
          className="w-full sm:w-64"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                #
              </th>
              <th className="py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                Name
              </th>
              <th className="py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary">
                Price
              </th>
              <th className="py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary">
                24h %
              </th>
              <th className="py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary">
                Market Cap
              </th>
              <th className="py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary">
                Volume (24h)
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading &&
              [0, 1, 2, 3, 4, 5].map((index) => (
                <tr key={index} className="border-b border-white/5">
                  <td colSpan={6} className="py-4">
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))}

            {!isLoading && filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center text-sm text-secondary"
                >
                  No coins match &quot;{search}&quot;.
                </td>
              </tr>
            )}

            {!isLoading &&
              filtered.map((coin) => (
                <tr
                  key={coin.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
                >
                  <td className="py-4 text-sm text-secondary">
                    {coin.rank}
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
                      <span className="text-sm text-secondary">—</span>
                    ) : (
                      <Badge
                        variant={
                          coin.change24h >= 0 ? "success" : "danger"
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
    </div>
  );
}