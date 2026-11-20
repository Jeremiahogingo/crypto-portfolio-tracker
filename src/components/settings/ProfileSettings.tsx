"use client";

import { useActionState, useState } from "react";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { updateProfile, type ActionResult } from "@/lib/actions/profile";

interface ProfileSettingsProps {
  initialName: string;
  email: string;
}

export default function ProfileSettings({
  initialName,
  email,
}: ProfileSettingsProps) {
  const [editing, setEditing] = useState(false);

  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(async (_previousState, formData) => {
    const result = await updateProfile(formData);

    if ("success" in result) {
      setEditing(false);
    }

    return result;
  }, null);

  const initials = initialName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-semibold text-text">
          Profile
        </h2>

        {!editing && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-2xl font-semibold text-text">
          {initials || "?"}
        </div>

        <div>
          <p className="text-sm font-medium text-text">
            {initialName}
          </p>
          <p className="text-xs text-secondary">{email}</p>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="profile-display-name"
            className="mb-2 block text-xs font-medium text-secondary"
          >
            Display name
          </label>

          <input
            id="profile-display-name"
            type="text"
            name="displayName"
            defaultValue={initialName}
            disabled={!editing}
            required
            minLength={2}
            maxLength={50}
            autoComplete="name"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="profile-email"
            className="mb-2 block text-xs font-medium text-secondary"
          >
            Email
          </label>

          <input
            id="profile-email"
            type="email"
            value={email}
            disabled
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-secondary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />

          <p className="mt-1 text-xs text-secondary">
            Email changes require a verification flow and are not yet
            available.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface-muted p-4">
          <p className="text-sm font-medium text-text">
            Reporting currency
          </p>

          <p className="mt-1 text-sm font-semibold text-text">
            USD — US Dollar
          </p>

          <p className="mt-1 text-xs leading-relaxed text-secondary">
            Portfolio values and recorded transaction amounts are
            currently represented in USD.
          </p>
        </div>

        {state && "error" in state && (
          <div
            role="alert"
            className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-xs text-danger"
          >
            {state.error}
          </div>
        )}

        {state && "success" in state && !editing && (
          <div
            role="status"
            className="rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-xs text-success"
          >
            Profile saved.
          </div>
        )}

        {editing && (
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditing(false)}
              disabled={isPending}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
            >
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}