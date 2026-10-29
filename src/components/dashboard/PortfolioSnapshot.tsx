// src/components/dashboard/PortfolioSnapshot.tsx
//
// Dashboard top-of-page metrics. Takes raw holdings from the server,
// enriches with live prices, renders 4 stat cards.
//
// Why a client component wrapper (not four individual cards): the four
// values are derived from the same summary object — splitting them would
// mean four separate market queries. One hook call, one query, four cards.

"use client";

import StatCard from "@/components/dashboard/StatCard";
import { useHoldingsWithPrices } from "@/hooks/useHoldingsWithPrices";
import { formatPrice, formatSignedCurrency, formatPercent } from "@/utils/format";
import type { Holding } from "@/db/schema";

interface PortfolioSnapshotProps {
  rawHoldings: Holding[];
}

export default function PortfolioSnapshot({ rawHoldings }: PortfolioSnapshotProps) {
  const { summary, isLoadingPrices } = useHoldingsWithPrices(rawHoldings);

  // Show the top-of-page numbers with 0s and a hint when there's no data,
  // rather than hiding the cards. A new user needs to see that these
  // numbers will exist once they add holdings.
  const hasHoldings = rawHoldings.length > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Portfolio Value"
        value={
          !hasHoldings
            ? "$0.00"
            : isLoadingPrices && summary.totalValue === 0
            ? "—"
            : formatPrice(summary.totalValue)
        }
        change={
          hasHoldings && summary.totalValue > 0
            ? formatPercent(summary.change24hPercent)
            : undefined
        }
        positive={summary.change24hPercent >= 0}
        icon="💰"
      />
      <StatCard
        title="24h Change"
        value={
          !hasHoldings
            ? "$0.00"
            : isLoadingPrices && summary.totalValue === 0
            ? "—"
            : formatSignedCurrency(summary.change24hValue)
        }
        icon="📈"
        positive={summary.change24hValue >= 0}
      />
      <StatCard
        title="Unrealised P&L"
        value={
          !hasHoldings
            ? "$0.00"
            : isLoadingPrices && summary.totalValue === 0
            ? "—"
            : formatSignedCurrency(summary.totalPnl)
        }
        change={
          hasHoldings && summary.totalCost > 0
            ? formatPercent(summary.totalPnlPercent)
            : undefined
        }
        positive={summary.totalPnl >= 0}
        icon="🏆"
      />
      <StatCard
        title="Assets"
        value={`${summary.assetCount} ${summary.assetCount === 1 ? "coin" : "coins"}`}
        icon="🪙"
        positive
      />
    </div>
  );
}