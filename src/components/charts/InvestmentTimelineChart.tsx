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
import type { ChartOptions } from "chart.js";
import { Line } from "react-chartjs-2";

import type { InvestmentPoint } from "@/lib/analytics/calc";
import { useTheme } from "@/context/ThemeContext";
import {
  getChartTheme,
  getCartesianChartOptions,
} from "@/utils/chartTheme";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

interface InvestmentTimelineChartProps {
  points: InvestmentPoint[];
  height?: number;
}

export default function InvestmentTimelineChart({
  points,
  height = 260,
}: InvestmentTimelineChartProps) {
  const { theme } = useTheme();
  const chartTheme = getChartTheme(theme);

  if (points.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ height }}
      >
        <span className="mb-2 text-3xl">📈</span>
        <p className="text-sm text-secondary">
          Add transactions to see your investment timeline.
        </p>
      </div>
    );
  }

  const data = {
    labels: points.map((point) => point.month),
    datasets: [
      {
        label: "Net invested",
        data: points.map((point) => point.cumulative),
        fill: true,
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#3B82F6",
      },
    ],
  };

  const baseOptions = getCartesianChartOptions<"line">(chartTheme);

  const options: ChartOptions<"line"> = {
    ...baseOptions,

    plugins: {
      ...baseOptions.plugins,

      legend: {
        ...baseOptions.plugins?.legend,
        display: false,
      },

      tooltip: {
        ...baseOptions.plugins?.tooltip,
        callbacks: {
          label: (context) =>
            `$${Number(context.raw).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}`,
        },
      },
    },

    scales: {
      ...baseOptions.scales,

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
      <Line data={data} options={options} />
    </div>
  );
}