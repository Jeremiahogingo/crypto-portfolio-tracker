// src/components/portfolio/EditHoldingModal.tsx

"use client";

import { useActionState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { updateHolding, type HoldingsActionResult } from "@/lib/actions/holdings";
import type { HoldingWithPrice } from "@/types/portfolio";

interface EditHoldingModalProps {
  isOpen: boolean;
  holding: HoldingWithPrice | null;
  onClose: () => void;
}

export default function EditHoldingModal({
  isOpen,
  holding,
  onClose,
}: EditHoldingModalProps) {
  const [state, formAction, isPending] = useActionState<
    HoldingsActionResult | null,
    FormData
  >(async (_prev, formData) => {
    const result = await updateHolding(formData);

    if ("success" in result) onClose();

    return result;
  }, null);

  // Do not render an editing form until a holding has been selected.
  if (!holding) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Holding">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="holdingId" value={holding.id} />

        <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-lg">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text">{holding.symbol}</p>
            <p className="text-xs text-secondary truncate">{holding.coinId}</p>
          </div>
        </div>

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
            defaultValue={holding.quantity}
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
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
            defaultValue={holding.costBasis}
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
          />
        </div>

        <div className="text-xs text-secondary bg-warning/5 border border-warning/20 rounded-lg px-3 py-2">
          Editing corrects the current position. It does not modify your
          transaction history.
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

          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
