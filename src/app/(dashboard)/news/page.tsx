// src/app/(dashboard)/news/page.tsx
//
// News page — live RSS aggregation with category filter and search.
//
// ─── Categories ─────────────────────────────────────────────────────────
// Categories are derived from the article set at runtime rather than
// hardcoded. RSS feeds have inconsistent category taxonomies; a fixed list
// would either hide real categories or show empty filters. The "All" option
// is always prepended.
//
// ─── Search ─────────────────────────────────────────────────────────────
// Search filters on title + description + source. A 200 ms debounce keeps
// filtering cheap as the list grows and avoids a re-render on every keypress.
//
// ─── Featured article ───────────────────────────────────────────────────
// The first article (most recent after sorting) is promoted to the featured
// card, but only when the user is on "All" with no active search — otherwise
// it would duplicate one of the grid cards.

"use client";

import { useMemo, useState, useEffect } from "react";
import FeaturedArticle from "@/components/news/FeaturedArticle";
import NewsCard from "@/components/news/NewsCard";
import CategoryFilter from "@/components/news/CategoryFilter";
import SearchInput from "@/components/ui/SearchInput";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Card from "@/components/ui/Card";
import DataSourceBadge from "@/components/ui/DataSourceBadge";
import { useNews } from "@/hooks/useNews";

const PAGE_LIMIT = 30;

export default function NewsPage() {
  const { articles, meta, isLoading } = useNews({ limit: PAGE_LIMIT });

  const [category, setCategory] = useState("All");
  const [rawSearch, setRawSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // 200ms debounce: fast enough to feel instant, slow enough to avoid
  // filtering the full list on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(rawSearch), 200);
    return () => clearTimeout(t);
  }, [rawSearch]);

  // Derive categories from live data. Sorted for stable UI across refreshes.
  const categories = useMemo(() => {
    const set = new Set(articles.map((a) => a.category).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [articles]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return articles.filter((a) => {
      const matchesCategory = category === "All" || a.category === category;
      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [articles, category, debouncedSearch]);

  const showFeatured =
    !isLoading && category === "All" && !debouncedSearch && filtered.length > 0;

  const featured = showFeatured ? filtered[0] : null;
  const gridArticles = showFeatured ? filtered.slice(1) : filtered;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text">News</h1>
          <DataSourceBadge source={meta?.source} fetchedAt={meta?.fetchedAt} />
        </div>
        <SearchInput
          value={rawSearch}
          onChange={setRawSearch}
          placeholder="Search news..."
          className="w-full sm:w-72"
        />
      </div>

      {isLoading && (
        <>
          <Card>
            <Skeleton className="h-48 w-full" />
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </Card>
            ))}
          </div>
        </>
      )}

      {!isLoading && (
        <>
          {featured && <FeaturedArticle article={featured} />}

          <CategoryFilter
            categories={categories}
            active={category}
            onChange={setCategory}
          />

          {gridArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gridArticles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="📰"
              title="No articles found"
              description="Try adjusting your category filter or search query."
            />
          )}
        </>
      )}
    </div>
  );
}