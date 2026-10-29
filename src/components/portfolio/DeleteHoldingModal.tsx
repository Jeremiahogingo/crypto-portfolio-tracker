// src/components/portfolio/DeleteHoldingModal.tsx
//
// Confirmation modal for deleting a holding.
//
// Deletion is destructive and irreversible, so it requires explicit
// confirmation. The copy warns that the transaction ledger for this coin
// will also be cleared — matching the deleteHolding action's behavior.

"use client";

import { useActionState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { deleteHolding, type HoldingsActionResult } from "@/lib/actions/holdings";
import type { HoldingWithPrice } from "@/types/portfolio";

interface DeleteHoldingModalProps {
  isOpen: boolean;
  holding: HoldingWithPrice | null;
  onClose: () => void;
}

export default function DeleteHoldingModal({
  isOpen,
  holding,
  onClose,
}: DeleteHoldingModalProps) {
  const [state, formAction, isPending] = useActionState<
    HoldingsActionResult | null,
    FormData
  >(async (_prev, formData) => {
    const result = await deleteHolding(formData);
    if ("success" in result) onClose();
    return result;
  }, null);

  if (!holding) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Holding">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="holdingId" value={holding.id} />

        <p className="text-sm text-text">
          Remove <span className="font-semibold">{holding.symbol}</span> from
          your portfolio?
        </p>
        <p className="text-xs text-secondary">
          This also deletes all transactions for this coin in this portfolio.
          This action cannot be undone.
        </p>

        {state && "error" in state && (
          <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            {state.error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={isPending}>
            {isPending ? "Deleting…" : "Delete holding"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}