
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // getUser() validates the session with Supabase instead of blindly
  // trusting the access token contained in the browser cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );

  // Redirect unauthenticated users away from protected application pages.
  if (!user && isProtected) {
    const url = request.nextUrl.clone();

    url.pathname = "/login";
    url.searchParams.set("next", path);

    return NextResponse.redirect(url);
  }

  // Authenticated users do not need to revisit login or signup.
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
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
