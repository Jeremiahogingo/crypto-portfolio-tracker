"use client";

import { useActionState } from "react";

import { completeOnboarding, type ActionResult } from "@/lib/actions/profile";
import Button from "@/components/ui/Button";

interface OnboardingFormProps {
  suggestedName: string;
  email: string;
}

export default function OnboardingForm({
  suggestedName,
  email,
}: OnboardingFormProps) {
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(async (_previousState, formData) => {
    return completeOnboarding(formData);
  }, null);

  return (
    <div className="rounded-2xl border border-border bg-surface p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-white">
          CT
        </div>

        <span className="text-xl font-bold text-text">
          CryptoTracker
        </span>
      </div>

      <h1 className="mb-1 text-lg font-semibold text-text">
        Welcome aboard
      </h1>

      <p className="mb-6 text-sm text-secondary">
        Let&apos;s set up your account. This takes about 30 seconds.
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="onboarding-display-name"
            className="mb-1.5 block text-xs font-medium text-secondary"
          >
            Display name
          </label>

          <input
            id="onboarding-display-name"
            type="text"
            name="displayName"
            required
            defaultValue={suggestedName}
            minLength={2}
            maxLength={50}
            autoComplete="name"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-secondary focus:border-primary focus:outline-none"
            placeholder="How should we address you?"
          />

          <p className="mt-1 text-xs text-secondary">
            We&apos;ll show this in your dashboard.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface-muted p-4">
          <p className="text-xs font-medium text-secondary">
            Reporting currency
          </p>

          <p className="mt-1 text-base font-semibold text-text">
            USD — US Dollar
          </p>

          <p className="mt-1 text-xs leading-relaxed text-secondary">
            Market prices, portfolio valuations, and recorded transactions
            are currently represented in USD. Other display currencies are
            not supported yet.
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

        <Button
          type="submit"
          variant="primary"
          disabled={isPending}
          className="w-full"
        >
          {isPending ? "Setting up…" : "Continue to dashboard"}
        </Button>

        <p className="text-center text-xs text-secondary">
          Signed in as {email}
        </p>
      </form>
    </div>
  );
}