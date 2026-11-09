
import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  boolean,
  pgPolicy,
  index,
  unique,
  foreignKey,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

// --------------------------------------------------
// Profiles
// --------------------------------------------------

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
     * Null means the account exists but hasn't been configured.
     */
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  () => [
    pgPolicy("profiles_select_own", {
      for: "select",
      to: "authenticated",
      using: sql`auth.uid() = id`,
    }),

    pgPolicy("profiles_update_own", {
      for: "update",
      to: "authenticated",
      using: sql`auth.uid() = id`,
      withCheck: sql`auth.uid() = id`,
    }),
  ]
);

// --------------------------------------------------
// Portfolios
// --------------------------------------------------

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

    // PostgreSQL needs a unique constraint covering both referenced columns.
    // The primary key on id alone cannot serve as the target of the
    // composite foreign keys defined by holdings and transactions.
    unique("portfolios_id_user_id_unique").on(
      table.id,
      table.userId
    ),

    pgPolicy("portfolios_select_own", {
      for: "select",
      to: "authenticated",
      using: sql`auth.uid() = user_id`,
    }),

    pgPolicy("portfolios_insert_own", {
      for: "insert",
      to: "authenticated",
      withCheck: sql`auth.uid() = user_id`,
    }),

    pgPolicy("portfolios_update_own", {
      for: "update",
      to: "authenticated",
      using: sql`auth.uid() = user_id`,
      withCheck: sql`auth.uid() = user_id`,
    }),

    pgPolicy("portfolios_delete_own", {
      for: "delete",
      to: "authenticated",
      using: sql`auth.uid() = user_id`,
    }),
  ]
);

// --------------------------------------------------
// Holdings
// --------------------------------------------------

export const holdings = pgTable(
  "holdings",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Ownership is enforced through the composite foreign key below.
    portfolioId: uuid("portfolio_id").notNull(),

    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),

    coinId: text("coin_id").notNull(),
    symbol: text("symbol").notNull(),

    // Numeric precision preserves large crypto quantities and small prices.
    quantity: numeric("quantity", {
      precision: 28,
      scale: 8,
    }).notNull(),

    costBasis: numeric("cost_basis", {
      precision: 20,
      scale: 8,
    }).notNull(),

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

    // A holding must reference a portfolio owned by the same user.
    // This remains enforced even when application-level authorization
    // or database RLS is bypassed.
    foreignKey({
      columns: [table.portfolioId, table.userId],
      foreignColumns: [portfolios.id, portfolios.userId],
      name: "holdings_portfolio_user_fk",
    }).onDelete("cascade"),

    pgPolicy("holdings_select_own", {
      for: "select",
      to: "authenticated",
      using: sql`auth.uid() = user_id`,
    }),

    pgPolicy("holdings_insert_own", {
      for: "insert",
      to: "authenticated",
      withCheck: sql`auth.uid() = user_id`,
    }),

    pgPolicy("holdings_update_own", {
      for: "update",
      to: "authenticated",
      using: sql`auth.uid() = user_id`,
      withCheck: sql`auth.uid() = user_id`,
    }),

    pgPolicy("holdings_delete_own", {
      for: "delete",
      to: "authenticated",
      using: sql`auth.uid() = user_id`,
    }),
  ]
);

// --------------------------------------------------
// Transactions
// --------------------------------------------------

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Ownership is enforced through the composite foreign key below.
    portfolioId: uuid("portfolio_id").notNull(),

    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),

    coinId: text("coin_id").notNull(),
    symbol: text("symbol").notNull(),

    type: text("type").notNull(), // "buy" | "sell"

    quantity: numeric("quantity", {
      precision: 28,
      scale: 8,
    }).notNull(),

    pricePerUnit: numeric("price_per_unit", {
      precision: 20,
      scale: 8,
    }).notNull(),

    totalValue: numeric("total_value", {
      precision: 20,
      scale: 8,
    }).notNull(),

    executedAt: timestamp("executed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    notes: text("notes"),
  },
  (table) => [
    index("transactions_portfolio_id_idx").on(table.portfolioId),
    index("transactions_user_id_idx").on(table.userId),
    index("transactions_executed_at_idx").on(table.executedAt),

    // A transaction must reference a portfolio owned by the same user.
    foreignKey({
      columns: [table.portfolioId, table.userId],
      foreignColumns: [portfolios.id, portfolios.userId],
      name: "transactions_portfolio_user_fk",
    }).onDelete("cascade"),

    pgPolicy("transactions_select_own", {
      for: "select",
      to: "authenticated",
      using: sql`auth.uid() = user_id`,
    }),

    pgPolicy("transactions_insert_own", {
      for: "insert",
      to: "authenticated",
      withCheck: sql`auth.uid() = user_id`,
    }),

    pgPolicy("transactions_update_own", {
      for: "update",
      to: "authenticated",
      using: sql`auth.uid() = user_id`,
      withCheck: sql`auth.uid() = user_id`,
    }),

    pgPolicy("transactions_delete_own", {
      for: "delete",
      to: "authenticated",
      using: sql`auth.uid() = user_id`,
    }),
  ]
);

// --------------------------------------------------
// Watchlist
// --------------------------------------------------

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
      to: "authenticated",
      using: sql`auth.uid() = user_id`,
    }),

    pgPolicy("watchlist_insert_own", {
      for: "insert",
      to: "authenticated",
      withCheck: sql`auth.uid() = user_id`,
    }),

    pgPolicy("watchlist_delete_own", {
      for: "delete",
      to: "authenticated",
      using: sql`auth.uid() = user_id`,
    }),
  ]
);

// --------------------------------------------------
// Alerts
// --------------------------------------------------

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

    targetPrice: numeric("target_price", {
      precision: 20,
      scale: 8,
    }).notNull(),

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
      to: "authenticated",
      using: sql`auth.uid() = user_id`,
    }),

    pgPolicy("alerts_insert_own", {
      for: "insert",
      to: "authenticated",
      withCheck: sql`auth.uid() = user_id`,
    }),

    pgPolicy("alerts_update_own", {
      to: "authenticated",
      for: "update",
      using: sql`auth.uid() = user_id`,
      withCheck: sql`auth.uid() = user_id`,
    }),

    pgPolicy("alerts_delete_own", {
      for: "delete",
      to: "authenticated",
      using: sql`auth.uid() = user_id`,
    }),
  ]
);

// --------------------------------------------------
// Relations
// --------------------------------------------------

export const profilesRelations = relations(profiles, () => ({}));

export const portfoliosRelations = relations(portfolios, ({ many }) => ({
  holdings: many(holdings),
  transactions: many(transactions),
}));

export const holdingsRelations = relations(holdings, ({ one }) => ({
  // Both columns participate in the portfolio relationship so Drizzle's
  // relational query model matches the database ownership constraint.
  portfolio: one(portfolios, {
    fields: [holdings.portfolioId, holdings.userId],
    references: [portfolios.id, portfolios.userId],
  }),
}));

export const transactionsRelations = relations(
  transactions,
  ({ one }) => ({
    portfolio: one(portfolios, {
      fields: [transactions.portfolioId, transactions.userId],
      references: [portfolios.id, portfolios.userId],
    }),
  })
);

// --------------------------------------------------
// Inferred TypeScript model exports
// --------------------------------------------------

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
