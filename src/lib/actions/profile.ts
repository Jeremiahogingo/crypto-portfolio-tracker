// src/lib/actions/profile.ts
//
// Server Actions for profile and onboarding mutations.
//
// Security:
// - Every action requires a verified Supabase session.
// - The authenticated user ID is the only source of profile ownership.
// - Browser-submitted profile IDs and user IDs are never trusted.
// - Database mutations include explicit ownership predicates.
//
// Consistency:
// - Onboarding updates the profile and provisions the default portfolio
//   inside one database transaction.
// - The profile UPDATE acquires a PostgreSQL row lock. Concurrent onboarding
//   requests for the same user therefore serialize before checking whether
//   the default portfolio already exists.
// - A missing profile aborts the entire onboarding transaction.
//
// Redirect handling:
// Next.js redirect() throws internally. It is intentionally called outside
// mutation try/catch blocks so that successful redirects are not swallowed.

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { profiles, portfolios } from "@/db/schema";

// --------------------------------------------------
// Validation schemas
// --------------------------------------------------

// Keep supported currencies aligned with the settings UI.
const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "KES",
  "JPY",
  "NGN",
] as const;

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

// --------------------------------------------------
// Action results
// --------------------------------------------------

export type ActionResult =
  | { success: true }
  | { error: string };

// --------------------------------------------------
// Complete onboarding
// --------------------------------------------------

/**
 * Complete first-run onboarding for the authenticated user.
 *
 * The profile update and default portfolio provisioning are atomic.
 * Updating the profile also acquires a row-level lock, serializing concurrent
 * onboarding attempts for the same user.
 *
 * This prevents duplicate default portfolios without imposing a global
 * one-portfolio-per-user constraint, which would conflict with the future
 * multiple-portfolio feature.
 */
export async function completeOnboarding(
  formData: FormData
): Promise<ActionResult> {
  const session = await getCurrentUser();

  if (!session) {
    redirect("/login");
  }

  const parsed = OnboardingSchema.safeParse({
    displayName: formData.get("displayName"),
    currency: formData.get("currency"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const userId = session.auth.id;
  const { displayName, currency } = parsed.data;

  try {
    await db.transaction(async (tx) => {
      // This UPDATE is both the profile mutation and the serialization
      // point. PostgreSQL holds the row lock until this transaction ends.
      //
      // A concurrent onboarding request for this user waits here. Under
      // PostgreSQL's default READ COMMITTED isolation, its following SELECT
      // sees the portfolio committed by the preceding request.
      const [updatedProfile] = await tx
        .update(profiles)
        .set({
          displayName,
          currency,
          onboardedAt: new Date(),
        })
        .where(eq(profiles.id, userId))
        .returning({
          id: profiles.id,
        });

      // Do not create a portfolio for an identity whose profile could not
      // be updated. Throwing rolls back the entire onboarding transaction.
      if (!updatedProfile) {
        throw new Error(
          "Profile not found for authenticated onboarding user"
        );
      }

      const [existingPortfolio] = await tx
        .select({
          id: portfolios.id,
        })
        .from(portfolios)
        .where(eq(portfolios.userId, userId))
        .orderBy(portfolios.createdAt)
        .limit(1);

      if (!existingPortfolio) {
        await tx.insert(portfolios).values({
          userId,
          name: "Main",
          description: "Default portfolio",
        });
      }
    });
  } catch (err) {
    console.error("[completeOnboarding] transaction failed", err);

    return {
      error: "Failed to complete onboarding. Please try again.",
    };
  }

  revalidatePath("/", "layout");

  // Keep redirect outside the try/catch. Next.js implements redirect()
  // using a special thrown value that must propagate to the framework.
  redirect("/");
}

// --------------------------------------------------
// Update profile
// --------------------------------------------------

/**
 * Update the authenticated user's display name and preferred currency.
 *
 * This operation deliberately does not modify onboardedAt. It is used
 * after onboarding has already been completed.
 */
export async function updateProfile(
  formData: FormData
): Promise<ActionResult> {
  const session = await getCurrentUser();

  if (!session) {
    return { error: "Not authenticated" };
  }

  const parsed = UpdateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    currency: formData.get("currency"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    const [updatedProfile] = await db
      .update(profiles)
      .set({
        displayName: parsed.data.displayName,
        currency: parsed.data.currency,
      })
      .where(eq(profiles.id, session.auth.id))
      .returning({
        id: profiles.id,
      });

    if (!updatedProfile) {
      return {
        error: "Profile not found. Please sign in again.",
      };
    }
  } catch (err) {
    console.error("[updateProfile] update failed", err);

    return {
      error: "Failed to save. Please try again.",
    };
  }

  revalidatePath("/", "layout");

  return { success: true };
}
