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
import { Line } from "react-chartjs-2";
import { portfolioGrowth } from "@/mock/dashboard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function PortfolioChart() {
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

  return <Line data={data} />;
}