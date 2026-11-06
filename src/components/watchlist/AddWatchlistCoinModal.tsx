// src/components/watchlist/AddWatchlistCoinModal.tsx
//
// Modal for adding a coin to the watchlist.
//
// Coin picker pulls from the top 100 by market cap — the same set used by
// AddHoldingModal. That covers ~99% of users' interest. Adding search
// across all coins is deferred to Phase 5; using the top 100 keeps the
// modal self-contained and the payload small.
//
// Coins already in the watchlist are filtered out of the dropdown — no
// reason to show a coin the user can't act on. If the user has every coin
// in the top 100 (unlikely), the dropdown would be empty; the submit
// button disables itself in that case.

"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
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
  /** Coin IDs already in the watchlist — excluded from the dropdown. */
  existingCoinIds: string[];
  onClose: () => void;
}

export default function AddWatchlistCoinModal({
  isOpen,
  existingCoinIds,
  onClose,
}: AddWatchlistCoinModalProps) {
  const { coins, isLoading } = useMarkets({ per_page: 100 });
  const [selectedCoinId, setSelectedCoinId] = useState("");

  const available = useMemo(() => {
    const existing = new Set(existingCoinIds);
    return coins.filter((c) => !existing.has(c.id));
  }, [coins, existingCoinIds]);

  const selectedCoin = available.find((c) => c.id === selectedCoinId);

  const [state, formAction, isPending] = useActionState<
    WatchlistActionResult | null,
    FormData
  >(async (_prev, formData) => {
    const result = await addToWatchlist(formData);
    if ("success" in result) {
      setSelectedCoinId("");
      onClose();
    }
    return result;
  }, null);

  useEffect(() => {
    if (!isOpen) setSelectedCoinId("");
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add to watchlist">
      <form action={formAction} className="space-y-4">
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
          ) : available.length === 0 ? (
            <p className="text-sm text-secondary py-2">
              All top-100 coins are already in your watchlist.
            </p>
          ) : (
            <select
              value={selectedCoinId}
              onChange={(e) => setSelectedCoinId(e.target.value)}
              required
              className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
            >
              <option value="">Select a coin…</option>
              {available.map((coin) => (
                <option key={coin.id} value={coin.id}>
                  {coin.symbol} — {coin.name} ({formatPrice(coin.price)})
                </option>
              ))}
            </select>
          )}
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
            disabled={isPending || !selectedCoinId}
          >
            {isPending ? "Adding…" : "Add to watchlist"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}