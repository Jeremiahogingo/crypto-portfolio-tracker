// src/components/layout/Navbar.tsx
//
// Top navigation bar. Renders on every dashboard page via DashboardShell.
//
// ─── Ticker ─────────────────────────────────────────────────────────────
// BTC and ETH prices shown in the top-right are fetched live. Because
// Navbar lives in the persistent dashboard shell, the fetch runs once per
// page load (subsequent client-side navigations reuse the cache — React
// Query's staleTime is 60s and DashboardShell doesn't remount between
// page transitions). One fetch per 60s per tab is comfortably within
// CoinGecko's rate limits.
//
// ─── Search input ───────────────────────────────────────────────────────
// Still a static input in this step. Wiring it to /markets?q=... is
// tracked for Phase 3.5c alongside the Watchlist page's search work.
// Leaving it presentational avoids a half-built search experience.

"use client";

import ThemeToggle from "@/components/ui/ThemeToggle";
import Skeleton from "@/components/ui/Skeleton";
import { useMarkets } from "@/hooks/useMarkets";
import { formatPercent } from "@/utils/format";

interface NavbarProps {
  onMenuToggle: () => void;
}

// Constrained to just the two coins we display. CoinGecko returns them
// in market-cap order (BTC then ETH) — which happens to match design.
const TICKER_IDS = ["bitcoin", "ethereum"];

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { coins, isLoading } = useMarkets({
    ids: TICKER_IDS,
    per_page: TICKER_IDS.length,
  });

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left section */}
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

            {/* Live ticker */}
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

        {/* Right section */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button className="p-2 text-secondary hover:text-text relative">
            🔔
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
          </button>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
            JO
          </div>
        </div>
      </div>
    </header>
  );
}