// src/components/layout/Navbar.tsx
//
// Top navigation bar.
// Market ticker values are nullable and response provenance is retained.

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

export default function Navbar({
  user,
  onMenuToggle,
}: NavbarProps) {
  const { coins, meta, isLoading } = useMarkets({
    ids: TICKER_IDS,
    per_page: TICKER_IDS.length,
  });

  const isFallback = meta?.source === "fallback";

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-surface/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="p-2 text-secondary hover:text-text lg:hidden"
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className="hidden items-center gap-4 sm:flex">
            <div className="relative">
              <input
                type="text"
                placeholder="Search cryptocurrencies..."
                className="w-64 rounded-lg border border-white/5 bg-surface py-2 pl-10 pr-4 text-sm text-text placeholder-secondary transition-colors focus:border-primary focus:outline-none"
              />

              <span className="absolute left-3 top-2.5 text-sm text-secondary">
                🔍
              </span>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              {isLoading &&
                [0, 1].map((index) => (
                  <Skeleton
                    key={index}
                    className="h-7 w-20 rounded-full"
                  />
                ))}

              {!isLoading &&
                coins.map((coin) => (
                  <div
                    key={coin.id}
                    title={
                      isFallback
                        ? "Indicative fallback market data"
                        : "Market data"
                    }
                    className="flex items-center gap-1 rounded-full border border-white/5 bg-surface px-3 py-1"
                  >
                    <span className="text-sm font-medium text-text">
                      {coin.symbol}
                    </span>

                    <span
                      className={`text-xs font-medium ${
                        coin.change24h === null
                          ? "text-secondary"
                          : isFallback
                            ? "text-warning"
                            : coin.change24h >= 0
                              ? "text-success"
                              : "text-danger"
                      }`}
                    >
                      {coin.change24h === null
                        ? "—"
                        : `${isFallback ? "≈ " : ""}${formatPercent(coin.change24h)}`}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <button
            className="relative p-2 text-secondary hover:text-text"
            aria-label="Notifications"
          >
            🔔
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" />
          </button>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-medium">
            {user.initials}
          </div>
        </div>
      </div>
    </header>
  );
}