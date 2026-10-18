// src/components/ui/DataSourceBadge.tsx
//
// Tiny indicator that tells the user (and you, in development) whether the
// page is showing live CoinGecko data or the local fallback. Also shows
// how stale the data is via formatRelativeTime.
//
// Rendered in page headers only. Not per-card — that would be noise.

import Badge from "./Badge";
import { formatRelativeTime } from "@/utils/format";

interface DataSourceBadgeProps {
  source: "live" | "fallback" | undefined;
  fetchedAt?: string;
}

export default function DataSourceBadge({
  source,
  fetchedAt,
}: DataSourceBadgeProps) {
  // Render nothing during initial load — the skeleton above it is the
  // loading signal. A "loading..." badge would be redundant.
  if (!source) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge variant={source === "live" ? "success" : "warning"}>
        ● {source === "live" ? "Live" : "Cached"}
      </Badge>
      {fetchedAt && (
        <span className="text-xs text-secondary">
          {formatRelativeTime(fetchedAt)}
        </span>
      )}
    </div>
  );
}