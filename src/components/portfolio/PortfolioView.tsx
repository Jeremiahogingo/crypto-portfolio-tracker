// src/components/portfolio/PortfolioView.tsx
//
// Client orchestrator for the Portfolio page.
//
// Ledger values (quantity and cost basis) remain available independently
// of market-data availability. Current valuation and unrealised P&L are
// displayed only when their price requirements are satisfied.

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
const [editTarget, setEditTarget] =
  useState<HoldingWithPrice | null>(null);
const [deleteHoldingTarget, setDeleteHoldingTarget] =
  useState<HoldingWithPrice | null>(null);
const [deleteTransactionTarget, setDeleteTransactionTarget] =
  useState<Transaction | null>(null);


  const hasHoldings = summary.assetCount > 0;
  const hasCompleteValuation = summary.totalValue !== null;

  const displayedPortfolioValue =
    summary.totalValue !== null
      ? formatPrice(summary.totalValue)
      : summary.knownValue > 0
        ? formatPrice(summary.knownValue)
        : !hasHoldings
          ? "$0.00"
          : isLoadingPrices
            ? "Loading…"
            : "Unavailable";

  const portfolioValueLabel =
    !hasHoldings || hasCompleteValuation
      ? "Total Value"
      : summary.knownValue > 0
        ? "Verified Value (partial)"
        : "Total Value";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">
            Portfolio
          </h1>
          <p className="mt-1 text-sm text-secondary">
            {portfolioName}
          </p>
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

      {/* Portfolio summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card hover gradientBorder>
          <p className="text-sm text-secondary">
            {portfolioValueLabel}
          </p>

          <p className="mt-1 text-2xl font-bold text-text">
            {displayedPortfolioValue}
          </p>

          {summary.assetCount > 0 && (
            <p className="mt-1 text-xs text-secondary">
              {summary.assetCount}{" "}
              {summary.assetCount === 1 ? "asset" : "assets"}
            </p>
          )}

          {!summary.hasCompleteValuation && hasHoldings && (
            <p className="mt-2 text-xs text-secondary">
              {summary.pricedCount} of {summary.totalHoldings} holdings
              have verified live prices.
              {summary.fallbackCount > 0 &&
                ` ${summary.fallbackCount} have fallback prices.`}
              {summary.unavailableCount > 0 &&
                ` ${summary.unavailableCount} are unavailable.`}
            </p>
          )}
        </Card>

        <Card hover>
          <p className="text-sm text-secondary">
            Total Cost
          </p>

          <p className="mt-1 text-2xl font-bold text-text">
            {formatPrice(summary.totalCost)}
          </p>

          <p className="mt-1 text-xs text-secondary">
            Based on recorded remaining cost basis
          </p>
        </Card>

        <Card hover>
          <p className="text-sm text-secondary">
            Unrealised P&amp;L
          </p>

          <p
            className={`mt-1 text-2xl font-bold ${
              summary.totalPnl === null
                ? "text-text"
                : summary.totalPnl >= 0
                  ? "text-success"
                  : "text-danger"
            }`}
          >
            {summary.totalPnl === null
              ? "Unavailable"
              : formatSignedCurrency(summary.totalPnl)}
          </p>

          {summary.totalPnlPercent !== null && (
            <Badge
              variant={summary.totalPnl! >= 0 ? "success" : "danger"}
              className="mt-2"
            >
              {formatPercent(summary.totalPnlPercent)}
            </Badge>
          )}

          {summary.totalPnl === null && hasHoldings && (
            <p className="mt-2 text-xs text-secondary">
              A complete live valuation is required to calculate total P&amp;L.
            </p>
          )}
        </Card>

        <Card hover>
          <p className="text-sm text-secondary">
            24h Change
          </p>

          <p
            className={`mt-1 text-2xl font-bold ${
              summary.change24hValue === null
                ? "text-text"
                : summary.change24hValue >= 0
                  ? "text-success"
                  : "text-danger"
            }`}
          >
            {summary.change24hValue === null
              ? "Unavailable"
              : formatSignedCurrency(summary.change24hValue)}
          </p>

          {summary.change24hPercent !== null && (
            <Badge
              variant={
                summary.change24hValue !== null &&
                summary.change24hValue >= 0
                  ? "success"
                  : "danger"
              }
              className="mt-2"
            >
              {formatPercent(summary.change24hPercent)}
            </Badge>
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text">
            Holdings
          </h3>

          {isLoadingPrices && holdings.length > 0 && (
            <span className="text-xs text-secondary">
              Updating prices…
            </span>
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
        <h3 className="mb-4 text-sm font-semibold text-text">
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