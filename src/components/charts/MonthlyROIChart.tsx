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
import { monthlyROI } from "@/mock/analytics";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function MonthlyROIChart() {
  const data = {
    labels: monthlyROI.map((d) => d.month),
    datasets: [
      {
        label: "ROI %",
        data: monthlyROI.map((d) => d.roi),
        backgroundColor: monthlyROI.map((d) =>
          d.roi >= 0 ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.7)"
        ),
        borderRadius: 6,
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
          label: (context: any) => `${context.raw}% ROI`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#94A3B8" },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#94A3B8", callback: (val: any) => val + "%" },
      },
    },
  };

  return (
    <div className="h-full">
      <Bar data={data} options={options} />
    </div>
  );
}