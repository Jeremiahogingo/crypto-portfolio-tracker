// src/lib/actions/holdings.ts
//
// Server Actions for holding mutations.
//
// Security:
// - Every operation requires a verified Supabase session.
// - User identity is derived exclusively from that session.
// - Every holding mutation includes explicit ownership predicates.
// - The Drizzle connection bypasses RLS, so these predicates are essential.
//
// Accounting:
// - The transaction ledger is the source of truth.
// - Quick Add is recorded as a BUY event.
// - Editing a holding appends an ADJUSTMENT event.
// - Holding rows are projections rebuilt from the ledger.
//
// Concurrency:
// - Portfolio mutations acquire a row-level lock before ledger writes.
// - Ledger changes and holding recomputation run in one database transaction.

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

import { holdings, transactions } from "@/db/schema";

export type HoldingsActionResult =
  | { success: true }
  | { error: string };

// --------------------------------------------------
// Input validation
// --------------------------------------------------

const AddHoldingSchema = z.object({
  coinId: z.string().trim().min(1).max(100),
  symbol: z.string().trim().min(1).max(16),
  quantity: z.string().trim().min(1, "Quantity is required."),
  costBasis: z.string().trim().min(1, "Cost basis is required."),
});

const UpdateHoldingSchema = z.object({
  holdingId: z.string().uuid(),
  quantity: z.string().trim().min(1, "Quantity is required."),
  costBasis: z.string().trim().min(1, "Cost basis is required."),
});

const DeleteHoldingSchema = z.object({
  holdingId: z.string().uuid(),
});

/**
 * Parse a quantity and unit cost without converting through JavaScript
 * Number. Both values are validated against the actual database precision.
 */
function parsePositionAmounts(
  quantityInput: string,
  costBasisInput: string,
  allowZeroQuantity: boolean
) {
  const quantity = parseDecimalInput(
    quantityInput,
    "Quantity",
    {
      allowZero: allowZeroQuantity,
      maximum: MAX_QUANTITY,
    }
  );

  const costBasis = parseDecimalInput(
    costBasisInput,
    "Cost basis",
    {
      allowZero: true,
      maximum: MAX_UNIT_PRICE,
    }
  );

  const totalValue = calculateTransactionTotal(
    quantity,
    costBasis
  );

  return {
    quantity: toDatabaseNumeric(
      quantity,
      "Quantity",
      MAX_QUANTITY
    ),
    costBasis: toDatabaseNumeric(
      costBasis,
      "Cost basis",
      MAX_UNIT_PRICE
    ),
    totalValue: toDatabaseNumeric(
      totalValue,
      "Total value",
      MAX_TOTAL_VALUE,
      TOTAL_VALUE_SCALE
    ),
  };
}

