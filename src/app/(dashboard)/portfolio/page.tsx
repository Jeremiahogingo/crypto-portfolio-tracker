import PortfolioSummary from "@/components/portfolio/PortfolioSummary";
import HoldingsTable from "@/components/tables/HoldingsTable";
import TransactionHistory from "@/components/portfolio/TransactionHistory";
import Card from "@/components/ui/Card";

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Portfolio</h1>

      {/* Summary Cards */}
      <PortfolioSummary />

      {/* Holdings Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text">Holdings</h3>
          <button className="text-xs text-primary hover:underline">View All</button>
        </div>
        <HoldingsTable />
      </Card>

      {/* Transaction History */}
      <TransactionHistory />
    </div>
  );
}