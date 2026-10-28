// src/middleware.ts
//
// Global middleware — runs on every request before the route renders.
//
// ─── Why middleware for auth? ────────────────────────────────────────────
// Two responsibilities that *must* run per-request:
//
//   1. Session refresh
//      Supabase access tokens expire after 1 hour. If left alone, the user
//      is silently logged out mid-session. Middleware refreshes the token
//      before the request proceeds, so every Server Component downstream
//      sees a valid session.
//
//   2. Auth routing
//      Redirect unauthenticated users hitting dashboard routes to /login,
//      and authenticated users hitting /login or /signup back to /.
//
// ─── Cost ────────────────────────────────────────────────────────────────
// Middleware runs on every request, but the Supabase call is a cookie read
// (no network) unless the token is expired. For valid sessions this is
// effectively free. For expired sessions it's one roundtrip to Supabase.
//
// ─── Matcher ─────────────────────────────────────────────────────────────
// Excludes static assets, the API, and Next internals. If those ran through
// middleware it would add latency to every image and font fetch for no
// reason. The pattern below is Next.js's documented recommendation for
// auth-gated apps.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Routes that require an authenticated user. */
const PROTECTED_PREFIXES = [
  "/",
  "/portfolio",
  "/markets",
  "/analytics",
  "/watchlist",
  "/news",
  "/alerts",
  "/settings",
  "/onboarding", 
];

/** Routes authenticated users should be redirected *away* from. */
const AUTH_ROUTES = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Two-step: write to the request (so downstream Server Components
          // see the refreshed token in the same request) AND to the response
          // (so the browser persists it for the next request).
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // IMPORTANT: getUser() (not getSession()) — it revalidates the token with
  // Supabase's server and can't be spoofed by a forged cookie. getSession()
  // trusts the JWT blindly. For access control, always use getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Block unauthenticated users from protected routes
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Preserve the originally requested path so we can redirect back post-login.
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Bounce authenticated users away from auth pages
  if (user && AUTH_ROUTES.includes(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

/**
 * Match every route except:
 *   • _next/static, _next/image — build artifacts
 *   • favicon.ico, robots.txt, sitemap.xml — static files
 *   • api/* — API routes handle auth themselves (and we don't want
 *     middleware refresh calls to double up with per-route getUser calls)
 *   • image/*, font files — static assets
 */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};