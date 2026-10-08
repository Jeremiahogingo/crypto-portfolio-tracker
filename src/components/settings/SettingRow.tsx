import React from "react";

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  borderBottom?: boolean;
}

export default function SettingRow({
  label,
  description,
  children,
  borderBottom = true,
}: SettingRowProps) {
  return (
    <div
      className={`flex items-center justify-between py-4 ${
        borderBottom ? "border-b border-white/5" : ""
      }`}
    >
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-text">{label}</p>
        {description && (
          <p className="text-xs text-secondary mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}