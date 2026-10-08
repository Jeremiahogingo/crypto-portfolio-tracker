"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Alert } from "@/mock/alerts";

interface AlertCardProps {
  alert: Alert;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function AlertCard({ alert, onToggle, onDelete }: AlertCardProps) {
  const distance =
    alert.condition === "above"
      ? ((alert.price - alert.currentPrice) / alert.currentPrice) * 100
      : ((alert.currentPrice - alert.price) / alert.currentPrice) * 100;

  const isClose = distance > 0 && distance < 15;

  return (
    <Card hover className="flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl">
            {alert.logo}
          </span>
          <div>
            <p className="text-sm font-medium text-text">{alert.coin}</p>
            <p className="text-xs text-secondary">{alert.symbol}</p>
          </div>
        </div>
        <button
          onClick={() => onDelete(alert.id)}
          className="text-secondary hover:text-danger transition-colors text-sm"
          aria-label="Delete alert"
        >
          🗑
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-sm text-secondary">Alert me when price is</p>
        <p className="text-lg font-bold text-text">
          {alert.condition === "above" ? ">" : "<"} $
          {alert.price.toLocaleString()}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-secondary">
            Current: ${alert.currentPrice.toLocaleString()}
          </span>
          {isClose && <Badge variant="warning">Near target</Badge>}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-secondary">
          {alert.enabled ? "Active" : "Paused"}
        </span>
        {/* Toggle switch */}
        <button
          onClick={() => onToggle(alert.id)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            alert.enabled ? "bg-primary" : "bg-white/10"
          }`}
          aria-label={alert.enabled ? "Disable alert" : "Enable alert"}
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