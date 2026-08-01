"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { assetComparison } from "@/mock/analytics";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AssetComparisonChart() {
  const data = {
    labels: assetComparison.map((d) => d.asset),
    datasets: [
      {
        label: "ROI %",
        data: assetComparison.map((d) => d.performance),
        backgroundColor: assetComparison.map((d) =>
          d.performance >= 0 ? "rgba(34,197,94,0.8)" : "rgba(239,68,68,0.8)"
        ),
        borderRadius: 6,
      },
    ],
  };

  const options = {
    indexAxis: "y" as const, // horizontal bar
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
          label: (context: any) => `${context.raw}% ROI`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#94A3B8", callback: (val: any) => val + "%" },
      },
      y: {
        grid: { display: false },
        ticks: { color: "#94A3B8" },
      },
    },
  };

  return (
    <div className="h-full">
      <Bar data={data} options={options} />
    </div>
  );
}