"use client";

import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { riskDistribution } from "@/mock/analytics";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function RiskDistributionChart() {
  const data = {
    labels: riskDistribution.map((d) => d.label),
    datasets: [
      {
        data: riskDistribution.map((d) => d.value),
        backgroundColor: riskDistribution.map((d) => d.color),
        borderColor: "#111827",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: "#94A3B8", padding: 16, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: "#111827",
        titleColor: "#F8FAFC",
        bodyColor: "#94A3B8",
        borderColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        callbacks: {
          label: (context: any) => ` ${context.label}: ${context.raw}%`,
        },
      },
    },
  };

  return (
    <div className="h-full">
      <Doughnut data={data} options={options} />
    </div>
  );
}