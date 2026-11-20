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
import { useTheme } from "@/context/ThemeContext";
import {
  getChartTheme,
  getCartesianChartOptions,
} from "@/utils/chartTheme";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface MonthlyActivityChartProps {
  points: ActivityPoint[];
  height?: number;
}

export default function MonthlyActivityChart({
  points,
  height = 260,
}: MonthlyActivityChartProps) {
  const { theme } = useTheme();
  const chartTheme = getChartTheme(theme);

  if (points.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ height }}
      >
        <span className="mb-2 text-3xl">📊</span>
        <p className="text-sm text-secondary">
          No trading activity recorded yet.
        </p>
      </div>
    );
  }

  const data = {
    labels: points.map((point) => point.month),
    datasets: [
      {
        label: "Buys",
        data: points.map((point) => point.buys),
        backgroundColor: "rgba(34,197,94,0.75)",
        borderRadius: 4,
      },
      {
        label: "Sells",
        data: points.map((point) => point.sells),
        backgroundColor: "rgba(239,68,68,0.75)",
        borderRadius: 4,
      },
    ],
  };

  const baseOptions = getCartesianChartOptions<"bar">(chartTheme);

  const options: ChartOptions<"bar"> = {
    ...baseOptions,

    plugins: {
      ...baseOptions.plugins,

      legend: {
        ...baseOptions.plugins?.legend,
        position: "bottom",
      },

      tooltip: {
        ...baseOptions.plugins?.tooltip,
        callbacks: {
          label: (context) =>
            ` ${context.dataset.label}: $${Number(context.raw).toLocaleString(
              undefined,
              { maximumFractionDigits: 0 },
            )}`,
        },
      },
    },

    scales: {
      ...baseOptions.scales,

      x: {
        ...baseOptions.scales?.x,
        grid: {
          ...baseOptions.scales?.x?.grid,
          display: false,
        },
      },

      y: {
        ...baseOptions.scales?.y,
        ticks: {
          ...baseOptions.scales?.y?.ticks,
          callback: (value) => `$${Number(value).toLocaleString()}`,
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