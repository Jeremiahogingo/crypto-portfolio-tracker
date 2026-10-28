// src/app/(auth)/onboarding/page.tsx
//
// First-run onboarding. Runs once per account, before the user reaches the
// dashboard.
//
// ─── Redirect logic ──────────────────────────────────────────────────────
// • Unauthenticated → /login (middleware catches this, but explicit
//   redirect here is defence-in-depth for direct RSC invocations)
// • Already onboarded → / (they don't need to see this again)
// • Fresh user → render the form
//
// Using redirect() from next/navigation, not middleware, because the
// already-onboarded check needs profiles.onboarded_at — a DB read that
// middleware shouldn't pay for.

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import OnboardingForm from "@/components/onboarding/OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await getCurrentUser();

  if (!session) redirect("/login");
  if (session.profile?.onboardedAt) redirect("/");

  // Pre-populate the display name field with what the trigger set
  // (full_name from signup metadata, or email prefix).
  const suggestedName =
    session.profile?.displayName?.trim() ||
    session.auth.email?.split("@")[0] ||
    "";

  const suggestedCurrency = session.profile?.currency ?? "USD";

  return (
    <OnboardingForm
      suggestedName={suggestedName}
      suggestedCurrency={suggestedCurrency}
      email={session.auth.email ?? ""}
    />
  );
}