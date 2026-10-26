// src/components/layout/Sidebar.tsx
//
// Desktop sidebar. Receives user from DashboardShell — no fetch, no auth
// concern here, just rendering.

"use client";

import Logo from "./Logo";
import NavItem from "./NavItem";
import LogoutButton from "@/components/auth/LogoutButton";
import { SIDEBAR_ITEMS } from "@/constants";
import type { ShellUser } from "./DashboardShell";

interface SidebarProps {
  user: ShellUser;
}

export default function Sidebar({ user }: SidebarProps) {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-surface border-r border-white/5 h-screen sticky top-0">
      <Logo />
      <nav className="flex-1 mt-6 space-y-1">
        {SIDEBAR_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
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
    </aside>
  );
}