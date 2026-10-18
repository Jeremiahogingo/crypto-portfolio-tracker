// src/components/tables/MarketsTable.tsx
//
// Full markets table with client-side search. Receives the coin list
// from the page — the page is the single fetch point for the /coins/markets
// data, which is then shared with GainersLosers.
//
// Search filters name + symbol, case-insensitively. Purely local — no
// network traffic on keystroke.

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

export default function MarketsTable({ coins, isLoading }: MarketsTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return coins;
    return coins.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [coins, search]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h3 className="text-sm font-semibold text-text">
          All Cryptocurrencies
          {!isLoading && (
            <span className="text-xs font-normal text-secondary ml-2">
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
              <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider py-3">#</th>
              <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider py-3">Name</th>
              <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">Price</th>
              <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">24h %</th>
              <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">Market Cap</th>
              <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">Volume (24h)</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              [0, 1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-white/5">
                  <td colSpan={6} className="py-4">
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))}

            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-secondary">
                  No coins match "{search}".
                </td>
              </tr>
            )}

            {!isLoading &&
              filtered.map((coin) => (
                <tr
                  key={coin.id}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-4 text-sm text-secondary">{coin.rank}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <CoinLogo src={coin.logoUrl} alt={coin.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text truncate">
                          {coin.name}
                        </p>
                        <p className="text-xs text-secondary">{coin.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right text-sm text-text py-4">
                    {formatPrice(coin.price)}
                  </td>
                  <td className="text-right py-4">
                    <Badge variant={coin.change24h >= 0 ? "success" : "danger"}>
                      {formatPercent(coin.change24h)}
                    </Badge>
                  </td>
                  <td className="text-right text-sm text-text py-4">
                    {formatCompactCurrency(coin.marketCap)}
                  </td>
                  <td className="text-right text-sm text-text py-4">
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