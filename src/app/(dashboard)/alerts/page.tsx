// src/app/(dashboard)/alerts/page.tsx
//
// Alerts page — server wrapper.
//
// Same shape as Watchlist: fetch rows, pass to client view. The empty
// state (zero alerts) is handled by the view, not here.

import { getAlerts } from "@/lib/alerts/queries";
import AlertsView from "@/components/alerts/AlertsView";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const alerts = await getAlerts();
  return <AlertsView initialAlerts={alerts} />;
}