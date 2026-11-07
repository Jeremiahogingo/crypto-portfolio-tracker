// src/app/(dashboard)/page.tsx
//
// Dashboard — server component.

import { getDefaultPortfolio, getHoldings, getTransactions } from "@/lib/portfolio/queries";
import PortfolioSnapshot from "@/components/dashboard/PortfolioSnapshot";
import HoldingsPreview from "@/components/dashboard/HoldingsPreview";
import AllocationWidget from "@/components/dashboard/AllocationWidget";
import InvestmentTimelineChart from "@/components/charts/InvestmentTimelineChart";
import TopMovers from "@/components/dashboard/TopMovers";
import MarketNews from "@/components/dashboard/MarketNews";
import Card from "@/components/ui/Card";
import { computeInvestmentTimeline } from "@/lib/analytics/calc";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const portfolio = await getDefaultPortfolio();

  const [holdings, transactions] = portfolio
    ? await Promise.all([
        getHoldings(portfolio.id),
        getTransactions(portfolio.id),
      ])
    : [[], []];

  // Timeline is transaction-derived — no prices needed — so it can be
  // computed on the server. Pass the points array to the client chart,
  // which only handles rendering.
  const investmentPoints = computeInvestmentTimeline(transactions);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Dashboard</h1>

      <PortfolioSnapshot rawHoldings={holdings} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-text mb-4">
            Investment Timeline
          </h3>
          <InvestmentTimelineChart
            points={investmentPoints}
            height={280}
          />
        </Card>
        <AllocationWidget rawHoldings={holdings} />
      </div>

      <HoldingsPreview rawHoldings={holdings} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopMovers />
        <MarketNews />
      </div>
    </div>
  );
}