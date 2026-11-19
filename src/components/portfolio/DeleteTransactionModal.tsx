// src/components/portfolio/DeleteTransactionModal.tsx
//
// Confirmation modal for deleting a ledger event.
//
// Deleting any event causes the current position to be reconstructed from
// the remaining ledger. The server rejects deletion if it would make a
// later sale invalid.

"use client";

import { useActionState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import {
  deleteTransaction,
  type TransactionActionResult,
} from "@/lib/actions/transactions";
import {
  formatPrice,
  formatQuantity,
  formatDateTime,
} from "@/utils/format";
import type { Transaction } from "@/db/schema";

interface DeleteTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

const TYPE_LABELS: Record<Transaction["type"], string> = {
  buy: "Buy",
  sell: "Sell",
  adjustment: "Adjustment",
};

const TYPE_TEXT_STYLES: Record<Transaction["type"], string> = {
  buy: "text-success",
  sell: "text-danger",
  adjustment: "text-secondary",
};

export default function DeleteTransactionModal({
  isOpen,
  transaction,
  onClose,
}: DeleteTransactionModalProps) {
  const [state, formAction, isPending] = useActionState<
    TransactionActionResult | null,
    FormData
  >(async (_prev, formData) => {
    const result = await deleteTransaction(formData);

    if ("success" in result) onClose();

    return result;
  }, null);

  if (!transaction) return null;

  const isAdjustment = transaction.type === "adjustment";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete ledger entry">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="transactionId" value={transaction.id} />

        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold uppercase ${
                TYPE_TEXT_STYLES[transaction.type]
              }`}
            >
              {TYPE_LABELS[transaction.type]}
            </span>

            <span className="text-sm text-text font-medium">
              {formatQuantity(Number(transaction.quantity))}{" "}
              {transaction.symbol}
            </span>
          </div>

          <p className="text-xs text-secondary">
            {isAdjustment ? "Basis" : "Price"}:{" "}
            {formatPrice(Number(transaction.pricePerUnit))} per unit
            {" · "}
            {formatDateTime(transaction.executedAt)}
          </p>

          {transaction.notes && (
            <p className="text-xs text-secondary">
              {transaction.notes}
            </p>
          )}
        </div>

        {isAdjustment ? (
          <p className="text-sm text-text">
            Deleting this correction will replay the remaining transaction
            history and recalculate your{" "}
            <span className="font-semibold">{transaction.symbol}</span>{" "}
            position. Previous trades will remain in the ledger. The deletion
            will be rejected if it makes a later sale invalid.
          </p>
        ) : (
          <p className="text-sm text-text">
            Deleting this transaction will recompute your{" "}
            <span className="font-semibold">{transaction.symbol}</span>{" "}
            holding from the remaining ledger. If a later sale depends on this
            entry, deletion will be rejected.
          </p>
        )}

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
            {isPending
              ? "Deleting..."
              : `Delete ${transaction.type === "adjustment" ? "adjustment" : "transaction"}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
