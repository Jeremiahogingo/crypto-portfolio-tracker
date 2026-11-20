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

import { monthlyROI } from "@/mock/analytics";
import { useTheme } from "@/context/ThemeContext";
import {
  getChartTheme,
  getCartesianChartOptions,
} from "@/utils/chartTheme";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function MonthlyROIChart() {
  const { theme } = useTheme();
  const chartTheme = getChartTheme(theme);

  const data = {
    labels: monthlyROI.map((entry) => entry.month),
    datasets: [
      {
        label: "ROI %",
        data: monthlyROI.map((entry) => entry.roi),
        backgroundColor: monthlyROI.map((entry) =>
          entry.roi >= 0
            ? "rgba(34,197,94,0.7)"
            : "rgba(239,68,68,0.7)",
        ),
        borderRadius: 6,
      },
    ],
  };

  const baseOptions = getCartesianChartOptions<"bar">(chartTheme);

  const options: ChartOptions<"bar"> = {
    ...baseOptions,

    scales: {
      ...baseOptions.scales,

      y: {
        ...baseOptions.scales?.y,
        ticks: {
          ...baseOptions.scales?.y?.ticks,
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