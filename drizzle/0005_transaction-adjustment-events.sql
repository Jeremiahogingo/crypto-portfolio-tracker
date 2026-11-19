ALTER TABLE "transactions" ADD COLUMN "ledger_sequence" serial NOT NULL;--> statement-breakpoint
CREATE INDEX "transactions_ledger_replay_idx" ON "transactions" USING btree ("portfolio_id","coin_id","user_id","executed_at","ledger_sequence");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_ledger_sequence_unique" UNIQUE("ledger_sequence");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_type_check" CHECK ("transactions"."type" IN ('buy', 'sell', 'adjustment'));--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_quantity_check" CHECK ("transactions"."quantity" > 0 OR ("transactions"."type" = 'adjustment' AND "transactions"."quantity" = 0));--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_nonnegative_values_check" CHECK ("transactions"."price_per_unit" >= 0 AND "transactions"."total_value" >= 0);