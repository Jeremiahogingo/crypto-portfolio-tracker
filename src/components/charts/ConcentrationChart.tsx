// src/components/charts/ConcentrationChart.tsx

"use client";

import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartOptions } from "chart.js";
import type { ConcentrationEntry } from "@/lib/analytics/calc";

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = [
  "#F7931A",
  "#627EEA",
  "#9945FF",
  "#F0B90B",
  "#22C55E",
  "#3B82F6",
  "#EF4444",
  "#94A3B8",
  "#F59E0B",
  "#A855F7",
];

interface ConcentrationChartProps {
  entries: ConcentrationEntry[];
  height?: number;
}

export default function ConcentrationChart({
  entries,
  height = 320,
}: ConcentrationChartProps) {
  if (entries.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ height }}
      >
        <span className="text-3xl mb-2">🥧</span>
        <p className="text-sm text-secondary">
          Add holdings to see your concentration.
        </p>
      </div>
    );
  }

  const data = {
    labels: entries.map((e) => e.symbol),
    datasets: [
      {
        data: entries.map((e) => e.value),
        backgroundColor: entries.map((_, i) => PALETTE[i % PALETTE.length]),
        borderColor: "#111827",
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#94A3B8",
          padding: 10,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "#111827",
        titleColor: "#F8FAFC",
        bodyColor: "#94A3B8",
        borderColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const entry = entries[context.dataIndex];

            // Guard against an index that no longer matches the source entries.
            if (!entry) return "";

            return ` ${entry.symbol}: $${entry.value.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })} (${entry.percent.toFixed(1)}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="w-full" style={{ height }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}
