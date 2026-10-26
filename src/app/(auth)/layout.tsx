// src/app/(auth)/layout.tsx
//
// Layout for authentication routes (login, signup).
//
// Deliberately separate from the dashboard shell: no sidebar, no navbar,
// no fetching of user data. Auth pages render a centered card, nothing more.
//
// The route group (auth) is invisible in URLs — /login and /signup resolve
// here without any prefix.

import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}