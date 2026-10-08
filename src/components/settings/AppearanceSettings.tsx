"use client";

import Card from "@/components/ui/Card";
import SettingRow from "./SettingRow";
import Toggle from "./Toggle";

interface Props {
  settings: {
    theme: "dark" | "light";
    compactMode: boolean;
    showSparklines: boolean;
  };
  onChange: (key: string, value: any) => void;
}

export default function AppearanceSettings({ settings, onChange }: Props) {
  return (
    <Card>
      <h2 className="text-base font-semibold text-text mb-4">Appearance</h2>

      <SettingRow label="Theme" description="Choose between dark and light mode.">
        <div className="flex items-center gap-2 bg-surface rounded-lg p-1 border border-white/10">
          <button
            onClick={() => onChange("theme", "dark")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              settings.theme === "dark"
                ? "bg-primary text-white"
                : "text-secondary hover:text-text"
            }`}
          >
            🌙 Dark
          </button>
          <button
            onClick={() => onChange("theme", "light")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              settings.theme === "light"
                ? "bg-primary text-white"
                : "text-secondary hover:text-text"
            }`}
          >
            ☀️ Light
          </button>
        </div>
      </SettingRow>

      <SettingRow
        label="Compact Mode"
        description="Reduce spacing for denser layouts."
      >
        <Toggle
          checked={settings.compactMode}
          onChange={(val) => onChange("compactMode", val)}
        />
      </SettingRow>

      <SettingRow
        label="Show Sparklines"
        description="Display mini trend charts on coin rows."
        borderBottom={false}
      >
        <Toggle
          checked={settings.showSparklines}
          onChange={(val) => onChange("showSparklines", val)}
        />
      </SettingRow>
    </Card>
  );
}