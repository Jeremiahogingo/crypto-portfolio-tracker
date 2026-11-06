// src/lib/alerts/queries.ts
//
// Server-side alert queries.
//
// Returns raw Alert[] rows. The client merges with market data to produce
// AlertWithPrice[] — the server doesn't need to know about prices.

import { cache } from "react";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { alerts, type Alert } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/**
 * All alerts for the current user, newest first.
 *
 * No limit applied — alerts are user-created and users have a natural cap
 * on how many coins they want to track (tens, not thousands). If that
 * assumption ever breaks, add .limit() here.
 */
export const getAlerts = cache(async (): Promise<Alert[]> => {
  const session = await getCurrentUser();
  if (!session) return [];

  return db
    .select()
    .from(alerts)
    .where(eq(alerts.userId, session.auth.id))
    .orderBy(desc(alerts.createdAt));
});