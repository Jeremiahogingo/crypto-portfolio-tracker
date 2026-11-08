// src/lib/actions/holdings.ts
//
// Server Actions for holding CRUD.
//
// Every action:
//   1. Authenticates via getCurrentUser.
//   2. Validates untrusted FormData with Zod.
//   3. Scopes database operations to the authenticated user.
//   4. Uses transactions when multiple tables must remain consistent.
//   5. Revalidates affected application routes.
//
// addHolding creates two rows atomically: a holding and its initial buy
// transaction. This prevents incomplete ledger records.
//
// updateHolding is a correction mechanism. It changes the current position
// without modifying the transaction ledger.

"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { holdings, transactions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getDefaultPortfolio } from "@/lib/portfolio/queries";

export type HoldingsActionResult =
  | { success: true }
  | { error: string };

// --------------------------------------------------
// Validation schemas
// --------------------------------------------------

const AddHoldingSchema = z.object({
  coinId: z.string().min(1, "Coin is required"),
  symbol: z.string().min(1).max(16),
  quantity: z.coerce
    .number()
    .positive("Quantity must be greater than zero")
    // Match the database numeric column's supported range.
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

// --------------------------------------------------
// Add holding
// --------------------------------------------------

export async function addHolding(
  formData: FormData
): Promise<HoldingsActionResult> {
  const session = await getCurrentUser();

  if (!session) {
    return { error: "Not authenticated" };
  }

  const portfolio = await getDefaultPortfolio();

  if (!portfolio) {
    return { error: "No portfolio found" };
  }

  const parsed = AddHoldingSchema.safeParse({
    coinId: formData.get("coinId"),
    symbol: formData.get("symbol"),
    quantity: formData.get("quantity"),
    costBasis: formData.get("costBasis"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
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

    return {
      error: "Failed to add holding. Please try again.",
    };
  }

  revalidatePath("/", "layout");

  return { success: true };
}

// --------------------------------------------------
// Update holding
// --------------------------------------------------

export async function updateHolding(
  formData: FormData
): Promise<HoldingsActionResult> {
  const session = await getCurrentUser();

  if (!session) {
    return { error: "Not authenticated" };
  }

  const parsed = UpdateHoldingSchema.safeParse({
    holdingId: formData.get("holdingId"),
    quantity: formData.get("quantity"),
    costBasis: formData.get("costBasis"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { holdingId, quantity, costBasis } = parsed.data;

  try {
    // Ownership is enforced directly in the mutation. A forged holding ID
    // cannot update another user's position.
    const result = await db
      .update(holdings)
      .set({
        quantity: quantity.toString(),
        costBasis: costBasis.toString(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(holdings.id, holdingId),
          eq(holdings.userId, session.auth.id)
        )
      )
      .returning({ id: holdings.id });

    if (result.length === 0) {
      return {
        error: "Holding not found or not owned by you",
      };
    }
  } catch (err) {
    console.error("[updateHolding] failed", err);

    return {
      error: "Failed to update holding. Please try again.",
    };
  }

  revalidatePath("/", "layout");

  return { success: true };
}

// --------------------------------------------------
// Delete holding
// --------------------------------------------------

export async function deleteHolding(
  formData: FormData
): Promise<HoldingsActionResult> {
  const session = await getCurrentUser();

  if (!session) {
    return { error: "Not authenticated" };
  }

  const parsed = DeleteHoldingSchema.safeParse({
    holdingId: formData.get("holdingId"),
  });

  if (!parsed.success) {
    return { error: "Invalid holding id" };
  }

  const { holdingId } = parsed.data;

  try {
    // Find the position using both its ID and authenticated owner.
    // The result provides the portfolio and coin identifiers required
    // to remove the corresponding transaction history.
    const [target] = await db
      .select({
        coinId: holdings.coinId,
        portfolioId: holdings.portfolioId,
      })
      .from(holdings)
      .where(
        and(
          eq(holdings.id, holdingId),
          eq(holdings.userId, session.auth.id)
        )
      )
      .limit(1);

    if (!target) {
      return {
        error: "Holding not found or not owned by you",
      };
    }

    await db.transaction(async (tx) => {
      // Repeat ownership conditions in the actual DELETE statement.
      // The earlier lookup alone should not be the authorization boundary.
      const [deletedHolding] = await tx
        .delete(holdings)
        .where(
          and(
            eq(holdings.id, holdingId),
            eq(holdings.userId, session.auth.id),
            eq(holdings.portfolioId, target.portfolioId)
          )
        )
        .returning({ id: holdings.id });

      // A concurrent change must abort the transaction rather than
      // silently proceeding with deletion of the transaction history.
      if (!deletedHolding) {
        throw new Error("Holding changed or is no longer available");
      }

      // Removing an entire position also removes its ledger history.
      // Selling is a separate operation and must preserve past transactions.
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

    return {
      error: "Failed to delete holding. Please try again.",
    };
  }

  revalidatePath("/", "layout");

  return { success: true };
}