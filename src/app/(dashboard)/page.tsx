// src/app/(dashboard)/page.tsx
//
// Dashboard — server component.
//
// Reads holdings from the DB once, passes raw rows to client widgets.
// Charts and market widgets are unchanged from Phase 3; only the portfolio
// data path moved to real data.
//
// ─── What stays mocked (deliberately) ────────────────────────────────────
// • PortfolioChart (growth) — needs historical portfolio value. We don't
//   have snapshots yet; generating them requires a nightly job or CoinGecko
//   market_chart per coin. Deferred to Phase 2.5 (Analytics).
// • AllocationChart — we CAN now compute this from real holdings, so it's
//   wired. See AllocationWidget below.
//
// ─── Empty state ─────────────────────────────────────────────────────────
// A brand-new user has zero holdings. Every widget handles that gracefully:
// PortfolioSnapshot shows $0.00, HoldingsPreview shows the "Add holding"
// empty state, allocation shows "No data". Nothing looks broken.

import { getDefaultPortfolio, getHoldings } from "@/lib/portfolio/queries";
import PortfolioSnapshot from "@/components/dashboard/PortfolioSnapshot";
import HoldingsPreview from "@/components/dashboard/HoldingsPreview";
import AllocationWidget from "@/components/dashboard/AllocationWidget";
import PortfolioChart from "@/components/charts/PortfolioChart";
import TopMovers from "@/components/dashboard/TopMovers";
import MarketNews from "@/components/dashboard/MarketNews";
import Card from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const portfolio = await getDefaultPortfolio();
  const holdings = portfolio ? await getHoldings(portfolio.id) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Dashboard</h1>

      <PortfolioSnapshot rawHoldings={holdings} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-text mb-4">
            Portfolio Growth
          </h3>
          <PortfolioChart />
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