// src/lib/auth/get-current-user.ts
//
// Request-scoped accessor for the authenticated user and their profile.
//
// ─── Why cache() ─────────────────────────────────────────────────────────
// React's cache() memoizes by argument. Since getCurrentUser takes no
// arguments, the result is shared across every Server Component and Server
// Action in the same request. If the dashboard layout and a page both call
// this, only one DB round-trip happens.
//
// ─── Why Drizzle, not the Supabase client? ───────────────────────────────
// Two reasons:
//   1. We're already authorized — `supabase.auth.getUser()` ran and gave us
//      the exact user id. RLS protection on the profile read would be
//      defensive, not load-bearing.
//   2. Drizzle is one Postgres round-trip; Supabase client is an HTTPS call
//      to Supabase's REST layer, which proxies to Postgres. Same DB, more
//      hops. On every request, that adds up.
//
// The safety net is that `auth.getUser()` must run first — if it returns
// null, we don't touch the DB. A bug that skips getUser() would fail open
// (return null) rather than leak another user's data.
//
// ─── Return shape ────────────────────────────────────────────────────────
// Returns `null` when unauthenticated (no session cookie or bad token).
// Returns `{ auth, profile }` when authenticated. `profile` may be null
// when the trigger failed for some reason — the caller should handle that
// as "profile not yet provisioned" rather than treating it as auth failure.

import { cache } from "react";
import { eq } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles, type Profile } from "@/db/schema";
import type { User } from "@supabase/supabase-js";

export interface CurrentUser {
  auth: User;
  profile: Profile | null;
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  return { auth: user, profile: profile ?? null };
});