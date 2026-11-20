// src/components/watchlist/AddWatchlistCoinModal.tsx

"use client";

import { useActionState, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import {
  addToWatchlist,
  type WatchlistActionResult,
} from "@/lib/actions/watchlist";
import { useMarkets } from "@/hooks/useMarkets";
import { formatPrice } from "@/utils/format";

interface AddWatchlistCoinModalProps {
  isOpen: boolean;
  /** Coin IDs already tracked by the user. */
  existingCoinIds: string[];
  onClose: () => void;
}

export default function AddWatchlistCoinModal({
  isOpen,
  existingCoinIds,
  onClose,
}: AddWatchlistCoinModalProps) {
  const { coins, meta, isLoading } = useMarkets({ per_page: 100 });
  const [selectedCoinId, setSelectedCoinId] = useState("");

  const availableCoins = useMemo(() => {
    const existingIds = new Set(existingCoinIds);
    return coins.filter((coin) => !existingIds.has(coin.id));
  }, [coins, existingCoinIds]);

  const selectedCoin = availableCoins.find(
    (coin) => coin.id === selectedCoinId
  );

  const resetForm = () => {
    setSelectedCoinId("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const [state, formAction, isPending] = useActionState<
    WatchlistActionResult | null,
    FormData
  >(async (_prev, formData) => {
    const result = await addToWatchlist(formData);

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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add to watchlist"
    >
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
          ) : availableCoins.length === 0 ? (
            <p className="py-2 text-sm text-secondary">
              All top-100 coins are already in your watchlist.
            </p>
          ) : (
            <select
              value={selectedCoinId}
              onChange={(event) => setSelectedCoinId(event.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
            >
              <option value="">Select a coin…</option>

              {availableCoins.map((coin) => (
                <option key={coin.id} value={coin.id}>
                  {coin.symbol} — {coin.name} ({priceLabel(coin.price)})
                </option>
              ))}
            </select>
          )}
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
            {isPending ? "Adding…" : "Add to watchlist"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}