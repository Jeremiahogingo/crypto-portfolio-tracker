// src/lib/actions/transactions.ts
//
// Server Actions for recording and removing transactions.
//
// ─── Contract with the ledger ────────────────────────────────────────────
// Every mutation is wrapped in a DB transaction:
//   1. Insert/delete the ledger row.
//   2. Recompute the holding from the ledger.
// Both steps succeed or neither does. A partial write would leave holdings
// and ledger out of sync, which is worse than a failed action.
//
// ─── Validation ──────────────────────────────────────────────────────────
// Zod validates the shape; recompute validates the math (an oversell is
// rejected by recompute throwing, which we translate to a user-facing
// error). This split keeps the schema simple and the business rule in
// exactly one place.
//
// ─── executedAt ──────────────────────────────────────────────────────────
// Defaults to now. The form allows backdating — users importing history
// need this. We cap at "not in the future" because a future-dated buy
// would corrupt P&L (you can't have owned a coin before you bought it).

"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { transactions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getDefaultPortfolio } from "@/lib/portfolio/queries";
import { recomputeHolding } from "@/lib/portfolio/recompute";

export type TransactionActionResult =
  | { success: true }
  | { error: string };

// ─── Schemas ─────────────────────────────────────────────────────────────

const AddTransactionSchema = z.object({
  coinId: z.string().min(1, "Coin is required"),
  symbol: z.string().min(1).max(16),
  type: z.enum(["buy", "sell"]),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  pricePerUnit: z.coerce
    .number()
    .nonnegative("Price cannot be negative"),
  executedAt: z
    .string()
    .optional()
    .refine(
      (v) => !v || new Date(v).getTime() <= Date.now() + 60_000,
      "Transaction date cannot be in the future"
    ),
  notes: z.string().max(500).optional(),
});

const DeleteTransactionSchema = z.object({
  transactionId: z.string().uuid(),
});

// ─── addTransaction ──────────────────────────────────────────────────────

export async function addTransaction(
  formData: FormData
): Promise<TransactionActionResult> {
  const session = await getCurrentUser();
  if (!session) return { error: "Not authenticated" };

  const portfolio = await getDefaultPortfolio();
  if (!portfolio) return { error: "No portfolio found" };

  const parsed = AddTransactionSchema.safeParse({
    coinId: formData.get("coinId"),
    symbol: formData.get("symbol"),
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    pricePerUnit: formData.get("pricePerUnit"),
    executedAt: formData.get("executedAt") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { coinId, symbol, type, quantity, pricePerUnit, executedAt, notes } =
    parsed.data;
  const totalValue = quantity * pricePerUnit;
  const executedDate = executedAt ? new Date(executedAt) : new Date();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(transactions).values({
        portfolioId: portfolio.id,
        userId: session.auth.id,
        coinId,
        symbol,
        type,
        quantity: quantity.toString(),
        pricePerUnit: pricePerUnit.toString(),
        totalValue: totalValue.toString(),
        executedAt: executedDate,
        notes,
      });

      // Recompute handles the oversell check by throwing. That throw
      // rolls back the insert above — no orphan ledger row.
      await recomputeHolding(tx, portfolio.id, session.auth.id, coinId, symbol);
    });
  } catch (err) {
    const message = (err as Error).message;
    // Surface oversell errors verbatim — they're specific and actionable.
    if (message.includes("Cannot sell")) {
      return { error: message };
    }
    console.error("[addTransaction] failed", err);
    return { error: "Failed to record transaction. Please try again." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

// ─── deleteTransaction ───────────────────────────────────────────────────

export async function deleteTransaction(
  formData: FormData
): Promise<TransactionActionResult> {
  const session = await getCurrentUser();
  if (!session) return { error: "Not authenticated" };

  const parsed = DeleteTransactionSchema.safeParse({
    transactionId: formData.get("transactionId"),
  });
  if (!parsed.success) return { error: "Invalid transaction id" };

  try {
    await db.transaction(async (tx) => {
      // Fetch first — recompute needs coinId/symbol, and we must verify
      // ownership before deleting.
      const [target] = await tx
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.id, parsed.data.transactionId),
            eq(transactions.userId, session.auth.id)
          )
        )
        .limit(1);

      if (!target) {
        throw new Error("Transaction not found or not owned by you");
      }

      await tx
        .delete(transactions)
        .where(eq(transactions.id, target.id));

      // If deleting this row leaves a remaining ledger with an oversell
      // (e.g. you deleted the buy that funded a later sell), recompute
      // throws and the whole delete rolls back. That's correct — the
      // ledger would be inconsistent otherwise.
      await recomputeHolding(
        tx,
        target.portfolioId,
        session.auth.id,
        target.coinId,
        target.symbol
      );
    });
  } catch (err) {
    const message = (err as Error).message;
    if (message.includes("Cannot sell")) {
      return {
        error:
          "Deleting this transaction would make a later sell invalid. Delete the sell first.",
      };
    }
    if (message.includes("not found")) {
      return { error: "Transaction not found" };
    }
    console.error("[deleteTransaction] failed", err);
    return { error: "Failed to delete transaction. Please try again." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}