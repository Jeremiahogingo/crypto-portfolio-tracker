"use client";

import { useState } from "react";
import AlertCard from "@/components/alerts/AlertCard";
import CreateAlertModal from "@/components/alerts/CreateAlertModal";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { initialAlerts, type Alert } from "@/mock/alerts";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [modalOpen, setModalOpen] = useState(false);

  const handleToggle = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const handleDelete = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCreate = (alert: Alert) => {
    setAlerts((prev) => [alert, ...prev]);
  };

  const activeCount = alerts.filter((a) => a.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Alerts</h1>
          <p className="text-sm text-secondary mt-1">
            {activeCount} active · {alerts.length} total
          </p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          + Create Alert
        </Button>
      </div>

      {alerts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🔔"
          title="No alerts yet"
          description="Create your first price alert to be notified when a coin hits your target."
          actionLabel="Create Alert"
          onAction={() => setModalOpen(true)}
        />
      )}

      <CreateAlertModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}