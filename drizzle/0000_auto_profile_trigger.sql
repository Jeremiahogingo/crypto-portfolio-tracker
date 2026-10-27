-- drizzle/0000_auto_profile_trigger.sql
--
-- Auto-create a profile row when a user signs up.
--
-- This is applied MANUALLY via the Supabase SQL Editor, not by drizzle-kit
-- migrate. Drizzle doesn't manage auth.users (Supabase's internal schema),
-- and triggers on that table must be created by an owner-level role — which
-- only the SQL Editor provides.
--
-- Apply once per environment:
--   1. Open Supabase Dashboard → SQL Editor → New query
--   2. Paste and run this file
--   3. Verify: select * from pg_trigger where tgname = 'on_auth_user_created';
--
-- The trigger fires on INSERT into auth.users (Supabase's internal table).
-- SECURITY DEFINER is required so the function runs as its owner (postgres),
-- which has permission to insert into public.profiles. Without it, the auth
-- system's role would be rejected by RLS.
--
-- ON CONFLICT DO NOTHING makes the trigger idempotent — a repeated signup
-- (e.g. email confirmation retry) won't fail on a duplicate profile.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();