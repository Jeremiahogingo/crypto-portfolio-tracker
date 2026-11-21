// src/components/portfolio/AddTransactionModal.tsx

"use client";

import { useActionState, useState } from "react";
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
  holdings: HoldingWithPrice[];
  onClose: () => void;
}

export default function AddTransactionModal({
  isOpen,
  holdings,
  onClose,
}: AddTransactionModalProps) {
  const { coins, meta, isLoading } = useMarkets({ per_page: 100 });

  const [type, setType] = useState<"buy" | "sell">("buy");
  const [coinId, setCoinId] = useState("");
  const [price, setPrice] = useState("");

  const selectedCoin = coins.find((coin) => coin.id === coinId);

  const existingHolding = holdings.find(
    (holding) => holding.coinId === coinId
  );

  const resetForm = () => {
    setType("buy");
    setCoinId("");
    setPrice("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCoinChange = (nextCoinId: string) => {
    setCoinId(nextCoinId);

    // Only use a live, positive quote as a suggested execution price.
    // A fallback or unavailable quote requires manual entry.
    if (!price) {
      const coin = coins.find((item) => item.id === nextCoinId);

      setPrice(
        meta?.source === "live" &&
          coin?.price !== null &&
          coin?.price !== undefined &&
          coin.price > 0
          ? coin.price.toString()
          : ""
      );
    }
  };

  const [state, formAction, isPending] = useActionState<
    TransactionActionResult | null,
    FormData
  >(async (_prev, formData) => {
    const result = await addTransaction(formData);

    if ("success" in result) {
      handleClose();
    }

    return result;
  }, null);

  const priceLabel = (value: number | null) => {
    if (value === null) return "Price unavailable";

    return meta?.source === "live"
      ? formatPrice(value)
      : `≈ ${formatPrice(value)} (fallback)`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record transaction"
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="coinId" value={coinId} />
        <input
          type="hidden"
          name="symbol"
          value={selectedCoin?.symbol ?? ""}
        />
        <input type="hidden" name="type" value={type} />

        <div>
          <label className="mb-2 block text-xs font-medium text-secondary">
            Type
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("buy")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                type === "buy"
                  ? "border border-success/30 bg-success/20 text-success"
                  : "border border-white/10 bg-surface text-secondary"
              }`}
            >
              Buy
            </button>

            <button
              type="button"
              onClick={() => setType("sell")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                type === "sell"
                  ? "border border-danger/30 bg-danger/20 text-danger"
                  : "border border-white/10 bg-surface text-secondary"
              }`}
            >
              Sell
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-secondary">
            Coin
          </label>

          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <select
              value={coinId}
              onChange={(event) => handleCoinChange(event.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
            >
              <option value="">Select a coin…</option>

              {coins.map((coin) => (
                <option key={coin.id} value={coin.id}>
                  {coin.symbol} — {coin.name} ({priceLabel(coin.price)})
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedCoin && (
          <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <CoinLogo
              src={selectedCoin.logoUrl}
              alt={selectedCoin.name}
              size="md"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text">
                {selectedCoin.name}
              </p>

              <p className="text-xs text-secondary">
                {type === "sell" && existingHolding
                  ? `You hold ${formatQuantity(existingHolding.quantity)} ${existingHolding.symbol}`
                  : selectedCoin.price === null
                    ? "Market price unavailable — enter transaction price manually"
                    : meta?.source === "live"
                      ? `Live market price: ${formatPrice(selectedCoin.price)}`
                      : `Indicative fallback price: ${formatPrice(selectedCoin.price)}`}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-xs font-medium text-secondary">
              Quantity
            </label>

            <input
              type="number"
              name="quantity"
              step="any"
              min="0"
              required
              placeholder="0.5"
              className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-text placeholder-secondary focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-secondary">
              Price per unit (USD)
            </label>

            <input
              type="number"
              name="pricePerUnit"
              step="any"
              min="0"
              required
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="Enter execution price"
              className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-text placeholder-secondary focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <p className="text-xs text-secondary">
          Record the actual execution price for the trade. A market quote
          is only a suggestion and may differ from your execution.
        </p>

        <div>
          <label className="mb-2 block text-xs font-medium text-secondary">
            When
          </label>

          <input
            type="datetime-local"
            name="executedAt"
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
          />

          <p className="mt-1 text-xs text-secondary">
            Leave blank to use the current time. Enter a date to backfill
            a historical trade.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-secondary">
            Notes (optional)
          </label>

          <input
            type="text"
            name="notes"
            maxLength={500}
            placeholder="e.g. DCA buy"
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-text placeholder-secondary focus:border-primary focus:outline-none"
          />
        </div>

        {state && "error" in state && (
          <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-xs text-danger">
            {state.error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
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