-- ============================================================================
-- 038_rebuild_user_clinics_view_unified.sql
-- Purpose:
-- 1) Rebuild user_clinics_view from both user_clinic_access and user_clinics.
-- 2) Match current user by auth.uid() and current_user_profile_id().
-- 3) Ensure branch rows are visible in selector reliably.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_has_uca BOOLEAN := to_regclass('public.user_clinic_access') IS NOT NULL;
  v_has_uc BOOLEAN := to_regclass('public.user_clinics') IS NOT NULL;
  v_sql TEXT := '';
BEGIN
  IF NOT v_has_uca AND NOT v_has_uc THEN
    RAISE NOTICE 'Skipped: neither user_clinic_access nor user_clinics exists.';
    RETURN;
  END IF;

  -- Drop dependent view first to avoid dependency errors when recreating user_clinics_view.
  EXECUTE 'DROP VIEW IF EXISTS public.current_branch_user_clinics_view';
  EXECUTE 'DROP VIEW IF EXISTS public.user_clinics_view';

  v_sql := 'CREATE VIEW public.user_clinics_view AS
    WITH src AS (';

  IF v_has_uca THEN
    v_sql := v_sql || '
      SELECT
        uca.id,
        uca.user_id,
        uca.clinic_id,
        uca.branch_id,
        uca.role_at_clinic::varchar AS role_at_clinic,
        COALESCE(uca.custom_permissions, ARRAY[]::text[]) AS custom_permissions,
        COALESCE(uca.is_default, false) AS is_default,
        COALESCE(uca.is_active, true) AS access_active,
        uca.created_at,
        uca.updated_at,
        uca.created_by
      FROM public.user_clinic_access uca';
  END IF;

  IF v_has_uc THEN
    IF v_has_uca THEN
      v_sql := v_sql || ' UNION ALL ';
    END IF;
    v_sql := v_sql || '
      SELECT
        uc.id,
        uc.user_id,
        uc.clinic_id,
        uc.branch_id,
        uc.role_at_clinic::varchar AS role_at_clinic,
        COALESCE(uc.custom_permissions, ARRAY[]::text[]) AS custom_permissions,
        COALESCE(uc.is_default, false) AS is_default,
        COALESCE(uc.access_active, true) AS access_active,
        uc.created_at,
        uc.updated_at,
        uc.created_by
      FROM public.user_clinics uc';
  END IF;

  v_sql := v_sql || '
    ),
    dedup AS (
      SELECT DISTINCT ON (s.user_id, s.clinic_id, s.branch_id, s.role_at_clinic)
        s.*
      FROM src s
      WHERE s.user_id = auth.uid()
         OR s.user_id = public.current_user_profile_id()
      ORDER BY
        s.user_id, s.clinic_id, s.branch_id, s.role_at_clinic,
        COALESCE(s.is_default, false) DESC,
        s.updated_at DESC NULLS LAST,
        s.created_at DESC NULLS LAST
    )
    SELECT
      d.id,
      d.user_id,
      c.id AS clinic_id,
      c.name AS clinic_name,
      c.code AS clinic_code,
      cb.id AS branch_id,
      cb.name AS branch_name,
      cb.code AS branch_code,
      COALESCE(cb.is_main_branch, false) AS is_main_branch,
      d.role_at_clinic,
      d.custom_permissions,
      d.is_default,
      d.access_active,
      COALESCE(c.status::text, ''ACTIVE'') AS clinic_status,
      c.logo_url AS clinic_logo,
      d.created_at,
      d.updated_at,
      d.created_by
    FROM dedup d
    JOIN public.clinics c ON c.id = d.clinic_id
    LEFT JOIN public.clinic_branches cb ON cb.id = d.branch_id
    WHERE COALESCE(d.access_active, true) = true
      AND COALESCE(c.status::text, ''ACTIVE'') = ''ACTIVE'';';

  EXECUTE v_sql;

  BEGIN
    EXECUTE 'ALTER VIEW public.user_clinics_view SET (security_invoker = true)';
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  -- Recreate dependent view if branch session helper exists.
  BEGIN
    IF to_regprocedure('public.current_session_branch_id()') IS NOT NULL THEN
      EXECUTE '
        CREATE VIEW public.current_branch_user_clinics_view AS
        SELECT *
        FROM public.user_clinics_view
        WHERE branch_id IS NOT DISTINCT FROM public.current_session_branch_id()
      ';
      EXECUTE 'GRANT SELECT ON TABLE public.current_branch_user_clinics_view TO authenticated';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
END
$$;

REVOKE ALL ON TABLE public.user_clinics_view FROM anon;
REVOKE ALL ON TABLE public.user_clinics_view FROM PUBLIC;
GRANT SELECT ON TABLE public.user_clinics_view TO authenticated;

COMMIT;
