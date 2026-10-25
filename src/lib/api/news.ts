// src/lib/api/news.ts
//
// Server-side multi-source RSS aggregator.
//
// ─── Why RSS instead of a JSON API? ──────────────────────────────────────
// RSS gives us first-party headlines with zero API-key management and no
// rate limits. The trade-off is parsing work — which is centralised here —
// and occasional feed quirks (RSS 2.0 vs Atom, HTML in descriptions) that
// the normaliser handles.
//
// ─── Failure model ───────────────────────────────────────────────────────
// Each source is fetched independently with Promise.allSettled. A single
// source failing (timeout, 5xx, malformed XML) does not take down the page.
// The caller receives whatever succeeded. Only when all sources fail does
// getNews() throw, which triggers the fallback in the route handler.
//
// ─── Caching ────────────────────────────────────────────────────────────
// The fetches use Next.js `revalidate: 300` (5 minutes). Combined with the
// route handler's own revalidate, this means at most 3 outbound RSS requests
// per 5-minute window regardless of how many users hit /news.

import { XMLParser } from "fast-xml-parser";
import type { NewsArticle } from "@/types/news";

// ─── Source registry ─────────────────────────────────────────────────────

interface FeedSource {
  /** Display name shown on the article card. */
  name: string;
  /** RSS or Atom URL. */
  url: string;
  /** Default category when the feed doesn't provide a usable one. */
  defaultCategory: string;
}

/**
 * Ordered by editorial weight. The aggregator de-dupes by URL and sorts by
 * date descending, so source order only matters for tie-breaking.
 */
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

// ─── Parser configuration ────────────────────────────────────────────────

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  // RSS descriptions and Atom content are often CDATA-wrapped. fast-xml-parser
  // unwraps them automatically, but we also set this so HTML entities inside
  // the text are preserved rather than escaped.
  processEntities: true,
});

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Strip HTML tags and collapse whitespace. RSS descriptions are notoriously
 * dirty — some feeds include full markup, others plain text. The UI renders
 * this in a line-clamped paragraph, so plain text is the only safe input.
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

/**
 * Normalise dates from RSS pubDate (RFC 822, e.g. "Fri, 17 Oct 2026 …") and
 * Atom updated (ISO 8601). Returns an ISO string so downstream sorting and
 * `formatRelativeTime` are source-agnostic.
 */
