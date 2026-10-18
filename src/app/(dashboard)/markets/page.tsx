// src/app/(dashboard)/markets/page.tsx
//
// Markets page — live data orchestration.
//
// Fetches:
//   • useMarkets (per_page=100)  → shared with GainersLosers + MarketsTable
//   • useGlobalStats             → consumed by MarketOverview (own fetch)
//   • useTrending                → consumed by TrendingCoins (own fetch)
//
// "page does the fetch, components receive data" holds for the markets
// list because it's shared across two components. The two single-consumer
// hooks live inside their components instead, for locality.

"use client";

import MarketOverview from "@/components/markets/MarketOverview";
import TrendingCoins from "@/components/markets/TrendingCoins";
import GainersLosers from "@/components/markets/GainersLosers";
import MarketsTable from "@/components/tables/MarketsTable";
import DataSourceBadge from "@/components/ui/DataSourceBadge";
import Card from "@/components/ui/Card";
import { useMarkets } from "@/hooks/useMarkets";

export default function MarketsPage() {
  const { coins, meta, isLoading } = useMarkets({ per_page: 100 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Markets</h1>
        <DataSourceBadge source={meta?.source} fetchedAt={meta?.fetchedAt} />
      </div>

      <MarketOverview />
      <TrendingCoins />
      <GainersLosers coins={coins} isLoading={isLoading} />

      <Card>
        <MarketsTable coins={coins} isLoading={isLoading} />
      </Card>
    </div>
  );
}