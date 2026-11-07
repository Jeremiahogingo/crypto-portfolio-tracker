// src/components/analytics/AnalyticsSummary.tsx
//
// Four summary cards at the top of the Analytics page.
//
// Reuses StatCard from the dashboard so visual language stays consistent.
// "Net Invested" can legitimately be negative (user has sold more than
// they've bought) — formatPrice handles the minus sign, no special casing.

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

export default function AnalyticsSummary({ summary }: AnalyticsSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Net Invested"
        value={formatPrice(summary.totalInvested)}
        icon="💵"
        positive
      />
      <StatCard
        title="Current Value"
        value={formatPrice(summary.currentValue)}
        icon="💰"
        positive
      />
      <StatCard
        title="Unrealised P&L"
        value={formatSignedCurrency(summary.totalPnl)}
        change={
          summary.currentValue > 0
            ? formatPercent(summary.totalPnlPercent)
            : undefined
        }
        positive={summary.totalPnl >= 0}
        icon="🏆"
      />
      <StatCard
        title={
          summary.bestPerformer
            ? `Best · ${summary.bestPerformer.symbol}`
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