"use client";

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
  if (!source) return null;

  const isLive = source === "live";

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isLive ? "success" : "warning"}>
        {isLive ? "Live" : "Sample data"}
      </Badge>

      {isLive && fetchedAt && (
        <span className="text-xs text-secondary">
          {formatRelativeTime(fetchedAt)}
        </span>
      )}
    </div>
  );
}