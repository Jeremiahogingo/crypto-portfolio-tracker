// src/lib/actions/alerts.ts
//
// Alert mutations — create, toggle enabled, delete.
//
// ─── Condition values ────────────────────────────────────────────────────
// The DB column is plain text with no CHECK constraint. We constrain at the
// application layer (Zod enum). If we later add "crosses above on a rolling
// window" or other conditions, this is where the boundary tightens.
//
// ─── Duplicates ──────────────────────────────────────────────────────────
// The same (coin, condition, target) can exist multiple times. Users may
// want to be reminded twice — once at the level, once at a bounce. No
// dedupe logic.
//
// ─── No "triggered" state ────────────────────────────────────────────────
// We deliberately don't have a `triggered_at` column yet. When a target is
// hit, the client renders a "Target hit" badge based on current market
// price. Actual notification dispatch (email, push) is Phase 4. Adding
// state now would require a background job to maintain it; deferring keeps
// the data model minimal.

"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { alerts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export type AlertActionResult = { success: true } | { error: string };

const CreateSchema = z.object({
  coinId: z.string().min(1),
  symbol: z.string().min(1).max(16),
  condition: z.enum(["above", "below"]),
  targetPrice: z.coerce
    .number()
    .positive("Target price must be greater than zero")
    .max(1e15, "Target price is too large"),
});

const ToggleSchema = z.object({
  alertId: z.string().uuid(),
  enabled: z.enum(["true", "false"]),
});

const DeleteSchema = z.object({
  alertId: z.string().uuid(),
});

export async function createAlert(
  formData: FormData
): Promise<AlertActionResult> {
  const session = await getCurrentUser();
  if (!session) return { error: "Not authenticated" };

  const parsed = CreateSchema.safeParse({
    coinId: formData.get("coinId"),
    symbol: formData.get("symbol"),
    condition: formData.get("condition"),
    targetPrice: formData.get("targetPrice"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await db.insert(alerts).values({
      userId: session.auth.id,
      coinId: parsed.data.coinId,
      symbol: parsed.data.symbol,
      condition: parsed.data.condition,
      targetPrice: parsed.data.targetPrice.toString(),
    });
  } catch (err) {
    console.error("[createAlert] failed", err);
    return { error: "Failed to create alert. Please try again." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function toggleAlert(
  formData: FormData
): Promise<AlertActionResult> {
  const session = await getCurrentUser();
  if (!session) return { error: "Not authenticated" };

  const parsed = ToggleSchema.safeParse({
    alertId: formData.get("alertId"),
    enabled: formData.get("enabled"),
  });
  if (!parsed.success) return { error: "Invalid input" };

  try {
    const result = await db
      .update(alerts)
      .set({ enabled: parsed.data.enabled === "true" })
      .where(
        and(
          eq(alerts.id, parsed.data.alertId),
          eq(alerts.userId, session.auth.id)
        )
      )
      .returning({ id: alerts.id });

    if (result.length === 0) {
      return { error: "Alert not found" };
    }
  } catch (err) {
    console.error("[toggleAlert] failed", err);
    return { error: "Failed to update alert. Please try again." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteAlert(
  formData: FormData
): Promise<AlertActionResult> {
  const session = await getCurrentUser();
  if (!session) return { error: "Not authenticated" };

  const parsed = DeleteSchema.safeParse({
    alertId: formData.get("alertId"),
  });
  if (!parsed.success) return { error: "Invalid alert id" };

  try {
    await db
      .delete(alerts)
      .where(
        and(
          eq(alerts.id, parsed.data.alertId),
          eq(alerts.userId, session.auth.id)
        )
      );
  } catch (err) {
    console.error("[deleteAlert] failed", err);
    return { error: "Failed to delete alert. Please try again." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}