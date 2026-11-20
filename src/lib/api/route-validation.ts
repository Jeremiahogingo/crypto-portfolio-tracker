
/**
 * src/lib/api/route-validation.ts
 *
 * Shared validation for public cryptocurrency API routes.
 *
 * Security:
 * - Reject duplicated query parameters.
 * - Validate numeric inputs before using them.
 * - Restrict pagination and result counts.
 * - Validate CoinGecko currency and coin ID formats.
 * - Reject unsafe external URLs from RSS feeds.
 */

import { z } from "zod";

// --------------------------------------------------
// Limits
// --------------------------------------------------

export const MAX_MARKET_PAGE_SIZE = 250;
export const MAX_MARKET_PAGE = 10_000;
export const MAX_MARKET_COIN_IDS = 250;
export const MAX_NEWS_LIMIT = 50;

// --------------------------------------------------
// Parse result
// --------------------------------------------------

export type QueryParseResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

// --------------------------------------------------
// Shared parameter extraction
// --------------------------------------------------

/**
 * Read query parameters while rejecting duplicated keys.
 *
 * Using getAll() prevents ambiguous inputs such as:
 * ?per_page=10&per_page=250
 */
function readUniqueParameters(
  searchParams: URLSearchParams,
  names: string[]
): QueryParseResult<Record<string, string>> {
  const values: Record<string, string> = {};

  for (const name of names) {
    const entries = searchParams.getAll(name);

    if (entries.length > 1) {
      return {
        success: false,
        error: `Query parameter "${name}" must appear only once.`,
      };
    }

    if (entries.length === 1) {
      values[name] = entries[0];
    }
  }

  return {
    success: true,
    data: values,
  };
}

// --------------------------------------------------
// Markets query validation
// --------------------------------------------------

const positiveInteger = (
  defaultValue: number,
  maximum: number
) =>
  z
    .string()
    .regex(/^\d+$/, "Must be a positive whole number")
    .default(String(defaultValue))
    .transform(Number)
    .pipe(
      z
        .number()
        .int()
        .min(1)
        .max(maximum)
    );

const CoinIdsSchema = z
  .string()
  .max(16_384, "The coin ID parameter is too long")
  .optional()
  .transform((value) =>
    value === undefined
      ? undefined
      : value
          .split(",")
          .map((id) => id.trim().toLowerCase())
  )
  .refine(
    (ids) =>
      ids === undefined ||
      (ids.length >= 1 && ids.length <= MAX_MARKET_COIN_IDS),
    `Between 1 and ${MAX_MARKET_COIN_IDS} coin IDs are allowed`
  )
  .refine(
    (ids) =>
      ids === undefined ||
      ids.every((id) =>
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) &&
        id.length <= 64
      ),
    "One or more coin IDs have an invalid format"
  )
  .refine(
    (ids) =>
      ids === undefined ||
      new Set(ids).size === ids.length,
    "Duplicate coin IDs are not allowed"
  );

const MarketsQuerySchema = z
  .object({
    vs_currency: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        /^[a-z0-9]{2,10}$/,
        "Currency must be a valid currency code"
      )
      .default("usd"),

    per_page: positiveInteger(
      100,
      MAX_MARKET_PAGE_SIZE
    ),

    page: positiveInteger(
      1,
      MAX_MARKET_PAGE
    ),

    ids: CoinIdsSchema,

    sparkline: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
  })
  .refine(
    ({ ids, per_page }) =>
      ids === undefined || ids.length <= per_page,
    {
      message:
        "per_page must be at least the number of requested coin IDs",
      path: ["per_page"],
    }
  );

export type MarketsQuery = z.infer<typeof MarketsQuerySchema>;

/**
 * Validate /api/crypto/markets query parameters.
 *
 * Defaults:
 * - vs_currency: usd
 * - per_page: 100
 * - page: 1
 * - sparkline: false
 */
export function parseMarketsQuery(
  searchParams: URLSearchParams
): QueryParseResult<MarketsQuery> {
  const raw = readUniqueParameters(searchParams, [
    "vs_currency",
    "per_page",
    "page",
    "ids",
    "sparkline",
  ]);

  if (!raw.success) {
    return raw;
  }

  const parsed = MarketsQuerySchema.safeParse(raw.data);

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ??
        "Invalid markets query parameters",
    };
  }

  return {
    success: true,
    data: parsed.data,
  };
}

// --------------------------------------------------
// News query validation
// --------------------------------------------------

const NewsQuerySchema = z.object({
  limit: positiveInteger(
    30,
    MAX_NEWS_LIMIT
  ),
});

export type NewsQuery = z.infer<typeof NewsQuerySchema>;

/**
 * Validate /api/crypto/news query parameters.
 *
 * Default limit: 30.
 * Maximum limit: 50.
 */
export function parseNewsQuery(
  searchParams: URLSearchParams
): QueryParseResult<NewsQuery> {
  const raw = readUniqueParameters(searchParams, [
    "limit",
  ]);

  if (!raw.success) {
    return raw;
  }

  const parsed = NewsQuerySchema.safeParse(raw.data);

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ??
        "Invalid news query parameters",
    };
  }

  return {
    success: true,
    data: parsed.data,
  };
}

// --------------------------------------------------
// External URL validation
// --------------------------------------------------

const MAX_EXTERNAL_URL_LENGTH = 2_048;

/**
 * Accept only absolute HTTPS URLs without embedded credentials.
 *
 * RSS feeds are external and their links and image URLs must not be
 * trusted without validation.
 *
 * Returns the normalized HTTPS URL or undefined.
 */
export function sanitizeHttpsUrl(
  value: unknown
): string | undefined {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_EXTERNAL_URL_LENGTH ||
    value !== value.trim()
  ) {
    return undefined;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      return undefined;
    }

    if (!url.hostname) {
      return undefined;
    }

    if (url.username || url.password) {
      return undefined;
    }

    return url.href;
  } catch {
    return undefined;
  }
}
