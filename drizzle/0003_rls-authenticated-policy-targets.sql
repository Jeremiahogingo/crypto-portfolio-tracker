ALTER POLICY "alerts_select_own" ON "alerts" TO authenticated USING (auth.uid() = user_id);--> statement-breakpoint
ALTER POLICY "alerts_insert_own" ON "alerts" TO authenticated WITH CHECK (auth.uid() = user_id);--> statement-breakpoint
ALTER POLICY "alerts_update_own" ON "alerts" TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);--> statement-breakpoint
ALTER POLICY "alerts_delete_own" ON "alerts" TO authenticated USING (auth.uid() = user_id);--> statement-breakpoint
ALTER POLICY "holdings_select_own" ON "holdings" TO authenticated USING (auth.uid() = user_id);--> statement-breakpoint
ALTER POLICY "holdings_insert_own" ON "holdings" TO authenticated WITH CHECK (auth.uid() = user_id);--> statement-breakpoint
ALTER POLICY "holdings_update_own" ON "holdings" TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);--> statement-breakpoint
ALTER POLICY "holdings_delete_own" ON "holdings" TO authenticated USING (auth.uid() = user_id);--> statement-breakpoint
ALTER POLICY "portfolios_select_own" ON "portfolios" TO authenticated USING (auth.uid() = user_id);--> statement-breakpoint
ALTER POLICY "portfolios_insert_own" ON "portfolios" TO authenticated WITH CHECK (auth.uid() = user_id);--> statement-breakpoint
ALTER POLICY "portfolios_update_own" ON "portfolios" TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);--> statement-breakpoint
ALTER POLICY "portfolios_delete_own" ON "portfolios" TO authenticated USING (auth.uid() = user_id);--> statement-breakpoint
ALTER POLICY "profiles_select_own" ON "profiles" TO authenticated USING (auth.uid() = id);--> statement-breakpoint
ALTER POLICY "profiles_update_own" ON "profiles" TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);--> statement-breakpoint
ALTER POLICY "transactions_select_own" ON "transactions" TO authenticated USING (auth.uid() = user_id);--> statement-breakpoint
ALTER POLICY "transactions_insert_own" ON "transactions" TO authenticated WITH CHECK (auth.uid() = user_id);--> statement-breakpoint
ALTER POLICY "transactions_update_own" ON "transactions" TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);--> statement-breakpoint
ALTER POLICY "transactions_delete_own" ON "transactions" TO authenticated USING (auth.uid() = user_id);--> statement-breakpoint
ALTER POLICY "watchlist_select_own" ON "watchlist_items" TO authenticated USING (auth.uid() = user_id);--> statement-breakpoint
ALTER POLICY "watchlist_insert_own" ON "watchlist_items" TO authenticated WITH CHECK (auth.uid() = user_id);--> statement-breakpoint
ALTER POLICY "watchlist_delete_own" ON "watchlist_items" TO authenticated USING (auth.uid() = user_id);