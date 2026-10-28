// src/db/schema.ts
//
// Database schema for CryptoTracker.
//
// ─── Ownership model ─────────────────────────────────────────────────────
// Every user-owned row carries a `user_id` column referencing auth.users.
// This is the linchpin of Row Level Security: policies check
// `auth.uid() = user_id`, so a user can only see and modify their own data.
//
// ─── Why Drizzle ─────────────────────────────────────────────────────────
// Schema changes go through git. A PR that alters a column or tightens an
// RLS policy shows up as a diff. That's the whole point — policies written
// in the Supabase Dashboard are invisible to review and can't be rolled back
// with the rest of the code.
//
// ─── RLS ─────────────────────────────────────────────────────────────────
// Policies are defined inline with pgPolicy. They apply when the table is
// queried through Supabase's client (the `authenticated` role). Direct
// Drizzle connections as the `postgres` role bypass RLS — see the header
// comment in src/lib/db/index.ts for how we handle that.

import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  boolean,
  integer,
  pgPolicy,
  index,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

// ─── Profiles ────────────────────────────────────────────────────────────
// One row per authenticated user. Created automatically by a Postgres
// trigger on auth.users (see the SQL migration in 2.2.4). Stores display
// preferences that don't belong in auth.users.

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    currency: text("currency").notNull().default("USD"),

    /**
     * Set when the user finishes first-run onboarding.
     * Null means "account exists but hasn't been configured."
     * The dashboard layout redirects to /onboarding until this is set.
     */
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    pgPolicy("profiles_select_own", {
      for: "select",
      using: sql`auth.uid() = id`,
    }),
    pgPolicy("profiles_update_own", {
      for: "update",
      using: sql`auth.uid() = id`,
      withCheck: sql`auth.uid() = id`,
    }),
  ]
);

// ─── Portfolios ──────────────────────────────────────────────────────────
// A user may have multiple portfolios (e.g. "Main", "Long-term", "Tax 2026").
// Each portfolio groups holdings and transactions. If we ever want to
// simplify to one portfolio per user, this table can collapse — but keeping
// it now costs nothing and avoids a painful migration later.

export const portfolios = pgTable(
  "portfolios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("portfolios_user_id_idx").on(table.userId),
    // Full CRUD scoped to the owner. INSERT needs withCheck; UPDATE needs
    // both using (which rows can be updated) and withCheck (what the result
    // must satisfy). Getting one wrong is a subtle privilege-escalation bug.
    pgPolicy("portfolios_select_own", {
      for: "select",
      using: sql`auth.uid() = user_id`,
    }),
    pgPolicy("portfolios_insert_own", {
      for: "insert",
      withCheck: sql`auth.uid() = user_id`,
    }),
    pgPolicy("portfolios_update_own", {
      for: "update",
      using: sql`auth.uid() = user_id`,
      withCheck: sql`auth.uid() = user_id`,
    }),
    pgPolicy("portfolios_delete_own", {
      for: "delete",
      using: sql`auth.uid() = user_id`,
    }),
  ]
);

// ─── Holdings ────────────────────────────────────────────────────────────
// Current position in a coin within a portfolio. One row per (portfolio, coin).
// `quantity` uses numeric(28, 8) because some coins (SHIB, PEPE) have very
// large quantities and tiny unit prices; float would lose precision.
//
// `costBasis` stores the average purchase price in USD. This lets the UI
// compute unrealised P&L without joining the full transaction history.

