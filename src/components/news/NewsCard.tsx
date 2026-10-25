// src/components/news/NewsCard.tsx
//
// News card — renders a live NewsArticle from RSS.
//
// Image handling: not every RSS item includes media. When imageUrl is
// missing we render a gradient banner with the source initial rather than
// a broken-image placeholder, so the grid stays visually consistent.
//
// External links: target="_blank" plus rel="noopener noreferrer" is
// mandatory for third-party links — it prevents the destination page from
// accessing window.opener (reverse tabnabbing).

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { NewsArticle } from "@/types/news";
import { formatRelativeTime } from "@/utils/format";

interface NewsCardProps {
  article: NewsArticle;
}

export default function NewsCard({ article }: NewsCardProps) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full"
    >
      <Card hover className="flex flex-col h-full">
        {/* Banner */}
        <div className="w-full h-32 rounded-lg overflow-hidden mb-4 bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
          {article.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-4xl font-bold text-text/60">
              {article.source.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <Badge variant="primary">{article.category}</Badge>
          <span className="text-xs text-secondary">{article.source}</span>
        </div>

        <h3 className="text-base font-semibold text-text mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>

        <p className="text-sm text-secondary line-clamp-3 mb-4">
          {article.description}
        </p>

        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-secondary truncate">
            {article.author ?? article.source}
          </span>
          <span className="text-xs text-secondary flex-shrink-0 ml-2">
            {formatRelativeTime(article.publishedAt)}
          </span>
        </div>
      </Card>
    </a>
  );
}