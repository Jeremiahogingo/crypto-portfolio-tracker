// src/components/tables/HoldingsTable.tsx
//
// Holdings table. Purely presentational — receives enriched holdings with
// current prices already computed. Edit/Delete callbacks are optional so
// the table can render read-only (dashboard) or interactive (portfolio page).
//
// Row click doesn't navigate anywhere (yet) — the row is the display unit,
// and the edit/delete buttons are the actions. A detail view per holding
// is deferred; it's not needed to prove the app works.

"use client";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import {
  formatPrice,
  formatQuantity,
  formatSignedCurrency,
  formatPercent,
} from "@/utils/format";
import type { HoldingWithPrice } from "@/types/portfolio";

interface HoldingsTableProps {
  holdings: HoldingWithPrice[];
  isLoadingPrices?: boolean;
  onEdit?: (holding: HoldingWithPrice) => void;
  onDelete?: (holding: HoldingWithPrice) => void;
  onAdd?: () => void;
  /** When true, "Actions" column is hidden (used on dashboard). */
  readOnly?: boolean;
}

export default function HoldingsTable({
  holdings,
  isLoadingPrices = false,
  onEdit,
  onDelete,
  onAdd,
  readOnly = false,
}: HoldingsTableProps) {
  if (holdings.length === 0) {
    return (
      <EmptyState
        icon="📊"
        title="No holdings yet"
        description="Add your first coin to start tracking your portfolio."
        actionLabel={onAdd ? "Add holding" : undefined}
        onAction={onAdd}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider py-3">
              Coin
            </th>
            <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">
              Price
            </th>
            <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">
              Quantity
            </th>
            <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">
              Value
            </th>
            <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">
              24H
            </th>
            <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">
              P&amp;L
            </th>
            {!readOnly && (
              <th className="text-right text-xs font-medium text-secondary uppercase tracking-wider py-3">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr
              key={h.id}
              className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
            >
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm font-medium">
                    {h.symbol.slice(0, 2)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {h.symbol}
                    </p>
                    <p className="text-xs text-secondary truncate">{h.coinId}</p>
                  </div>
                </div>
              </td>
              <td className="text-right text-sm text-text py-4">
                {isLoadingPrices && h.currentPrice === 0 ? (
                  <span className="text-secondary">—</span>
                ) : (
                  formatPrice(h.currentPrice)
                )}
              </td>
              <td className="text-right text-sm text-text py-4">
                {formatQuantity(h.quantity)}
              </td>
              <td className="text-right text-sm font-medium text-text py-4">
                {isLoadingPrices && h.currentValue === 0 ? (
                  <span className="text-secondary">—</span>
                ) : (
                  formatPrice(h.currentValue)
                )}
              </td>
              <td className="text-right py-4">
                <Badge variant={h.change24h >= 0 ? "success" : "danger"}>
                  {formatPercent(h.change24h)}
                </Badge>
              </td>
              <td className="text-right py-4">
                <div className="flex flex-col items-end">
                  <span
                    className={`text-sm ${
                      h.pnl >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {formatSignedCurrency(h.pnl)}
                  </span>
                  <span className="text-xs text-secondary">
                    {formatPercent(h.pnlPercent)}
                  </span>
                </div>
              </td>
              {!readOnly && (
                <td className="text-right py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit?.(h)}
                      aria-label={`Edit ${h.symbol}`}
                    >
                      ✏️
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete?.(h)}
                      aria-label={`Delete ${h.symbol}`}
                    >
                      🗑️
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}