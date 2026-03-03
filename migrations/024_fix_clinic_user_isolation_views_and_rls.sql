-- ============================================================================
-- 024_fix_clinic_user_isolation_views_and_rls.sql
-- Purpose:
-- 1) Remove FORCE RLS from clinic-scope tables to avoid policy recursion traps.
-- 2) Rebuild user_clinics_view as self-scoped (auth.uid only).
-- 3) Restrict clinic management views so they cannot leak cross-user data.
-- ============================================================================

BEGIN;

-- Shared metadata helper (safe redefinition).
CREATE OR REPLACE FUNCTION public.public_column_exists(p_table TEXT, p_column TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table
      AND column_name = p_column
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.public_column_exists(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_column_exists(TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Ensure clinic-scope tables are RLS-enabled without FORCE mode.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['clinics', 'clinic_branches', 'clinic_settings', 'user_clinics', 'user_clinic_access'] LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('ALTER TABLE public.%I NO FORCE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- Rebuild user_clinics_view with strict self scope.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_source_table TEXT;
  v_active_column TEXT;
  v_has_id BOOLEAN;
  v_has_branch_id BOOLEAN;
  v_has_clinic_branches_table BOOLEAN;
  v_has_role_at_clinic BOOLEAN;
  v_has_is_default BOOLEAN;
  v_has_custom_permissions BOOLEAN;
  v_has_active BOOLEAN;
  v_has_clinic_status BOOLEAN;
  v_sql TEXT;
BEGIN
  IF to_regclass('public.user_clinic_access') IS NOT NULL THEN
    v_source_table := 'user_clinic_access';
    v_active_column := 'is_active';
  ELSIF to_regclass('public.user_clinics') IS NOT NULL THEN
    v_source_table := 'user_clinics';
    v_active_column := 'access_active';
  ELSE
    RETURN;
  END IF;

  SELECT public.public_column_exists(v_source_table, 'id') INTO v_has_id;
  SELECT public.public_column_exists(v_source_table, 'branch_id') INTO v_has_branch_id;
  SELECT to_regclass('public.clinic_branches') IS NOT NULL INTO v_has_clinic_branches_table;
  SELECT public.public_column_exists(v_source_table, 'role_at_clinic') INTO v_has_role_at_clinic;
  SELECT public.public_column_exists(v_source_table, 'is_default') INTO v_has_is_default;
  SELECT public.public_column_exists(v_source_table, 'custom_permissions') INTO v_has_custom_permissions;
  SELECT public.public_column_exists(v_source_table, v_active_column) INTO v_has_active;
  SELECT public.public_column_exists('clinics', 'status') INTO v_has_clinic_status;

  v_sql := 'CREATE OR REPLACE VIEW public.user_clinics_view AS
            SELECT '
    || CASE WHEN v_has_id THEN 'src.id' ELSE 'NULL::uuid' END || ' AS id,
               src.user_id,
               c.id AS clinic_id,
               c.name AS clinic_name,
               c.code AS clinic_code,
               ' || CASE WHEN v_has_branch_id AND v_has_clinic_branches_table THEN 'cb.id' ELSE 'NULL::uuid' END || ' AS branch_id,
               ' || CASE WHEN v_has_branch_id AND v_has_clinic_branches_table THEN 'cb.name' ELSE 'NULL::text' END || ' AS branch_name,
               ' || CASE WHEN v_has_branch_id AND v_has_clinic_branches_table THEN 'cb.code' ELSE 'NULL::text' END || ' AS branch_code,
               ' || CASE WHEN v_has_branch_id AND v_has_clinic_branches_table THEN 'COALESCE(cb.is_main_branch, false)' ELSE 'false' END || ' AS is_main_branch,
               ' || CASE WHEN v_has_role_at_clinic THEN 'src.role_at_clinic::varchar' ELSE 'NULL::varchar' END || ' AS role_at_clinic,
               ' || CASE WHEN v_has_is_default THEN 'COALESCE(src.is_default, false)' ELSE 'false' END || ' AS is_default,
               ' || CASE WHEN v_has_active THEN 'COALESCE(src.' || quote_ident(v_active_column) || ', true)' ELSE 'true' END || ' AS access_active,
               ' || CASE WHEN v_has_custom_permissions THEN 'COALESCE(src.custom_permissions, ARRAY[]::text[])' ELSE 'ARRAY[]::text[]' END || ' AS custom_permissions,
               ' || CASE WHEN v_has_clinic_status THEN 'c.status' ELSE 'NULL::text' END || ' AS clinic_status,
               c.logo_url AS clinic_logo
            FROM public.' || quote_ident(v_source_table) || ' src
            JOIN public.clinics c ON c.id = src.clinic_id
            ' || CASE WHEN v_has_branch_id AND v_has_clinic_branches_table
                      THEN 'LEFT JOIN public.clinic_branches cb ON cb.id = src.branch_id'
                      ELSE 'LEFT JOIN (SELECT NULL::uuid AS id, NULL::text AS name, NULL::text AS code, false AS is_main_branch) cb ON FALSE'
                 END || '
            WHERE src.user_id = auth.uid()';

  IF v_has_active THEN
    v_sql := v_sql || ' AND COALESCE(src.' || quote_ident(v_active_column) || ', true) = true';
  END IF;

  IF v_has_clinic_status THEN
    v_sql := v_sql || ' AND COALESCE(c.status, ''ACTIVE'') = ''ACTIVE''';
  END IF;

  EXECUTE v_sql;

  BEGIN
    EXECUTE 'ALTER VIEW public.user_clinics_view SET (security_invoker = true)';
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
END
$$;

-- ---------------------------------------------------------------------------
-- Restrict view grants: only user_clinics_view remains readable by authenticated.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v TEXT;
BEGIN
  FOREACH v IN ARRAY ARRAY['user_clinics_view', 'clinic_summary_view', 'branch_summary_view'] LOOP
    IF to_regclass(format('public.%I', v)) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', v);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', v);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', v);
      IF v = 'user_clinics_view' THEN
        EXECUTE format('GRANT SELECT ON TABLE public.%I TO authenticated', v);
      END IF;
    END IF;
  END LOOP;
END
$$;

COMMIT;

