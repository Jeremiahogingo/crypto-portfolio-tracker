// src/components/tables/TransactionHistory.tsx
//
// Presentational transaction ledger.
//
// Filters:
// - Type: all, buys, sells, or adjustments.
// - Coin: search by symbol, coin ID, or transaction notes.
//
// Adjustment events are first-class ledger entries, but they are not trades.
// They receive a neutral badge and display their recorded position basis.

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

type TypeFilter = "all" | Transaction["type"];

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "buy", label: "Buys" },
  { value: "sell", label: "Sells" },
  { value: "adjustment", label: "Adjustments" },
];

const TRANSACTION_LABELS: Record<Transaction["type"], string> = {
  buy: "Buy",
  sell: "Sell",
  adjustment: "Adjustment",
};

const TRANSACTION_VARIANTS: Record<
  Transaction["type"],
  "success" | "danger" | "neutral"
> = {
  buy: "success",
  sell: "danger",
  adjustment: "neutral",
};

export default function TransactionHistory({
  transactions,
  onDelete,
}: TransactionHistoryProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesType =
        typeFilter === "all" || transaction.type === typeFilter;

      const matchesSearch =
        !query ||
        transaction.symbol.toLowerCase().includes(query) ||
        transaction.coinId.toLowerCase().includes(query) ||
        (transaction.notes?.toLowerCase().includes(query) ?? false);

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
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setTypeFilter(filter.value)}
              aria-pressed={typeFilter === filter.value}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                typeFilter === filter.value
                  ? "bg-primary text-white"
                  : "bg-surface border border-white/5 text-secondary hover:text-text"
              }`}
            >
              {filter.label}
            </button>
          ))}

          <span className="text-xs text-secondary ml-2 whitespace-nowrap">
            {filtered.length} of {transactions.length}
          </span>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by coin or note..."
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
                Price / Basis
              </th>
              <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">
                Value / Basis
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

            {filtered.map((transaction) => (
              <tr
                key={transaction.id}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-4">
                  <Badge variant={TRANSACTION_VARIANTS[transaction.type]}>
                    {TRANSACTION_LABELS[transaction.type]}
                  </Badge>
                </td>

                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-medium">
                      {transaction.symbol.slice(0, 2)}
                    </span>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text">
                        {transaction.symbol}
                      </p>

                      <p className="text-xs text-secondary truncate">
                        {transaction.coinId}
                      </p>

                      {transaction.notes && (
                        <p
                          className="text-xs text-secondary/80 truncate max-w-48"
                          title={transaction.notes}
                        >
                          {transaction.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                <td className="text-right text-sm text-text py-4">
                  {formatQuantity(Number(transaction.quantity))}
                </td>

                <td className="text-right text-sm text-text py-4">
                  {formatPrice(Number(transaction.pricePerUnit))}
                </td>

                <td className="text-right text-sm font-medium text-text py-4">
                  {formatPrice(Number(transaction.totalValue))}
                </td>

                <td className="text-right text-xs text-secondary py-4 whitespace-nowrap">
                  {formatDateTime(transaction.executedAt)}
                </td>

                {onDelete && (
                  <td className="text-right py-4">
                    <button
                      type="button"
                      onClick={() => onDelete(transaction)}
                      className="text-xs text-secondary hover:text-danger transition-colors"
                      aria-label={`Delete ${TRANSACTION_LABELS[transaction.type]} of ${transaction.symbol}`}
                    >
                      Delete
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
