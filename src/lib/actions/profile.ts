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
 * Currency:
 * - The application currently reports all amounts in USD.
 * - The currency is assigned server-side rather than accepted from the browser.
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { profiles, portfolios } from "@/db/schema";

const REPORTING_CURRENCY = "USD" as const;

// --------------------------------------------------
// Validation schemas
// --------------------------------------------------

const OnboardingSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be 50 characters or fewer"),
});

const UpdateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be 50 characters or fewer"),
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
 * PostgreSQL's INSERT ... ON CONFLICT DO UPDATE obtains the necessary
 * row-level lock. Concurrent onboarding requests for the same user
 * therefore serialize before checking for an existing portfolio.
 *
 * This deliberately avoids a global one-portfolio-per-user restriction,
 * allowing multiple portfolios to be supported in the future.
 */
export async function completeOnboarding(
  formData: FormData,
): Promise<ActionResult> {
  const session = await getCurrentUser();

  if (!session) {
    redirect("/login");
  }

  const parsed = OnboardingSchema.safeParse({
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const userId = session.auth.id;
  const { displayName } = parsed.data;
  const onboardedAt = new Date();

  try {
    await db.transaction(async (tx) => {
      const [upsertedProfile] = await tx
        .insert(profiles)
        .values({
          id: userId,
          displayName,
          currency: REPORTING_CURRENCY,
          onboardedAt,
        })
        .onConflictDoUpdate({
          target: profiles.id,
          set: {
            displayName,
            currency: REPORTING_CURRENCY,
            onboardedAt,
          },
        })
        .returning({
          id: profiles.id,
        });

      if (!upsertedProfile) {
        throw new Error(
          "Failed to provision the authenticated user's profile",
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

  // Keep outside the try/catch because redirect() throws internally.
  redirect("/");
}

// --------------------------------------------------
// Update profile
// --------------------------------------------------

/**
 * Update the authenticated user's display name.
 *
 * The reporting currency is normalized to USD because multi-currency
 * conversion is not currently supported by the application.
 *
 * This operation deliberately does not change onboardedAt.
 */
export async function updateProfile(
  formData: FormData,
): Promise<ActionResult> {
  const session = await getCurrentUser();

  if (!session) {
    return {
      error: "Not authenticated",
    };
  }

  const parsed = UpdateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
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
        currency: REPORTING_CURRENCY,
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