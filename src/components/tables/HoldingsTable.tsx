// src/components/tables/HoldingsTable.tsx
//
// Presentational holdings table.
//
// Live prices can be used for verified P&L.
// Fallback prices are indicative only.
// Missing prices are rendered as unavailable, never as zero.

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
  /** When true, the Actions column is hidden. */
  readOnly?: boolean;
}

function unavailableLabel(isLoading: boolean): string {
  return isLoading ? "Loading…" : "Unavailable";
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
            <th className="py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
              Coin
            </th>

            <th className="py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary">
              Price
            </th>

            <th className="py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary">
              Quantity
            </th>

            <th className="py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary">
              Value
            </th>

            <th className="py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary">
              24H
            </th>

            <th className="py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary">
              P&amp;L
            </th>

            {!readOnly && (
              <th className="py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary">
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {holdings.map((holding) => {
            const isFallback = holding.priceStatus === "fallback";
            const hasLivePrice = holding.priceStatus === "live";

            const priceDisplay =
              holding.currentPrice === null
                ? unavailableLabel(isLoadingPrices)
                : isFallback
                  ? `≈ ${formatPrice(holding.currentPrice)}`
                  : formatPrice(holding.currentPrice);

            const valueDisplay =
              holding.currentValue === null
                ? unavailableLabel(isLoadingPrices)
                : isFallback
                  ? `≈ ${formatPrice(holding.currentValue)}`
                  : formatPrice(holding.currentValue);

            const pnlIsAvailable =
              hasLivePrice && holding.pnl !== null;

            return (
              <tr
                key={holding.id}
                className="border-b border-white/5 transition-colors hover:bg-white/[0.02]"
              >
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-sm font-medium">
                      {holding.symbol.slice(0, 2)}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">
                        {holding.symbol}
                      </p>

                      <p className="truncate text-xs text-secondary">
                        {holding.coinId}
                      </p>

                      {isFallback && (
                        <p
                          className="mt-0.5 text-xs text-warning"
                          title="This quote comes from fallback data and is not included in verified portfolio totals."
                        >
                          Indicative price
                        </p>
                      )}

                      {holding.priceStatus === "unavailable" && (
                        <p className="mt-0.5 text-xs text-secondary">
                          Price unavailable
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                <td className="py-4 text-right text-sm text-text">
                  {priceDisplay}
                </td>

                <td className="py-4 text-right text-sm text-text">
                  {formatQuantity(holding.quantity)}
                </td>

                <td className="py-4 text-right text-sm font-medium text-text">
                  {valueDisplay}
                </td>

                <td className="py-4 text-right">
                  {hasLivePrice && holding.change24h !== null ? (
                    <Badge
                      variant={
                        holding.change24h >= 0 ? "success" : "danger"
                      }
                    >
                      {formatPercent(holding.change24h)}
                    </Badge>
                  ) : (
                    <span className="text-sm text-secondary">—</span>
                  )}
                </td>

                <td className="py-4 text-right">
                  <div className="flex flex-col items-end">
                    {pnlIsAvailable ? (
                      <>
                        <span
                          className={`text-sm ${
                            holding.pnl! >= 0
                              ? "text-success"
                              : "text-danger"
                          }`}
                        >
                          {formatSignedCurrency(holding.pnl!)}
                        </span>

                        <span className="text-xs text-secondary">
                          {holding.pnlPercent === null
                            ? "—"
                            : formatPercent(holding.pnlPercent)}
                        </span>
                      </>
                    ) : (
                      <span
                        className="text-sm text-secondary"
                        title="Unrealised P&L requires a verified live market quote."
                      >
                        —
                      </span>
                    )}
                  </div>
                </td>

                {!readOnly && (
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(holding)}
                        aria-label={`Edit ${holding.symbol}`}
                      >
                        ✏️
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete?.(holding)}
                        aria-label={`Delete ${holding.symbol}`}
                      >
                        🗑️
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}