function toIsoDate(value: unknown): string {
  if (typeof value !== "string") return new Date().toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/**
 * Derive a stable id from the URL. Two feeds sometimes syndicate the same
 * article with different titles — URL is the only reliable dedupe key.
 */
function idFromUrl(url: string): string {
  // Cheap deterministic hash — no crypto needed, collisions are harmless
  // because we also dedupe by URL below.
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Extract the first usable image URL from common RSS/Atom fields.
 * Order matters: media:content is usually the highest-quality editorial
 * image; enclosure is often a podcast file; image is the last resort.
 */
function extractImage(item: Record<string, unknown>): string | undefined {
  const media = item["media:content"] as Record<string, unknown> | undefined;
  if (typeof media?.["@_url"] === "string") return media["@_url"];

  const thumbnail = item["media:thumbnail"] as Record<string, unknown> | undefined;
  if (typeof thumbnail?.["@_url"] === "string") return thumbnail["@_url"];

  const enclosure = item.enclosure as Record<string, unknown> | undefined;
  if (
    typeof enclosure?.["@_url"] === "string" &&
    typeof enclosure?.["@_type"] === "string" &&
    String(enclosure["@_type"]).startsWith("image/")
  ) {
    return enclosure["@_url"];
  }

  const image = item.image as Record<string, unknown> | string | undefined;
  if (typeof image === "string") return image;
  if (typeof image === "object" && image !== null) {
    const href = image["@_href"];
    if (typeof href === "string") return href;
  }

  return undefined;
}

/**
 * Pull categories out of RSS <category> or Atom <category term="…">.
 * Feeds return anything from none to a dozen; we take the first non-empty.
 */
function extractCategory(
  item: Record<string, unknown>,
  fallback: string
): string {
  const raw = item.category;
  if (!raw) return fallback;

  const list = Array.isArray(raw) ? raw : [raw];
  for (const entry of list) {
    if (typeof entry === "string" && entry.trim()) return entry.trim();
    if (typeof entry === "object" && entry !== null) {
      const term = (entry as Record<string, unknown>)["@_term"];
      if (typeof term === "string" && term.trim()) return term.trim();
    }
  }
  return fallback;
}

/**
 * Extract the article URL. RSS uses <link>text</link>; Atom uses
 * <link href="…" rel="alternate" />. Both appear in the wild, and some
 * feeds provide multiple <link> elements (self + alternate + related).
 *
 * TypeScript note: `item.link` is `unknown` because the parsed XML tree is
 * untyped. We narrow through `typeof link === "string"` for the RSS case,
 * then through `typeof link === "object"` for the Atom case, so every
 * indexed access is on a known object — no `any` casts required.
 */
function extractUrl(item: Record<string, unknown>): string | undefined {
  const link = item.link;

  // RSS 2.0: <link>https://…</link>
  if (typeof link === "string") return link;

  // Atom: array of <link> elements — <link href="…" rel="alternate" />
  if (Array.isArray(link)) {
    for (const entry of link) {
      if (typeof entry === "string") return entry;
      if (typeof entry === "object" && entry !== null) {
        const href = (entry as Record<string, unknown>)["@_href"];
        if (typeof href === "string") return href;
      }
    }
  }

  // Atom: single <link href="…" />
  if (typeof link === "object" && link !== null) {
    const href = (link as Record<string, unknown>)["@_href"];
    if (typeof href === "string") return href;
  }

  return undefined;
}

// ─── Per-feed normaliser ─────────────────────────────────────────────────

/**
 * Convert one RSS/Atom document into NewsArticle[].
 *
 * Handles both dialects:
 *   • RSS 2.0: rss.channel.item
 *   • Atom:    feed.entry
 *
 * Returns [] on any structural surprise rather than throwing — a malformed
 * feed should degrade to "no items from this source", not "no news at all".
 */
function parseFeed(xml: string, source: FeedSource): NewsArticle[] {
  let doc: Record<string, unknown>;
  try {
    doc = parser.parse(xml) as Record<string, unknown>;
  } catch {
    return [];
  }

  const rssItems = (doc.rss as any)?.channel?.item;
  const atomEntries = (doc.feed as any)?.entry;
  const rawItems: unknown[] = Array.isArray(rssItems)
    ? rssItems
    : Array.isArray(atomEntries)
    ? atomEntries
    : rssItems || atomEntries
    ? [rssItems ?? atomEntries]
    : [];

  const articles: NewsArticle[] = [];

  for (const raw of rawItems) {
    if (typeof raw !== "object" || raw === null) continue;
    const item = raw as Record<string, unknown>;

    const url = extractUrl(item);
    const title = stripHtml(String(item.title ?? ""));
    if (!url || !title) continue;

    const rawDescription =
      item.description ?? item.summary ?? item.content ?? "";
    const description = stripHtml(
      typeof rawDescription === "string"
        ? rawDescription
        : String(rawDescription)
    ).slice(0, 400);

    const publishedAt = toIsoDate(
      item.pubDate ?? item.published ?? item.updated ?? item.date
    );

    articles.push({
      id: idFromUrl(url),
      title,
      description,
      url,
      source: source.name,
      publishedAt,
      imageUrl: extractImage(item),
      category: extractCategory(item, source.defaultCategory),
      author:
        typeof item.author === "string"
          ? item.author
          : typeof item["dc:creator"] === "string"
          ? item["dc:creator"]
          : undefined,
    });
  }

  return articles;
}

// ─── Public API ──────────────────────────────────────────────────────────

export interface GetNewsOptions {
  /** Maximum articles returned after aggregation and dedupe. Default 30. */
  limit?: number;
}

/**
 * Fetch, parse, de-duplicate, and sort news from all registered sources.
 *
 * Dedupe rule: same URL wins once. This matters because syndicated articles
 * frequently appear in multiple feeds with different titles.
 *
 * Sort rule: newest first. Feeds are individually ordered, but interleaving
 * them requires a global sort.
 *
 * Throws only when *every* source fails — partial success is normal and the
 * caller gets whatever succeeded.
 */
export async function getNews(
  options: GetNewsOptions = {}
): Promise<NewsArticle[]> {
  const limit = options.limit ?? 30;

  const results = await Promise.allSettled(
    SOURCES.map(async (source) => {
      const res = await fetch(source.url, {
        headers: {
          // Some feeds block requests without a conventional UA.
          "user-agent": "CryptoTracker/1.0 (+https://example.com)",
          accept:
            "application/rss+xml, application/atom+xml, application/xml, text/xml",
        },
        next: { revalidate: 300 },
      });

      if (!res.ok) {
        throw new Error(`${source.name} responded ${res.status}`);
      }

      const xml = await res.text();
      return parseFeed(xml, source);
    })
  );

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length === results.length) {
    throw new Error("All news sources failed");
  }

  // Log partial failures for observability without surfacing them to users.
  for (const f of failures) {
    console.warn(`[news] source failed: ${(f as PromiseRejectedResult).reason}`);
  }

  const merged = results
    .filter(
      (r): r is PromiseFulfilledResult<NewsArticle[]> =>
        r.status === "fulfilled"
    )
    .flatMap((r) => r.value);

  const deduped = new Map<string, NewsArticle>();
  for (const article of merged) {
    if (!deduped.has(article.url)) deduped.set(article.url, article);
  }

  return Array.from(deduped.values())
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .slice(0, limit);
}