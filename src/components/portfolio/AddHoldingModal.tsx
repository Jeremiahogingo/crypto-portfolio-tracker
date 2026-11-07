
"use client";

import { useActionState, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import CoinLogo from "@/components/ui/CoinLogo";
import { addHolding, type HoldingsActionResult } from "@/lib/actions/holdings";
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
  const { coins, isLoading } = useMarkets({ per_page: 100 });

  const [selectedCoinId, setSelectedCoinId] = useState("");
  const [costBasis, setCostBasis] = useState("");

  const selectedCoin = coins.find((coin) => coin.id === selectedCoinId);

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
    setCostBasis(coin ? coin.price.toString() : "");
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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Holding">
      <form action={formAction} className="space-y-4">
        {/* Hidden inputs carry the coin metadata through FormData */}
        <input type="hidden" name="coinId" value={selectedCoinId} />
        <input
          type="hidden"
          name="symbol"
          value={selectedCoin?.symbol ?? ""}
        />

        <div>
          <label className="block text-xs font-medium text-secondary mb-2">
            Coin
          </label>

          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <select
              value={selectedCoinId}
              onChange={(event) => handleCoinChange(event.target.value)}
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
            Quantity
          </label>

          <input
            type="number"
            name="quantity"
            step="any"
            min="0"
            required
            placeholder="e.g. 0.5"
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text placeholder-secondary focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-secondary mb-2">
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
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text placeholder-secondary focus:outline-none focus:border-primary"
          />

          <p className="text-xs text-secondary mt-1">
            What you paid per coin. Pre-filled with the current price — edit
            for older positions.
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
