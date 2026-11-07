// src/app/(dashboard)/analytics/page.tsx
//
// Analytics page — server wrapper.
//
// Fetches holdings and transactions in parallel, hands both to the client
// view. Same pattern as Portfolio and Dashboard — one server fetch, no
// loading state on initial render.

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getDefaultPortfolio,
  getHoldings,
  getTransactions,
} from "@/lib/portfolio/queries";
import AnalyticsView from "@/components/analytics/AnalyticsView";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  const portfolio = await getDefaultPortfolio();
  if (!portfolio) redirect("/onboarding");

  const [holdings, transactions] = await Promise.all([
    getHoldings(portfolio.id),
    getTransactions(portfolio.id),
  ]);

  return (
    <AnalyticsView
      initialHoldings={holdings}
      initialTransactions={transactions}
    />
  );
}