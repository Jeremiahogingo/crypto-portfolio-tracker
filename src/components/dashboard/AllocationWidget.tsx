// src/components/dashboard/AllocationWidget.tsx
//
// Allocation doughnut. Computed from real holdings + live prices.
//
// When there are zero holdings (or zero total value — all delisted coins),
// shows an empty state instead of an empty doughnut. An empty doughnut
// looks like a rendering bug; a proper message is honest.
//
// Colors cycle through a fixed palette so the same coin gets the same
// colour every reload. Palette length (8) covers typical portfolios;
// larger ones repeat colours, which is acceptable for a small chart.

"use client";

import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import Card from "@/components/ui/Card";
import { useHoldingsWithPrices } from "@/hooks/useHoldingsWithPrices";
import { formatPrice } from "@/utils/format";
import type { Holding } from "@/db/schema";

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = [
  "#F7931A", // Bitcoin orange
  "#627EEA", // Ethereum blue
  "#9945FF", // Solana purple
  "#F0B90B", // BNB yellow
  "#22C55E", // Green
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#94A3B8", // Slate
];

interface AllocationWidgetProps {
  rawHoldings: Holding[];
}

export default function AllocationWidget({ rawHoldings }: AllocationWidgetProps) {
  const { allocation, isLoadingPrices } = useHoldingsWithPrices(rawHoldings);

  const data = useMemo(
    () => ({
      labels: allocation.map((a) => a.symbol),
      datasets: [
        {
          data: allocation.map((a) => a.value),
          backgroundColor: allocation.map(
            (_, i) => PALETTE[i % PALETTE.length]
          ),
          borderColor: "#111827",
          borderWidth: 2,
        },
      ],
    }),
    [allocation]
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#94A3B8",
          padding: 12,
          usePointStyle: true,
          pointStyle: "circle" as const,
        },
      },
      tooltip: {
        backgroundColor: "#111827",
        titleColor: "#F8FAFC",
        bodyColor: "#94A3B8",
        borderColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const value = context.raw as number;
            return ` ${context.label}: ${formatPrice(value)}`;
          },
        },
      },
    },
  };

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text mb-4">Asset Allocation</h3>
      {allocation.length === 0 ? (
        <div className="h-[260px] flex flex-col items-center justify-center text-center">
          <span className="text-3xl mb-2">📊</span>
          <p className="text-sm text-secondary">
            {isLoadingPrices && rawHoldings.length > 0
              ? "Loading prices…"
              : "Add holdings to see your allocation"}
          </p>
        </div>
      ) : (
        <div className="w-full" style={{ height: 260 }}>
          <Doughnut data={data} options={options} />
        </div>
      )}
    </Card>
  );
}