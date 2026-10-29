// src/utils/format.ts
//
// Presentation formatters for numbers coming from the API.
//
// These are pure functions with no dependencies — easy to unit test, easy
// to swap for a user-currency-aware version later (Phase 10 hooks this
// into the currency setting).
//
// All formatters return a string ready for direct render. They never
// return null/undefined — the UI should never have to guard against
// empty cells.

/**
 * Quantity formatter for holding sizes.
 *
 * Different from formatPrice because quantities have a wider valid range:
 * 0.0001 BTC and 5,000,000 SHIB both need clean display. Rule of thumb:
 *   • < 1        → up to 8 decimals, trimmed (crypto precision matters)
 *   • ≥ 1        → up to 4 decimals, thousands separators
 */
export function formatQuantity(quantity: number): string {
  if (!Number.isFinite(quantity)) return "—";
  if (quantity === 0) return "0";
  if (quantity < 1) {
    return quantity.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    });
  }
  return quantity.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

/**
 * Signed currency for P&L displays. Always shows + or - explicitly so the
 * direction is unambiguous even when read in monochrome (accessibility —
 * relying on green/red alone fails for colour-blind users).
 */
export function formatSignedCurrency(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : ""; // negative is included by toLocaleString
  const abs = Math.abs(value);
  const formatted =
    abs >= 1000
      ? abs.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : abs.toFixed(2);
  return `${value < 0 ? "-" : sign}$${formatted}`;
}

/**
 * Prices span many orders of magnitude — BTC at ~$80k, meme coins at
 * ~$0.00001. A fixed decimal count either truncates the top or hides
 * the bottom. This picks a sensible decimal count based on magnitude.
 */
export function formatPrice(price: number): string {
  if (!Number.isFinite(price)) return "—";
  if (price === 0) return "$0.00";
  if (price < 0.0001) return `$${price.toExponential(2)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Compact market cap / volume — "1.34T", "29.0B", "520.0M".
 * Two decimals for consistent card heights across rows.
 */
export function formatCompactCurrency(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

/**
 * Percentage with explicit sign. Positive gets "+", negative already has "-".
 * Clamped to 2 decimals — the API returns long floats like -0.4188721447.
 */
export function formatPercent(pct: number): string {
  if (!Number.isFinite(pct)) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

/**
 * Relative time from an ISO timestamp — "just now", "2m ago", "1h ago".
 * Used by the data-source badge to show freshness without a full date.
 */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diffSec = Math.floor((Date.now() - then) / 1000);
  if (diffSec < 30) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}