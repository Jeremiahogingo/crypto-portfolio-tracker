import StatCard from "@/components/dashboard/StatCard";
import PortfolioChart from "@/components/charts/PortfolioChart";
import AllocationChart from "@/components/charts/AllocationChart";
import HoldingsTable from "@/components/tables/HoldingsTable";
import TopMovers from "@/components/dashboard/TopMovers";
import MarketNews from "@/components/dashboard/MarketNews";
import { portfolioSummary } from "@/mock/dashboard";
import Card from "@/components/ui/Card";

export default function DashboardPage() {
  const summary = portfolioSummary;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Dashboard</h1>

      {/* Statistic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Portfolio Value"
          value={`$${summary.totalValue.toLocaleString()}`}
          change={`+${summary.valueChangePercent}%`}
          icon="💰"
          positive
        />
        <StatCard
          title="Today's Profit"
          value={`+$${summary.profitToday.toLocaleString()}`}
          icon="📈"
          positive
        />
        <StatCard
          title="Assets"
          value={`${summary.assetsCount} Coins`}
          icon="🪙"
          positive
        />
        <StatCard
          title="ROI"
          value={`+${summary.roi}%`}
          icon="🏆"
          positive
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-80">
          <h3 className="text-sm font-semibold text-text mb-4">
            Portfolio Growth
          </h3>
          <div className="h-[calc(100%-2rem)]">
            <PortfolioChart />
          </div>
        </Card>
        <Card className="h-80">
          <h3 className="text-sm font-semibold text-text mb-4">
            Asset Allocation
          </h3>
          <div className="h-[calc(100%-2rem)]">
            <AllocationChart />
          </div>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text">Holdings</h3>
          <button className="text-xs text-primary hover:underline">
            View All
          </button>
        </div>
        <HoldingsTable />
      </Card>

      {/* Bottom Row: Top Movers & Market News */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopMovers />
        <MarketNews />
      </div>
    </div>
  );
}