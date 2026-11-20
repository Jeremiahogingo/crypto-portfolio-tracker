"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartOptions } from "chart.js";
import { Doughnut } from "react-chartjs-2";

import { assetAllocation } from "@/mock/dashboard";
import { useTheme } from "@/context/ThemeContext";
import {
  getChartTheme,
  getDoughnutChartOptions,
} from "@/utils/chartTheme";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AllocationChart() {
  const { theme } = useTheme();
  const chartTheme = getChartTheme(theme);

  const data = {
    labels: assetAllocation.map((item) => item.name),
    datasets: [
      {
        data: assetAllocation.map((item) => item.value),
        backgroundColor: assetAllocation.map((item) => item.color),
        borderColor: chartTheme.border,
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> =
    getDoughnutChartOptions(chartTheme);

  return (
    <div className="w-full" style={{ height: 260 }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}