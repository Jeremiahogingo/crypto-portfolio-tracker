// src/app/(dashboard)/layout.tsx
//
// Dashboard layout — runs on every dashboard route.
//
// ─── Responsibilities ────────────────────────────────────────────────────
// 1. Auth gate (defence in depth — middleware already redirected)
// 2. Onboarding gate — if the user hasn't completed onboarding, send them
//    there. This lives in the layout, not middleware, because it needs a
//    DB read (profiles.onboarded_at), and middleware should stay cheap.
// 3. Build ShellUser for the client shell (sidebar, navbar)
//
// The layout is not in the onboarding route group, so redirecting here
// doesn't loop — /onboarding uses the (auth) layout instead.

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();

  if (!session) redirect("/login");

  const { auth, profile } = session;

  // Profile missing means the auto-profile trigger didn't fire (misconfigured
  // environment, or a user created through the Supabase Dashboard directly).
  // Fail safe: send to onboarding, which will create a default profile row
  // on first save.
  if (!profile?.onboardedAt) {
    redirect("/onboarding");
  }

  // `displayName` may still be null if the trigger set it to null and
  // onboarding was skipped via some other path. Fall back to email prefix.
  const displayName =
    profile.displayName?.trim() || auth.email?.split("@")[0] || "Account";

  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DashboardShell
      user={{ email: auth.email ?? "", displayName, initials }}
    >
      {children}
    </DashboardShell>
  );
}