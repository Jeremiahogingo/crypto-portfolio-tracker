"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface Props {
  profile: {
    name: string;
    email: string;
    username: string;
  };
  onChange: (profile: { name: string; email: string; username: string }) => void;
}

export default function ProfileSettings({ profile, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);

  const handleSave = () => {
    onChange(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-text">Profile</h2>
        {!editing && (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-semibold text-text">
          {profile.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div>
          <p className="text-sm font-medium text-text">{profile.name}</p>
          <p className="text-xs text-secondary">@{profile.username}</p>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-secondary mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            disabled={!editing}
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-secondary mb-2">
            Username
          </label>
          <input
            type="text"
            value={draft.username}
            onChange={(e) => setDraft({ ...draft, username: e.target.value })}
            disabled={!editing}
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-secondary mb-2">
            Email
          </label>
          <input
            type="email"
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            disabled={!editing}
            className="w-full bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {editing && (
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/5 mt-6">
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      )}
    </Card>
  );
}