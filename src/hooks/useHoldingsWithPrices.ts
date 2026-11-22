/**
 * src/hooks/useHoldingsWithPrices.ts
 *
 * Merge persisted ledger holdings with client-fetched market quotes.
 *
 * Holdings come from the database. Market prices come from React Query.
 *
 * Price provenance is preserved conservatively:
 * - Live market prices can contribute to verified valuations.
 * - Cached and static fallback prices remain indicative.
 * - Missing prices remain unavailable.
 */

"use client";

import { useMemo } from "react";

import { useMarkets } from "@/hooks/useMarkets";

import {
  computeAllocation,
  enrichHolding,
  summarizePortfolio,
} from "@/lib/portfolio/calc";

import type { Holding } from "@/db/schema";

import type {
  AllocationSlice,
  HoldingWithPrice,
  PortfolioSummary,
} from "@/types/portfolio";

interface UseHoldingsWithPricesResult {
  holdings: HoldingWithPrice<Holding>[];
  summary: PortfolioSummary;
  allocation: AllocationSlice[];

  /** True while the market request is in flight. */
  isLoadingPrices: boolean;
}

export function useHoldingsWithPrices(
  rawHoldings: Holding[]
): UseHoldingsWithPricesResult {
  const ids = useMemo(
    () => rawHoldings.map((holding) => holding.coinId),
    [rawHoldings]
  );

  const {
    coins,
    meta,
    isLoading: isLoadingPrices,
  } = useMarkets(
    {
      ids,
      per_page: Math.max(ids.length, 1),
    },
    {
      enabled: ids.length > 0,
    }
  );

  const byId = useMemo(
    () => new Map(coins.map((coin) => [coin.id, coin])),
    [coins]
  );

  const holdings = useMemo(
    () =>
      rawHoldings.map((holding) => {
        const marketCoin = byId.get(holding.coinId);

        if (!marketCoin) {
          return enrichHolding(holding);
        }

        return enrichHolding(holding, {
          price: marketCoin.price,
          change24h: marketCoin.change24h,

          // Cached provider data must not be treated as a verified
          // live quote by the portfolio valuation layer.
          source:
            meta?.source === "live"
              ? "live"
              : "fallback",
        });
      }),
    [rawHoldings, byId, meta?.source]
  );

  const summary = useMemo(
    () => summarizePortfolio(holdings),
    [holdings]
  );

  const allocation = useMemo(
    () => computeAllocation(holdings),
    [holdings]
  );

  return {
    holdings,
    summary,
    allocation,
    isLoadingPrices,
  };
}