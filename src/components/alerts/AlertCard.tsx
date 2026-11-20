// src/components/alerts/AlertCard.tsx
//
// Renders a stored price alert with current market context.
//
// Target evaluation requires an enabled alert and a verified live quote.
// Fallback and unavailable prices cannot trigger a target status.

"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import CoinLogo from "@/components/ui/CoinLogo";
import { toggleAlert } from "@/lib/actions/alerts";
import { formatPrice, formatPercent } from "@/utils/format";
import type { AlertWithPrice } from "@/types/alerts";

interface AlertCardProps {
  alert: AlertWithPrice;
  onDelete: (alert: AlertWithPrice) => void;
}

const NEAR_THRESHOLD_PERCENT = 15;

export default function AlertCard({
  alert,
  onDelete,
}: AlertCardProps) {
  const hasQuote =
    alert.currentPrice !== null &&
    alert.priceStatus !== "unavailable";

  const hasLivePrice =
    alert.priceStatus === "live" &&
    alert.currentPrice !== null;

  // Only enabled alerts with live quotes are eligible for evaluation.
  const canEvaluate =
    alert.enabled && hasLivePrice;

  const isHit =
    canEvaluate &&
    (alert.condition === "above"
      ? alert.currentPrice! >= alert.targetPrice
      : alert.currentPrice! <= alert.targetPrice);

  let distancePercent: number | null = null;

  // Calculate distance only when division is safe.
  if (canEvaluate && alert.currentPrice! > 0) {
    distancePercent =
      alert.condition === "above"
        ? ((alert.targetPrice - alert.currentPrice!) /
            alert.currentPrice!) *
          100
        : ((alert.currentPrice! - alert.targetPrice) /
            alert.currentPrice!) *
          100;
  }

  const isNear =
    canEvaluate &&
    !isHit &&
    distancePercent !== null &&
    Number.isFinite(distancePercent) &&
    distancePercent > 0 &&
    distancePercent < NEAR_THRESHOLD_PERCENT;

  const handleToggle = () => {
    const formData = new FormData();

    formData.set("alertId", alert.id);
    formData.set("enabled", String(!alert.enabled));

    void toggleAlert(formData);
  };

  return (
    <Card
      hover
      className={`flex flex-col ${
        !alert.enabled ? "opacity-60" : ""
      }`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <CoinLogo
            src={alert.logoUrl}
            alt={alert.symbol}
            size="lg"
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text">
              {alert.coinName || alert.symbol}
            </p>
            <p className="text-xs text-secondary">
              {alert.symbol}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDelete(alert)}
          className="flex-shrink-0 text-sm text-secondary transition-colors hover:text-danger"
          aria-label={`Delete alert for ${alert.symbol}`}
        >
          🗑
        </button>
      </div>

      <div className="mb-4 space-y-2">
        <p className="text-sm text-secondary">
          Notify condition: price{" "}
          {alert.condition === "above"
            ? "rises above"
            : "falls below"}
        </p>

        <p className="text-lg font-bold text-text">
          {formatPrice(alert.targetPrice)}
        </p>

        {hasQuote ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-secondary">
              {alert.priceStatus === "fallback"
                ? `Indicative price: ≈ ${formatPrice(alert.currentPrice!)}`
                : `Current: ${formatPrice(alert.currentPrice!)}`}
            </span>

            {alert.priceStatus === "live" &&
              alert.change24h !== null && (
                <Badge
                  variant={
                    alert.change24h >= 0 ? "success" : "danger"
                  }
                  size="sm"
                >
                  {formatPercent(alert.change24h)}
                </Badge>
              )}

            {alert.priceStatus === "fallback" && (
              <Badge variant="warning" size="sm">
                Fallback data
              </Badge>
            )}

            {canEvaluate && isHit && (
              <Badge variant="success">
                🎯 Target hit
              </Badge>
            )}

            {canEvaluate && isNear && (
              <Badge variant="warning">
                Near target
              </Badge>
            )}

            {alert.priceStatus === "fallback" &&
              alert.enabled && (
                <span className="w-full text-xs text-secondary">
                  Target status unavailable until a live quote is returned.
                </span>
              )}
          </div>
        ) : (
          <p className="text-xs text-secondary">
            Current price unavailable. Target status cannot be evaluated.
          </p>
        )}

        {!alert.enabled && (
          <p className="text-xs text-secondary">
            This alert is paused. Its target is not being evaluated.
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
        <span className="text-xs text-secondary">
          {alert.enabled ? "Active" : "Paused"}
        </span>

        <button
          type="button"
          onClick={handleToggle}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            alert.enabled ? "bg-primary" : "bg-white/10"
          }`}
          aria-label={
            alert.enabled ? "Pause alert" : "Resume alert"
          }
          aria-pressed={alert.enabled}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              alert.enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </Card>
  );
}