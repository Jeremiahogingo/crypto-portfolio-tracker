// src/components/charts/AssetPerformanceChart.tsx

"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartOptions } from "chart.js";
import { Bar } from "react-chartjs-2";
import type { PerformanceEntry } from "@/lib/analytics/calc";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface AssetPerformanceChartProps {
  entries: PerformanceEntry[];
  height?: number;
}

export default function AssetPerformanceChart({
  entries,
  height = 320,
}: AssetPerformanceChartProps) {
  if (entries.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ height }}
      >
        <span className="text-3xl mb-2">📉</span>
        <p className="text-sm text-secondary">
          Add holdings to compare performance across coins.
        </p>
      </div>
    );
  }

  const data = {
    labels: entries.map((e) => e.symbol),
    datasets: [
      {
        label: "ROI %",
        data: entries.map((e) => e.roiPercent),
        backgroundColor: entries.map((e) =>
          e.roiPercent >= 0 ? "rgba(34,197,94,0.8)" : "rgba(239,68,68,0.8)"
        ),
        borderRadius: 4,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
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
          label: (context) =>
            `${Number(context.raw).toFixed(2)}% ROI`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: {
          color: "#94A3B8",
          callback: (value) => `${value}%`,
        },
      },
      y: {
        grid: { display: false },
        ticks: { color: "#94A3B8" },
      },
    },
  };

  return (
    <div className="w-full" style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  );
}
