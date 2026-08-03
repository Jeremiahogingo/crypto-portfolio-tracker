"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { assetAllocation } from "@/mock/dashboard";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AllocationChart() {
  const data = {
    labels: assetAllocation.map((item) => item.name),
    datasets: [
      {
        data: assetAllocation.map((item) => item.value),
        backgroundColor: assetAllocation.map((item) => item.color),
        borderColor: "#111827",
        borderWidth: 2,
      },
    ],
  };

  return <Doughnut data={data} />;
}