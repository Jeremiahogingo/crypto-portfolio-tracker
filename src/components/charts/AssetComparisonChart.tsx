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
import { assetComparison } from "@/mock/analytics";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

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

  return <Bar data={data} options={{ indexAxis: "y" }} />;
}