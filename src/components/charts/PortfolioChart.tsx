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

import { portfolioGrowth } from "@/mock/dashboard";
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

export default function PortfolioChart() {
  const { theme } = useTheme();
  const chartTheme = getChartTheme(theme);

  const data = {
    labels: portfolioGrowth.map((item) => item.month),
    datasets: [
      {
        label: "Portfolio Value",
        data: portfolioGrowth.map((item) => item.value),
        fill: true,
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#3B82F6",
      },
    ],
  };

  const baseOptions = getCartesianChartOptions<"line">(chartTheme);

  const options: ChartOptions<"line"> = {
    ...baseOptions,

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
    <div className="w-full" style={{ height: 260 }}>
      <Line data={data} options={options} />
    </div>
  );
}