import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import SettingsTabs from "@/components/settings/SettingsTabs";

export default async function SettingsPage() {
  const session = await getCurrentUser();

  if (!session) redirect("/login");
  if (!session.profile?.onboardedAt) redirect("/onboarding");

  const { auth, profile } = session;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">
        Settings
      </h1>

      <SettingsTabs
        profile={{
          name:
            profile.displayName ??
            auth.email?.split("@")[0] ??
            "Account",
          email: auth.email ?? "",
        }}
      />
    </div>
  );
}