// src/components/onboarding/OnboardingForm.tsx
//
// Onboarding form — display name + display currency.
//
// Deliberately minimal: two fields and a single button. Every additional
// step in onboarding is a drop-off point. The default portfolio is created
// server-side in completeOnboarding — the user doesn't need to know about it.
//
// Uses React 19's useActionState for progressive enhancement: the form
// submits and works even before hydration, which is what makes
// Server Actions feel instant. The action returns ActionResult; we surface
// errors inline.

"use client";

import { useActionState } from "react";
import { completeOnboarding, type ActionResult } from "@/lib/actions/profile";
import Button from "@/components/ui/Button";

interface OnboardingFormProps {
  suggestedName: string;
  suggestedCurrency: string;
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

export default function OnboardingForm({
  suggestedName,
  suggestedCurrency,
  email,
}: OnboardingFormProps) {
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(async (_prev, formData) => completeOnboarding(formData), null);

  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
          CT
        </div>
        <span className="text-xl font-bold text-text">CryptoTracker</span>
      </div>

      <h1 className="text-lg font-semibold text-text mb-1">Welcome aboard</h1>
      <p className="text-sm text-secondary mb-6">
        Let&apos;s set up your account. This takes about 30 seconds.
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">
            Display name
          </label>
          <input
            type="text"
            name="displayName"
            required
            defaultValue={suggestedName}
            minLength={2}
            maxLength={50}
            autoComplete="name"
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text placeholder-secondary focus:outline-none focus:border-primary"
            placeholder="How should we address you?"
          />
          <p className="text-xs text-secondary mt-1">
            We&apos;ll show this in your dashboard and emails.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-secondary mb-1.5">
            Display currency
          </label>
          <select
            name="currency"
            defaultValue={suggestedCurrency}
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code} — {c.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-secondary mt-1">
            All prices will be displayed in this currency. You can change it
            anytime in Settings.
          </p>
        </div>

        {state && "error" in state && (
          <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
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

        <p className="text-xs text-secondary text-center">
          Signed in as {email}
        </p>
      </form>
    </div>
  );
}