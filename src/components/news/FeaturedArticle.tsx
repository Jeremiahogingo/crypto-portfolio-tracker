// src/components/news/FeaturedArticle.tsx
//
// Featured article — the most recent article from the live feed, rendered
// larger. Receives the article as a prop (page owns the fetch) so this
// component stays purely presentational and testable.

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { NewsArticle } from "@/types/news";
import { formatRelativeTime } from "@/utils/format";

interface FeaturedArticleProps {
  article: NewsArticle;
}

export default function FeaturedArticle({ article }: FeaturedArticleProps) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <Card gradientBorder hover className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="w-full h-48 md:h-full rounded-lg overflow-hidden bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center">
            {article.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-6xl font-bold text-text/60">
                {article.source.charAt(0)}
              </span>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="primary">{article.category}</Badge>
              <span className="text-xs text-secondary">Featured</span>
            </div>
            <h2 className="text-xl font-bold text-text mb-3 line-clamp-3">
              {article.title}
            </h2>
            <p className="text-sm text-secondary mb-4 line-clamp-3">
              {article.description}
            </p>
            <div className="flex items-center gap-3 text-xs text-secondary">
              <span>{article.source}</span>
              <span className="w-1 h-1 rounded-full bg-secondary" />
              <span>{article.author ?? "Staff"}</span>
              <span className="w-1 h-1 rounded-full bg-secondary" />
              <span>{formatRelativeTime(article.publishedAt)}</span>
            </div>
          </div>
        </div>
      </Card>
    </a>
  );
}