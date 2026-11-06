// src/components/alerts/CreateAlertModal.tsx
//
// Create a price alert.
//
// Same coin picker as AddHoldingModal / AddWatchlistCoinModal — the top 100
// by market cap via useMarkets. Target price defaults to a sensible offset
// from the current price based on condition:
//   • "above" → current price + 20%
//   • "below" → current price − 20%
// This is a soft suggestion, not a hard default. Users editing the field
// for a specific thesis will overwrite it; users exploring will start with
// a reasonable number.
//
// The action validates server-side. If a user submits a stale form (e.g.
// current price moved since the modal opened), the server still enforces
// the target > 0 rule — an oversold or nonsensical value would be rejected
// with a specific message.

"use client";

import { useActionState, useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import CoinLogo from "@/components/ui/CoinLogo";
import {
  createAlert,
  type AlertActionResult,
} from "@/lib/actions/alerts";
import { useMarkets } from "@/hooks/useMarkets";
import { formatPrice } from "@/utils/format";

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateAlertModal({
  isOpen,
  onClose,
}: CreateAlertModalProps) {
  const { coins, isLoading } = useMarkets({ per_page: 100 });

  const [coinId, setCoinId] = useState("");
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [targetPrice, setTargetPrice] = useState("");

  const selectedCoin = coins.find((c) => c.id === coinId);

  // Auto-suggest a target price when a coin is selected. Cleared on coin
  // change so switching coins doesn't leave a target tuned for the old one.
  useEffect(() => {
    if (selectedCoin) {
      const multiplier = condition === "above" ? 1.2 : 0.8;
      setTargetPrice((selectedCoin.price * multiplier).toFixed(2));
    }
  }, [selectedCoin, condition]);

  const [state, formAction, isPending] = useActionState<
    AlertActionResult | null,
    FormData
  >(async (_prev, formData) => {
    const result = await createAlert(formData);
    if ("success" in result) {
      setCoinId("");
      setCondition("above");
      setTargetPrice("");
      onClose();
    }
    return result;
  }, null);

  useEffect(() => {
    if (!isOpen) {
      setCoinId("");
      setCondition("above");
      setTargetPrice("");
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create alert">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="coinId" value={coinId} />
        <input type="hidden" name="symbol" value={selectedCoin?.symbol ?? ""} />
        <input type="hidden" name="condition" value={condition} />

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
                Current price: {formatPrice(selectedCoin.price)}
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-secondary mb-2">
            Condition
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCondition("above")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                condition === "above"
                  ? "bg-primary text-white"
                  : "bg-surface border border-white/10 text-secondary"
              }`}
            >
              Price above
            </button>
            <button
              type="button"
              onClick={() => setCondition("below")}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                condition === "below"
                  ? "bg-primary text-white"
                  : "bg-surface border border-white/10 text-secondary"
              }`}
            >
              Price below
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-secondary mb-2">
            Target price (USD)
          </label>
          <input
            type="number"
            name="targetPrice"
            step="any"
            min="0"
            required
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder="Enter target"
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text placeholder-secondary focus:outline-none focus:border-primary"
          />
          <p className="text-xs text-secondary mt-1">
            You&apos;ll see a "Target hit" badge when this price is crossed.
          </p>
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
            {isPending ? "Creating…" : "Create alert"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}