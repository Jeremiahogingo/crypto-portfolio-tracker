import { loadEnvConfig } from "@next/env";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, asc, eq } from "drizzle-orm";

import * as schema from "../src/db/schema";
import {
  holdings,
  portfolios,
  transactions,
  type TransactionType,
} from "../src/db/schema";

import {
  lockPortfolioForMutation,
  recomputeHolding,
} from "../src/lib/portfolio/recompute";

// Load .env.local before creating the PostgreSQL client.
loadEnvConfig(process.cwd());

class RollbackSignal extends Error {
  constructor() {
    super("Intentional rollback after successful integration assertions.");
  }
}

interface TestEvent {
  coinId: string;
  symbol: string;
  type: TransactionType;
  quantity: string;
  pricePerUnit: string;
  totalValue: string;
  executedAt: Date;
}

/**
 * Run assertions against real database rows, then force the transaction
 * to roll back. This leaves no test transactions or holdings behind.
 */
async function runAndRollback(
  database: ReturnType<typeof drizzle<typeof schema>>,
  callback: (tx: Parameters<
    Parameters<typeof database.transaction>[0]
  >[0]) => Promise<void>
): Promise<void> {
  let assertionsCompleted = false;

  try {
    await database.transaction(async (tx) => {
      await callback(tx);

      assertionsCompleted = true;

      throw new RollbackSignal();
    });
  } catch (error) {
    if (!(error instanceof RollbackSignal)) {
      throw error;
    }
  }

  assert.equal(
    assertionsCompleted,
    true,
    "The integration assertions did not complete."
  );
}

/**
 * Insert one event using database-scale numeric strings.
 */
async function insertEvent(
  tx: Parameters<
    Parameters<
      ReturnType<typeof drizzle<typeof schema>>["transaction"]
    >[0]
  >[0],
  userId: string,
  portfolioId: string,
  event: TestEvent
): Promise<void> {
  await tx.insert(transactions).values({
    userId,
    portfolioId,
    coinId: event.coinId,
    symbol: event.symbol,
    type: event.type,
    quantity: event.quantity,
    pricePerUnit: event.pricePerUnit,
    totalValue: event.totalValue,
    executedAt: event.executedAt,
    notes: "Temporary database integration test",
  });
}

/**
 * Assert that no temporary ledger event or holding survived a rollback.
 */
