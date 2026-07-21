import MarketOverview from "@/components/markets/MarketOverview";
import TrendingCoins from "@/components/markets/TrendingCoins";
import GainersLosers from "@/components/markets/GainersLosers";
import MarketsTable from "@/components/tables/MarketsTable";
import Card from "@/components/ui/Card";

export default function MarketsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Markets</h1>

      {/* Market Overview */}
      <MarketOverview />

      {/* Trending Coins */}
      <TrendingCoins />

      {/* Top Gainers and Losers */}
      <GainersLosers />

      {/* All Coins Table */}
      <Card>
        <MarketsTable />
      </Card>
    </div>
  );
}