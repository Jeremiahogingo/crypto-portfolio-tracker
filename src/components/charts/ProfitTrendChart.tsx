"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { profitTrend } from "@/mock/analytics";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

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

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#111827",
        titleColor: "#F8FAFC",
        bodyColor: "#94A3B8",
        borderColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        callbacks: {
          label: (context: any) => `$${context.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94A3B8" } },
      y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#94A3B8", callback: (val: any) => "$" + val } },
    },
  };

  return (
    <div className="h-full">
      <Line data={data} options={options} />
    </div>
  );
}