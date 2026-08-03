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
import { profitTrend } from "@/mock/analytics";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function ProfitTrendChart() {
  const data = {
    labels: profitTrend.map((d) => d.month),
    datasets: [
      {
        label: "Cumulative Profit",
        data: profitTrend.map((d) => d.profit),
        fill: true,
        borderColor: "#22C55E",
        backgroundColor: "rgba(34,197,94,0.1)",
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#22C55E",
      },
    ],
  };

  return <Line data={data} />;
}