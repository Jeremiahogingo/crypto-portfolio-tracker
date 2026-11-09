
-- Add the onboarding timestamp expected by the Drizzle schema.
-- IF NOT EXISTS accommodates environments where it was added manually.
ALTER TABLE "profiles"
ADD COLUMN IF NOT EXISTS "onboarded_at" timestamp with time zone;

--> statement-breakpoint

-- Create the referenced composite unique key before adding child foreign keys.
ALTER TABLE "portfolios"
ADD CONSTRAINT "portfolios_id_user_id_unique"
UNIQUE ("id", "user_id");

--> statement-breakpoint

-- Remove the previous single-column portfolio relationships.
ALTER TABLE "holdings"
DROP CONSTRAINT "holdings_portfolio_id_portfolios_id_fk";

--> statement-breakpoint

ALTER TABLE "transactions"
DROP CONSTRAINT "transactions_portfolio_id_portfolios_id_fk";

--> statement-breakpoint

-- A holding must reference a portfolio owned by the same user.
ALTER TABLE "holdings"
ADD CONSTRAINT "holdings_portfolio_user_fk"
FOREIGN KEY ("portfolio_id", "user_id")
REFERENCES "public"."portfolios" ("id", "user_id")
ON DELETE CASCADE
ON UPDATE NO ACTION;

--> statement-breakpoint

-- A transaction must reference a portfolio owned by the same user.
ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_portfolio_user_fk"
FOREIGN KEY ("portfolio_id", "user_id")
REFERENCES "public"."portfolios" ("id", "user_id")
ON DELETE CASCADE
ON UPDATE NO ACTION;
