
/**
 * src/lib/api/news.ts
 *
 * Server-side RSS and Atom news aggregation.
 *
 * Security:
 * - Only fixed, trusted RSS source URLs are requested.
 * - Every feed request has an eight-second timeout.
 * - Response bodies are bounded to prevent oversized feed processing.
 * - XML entity expansion has explicit limits.
 * - Article and image URLs must use HTTPS.
 * - Feed HTML is converted to plain text before reaching the UI.
 *
 * Reliability:
 * - Individual source failures do not interrupt successful feeds.
 * - Successful articles are deduplicated by URL.
 * - Articles are sorted by publication date.
 */

import "server-only";

import { XMLParser } from "fast-xml-parser";

import type { NewsArticle } from "@/types/news";

import { sanitizeHttpsUrl } from "@/lib/api/route-validation";

// --------------------------------------------------
// Limits
// --------------------------------------------------

const FEED_TIMEOUT_MS = 8_000;
const MAX_FEED_BYTES = 2 * 1024 * 1024;
const MAX_ARTICLE_LIMIT = 50;
const MAX_DESCRIPTION_LENGTH = 400;

// --------------------------------------------------
// RSS sources
// --------------------------------------------------

interface FeedSource {
  name: string;
  url: string;
  defaultCategory: string;
}

const SOURCES: FeedSource[] = [
  {
    name: "CoinDesk",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    defaultCategory: "Bitcoin",
  },
  {
    name: "Cointelegraph",
    url: "https://cointelegraph.com/rss",
    defaultCategory: "General",
  },
  {
    name: "The Block",
    url: "https://www.theblock.co/rss",
    defaultCategory: "General",
  },
];

// --------------------------------------------------
// XML parser
// --------------------------------------------------

// --------------------------------------------------
// XML parser
// --------------------------------------------------

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",

  processEntities: {
    enabled: true,
    maxEntitySize: 1_024,
    maxTotalExpansions: 1_000,
    maxExpandedLength: 100_000,
    maxEntityCount: 100,
  },
});

// --------------------------------------------------
// XML structure helpers
// --------------------------------------------------

/**
 * Narrow an unknown XML value into a plain object record.
 */
