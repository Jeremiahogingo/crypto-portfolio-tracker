// src/components/markets/MarketOverview.tsx
//
// Four aggregate market-stat cards driven by /api/crypto/global.
//
// Owns its own data fetch because it's the only consumer of global stats
// on this page. If a future page needs global stats too, React Query will
// dedupe by query key — no extra network call.

"use client";

import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { useGlobalStats } from "@/hooks/useGlobalStats";
import { formatCompactCurrency, formatPercent } from "@/utils/format";

export default function MarketOverview() {
  const { stats, isLoading } = useGlobalStats();

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-7 w-32" />
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Global Market Cap",
      value: formatCompactCurrency(stats.totalMarketCap),
      sub: formatPercent(stats.marketCapChange24h),
      subPositive: stats.marketCapChange24h >= 0,
    },
    {
      label: "24h Volume",
      value: formatCompactCurrency(stats.totalVolume),
    },
    {
      label: "BTC Dominance",
      value: `${stats.btcDominance.toFixed(1)}%`,
    },
    {
      label: "ETH Dominance",
      value: `${stats.ethDominance.toFixed(1)}%`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} hover>
          <p className="text-sm text-secondary">{card.label}</p>
          <p className="text-2xl font-bold text-text mt-1">{card.value}</p>
          {card.sub && (
            <p
              className={`text-xs mt-1 ${
                card.subPositive ? "text-success" : "text-danger"
              }`}
            >
              {card.sub} (24h)
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}