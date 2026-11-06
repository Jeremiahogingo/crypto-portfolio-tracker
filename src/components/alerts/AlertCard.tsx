// src/components/alerts/AlertCard.tsx
//
// Renders a single price alert with live context.
//
// Receives AlertWithPrice — the DB row merged with current market data by
// the parent. That merge is done once in AlertsView rather than per-card,
// because fetching market data per card would spam CoinGecko.
//
// ─── States the card expresses ───────────────────────────────────────────
// • Paused (enabled=false)   — dimmed, muted toggle
// • Active + far from target — normal appearance
// • Active + near target     — "Near target" warning badge (within 15%)
// • Active + hit             — "Target hit" success badge
//
// "Hit" is display-only. No notifications yet (Phase 4). Showing the state
// now is honest — the user knows when their target was crossed even without
// receiving an email.
//
// ─── Toggle semantics ────────────────────────────────────────────────────
// The toggle submits a form to toggleAlert. Unlike the removal star on
// CoinCard, this IS a toggle: pausing keeps the alert so it can be resumed
// later. That distinction matters — pausing is not deleting.

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

export default function AlertCard({ alert, onDelete }: AlertCardProps) {
  const hasPrice = alert.currentPrice > 0;

  // "Hit" = current price has crossed the target.
  // "Near" = within 15% of the target on the approach side, and not hit.
  const isHit =
    hasPrice &&
    (alert.condition === "above"
      ? alert.currentPrice >= alert.targetPrice
      : alert.currentPrice <= alert.targetPrice);

  const distancePercent = hasPrice
    ? alert.condition === "above"
      ? ((alert.targetPrice - alert.currentPrice) / alert.currentPrice) * 100
      : ((alert.currentPrice - alert.targetPrice) / alert.currentPrice) * 100
    : 100;

  const isNear =
    !isHit && distancePercent > 0 && distancePercent < NEAR_THRESHOLD_PERCENT;

  const handleToggle = () => {
    const formData = new FormData();
    formData.set("alertId", alert.id);
    formData.set("enabled", String(!alert.enabled));
    void toggleAlert(formData);
  };

  return (
    <Card
      hover
      className={`flex flex-col ${!alert.enabled ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <CoinLogo src={alert.logoUrl} alt={alert.symbol} size="lg" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-text truncate">
              {alert.coinName || alert.symbol}
            </p>
            <p className="text-xs text-secondary">{alert.symbol}</p>
          </div>
        </div>
        <button
          onClick={() => onDelete(alert)}
          className="text-secondary hover:text-danger transition-colors text-sm flex-shrink-0"
          aria-label={`Delete alert for ${alert.symbol}`}
        >
          🗑
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-sm text-secondary">
          Notify when price {alert.condition === "above" ? "rises above" : "falls below"}
        </p>
        <p className="text-lg font-bold text-text">
          {formatPrice(alert.targetPrice)}
        </p>
        {hasPrice && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-secondary">
              Current: {formatPrice(alert.currentPrice)}
            </span>
            <Badge
              variant={alert.change24h >= 0 ? "success" : "danger"}
              size="sm"
            >
              {formatPercent(alert.change24h)}
            </Badge>
            {isHit && <Badge variant="success">🎯 Target hit</Badge>}
            {isNear && <Badge variant="warning">Near target</Badge>}
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-secondary">
          {alert.enabled ? "Active" : "Paused"}
        </span>
        <button
          onClick={handleToggle}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            alert.enabled ? "bg-primary" : "bg-white/10"
          }`}
          aria-label={alert.enabled ? "Pause alert" : "Resume alert"}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              alert.enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </Card>
  );
}