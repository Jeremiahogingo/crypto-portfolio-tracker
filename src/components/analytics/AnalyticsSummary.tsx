// src/components/analytics/AnalyticsSummary.tsx
//
// Summary cards at the top of the Analytics page.
//
// Net Invested is ledger-derived and remains available even when prices
// are missing. Current value and unrealised P&L require complete live
// valuation. Best performer is selected only from live-priced positions.

"use client";

import StatCard from "@/components/dashboard/StatCard";
import {
  formatPrice,
  formatSignedCurrency,
  formatPercent,
} from "@/utils/format";
import type { AnalyticsSummary as Summary } from "@/lib/analytics/calc";

interface AnalyticsSummaryProps {
  summary: Summary;
}

export default function AnalyticsSummary({
  summary,
}: AnalyticsSummaryProps) {
  const currentValue =
    summary.currentValue !== null
      ? formatPrice(summary.currentValue)
      : summary.knownValue > 0
        ? formatPrice(summary.knownValue)
        : "Unavailable";

  const currentValueTitle =
    summary.currentValue !== null
      ? "Current Value"
      : summary.knownValue > 0
        ? "Known Value (partial)"
        : "Current Value";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Net Invested"
        value={formatPrice(summary.totalInvested)}
        icon="💵"
        positive
      />

      <StatCard
        title={currentValueTitle}
        value={currentValue}
        icon="💰"
        positive
      />

      <StatCard
        title="Unrealised P&L"
        value={
          summary.totalPnl === null
            ? "Unavailable"
            : formatSignedCurrency(summary.totalPnl)
        }
        change={
          summary.totalPnlPercent !== null
            ? formatPercent(summary.totalPnlPercent)
            : undefined
        }
        positive={
          summary.totalPnl === null ||
          summary.totalPnl >= 0
        }
        icon="🏆"
      />

      <StatCard
        title={
          summary.bestPerformer
            ? summary.hasCompleteValuation
              ? `Best · ${summary.bestPerformer.symbol}`
              : `Best (priced) · ${summary.bestPerformer.symbol}`
            : "Best Performer"
        }
        value={
          summary.bestPerformer
            ? formatPercent(summary.bestPerformer.roiPercent)
            : "—"
        }
        icon="🚀"
        positive={
          summary.bestPerformer
            ? summary.bestPerformer.roiPercent >= 0
            : true
        }
      />
    </div>
  );
}