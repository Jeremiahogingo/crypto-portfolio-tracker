// src/lib/api/news.ts

import { XMLParser } from "fast-xml-parser";
import type { NewsArticle } from "@/types/news";

interface FeedSource {
  /** Display name shown on the article card. */
  name: string;
  /** RSS or Atom URL. */
  url: string;
  /** Default category when the feed doesn't provide a usable one. */
  defaultCategory: string;
}

/**
 * Ordered by editorial weight. Articles are deduplicated by URL and sorted
 * by publication date, so source order only matters for tie-breaking.
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

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  processEntities: true,
});

/**
 * Narrow an unknown XML parser value to a plain object record.
 *
 * XML feeds contain inconsistent structures, so callers should not assume
 * that a parsed element is always an object.
 */
function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

/**
 * Strip HTML tags and collapse whitespace. RSS descriptions are frequently
 * inconsistent, so plain text is the only safe input for the UI.
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
 * Normalize RSS pubDate and Atom updated/published dates into ISO strings.
 */
function toIsoDate(value: unknown): string {
  if (typeof value !== "string") return new Date().toISOString();

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
}

/**
 * Derive a deterministic ID from the article URL.
 * URL-based deduplication remains the primary collision safeguard.
 */
function idFromUrl(url: string): string {
  let hash = 0;

  for (let i = 0; i < url.length; i++) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

/**
 * Extract the first usable image URL from common RSS/Atom fields.
 */
function extractImage(item: Record<string, unknown>): string | undefined {
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

  if (typeof image === "string") return image;

  const imageRecord = asRecord(image);
  if (typeof imageRecord?.["@_href"] === "string") {
    return imageRecord["@_href"];
  }

  return undefined;
}

/**
 * Extract RSS string categories or Atom category term attributes.
 */
function extractCategory(
  item: Record<string, unknown>,
  fallback: string
): string {
  const raw = item.category;
  if (!raw) return fallback;

  const categories = Array.isArray(raw) ? raw : [raw];

  for (const entry of categories) {
    if (typeof entry === "string" && entry.trim()) {
      return entry.trim();
    }

    const categoryRecord = asRecord(entry);
    const term = categoryRecord?.["@_term"];

    if (typeof term === "string" && term.trim()) {
      return term.trim();
    }
  }

  return fallback;
}

/**
 * Extract RSS text links and Atom link href attributes.
 * Some Atom feeds provide multiple links, such as self and alternate.
 */
function extractUrl(item: Record<string, unknown>): string | undefined {
  const link = item.link;

  // RSS 2.0: <link>https://example.com/article</link>
  if (typeof link === "string") return link;

  // Atom feeds may contain an array of link elements.
  if (Array.isArray(link)) {
    for (const entry of link) {
      if (typeof entry === "string") return entry;

      const linkRecord = asRecord(entry);
      const href = linkRecord?.["@_href"];

      if (typeof href === "string") return href;
    }
  }

  // Atom feeds may contain a single link element.
  const linkRecord = asRecord(link);
  const href = linkRecord?.["@_href"];

  return typeof href === "string" ? href : undefined;
}

/**
 * Convert one RSS/Atom document into normalized NewsArticle records.
 *
 * Supports both RSS 2.0 (rss.channel.item) and Atom (feed.entry).
 * Unexpected structures return an empty array instead of failing the
 * aggregation process.
 */
function parseFeed(xml: string, source: FeedSource): NewsArticle[] {
  let doc: Record<string, unknown>;

  try {
    doc = parser.parse(xml) as Record<string, unknown>;
  } catch {
    return [];
  }

  // Narrow the nested XML structures before reading their properties.
  const rssChannel = asRecord(asRecord(doc.rss)?.channel);
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
    if (!item) continue;

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

export interface GetNewsOptions {
  /** Maximum articles returned after aggregation and deduplication. */
  limit?: number;
}

/**
 * Fetch, parse, deduplicate, and sort news from all registered sources.
 *
 * Individual source failures do not interrupt successful feeds.
 * The function throws only when every source fails.
 */
export async function getNews(
  options: GetNewsOptions = {}
): Promise<NewsArticle[]> {
  const limit = options.limit ?? 30;

  const results = await Promise.allSettled(
    SOURCES.map(async (source) => {
      const response = await fetch(source.url, {
        headers: {
          "user-agent": "CryptoTracker/1.0 (+https://example.com)",
          accept:
            "application/rss+xml, application/atom+xml, application/xml, text/xml",
        },
        next: { revalidate: 300 },
      });

      if (!response.ok) {
        throw new Error(`${source.name} responded ${response.status}`);
      }

      const xml = await response.text();

      return parseFeed(xml, source);
    })
  );

  const failures = results.filter(
    (result) => result.status === "rejected"
  );

  if (failures.length === results.length) {
    throw new Error("All news sources failed");
  }

  // Preserve partial results while recording failed sources for observability.
  for (const failure of failures) {
    if (failure.status === "rejected") {
      console.warn(`[news] source failed: ${failure.reason}`);
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
