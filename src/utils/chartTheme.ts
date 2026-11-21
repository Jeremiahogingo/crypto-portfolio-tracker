import type { ChartOptions } from "chart.js";
import type { Theme } from "@/context/ThemeContext";

export interface ChartTheme {
  text: string;
  mutedText: string;
  grid: string;
  border: string;
  surface: string;
  tooltipBackground: string;
  tooltipTitle: string;
  tooltipBody: string;
}

const CHART_THEMES: Record<Theme, ChartTheme> = {
  dark: {
    text: "#CBD5E1",
    mutedText: "#94A3B8",
    grid: "rgba(148, 163, 184, 0.14)",
    border: "#273449",
    surface: "#111827",
    tooltipBackground: "#182235",
    tooltipTitle: "#F8FAFC",
    tooltipBody: "#CBD5E1",
  },

  light: {
    text: "#334155",
    mutedText: "#64748B",
    grid: "rgba(100, 116, 139, 0.18)",
    border: "#E2E8F0",
    surface: "#FFFFFF",
    tooltipBackground: "#0F172A",
    tooltipTitle: "#F8FAFC",
    tooltipBody: "#CBD5E1",
  },
};

export function getChartTheme(theme: Theme): ChartTheme {
  return CHART_THEMES[theme];
}

/**
 * Shared defaults for Cartesian line and bar charts.
 *
 * Chart.js models ChartOptions using chart-specific conditional types.
 * The shared options below are valid for both supported chart types,
 * but TypeScript cannot verify that against an unresolved generic TType.
 */
export function getCartesianChartOptions<
  TType extends "line" | "bar",
>(theme: ChartTheme): ChartOptions<TType> {
  const options = {
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
      intersect: false,
      mode: "index",
    },

    plugins: {
      legend: {
        labels: {
          color: theme.text,
          usePointStyle: true,
          pointStyle: "circle",
          padding: 18,
          boxWidth: 8,
        },
      },

      tooltip: {
        backgroundColor: theme.tooltipBackground,
        titleColor: theme.tooltipTitle,
        bodyColor: theme.tooltipBody,
        borderColor: theme.border,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        displayColors: true,
      },
    },

    scales: {
      x: {
        grid: {
          color: theme.grid,
          drawTicks: false,
        },
        border: {
          color: theme.border,
        },
        ticks: {
          color: theme.mutedText,
        },
      },

      y: {
        grid: {
          color: theme.grid,
          drawTicks: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: theme.mutedText,
        },
      },
    },
  };

  return options as unknown as ChartOptions<TType>;
}

/**
 * Shared defaults for doughnut charts.
 */
export function getDoughnutChartOptions(
  theme: ChartTheme,
): ChartOptions<"doughnut"> {
  return {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: theme.text,
          usePointStyle: true,
          pointStyle: "circle",
          padding: 12,
          boxWidth: 8,
        },
      },

      tooltip: {
        backgroundColor: theme.tooltipBackground,
        titleColor: theme.tooltipTitle,
        bodyColor: theme.tooltipBody,
        borderColor: theme.border,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        displayColors: true,
      },
    },
  };
}