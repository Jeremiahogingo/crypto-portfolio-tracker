// src/components/alerts/AlertsView.tsx
//
// Merges stored alerts with current market data.
//
// A missing quote remains unavailable. A fallback quote is marked
// indicative and is never treated as a verified live price.

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
import type { PriceStatus } from "@/types/valuation";

interface AlertsViewProps {
  initialAlerts: Alert[];
}

export default function AlertsView({
  initialAlerts,
}: AlertsViewProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<AlertWithPrice | null>(null);

  const coinIds = useMemo(
    () => Array.from(new Set(initialAlerts.map((alert) => alert.coinId))),
    [initialAlerts]
  );

  const {
    coins,
    meta,
    isLoading,
  } = useMarkets(
    {
      ids: coinIds,
      per_page: Math.max(coinIds.length, 1),
    },
    {
      enabled: coinIds.length > 0,
    }
  );

  const byId = useMemo(
    () => new Map(coins.map((coin) => [coin.id, coin])),
    [coins]
  );

  const enriched: AlertWithPrice[] = useMemo(
    () =>
      initialAlerts.map((alert) => {
        const market = byId.get(alert.coinId);

        const currentPrice =
          market?.price !== null && market?.price !== undefined
            ? market.price
            : null;

        const priceStatus: PriceStatus =
          currentPrice === null
            ? "unavailable"
            : meta?.source === "live"
              ? "live"
              : "fallback";

        // Only a live response supplies a verified 24-hour movement.
        const change24h =
          priceStatus === "live"
            ? market?.change24h ?? null
            : null;

        return {
          id: alert.id,
          coinId: alert.coinId,
          symbol: alert.symbol,
          condition: alert.condition as "above" | "below",
          targetPrice: Number(alert.targetPrice),
          enabled: alert.enabled,
          createdAt: alert.createdAt,
          coinName: market?.name ?? alert.symbol,
          logoUrl: market?.logoUrl ?? "?",
          currentPrice,
          change24h,
          priceStatus,
        };
      }),
    [initialAlerts, byId, meta?.source]
  );

  const activeCount = enriched.filter(
    (alert) => alert.enabled
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">
            Alerts
          </h1>

          {enriched.length > 0 && (
            <p className="mt-1 text-sm text-secondary">
              {activeCount} active · {enriched.length} total
            </p>
          )}
        </div>

        <Button
          variant="primary"
          onClick={() => setCreateOpen(true)}
        >
          + Create alert
        </Button>
      </div>

      {initialAlerts.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No alerts yet"
          description="Create your first price alert to track when a verified live price crosses your target."
          actionLabel="Create alert"
          onAction={() => setCreateOpen(true)}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initialAlerts.map((alert) => (
            <Card key={alert.id}>
              <div className="mb-4 flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="mb-1 h-4 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>

              <Skeleton className="mb-2 h-3 w-32" />
              <Skeleton className="mb-2 h-6 w-28" />
              <Skeleton className="h-3 w-24" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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