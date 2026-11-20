
/**
 * src/lib/actions/profile.ts
 *
 * Server Actions for profile and onboarding mutations.
 *
 * Security:
 * - Every action requires a verified Supabase user.
 * - User ownership is derived exclusively from the authenticated session.
 * - Browser-submitted user IDs and profile IDs are never trusted.
 * - Database mutations use explicit ownership predicates.
 *
 * Consistency:
 * - Onboarding profile provisioning and default portfolio creation are atomic.
 * - Profile upsert serializes concurrent onboarding requests for the same user.
 * - Missing profiles can be recovered without creating duplicate profile rows.
 * - Default portfolio provisioning remains idempotent.
 *
 * Redirect handling:
 * Next.js redirect() throws internally. It must remain outside mutation
 * try/catch blocks so successful redirects propagate to the framework.
 */

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
 * The profile upsert and default portfolio provisioning execute
 * within one PostgreSQL transaction.
 *
 * The upsert handles both an existing profile and a missing profile.
 *
 * PostgreSQL's INSERT ... ON CONFLICT DO UPDATE obtains the necessary
 * row-level lock. Concurrent onboarding requests for the same user
 * therefore serialize before checking for an existing portfolio.
 *
 * This deliberately avoids a global one-portfolio-per-user restriction,
 * allowing multiple portfolios to be supported in the future.
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

  // The authenticated Supabase identity is the sole source of ownership.
  const userId = session.auth.id;
  const { displayName, currency } = parsed.data;

  // Use one timestamp consistently for this onboarding operation.
  const onboardedAt = new Date();

  try {
    await db.transaction(async (tx) => {
      // Recover a missing profile or update the existing profile.
      //
      // A concurrent request for the same user will wait for the
      // conflicting INSERT/UPDATE to finish before proceeding.
      const [upsertedProfile] = await tx
        .insert(profiles)
        .values({
          id: userId,
          displayName,
          currency,
          onboardedAt,
        })
        .onConflictDoUpdate({
          target: profiles.id,
          set: {
            displayName,
            currency,
            onboardedAt,
          },
        })
        .returning({
          id: profiles.id,
        });

      // Defensive check: the upsert should always return the profile.
      if (!upsertedProfile) {
        throw new Error(
          "Failed to provision the authenticated user's profile"
        );
      }

      // PostgreSQL READ COMMITTED gives this statement a fresh snapshot.
      // A concurrent onboarding transaction that completed while this
      // transaction waited will therefore be visible here.
      const [existingPortfolio] = await tx
        .select({
          id: portfolios.id,
        })
        .from(portfolios)
        .where(eq(portfolios.userId, userId))
        .orderBy(portfolios.createdAt)
        .limit(1);

      // Provision the default portfolio only when one does not exist.
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

  // Keep outside the try/catch because Next.js redirect() throws internally.
  redirect("/");
}

// --------------------------------------------------
// Update profile
// --------------------------------------------------

/**
 * Update the authenticated user's display name and preferred currency.
 *
 * This operation deliberately does not change onboardedAt.
 * It is intended for users who have already completed onboarding.
 */
export async function updateProfile(
  formData: FormData
): Promise<ActionResult> {
  const session = await getCurrentUser();

  if (!session) {
    return {
      error: "Not authenticated",
    };
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
        error: "Profile not found. Please complete onboarding again.",
      };
    }
  } catch (err) {
    console.error("[updateProfile] update failed", err);

    return {
      error: "Failed to save. Please try again.",
    };
  }

  revalidatePath("/", "layout");

  return {
    success: true,
  };
}
