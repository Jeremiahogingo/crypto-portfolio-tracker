// src/components/auth/LoginForm.tsx
//
// Login form — email/password sign-in via Supabase Auth.
//
// ─── Flow ────────────────────────────────────────────────────────────────
// 1. User submits form.
// 2. supabase.auth.signInWithPassword issues a session, which the SDK stores
//    in cookies (via @supabase/ssr).
// 3. We router.push() to the `next` query param (set by middleware) or "/".
// 4. router.refresh() re-renders Server Components so they see the new session.
//
// Step 4 is required — without it, Server Components cache their previous
// (unauthenticated) render and the user sees a broken dashboard until they
// manually reload.
//
// ─── Errors ──────────────────────────────────────────────────────────────
// Supabase returns the same message for wrong password and unknown email
// ("Invalid login credentials") by design — it prevents user enumeration.
// We surface the message verbatim; translating it would defeat the purpose.

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // refresh() forces Server Components to re-run with the new session cookie.
    // Without this, the dashboard renders with stale (unauthenticated) data.
    router.refresh();
    router.push(next);
  };

  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
          CT
        </div>
        <span className="text-xl font-bold text-text">CryptoTracker</span>
      </div>

      <h1 className="text-lg font-semibold text-text mb-1">Sign in</h1>
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
            onChange={(e) => setEmail(e.target.value)}
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
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text placeholder-secondary focus:outline-none focus:border-primary"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
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
        <Link href="/signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}