function getValidationError(error: unknown): string | null {
  return error instanceof DecimalInputError
    ? error.message
    : null;
}

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

  let amounts: ReturnType<typeof parsePositionAmounts>;

  try {
    amounts = parsePositionAmounts(
      parsed.data.quantity,
      parsed.data.costBasis,
      false
    );
  } catch (error) {
    return {
      error:
        getValidationError(error) ??
        "The supplied holding values are invalid.",
    };
  }

  let portfolio: Awaited<ReturnType<typeof getDefaultPortfolio>>;

  try {
    portfolio = await getDefaultPortfolio();
  } catch (err) {
    console.error("[addHolding] portfolio lookup failed", err);

    return {
      error: "Failed to load portfolio. Please try again.",
    };
  }

  if (!portfolio) {
    return { error: "No portfolio found" };
  }

  const { coinId, symbol } = parsed.data;
  const userId = session.auth.id;

  try {
    await db.transaction(async (tx) => {
      // Serialize every ledger mutation targeting this portfolio.
      await lockPortfolioForMutation(
        tx,
        portfolio.id,
        userId
      );

      // Quick Add is represented as an opening BUY event. The current
      // holding projection is created by recomputing the authoritative ledger.
      await tx.insert(transactions).values({
        portfolioId: portfolio.id,
        userId,
        coinId,
        symbol,
        type: "buy",
        quantity: amounts.quantity,
        pricePerUnit: amounts.costBasis,
        totalValue: amounts.totalValue,
        notes: "Initial position (created via Quick Add)",
      });

      await recomputeHolding(
        tx,
        portfolio.id,
        userId,
        coinId,
        symbol
      );
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

/**
 * Correct a current position without destroying its original trade history.
 *
 * The correction is recorded as an absolute ADJUSTMENT event. The ledger
 * replay engine then reconstructs the current holding using all prior events
 * followed by this correction and any later trades.
 *
 * A quantity of zero deliberately closes the current position while
 * retaining every historical ledger event.
 */
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

  let amounts: ReturnType<typeof parsePositionAmounts>;

  try {
    // Editing permits zero quantity so a correction can close a position.
    amounts = parsePositionAmounts(
      parsed.data.quantity,
      parsed.data.costBasis,
      true
    );
  } catch (error) {
    return {
      error:
        getValidationError(error) ??
        "The supplied correction values are invalid.",
    };
  }

  const { holdingId } = parsed.data;
  const userId = session.auth.id;

  try {
    await db.transaction(async (tx) => {
      // Identify the owning portfolio without locking a holding row first.
      // Every mutation acquires locks in portfolio-first order.
      const [candidate] = await tx
        .select({
          portfolioId: holdings.portfolioId,
        })
        .from(holdings)
        .where(
          and(
            eq(holdings.id, holdingId),
            eq(holdings.userId, userId)
          )
        )
        .limit(1);

      if (!candidate) {
        throw new Error("Holding not found or not owned by you");
      }

      await lockPortfolioForMutation(
        tx,
        candidate.portfolioId,
        userId
      );

      // Re-read the target after waiting for the portfolio lock. A concurrent
      // operation could have changed or deleted the holding in the meantime.
      const [target] = await tx
        .select({
          coinId: holdings.coinId,
          symbol: holdings.symbol,
        })
        .from(holdings)
        .where(
          and(
            eq(holdings.id, holdingId),
            eq(holdings.userId, userId),
            eq(holdings.portfolioId, candidate.portfolioId)
          )
        )
        .limit(1);

      if (!target) {
        throw new Error("Holding not found or not owned by you");
      }

      // Never directly overwrite the holding projection. Append an immutable
      // correction event and rebuild the projection from the complete ledger.
      await tx.insert(transactions).values({
        portfolioId: candidate.portfolioId,
        userId,
        coinId: target.coinId,
        symbol: target.symbol,
        type: "adjustment",
        quantity: amounts.quantity,
        pricePerUnit: amounts.costBasis,
        totalValue: amounts.totalValue,
        executedAt: new Date(),
        notes: "Manual position correction",
      });

      await recomputeHolding(
        tx,
        candidate.portfolioId,
        userId,
        target.coinId,
        target.symbol
      );
    });
  } catch (err) {
    if (
      err instanceof Error &&
      err.message === "Holding not found or not owned by you"
    ) {
      return { error: err.message };
    }

    console.error("[updateHolding] failed", err);

    return {
      error: "Failed to correct holding. Please try again.",
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
  const userId = session.auth.id;

  try {
    await db.transaction(async (tx) => {
      // The first lookup is deliberately non-locking to preserve the
      // portfolio-first lock acquisition order.
      const [candidate] = await tx
        .select({
          portfolioId: holdings.portfolioId,
        })
        .from(holdings)
        .where(
          and(
            eq(holdings.id, holdingId),
            eq(holdings.userId, userId)
          )
        )
        .limit(1);

      if (!candidate) {
        throw new Error("Holding not found or not owned by you");
      }

      await lockPortfolioForMutation(
        tx,
        candidate.portfolioId,
        userId
      );

      // Re-read after acquiring the portfolio lock.
      const [target] = await tx
        .select({
          coinId: holdings.coinId,
          portfolioId: holdings.portfolioId,
        })
        .from(holdings)
        .where(
          and(
            eq(holdings.id, holdingId),
            eq(holdings.userId, userId),
            eq(holdings.portfolioId, candidate.portfolioId)
          )
        )
        .limit(1);

      if (!target) {
        throw new Error("Holding not found or not owned by you");
      }

      const [deletedHolding] = await tx
        .delete(holdings)
        .where(
          and(
            eq(holdings.id, holdingId),
            eq(holdings.userId, userId),
            eq(holdings.portfolioId, target.portfolioId)
          )
        )
        .returning({
          id: holdings.id,
        });

      if (!deletedHolding) {
        throw new Error("Holding changed or is no longer available");
      }

      // Explicitly deleting a holding continues to remove its transaction
      // history. This is distinct from a zero-quantity ADJUSTMENT, which
      // closes a position while preserving its history.
      await tx
        .delete(transactions)
        .where(
          and(
            eq(transactions.portfolioId, target.portfolioId),
            eq(transactions.coinId, target.coinId),
            eq(transactions.userId, userId)
          )
        );
    });
  } catch (err) {
    if (
      err instanceof Error &&
      err.message === "Holding not found or not owned by you"
    ) {
      return { error: err.message };
    }

    console.error("[deleteHolding] failed", err);

    return {
      error: "Failed to delete holding. Please try again.",
    };
  }

  revalidatePath("/", "layout");

  return { success: true };
}
