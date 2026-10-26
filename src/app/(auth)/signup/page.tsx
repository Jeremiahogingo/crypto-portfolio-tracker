// src/app/(auth)/signup/page.tsx
//
// Signup route. No Suspense needed — SignupForm doesn't read search params.
// Same force-dynamic reasoning as the login page.

import SignupForm from "@/components/auth/SignupForm";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return <SignupForm />;
}