export const holdings = pgTable(
  "holdings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portfolioId: uuid("portfolio_id")
      .notNull()
      .references(() => portfolios.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    coinId: text("coin_id").notNull(), // CoinGecko id, e.g. "bitcoin"
    symbol: text("symbol").notNull(), // "BTC" — denormalised for convenience
    quantity: numeric("quantity", { precision: 28, scale: 8 }).notNull(),
    costBasis: numeric("cost_basis", { precision: 20, scale: 8 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("holdings_portfolio_id_idx").on(table.portfolioId),
    index("holdings_user_id_idx").on(table.userId),
    // Every policy includes both user_id and portfolio ownership checks —
    // defence in depth. If a bug ever lets a foreign portfolio id leak into
    // a query, the user_id clause still blocks access.
    pgPolicy("holdings_select_own", {
      for: "select",
      using: sql`auth.uid() = user_id`,
    }),
    pgPolicy("holdings_insert_own", {
      for: "insert",
      withCheck: sql`auth.uid() = user_id`,
    }),
    pgPolicy("holdings_update_own", {
      for: "update",
      using: sql`auth.uid() = user_id`,
      withCheck: sql`auth.uid() = user_id`,
    }),
    pgPolicy("holdings_delete_own", {
      for: "delete",
      using: sql`auth.uid() = user_id`,
    }),
  ]
);

// ─── Transactions ────────────────────────────────────────────────────────
// Immutable ledger of buys and sells. Each transaction belongs to a portfolio
// and a coin. Holdings are derived from transactions when we need precision;
// the `holdings` table is a denormalised cache for fast reads.
//
// `type` is text with a CHECK constraint rather than a Postgres enum —
// enums are painful to alter (ALTER TYPE ADD VALUE is transactional in
// Postgres 12+, but renames/removals are not). A check constraint is easy
// to migrate and just as safe.

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portfolioId: uuid("portfolio_id")
      .notNull()
      .references(() => portfolios.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    coinId: text("coin_id").notNull(),
    symbol: text("symbol").notNull(),
    type: text("type").notNull(), // "buy" | "sell"
    quantity: numeric("quantity", { precision: 28, scale: 8 }).notNull(),
    pricePerUnit: numeric("price_per_unit", { precision: 20, scale: 8 }).notNull(),
    totalValue: numeric("total_value", { precision: 20, scale: 8 }).notNull(),
    executedAt: timestamp("executed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    notes: text("notes"),
  },
  (table) => [
    index("transactions_portfolio_id_idx").on(table.portfolioId),
    index("transactions_user_id_idx").on(table.userId),
    index("transactions_executed_at_idx").on(table.executedAt),
    pgPolicy("transactions_select_own", {
      for: "select",
      using: sql`auth.uid() = user_id`,
    }),
    pgPolicy("transactions_insert_own", {
      for: "insert",
      withCheck: sql`auth.uid() = user_id`,
    }),
    pgPolicy("transactions_update_own", {
      for: "update",
      using: sql`auth.uid() = user_id`,
      withCheck: sql`auth.uid() = user_id`,
    }),
    pgPolicy("transactions_delete_own", {
      for: "delete",
      using: sql`auth.uid() = user_id`,
    }),
  ]
);

// ─── Watchlist ───────────────────────────────────────────────────────────
// A simple join table: user → coin. No portfolio relationship because a
// watchlist is about interest, not ownership. `addedAt` lets the UI sort by
// recency if desired; the default order is fine for now.

export const watchlistItems = pgTable(
  "watchlist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    coinId: text("coin_id").notNull(),
    symbol: text("symbol").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("watchlist_user_id_idx").on(table.userId),
    pgPolicy("watchlist_select_own", {
      for: "select",
      using: sql`auth.uid() = user_id`,
    }),
    pgPolicy("watchlist_insert_own", {
      for: "insert",
      withCheck: sql`auth.uid() = user_id`,
    }),
    pgPolicy("watchlist_delete_own", {
      for: "delete",
      using: sql`auth.uid() = user_id`,
    }),
  ]
);

// ─── Alerts ──────────────────────────────────────────────────────────────
// Price alerts. `condition` is "above" or "below", `targetPrice` is the
// threshold. `enabled` lets users pause an alert without deleting it.
//
// A background job (Phase 2.5) will scan enabled alerts against live prices
// and dispatch notifications. For now, the table is enough.

export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    coinId: text("coin_id").notNull(),
    symbol: text("symbol").notNull(),
    condition: text("condition").notNull(), // "above" | "below"
    targetPrice: numeric("target_price", { precision: 20, scale: 8 }).notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("alerts_user_id_idx").on(table.userId),
    index("alerts_enabled_idx").on(table.enabled),
    pgPolicy("alerts_select_own", {
      for: "select",
      using: sql`auth.uid() = user_id`,
    }),
    pgPolicy("alerts_insert_own", {
      for: "insert",
      withCheck: sql`auth.uid() = user_id`,
    }),
    pgPolicy("alerts_update_own", {
      for: "update",
      using: sql`auth.uid() = user_id`,
      withCheck: sql`auth.uid() = user_id`,
    }),
    pgPolicy("alerts_delete_own", {
      for: "delete",
      using: sql`auth.uid() = user_id`,
    }),
  ]
);

// ─── Relations (for Drizzle's relational query builder) ──────────────────
// Foreign keys constrain the database; relations() teach the query builder
// how to traverse. Without these, db.query.portfolios.findMany({ with: ... })
// fails with a type error that looks like a missing table[reference:2].

export const profilesRelations = relations(profiles, ({ one }) => ({
  // profile.id === auth user id, so this is a one-to-one with auth.users.
  // Drizzle's authUsers table is provided by drizzle-orm/supabase.
}));

export const portfoliosRelations = relations(portfolios, ({ many }) => ({
  holdings: many(holdings),
  transactions: many(transactions),
}));

export const holdingsRelations = relations(holdings, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [holdings.portfolioId],
    references: [portfolios.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [transactions.portfolioId],
    references: [portfolios.id],
  }),
}));

// ─── Type exports ────────────────────────────────────────────────────────
// InferSelectModel / InferInsertModel give you the row types for free.
// Use these everywhere instead of hand-writing interfaces.

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Portfolio = typeof portfolios.$inferSelect;
export type NewPortfolio = typeof portfolios.$inferInsert;
export type Holding = typeof holdings.$inferSelect;
export type NewHolding = typeof holdings.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type WatchlistItem = typeof watchlistItems.$inferSelect;
export type NewWatchlistItem = typeof watchlistItems.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;