"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

const data = {
  labels: ["Jan", "Feb", "Mar", "Apr"],
  datasets: [
    {
      label: "Test Data",
      data: [10, 25, 15, 40],
      borderColor: "#3B82F6",
      backgroundColor: "rgba(59,130,246,0.2)",
    },
  ],
};

export default function TestChart() {
  return (
    <div style={{ padding: "40px", background: "#09090B", minHeight: "100vh" }}>
      <h1 style={{ color: "#F8FAFC", marginBottom: "20px" }}>Chart Test</h1>
      <div style={{ width: "500px", height: "300px", background: "#111827", padding: "20px", borderRadius: "12px" }}>
        <Line data={data} />
      </div>
    </div>
  );
}