async function assertNoPersistedTestData(
  database: ReturnType<typeof drizzle<typeof schema>>,
  portfolioId: string,
  coinIds: string[]
): Promise<void> {
  for (const coinId of coinIds) {
    const ledgerRows = await database
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          eq(transactions.portfolioId, portfolioId),
          eq(transactions.coinId, coinId)
        )
      );

    const holdingRows = await database
      .select({ id: holdings.id })
      .from(holdings)
      .where(
        and(
          eq(holdings.portfolioId, portfolioId),
          eq(holdings.coinId, coinId)
        )
      );

    assert.equal(
      ledgerRows.length,
      0,
      `Temporary ledger rows persisted for ${coinId}.`
    );

    assert.equal(
      holdingRows.length,
      0,
      `Temporary holding persisted for ${coinId}.`
    );
  }
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is missing. Check the project's .env.local file."
    );
  }

  const client = postgres(databaseUrl, {
    max: 1,
    connect_timeout: 10,
  });

  const database = drizzle(client, { schema });

  const testCoinIds = [
    `__ledger_flow_${randomUUID()}`,
    `__ledger_zero_${randomUUID()}`,
    `__ledger_precision_${randomUUID()}`,
    `__ledger_oversell_${randomUUID()}`,
    `__ledger_delete_adjustment_${randomUUID()}`,
  ];

  try {
    console.log("\n========== EXISTING SEQUENCE VALIDATION ==========");

    const existingSequences = await database
      .select({
        sequence: transactions.ledgerSequence,
      })
      .from(transactions);

    const sequenceValues = existingSequences.map(
      (row) => row.sequence
    );

    assert.ok(
      sequenceValues.every(Number.isInteger),
      "An existing transaction has an invalid ledger sequence."
    );

    assert.equal(
      new Set(sequenceValues).size,
      sequenceValues.length,
      "Existing ledger sequence values are not unique."
    );

    console.log(
      `Verified ${sequenceValues.length} existing transaction sequence values.`
    );

    const [portfolio] = await database
      .select({
        id: portfolios.id,
        userId: portfolios.userId,
      })
      .from(portfolios)
      .orderBy(asc(portfolios.createdAt))
      .limit(1);

    if (!portfolio) {
      throw new Error(
        "No portfolio exists. Complete onboarding before running this test."
      );
    }

    const fixedTimestamp = new Date("2026-11-18T12:00:00.000Z");

    // --------------------------------------------------
    // Scenario 1: BUY -> ADJUSTMENT -> SELL
    // --------------------------------------------------

    console.log("\n========== BUY / ADJUSTMENT / SELL ==========");

    await runAndRollback(database, async (tx) => {
      await lockPortfolioForMutation(
        tx,
        portfolio.id,
        portfolio.userId
      );

      const coinId = testCoinIds[0];

      await insertEvent(
        tx,
        portfolio.userId,
        portfolio.id,
        {
          coinId,
          symbol: "TST",
          type: "buy",
          quantity: "2.00000000",
          pricePerUnit: "10.00000000",
          totalValue: "20.0000000000000000",
          executedAt: fixedTimestamp,
        }
      );

      await recomputeHolding(
        tx,
        portfolio.id,
        portfolio.userId,
        coinId,
        "TST"
      );

      let [holding] = await tx
        .select({
          quantity: holdings.quantity,
          costBasis: holdings.costBasis,
        })
        .from(holdings)
        .where(
          and(
            eq(holdings.portfolioId, portfolio.id),
            eq(holdings.userId, portfolio.userId),
            eq(holdings.coinId, coinId)
          )
        )
        .limit(1);

      assert.ok(holding, "BUY did not create a holding.");
      assert.equal(holding.quantity, "2.00000000");
      assert.equal(holding.costBasis, "10.00000000");

      console.log("BUY: quantity 2, cost basis 10 — passed.");

      await insertEvent(
        tx,
        portfolio.userId,
        portfolio.id,
        {
          coinId,
          symbol: "TST",
          type: "adjustment",
          quantity: "5.00000000",
          pricePerUnit: "4.00000000",
          totalValue: "20.0000000000000000",
          executedAt: fixedTimestamp,
        }
      );

      await recomputeHolding(
        tx,
        portfolio.id,
        portfolio.userId,
        coinId,
        "TST"
      );

      [holding] = await tx
        .select({
          quantity: holdings.quantity,
          costBasis: holdings.costBasis,
        })
        .from(holdings)
        .where(
          and(
            eq(holdings.portfolioId, portfolio.id),
            eq(holdings.userId, portfolio.userId),
            eq(holdings.coinId, coinId)
          )
        )
        .limit(1);

      assert.ok(holding, "ADJUSTMENT removed a nonzero holding.");
      assert.equal(holding.quantity, "5.00000000");
      assert.equal(holding.costBasis, "4.00000000");

      console.log("ADJUSTMENT: quantity 5, cost basis 4 — passed.");

      await insertEvent(
        tx,
        portfolio.userId,
        portfolio.id,
        {
          coinId,
          symbol: "TST",
          type: "sell",
          quantity: "1.00000000",
          pricePerUnit: "8.00000000",
          totalValue: "8.0000000000000000",
          executedAt: fixedTimestamp,
        }
      );

      await recomputeHolding(
        tx,
        portfolio.id,
        portfolio.userId,
        coinId,
        "TST"
      );

      [holding] = await tx
        .select({
          quantity: holdings.quantity,
          costBasis: holdings.costBasis,
        })
        .from(holdings)
        .where(
          and(
            eq(holdings.portfolioId, portfolio.id),
            eq(holdings.userId, portfolio.userId),
            eq(holdings.coinId, coinId)
          )
        )
        .limit(1);

      assert.ok(holding, "SELL removed a nonzero holding.");
      assert.equal(holding.quantity, "4.00000000");
      assert.equal(holding.costBasis, "4.00000000");

      console.log("SELL: quantity 4, cost basis 4 — passed.");

      // All events share one timestamp. The database sequence must preserve
      // the insertion order and therefore the intended accounting result.
      const orderedEvents = await tx
        .select({
          type: transactions.type,
          sequence: transactions.ledgerSequence,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.portfolioId, portfolio.id),
            eq(transactions.userId, portfolio.userId),
            eq(transactions.coinId, coinId)
          )
        )
        .orderBy(
          asc(transactions.executedAt),
          asc(transactions.ledgerSequence)
        );

      assert.deepEqual(
        orderedEvents.map((event) => event.type),
        ["buy", "adjustment", "sell"]
      );

      assert.ok(
        orderedEvents[0].sequence < orderedEvents[1].sequence &&
        orderedEvents[1].sequence < orderedEvents[2].sequence,
        "Equal-timestamp events were not ordered by ledger sequence."
      );

      console.log("Equal-timestamp replay ordering — passed.");
    });

    // --------------------------------------------------
    // Scenario 2: zero-quantity adjustment
    // --------------------------------------------------

    console.log("\n========== ZERO-QUANTITY ADJUSTMENT ==========");

    await runAndRollback(database, async (tx) => {
      await lockPortfolioForMutation(
        tx,
        portfolio.id,
        portfolio.userId
      );

      const coinId = testCoinIds[1];

      await insertEvent(
        tx,
        portfolio.userId,
        portfolio.id,
        {
          coinId,
          symbol: "TST",
          type: "buy",
          quantity: "1.00000000",
          pricePerUnit: "2.00000000",
          totalValue: "2.0000000000000000",
          executedAt: fixedTimestamp,
        }
      );

      await recomputeHolding(
        tx,
        portfolio.id,
        portfolio.userId,
        coinId,
        "TST"
      );

      await insertEvent(
        tx,
        portfolio.userId,
        portfolio.id,
        {
          coinId,
          symbol: "TST",
          type: "adjustment",
          quantity: "0.00000000",
          pricePerUnit: "2.00000000",
          totalValue: "0.0000000000000000",
          executedAt: fixedTimestamp,
        }
      );

      await recomputeHolding(
        tx,
        portfolio.id,
        portfolio.userId,
        coinId,
        "TST"
      );

      const remainingHoldings = await tx
        .select({ id: holdings.id })
        .from(holdings)
        .where(
          and(
            eq(holdings.portfolioId, portfolio.id),
            eq(holdings.userId, portfolio.userId),
            eq(holdings.coinId, coinId)
          )
        );

      assert.equal(
        remainingHoldings.length,
        0,
        "Zero-quantity adjustment did not close the position."
      );

      console.log("Zero-quantity adjustment closes position — passed.");
    });

    // --------------------------------------------------
    // Scenario 3: scale-16 transaction value
    // --------------------------------------------------

    console.log("\n========== NUMERIC(48,16) PRECISION ==========");

    await runAndRollback(database, async (tx) => {
      await lockPortfolioForMutation(
        tx,
        portfolio.id,
        portfolio.userId
      );

      const coinId = testCoinIds[2];

      await insertEvent(
        tx,
        portfolio.userId,
        portfolio.id,
        {
          coinId,
          symbol: "TST",
          type: "buy",
          quantity: "0.10000000",
          pricePerUnit: "0.00000005",
          totalValue: "0.0000000050000000",
          executedAt: fixedTimestamp,
        }
      );

      await recomputeHolding(
        tx,
        portfolio.id,
        portfolio.userId,
        coinId,
        "TST"
      );

      const [storedTransaction] = await tx
        .select({
          totalValue: transactions.totalValue,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.portfolioId, portfolio.id),
            eq(transactions.userId, portfolio.userId),
            eq(transactions.coinId, coinId)
          )
        )
        .limit(1);

      assert.ok(storedTransaction);
      assert.equal(
        storedTransaction.totalValue,
        "0.0000000050000000"
      );

      console.log("Sixteen-decimal transaction value preserved — passed.");
    });

    // --------------------------------------------------
    // Scenario 4: oversell must roll back the complete transaction
    // --------------------------------------------------

    console.log("\n========== OVERSELL ROLLBACK ==========");

    let oversellRejected = false;

    try {
      await database.transaction(async (tx) => {
        await lockPortfolioForMutation(
          tx,
          portfolio.id,
          portfolio.userId
        );

        const coinId = testCoinIds[3];

        await insertEvent(
          tx,
          portfolio.userId,
          portfolio.id,
          {
            coinId,
            symbol: "TST",
            type: "buy",
            quantity: "1.00000000",
            pricePerUnit: "10.00000000",
            totalValue: "10.0000000000000000",
            executedAt: fixedTimestamp,
          }
        );

        await insertEvent(
          tx,
          portfolio.userId,
          portfolio.id,
          {
            coinId,
            symbol: "TST",
            type: "sell",
            quantity: "2.00000000",
            pricePerUnit: "10.00000000",
            totalValue: "20.0000000000000000",
            executedAt: fixedTimestamp,
          }
        );

        // This must throw. The transaction wrapper must roll back both rows.
        await recomputeHolding(
          tx,
          portfolio.id,
          portfolio.userId,
          coinId,
          "TST"
        );
      });

      throw new Error("The oversell was unexpectedly accepted.");
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Cannot sell")
      ) {
        oversellRejected = true;
      } else {
        throw error;
      }
    }

    assert.equal(
      oversellRejected,
      true,
      "The ledger replay did not reject an oversell."
    );

    console.log("Oversell rejected and transaction rolled back — passed.");

    // --------------------------------------------------
    // Scenario 5: deleting an adjustment must not invalidate a later sale
    // --------------------------------------------------

    console.log("\n========== ADJUSTMENT DELETION ROLLBACK ==========");

    await runAndRollback(database, async (tx) => {
      await lockPortfolioForMutation(
        tx,
        portfolio.id,
        portfolio.userId
      );

      const coinId = testCoinIds[4];

      // Original purchase: 2 units at a cost basis of 10.
      await insertEvent(tx, portfolio.userId, portfolio.id, {
        coinId,
        symbol: "TST",
        type: "buy",
        quantity: "2.00000000",
        pricePerUnit: "10.00000000",
        totalValue: "20.0000000000000000",
        executedAt: fixedTimestamp,
      });

      // Correction resets the position to 5 units at a basis of 4.
      await insertEvent(tx, portfolio.userId, portfolio.id, {
        coinId,
        symbol: "TST",
        type: "adjustment",
        quantity: "5.00000000",
        pricePerUnit: "4.00000000",
        totalValue: "20.0000000000000000",
        executedAt: fixedTimestamp,
      });

      // This sale is valid only because the correction increased the position.
      await insertEvent(tx, portfolio.userId, portfolio.id, {
        coinId,
        symbol: "TST",
        type: "sell",
        quantity: "4.00000000",
        pricePerUnit: "8.00000000",
        totalValue: "32.0000000000000000",
        executedAt: fixedTimestamp,
      });

      await recomputeHolding(
        tx,
        portfolio.id,
        portfolio.userId,
        coinId,
        "TST"
      );

      const [adjustment] = await tx
        .select({
          id: transactions.id,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.portfolioId, portfolio.id),
            eq(transactions.userId, portfolio.userId),
            eq(transactions.coinId, coinId),
            eq(transactions.type, "adjustment")
          )
        )
        .limit(1);

      assert.ok(adjustment, "Expected adjustment event was not inserted.");

      let deletionRejected = false;

      try {
        // Use a savepoint so the rejected deletion can be tested while
        // retaining the seeded rows inside the outer rollback transaction.
        await tx.transaction(async (savepoint) => {
          const [deleted] = await savepoint
            .delete(transactions)
            .where(
              and(
                eq(transactions.id, adjustment.id),
                eq(transactions.userId, portfolio.userId),
                eq(transactions.portfolioId, portfolio.id)
              )
            )
            .returning({
              id: transactions.id,
            });

          assert.ok(deleted, "Adjustment deletion did not execute.");

          // Without the adjustment, the remaining 2-unit BUY cannot fund
          // the later 4-unit SELL. Recalculation must reject the deletion.
          await recomputeHolding(
            savepoint,
            portfolio.id,
            portfolio.userId,
            coinId,
            "TST"
          );
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("Cannot sell")
        ) {
          deletionRejected = true;
        } else {
          throw error;
        }
      }

      assert.equal(
        deletionRejected,
        true,
        "Deleting the necessary adjustment was unexpectedly accepted."
      );

      // The nested savepoint must have restored the deleted adjustment.
      const remainingEvents = await tx
        .select({
          type: transactions.type,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.portfolioId, portfolio.id),
            eq(transactions.userId, portfolio.userId),
            eq(transactions.coinId, coinId)
          )
        )
        .orderBy(
          asc(transactions.executedAt),
          asc(transactions.ledgerSequence)
        );

      assert.deepEqual(
        remainingEvents.map((event) => event.type),
        ["buy", "adjustment", "sell"]
      );

      const [restoredHolding] = await tx
        .select({
          quantity: holdings.quantity,
          costBasis: holdings.costBasis,
        })
        .from(holdings)
        .where(
          and(
            eq(holdings.portfolioId, portfolio.id),
            eq(holdings.userId, portfolio.userId),
            eq(holdings.coinId, coinId)
          )
        )
        .limit(1);

      assert.ok(restoredHolding);
      assert.equal(restoredHolding.quantity, "1.00000000");
      assert.equal(restoredHolding.costBasis, "4.00000000");

      console.log(
        "Deleting required adjustment rejected and original ledger restored — passed."
      );
    });

    // --------------------------------------------------
    // Verify all test data was rolled back
    // --------------------------------------------------

    console.log("\n========== ROLLBACK VERIFICATION ==========");

    await assertNoPersistedTestData(
      database,
      portfolio.id,
      testCoinIds
    );

    console.log("No temporary ledger events or holdings remain.");
    console.log("\nDATABASE LEDGER INTEGRATION TESTS PASSED.");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("\nDATABASE LEDGER INTEGRATION TESTS FAILED.");
  console.error(error);
  process.exitCode = 1;
});
