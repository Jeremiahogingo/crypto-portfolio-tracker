// src/components/alerts/AlertsView.tsx
//
// Client orchestrator for the Alerts page.
//
// ─── Data flow ───────────────────────────────────────────────────────────
// Server passes raw Alert[] rows. This view fetches market data for just
// the alert coinIds and merges — producing AlertWithPrice[] for the cards.
//
// ─── Why merge client-side ───────────────────────────────────────────────
// Prices refresh every 60s. Doing that server-side would mean either
// router.refresh() on a timer (bad — reloads the whole page) or fetching
// prices server-side on every render (blocks initial render on CoinGecko).
// Client-side merge with React Query is the standard pattern.
//
// ─── Sort order ──────────────────────────────────────────────────────────
// Preserves the DB order (newest first). Sorting by "closest to target"
// would be more useful but changes as prices move; newest-first is stable
// and predictable.

"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Card from "@/components/ui/Card";
import AlertCard from "./AlertCard";
import CreateAlertModal from "./CreateAlertModal";
import DeleteAlertModal from "./DeleteAlertModal";
import { useMarkets } from "@/hooks/useMarkets";
import type { Alert } from "@/db/schema";
import type { AlertWithPrice } from "@/types/alerts";

interface AlertsViewProps {
  initialAlerts: Alert[];
}

export default function AlertsView({ initialAlerts }: AlertsViewProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AlertWithPrice | null>(
    null
  );

  const coinIds = useMemo(
    () => Array.from(new Set(initialAlerts.map((a) => a.coinId))),
    [initialAlerts]
  );

  const { coins, isLoading } = useMarkets(
    { ids: coinIds, per_page: Math.max(coinIds.length, 1) },
    { enabled: coinIds.length > 0 }
  );

  const byId = useMemo(
    () => new Map(coins.map((c) => [c.id, c])),
    [coins]
  );

  const enriched: AlertWithPrice[] = useMemo(
    () =>
      initialAlerts.map((a) => {
        const market = byId.get(a.coinId);
        return {
          id: a.id,
          coinId: a.coinId,
          symbol: a.symbol,
          condition: a.condition as "above" | "below",
          targetPrice: Number(a.targetPrice),
          enabled: a.enabled,
          createdAt: a.createdAt,
          coinName: market?.name ?? a.symbol,
          logoUrl: market?.logoUrl ?? "?",
          currentPrice: market?.price ?? 0,
          change24h: market?.change24h ?? 0,
        };
      }),
    [initialAlerts, byId]
  );

  const activeCount = enriched.filter((a) => a.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Alerts</h1>
          {enriched.length > 0 && (
            <p className="text-sm text-secondary mt-1">
              {activeCount} active · {enriched.length} total
            </p>
          )}
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          + Create alert
        </Button>
      </div>

      {initialAlerts.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No alerts yet"
          description="Create your first price alert to be notified when a coin hits your target."
          actionLabel="Create alert"
          onAction={() => setCreateOpen(true)}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialAlerts.map((a) => (
            <Card key={a.id}>
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
              <Skeleton className="h-3 w-32 mb-2" />
              <Skeleton className="h-6 w-28 mb-2" />
              <Skeleton className="h-3 w-24" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enriched.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <CreateAlertModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <DeleteAlertModal
        isOpen={Boolean(deleteTarget)}
        alert={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}