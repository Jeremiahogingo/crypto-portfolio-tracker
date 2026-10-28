// src/components/settings/ProfileSettings.tsx
//
// Settings → Profile section.
//
// Reads initial values from props (passed by the Settings page, which gets
// them from the DB via getCurrentUser). Editable fields (display name,
// currency) write back via the updateProfile server action. Email is
// read-only — changing it requires Supabase's email-change flow, which
// is out of scope for this step and would be its own security-sensitive
// feature.
//
// State flow:
//   • `editing` toggles the input enable/disable state.
//   • `useActionState` returns `{success: true}` or `{error: string}` from
//     the action, which we surface inline.
//   • router.refresh() happens inside the action via revalidatePath, so
//     the parent Server Component re-renders with the new display name —
//     sidebar and navbar update too.

"use client";

import { useActionState, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { updateProfile, type ActionResult } from "@/lib/actions/profile";

interface ProfileSettingsProps {
  initialName: string;
  initialCurrency: string;
  email: string;
}

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "KES", symbol: "KSh", label: "Kenyan Shilling" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "NGN", symbol: "₦", label: "Nigerian Naira" },
];

export default function ProfileSettings({
  initialName,
  initialCurrency,
  email,
}: ProfileSettingsProps) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(async (_prev, formData) => {
    const result = await updateProfile(formData);
    if ("success" in result) setEditing(false);
    return result;
  }, null);

  const initials = initialName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-text">Profile</h2>
        {!editing && (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-semibold text-text">
          {initials || "?"}
        </div>
        <div>
          <p className="text-sm font-medium text-text">{initialName}</p>
          <p className="text-xs text-secondary">{email}</p>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-secondary mb-2">
            Display name
          </label>
          <input
            type="text"
            name="displayName"
            defaultValue={initialName}
            disabled={!editing}
            required
            minLength={2}
            maxLength={50}
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-secondary mb-2">
            Display currency
          </label>
          <select
            name="currency"
            defaultValue={initialCurrency}
            disabled={!editing}
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code} — {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-secondary mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-secondary focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-secondary mt-1">
            Email change requires a verification flow and is not yet available.
          </p>
        </div>

        {state && "error" in state && (
          <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            {state.error}
          </div>
        )}
        {state && "success" in state && !editing && (
          <div className="text-xs text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">
            Profile saved.
          </div>
        )}

        {editing && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditing(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}