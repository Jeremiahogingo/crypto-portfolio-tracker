// src/components/portfolio/AddTransactionModal.tsx
//
// Record a buy or sell against the ledger.
//
// ─── Flow ────────────────────────────────────────────────────────────────
// 1. Pick coin (from the top 100 by market cap, same source as AddHolding).
// 2. Pick type: buy or sell.
// 3. Enter quantity and price. Price auto-fills from live market data for
//    buys (users typically transact near market) and stays editable.
// 4. Optional: backdate the transaction. Defaults to now.
// 5. Submit. On success: closes, holdings and history update everywhere.
//
// ─── Sell hint ───────────────────────────────────────────────────────────
// When type=sell and the user already holds the coin, show the current
// quantity so they know their limit before submitting. The server enforces
// it (recompute throws), but a client-side hint prevents the round-trip
// failure and is better UX.
//
// ─── Why no available-quantity validation client-side ────────────────────
// Because the server owns the truth. A user could have the modal open in
// two tabs and commit an oversell on one — the server rejects, the client
// shows an inline error, nothing corrupts. Pre-validating client-side and
// then hitting a race is worse than just letting the server be
// authoritative and showing its error.

"use client";

import { useActionState, useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import CoinLogo from "@/components/ui/CoinLogo";
import {
  addTransaction,
  type TransactionActionResult,
} from "@/lib/actions/transactions";
import { useMarkets } from "@/hooks/useMarkets";
import { formatPrice, formatQuantity } from "@/utils/format";
import type { HoldingWithPrice } from "@/types/portfolio";

interface AddTransactionModalProps {
  isOpen: boolean;
  /** Enriched holdings — used to show "you hold X" hints on sell. */
  holdings: HoldingWithPrice[];
  onClose: () => void;
}

export default function AddTransactionModal({
  isOpen,
  holdings,
  onClose,
}: AddTransactionModalProps) {
  const { coins, isLoading } = useMarkets({ per_page: 100 });

  const [type, setType] = useState<"buy" | "sell">("buy");
  const [coinId, setCoinId] = useState("");
  const [price, setPrice] = useState("");

  const selectedCoin = coins.find((c) => c.id === coinId);
  const existingHolding = holdings.find((h) => h.coinId === coinId);

  // Auto-fill price from live data when coin changes and price is empty.
  // Doesn't overwrite user input — the guard keeps manual edits intact.
  useEffect(() => {
    if (selectedCoin && !price) {
      setPrice(selectedCoin.price.toString());
    }
  }, [selectedCoin, price]);

  const [state, formAction, isPending] = useActionState<
    TransactionActionResult | null,
    FormData
  >(async (_prev, formData) => {
    const result = await addTransaction(formData);
    if ("success" in result) onClose();
    return result;
  }, null);

  // Clean up when the modal closes so reopens start fresh.
  useEffect(() => {
    if (!isOpen) {
      setType("buy");
      setCoinId("");
      setPrice("");
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record transaction">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="coinId" value={coinId} />
        <input type="hidden" name="symbol" value={selectedCoin?.symbol ?? ""} />
        <input type="hidden" name="type" value={type} />

        {/* Type toggle */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-2">
            Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("buy")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === "buy"
                  ? "bg-success/20 text-success border border-success/30"
                  : "bg-surface border border-white/10 text-secondary"
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setType("sell")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === "sell"
                  ? "bg-danger/20 text-danger border border-danger/30"
                  : "bg-surface border border-white/10 text-secondary"
              }`}
            >
              Sell
            </button>
          </div>
        </div>

        {/* Coin picker */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-2">
            Coin
          </label>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <select
              value={coinId}
              onChange={(e) => setCoinId(e.target.value)}
              required
              className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
            >
              <option value="">Select a coin…</option>
              {coins.map((coin) => (
                <option key={coin.id} value={coin.id}>
                  {coin.symbol} — {coin.name} ({formatPrice(coin.price)})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected coin banner with sell hint */}
        {selectedCoin && (
          <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-lg">
            <CoinLogo
              src={selectedCoin.logoUrl}
              alt={selectedCoin.name}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate">
                {selectedCoin.name}
              </p>
              <p className="text-xs text-secondary">
                {type === "sell" && existingHolding
                  ? `You hold ${formatQuantity(existingHolding.quantity)} ${existingHolding.symbol}`
                  : `Market price: ${formatPrice(selectedCoin.price)}`}
              </p>
            </div>
          </div>
        )}

        {/* Quantity + price in a two-column row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-secondary mb-2">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              step="any"
              min="0"
              required
              placeholder="0.5"
              className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text placeholder-secondary focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary mb-2">
              Price per unit (USD)
            </label>
            <input
              type="number"
              name="pricePerUnit"
              step="any"
              min="0"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="65000"
              className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text placeholder-secondary focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Executed at */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-2">
            When
          </label>
          <input
            type="datetime-local"
            name="executedAt"
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
          />
          <p className="text-xs text-secondary mt-1">
            Leave blank for now — useful for backfilling historical trades.
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-secondary mb-2">
            Notes (optional)
          </label>
          <input
            type="text"
            name="notes"
            maxLength={500}
            placeholder="e.g. DCA buy"
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text placeholder-secondary focus:outline-none focus:border-primary"
          />
        </div>

        {state && "error" in state && (
          <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            {state.error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isPending || !coinId}
          >
            {isPending
              ? "Recording…"
              : type === "buy"
              ? "Record buy"
              : "Record sell"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}