"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartOptions } from "chart.js";
import { Doughnut } from "react-chartjs-2";

import type { ConcentrationEntry } from "@/lib/analytics/calc";
import { useTheme } from "@/context/ThemeContext";
import {
  getChartTheme,
  getDoughnutChartOptions,
} from "@/utils/chartTheme";

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
  const { theme } = useTheme();
  const chartTheme = getChartTheme(theme);

  if (entries.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ height }}
      >
        <span className="mb-2 text-3xl">🥧</span>
        <p className="text-sm text-secondary">
          Add holdings to see your concentration.
        </p>
      </div>
    );
  }

  const data = {
    labels: entries.map((entry) => entry.symbol),
    datasets: [
      {
        data: entries.map((entry) => entry.value),
        backgroundColor: entries.map(
          (_, index) => PALETTE[index % PALETTE.length],
        ),
        borderColor: chartTheme.border,
        borderWidth: 2,
      },
    ],
  };

  const baseOptions = getDoughnutChartOptions(chartTheme);

  const options: ChartOptions<"doughnut"> = {
    ...baseOptions,

    plugins: {
      ...baseOptions.plugins,

      tooltip: {
        ...baseOptions.plugins?.tooltip,

        callbacks: {
          label: (context) => {
            const entry = entries[context.dataIndex];

            if (!entry) return "";

            return ` ${entry.symbol}: $${entry.value.toLocaleString(
              undefined,
              { maximumFractionDigits: 0 },
            )} (${entry.percent.toFixed(1)}%)`;
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