// src/components/charts/InvestmentTimelineChart.tsx
//
// Cumulative net-invested line. Feeds both the Dashboard (small card) and
// the Analytics page (full card). Takes `points` as a prop so the caller
// controls the data window and re-render cadence.
//
// When `points` is empty (no transactions), renders an honest empty state
// instead of an empty grid — the difference between "broken" and "you
// haven't done anything yet" is important for first-run UX.

"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { InvestmentPoint } from "@/lib/analytics/calc";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface InvestmentTimelineChartProps {
  points: InvestmentPoint[];
  height?: number;
}

export default function InvestmentTimelineChart({
  points,
  height = 260,
}: InvestmentTimelineChartProps) {
  if (points.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ height }}
      >
        <span className="text-3xl mb-2">📈</span>
        <p className="text-sm text-secondary">
          Add transactions to see your investment timeline.
        </p>
      </div>
    );
  }

  const data = {
    labels: points.map((p) => p.month),
    datasets: [
      {
        label: "Net invested",
        data: points.map((p) => p.cumulative),
        fill: true,
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#3B82F6",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#111827",
        titleColor: "#F8FAFC",
        bodyColor: "#94A3B8",
        borderColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        callbacks: {
          label: (context: any) =>
            `$${(context.raw as number).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#94A3B8" },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: {
          color: "#94A3B8",
          callback: (v: any) => "$" + Number(v).toLocaleString(),
        },
      },
    },
  };

  return (
    <div className="w-full" style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
}