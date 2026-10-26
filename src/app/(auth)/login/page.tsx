// src/app/(auth)/login/page.tsx
//
// Login route. Wraps LoginForm in a Suspense boundary because the form uses
// useSearchParams() (for the ?next= redirect param), which Next.js requires
// to be inside Suspense in the App Router.
//
// Also forces dynamic rendering — auth pages must never be statically cached,
// or a returning user could see a stale login screen after logging in on
// another tab.

import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-secondary">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}