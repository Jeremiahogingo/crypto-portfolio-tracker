// src/components/charts/AnalyticsSummary.tsx
//
// Summary cards at the top of the Analytics page.
//
// Net Invested is ledger-derived and remains available independently of
// market prices. Current value and unrealised P&L are shown as partial or
// unavailable when verified market valuation is incomplete.

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
  const currentValueDisplay =
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
        value={currentValueDisplay}
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
          summary.totalPnl === null || summary.totalPnl >= 0
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