// src/lib/portfolio/recompute.ts
//
// Rebuild a holding from its transaction ledger.
//
// The transaction ledger is the source of truth. This function reconstructs
// the current position instead of incrementally modifying potentially stale
// holding values.
//
// BUY:
//   quantity += amount
//   totalCost += amount * price
//
// SELL:
//   quantity -= amount
//   totalCost -= amount * averageCostBeforeSale
//
// This uses average-cost accounting. FIFO accounting can be introduced
// separately if required for tax reporting.

import { and, eq, asc } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";
import { holdings, transactions } from "@/db/schema";

/**
 * Transaction-scoped database type.
 *
 * Callers must execute recomputation inside the same database transaction
 * that inserts or deletes the corresponding ledger entry.
 */
type Tx = PostgresJsDatabase<typeof schema>;

/**
 * Recompute a holding for one user, portfolio and coin.
 *
 * Ownership is explicitly checked on ledger reads and holding reads.
 * Holding updates and deletions repeat these predicates in their final
 * mutation statements.
 *
 * Any unexpected mutation result throws so the caller can roll back
 * the enclosing transaction.
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
    .orderBy(asc(transactions.executedAt));

  let qty = 0;
  let totalCost = 0;

  for (const entry of ledger) {
    const amount = Number(entry.quantity);
    const price = Number(entry.pricePerUnit);

    if (entry.type === "buy") {
      qty += amount;
      totalCost += amount * price;
    } else if (entry.type === "sell") {
      if (amount > qty + 1e-9) {
        // Small tolerance accounts for floating-point arithmetic dust.
        throw new Error(
          `Cannot sell ${amount} ${symbol} — only ${qty} held at that point in the ledger`
        );
      }

      const averageCost = qty > 0 ? totalCost / qty : 0;

      qty -= amount;
      totalCost -= amount * averageCost;
    }

    // Unknown transaction types are ignored defensively. Valid transaction
    // types are constrained at the application and database boundaries.
  }

  // Retrieve the existing position using all ownership identifiers.
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

  if (qty <= 0) {
    // A fully closed position should have no current holding row.
    // The transaction ledger remains intact as historical evidence.
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
        .returning({ id: holdings.id });

      if (!deletedHolding) {
        throw new Error("Holding changed during recomputation");
      }
    }

    return;
  }

  const costBasis = totalCost / qty;

  if (existing) {
    const [updatedHolding] = await tx
      .update(holdings)
      .set({
        quantity: qty.toString(),
        costBasis: costBasis.toString(),
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
      .returning({ id: holdings.id });

    if (!updatedHolding) {
      throw new Error("Holding changed during recomputation");
    }
  } else {
    // The authenticated user and portfolio identifiers are passed by the
    // calling Server Action, never accepted directly from browser input.
    await tx.insert(holdings).values({
      portfolioId,
      userId,
      coinId,
      symbol,
      quantity: qty.toString(),
      costBasis: costBasis.toString(),
    });
  }
}