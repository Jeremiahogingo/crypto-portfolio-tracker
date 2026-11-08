// src/lib/actions/transactions.ts
//
// Server Actions for recording and removing transactions.
//
// Every mutation is wrapped in a database transaction:
//   1. Insert or delete the ledger row.
//   2. Recompute the associated holding.
// Both steps succeed or neither does.
//
// Zod validates incoming form data. recomputeHolding enforces the business
// rule that a user cannot sell more cryptocurrency than they currently hold.

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

// --------------------------------------------------
// Validation schemas
// --------------------------------------------------

const AddTransactionSchema = z.object({
  coinId: z.string().min(1, "Coin is required"),
  symbol: z.string().min(1).max(16),
  type: z.enum(["buy", "sell"]),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  pricePerUnit: z.coerce.number().nonnegative("Price cannot be negative"),
  executedAt: z
    .string()
    .optional()
    .refine(
      (value) => !value || new Date(value).getTime() <= Date.now() + 60_000,
      "Transaction date cannot be in the future"
    ),
  notes: z.string().max(500).optional(),
});

const DeleteTransactionSchema = z.object({
  transactionId: z.string().uuid(),
});

// --------------------------------------------------
// Add transaction
// --------------------------------------------------

export async function addTransaction(
  formData: FormData
): Promise<TransactionActionResult> {
  const session = await getCurrentUser();

  if (!session) {
    return { error: "Not authenticated" };
  }

  const portfolio = await getDefaultPortfolio();

  if (!portfolio) {
    return { error: "No portfolio found" };
  }

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
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const {
    coinId,
    symbol,
    type,
    quantity,
    pricePerUnit,
    executedAt,
    notes,
  } = parsed.data;

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

      // Recompute enforces the oversell rule. If it throws, the transaction
      // insert is rolled back and the ledger remains consistent.
      await recomputeHolding(
        tx,
        portfolio.id,
        session.auth.id,
        coinId,
        symbol
      );
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";

    if (message.includes("Cannot sell")) {
      return { error: message };
    }

    console.error("[addTransaction] failed", err);

    return {
      error: "Failed to record transaction. Please try again.",
    };
  }

  revalidatePath("/", "layout");

  return { success: true };
}

// --------------------------------------------------
// Delete transaction
// --------------------------------------------------

export async function deleteTransaction(
  formData: FormData
): Promise<TransactionActionResult> {
  const session = await getCurrentUser();

  if (!session) {
    return { error: "Not authenticated" };
  }

  const parsed = DeleteTransactionSchema.safeParse({
    transactionId: formData.get("transactionId"),
  });

  if (!parsed.success) {
    return { error: "Invalid transaction id" };
  }

  try {
    await db.transaction(async (tx) => {
      // Retrieve the transaction only if it belongs to the authenticated user.
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

      // Repeat ownership and portfolio conditions in the DELETE itself.
      const [deletedTransaction] = await tx
        .delete(transactions)
        .where(
          and(
            eq(transactions.id, target.id),
            eq(transactions.userId, session.auth.id),
            eq(transactions.portfolioId, target.portfolioId)
          )
        )
        .returning({ id: transactions.id });

      if (!deletedTransaction) {
        throw new Error("Transaction not found or not owned by you");
      }

      // If deletion invalidates a later sell, recomputation throws and
      // rolls back the entire transaction, including this deletion.
      await recomputeHolding(
        tx,
        target.portfolioId,
        session.auth.id,
        target.coinId,
        target.symbol
      );
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";

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

    return {
      error: "Failed to delete transaction. Please try again.",
    };
  }

  revalidatePath("/", "layout");

  return { success: true };
}