// src/components/dashboard/MarketNews.tsx
//
// Dashboard news widget — four most recent headlines, live from RSS.
//
// Owns its own fetch (limit=4) because the dashboard doesn't need the full
// 30-article feed. The smaller limit keeps the widget payload light and lets
// React Query cache it independently of the News page.

"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import { useNews } from "@/hooks/useNews";
import { formatRelativeTime } from "@/utils/format";

export default function MarketNews() {
  const { articles, isLoading } = useNews({ limit: 4 });

  if (isLoading) {
    return (
      <Card>
        <Skeleton className="h-4 w-28 mb-4" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="mb-4">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <h3 className="text-sm font-semibold text-text mb-4">Market News</h3>
      {articles.length === 0 ? (
        <p className="text-sm text-secondary py-4">No news available.</p>
      ) : (
        <div className="space-y-4">
          {articles.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block border-b border-white/5 pb-4 last:border-0 last:pb-0"
            >
              <h4 className="text-sm font-medium text-text group-hover:text-primary transition-colors line-clamp-2">
                {item.title}
              </h4>
              <p className="text-xs text-secondary mt-1 line-clamp-2">
                {item.description}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="neutral" size="sm">
                  {item.source}
                </Badge>
                <span className="w-1 h-1 rounded-full bg-secondary" />
                <span className="text-xs text-secondary">
                  {formatRelativeTime(item.publishedAt)}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}