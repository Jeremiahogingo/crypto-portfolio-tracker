// src/types/news.ts
//
// Domain types for news articles.
//
// These are source-agnostic: whether an article came from CoinDesk's RSS,
// Cointelegraph's RSS, or a future JSON API, the UI only ever sees this
// shape. Adding or removing a source requires no changes to components.

export interface NewsArticle {
  /** Stable unique id derived from the article URL. */
  id: string;

  title: string;
  /** Plain-text summary. RSS descriptions often contain HTML — we strip it. */
  description: string;
  /** Original article URL — used as the "Read more" target. */
  url: string;

  /** Publisher name, e.g. "CoinDesk". */
  source: string;
  /** ISO 8601 timestamp, normalised from RSS pubDate or Atom updated. */
  publishedAt: string;

  /** Hero image URL if the feed provides one; undefined otherwise. */
  imageUrl?: string;

  /**
   * Primary category, inferred from RSS categories or defaulted to "General".
   * The News page filters on this field.
   */
  category: string;

  /** Optional author byline. Not all feeds provide this. */
  author?: string;
}