"use client";

import { useState } from "react";
import SearchInput from "@/components/ui/SearchInput";
import Badge from "@/components/ui/Badge";
import { allCoins } from "@/mock/market";

export default function MarketsTable() {
  const [search, setSearch] = useState("");

  const filteredCoins = allCoins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(search.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text">All Cryptocurrencies</h3>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search coins..."
          className="w-64"
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
              <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">Volume(24h)</th>
            </tr>
          </thead>
          <tbody>
            {filteredCoins.map((coin, index) => (
              <tr
                key={coin.symbol}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-4 text-sm text-secondary">{index + 1}</td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{coin.logo}</span>
                    <div>
                      <p className="text-sm font-medium text-text">{coin.name}</p>
                      <p className="text-xs text-secondary">{coin.symbol}</p>
                    </div>
                  </div>
                </td>
                <td className="text-right text-sm text-text py-4">
                  ${coin.price.toLocaleString()}
                </td>
                <td className="text-right py-4">
                  <Badge variant={coin.change24h > 0 ? "success" : "danger"}>
                    {coin.change24h > 0 ? "+" : ""}
                    {coin.change24h}%
                  </Badge>
                </td>
                <td className="text-right text-sm text-text py-4">
                  ${(coin.marketCap / 1e9).toFixed(2)}B
                </td>
                <td className="text-right text-sm text-text py-4">
                  ${(coin.volume24h / 1e9).toFixed(2)}B
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}