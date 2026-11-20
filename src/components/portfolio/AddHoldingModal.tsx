// src/components/portfolio/AddHoldingModal.tsx

"use client";

import { useActionState, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import CoinLogo from "@/components/ui/CoinLogo";
import {
  addHolding,
  type HoldingsActionResult,
} from "@/lib/actions/holdings";
import { useMarkets } from "@/hooks/useMarkets";
import { formatPrice } from "@/utils/format";

interface AddHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddHoldingModal({
  isOpen,
  onClose,
}: AddHoldingModalProps) {
  const { coins, meta, isLoading } = useMarkets({ per_page: 100 });

  const [selectedCoinId, setSelectedCoinId] = useState("");
  const [costBasis, setCostBasis] = useState("");

  const selectedCoin = coins.find(
    (coin) => coin.id === selectedCoinId
  );

  const hasLivePrice =
    meta?.source === "live" &&
    selectedCoin?.price !== null &&
    selectedCoin?.price !== undefined &&
    selectedCoin.price > 0;

  const resetForm = () => {
    setSelectedCoinId("");
    setCostBasis("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCoinChange = (nextCoinId: string) => {
    const coin = coins.find((item) => item.id === nextCoinId);

    setSelectedCoinId(nextCoinId);

    // Only prefill from a verified live quote.
    // A fallback or unavailable quote must not become a suggested basis.
    setCostBasis(
      meta?.source === "live" &&
        coin?.price !== null &&
        coin?.price !== undefined &&
        coin.price > 0
        ? coin.price.toString()
        : ""
    );
  };

  const [state, formAction, isPending] = useActionState<
    HoldingsActionResult | null,
    FormData
  >(async (_prev, formData) => {
    const result = await addHolding(formData);

    if ("success" in result) {
      handleClose();
    }

    return result;
  }, null);

  const priceLabel = (price: number | null) => {
    if (price === null) return "Price unavailable";

    return meta?.source === "live"
      ? formatPrice(price)
      : `≈ ${formatPrice(price)} (fallback)`;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Holding">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="coinId" value={selectedCoinId} />
        <input
          type="hidden"
          name="symbol"
          value={selectedCoin?.symbol ?? ""}
        />

        <div>
          <label className="mb-2 block text-xs font-medium text-secondary">
            Coin
          </label>

          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <select
              value={selectedCoinId}
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
                {selectedCoin.price === null
                  ? "Current market price unavailable"
                  : meta?.source === "live"
                    ? `Current live price: ${formatPrice(selectedCoin.price)}`
                    : `Indicative fallback price: ${formatPrice(selectedCoin.price)}`}
              </p>
            </div>
          </div>
        )}

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
            placeholder="e.g. 0.5"
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-text placeholder-secondary focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-secondary">
            Cost basis (price per unit, USD)
          </label>

          <input
            type="number"
            name="costBasis"
            step="any"
            min="0"
            required
            value={costBasis}
            onChange={(event) => setCostBasis(event.target.value)}
            placeholder="e.g. 65000"
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-text placeholder-secondary focus:border-primary focus:outline-none"
          />

          <p className="mt-1 text-xs text-secondary">
            Enter the actual amount paid per coin.{" "}
            {hasLivePrice
              ? "A live market price was prefilled as a starting point; edit it to match your acquisition."
              : "No verified live quote is available to prefill this field."}
          </p>
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
            disabled={isPending || !selectedCoinId}
          >
            {isPending ? "Adding…" : "Add holding"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}