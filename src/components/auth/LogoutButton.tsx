// src/components/auth/LogoutButton.tsx
//
// Small client component that clears the session and redirects to /login.
//
// router.refresh() is called before push: it re-renders Server Components
// (which will see no user), then push navigates. If we pushed first, the
// dashboard would briefly render with stale auth state.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={className}
    >
      {loading ? "Signing out…" : "Logout"}
    </button>
  );
}