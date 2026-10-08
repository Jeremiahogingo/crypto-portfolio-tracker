"use client";

import Card from "@/components/ui/Card";
import SettingRow from "./SettingRow";
import Toggle from "./Toggle";
import Button from "@/components/ui/Button";

interface Props {
  settings: {
    twoFactor: boolean;
    sessionTimeout: string;
  };
  onChange: (key: string, value: any) => void;
}

export default function SecuritySettings({ settings, onChange }: Props) {
  return (
    <Card>
      <h2 className="text-base font-semibold text-text mb-4">Security</h2>

      <SettingRow
        label="Two-Factor Authentication"
        description="Add an extra layer of security to your account."
      >
        <Toggle
          checked={settings.twoFactor}
          onChange={(val) => onChange("twoFactor", val)}
        />
      </SettingRow>

      <SettingRow
        label="Session Timeout"
        description="Automatically log out after inactivity."
      >
        <select
          value={settings.sessionTimeout}
          onChange={(e) => onChange("sessionTimeout", e.target.value)}
          className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
        >
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="60">1 hour</option>
          <option value="240">4 hours</option>
        </select>
      </SettingRow>

      <SettingRow
        label="Change Password"
        description="Update your account password."
        borderBottom={false}
      >
        <Button variant="secondary" size="sm">
          Change
        </Button>
      </SettingRow>

      <div className="mt-6 pt-6 border-t border-white/5">
        <h3 className="text-sm font-medium text-danger mb-2">Danger Zone</h3>
        <p className="text-xs text-secondary mb-4">
          Once you delete your account, there is no going back.
        </p>
        <Button variant="danger" size="sm">
          Delete Account
        </Button>
      </div>
    </Card>
  );
}