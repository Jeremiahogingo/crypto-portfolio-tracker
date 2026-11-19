// src/lib/portfolio/recompute.ts
//
// Rebuild a holding from its transaction ledger.
//
// The transaction ledger is the source of truth. Current holdings are
// denormalized projections derived from that ledger.
//
// Supported ledger events:
// - BUY: adds quantity and acquisition cost.
// - SELL: removes quantity and its proportional average acquisition cost.
// - ADJUSTMENT: resets quantity and average cost basis to corrected values.
//
// Concurrency model:
// Every ledger mutation must first lock its owning portfolio row using
// lockPortfolioForMutation(). This serializes mutations within one portfolio
// while allowing independent portfolios to be updated concurrently.
//
// Replay order:
// 1. executedAt establishes the effective chronological order.
// 2. ledgerSequence deterministically orders events with equal timestamps.
//
// Ownership model:
// All ledger reads and holding mutations explicitly include userId and
// portfolioId because the privileged Drizzle connection bypasses RLS.

import { and, eq, asc } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "@/db/schema";
import {
  holdings,
  portfolios,
  transactions,
} from "@/db/schema";

import {
  MAX_QUANTITY,
  MAX_UNIT_PRICE,
  toDatabaseNumeric,
} from "./decimal";
import { replayLedger } from "./ledger";

/**
 * Transaction-scoped database type.
 *
 * Callers must pass the transaction object from db.transaction().
 * Recalculation must execute in the same transaction as the ledger mutation.
 */
type Tx = PostgresJsDatabase<typeof schema>;

/**
 * Acquire the serialization lock for a portfolio mutation.
 *
 * Every action that inserts, deletes, or otherwise changes a ledger event
 * must acquire this lock before making its first write.
 *
 * The row lock remains held until the enclosing database transaction commits
 * or rolls back. Including userId in the predicate also makes ownership
 * explicit at the lock boundary.
 */
export async function lockPortfolioForMutation(
  tx: Tx,
  portfolioId: string,
  userId: string
): Promise<void> {
  const [portfolio] = await tx
    .select({
      id: portfolios.id,
    })
    .from(portfolios)
    .where(
      and(
        eq(portfolios.id, portfolioId),
        eq(portfolios.userId, userId)
      )
    )
    .for("update");

  if (!portfolio) {
    throw new Error("Portfolio not found or not owned by user");
  }
}

/**
 * Recompute a holding for one user, portfolio, and coin.
 *
 * IMPORTANT:
 * The caller must invoke lockPortfolioForMutation() before inserting,
 * deleting, or recomputing ledger entries for this portfolio.
 *
 * The replay engine performs all accounting with arbitrary-precision
 * decimal arithmetic. This avoids binary floating-point drift and removes
 * the need for an arbitrary quantity tolerance when validating sales.
 *
 * Numeric values are rounded and validated explicitly when persisted to
 * PostgreSQL NUMERIC columns with scale 8.
 *
 * Ownership is checked on every ledger read and holding lookup. Final
 * holding updates and deletions repeat all relevant ownership predicates.
 *
 * Any unexpected mutation result throws so the caller can roll back the
 * enclosing transaction.
 */
export async function recomputeHolding(
  tx: Tx,
  portfolioId: string,
  userId: string,
  coinId: string,
  symbol: string
): Promise<void> {
  const ledger = await tx
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.portfolioId, portfolioId),
        eq(transactions.coinId, coinId),
        eq(transactions.userId, userId)
      )
    )
    .orderBy(
      asc(transactions.executedAt),
      asc(transactions.ledgerSequence)
    );

  // The final chronological event supplies the latest stored symbol.
  // Fall back to the action's symbol only when no ledger events remain.
  const currentSymbol =
    ledger.length > 0
      ? ledger[ledger.length - 1].symbol
      : symbol;

  // replayLedger is the single source of accounting rules. Unknown event
  // types, malformed values, and oversells fail rather than being ignored.
  const position = replayLedger(ledger, currentSymbol);

  // Retrieve the current position using all ownership identifiers.
  const [existing] = await tx
    .select()
    .from(holdings)
    .where(
      and(
        eq(holdings.portfolioId, portfolioId),
        eq(holdings.coinId, coinId),
        eq(holdings.userId, userId)
      )
    )
    .limit(1);

  if (position.quantity.isZero()) {
    // A fully sold or zero-adjusted position has no current holding row.
    // Its historical transaction events remain in the ledger.
    if (existing) {
      const [deletedHolding] = await tx
        .delete(holdings)
        .where(
          and(
            eq(holdings.id, existing.id),
            eq(holdings.portfolioId, portfolioId),
            eq(holdings.coinId, coinId),
            eq(holdings.userId, userId)
          )
        )
        .returning({
          id: holdings.id,
        });

      if (!deletedHolding) {
        throw new Error("Holding changed during recomputation");
      }
    }

    return;
  }

  // Validate the calculated values against the destination column
  // precision before attempting the INSERT or UPDATE.
  const quantityValue = toDatabaseNumeric(
    position.quantity,
    "Holding quantity",
    MAX_QUANTITY
  );

  const costBasisValue = toDatabaseNumeric(
    position.costBasis,
    "Holding cost basis",
    MAX_UNIT_PRICE
  );

  if (existing) {
    const [updatedHolding] = await tx
      .update(holdings)
      .set({
        quantity: quantityValue,
        costBasis: costBasisValue,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(holdings.id, existing.id),
          eq(holdings.portfolioId, portfolioId),
          eq(holdings.coinId, coinId),
          eq(holdings.userId, userId)
        )
      )
      .returning({
        id: holdings.id,
      });

    if (!updatedHolding) {
      throw new Error("Holding changed during recomputation");
    }
  } else {
    // The unique constraint on (portfolio_id, coin_id) provides a final
    // database-level safeguard if another writer bypasses this lock
    // convention. Ownership IDs always come from the authenticated flow.
    await tx.insert(holdings).values({
      portfolioId,
      userId,
      coinId,
      symbol: currentSymbol,
      quantity: quantityValue,
      costBasis: costBasisValue,
    });
  }
}
