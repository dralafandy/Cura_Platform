-- ============================================================================
-- 030_rollback_branch_level_rls_session_scope.sql
-- Purpose:
-- Roll back migration 029 branch-level session RLS changes.
-- ============================================================================

BEGIN;

DROP VIEW IF EXISTS public.current_branch_appointments;
DROP VIEW IF EXISTS public.current_branch_patients;
DROP VIEW IF EXISTS public.current_branch_user_clinics_view;

DO $$
DECLARE
  t RECORD;
  p RECORD;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    FOR p IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = t.tablename
        AND (
          policyname LIKE '%_branch_scope_select'
          OR policyname LIKE '%_branch_scope_insert'
          OR policyname LIKE '%_branch_scope_update'
          OR policyname LIKE '%_branch_scope_delete'
        )
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t.tablename);
    END LOOP;
  END LOOP;
END
$$;

DROP FUNCTION IF EXISTS public.apply_branch_scope_rls(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.resolve_user_default_branch(UUID, UUID);
DROP FUNCTION IF EXISTS public.clear_current_branch();
DROP FUNCTION IF EXISTS public.set_current_branch(UUID);
DROP FUNCTION IF EXISTS public.current_session_clinic_id();
DROP FUNCTION IF EXISTS public.current_session_branch_id();

DROP INDEX IF EXISTS public.idx_user_profiles_active_branch_id;
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS active_branch_id;

COMMIT;
