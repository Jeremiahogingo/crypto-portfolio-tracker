"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import RegionalSettings from "@/components/settings/RegionalSettings";
import ProfileSettings from "@/components/settings/ProfileSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import { defaultSettings } from "@/mock/settings";

const TABS = [
  { id: "appearance", label: "Appearance" },
  { id: "notifications", label: "Notifications" },
  { id: "regional", label: "Currency & Language" },
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
];

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("appearance");
  const [settings, setSettings] = useState(defaultSettings);

  // Sync theme toggle with our global ThemeContext
  useEffect(() => {
    if (settings.appearance.theme !== theme) {
      toggleTheme();
    }
  }, [settings.appearance.theme]);

  const updateAppearance = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, [key]: value },
    }));
  };

  const updateNotification = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const updateRegional = (key: "currency" | "language", value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateProfile = (profile: typeof defaultSettings.profile) => {
    setSettings((prev) => ({ ...prev, profile }));
  };

  const updateSecurity = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      security: { ...prev.security, [key]: value },
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar Tabs */}
        <aside className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary/20 text-primary"
                  : "text-secondary hover:bg-surface hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Settings Content */}
        <div className="space-y-6">
          {activeTab === "appearance" && (
            <AppearanceSettings
              settings={settings.appearance}
              onChange={updateAppearance}
            />
          )}
          {activeTab === "notifications" && (
            <NotificationSettings
              settings={settings.notifications}
              onChange={updateNotification}
            />
          )}
          {activeTab === "regional" && (
            <RegionalSettings
              currency={settings.currency}
              language={settings.language}
              onChange={updateRegional}
            />
          )}
          {activeTab === "profile" && (
            <ProfileSettings
              profile={settings.profile}
              onChange={updateProfile}
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
    </div>
  );
}