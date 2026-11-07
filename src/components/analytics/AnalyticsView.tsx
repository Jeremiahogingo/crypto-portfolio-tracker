// src/components/analytics/AnalyticsView.tsx
//
// Client orchestrator for the Analytics page.
//
// All analytics computations run here (client-side) because they depend on
// live prices — the same reason the Portfolio and Dashboard views are
// client components. The transaction-derived charts (timeline, activity)
// technically could run server-side, but keeping them here means one
// canonical render path and one update trigger (price refresh) instead of
// two. Small pure functions, no network — the cost of running them
// client-side is nanoseconds.
//
// Ordering of useMemo calls mirrors the data dependency graph:
//   holdings ← prices ← prices hook
//   summary, performance, concentration ← holdings
//   timeline, activity ← transactions (independent of prices)

"use client";

import { useMemo } from "react";
import Card from "@/components/ui/Card";
import AnalyticsSummary from "./AnalyticsSummary";
import InvestmentTimelineChart from "@/components/charts/InvestmentTimelineChart";
import MonthlyActivityChart from "@/components/charts/MonthlyActivityChart";
import AssetPerformanceChart from "@/components/charts/AssetPerformanceChart";
import ConcentrationChart from "@/components/charts/ConcentrationChart";
import { useHoldingsWithPrices } from "@/hooks/useHoldingsWithPrices";
import {
  computeAnalyticsSummary,
  computeInvestmentTimeline,
  computeMonthlyActivity,
  computeAssetPerformance,
  computeConcentration,
} from "@/lib/analytics/calc";
import type { Holding, Transaction } from "@/db/schema";

interface AnalyticsViewProps {
  initialHoldings: Holding[];
  initialTransactions: Transaction[];
}

export default function AnalyticsView({
  initialHoldings,
  initialTransactions,
}: AnalyticsViewProps) {
  const { holdings, isLoadingPrices } = useHoldingsWithPrices(initialHoldings);

  const summary = useMemo(
    () => computeAnalyticsSummary(holdings, initialTransactions),
    [holdings, initialTransactions]
  );

  const investmentPoints = useMemo(
    () => computeInvestmentTimeline(initialTransactions),
    [initialTransactions]
  );

  const activityPoints = useMemo(
    () => computeMonthlyActivity(initialTransactions),
    [initialTransactions]
  );

  const performanceEntries = useMemo(
    () => computeAssetPerformance(holdings),
    [holdings]
  );

  const concentrationEntries = useMemo(
    () => computeConcentration(holdings, 8),
    [holdings]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Analytics</h1>
        {isLoadingPrices && (
          <span className="text-xs text-secondary">Updating prices…</span>
        )}
      </div>

      <AnalyticsSummary summary={summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-text mb-4">
            Investment Timeline
          </h3>
          <InvestmentTimelineChart points={investmentPoints} />
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-text mb-4">
            Monthly Activity
          </h3>
          <MonthlyActivityChart points={activityPoints} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-text mb-4">
            Asset Performance (ROI)
          </h3>
          <AssetPerformanceChart entries={performanceEntries} />
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-text mb-4">
            Concentration
          </h3>
          <ConcentrationChart entries={concentrationEntries} />
        </Card>
      </div>
    </div>
  );
}