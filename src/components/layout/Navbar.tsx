// src/components/layout/Navbar.tsx
//
// Top navigation bar. Accepts the user prop from DashboardShell so the
// avatar reflects the authenticated account.
//
// Ticker logic unchanged from Phase 3.

"use client";

import ThemeToggle from "@/components/ui/ThemeToggle";
import Skeleton from "@/components/ui/Skeleton";
import { useMarkets } from "@/hooks/useMarkets";
import { formatPercent } from "@/utils/format";
import type { ShellUser } from "./DashboardShell";

interface NavbarProps {
  user: ShellUser;
  onMenuToggle: () => void;
}

const TICKER_IDS = ["bitcoin", "ethereum"];

export default function Navbar({ user, onMenuToggle }: NavbarProps) {
  const { coins, isLoading } = useMarkets({
    ids: TICKER_IDS,
    per_page: TICKER_IDS.length,
  });

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="p-2 lg:hidden text-secondary hover:text-text"
            aria-label="Open menu"
          >
            ☰
          </button>
          <div className="hidden sm:flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search cryptocurrencies..."
                className="w-64 bg-surface border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm text-text placeholder-secondary focus:outline-none focus:border-primary transition-colors"
              />
              <span className="absolute left-3 top-2.5 text-secondary text-sm">
                🔍
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2">
              {isLoading &&
                [0, 1].map((i) => (
                  <Skeleton key={i} className="h-7 w-20 rounded-full" />
                ))}

              {!isLoading &&
                coins.map((coin) => (
                  <div
                    key={coin.id}
                    className="flex items-center gap-1 bg-surface px-3 py-1 rounded-full border border-white/5"
                  >
                    <span className="text-sm font-medium text-text">
                      {coin.symbol}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        coin.change24h >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {formatPercent(coin.change24h)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button className="p-2 text-secondary hover:text-text relative">
            🔔
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
          </button>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
            {user.initials}
          </div>
        </div>
      </div>
    </header>
  );
}