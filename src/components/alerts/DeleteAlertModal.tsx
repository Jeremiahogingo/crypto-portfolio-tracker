// src/components/alerts/DeleteAlertModal.tsx
//
// Confirmation modal for deleting a price alert.
//
// Confirmation is warranted here (unlike watchlist removal): an alert
// encodes the user's intent — "I want to be reminded when BTC hits 140k" —
// which is harder to reconstruct from memory than "I was watching this coin".
// A confirm step prevents accidental destruction of that intent.

"use client";

import { useActionState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import {
  deleteAlert,
  type AlertActionResult,
} from "@/lib/actions/alerts";
import { formatPrice } from "@/utils/format";
import type { AlertWithPrice } from "@/types/alerts";

interface DeleteAlertModalProps {
  isOpen: boolean;
  alert: AlertWithPrice | null;
  onClose: () => void;
}

export default function DeleteAlertModal({
  isOpen,
  alert,
  onClose,
}: DeleteAlertModalProps) {
  const [state, formAction, isPending] = useActionState<
    AlertActionResult | null,
    FormData
  >(async (_prev, formData) => {
    const result = await deleteAlert(formData);
    if ("success" in result) onClose();
    return result;
  }, null);

  if (!alert) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete alert">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="alertId" value={alert.id} />

        <p className="text-sm text-text">
          Delete the alert for{" "}
          <span className="font-semibold">
            {alert.symbol} {alert.condition === "above" ? "above" : "below"}{" "}
            {formatPrice(alert.targetPrice)}
          </span>
          ?
        </p>
        <p className="text-xs text-secondary">
          This cannot be undone. If you just want to pause it, use the toggle
          on the alert card instead.
        </p>

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
          <Button type="submit" variant="danger" disabled={isPending}>
            {isPending ? "Deleting…" : "Delete alert"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}