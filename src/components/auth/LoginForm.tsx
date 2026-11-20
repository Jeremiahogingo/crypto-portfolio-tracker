/**
 * src/components/auth/LoginForm.tsx
 *
 * Login form using Supabase email/password authentication.
 *
 * Authentication flow:
 * 1. User submits their email and password.
 * 2. Supabase validates credentials and issues a session.
 * 3. The Supabase client persists the session through its cookie adapter.
 * 4. The application navigates to a validated internal destination.
 * 5. Server Components refresh and render using the authenticated session.
 *
 * Security:
 * - Credentials are submitted directly to Supabase Auth.
 * - Supabase error messages are displayed without exposing credentials.
 * - The optional "next" query parameter is untrusted input.
 * - Navigation destinations are validated before router.push().
 */

"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { getSafeNextPath } from "@/lib/auth/safe-redirect";
import Button from "@/components/ui/Button";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query parameters are untrusted input.
  // Only validated application-relative destinations are accepted.
  const next = getSafeNextPath(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Refresh Server Components so they observe the newly established
      // authentication session.
      router.refresh();

      // The destination has already passed same-origin validation.
      router.push(next);
    } catch (err) {
      console.error("[LoginForm] Sign-in failed", err);

      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
          CT
        </div>

        <span className="text-xl font-bold text-text">
          CryptoTracker
        </span>
      </div>

      <h1 className="text-lg font-semibold text-text mb-1">
        Sign in
      </h1>

      <p className="text-sm text-secondary mb-6">
        Welcome back. Enter your credentials to continue.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">
            Email
          </label>

          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text placeholder-secondary focus:outline-none focus:border-primary"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">
            Password
          </label>

          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text placeholder-secondary focus:outline-none focus:border-primary"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2"
          >
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full"
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-sm text-secondary text-center mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-primary hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
