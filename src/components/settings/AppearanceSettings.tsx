// src/components/settings/AppearanceSettings.tsx

"use client";

import { Moon, Sun } from "lucide-react";
import Card from "@/components/ui/Card";
import { useTheme } from "@/context/ThemeContext";

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-semibold text-text">Appearance</h2>
          <p className="mt-1 text-sm text-secondary">
            Personalize the visual appearance of CryptoTracker.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-text">Color theme</p>
            <p className="mt-1 text-xs text-secondary">
              Choose the appearance that feels most comfortable.
            </p>
          </div>

          <div role="group" aria-label="Color theme" className="grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
              className={[
                "flex items-center justify-center gap-2 rounded-xl border px-4 py-3",
                "text-sm font-medium transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-primary focus-visible:ring-offset-2",
                "focus-visible:ring-offset-background",
                theme === "light"
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-surface-muted text-secondary hover:bg-surface-elevated hover:text-text",
              ].join(" ")}
            >
              <Sun size={17} aria-hidden="true" />
              Light
            </button>

            <button
              type="button"
              aria-pressed={theme === "dark"}
              onClick={() => setTheme("dark")}
              className={[
                "flex items-center justify-center gap-2 rounded-xl border px-4 py-3",
                "text-sm font-medium transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-primary focus-visible:ring-offset-2",
                "focus-visible:ring-offset-background",
                theme === "dark"
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-surface-muted text-secondary hover:bg-surface-elevated hover:text-text",
              ].join(" ")}
            >
              <Moon size={17} aria-hidden="true" />
              Dark
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-muted p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-surface-elevated p-2 text-primary">
              {theme === "dark" ? (
                <Moon size={18} aria-hidden="true" />
              ) : (
                <Sun size={18} aria-hidden="true" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-text">
                {theme === "dark" ? "Dark appearance enabled" : "Light appearance enabled"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-secondary">
                Your preference is saved automatically and applied throughout the application.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
