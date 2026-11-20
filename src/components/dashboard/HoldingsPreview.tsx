// src/components/dashboard/HoldingsPreview.tsx
//
// Dashboard holdings preview — top five positions.
// Live-priced holdings are prioritised, followed by indicative fallback
// prices and then unavailable positions.

"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import HoldingsTable from "@/components/tables/HoldingsTable";
import { useHoldingsWithPrices } from "@/hooks/useHoldingsWithPrices";
import type { Holding } from "@/db/schema";
import type { PriceStatus } from "@/types/valuation";

interface HoldingsPreviewProps {
  rawHoldings: Holding[];
}

const PREVIEW_LIMIT = 5;

const PRICE_STATUS_ORDER: Record<PriceStatus, number> = {
  live: 0,
  fallback: 1,
  unavailable: 2,
};

export default function HoldingsPreview({
  rawHoldings,
}: HoldingsPreviewProps) {
  const { holdings, isLoadingPrices } =
    useHoldingsWithPrices(rawHoldings);

  const preview = [...holdings]
    .sort((a, b) => {
      const statusDifference =
        PRICE_STATUS_ORDER[a.priceStatus] -
        PRICE_STATUS_ORDER[b.priceStatus];

      if (statusDifference !== 0) {
        return statusDifference;
      }

      // Null means unknown, not zero. Within the same price status,
      // positions with a known value should appear before unknown values.
      const aValue = a.currentValue ?? Number.NEGATIVE_INFINITY;
      const bValue = b.currentValue ?? Number.NEGATIVE_INFINITY;

      return bValue - aValue;
    })
    .slice(0, PREVIEW_LIMIT);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">
          Holdings
        </h3>

        <Link
          href="/portfolio"
          className="text-xs text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      <HoldingsTable
        holdings={preview}
        isLoadingPrices={isLoadingPrices}
        readOnly
      />
    </Card>
  );
}