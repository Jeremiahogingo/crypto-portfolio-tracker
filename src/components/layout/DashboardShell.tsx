// src/components/layout/DashboardShell.tsx
//
// Client shell — sidebar, mobile sidebar, navbar, main content.
//
// Receives the authenticated user via props from the server layout. Not
// fetched here on purpose: fetching user data in the shell would require
// client-side loading states and cause a visible flash of "empty" avatar
// before the user info arrives.

"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import MobileSidebar from "./MobileSidebar";
import Navbar from "./Navbar";

export interface ShellUser {
  email: string;
  displayName: string;
  initials: string;
}

interface DashboardShellProps {
  user: ShellUser;
  children: React.ReactNode;
}

export default function DashboardShell({
  user,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} />
      <MobileSidebar
        user={user}
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={user} onMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}