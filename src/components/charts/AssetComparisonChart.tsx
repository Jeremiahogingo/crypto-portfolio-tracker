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

import { assetComparison } from "@/mock/analytics";
import { useTheme } from "@/context/ThemeContext";
import {
  getChartTheme,
  getCartesianChartOptions,
} from "@/utils/chartTheme";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AssetComparisonChart() {
  const { theme } = useTheme();
  const chartTheme = getChartTheme(theme);

  const data = {
    labels: assetComparison.map((item) => item.asset),
    datasets: [
      {
        label: "ROI %",
        data: assetComparison.map((item) => item.performance),
        backgroundColor: assetComparison.map((item) =>
          item.performance >= 0
            ? "rgba(34,197,94,0.8)"
            : "rgba(239,68,68,0.8)",
        ),
        borderRadius: 6,
      },
    ],
  };

  const baseOptions = getCartesianChartOptions<"bar">(chartTheme);

  const options: ChartOptions<"bar"> = {
    ...baseOptions,
    indexAxis: "y",

    scales: {
      ...baseOptions.scales,

      x: {
        ...baseOptions.scales?.x,
        ticks: {
          ...baseOptions.scales?.x?.ticks,
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  return (
    <div className="w-full" style={{ height: 260 }}>
      <Bar data={data} options={options} />
    </div>
  );
}