// src/lib/actions/profile.ts
//
// Server Actions for profile mutations.
//
// ─── Pattern ─────────────────────────────────────────────────────────────
// Every action follows the same shape:
//   1. Authorize — getCurrentUser() and bail if unauthenticated.
//   2. Validate — Zod schema. FormData is untrusted input even when it
//      comes from our own form: someone can POST directly.
//   3. Mutate — wrapped in a transaction if it touches multiple tables.
//   4. Invalidate — revalidatePath so cached Server Components re-render.
//   5. Return — `{ success: true }` or `{ error: string }`.
//
// ─── Redirects ───────────────────────────────────────────────────────────
// redirect() throws a special NextError — it must NOT be inside a try/catch
// that swallows it. Both actions call it at the very end, after all
// mutation logic is complete.

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { profiles, portfolios } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

// ─── Schemas ─────────────────────────────────────────────────────────────

// Currencies must match the codes we render in the settings dropdown.
// Keep this in sync with src/mock/settings.ts when we replace it with
// server-driven data in Phase 2.6.
const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "KES", "JPY", "NGN"] as const;

const OnboardingSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be 50 characters or fewer"),
  currency: z.enum(SUPPORTED_CURRENCIES),
});

const UpdateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(50),
  currency: z.enum(SUPPORTED_CURRENCIES),
});

// ─── Action results ──────────────────────────────────────────────────────

export type ActionResult = { success: true } | { error: string };

// ─── completeOnboarding ──────────────────────────────────────────────────
//
// Called from /onboarding. Sets display_name, currency, and onboarded_at,
// and provisions a default portfolio if the user has none. The default
// portfolio matters: the dashboard's "Total Value" and charts need a
// portfolio to query; without one they'd show empty states on a brand-new
// account, which looks broken even though it isn't.
//
// Wrapped in a transaction so a partial failure (say, profile update
// succeeds but portfolio insert fails) rolls back cleanly. Retrying after
// a rolled-back transaction is safe — the ON CONFLICT-style guards make
// the action idempotent.

export async function completeOnboarding(
  formData: FormData
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  const parsed = OnboardingSchema.safeParse({
    displayName: formData.get("displayName"),
    currency: formData.get("currency"),
  });

  if (!parsed.success) {
    // Return the first field error — one at a time is easier to display.
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { displayName, currency } = parsed.data;
  const userId = session.auth.id;

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(profiles)
        .set({
          displayName,
          currency,
          onboardedAt: new Date(),
        })
        .where(eq(profiles.id, userId));

      const existing = await tx
        .select({ id: portfolios.id })
        .from(portfolios)
        .where(eq(portfolios.userId, userId))
        .limit(1);

      if (existing.length === 0) {
        await tx.insert(portfolios).values({
          userId,
          name: "Main",
          description: "Default portfolio",
        });
      }
    });
  } catch (err) {
    console.error("[completeOnboarding] transaction failed", err);
    return { error: "Something went wrong. Please try again." };
  }

  // Invalidate everything under the dashboard — layout, pages, and any
  // client components using useQuery for user-scoped data (none yet, but
  // this future-proofs the invalidation).
  revalidatePath("/", "layout");

  redirect("/");
}

// ─── updateProfile ───────────────────────────────────────────────────────
//
// Called from the Settings page. Unlike completeOnboarding, this does not
// touch onboarded_at — the user has already onboarded, they're just
// updating fields. Returns ActionResult so the settings form can show
// inline success/error state without a page reload.

export async function updateProfile(
  formData: FormData
): Promise<ActionResult> {
  const session = await getCurrentUser();
  if (!session) return { error: "Not authenticated" };

  const parsed = UpdateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    currency: formData.get("currency"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await db
      .update(profiles)
      .set({
        displayName: parsed.data.displayName,
        currency: parsed.data.currency,
      })
      .where(eq(profiles.id, session.auth.id));
  } catch (err) {
    console.error("[updateProfile] update failed", err);
    return { error: "Failed to save. Please try again." };
  }

  // Revalidate the dashboard layout so the sidebar and navbar reflect the
  // new display name immediately.
  revalidatePath("/", "layout");
  return { success: true };
}