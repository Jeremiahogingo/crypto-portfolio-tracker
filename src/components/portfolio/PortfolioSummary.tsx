import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { portfolioDetail } from "@/mock/portfolio";

export default function PortfolioSummary() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card hover>
        <p className="text-sm text-secondary">Total Investment</p>
        <p className="text-2xl font-bold text-text mt-1">
          ${portfolioDetail.totalInvestment.toLocaleString()}
        </p>
      </Card>
      <Card hover gradientBorder>
        <p className="text-sm text-secondary">Current Value</p>
        <p className="text-2xl font-bold text-text mt-1">
          ${portfolioDetail.currentValue.toLocaleString()}
        </p>
      </Card>
      <Card hover>
        <p className="text-sm text-secondary">Total Profit</p>
        <p className="text-2xl font-bold text-success mt-1">
          +${portfolioDetail.totalProfit.toLocaleString()}
        </p>
        <Badge variant="success" className="mt-2">
          +{portfolioDetail.profitPercent}%
        </Badge>
      </Card>
      <Card hover>
        <p className="text-sm text-secondary">Today&apos;s Profit</p>
        <p className="text-2xl font-bold text-success mt-1">
          +${portfolioDetail.todayProfit.toLocaleString()}
        </p>
      </Card>
    </div>
  );
}