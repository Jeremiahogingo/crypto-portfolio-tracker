"use client";

import Card from "@/components/ui/Card";
import SettingRow from "./SettingRow";
import Toggle from "./Toggle";

interface Props {
  settings: {
    priceAlerts: boolean;
    newsUpdates: boolean;
    weeklyReport: boolean;
    marketingEmails: boolean;
    pushNotifications: boolean;
  };
  onChange: (key: string, value: any) => void;
}

const rows = [
  {
    key: "priceAlerts",
    label: "Price Alerts",
    description: "Notify me when a coin reaches a target price.",
  },
  {
    key: "newsUpdates",
    label: "News Updates",
    description: "Get notified about breaking crypto news.",
  },
  {
    key: "weeklyReport",
    label: "Weekly Report",
    description: "Receive a weekly portfolio performance summary.",
  },
  {
    key: "marketingEmails",
    label: "Marketing Emails",
    description: "Receive promotional offers and product updates.",
  },
  {
    key: "pushNotifications",
    label: "Push Notifications",
    description: "Enable browser push notifications.",
  },
];

export default function NotificationSettings({ settings, onChange }: Props) {
  return (
    <Card>
      <h2 className="text-base font-semibold text-text mb-4">Notifications</h2>
      {rows.map((row, i) => (
        <SettingRow
          key={row.key}
          label={row.label}
          description={row.description}
          borderBottom={i < rows.length - 1}
        >
          <Toggle
            checked={(settings as any)[row.key]}
            onChange={(val) => onChange(row.key, val)}
          />
        </SettingRow>
      ))}
    </Card>
  );
}