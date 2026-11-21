"use client";

import { useState } from "react";

import AppearanceSettings from "@/components/settings/AppearanceSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import RegionalSettings from "@/components/settings/RegionalSettings";
import ProfileSettings from "@/components/settings/ProfileSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import { defaultSettings } from "@/mock/settings";

interface SettingsTabsProps {
  profile: {
    name: string;
    email: string;
  };
}

type NotificationSettingsState = {
  priceAlerts: boolean;
  newsUpdates: boolean;
  weeklyReport: boolean;
  marketingEmails: boolean;
  pushNotifications: boolean;
};

type SecuritySettingsState = {
  twoFactor: boolean;
  sessionTimeout: string;
};

interface SettingsState {
  notifications: NotificationSettingsState;
  security: SecuritySettingsState;
}

const TABS = [
  { id: "appearance", label: "Appearance" },
  { id: "notifications", label: "Notifications" },
  { id: "regional", label: "Regional" },
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
] as const;

type SettingsTabId = (typeof TABS)[number]["id"];

/**
 * Settings navigation and temporary settings state.
 *
 * ThemeContext remains the sole source of truth for appearance.
 * Notification and security preferences remain local UI state until
 * their persistence workflows are implemented.
 *
 * Regional preferences are displayed as read-only because currency
 * conversion and interface localization are not currently supported.
 */
export default function SettingsTabs({ profile }: SettingsTabsProps) {
  const [activeTab, setActiveTab] =
    useState<SettingsTabId>("appearance");

  const [settings, setSettings] = useState<SettingsState>(() => ({
    notifications: defaultSettings.notifications,
    security: defaultSettings.security,
  }));

  const updateNotification = <
    K extends keyof NotificationSettingsState,
  >(
    key: K,
    value: NotificationSettingsState[K],
  ) => {
    setSettings((previous) => ({
      ...previous,
      notifications: {
        ...previous.notifications,
        [key]: value,
      },
    }));
  };

  const updateSecurity = <K extends keyof SecuritySettingsState>(
    key: K,
    value: SecuritySettingsState[K],
  ) => {
    setSettings((previous) => ({
      ...previous,
      security: {
        ...previous.security,
        [key]: value,
      },
    }));
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={`flex-shrink-0 rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary/20 text-primary"
                : "text-secondary hover:bg-surface hover:text-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </aside>

      <div className="space-y-6">
        {activeTab === "appearance" && <AppearanceSettings />}

        {activeTab === "notifications" && (
          <NotificationSettings
            settings={settings.notifications}
            onChange={updateNotification}
          />
        )}

        {activeTab === "regional" && <RegionalSettings />}

        {activeTab === "profile" && (
          <ProfileSettings
            initialName={profile.name}
            email={profile.email}
          />
        )}

        {activeTab === "security" && (
          <SecuritySettings
            settings={settings.security}
            onChange={updateSecurity}
          />
        )}
      </div>
    </div>
  );
}