"use client";

import Card from "@/components/ui/Card";

export default function RegionalSettings() {
  return (
    <Card>
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-semibold text-text">
            Regional preferences
          </h2>
          <p className="mt-1 text-sm text-secondary">
            Current reporting and interface defaults.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface-muted p-4">
          <p className="text-sm font-medium text-text">
            Reporting currency
          </p>

          <p className="mt-2 text-base font-semibold text-text">
            USD — US Dollar
          </p>

          <p className="mt-1 text-xs leading-relaxed text-secondary">
            Market prices, portfolio valuations, and recorded transaction
            amounts are currently denominated in US dollars. Currency
            conversion is not supported yet.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface-muted p-4">
          <p className="text-sm font-medium text-text">
            Interface language
          </p>

          <p className="mt-2 text-base font-semibold text-text">
            English
          </p>

          <p className="mt-1 text-xs leading-relaxed text-secondary">
            The application interface is currently available in English.
            Additional interface languages are not enabled yet.
          </p>
        </div>
      </div>
    </Card>
  );
}