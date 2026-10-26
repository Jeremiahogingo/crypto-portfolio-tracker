// src/components/layout/MobileSidebar.tsx
//
// Mobile drawer sidebar. Same props as desktop Sidebar; receives user
// from DashboardShell.

"use client";

import { useEffect } from "react";
import Logo from "./Logo";
import NavItem from "./NavItem";
import LogoutButton from "@/components/auth/LogoutButton";
import { SIDEBAR_ITEMS } from "@/constants";
import type { ShellUser } from "./DashboardShell";

interface MobileSidebarProps {
  user: ShellUser;
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSidebar({
  user,
  isOpen,
  onClose,
}: MobileSidebarProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-surface transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4">
          <Logo />
          <button
            onClick={onClose}
            className="p-2 text-secondary hover:text-text"
          >
            ✕
          </button>
        </div>
        <nav className="mt-4 space-y-1 flex-1">
          {SIDEBAR_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              onClick={onClose}
            />
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium flex-shrink-0">
              {user.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text truncate">
                {user.displayName}
              </p>
              <LogoutButton className="text-xs text-secondary hover:text-text transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}