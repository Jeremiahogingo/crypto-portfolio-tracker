// src/app/(dashboard)/settings/page.tsx
//
// Settings page.
//
// Now a Server Component wrapper that fetches the current profile and hands
// the fields down as props. This is the standard split:
//   • Page (server) fetches initial data → no client loading flicker
//   • Form (client) handles interactivity → useActionState for mutations
//
// The other tabs (Appearance, Notifications, Security, Regional) remain
// local-state for now — they don't have server actions yet. Phase 2.6
// moves them to the DB.

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import SettingsTabs from "@/components/settings/SettingsTabs";

export default async function SettingsPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  const { auth, profile } = session;
  if (!profile?.onboardedAt) redirect("/onboarding");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Settings</h1>
      <SettingsTabs
        profile={{
          name: profile.displayName ?? auth.email?.split("@")[0] ?? "Account",
          currency: profile.currency,
          email: auth.email ?? "",
        }}
      />
    </div>
  );
}