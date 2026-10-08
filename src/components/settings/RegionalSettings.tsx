"use client";

import Card from "@/components/ui/Card";
import SettingRow from "./SettingRow";
import { currencyOptions, languageOptions } from "@/mock/settings";

interface Props {
  currency: string;
  language: string;
  onChange: (key: "currency" | "language", value: string) => void;
}

export default function RegionalSettings({ currency, language, onChange }: Props) {
  return (
    <Card>
      <h2 className="text-base font-semibold text-text mb-4">
        Currency & Language
      </h2>

      <SettingRow
        label="Display Currency"
        description="All prices will be converted to this currency."
      >
        <select
          value={currency}
          onChange={(e) => onChange("currency", e.target.value)}
          className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
        >
          {currencyOptions.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.code} — {c.name}
            </option>
          ))}
        </select>
      </SettingRow>

      <SettingRow label="Language" description="Interface language." borderBottom={false}>
        <select
          value={language}
          onChange={(e) => onChange("language", e.target.value)}
          className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
        >
          {languageOptions.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>
      </SettingRow>
    </Card>
  );
}