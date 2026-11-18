// src/lib/actions/watchlist.ts
//
// Server Actions for watchlist mutations.
//
// Security model:
// 1. Authenticate every request using the verified Supabase session.
// 2. Derive userId exclusively from the authenticated user.
// 3. Validate all browser-supplied values with Zod.
// 4. Scope every database mutation to the authenticated user.
//
// Concurrency:
// The database enforces UNIQUE (user_id, coin_id).
// Adding a coin uses INSERT ... ON CONFLICT DO NOTHING, so concurrent
// duplicate requests safely converge to one watchlist entry.
//
// The Drizzle connection bypasses RLS, so application-level ownership
// predicates remain mandatory.

"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { watchlistItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export type WatchlistActionResult =
  | { success: true }
  | { error: string };

// --------------------------------------------------
// Input validation
// --------------------------------------------------

const AddSchema = z.object({
  coinId: z.string().trim().min(1).max(100),
  symbol: z.string().trim().min(1).max(16),
});

const RemoveSchema = z.object({
  coinId: z.string().trim().min(1).max(100),
});

// --------------------------------------------------
// Add watchlist entry
// --------------------------------------------------

export async function addToWatchlist(
  formData: FormData
): Promise<WatchlistActionResult> {
  const session = await getCurrentUser();

  if (!session) {
    return { error: "Not authenticated" };
  }

  const parsed = AddSchema.safeParse({
    coinId: formData.get("coinId"),
    symbol: formData.get("symbol"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { coinId, symbol } = parsed.data;

  try {
    // The unique constraint on (user_id, coin_id) is the concurrency
    // boundary. PostgreSQL guarantees that simultaneous duplicate
    // requests cannot create multiple entries.
    //
    // A conflict is intentionally treated as success: the desired
    // watchlist state already exists, making this operation idempotent.
    await db
      .insert(watchlistItems)
      .values({
        userId: session.auth.id,
        coinId,
        symbol,
      })
      .onConflictDoNothing({
        target: [
          watchlistItems.userId,
          watchlistItems.coinId,
        ],
      });
  } catch (err) {
    console.error("[addToWatchlist] failed", err);

    return {
      error: "Failed to add coin. Please try again.",
    };
  }

  revalidatePath("/", "layout");

  return { success: true };
}

// --------------------------------------------------
// Remove watchlist entry
// --------------------------------------------------

export async function removeFromWatchlist(
  formData: FormData
): Promise<WatchlistActionResult> {
  const session = await getCurrentUser();

  if (!session) {
    return { error: "Not authenticated" };
  }

  const parsed = RemoveSchema.safeParse({
    coinId: formData.get("coinId"),
  });

  if (!parsed.success) {
    return { error: "Invalid coin" };
  }

  try {
    // Both identifiers are required because the Drizzle connection
    // operates with a PostgreSQL role that bypasses RLS.
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

    return {
      error: "Failed to remove coin. Please try again.",
    };
  }

  revalidatePath("/", "layout");

  return { success: true };
}
