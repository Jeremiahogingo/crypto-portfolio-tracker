"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItemProps {
  icon: string;
  label: string;
  href: string;
  onClick?: () => void;
}

export default function NavItem({ icon, label, href, onClick }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 group ${
        isActive
          ? "bg-primary/20 text-primary font-medium"
          : "text-secondary hover:bg-surface hover:text-text"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm">{label}</span>
      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
    </Link>
  );
}