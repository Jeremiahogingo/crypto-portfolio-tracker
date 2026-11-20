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

import { profitTrend } from "@/mock/analytics";
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

export default function ProfitTrendChart() {
  const { theme } = useTheme();
  const chartTheme = getChartTheme(theme);

  const data = {
    labels: profitTrend.map((entry) => entry.month),
    datasets: [
      {
        label: "Cumulative Profit",
        data: profitTrend.map((entry) => entry.profit),
        fill: true,
        borderColor: "#22C55E",
        backgroundColor: "rgba(34,197,94,0.1)",
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#22C55E",
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