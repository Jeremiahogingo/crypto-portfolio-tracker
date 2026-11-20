
/**
 * src/lib/auth/safe-redirect.ts
 *
 * Safely validates navigation destinations received from URL parameters.
 *
 * Security:
 * - Only application-relative paths are accepted.
 * - External and protocol-relative URLs are rejected.
 * - JavaScript and other non-HTTP navigation schemes are rejected.
 * - Backslashes and control characters are rejected to prevent URL parser
 *   normalization from changing the intended destination.
 *
 * This utility is intentionally independent of browser APIs so it can
 * be tested directly using Node's built-in test runner.
 */

const APP_ORIGIN = "https://crypto-tracker.invalid";

const DEFAULT_REDIRECT = "/";

/**
 * Resolve a user-provided navigation destination safely.
 *
 * @param candidate Untrusted destination from a URL query parameter.
 * @returns A safe application-relative path or "/".
 */
export function getSafeNextPath(candidate: string | null): string {
  // An absent or empty destination falls back to the dashboard.
  if (!candidate) {
    return DEFAULT_REDIRECT;
  }

  // Only absolute-path references are accepted.
  // This rejects plain relative paths such as "portfolio".
  if (!candidate.startsWith("/")) {
    return DEFAULT_REDIRECT;
  }

  // Reject protocol-relative URLs such as //evil.example.
  if (candidate.startsWith("//")) {
    return DEFAULT_REDIRECT;
  }

  // Reject backslashes and control characters.
  // URL parsers may normalize backslashes as path separators.
  if (candidate.includes("\\") || /[\u0000-\u001F\u007F]/.test(candidate)) {
    return DEFAULT_REDIRECT;
  }

  try {
    // Resolve against a fixed internal origin.
    const destination = new URL(candidate, APP_ORIGIN);

    // The parsed destination must remain on the application's origin.
    if (destination.origin !== APP_ORIGIN) {
      return DEFAULT_REDIRECT;
    }

    // Return only the relative path, query string and fragment.
    // Never return an absolute URL to the Next.js router.
    return (
      destination.pathname +
      destination.search +
      destination.hash
    );
  } catch {
    // Malformed URL input must never break the login flow.
    return DEFAULT_REDIRECT;
  }
}
