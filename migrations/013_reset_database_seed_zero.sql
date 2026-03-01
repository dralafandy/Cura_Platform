-- ============================================================================
-- 013_reset_database_seed_zero.sql
-- Purpose: Clear database data to start from zero (keeps table structure)
-- WARNING: Destructive. Run only in development/staging.
-- ============================================================================

BEGIN;

-- 1) Truncate all tables in public schema except migration history tables.
DO $$
DECLARE
  stmt TEXT;
BEGIN
  SELECT 'TRUNCATE TABLE ' ||
         string_agg(format('%I.%I', schemaname, tablename), ', ') ||
         ' RESTART IDENTITY CASCADE'
  INTO stmt
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT IN ('schema_migrations', 'supabase_migrations');

  IF stmt IS NOT NULL THEN
    EXECUTE stmt;
  END IF;
END
$$;

COMMIT;

SELECT 'Public schema data cleared successfully.' AS status;

-- ============================================================================
-- Optional: clear Supabase auth users (run only if you want to remove accounts)
-- ============================================================================
-- WARNING: This deletes all login accounts.
-- DELETE FROM auth.identities;
-- DELETE FROM auth.sessions;
-- DELETE FROM auth.refresh_tokens;
-- DELETE FROM auth.mfa_factors;
-- DELETE FROM auth.mfa_challenges;
-- DELETE FROM auth.mfa_amr_claims;
-- DELETE FROM auth.one_time_tokens;
-- DELETE FROM auth.flow_state;
-- DELETE FROM auth.sso_providers;
-- DELETE FROM auth.sso_domains;
-- DELETE FROM auth.users;
