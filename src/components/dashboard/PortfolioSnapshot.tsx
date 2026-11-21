// src/components/dashboard/PortfolioSnapshot.tsx
//
// Dashboard portfolio metrics.
//
// A complete portfolio value is shown only when every active holding has
// a live quote. When valuation is incomplete, the card shows the known
// live-priced portion and labels it as partial.

"use client";

import StatCard from "@/components/dashboard/StatCard";
import { useHoldingsWithPrices } from "@/hooks/useHoldingsWithPrices";
import {
  formatPrice,
  formatSignedCurrency,
  formatPercent,
} from "@/utils/format";
import type { Holding } from "@/db/schema";

interface PortfolioSnapshotProps {
  rawHoldings: Holding[];
}

export default function PortfolioSnapshot({
  rawHoldings,
}: PortfolioSnapshotProps) {
  const { summary, isLoadingPrices } =
    useHoldingsWithPrices(rawHoldings);

  const hasHoldings = summary.assetCount > 0;

  const portfolioValue =
    summary.totalValue !== null
      ? formatPrice(summary.totalValue)
      : summary.knownValue > 0
        ? formatPrice(summary.knownValue)
        : !hasHoldings
          ? "$0.00"
          : isLoadingPrices
            ? "Loading…"
            : "Unavailable";

  const portfolioTitle =
    summary.totalValue !== null || !hasHoldings
      ? "Portfolio Value"
      : summary.knownValue > 0
        ? "Known Value (partial)"
        : "Portfolio Value";

  const change24hValue =
    summary.change24hValue === null
      ? hasHoldings
        ? "Unavailable"
        : "$0.00"
      : formatSignedCurrency(summary.change24hValue);

  const pnlValue =
    summary.totalPnl === null
      ? hasHoldings
        ? "Unavailable"
        : "$0.00"
      : formatSignedCurrency(summary.totalPnl);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={portfolioTitle}
        value={portfolioValue}
        change={
          summary.change24hPercent !== null
            ? formatPercent(summary.change24hPercent)
            : undefined
        }
        positive={
          summary.change24hValue === null ||
          summary.change24hValue >= 0
        }
        icon="💰"
      />

      <StatCard
        title="24h Change"
        value={change24hValue}
        positive={
          summary.change24hValue === null ||
          summary.change24hValue >= 0
        }
        icon="📈"
      />

      <StatCard
        title="Unrealised P&L"
        value={pnlValue}
        change={
          summary.totalPnlPercent !== null
            ? formatPercent(summary.totalPnlPercent)
            : undefined
        }
        positive={
          summary.totalPnl === null ||
          summary.totalPnl >= 0
        }
        icon="🏆"
      />

      <StatCard
        title="Assets"
        value={`${summary.assetCount} ${
          summary.assetCount === 1 ? "coin" : "coins"
        }`}
        icon="🪙"
        positive
      />
    </div>
  );
}