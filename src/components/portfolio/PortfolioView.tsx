// src/components/portfolio/PortfolioView.tsx
//
// Client orchestrator for the Portfolio page.
//
// Two entry points for changing a position:
//   • "Add holding" — sets an initial position (2.4a). Use for backfilling
//     existing holdings without recording every historical trade.
//   • "Record transaction" — records an actual buy or sell against the
//     ledger (this step). Use for ongoing activity.
//
// Both reconcile through recomputeHolding, so the dashboard, portfolio,
// and analytics always agree.

"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import HoldingsTable from "@/components/tables/HoldingsTable";
import TransactionHistory from "@/components/tables/TransactionHistory";
import AddHoldingModal from "./AddHoldingModal";
import AddTransactionModal from "./AddTransactionModal";
import EditHoldingModal from "./EditHoldingModal";
import DeleteHoldingModal from "./DeleteHoldingModal";
import DeleteTransactionModal from "./DeleteTransactionModal";
import { useHoldingsWithPrices } from "@/hooks/useHoldingsWithPrices";
import {
  formatPrice,
  formatSignedCurrency,
  formatPercent,
} from "@/utils/format";
import type { Holding, Transaction } from "@/db/schema";
import type { HoldingWithPrice } from "@/types/portfolio";

interface PortfolioViewProps {
  initialHoldings: Holding[];
  initialTransactions: Transaction[];
  portfolioName: string;
}

export default function PortfolioView({
  initialHoldings,
  initialTransactions,
  portfolioName,
}: PortfolioViewProps) {
  const { holdings, summary, isLoadingPrices } =
    useHoldingsWithPrices(initialHoldings);

  const [addHoldingOpen, setAddHoldingOpen] = useState(false);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HoldingWithPrice | null>(null);
  const [deleteHoldingTarget, setDeleteHoldingTarget] =
    useState<HoldingWithPrice | null>(null);
  const [deleteTransactionTarget, setDeleteTransactionTarget] =
    useState<Transaction | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Portfolio</h1>
          <p className="text-sm text-secondary mt-1">{portfolioName}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setAddHoldingOpen(true)}
          >
            + Add holding
          </Button>
          <Button
            variant="primary"
            onClick={() => setAddTransactionOpen(true)}
          >
            + Record transaction
          </Button>
        </div>
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
          onAdd={() => setAddHoldingOpen(true)}
          onEdit={setEditTarget}
          onDelete={setDeleteHoldingTarget}
        />
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-text mb-4">
          Transaction History
        </h3>
        <TransactionHistory
          transactions={initialTransactions}
          onDelete={setDeleteTransactionTarget}
        />
      </Card>

      <AddHoldingModal
        isOpen={addHoldingOpen}
        onClose={() => setAddHoldingOpen(false)}
      />
      <AddTransactionModal
        isOpen={addTransactionOpen}
        holdings={holdings}
        onClose={() => setAddTransactionOpen(false)}
      />
      <EditHoldingModal
        isOpen={Boolean(editTarget)}
        holding={editTarget}
        onClose={() => setEditTarget(null)}
      />
      <DeleteHoldingModal
        isOpen={Boolean(deleteHoldingTarget)}
        holding={deleteHoldingTarget}
        onClose={() => setDeleteHoldingTarget(null)}
      />
      <DeleteTransactionModal
        isOpen={Boolean(deleteTransactionTarget)}
        transaction={deleteTransactionTarget}
        onClose={() => setDeleteTransactionTarget(null)}
      />
    </div>
  );
}