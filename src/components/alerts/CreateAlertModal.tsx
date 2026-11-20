"use client";

import { useActionState, useState } from "react";
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
  const { coins, meta, isLoading } = useMarkets({ per_page: 100 });

  const [coinId, setCoinId] = useState("");
  const [condition, setCondition] =
    useState<"above" | "below">("above");

  const [targetPriceOverride, setTargetPriceOverride] =
    useState<string | null>(null);

  const selectedCoin = coins.find((coin) => coin.id === coinId);

  // Do not derive a suggested alert target from fallback or unavailable data.
  const selectedLivePrice =
    meta?.source === "live" &&
    selectedCoin !== undefined &&
    selectedCoin.price !== null &&
    selectedCoin.price > 0
      ? selectedCoin.price
      : null;

  const suggestedTargetPrice =
    selectedLivePrice === null
      ? ""
      : (
          selectedLivePrice *
          (condition === "above" ? 1.2 : 0.8)
        ).toFixed(2);

  const targetPrice =
    targetPriceOverride ?? suggestedTargetPrice;

  const resetForm = () => {
    setCoinId("");
    setCondition("above");
    setTargetPriceOverride(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const [state, formAction, isPending] = useActionState<
    AlertActionResult | null,
    FormData
  >(async (_prev, formData) => {
    const result = await createAlert(formData);

    if ("success" in result) {
      resetForm();
      onClose();
    }

    return result;
  }, null);

  const handleCoinChange = (nextCoinId: string) => {
    setCoinId(nextCoinId);
    setTargetPriceOverride(null);
  };

  const handleConditionChange = (
    nextCondition: "above" | "below"
  ) => {
    setCondition(nextCondition);
    setTargetPriceOverride(null);
  };

  const getCoinPriceLabel = (price: number | null) => {
    if (price === null) {
      return "Price unavailable";
    }

    return meta?.source === "live"
      ? formatPrice(price)
      : `≈ ${formatPrice(price)} (fallback)`;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create alert">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="coinId" value={coinId} />
        <input
          type="hidden"
          name="symbol"
          value={selectedCoin?.symbol ?? ""}
        />
        <input type="hidden" name="condition" value={condition} />

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
                  {coin.symbol} — {coin.name} (
                  {getCoinPriceLabel(coin.price)})
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
                  ? "Current market price unavailable."
                  : meta?.source === "live"
                    ? `Current price: ${formatPrice(selectedCoin.price)}`
                    : `Indicative fallback price: ${formatPrice(selectedCoin.price)}`}
              </p>
            </div>
          </div>
        )}

        {selectedCoin && selectedLivePrice === null && (
          <p className="rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-warning">
            A live price is not available for this coin. Enter your alert
            target manually; fallback data is not used to suggest a target.
          </p>
        )}

        <div>
          <label className="mb-2 block text-xs font-medium text-secondary">
            Condition
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleConditionChange("above")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                condition === "above"
                  ? "bg-primary text-white"
                  : "border border-white/10 bg-surface text-secondary"
              }`}
            >
              Price above
            </button>

            <button
              type="button"
              onClick={() => handleConditionChange("below")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                condition === "below"
                  ? "bg-primary text-white"
                  : "border border-white/10 bg-surface text-secondary"
              }`}
            >
              Price below
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-secondary">
            Target price (USD)
          </label>

          <input
            type="number"
            name="targetPrice"
            step="any"
            min="0"
            required
            value={targetPrice}
            onChange={(event) =>
              setTargetPriceOverride(event.target.value)
            }
            placeholder="Enter target"
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-text placeholder-secondary focus:border-primary focus:outline-none"
          />

          <p className="mt-1 text-xs text-secondary">
            The target status is evaluated from a verified live market quote.
            Alerts do not currently deliver email or push notifications.
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
            disabled={isPending || !coinId}
          >
            {isPending ? "Creating…" : "Create alert"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}