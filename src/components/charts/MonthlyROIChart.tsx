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
import { monthlyROI } from "@/mock/analytics";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

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

  return <Bar data={data} />;
}