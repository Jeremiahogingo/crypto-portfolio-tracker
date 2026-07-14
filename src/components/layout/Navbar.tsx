"use client";

import ThemeToggle from "@/components/ui/ThemeToggle";
import { NAV_TICKERS } from "@/constants";

interface NavbarProps {
  onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
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
            {NAV_TICKERS.map((ticker) => (
              <div
                key={ticker.symbol}
                className="hidden md:flex items-center gap-1 bg-surface px-3 py-1 rounded-full border border-white/5"
              >
                <span className="text-sm font-medium text-text">
                  {ticker.symbol}
                </span>
                <span
                  className={`text-xs font-medium ${
                    ticker.positive ? "text-success" : "text-danger"
                  }`}
                >
                  {ticker.change}
                </span>
              </div>
            ))}
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