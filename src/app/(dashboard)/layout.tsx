// src/app/(dashboard)/layout.tsx
//
// Dashboard layout — fetches the current user once and passes it into the
// shell. Server-side fetch: no client loading state, no flicker.
//
// The middleware already guaranteed a session exists by the time this runs.
// We still call getUser() because we need the user's email/metadata for
// display — middleware only enforced the gate, it didn't pass data through.

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defensive: middleware should have redirected. If middleware is
  // misconfigured or bypassed (e.g. direct RSC call), we fail closed here.
  if (!user) redirect("/login");

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Account";

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DashboardShell
      user={{ email: user.email ?? "", displayName, initials }}
    >
      {children}
    </DashboardShell>
  );
}