// src/components/charts/MonthlyActivityChart.tsx

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
import type { ActivityPoint } from "@/lib/analytics/calc";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface MonthlyActivityChartProps {
  points: ActivityPoint[];
  height?: number;
}

export default function MonthlyActivityChart({
  points,
  height = 260,
}: MonthlyActivityChartProps) {
  if (points.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ height }}
      >
        <span className="text-3xl mb-2">📊</span>
        <p className="text-sm text-secondary">
          No trading activity recorded yet.
        </p>
      </div>
    );
  }

  const data = {
    labels: points.map((p) => p.month),
    datasets: [
      {
        label: "Buys",
        data: points.map((p) => p.buys),
        backgroundColor: "rgba(34,197,94,0.75)",
        borderRadius: 4,
      },
      {
        label: "Sells",
        data: points.map((p) => p.sells),
        backgroundColor: "rgba(239,68,68,0.75)",
        borderRadius: 4,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#94A3B8",
          usePointStyle: true,
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: "#111827",
        titleColor: "#F8FAFC",
        bodyColor: "#94A3B8",
        borderColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        callbacks: {
          label: (context) =>
            ` ${context.dataset.label}: $${Number(context.raw).toLocaleString(
              undefined,
              { maximumFractionDigits: 0 }
            )}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#94A3B8" },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: {
          color: "#94A3B8",
          callback: (value) => "$" + Number(value).toLocaleString(),
        },
      },
    },
  };

  return (
    <div className="w-full" style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  );
}
