"use client";

import { useState } from "react";
import FeaturedArticle from "@/components/news/FeaturedArticle";
import NewsCard from "@/components/news/NewsCard";
import CategoryFilter from "@/components/news/CategoryFilter";
import SearchInput from "@/components/ui/SearchInput";
import EmptyState from "@/components/ui/EmptyState";
import { newsArticles, newsCategories } from "@/mock/news";

export default function NewsPage() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = newsArticles.filter((article) => {
    const matchesCategory = category === "All" || article.category === category;
    const matchesSearch =
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-text">News</h1>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search news..."
          className="w-full sm:w-72"
        />
      </div>

      {/* Featured */}
      {category === "All" && !search && <FeaturedArticle />}

      {/* Category Filter */}
      <CategoryFilter
        categories={newsCategories}
        active={category}
        onChange={setCategory}
      />

      {/* Article Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((article) => (
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
    </div>
  );
}