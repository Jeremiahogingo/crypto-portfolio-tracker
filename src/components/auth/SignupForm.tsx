// src/components/auth/SignupForm.tsx
//
// Signup form — email/password account creation.
//
// ─── After signup ────────────────────────────────────────────────────────
// If email confirmation is disabled (as configured in Supabase for dev),
// Supabase returns a valid session immediately and we can push to "/" just
// like login. If confirmation is re-enabled for production, signUp returns
// no session, and the `identities` array will be empty if the email is
// already taken — we handle both cases by branching on session presence.
//
// ─── Password requirements ───────────────────────────────────────────────
// Supabase enforces 6-char minimum by default. Client-side validation
// matches this to fail fast; server-side is authoritative.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

export default function SignupForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      // Email confirmation is enabled on the Supabase project. The user
      // must click the link in their inbox before they can log in.
      setInfo("Check your email for a confirmation link, then sign in.");
      setLoading(false);
      return;
    }

    // Confirmation disabled — session is live, drop into the dashboard.
    router.refresh();
    router.push("/");
  };

  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
          CT
        </div>
        <span className="text-xl font-bold text-text">CryptoTracker</span>
      </div>

      <h1 className="text-lg font-semibold text-text mb-1">Create account</h1>
      <p className="text-sm text-secondary mb-6">
        Start tracking your crypto portfolio in minutes.
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text placeholder-secondary focus:outline-none focus:border-primary"
            placeholder="At least 6 characters"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">
            Confirm password
          </label>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text placeholder-secondary focus:outline-none focus:border-primary"
            placeholder="Repeat your password"
          />
        </div>

        {error && (
          <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {info && (
          <div className="text-xs text-primary bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
            {info}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full"
        >
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-sm text-secondary text-center mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}