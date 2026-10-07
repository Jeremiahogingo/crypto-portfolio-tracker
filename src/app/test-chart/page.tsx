"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const data = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May"],
  datasets: [
    {
      label: "Test",
      data: [10, 25, 15, 40, 30],
      borderColor: "#3B82F6",
      backgroundColor: "rgba(59,130,246,0.2)",
      tension: 0.4,
    },
  ],
};

export default function TestChartPage() {
  return (
    <div style={{ padding: 40, background: "#09090B", minHeight: "100vh", color: "#F8FAFC" }}>
      <h1>Chart Test</h1>
      <div style={{ width: 500, height: 300, background: "#111827", padding: 16, borderRadius: 12 }}>
        <Line data={data} options={{ maintainAspectRatio: false, responsive: true }} />
      </div>
    </div>
  );
}