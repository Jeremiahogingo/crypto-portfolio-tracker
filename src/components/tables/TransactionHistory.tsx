// src/components/tables/TransactionHistory.tsx
//
// Presentational transaction ledger. Receives rows + callbacks; no hooks.
//
// Filters:
//   • Type — All / Buys / Sells (chips, like the news categories)
//   • Coin — search box (matches symbol or coinId)
// Both are client-side; the ledger is capped at 100 rows, so no need to
// round-trip to the server for filtering.
//
// Delete: each row has a 🗑️ that calls onDelete — the parent owns the
// confirmation modal so this component stays simple.

"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import SearchInput from "@/components/ui/SearchInput";
import EmptyState from "@/components/ui/EmptyState";
import {
  formatPrice,
  formatQuantity,
  formatDateTime,
} from "@/utils/format";
import type { Transaction } from "@/db/schema";

interface TransactionHistoryProps {
  transactions: Transaction[];
  onDelete?: (transaction: Transaction) => void;
}

type TypeFilter = "all" | "buy" | "sell";

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "buy", label: "Buys" },
  { value: "sell", label: "Sells" },
];

export default function TransactionHistory({
  transactions,
  onDelete,
}: TransactionHistoryProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchesType = typeFilter === "all" || t.type === typeFilter;
      const matchesSearch =
        !q ||
        t.symbol.toLowerCase().includes(q) ||
        t.coinId.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [transactions, typeFilter, search]);

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon="📒"
        title="No transactions yet"
        description="Record your first buy or sell to start building your ledger."
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                typeFilter === f.value
                  ? "bg-primary text-white"
                  : "bg-surface border border-white/5 text-secondary hover:text-text"
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="text-xs text-secondary ml-2">
            {filtered.length} of {transactions.length}
          </span>
        </div>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by coin…"
          className="w-full sm:w-56"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider py-3">
                Type
              </th>
              <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider py-3">
                Coin
              </th>
              <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">
                Quantity
              </th>
              <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">
                Price
              </th>
              <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">
                Total
              </th>
              <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">
                Date
              </th>
              {onDelete && (
                <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={onDelete ? 7 : 6}
                  className="py-12 text-center text-sm text-secondary"
                >
                  No transactions match your filters.
                </td>
              </tr>
            )}
            {filtered.map((t) => (
              <tr
                key={t.id}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-4">
                  <Badge variant={t.type === "buy" ? "success" : "danger"}>
                    {t.type === "buy" ? "Buy" : "Sell"}
                  </Badge>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-medium">
                      {t.symbol.slice(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text">
                        {t.symbol}
                      </p>
                      <p className="text-xs text-secondary truncate">
                        {t.coinId}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="text-right text-sm text-text py-4">
                  {formatQuantity(Number(t.quantity))}
                </td>
                <td className="text-right text-sm text-text py-4">
                  {formatPrice(Number(t.pricePerUnit))}
                </td>
                <td className="text-right text-sm font-medium text-text py-4">
                  {formatPrice(Number(t.totalValue))}
                </td>
                <td className="text-right text-xs text-secondary py-4 whitespace-nowrap">
                  {formatDateTime(t.executedAt)}
                </td>
                {onDelete && (
                  <td className="text-right py-4">
                    <button
                      onClick={() => onDelete(t)}
                      className="text-secondary hover:text-danger transition-colors"
                      aria-label={`Delete ${t.type} of ${t.symbol}`}
                    >
                      🗑️
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}