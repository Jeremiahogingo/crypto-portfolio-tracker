// src/components/portfolio/DeleteTransactionModal.tsx
//
// Confirmation modal for deleting a single transaction.
//
// Warns about the cascade: deleting a buy that funded a later sell will
// be rejected by the server (recompute would throw). The message tells the
// user exactly what to do in that case — delete the sell first.

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete transaction">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="transactionId" value={transaction.id} />

        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold uppercase ${
                transaction.type === "buy" ? "text-success" : "text-danger"
              }`}
            >
              {transaction.type}
            </span>
            <span className="text-sm text-text font-medium">
              {formatQuantity(Number(transaction.quantity))}{" "}
              {transaction.symbol}
            </span>
          </div>
          <p className="text-xs text-secondary">
            @ {formatPrice(Number(transaction.pricePerUnit))} ·{" "}
            {formatDateTime(transaction.executedAt)}
          </p>
        </div>

        <p className="text-sm text-text">
          Deleting this transaction will recompute your{" "}
          <span className="font-semibold">{transaction.symbol}</span> holding
          from the remaining ledger. If a later sell depends on this entry,
          deletion will be rejected.
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
            {isPending ? "Deleting…" : "Delete transaction"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}