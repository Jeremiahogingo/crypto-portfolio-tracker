// src/app/(dashboard)/portfolio/page.tsx
//
// Portfolio page — server wrapper.
//
// Fetches the portfolio and holdings from the DB, hands raw rows to the
// client view which enriches them with live prices. No loading state on
// the server side; the page renders in one round-trip.
//
// Redirects:
//   • No session → /login (defensive; layout and middleware already gate)
//   • No portfolio → /onboarding (means the trigger's Main portfolio
//     didn't get created — rare but recoverable via onboarding)
//
// The "empty portfolio" case (portfolio exists, zero holdings) is handled
// by PortfolioView's empty state — not by a redirect, because the user
// needs to see the page to click "Add holding".

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getDefaultPortfolio, getHoldings } from "@/lib/portfolio/queries";
import PortfolioView from "@/components/portfolio/PortfolioView";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  const portfolio = await getDefaultPortfolio();
  if (!portfolio) redirect("/onboarding");

  const holdings = await getHoldings(portfolio.id);

  return (
    <PortfolioView
      initialHoldings={holdings}
      portfolioName={portfolio.name}
    />
  );
}