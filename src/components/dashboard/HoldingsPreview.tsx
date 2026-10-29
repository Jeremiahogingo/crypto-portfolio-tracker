// src/components/dashboard/HoldingsPreview.tsx
//
// Dashboard holdings preview — top 5 by current value, read-only.
//
// Reuses HoldingsTable in readOnly mode so the row styling stays in sync
// with the full portfolio page. Sort by currentValue descending (largest
// positions first — the useful default for a preview).

"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import HoldingsTable from "@/components/tables/HoldingsTable";
import { useHoldingsWithPrices } from "@/hooks/useHoldingsWithPrices";
import type { Holding } from "@/db/schema";

interface HoldingsPreviewProps {
  rawHoldings: Holding[];
}

const PREVIEW_LIMIT = 5;

export default function HoldingsPreview({ rawHoldings }: HoldingsPreviewProps) {
  const { holdings, isLoadingPrices } = useHoldingsWithPrices(rawHoldings);

  const preview = [...holdings]
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, PREVIEW_LIMIT);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text">Holdings</h3>
        <Link href="/portfolio" className="text-xs text-primary hover:underline">
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