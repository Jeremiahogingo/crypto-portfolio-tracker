// src/lib/actions/transactions.ts
//
// Server Actions for recording and deleting portfolio transactions.
//
// Security:
// - Every operation requires a verified Supabase session.
// - User identity always comes from the authenticated session.
// - Portfolio and transaction ownership are checked in database queries.
// - The privileged Drizzle connection bypasses RLS, so explicit ownership
//   predicates are mandatory.
//
// Accounting:
// - BUY and SELL are the only user-entered trade types.
// - ADJUSTMENT events are created by the holding correction action.
// - Decimal input is validated without converting through JavaScript Number.
// - Ledger values are stored at the database's declared eight-decimal scale.
//
// Consistency:
// - Ledger mutations and holding recomputation share one DB transaction.
// - Every ledger mutation locks its portfolio before changing the ledger.
// - A failed recomputation rolls back the entire transaction.

"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getDefaultPortfolio } from "@/lib/portfolio/queries";
import {
  lockPortfolioForMutation,
  recomputeHolding,
} from "@/lib/portfolio/recompute";
import {
  DecimalInputError,
  MAX_QUANTITY,
  MAX_UNIT_PRICE,
  MAX_TOTAL_VALUE,
  TOTAL_VALUE_SCALE,
  calculateTransactionTotal,
  parseDecimalInput,
  toDatabaseNumeric,
} from "@/lib/portfolio/decimal";

import { transactions } from "@/db/schema";

export type TransactionActionResult =
  | { success: true }
  | { error: string };

// --------------------------------------------------
// Input validation
// --------------------------------------------------

const AddTransactionSchema = z.object({
  coinId: z.string().trim().min(1).max(100),
  symbol: z.string().trim().min(1).max(16),
  type: z.enum(["buy", "sell"]),
  quantity: z.string().trim().min(1, "Quantity is required."),
  pricePerUnit: z.string().trim().min(1, "Price is required."),
  executedAt: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;

        const timestamp = new Date(value).getTime();

        return (
          Number.isFinite(timestamp) &&
          timestamp <= Date.now() + 60_000
        );
      },
      "Transaction date must be valid and cannot be in the future"
    ),
  notes: z.string().trim().max(500).optional(),
});

const DeleteTransactionSchema = z.object({
  transactionId: z.string().uuid(),
});

function getValidationError(error: unknown): string | null {
  return error instanceof DecimalInputError
    ? error.message
    : null;
}

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

  const executedAtValue = formData.get("executedAt");
  const notesValue = formData.get("notes");

  const parsed = AddTransactionSchema.safeParse({
    coinId: formData.get("coinId"),
    symbol: formData.get("symbol"),
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    pricePerUnit: formData.get("pricePerUnit"),
    executedAt:
      typeof executedAtValue === "string" && executedAtValue.length > 0
        ? executedAtValue
        : undefined,
    notes:
      typeof notesValue === "string" && notesValue.length > 0
        ? notesValue
        : undefined,
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
    quantity: quantityInput,
    pricePerUnit: priceInput,
    executedAt,
    notes,
  } = parsed.data;

  // Parse decimal strings directly. Never route financial input through
  // JavaScript Number, which cannot represent arbitrary decimal fractions.
  let quantity: string;
  let pricePerUnit: string;
  let totalValue: string;

  try {
    const parsedQuantity = parseDecimalInput(
      quantityInput,
      "Quantity",
      {
        allowZero: false,
        maximum: MAX_QUANTITY,
      }
    );

    const parsedPrice = parseDecimalInput(
      priceInput,
      "Price",
      {
        allowZero: true,
        maximum: MAX_UNIT_PRICE,
      }
    );

    const calculatedTotal = calculateTransactionTotal(
      parsedQuantity,
      parsedPrice
    );

    quantity = toDatabaseNumeric(
      parsedQuantity,
      "Quantity",
      MAX_QUANTITY
    );

    pricePerUnit = toDatabaseNumeric(
      parsedPrice,
      "Price",
      MAX_UNIT_PRICE
    );

    totalValue = toDatabaseNumeric(
      calculatedTotal,
      "Transaction total",
      MAX_TOTAL_VALUE,
      TOTAL_VALUE_SCALE
    );
  } catch (error) {
    return {
      error:
        getValidationError(error) ??
        "The supplied transaction values are invalid.",
    };
  }

  const userId = session.auth.id;

  // Portfolio lookup is scoped to the authenticated user. A browser-
  // supplied portfolio ID is never accepted as an ownership decision.
  let portfolio: Awaited<ReturnType<typeof getDefaultPortfolio>>;

  try {
    portfolio = await getDefaultPortfolio();
  } catch (err) {
    console.error("[addTransaction] portfolio lookup failed", err);

    return {
      error: "Failed to load portfolio. Please try again.",
    };
  }

  if (!portfolio) {
    return { error: "No portfolio found" };
  }

  const executedDate = executedAt
    ? new Date(executedAt)
    : new Date();

  try {
    await db.transaction(async (tx) => {
      // Serialize this mutation against every other ledger mutation
      // targeting the same portfolio.
      await lockPortfolioForMutation(
        tx,
        portfolio.id,
        userId
      );

      await tx.insert(transactions).values({
        portfolioId: portfolio.id,
        userId,
        coinId,
        symbol,
        type,
        quantity,
        pricePerUnit,
        totalValue,
        executedAt: executedDate,
        notes,
      });

      // Replay uses executedAt and ledgerSequence for deterministic order.
      // An invalid historical sale aborts and rolls back this insertion.
      await recomputeHolding(
        tx,
        portfolio.id,
        userId,
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

  const transactionId = parsed.data.transactionId;
  const userId = session.auth.id;

  try {
    await db.transaction(async (tx) => {
      // First identify the portfolio without taking a transaction-row lock.
      // All mutation paths acquire locks in portfolio-first order.
      const [candidate] = await tx
        .select({
          portfolioId: transactions.portfolioId,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.id, transactionId),
            eq(transactions.userId, userId)
          )
        )
        .limit(1);

      if (!candidate) {
        throw new Error("Transaction not found or not owned by you");
      }

      await lockPortfolioForMutation(
        tx,
        candidate.portfolioId,
        userId
      );

      // Re-read after acquiring the lock to confirm the transaction still
      // exists and belongs to the expected user and portfolio.
      const [target] = await tx
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.id, transactionId),
            eq(transactions.userId, userId),
            eq(transactions.portfolioId, candidate.portfolioId)
          )
        )
        .limit(1);

      if (!target) {
        throw new Error("Transaction not found or not owned by you");
      }

      // Repeat every ownership predicate in the actual DELETE statement.
      const [deletedTransaction] = await tx
        .delete(transactions)
        .where(
          and(
            eq(transactions.id, target.id),
            eq(transactions.userId, userId),
            eq(transactions.portfolioId, target.portfolioId)
          )
        )
        .returning({
          id: transactions.id,
        });

      if (!deletedTransaction) {
        throw new Error("Transaction changed or is no longer available");
      }

      // Rebuild the current position after removing this ledger event.
      // If a later SELL becomes invalid, the exception rolls back both
      // the deletion and all other writes in this transaction.
      await recomputeHolding(
        tx,
        target.portfolioId,
        userId,
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
