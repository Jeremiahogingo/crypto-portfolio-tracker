"use client";

import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartOptions } from "chart.js";

import Card from "@/components/ui/Card";
import { useHoldingsWithPrices } from "@/hooks/useHoldingsWithPrices";
import { formatPrice } from "@/utils/format";
import type { Holding } from "@/db/schema";
import { useTheme } from "@/context/ThemeContext";
import {
  getChartTheme,
  getDoughnutChartOptions,
} from "@/utils/chartTheme";

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = [
  "#F7931A",
  "#627EEA",
  "#9945FF",
  "#F0B90B",
  "#22C55E",
  "#3B82F6",
  "#EF4444",
  "#94A3B8",
];

interface AllocationWidgetProps {
  rawHoldings: Holding[];
}

export default function AllocationWidget({
  rawHoldings,
}: AllocationWidgetProps) {
  const { theme } = useTheme();
  const chartTheme = getChartTheme(theme);

  const { allocation, isLoadingPrices } =
    useHoldingsWithPrices(rawHoldings);

  const data = useMemo(
    () => ({
      labels: allocation.map((item) => item.symbol),
      datasets: [
        {
          data: allocation.map((item) => item.value),
          backgroundColor: allocation.map(
            (_, index) => PALETTE[index % PALETTE.length],
          ),
          borderColor: chartTheme.border,
          borderWidth: 2,
        },
      ],
    }),
    [allocation, chartTheme.border],
  );

  const baseOptions = getDoughnutChartOptions(chartTheme);

  const options: ChartOptions<"doughnut"> = {
    ...baseOptions,

    plugins: {
      ...baseOptions.plugins,

      tooltip: {
        ...baseOptions.plugins?.tooltip,

        callbacks: {
          label: (context) => {
            const value = Number(context.raw);
            return ` ${context.label}: ${formatPrice(value)}`;
          },
        },
      },
    },
  };

  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-text">
        Asset Allocation
      </h3>

      {allocation.length === 0 ? (
        <div className="flex h-[260px] flex-col items-center justify-center text-center">
          <span className="mb-2 text-3xl">📊</span>
          <p className="text-sm text-secondary">
            {isLoadingPrices && rawHoldings.length > 0
              ? "Loading prices…"
              : "Add holdings to see your allocation"}
          </p>
        </div>
      ) : (
        <div className="w-full" style={{ height: 260 }}>
          <Doughnut data={data} options={options} />
        </div>
      )}
    </Card>
  );
}