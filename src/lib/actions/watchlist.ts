// src/lib/actions/watchlist.ts
//
// Watchlist mutations — add and remove.
//
// Both actions are trivially small because the data model is simple (a
// join table of user → coin). The discipline that matters is the same as
// every other action in this codebase:
//   1. Authorize via getCurrentUser.
//   2. Validate FormData with Zod.
//   3. Write scoped by userId.
//   4. Revalidate.
//
// Duplicate handling: adding a coin already in the watchlist is a no-op,
// not an error. Users may double-click the add button or hit an unrefreshed
// page; failing would be hostile when the desired end state is already met.

"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { watchlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export type WatchlistActionResult = { success: true } | { error: string };

const AddSchema = z.object({
  coinId: z.string().min(1),
  symbol: z.string().min(1).max(16),
});

const RemoveSchema = z.object({
  coinId: z.string().min(1),
});

export async function addToWatchlist(
  formData: FormData
): Promise<WatchlistActionResult> {
  const session = await getCurrentUser();
  if (!session) return { error: "Not authenticated" };

  const parsed = AddSchema.safeParse({
    coinId: formData.get("coinId"),
    symbol: formData.get("symbol"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { coinId, symbol } = parsed.data;

  try {
    // Check first to avoid the unique-constraint error path. Two round-trips
    // is fine here — this action fires from a modal submit, not a hot loop.
    // If the schema ever gains a UNIQUE (user_id, coin_id) constraint, this
    // could become an INSERT ... ON CONFLICT DO NOTHING in one statement.
    const existing = await db
      .select({ id: watchlistItems.id })
      .from(watchlistItems)
      .where(
        and(
          eq(watchlistItems.userId, session.auth.id),
          eq(watchlistItems.coinId, coinId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(watchlistItems).values({
        userId: session.auth.id,
        coinId,
        symbol,
      });
    }
  } catch (err) {
    console.error("[addToWatchlist] failed", err);
    return { error: "Failed to add coin. Please try again." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function removeFromWatchlist(
  formData: FormData
): Promise<WatchlistActionResult> {
  const session = await getCurrentUser();
  if (!session) return { error: "Not authenticated" };

  const parsed = RemoveSchema.safeParse({
    coinId: formData.get("coinId"),
  });
  if (!parsed.success) return { error: "Invalid coin" };

  try {
    await db
      .delete(watchlistItems)
      .where(
        and(
          eq(watchlistItems.userId, session.auth.id),
          eq(watchlistItems.coinId, parsed.data.coinId)
        )
      );
  } catch (err) {
    console.error("[removeFromWatchlist] failed", err);
    return { error: "Failed to remove coin. Please try again." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}