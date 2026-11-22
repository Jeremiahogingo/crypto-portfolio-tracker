"use client";

import React from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  ariaLabel,
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <span
        aria-hidden="true"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-secondary"
      >
        🔍
      </span>

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="w-full rounded-lg border border-border bg-surface py-2 pl-10 pr-10 text-sm text-text placeholder-secondary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />

      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          title="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-secondary transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          ×
        </button>
      )}
    </div>
  );
}