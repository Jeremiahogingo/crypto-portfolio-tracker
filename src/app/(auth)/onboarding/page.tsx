import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import OnboardingForm from "@/components/onboarding/OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await getCurrentUser();

  if (!session) redirect("/login");
  if (session.profile?.onboardedAt) redirect("/");

  const suggestedName =
    session.profile?.displayName?.trim() ||
    session.auth.email?.split("@")[0] ||
    "";

  return (
    <OnboardingForm
      suggestedName={suggestedName}
      email={session.auth.email ?? ""}
    />
  );
}