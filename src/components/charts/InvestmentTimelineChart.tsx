"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { investmentTimeline } from "@/mock/analytics";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function InvestmentTimelineChart() {
  const data = {
    labels: investmentTimeline.map((d) => d.month),
    datasets: [
      {
        label: "Amount Invested",
        data: investmentTimeline.map((d) => d.invested),
        backgroundColor: "rgba(59,130,246,0.7)",
        borderRadius: 6,
      },
    ],
  };

  return <Bar data={data} />;
}