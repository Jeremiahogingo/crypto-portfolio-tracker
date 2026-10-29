// src/lib/portfolio/recompute.ts
//
// Rebuilds a holding row from the transaction ledger.
//
// ─── Why this exists ─────────────────────────────────────────────────────
// There are two ways to change a position: correction (edit the holding
// directly — 2.4a) and trade (add a transaction — this step). Trades MUST
// flow through the ledger, because holding.cost_basis is a derived value:
// the weighted-average price of every buy minus the proportional cost
// removed by every sell.
//
// Rather than maintaining that math incrementally (fragile: one bug in one
// action and the whole position is wrong), every mutation recomputes the
// holding from scratch. It's O(n) over the coin's transactions, which is
// small — even 10,000 trades for a single coin is a trivial query.
//
// ─── Algorithm ───────────────────────────────────────────────────────────
// Walk the ledger in chronological order. For each transaction:
//   • BUY:  qty += amount;  totalCost += amount × price
//   • SELL: qty -= amount;  totalCost -= amount × (totalCost / qty_before)
//
// The sell formula removes cost proportionally to the average cost basis
// at the time of the sell. This is the "average cost" accounting method —
// simple, defensible, and what most exchanges default to. FIFO would be
// more accurate for some tax regimes, but that's Phase 5 work.
//
// ─── Failure modes ───────────────────────────────────────────────────────
// • Sell exceeds held → throws. The caller (addTransaction) catches and
//   returns a user-facing error. This is why the modal can't allow an
//   oversell — the DB would accept it, but the math wouldn't.
// • Final qty ≤ 0 → holding is deleted. The ledger is preserved (it's
//   history), but the UI shows zero rows for that coin. Re-buying later
//   creates a fresh holding from the same ledger.

import { and, eq, asc } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";
import { holdings, transactions } from "@/db/schema";

/**
 * Transaction type — narrowed so the caller gets a typed tx object that's
 * guaranteed to be inside db.transaction(). Not the full db type because
 * some operations (like .transaction) are forbidden mid-transaction anyway.
 */
type Tx = PostgresJsDatabase<typeof schema>;

/**
 * Recompute the holding for (portfolioId, coinId) from its transaction
 * ledger. Idempotent — calling it twice produces the same result.
 *
 * Must be called inside a db.transaction() that also performs the
 * transaction insert/delete. Otherwise a concurrent action could race
 * between the ledger change and the recompute.
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
        // 1e-9 tolerance for floating-point dust — quantity is stored as
        // numeric, so exact equality is possible but hard to reason about.
        throw new Error(
          `Cannot sell ${amount} ${symbol} — only ${qty} held at that point in the ledger`
        );
      }
      const avgCost = qty > 0 ? totalCost / qty : 0;
      qty -= amount;
      totalCost -= amount * avgCost;
    }
    // Unknown type is silently ignored — only "buy"/"sell" exist in the
    // check constraint, but defensive coding prevents a corrupted row
    // from crashing the entire recompute.
  }

  // Read existing holding (0 or 1 rows — no unique constraint enforces
  // this, but the 2.4a actions never create duplicates for the same coin).
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
    // Position fully closed — remove the holding row but leave the ledger.
    if (existing) {
      await tx.delete(holdings).where(eq(holdings.id, existing.id));
    }
    return;
  }

  const costBasis = totalCost / qty;

  if (existing) {
    await tx
      .update(holdings)
      .set({
        quantity: qty.toString(),
        costBasis: costBasis.toString(),
        updatedAt: new Date(),
      })
      .where(eq(holdings.id, existing.id));
  } else {
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