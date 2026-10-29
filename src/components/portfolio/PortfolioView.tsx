// src/components/portfolio/PortfolioView.tsx
//
// Client-side wrapper for the Portfolio page.
//
// Receives raw holdings from the server (instant render — no loading flicker),
// enriches with live prices via useHoldingsWithPrices, and owns the modal
// state for Add / Edit / Delete.
//
// This is the pattern we use for every interactive page from here on:
//   Page (server) → fetches DB → passes rows → View (client) → hooks + modals
//
// Keeping the modal state here (not in each row) avoids prop drilling and
// means only one modal is ever open — an invariant enforced by the state
// shape: `editTarget: HoldingWithPrice | null`.

"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import HoldingsTable from "@/components/tables/HoldingsTable";
import AddHoldingModal from "./AddHoldingModal";
import EditHoldingModal from "./EditHoldingModal";
import DeleteHoldingModal from "./DeleteHoldingModal";
import { useHoldingsWithPrices } from "@/hooks/useHoldingsWithPrices";
import {
  formatPrice,
  formatSignedCurrency,
  formatPercent,
} from "@/utils/format";
import type { Holding } from "@/db/schema";
import type { HoldingWithPrice } from "@/types/portfolio";

interface PortfolioViewProps {
  initialHoldings: Holding[];
  portfolioName: string;
}

export default function PortfolioView({
  initialHoldings,
  portfolioName,
}: PortfolioViewProps) {
  const { holdings, summary, isLoadingPrices } =
    useHoldingsWithPrices(initialHoldings);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HoldingWithPrice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HoldingWithPrice | null>(
    null
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Portfolio</h1>
          <p className="text-sm text-secondary mt-1">{portfolioName}</p>
        </div>
        <Button variant="primary" onClick={() => setAddOpen(true)}>
          + Add holding
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover gradientBorder>
          <p className="text-sm text-secondary">Total Value</p>
          <p className="text-2xl font-bold text-text mt-1">
            {formatPrice(summary.totalValue)}
          </p>
          {summary.assetCount > 0 && (
            <p className="text-xs text-secondary mt-1">
              {summary.assetCount} asset{summary.assetCount === 1 ? "" : "s"}
            </p>
          )}
        </Card>
        <Card hover>
          <p className="text-sm text-secondary">Total Cost</p>
          <p className="text-2xl font-bold text-text mt-1">
            {formatPrice(summary.totalCost)}
          </p>
        </Card>
        <Card hover>
          <p className="text-sm text-secondary">Unrealised P&amp;L</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              summary.totalPnl >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {formatSignedCurrency(summary.totalPnl)}
          </p>
          {summary.totalCost > 0 && (
            <Badge
              variant={summary.totalPnl >= 0 ? "success" : "danger"}
              className="mt-2"
            >
              {formatPercent(summary.totalPnlPercent)}
            </Badge>
          )}
        </Card>
        <Card hover>
          <p className="text-sm text-secondary">24h Change</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              summary.change24hValue >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {formatSignedCurrency(summary.change24hValue)}
          </p>
          {summary.totalValue > 0 && (
            <Badge
              variant={summary.change24hValue >= 0 ? "success" : "danger"}
              className="mt-2"
            >
              {formatPercent(summary.change24hPercent)}
            </Badge>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text">Holdings</h3>
          {isLoadingPrices && holdings.length > 0 && (
            <span className="text-xs text-secondary">Updating prices…</span>
          )}
        </div>
        <HoldingsTable
          holdings={holdings}
          isLoadingPrices={isLoadingPrices}
          onAdd={() => setAddOpen(true)}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
        />
      </Card>

      <AddHoldingModal isOpen={addOpen} onClose={() => setAddOpen(false)} />
      <EditHoldingModal
        isOpen={Boolean(editTarget)}
        holding={editTarget}
        onClose={() => setEditTarget(null)}
      />
      <DeleteHoldingModal
        isOpen={Boolean(deleteTarget)}
        holding={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}