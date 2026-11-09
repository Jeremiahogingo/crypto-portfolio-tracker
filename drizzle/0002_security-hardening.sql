-- Custom SQL migration file, put your code below! --

-- ============================================================
-- 0002: Supabase security hardening
-- ============================================================
-- Restrict client-role permissions, target RLS policies to
-- authenticated users, harden SECURITY DEFINER functions,
-- and secure default privileges for future application objects.
--
-- Existing data and ownership conditions are preserved.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Remove excessive privileges from client roles
-- ------------------------------------------------------------

REVOKE ALL PRIVILEGES ON TABLE
    public.profiles,
    public.portfolios,
    public.holdings,
    public.transactions,
    public.watchlist_items,
    public.alerts
FROM anon;

--> statement-breakpoint

REVOKE ALL PRIVILEGES ON TABLE
    public.profiles,
    public.portfolios,
    public.holdings,
    public.transactions,
    public.watchlist_items,
    public.alerts
FROM authenticated;

--> statement-breakpoint

-- ------------------------------------------------------------
-- 2. Grant only the required application permissions
-- ------------------------------------------------------------

GRANT SELECT, UPDATE
ON TABLE public.profiles
TO authenticated;

--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.portfolios
TO authenticated;

--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.holdings
TO authenticated;

--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.transactions
TO authenticated;

--> statement-breakpoint

GRANT SELECT, INSERT, DELETE
ON TABLE public.watchlist_items
TO authenticated;

--> statement-breakpoint

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.alerts
TO authenticated;

--> statement-breakpoint

-- ------------------------------------------------------------
-- 3. Restrict all ownership policies to authenticated
-- ------------------------------------------------------------

-- Profiles
ALTER POLICY profiles_select_own
ON public.profiles TO authenticated;

--> statement-breakpoint

ALTER POLICY profiles_update_own
ON public.profiles TO authenticated;

--> statement-breakpoint

-- Portfolios
ALTER POLICY portfolios_select_own
ON public.portfolios TO authenticated;

--> statement-breakpoint

ALTER POLICY portfolios_insert_own
ON public.portfolios TO authenticated;

--> statement-breakpoint

ALTER POLICY portfolios_update_own
ON public.portfolios TO authenticated;

--> statement-breakpoint

ALTER POLICY portfolios_delete_own
ON public.portfolios TO authenticated;

--> statement-breakpoint

-- Holdings
ALTER POLICY holdings_select_own
ON public.holdings TO authenticated;

--> statement-breakpoint

ALTER POLICY holdings_insert_own
ON public.holdings TO authenticated;

--> statement-breakpoint

ALTER POLICY holdings_update_own
ON public.holdings TO authenticated;

--> statement-breakpoint

ALTER POLICY holdings_delete_own
ON public.holdings TO authenticated;

--> statement-breakpoint

-- Transactions
ALTER POLICY transactions_select_own
ON public.transactions TO authenticated;

--> statement-breakpoint

ALTER POLICY transactions_insert_own
ON public.transactions TO authenticated;

--> statement-breakpoint

ALTER POLICY transactions_update_own
ON public.transactions TO authenticated;

--> statement-breakpoint

ALTER POLICY transactions_delete_own
ON public.transactions TO authenticated;

--> statement-breakpoint

-- Watchlist
ALTER POLICY watchlist_select_own
ON public.watchlist_items TO authenticated;

--> statement-breakpoint

ALTER POLICY watchlist_insert_own
ON public.watchlist_items TO authenticated;

--> statement-breakpoint

ALTER POLICY watchlist_delete_own
ON public.watchlist_items TO authenticated;

--> statement-breakpoint

-- Alerts
ALTER POLICY alerts_select_own
ON public.alerts TO authenticated;

--> statement-breakpoint

ALTER POLICY alerts_insert_own
ON public.alerts TO authenticated;

--> statement-breakpoint

ALTER POLICY alerts_update_own
ON public.alerts TO authenticated;

--> statement-breakpoint

ALTER POLICY alerts_delete_own
ON public.alerts TO authenticated;

--> statement-breakpoint

-- ------------------------------------------------------------
-- 4. Secure the Supabase Auth profile creation function
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data ->> 'full_name',
            SPLIT_PART(NEW.email, '@', 1)
        )
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$function$;

--> statement-breakpoint

-- Ensure the signup trigger exists.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

--> statement-breakpoint

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

--> statement-breakpoint

-- ------------------------------------------------------------
-- 5. Harden automatic RLS enforcement for future tables
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
    cmd record;
    tbl name;
BEGIN
    FOR cmd IN
        SELECT *
        FROM pg_catalog.pg_event_trigger_ddl_commands()
        WHERE command_tag IN (
            'CREATE TABLE',
            'CREATE TABLE AS',
            'SELECT INTO'
        )
        AND object_type IN ('table', 'partitioned table')
    LOOP
        IF cmd.schema_name = 'public' THEN
            BEGIN
                SELECT c.relname
                INTO tbl
                FROM pg_catalog.pg_class c
                WHERE c.oid = cmd.objid;

                EXECUTE format(
                    'ALTER TABLE IF EXISTS %I.%I ENABLE ROW LEVEL SECURITY',
                    cmd.schema_name,
                    tbl
                );

                RAISE LOG
                    'rls_auto_enable: enabled RLS on %',
                    cmd.object_identity;

            EXCEPTION WHEN OTHERS THEN
                RAISE LOG
                    'rls_auto_enable: failed to enable RLS on %',
                    cmd.object_identity;

                RAISE;
            END;
        ELSE
            RAISE LOG
                'rls_auto_enable: skipped %',
                cmd.object_identity;
        END IF;
    END LOOP;
END;
$function$;

--> statement-breakpoint

-- Register the event trigger.
DROP EVENT TRIGGER IF EXISTS ensure_rls;

--> statement-breakpoint

CREATE EVENT TRIGGER ensure_rls
ON ddl_command_end
WHEN TAG IN (
    'CREATE TABLE',
    'CREATE TABLE AS',
    'SELECT INTO'
)
EXECUTE FUNCTION public.rls_auto_enable();

--> statement-breakpoint

-- ------------------------------------------------------------
-- 6. Restrict direct execution of internal trigger functions
-- ------------------------------------------------------------

REVOKE EXECUTE
ON FUNCTION public.handle_new_user()
FROM PUBLIC, anon, authenticated, service_role;

--> statement-breakpoint

REVOKE EXECUTE
ON FUNCTION public.rls_auto_enable()
FROM PUBLIC, anon, authenticated, service_role;

--> statement-breakpoint

-- ------------------------------------------------------------
-- 7. Harden future-object privileges for postgres
-- ------------------------------------------------------------

-- Future public tables.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE ALL ON TABLES
FROM anon, authenticated, service_role;

--> statement-breakpoint

-- Future public sequences.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE ALL ON SEQUENCES
FROM anon, authenticated, service_role;

--> statement-breakpoint

-- Future public functions.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
REVOKE ALL ON FUNCTIONS
FROM anon, authenticated, service_role;

--> statement-breakpoint

-- Remove PostgreSQL's global default PUBLIC EXECUTE grant
-- for future functions created by postgres.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