function asRecord(
  value: unknown
): Record<string, unknown> | undefined {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

// --------------------------------------------------
// Text normalization
// --------------------------------------------------

/**
 * Remove HTML markup and collapse whitespace.
 *
 * The final string is rendered by React as text, not injected as HTML.
 */
function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// --------------------------------------------------
// Date normalization
// --------------------------------------------------

function toIsoDate(value: unknown): string {
  if (typeof value !== "string") {
    return new Date().toISOString();
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
}

// --------------------------------------------------
// Article ID generation
// --------------------------------------------------

/**
 * Generate a deterministic identifier from an article URL.
 *
 * URL deduplication remains the primary duplicate safeguard.
 */
function idFromUrl(url: string): string {
  let hash = 0;

  for (let index = 0; index < url.length; index++) {
    hash = (hash << 5) - hash + url.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

// --------------------------------------------------
// Image extraction
// --------------------------------------------------

function extractImage(
  item: Record<string, unknown>
): string | undefined {
  const media = asRecord(item["media:content"]);

  if (typeof media?.["@_url"] === "string") {
    return media["@_url"];
  }

  const thumbnail = asRecord(item["media:thumbnail"]);

  if (typeof thumbnail?.["@_url"] === "string") {
    return thumbnail["@_url"];
  }

  const enclosure = asRecord(item.enclosure);

  if (
    typeof enclosure?.["@_url"] === "string" &&
    typeof enclosure?.["@_type"] === "string" &&
    enclosure["@_type"].startsWith("image/")
  ) {
    return enclosure["@_url"];
  }

  const image = item.image;

  if (typeof image === "string") {
    return image;
  }

  const imageRecord = asRecord(image);

  if (typeof imageRecord?.["@_href"] === "string") {
    return imageRecord["@_href"];
  }

  return undefined;
}

// --------------------------------------------------
// Category extraction
// --------------------------------------------------

function extractCategory(
  item: Record<string, unknown>,
  fallback: string
): string {
  const raw = item.category;

  if (!raw) {
    return fallback;
  }

  const categories = Array.isArray(raw)
    ? raw
    : [raw];

  for (const entry of categories) {
    if (typeof entry === "string" && entry.trim()) {
      return entry.trim().slice(0, 80);
    }

    const categoryRecord = asRecord(entry);
    const term = categoryRecord?.["@_term"];

    if (typeof term === "string" && term.trim()) {
      return term.trim().slice(0, 80);
    }
  }

  return fallback;
}

// --------------------------------------------------
// Article URL extraction
// --------------------------------------------------

/**
 * Extract an RSS or Atom article link.
 *
 * For Atom feeds, prefer rel="alternate" rather than self links.
 */
function extractUrl(
  item: Record<string, unknown>
): string | undefined {
  const raw = item.link;

  if (typeof raw === "string") {
    return raw;
  }

  const entries = Array.isArray(raw)
    ? raw
    : raw
      ? [raw]
      : [];

  let fallback: string | undefined;

  for (const entry of entries) {
    if (typeof entry === "string") {
      return entry;
    }

    const linkRecord = asRecord(entry);
    const href = linkRecord?.["@_href"];

    if (typeof href !== "string") {
      continue;
    }

    const relation = linkRecord?.["@_rel"];

    if (
      relation === undefined ||
      relation === "alternate"
    ) {
      return href;
    }

    fallback ??= href;
  }

  return fallback;
}

// --------------------------------------------------
// Feed parsing
// --------------------------------------------------

/**
 * Convert one RSS 2.0 or Atom document into NewsArticle records.
 *
 * Invalid structures and unsafe article URLs are skipped.
 */
function parseFeed(
  xml: string,
  source: FeedSource
): NewsArticle[] {
  let doc: Record<string, unknown>;

  try {
    doc = parser.parse(xml) as Record<string, unknown>;
  } catch {
    return [];
  }

  const rssChannel = asRecord(
    asRecord(doc.rss)?.channel
  );

  const rssItems = rssChannel?.item;
  const atomEntries = asRecord(doc.feed)?.entry;

  const rawItems: unknown[] = Array.isArray(rssItems)
    ? rssItems
    : Array.isArray(atomEntries)
      ? atomEntries
      : rssItems || atomEntries
        ? [rssItems ?? atomEntries]
        : [];

  const articles: NewsArticle[] = [];

  for (const raw of rawItems) {
    const item = asRecord(raw);

    if (!item) {
      continue;
    }

    const rawUrl = extractUrl(item);
    const url = sanitizeHttpsUrl(rawUrl);

    // Do not expose unsafe or malformed external links.
    if (!url) {
      continue;
    }

    const title = stripHtml(
      typeof item.title === "string"
        ? item.title
        : String(item.title ?? "")
    );

    if (!title) {
      continue;
    }

    const rawDescription =
      item.description ??
      item.summary ??
      item.content ??
      "";

    const description = stripHtml(
      typeof rawDescription === "string"
        ? rawDescription
        : String(rawDescription)
    ).slice(0, MAX_DESCRIPTION_LENGTH);

    const publishedAt = toIsoDate(
      item.pubDate ??
      item.published ??
      item.updated ??
      item.date
    );

    const rawImageUrl = extractImage(item);
    const imageUrl = sanitizeHttpsUrl(rawImageUrl);

    articles.push({
      id: idFromUrl(url),
      title: title.slice(0, 300),
      description,
      url,
      source: source.name,
      publishedAt,
      imageUrl,
      category: extractCategory(
        item,
        source.defaultCategory
      ),
      author:
        typeof item.author === "string"
          ? item.author.slice(0, 120)
          : typeof item["dc:creator"] === "string"
            ? item["dc:creator"].slice(0, 120)
            : undefined,
    });
  }

  return articles;
}

// --------------------------------------------------
// Bounded feed reading
// --------------------------------------------------

/**
 * Read an upstream response without allowing an oversized XML body.
 */
async function readLimitedFeed(
  response: Response,
  sourceName: string
): Promise<string> {
  const lengthHeader = response.headers.get("content-length");

  if (lengthHeader) {
    const declaredLength = Number(lengthHeader);

    if (
      Number.isFinite(declaredLength) &&
      declaredLength > MAX_FEED_BYTES
    ) {
      throw new Error(`${sourceName} feed exceeds the size limit`);
    }
  }

  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];

  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (totalBytes > MAX_FEED_BYTES) {
        await reader.cancel().catch(() => undefined);

        throw new Error(
          `${sourceName} feed exceeds the size limit`
        );
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);

  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(bytes);
}

// --------------------------------------------------
// Public news API
// --------------------------------------------------

export interface GetNewsOptions {
  /** Maximum articles returned after aggregation and deduplication. */
  limit?: number;
}

/**
 * Fetch, parse, deduplicate and sort articles from registered RSS sources.
 *
 * Individual source failures do not interrupt successful sources.
 * The function throws only when every source fails.
 */
export async function getNews(
  options: GetNewsOptions = {}
): Promise<NewsArticle[]> {
  const limit = options.limit ?? 30;

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > MAX_ARTICLE_LIMIT
  ) {
    throw new RangeError(
      `News limit must be an integer between 1 and ${MAX_ARTICLE_LIMIT}`
    );
  }

  const results = await Promise.allSettled(
    SOURCES.map(async (source) => {
      const response = await fetch(source.url, {
        headers: {
          "user-agent": "CryptoPortfolioTracker/1.0",
          accept:
            "application/rss+xml, application/atom+xml, application/xml, text/xml",
        },

        signal: AbortSignal.timeout(FEED_TIMEOUT_MS),

        next: {
          revalidate: 300,
        },
      });

      if (!response.ok) {
        throw new Error(
          `${source.name} responded with HTTP ${response.status}`
        );
      }

      const xml = await readLimitedFeed(
        response,
        source.name
      );

      return parseFeed(xml, source);
    })
  );

  const failures = results.filter(
    (result) => result.status === "rejected"
  );

  if (failures.length === results.length) {
    throw new Error("All news sources failed");
  }

  // Log source failures without dumping response bodies or sensitive data.
  for (const failure of failures) {
    if (failure.status === "rejected") {
      const reason = failure.reason;

      console.warn("[news] RSS source failed", {
        errorName:
          reason instanceof Error
            ? reason.name
            : "UnknownError",
      });
    }
  }

  const merged = results
    .filter(
      (result): result is PromiseFulfilledResult<NewsArticle[]> =>
        result.status === "fulfilled"
    )
    .flatMap((result) => result.value);

  const deduped = new Map<string, NewsArticle>();

  for (const article of merged) {
    if (!deduped.has(article.url)) {
      deduped.set(article.url, article);
    }
  }

  return Array.from(deduped.values())
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime()
    )
    .slice(0, limit);
}
