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
import { useTheme } from "@/context/ThemeContext";
import {
  getChartTheme,
  getCartesianChartOptions,
} from "@/utils/chartTheme";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface AssetPerformanceChartProps {
  entries: PerformanceEntry[];
  height?: number;
}

export default function AssetPerformanceChart({
  entries,
  height = 320,
}: AssetPerformanceChartProps) {
  const { theme } = useTheme();
  const chartTheme = getChartTheme(theme);

  if (entries.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ height }}
      >
        <span className="mb-2 text-3xl">📉</span>
        <p className="text-sm text-secondary">
          Add holdings to compare performance across coins.
        </p>
      </div>
    );
  }

  const data = {
    labels: entries.map((entry) => entry.symbol),
    datasets: [
      {
        label: "ROI %",
        data: entries.map((entry) => entry.roiPercent),
        backgroundColor: entries.map((entry) =>
          entry.roiPercent >= 0
            ? "rgba(34,197,94,0.8)"
            : "rgba(239,68,68,0.8)",
        ),
        borderRadius: 4,
      },
    ],
  };

  const baseOptions = getCartesianChartOptions<"bar">(chartTheme);

  const options: ChartOptions<"bar"> = {
    ...baseOptions,
    indexAxis: "y",

    plugins: {
      ...baseOptions.plugins,

      legend: {
        ...baseOptions.plugins?.legend,
        display: false,
      },

      tooltip: {
        ...baseOptions.plugins?.tooltip,
        callbacks: {
          label: (context) => `${Number(context.raw).toFixed(2)}% ROI`,
        },
      },
    },

    scales: {
      ...baseOptions.scales,

      x: {
        ...baseOptions.scales?.x,
        ticks: {
          ...baseOptions.scales?.x?.ticks,
          callback: (value) => `${value}%`,
        },
      },

      y: {
        ...baseOptions.scales?.y,
        grid: {
          ...baseOptions.scales?.y?.grid,
          display: false,
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