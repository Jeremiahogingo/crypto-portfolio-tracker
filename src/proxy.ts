
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env/public";

/**
 * Routes that require an authenticated user.
 *
 * The root path is protected explicitly. Other entries also protect
 * their nested routes, such as /portfolio/transactions.
 */
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

/** Routes authenticated users should be redirected away from. */
const AUTH_ROUTES = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          // Update the incoming request so downstream Server Components
          // can access refreshed authentication cookies immediately.
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          // Persist refreshed cookies in the outgoing browser response.
          response = NextResponse.next({ request });

          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Validate the session with Supabase rather than trusting the token
  // contained in the browser cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();

    url.pathname = "/login";
    url.searchParams.set("next", path);

    return NextResponse.redirect(url);
  }

  if (user && AUTH_ROUTES.includes(path)) {
    const url = request.nextUrl.clone();

    url.pathname = "/";

    return NextResponse.redirect(url);
  }

  return response;
}

/**
 * Exclude routes that do not need session refresh:
 * - API endpoints, which enforce authentication within their handlers.
 * - Next.js build assets and optimized images.
 * - Static files such as icons, fonts, and images.
 */
export const config = {
  matcher: [
    "/((?!api(?:/|$)|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
