// src/app/(dashboard)/portfolio/page.tsx
//
// Portfolio page — server wrapper.
//
// Adds transaction fetch alongside holdings. Both come from the same
// portfolio, so passing them to PortfolioView together keeps the page
// render to one round-trip.
//
// The 100-transaction cap is intentional — enough to feel complete without
// requiring pagination. Phase 4 adds server-side pagination when the app
// has real users with more than 100 entries.

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getDefaultPortfolio,
  getHoldings,
  getTransactions,
} from "@/lib/portfolio/queries";
import PortfolioView from "@/components/portfolio/PortfolioView";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  const portfolio = await getDefaultPortfolio();
  if (!portfolio) redirect("/onboarding");

  const [holdings, transactions] = await Promise.all([
    getHoldings(portfolio.id),
    getTransactions(portfolio.id),
  ]);

  return (
    <PortfolioView
      initialHoldings={holdings}
      initialTransactions={transactions}
      portfolioName={portfolio.name}
    />
  );
}