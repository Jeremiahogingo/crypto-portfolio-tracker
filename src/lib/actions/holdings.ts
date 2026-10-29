// src/lib/actions/holdings.ts
//
// Server Actions for holding CRUD.
//
// ─── Pattern ─────────────────────────────────────────────────────────────
// Every action:
//   1. Authorizes via getCurrentUser — no trusting the client about userId.
//   2. Validates with Zod — FormData is untrusted input.
//   3. Verifies the target row belongs to the caller (portfolioId match).
//   4. Mutates in a transaction when more than one table is touched.
//   5. Revalidates affected paths.
//
// ─── addHolding creates two rows ─────────────────────────────────────────
// A holding without a corresponding "buy" transaction is a data-model
// violation — it means the ledger is incomplete. We insert both atomically
// so that never happens. The transaction records the moment of creation
// as the executed date and the cost basis as the price, which is the
// closest honest record we have without asking for more inputs.
//
// ─── editHolding doesn't touch the ledger ────────────────────────────────
// Editing a holding is a CORRECTION (user imported wrong data, mis-typed
// quantity on add). It adjusts the current position but leaves history
// intact. Real trades go through a future "Add transaction" action.

"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { holdings, transactions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getDefaultPortfolio } from "@/lib/portfolio/queries";

export type HoldingsActionResult =
  | { success: true }
  | { error: string };

// ─── Schemas ─────────────────────────────────────────────────────────────

const AddHoldingSchema = z.object({
  coinId: z.string().min(1, "Coin is required"),
  symbol: z.string().min(1).max(16),
  quantity: z.coerce
    .number()
    .positive("Quantity must be greater than zero")
    // 28,8 is the DB column's precision/scale — validate at the boundary
    // so we get a friendly error rather than a Postgres exception.
    .max(1e20, "Quantity is too large"),
  costBasis: z.coerce
    .number()
    .nonnegative("Cost basis cannot be negative")
    .max(1e15, "Cost basis is too large"),
});

const UpdateHoldingSchema = z.object({
  holdingId: z.string().uuid(),
  quantity: z.coerce.number().positive().max(1e20),
  costBasis: z.coerce.number().nonnegative().max(1e15),
});

const DeleteHoldingSchema = z.object({
  holdingId: z.string().uuid(),
});

// ─── addHolding ──────────────────────────────────────────────────────────

export async function addHolding(formData: FormData): Promise<HoldingsActionResult> {
  const session = await getCurrentUser();
  if (!session) return { error: "Not authenticated" };

  const portfolio = await getDefaultPortfolio();
  if (!portfolio) return { error: "No portfolio found" };

  const parsed = AddHoldingSchema.safeParse({
    coinId: formData.get("coinId"),
    symbol: formData.get("symbol"),
    quantity: formData.get("quantity"),
    costBasis: formData.get("costBasis"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { coinId, symbol, quantity, costBasis } = parsed.data;
  const totalValue = quantity * costBasis;

  try {
    await db.transaction(async (tx) => {
      await tx.insert(holdings).values({
        portfolioId: portfolio.id,
        userId: session.auth.id,
        coinId,
        symbol,
        // Drizzle accepts numbers for numeric columns — it stringifies
        // internally using the declared precision/scale.
        quantity: quantity.toString(),
        costBasis: costBasis.toString(),
      });

      await tx.insert(transactions).values({
        portfolioId: portfolio.id,
        userId: session.auth.id,
        coinId,
        symbol,
        type: "buy",
        quantity: quantity.toString(),
        pricePerUnit: costBasis.toString(),
        totalValue: totalValue.toString(),
        notes: "Initial position (created via Quick Add)",
      });
    });
  } catch (err) {
    console.error("[addHolding] failed", err);
    return { error: "Failed to add holding. Please try again." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

// ─── updateHolding ───────────────────────────────────────────────────────

export async function updateHolding(formData: FormData): Promise<HoldingsActionResult> {
  const session = await getCurrentUser();
  if (!session) return { error: "Not authenticated" };

  const parsed = UpdateHoldingSchema.safeParse({
    holdingId: formData.get("holdingId"),
    quantity: formData.get("quantity"),
    costBasis: formData.get("costBasis"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { holdingId, quantity, costBasis } = parsed.data;

  try {
    // The WHERE clause scopes by userId AND holdingId. Even if a client
    // forges a holdingId, the userId filter prevents cross-user writes.
    const result = await db
      .update(holdings)
      .set({
        quantity: quantity.toString(),
        costBasis: costBasis.toString(),
        updatedAt: new Date(),
      })
      .where(
        and(eq(holdings.id, holdingId), eq(holdings.userId, session.auth.id))
      )
      .returning({ id: holdings.id });

    if (result.length === 0) {
      return { error: "Holding not found or not owned by you" };
    }
  } catch (err) {
    console.error("[updateHolding] failed", err);
    return { error: "Failed to update holding. Please try again." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

// ─── deleteHolding ───────────────────────────────────────────────────────

export async function deleteHolding(formData: FormData): Promise<HoldingsActionResult> {
  const session = await getCurrentUser();
  if (!session) return { error: "Not authenticated" };

  const parsed = DeleteHoldingSchema.safeParse({
    holdingId: formData.get("holdingId"),
  });

  if (!parsed.success) {
    return { error: "Invalid holding id" };
  }

  const { holdingId } = parsed.data;

  try {
    // Fetch the holding first so we know which transactions to clear.
    // (ON DELETE CASCADE would handle this if we had a direct FK from
    // transactions → holdings, but we don't — transactions belong to the
    // portfolio, not the holding. This is deliberate: a user might sell
    // their entire position but still want the ledger.)
    const [target] = await db
      .select({
        coinId: holdings.coinId,
        portfolioId: holdings.portfolioId,
      })
      .from(holdings)
      .where(
        and(eq(holdings.id, holdingId), eq(holdings.userId, session.auth.id))
      )
      .limit(1);

    if (!target) {
      return { error: "Holding not found or not owned by you" };
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(holdings)
        .where(eq(holdings.id, holdingId));

      // Delete all transactions for this coin in this portfolio. This is
      // the "remove entirely from my portfolio" action — a partial removal
      // (selling) is a different flow that doesn't touch past transactions.
      await tx
        .delete(transactions)
        .where(
          and(
            eq(transactions.portfolioId, target.portfolioId),
            eq(transactions.coinId, target.coinId),
            eq(transactions.userId, session.auth.id)
          )
        );
    });
  } catch (err) {
    console.error("[deleteHolding] failed", err);
    return { error: "Failed to delete holding. Please try again." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}