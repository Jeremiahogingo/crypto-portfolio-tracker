// src/hooks/useHoldingsWithPrices.ts
//
// Client hook that merges DB holdings (server-fetched) with live prices
// (React Query, client-fetched).
//
// ─── Why split ───────────────────────────────────────────────────────────
// The holdings come from the DB and are stable per request — perfect for
// Server Components, no loading state. The prices come from CoinGecko and
// change every minute — perfect for React Query on the client.
//
// Merging them client-side means:
//   • Holdings render instantly (no waiting for prices).
//   • Prices fill in progressively (skeleton → real price).
//   • Refetching prices (every 60s) doesn't require a page reload.
//
// ─── Why not merge on the server? ────────────────────────────────────────
// We could — but it would block the page render on CoinGecko latency,
// and price refreshes would require router.refresh() every minute. Worse
// UX and more load on the DB.
//
// Enabled guard: when there are zero holdings (fresh user), we skip the
// markets query entirely. No point calling CoinGecko for an empty list.

"use client";

import { useMemo } from "react";
import { useMarkets } from "@/hooks/useMarkets";
import { enrichHolding, summarizePortfolio, computeAllocation } from "@/lib/portfolio/calc";
import type { Holding } from "@/db/schema";
import type {
  AllocationSlice,
  HoldingWithPrice,
  PortfolioSummary,
} from "@/types/portfolio";

interface UseHoldingsWithPricesResult {
  holdings: HoldingWithPrice[];
  summary: PortfolioSummary;
  allocation: AllocationSlice[];
  /** True while the price fetch is in flight. Holdings are populated immediately. */
  isLoadingPrices: boolean;
}

export function useHoldingsWithPrices(
  rawHoldings: Holding[]
): UseHoldingsWithPricesResult {
  const ids = useMemo(
    () => rawHoldings.map((h) => h.coinId),
    [rawHoldings]
  );

  const { coins, isLoading: isLoadingPrices } = useMarkets(
    { ids, per_page: Math.max(ids.length, 1) },
    { enabled: ids.length > 0 }
  );

  const byId = useMemo(
    () => new Map(coins.map((c) => [c.id, c])),
    [coins]
  );

  const holdings = useMemo(
    () =>
      rawHoldings.map((h) =>
        enrichHolding(h, byId.get(h.coinId))
      ),
    [rawHoldings, byId]
  );

  const summary = useMemo(() => summarizePortfolio(holdings), [holdings]);
  const allocation = useMemo(() => computeAllocation(holdings), [holdings]);

  return { holdings, summary, allocation, isLoadingPrices };
}