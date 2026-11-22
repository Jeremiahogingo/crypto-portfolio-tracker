"use client";

import Badge from "./Badge";

import { formatRelativeTime } from "@/utils/format";
import type { MarketDataSource } from "@/types/market";

interface DataSourceBadgeProps {
  source?: MarketDataSource;
  fetchedAt?: string;
}

export default function DataSourceBadge({
  source,
  fetchedAt,
}: DataSourceBadgeProps) {
  if (!source) {
    return null;
  }

  const isLive = source === "live";
  const isCached = source === "cached";

  const label = isLive
    ? "Live"
    : isCached
      ? "Cached"
      : "Sample data";

  const variant = isLive
    ? "success"
    : isCached
      ? "neutral"
      : "warning";

  return (
    <div className="flex items-center gap-2">
      <Badge variant={variant}>
        {label}
      </Badge>

      {(isLive || isCached) && fetchedAt && (
        <span className="text-xs text-secondary">
          {formatRelativeTime(fetchedAt)}
        </span>
      )}
    </div>
  );
}