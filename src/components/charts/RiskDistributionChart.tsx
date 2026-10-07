"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
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

  return (
    <div className="w-full" style={{ height: 260 }}>
      <Doughnut data={data} options={{ maintainAspectRatio: false, responsive: true }} />
    </div>
  );
}