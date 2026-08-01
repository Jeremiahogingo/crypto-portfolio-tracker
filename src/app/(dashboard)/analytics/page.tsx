import Card from "@/components/ui/Card";
import MonthlyROIChart from "@/components/charts/MonthlyROIChart";
import ProfitTrendChart from "@/components/charts/ProfitTrendChart";
import RiskDistributionChart from "@/components/charts/RiskDistributionChart";
import InvestmentTimelineChart from "@/components/charts/InvestmentTimelineChart";
import AssetComparisonChart from "@/components/charts/AssetComparisonChart";
import PortfolioChart from "@/components/charts/PortfolioChart";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Analytics</h1>

      {/* First row: Monthly ROI + Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-80">
          <h3 className="text-sm font-semibold text-text mb-4">Monthly ROI</h3>
          <div className="h-[calc(100%-2rem)]">
            <MonthlyROIChart />
          </div>
        </Card>
        <Card className="h-80">
          <h3 className="text-sm font-semibold text-text mb-4">Risk Distribution</h3>
          <div className="h-[calc(100%-2rem)]">
            <RiskDistributionChart />
          </div>
        </Card>
      </div>

      {/* Second row: Profit Trend + Investment Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-80">
          <h3 className="text-sm font-semibold text-text mb-4">Profit Trend</h3>
          <div className="h-[calc(100%-2rem)]">
            <ProfitTrendChart />
          </div>
        </Card>
        <Card className="h-80">
          <h3 className="text-sm font-semibold text-text mb-4">Investment Timeline</h3>
          <div className="h-[calc(100%-2rem)]">
            <InvestmentTimelineChart />
          </div>
        </Card>
      </div>

      {/* Third row: Portfolio Growth + Asset Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-80">
          <h3 className="text-sm font-semibold text-text mb-4">Portfolio Growth</h3>
          <div className="h-[calc(100%-2rem)]">
            <PortfolioChart />
          </div>
        </Card>
        <Card className="h-80">
          <h3 className="text-sm font-semibold text-text mb-4">Asset Comparison (ROI %)</h3>
          <div className="h-[calc(100%-2rem)]">
            <AssetComparisonChart />
          </div>
        </Card>
      </div>
    </div>
  );
}