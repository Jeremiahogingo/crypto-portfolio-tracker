
/**
 * src/components/auth/LogoutButton.tsx
 *
 * Client-side logout control.
 *
 * Security:
 * - Uses the authenticated user's Supabase client.
 * - Waits for Supabase sign-out to complete before navigating.
 * - Does not report successful logout when sign-out fails.
 * - Displays a recoverable error when logout cannot be completed.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({
  className,
}: LogoutButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error("[LogoutButton] Supabase sign-out failed", signOutError);

        setError("Unable to sign out. Please try again.");
        return;
      }

      // Re-render Server Components after the session cookies have
      // been cleared by Supabase.
      router.refresh();

      // Replace the authenticated page in browser history.
      router.replace("/login");
    } catch (err) {
      console.error("[LogoutButton] Unexpected sign-out failure", err);

      setError("An unexpected error occurred while signing out.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        aria-busy={loading}
        className={className}
      >
        {loading ? "Signing out…" : "Logout"}
      </button>

      {error && (
        <p
          role="alert"
          className="mt-2 text-xs text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
