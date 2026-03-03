-- ============================================================================
-- 023_lockdown_data_isolation.sql
-- Purpose:
-- 1) Enforce strict tenant/user data isolation for clinic scope tables.
-- 2) Harden legacy clinic helper functions against cross-user probing.
-- 3) Lock down patient attachment storage access (remove public exposure).
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Shared metadata helper
-- ---------------------------------------------------------------------------
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
-- Clinic scope helpers used by RLS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clinic_tenant_id(p_clinic_id UUID)
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  IF p_clinic_id IS NULL OR to_regclass('public.clinics') IS NULL THEN
    RETURN NULL;
  END IF;

  IF NOT public.public_column_exists('clinics', 'tenant_id') THEN
    RETURN NULL;
  END IF;

  EXECUTE 'SELECT c.tenant_id FROM public.clinics c WHERE c.id = $1 LIMIT 1'
    INTO v_tenant_id
    USING p_clinic_id;

  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.is_current_user_clinic_admin(p_clinic_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  IF p_clinic_id IS NULL THEN
    RETURN false;
  END IF;

  v_tenant_id := public.clinic_tenant_id(p_clinic_id);
  IF v_tenant_id IS NULL THEN
    RETURN public.is_current_user_admin();
  END IF;

  RETURN public.is_current_user_admin_for_tenant(v_tenant_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.user_has_clinic_membership(p_user_id UUID, p_clinic_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_result BOOLEAN := false;
  v_tmp BOOLEAN := false;
BEGIN
  IF p_user_id IS NULL OR p_clinic_id IS NULL THEN
    RETURN false;
  END IF;

  IF to_regclass('public.user_clinics') IS NOT NULL THEN
    IF public.public_column_exists('user_clinics', 'access_active') THEN
      SELECT EXISTS (
        SELECT 1
        FROM public.user_clinics uc
        WHERE uc.user_id = p_user_id
          AND uc.clinic_id = p_clinic_id
          AND COALESCE(uc.access_active, true) = true
      ) INTO v_tmp;
    ELSE
      SELECT EXISTS (
        SELECT 1
        FROM public.user_clinics uc
        WHERE uc.user_id = p_user_id
          AND uc.clinic_id = p_clinic_id
      ) INTO v_tmp;
    END IF;
    v_result := v_result OR COALESCE(v_tmp, false);
  END IF;

  IF to_regclass('public.user_clinic_access') IS NOT NULL THEN
    IF public.public_column_exists('user_clinic_access', 'is_active') THEN
      SELECT EXISTS (
        SELECT 1
        FROM public.user_clinic_access uca
        WHERE uca.user_id = p_user_id
          AND uca.clinic_id = p_clinic_id
          AND COALESCE(uca.is_active, true) = true
      ) INTO v_tmp;
    ELSE
      SELECT EXISTS (
        SELECT 1
        FROM public.user_clinic_access uca
        WHERE uca.user_id = p_user_id
          AND uca.clinic_id = p_clinic_id
      ) INTO v_tmp;
    END IF;
    v_result := v_result OR COALESCE(v_tmp, false);
  END IF;

  RETURN COALESCE(v_result, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.current_user_has_clinic_membership(p_clinic_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  RETURN public.user_has_clinic_membership(v_uid, p_clinic_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.resolve_effective_clinic_id(p_clinic_id UUID, p_branch_id UUID)
RETURNS UUID AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  IF p_clinic_id IS NOT NULL THEN
    RETURN p_clinic_id;
  END IF;

  IF p_branch_id IS NULL OR to_regclass('public.clinic_branches') IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT cb.clinic_id
  INTO v_clinic_id
  FROM public.clinic_branches cb
  WHERE cb.id = p_branch_id
  LIMIT 1;

  RETURN v_clinic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.current_user_can_read_clinic_scope(p_clinic_id UUID, p_branch_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  v_effective_clinic_id UUID;
BEGIN
  v_effective_clinic_id := public.resolve_effective_clinic_id(p_clinic_id, p_branch_id);
  IF v_effective_clinic_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN public.current_user_has_clinic_membership(v_effective_clinic_id)
    OR public.is_current_user_clinic_admin(v_effective_clinic_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.current_user_can_manage_clinic_scope(p_clinic_id UUID, p_branch_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  v_effective_clinic_id UUID;
BEGIN
  v_effective_clinic_id := public.resolve_effective_clinic_id(p_clinic_id, p_branch_id);
  IF v_effective_clinic_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN public.is_current_user_clinic_admin(v_effective_clinic_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.clinic_tenant_id(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_current_user_clinic_admin(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_has_clinic_membership(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_has_clinic_membership(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.resolve_effective_clinic_id(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_can_read_clinic_scope(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_can_manage_clinic_scope(UUID, UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.clinic_tenant_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_clinic_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_clinic_membership(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_has_clinic_membership(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_effective_clinic_id(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_can_read_clinic_scope(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_can_manage_clinic_scope(UUID, UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Harden legacy helper functions from 003_add_clinic_permissions.sql
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_has_clinic_access(
  p_user_id UUID,
  p_clinic_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS NULL OR p_clinic_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_user_id IS DISTINCT FROM auth.uid()
     AND NOT public.is_current_user_clinic_admin(p_clinic_id) THEN
    RETURN false;
  END IF;

  RETURN public.user_has_clinic_membership(p_user_id, p_clinic_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.user_has_branch_access(
  p_user_id UUID,
  p_branch_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS NULL OR p_branch_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT cb.clinic_id
  INTO v_clinic_id
  FROM public.clinic_branches cb
  WHERE cb.id = p_branch_id
  LIMIT 1;

  IF v_clinic_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_user_id IS DISTINCT FROM auth.uid()
     AND NOT public.is_current_user_clinic_admin(v_clinic_id) THEN
    RETURN false;
  END IF;

  RETURN public.user_has_clinic_membership(p_user_id, v_clinic_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.get_user_default_clinic(
  p_user_id UUID
) RETURNS TABLE (
  clinic_id UUID,
  clinic_name VARCHAR,
  branch_id UUID,
  branch_name VARCHAR
) AS $$
DECLARE
  v_sql TEXT;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Self-only to avoid cross-user discovery by passing arbitrary UUID.
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN;
  END IF;

  v_sql := '';

  IF to_regclass('public.user_clinics') IS NOT NULL THEN
    v_sql := v_sql || '
      SELECT
        uc.clinic_id,
        c.name AS clinic_name,
        uc.branch_id,
        cb.name AS branch_name,
        COALESCE(uc.is_default, false) AS is_default,
        COALESCE(uc.access_active, true) AS is_active
      FROM public.user_clinics uc
      JOIN public.clinics c ON c.id = uc.clinic_id
      LEFT JOIN public.clinic_branches cb ON cb.id = uc.branch_id
      WHERE uc.user_id = $1
    ';
  END IF;

  IF to_regclass('public.user_clinic_access') IS NOT NULL THEN
    IF v_sql <> '' THEN
      v_sql := v_sql || ' UNION ALL ';
    END IF;
    v_sql := v_sql || '
      SELECT
        uca.clinic_id,
        c.name AS clinic_name,
        uca.branch_id,
        cb.name AS branch_name,
        COALESCE(uca.is_default, false) AS is_default,
        COALESCE(uca.is_active, true) AS is_active
      FROM public.user_clinic_access uca
      JOIN public.clinics c ON c.id = uca.clinic_id
      LEFT JOIN public.clinic_branches cb ON cb.id = uca.branch_id
      WHERE uca.user_id = $1
    ';
  END IF;

  IF v_sql = '' THEN
    RETURN;
  END IF;

  v_sql := '
    WITH scoped AS (' || v_sql || ')
    SELECT clinic_id, clinic_name, branch_id, branch_name
    FROM scoped
    WHERE is_active = true
    ORDER BY is_default DESC
    LIMIT 1
  ';

  RETURN QUERY EXECUTE v_sql USING p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.get_user_clinics(
  p_user_id UUID
) RETURNS TABLE (
  clinic_id UUID,
  clinic_name VARCHAR,
  clinic_code VARCHAR,
  branch_id UUID,
  branch_name VARCHAR,
  is_main_branch BOOLEAN,
  is_default BOOLEAN,
  role_at_clinic VARCHAR
) AS $$
DECLARE
  v_sql TEXT;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Self-only to avoid cross-user discovery by passing arbitrary UUID.
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN;
  END IF;

  v_sql := '';

  IF to_regclass('public.user_clinics') IS NOT NULL THEN
    v_sql := v_sql || '
      SELECT
        uc.clinic_id,
        c.name AS clinic_name,
        c.code AS clinic_code,
        uc.branch_id,
        cb.name AS branch_name,
        COALESCE(cb.is_main_branch, false) AS is_main_branch,
        COALESCE(uc.is_default, false) AS is_default,
        uc.role_at_clinic::varchar AS role_at_clinic,
        COALESCE(uc.access_active, true) AS is_active
      FROM public.user_clinics uc
      JOIN public.clinics c ON c.id = uc.clinic_id
      LEFT JOIN public.clinic_branches cb ON cb.id = uc.branch_id
      WHERE uc.user_id = $1
    ';
  END IF;

  IF to_regclass('public.user_clinic_access') IS NOT NULL THEN
    IF v_sql <> '' THEN
      v_sql := v_sql || ' UNION ALL ';
    END IF;
    v_sql := v_sql || '
      SELECT
        uca.clinic_id,
        c.name AS clinic_name,
        c.code AS clinic_code,
        uca.branch_id,
        cb.name AS branch_name,
        COALESCE(cb.is_main_branch, false) AS is_main_branch,
        COALESCE(uca.is_default, false) AS is_default,
        uca.role_at_clinic::varchar AS role_at_clinic,
        COALESCE(uca.is_active, true) AS is_active
      FROM public.user_clinic_access uca
      JOIN public.clinics c ON c.id = uca.clinic_id
      LEFT JOIN public.clinic_branches cb ON cb.id = uca.branch_id
      WHERE uca.user_id = $1
    ';
  END IF;

  IF v_sql = '' THEN
    RETURN;
  END IF;

  v_sql := '
    WITH scoped AS (' || v_sql || ')
    SELECT clinic_id, clinic_name, clinic_code, branch_id, branch_name, is_main_branch, is_default, role_at_clinic
    FROM scoped
    WHERE is_active = true
    ORDER BY is_default DESC, clinic_name, branch_name
  ';

  RETURN QUERY EXECUTE v_sql USING p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.user_has_clinic_access(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_has_branch_access(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_default_clinic(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_clinics(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.user_has_clinic_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_branch_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_default_clinic(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_clinics(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Table grants + RLS for clinic scope tables
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['clinics', 'clinic_branches', 'clinic_settings', 'user_clinics', 'user_clinic_access'] LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', t);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', t);
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('ALTER TABLE public.%I NO FORCE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END
$$;

DO $$
DECLARE
  p RECORD;
  v_has_tenant_id BOOLEAN;
BEGIN
  IF to_regclass('public.clinics') IS NULL THEN
    RETURN;
  END IF;

  SELECT public.public_column_exists('clinics', 'tenant_id') INTO v_has_tenant_id;

  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'clinics'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.clinics', p.policyname);
  END LOOP;

  EXECUTE '
    CREATE POLICY clinics_select_scoped
    ON public.clinics
    FOR SELECT
    USING (
      public.current_user_has_clinic_membership(id)
      OR public.is_current_user_clinic_admin(id)
    )';

  IF v_has_tenant_id THEN
    EXECUTE '
      CREATE POLICY clinics_insert_admin
      ON public.clinics
      FOR INSERT
      WITH CHECK (public.is_current_user_admin_for_tenant(tenant_id))';

    EXECUTE '
      CREATE POLICY clinics_update_admin
      ON public.clinics
      FOR UPDATE
      USING (public.is_current_user_admin_for_tenant(tenant_id))
      WITH CHECK (public.is_current_user_admin_for_tenant(tenant_id))';

    EXECUTE '
      CREATE POLICY clinics_delete_admin
      ON public.clinics
      FOR DELETE
      USING (public.is_current_user_admin_for_tenant(tenant_id))';
  ELSE
    EXECUTE '
      CREATE POLICY clinics_insert_admin
      ON public.clinics
      FOR INSERT
      WITH CHECK (public.is_current_user_admin())';

    EXECUTE '
      CREATE POLICY clinics_update_admin
      ON public.clinics
      FOR UPDATE
      USING (public.is_current_user_admin())
      WITH CHECK (public.is_current_user_admin())';

    EXECUTE '
      CREATE POLICY clinics_delete_admin
      ON public.clinics
      FOR DELETE
      USING (public.is_current_user_admin())';
  END IF;
END
$$;

DO $$
DECLARE
  p RECORD;
BEGIN
  IF to_regclass('public.clinic_branches') IS NULL THEN
    RETURN;
  END IF;

  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'clinic_branches'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.clinic_branches', p.policyname);
  END LOOP;

  EXECUTE '
    CREATE POLICY clinic_branches_select_scoped
    ON public.clinic_branches
    FOR SELECT
    USING (public.current_user_can_read_clinic_scope(clinic_id, id))';

  EXECUTE '
    CREATE POLICY clinic_branches_insert_admin
    ON public.clinic_branches
    FOR INSERT
    WITH CHECK (public.current_user_can_manage_clinic_scope(clinic_id, id))';

  EXECUTE '
    CREATE POLICY clinic_branches_update_admin
    ON public.clinic_branches
    FOR UPDATE
    USING (public.current_user_can_manage_clinic_scope(clinic_id, id))
    WITH CHECK (public.current_user_can_manage_clinic_scope(clinic_id, id))';

  EXECUTE '
    CREATE POLICY clinic_branches_delete_admin
    ON public.clinic_branches
    FOR DELETE
    USING (public.current_user_can_manage_clinic_scope(clinic_id, id))';
END
$$;

DO $$
DECLARE
  p RECORD;
  v_has_branch_id BOOLEAN;
BEGIN
  IF to_regclass('public.clinic_settings') IS NULL THEN
    RETURN;
  END IF;

  SELECT public.public_column_exists('clinic_settings', 'branch_id') INTO v_has_branch_id;

  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'clinic_settings'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.clinic_settings', p.policyname);
  END LOOP;

  IF v_has_branch_id THEN
    EXECUTE '
      CREATE POLICY clinic_settings_select_scoped
      ON public.clinic_settings
      FOR SELECT
      USING (public.current_user_can_read_clinic_scope(clinic_id, branch_id))';

    EXECUTE '
      CREATE POLICY clinic_settings_insert_admin
      ON public.clinic_settings
      FOR INSERT
      WITH CHECK (public.current_user_can_manage_clinic_scope(clinic_id, branch_id))';

    EXECUTE '
      CREATE POLICY clinic_settings_update_admin
      ON public.clinic_settings
      FOR UPDATE
      USING (public.current_user_can_manage_clinic_scope(clinic_id, branch_id))
      WITH CHECK (public.current_user_can_manage_clinic_scope(clinic_id, branch_id))';

    EXECUTE '
      CREATE POLICY clinic_settings_delete_admin
      ON public.clinic_settings
      FOR DELETE
      USING (public.current_user_can_manage_clinic_scope(clinic_id, branch_id))';
  ELSE
    EXECUTE '
      CREATE POLICY clinic_settings_select_scoped
      ON public.clinic_settings
      FOR SELECT
      USING (public.current_user_can_read_clinic_scope(clinic_id, NULL))';

    EXECUTE '
      CREATE POLICY clinic_settings_insert_admin
      ON public.clinic_settings
      FOR INSERT
      WITH CHECK (public.current_user_can_manage_clinic_scope(clinic_id, NULL))';

    EXECUTE '
      CREATE POLICY clinic_settings_update_admin
      ON public.clinic_settings
      FOR UPDATE
      USING (public.current_user_can_manage_clinic_scope(clinic_id, NULL))
      WITH CHECK (public.current_user_can_manage_clinic_scope(clinic_id, NULL))';

    EXECUTE '
      CREATE POLICY clinic_settings_delete_admin
      ON public.clinic_settings
      FOR DELETE
      USING (public.current_user_can_manage_clinic_scope(clinic_id, NULL))';
  END IF;
END
$$;

DO $$
DECLARE
  p RECORD;
  v_has_branch_id BOOLEAN;
BEGIN
  IF to_regclass('public.user_clinics') IS NULL THEN
    RETURN;
  END IF;

  SELECT public.public_column_exists('user_clinics', 'branch_id') INTO v_has_branch_id;

  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_clinics'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_clinics', p.policyname);
  END LOOP;

  IF v_has_branch_id THEN
    EXECUTE '
      CREATE POLICY user_clinics_select_scoped
      ON public.user_clinics
      FOR SELECT
      USING (
        user_id = auth.uid()
        OR public.current_user_can_manage_clinic_scope(clinic_id, branch_id)
      )';

    EXECUTE '
      CREATE POLICY user_clinics_insert_admin
      ON public.user_clinics
      FOR INSERT
      WITH CHECK (public.current_user_can_manage_clinic_scope(clinic_id, branch_id))';

    EXECUTE '
      CREATE POLICY user_clinics_update_admin
      ON public.user_clinics
      FOR UPDATE
      USING (public.current_user_can_manage_clinic_scope(clinic_id, branch_id))
      WITH CHECK (public.current_user_can_manage_clinic_scope(clinic_id, branch_id))';

    EXECUTE '
      CREATE POLICY user_clinics_delete_admin
      ON public.user_clinics
      FOR DELETE
      USING (public.current_user_can_manage_clinic_scope(clinic_id, branch_id))';
  ELSE
    EXECUTE '
      CREATE POLICY user_clinics_select_scoped
      ON public.user_clinics
      FOR SELECT
      USING (
        user_id = auth.uid()
        OR public.current_user_can_manage_clinic_scope(clinic_id, NULL)
      )';

    EXECUTE '
      CREATE POLICY user_clinics_insert_admin
      ON public.user_clinics
      FOR INSERT
      WITH CHECK (public.current_user_can_manage_clinic_scope(clinic_id, NULL))';

    EXECUTE '
      CREATE POLICY user_clinics_update_admin
      ON public.user_clinics
      FOR UPDATE
      USING (public.current_user_can_manage_clinic_scope(clinic_id, NULL))
      WITH CHECK (public.current_user_can_manage_clinic_scope(clinic_id, NULL))';

    EXECUTE '
      CREATE POLICY user_clinics_delete_admin
      ON public.user_clinics
      FOR DELETE
      USING (public.current_user_can_manage_clinic_scope(clinic_id, NULL))';
  END IF;
END
$$;

DO $$
DECLARE
  p RECORD;
  v_has_branch_id BOOLEAN;
BEGIN
  IF to_regclass('public.user_clinic_access') IS NULL THEN
    RETURN;
  END IF;

  SELECT public.public_column_exists('user_clinic_access', 'branch_id') INTO v_has_branch_id;

  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_clinic_access'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_clinic_access', p.policyname);
  END LOOP;

  IF v_has_branch_id THEN
    EXECUTE '
      CREATE POLICY user_clinic_access_select_scoped
      ON public.user_clinic_access
      FOR SELECT
      USING (
        user_id = auth.uid()
        OR public.current_user_can_manage_clinic_scope(clinic_id, branch_id)
      )';

    EXECUTE '
      CREATE POLICY user_clinic_access_insert_admin
      ON public.user_clinic_access
      FOR INSERT
      WITH CHECK (public.current_user_can_manage_clinic_scope(clinic_id, branch_id))';

    EXECUTE '
      CREATE POLICY user_clinic_access_update_admin
      ON public.user_clinic_access
      FOR UPDATE
      USING (public.current_user_can_manage_clinic_scope(clinic_id, branch_id))
      WITH CHECK (public.current_user_can_manage_clinic_scope(clinic_id, branch_id))';

    EXECUTE '
      CREATE POLICY user_clinic_access_delete_admin
      ON public.user_clinic_access
      FOR DELETE
      USING (public.current_user_can_manage_clinic_scope(clinic_id, branch_id))';
  ELSE
    EXECUTE '
      CREATE POLICY user_clinic_access_select_scoped
      ON public.user_clinic_access
      FOR SELECT
      USING (
        user_id = auth.uid()
        OR public.current_user_can_manage_clinic_scope(clinic_id, NULL)
      )';

    EXECUTE '
      CREATE POLICY user_clinic_access_insert_admin
      ON public.user_clinic_access
      FOR INSERT
      WITH CHECK (public.current_user_can_manage_clinic_scope(clinic_id, NULL))';

    EXECUTE '
      CREATE POLICY user_clinic_access_update_admin
      ON public.user_clinic_access
      FOR UPDATE
      USING (public.current_user_can_manage_clinic_scope(clinic_id, NULL))
      WITH CHECK (public.current_user_can_manage_clinic_scope(clinic_id, NULL))';

    EXECUTE '
      CREATE POLICY user_clinic_access_delete_admin
      ON public.user_clinic_access
      FOR DELETE
      USING (public.current_user_can_manage_clinic_scope(clinic_id, NULL))';
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Rebuild user_clinics_view with strict self scope (prevents cross-user leaks)
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
      -- Compatibility fallback for Postgres versions lacking security_invoker on views.
      NULL;
  END;
END
$$;

-- Restrict view grants to authenticated only
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

-- ---------------------------------------------------------------------------
-- Storage lockdown for patient attachments
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_access_patient_attachment_object(p_object_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_sql TEXT;
  v_allowed BOOLEAN;
  v_has_user_id BOOLEAN;
  v_has_clinic_id BOOLEAN;
  v_has_tenant_id BOOLEAN;
BEGIN
  IF auth.uid() IS NULL OR p_object_name IS NULL OR btrim(p_object_name) = '' THEN
    RETURN false;
  END IF;

  IF to_regclass('public.patient_attachments') IS NULL THEN
    RETURN false;
  END IF;

  SELECT public.public_column_exists('patient_attachments', 'user_id') INTO v_has_user_id;
  SELECT public.public_column_exists('patient_attachments', 'clinic_id') INTO v_has_clinic_id;
  SELECT public.public_column_exists('patient_attachments', 'tenant_id') INTO v_has_tenant_id;

  v_sql := 'SELECT EXISTS (
              SELECT 1
              FROM public.patient_attachments pa
              WHERE (pa.patient_id::text || ''/'' || pa.filename) = $1';

  IF v_has_user_id OR v_has_clinic_id OR v_has_tenant_id THEN
    v_sql := v_sql || ' AND (FALSE';
    IF v_has_user_id THEN
      v_sql := v_sql || ' OR pa.user_id = auth.uid()';
    END IF;
    IF v_has_clinic_id THEN
      v_sql := v_sql || ' OR public.current_user_has_clinic_membership(pa.clinic_id) OR public.is_current_user_clinic_admin(pa.clinic_id)';
    END IF;
    IF v_has_tenant_id THEN
      v_sql := v_sql || ' OR pa.tenant_id IS NOT DISTINCT FROM public.current_user_tenant_id()';
    END IF;
    v_sql := v_sql || ')';
  ELSE
    v_sql := v_sql || ' AND FALSE';
  END IF;

  v_sql := v_sql || ')';

  EXECUTE v_sql INTO v_allowed USING p_object_name;
  RETURN COALESCE(v_allowed, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.can_insert_patient_attachment_object(p_object_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_patient_id UUID;
  v_patient_id_text TEXT;
  v_sql TEXT;
  v_allowed BOOLEAN;
  v_has_user_id BOOLEAN;
  v_has_clinic_id BOOLEAN;
  v_has_tenant_id BOOLEAN;
BEGIN
  IF auth.uid() IS NULL OR p_object_name IS NULL OR btrim(p_object_name) = '' THEN
    RETURN false;
  END IF;

  IF to_regclass('public.patients') IS NULL THEN
    RETURN false;
  END IF;

  v_patient_id_text := split_part(p_object_name, '/', 1);
  IF v_patient_id_text IS NULL OR btrim(v_patient_id_text) = '' THEN
    RETURN false;
  END IF;

  BEGIN
    v_patient_id := v_patient_id_text::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN false;
  END;

  SELECT public.public_column_exists('patients', 'user_id') INTO v_has_user_id;
  SELECT public.public_column_exists('patients', 'clinic_id') INTO v_has_clinic_id;
  SELECT public.public_column_exists('patients', 'tenant_id') INTO v_has_tenant_id;

  v_sql := 'SELECT EXISTS (
              SELECT 1
              FROM public.patients p
              WHERE p.id = $1';

  IF v_has_user_id OR v_has_clinic_id OR v_has_tenant_id THEN
    v_sql := v_sql || ' AND (FALSE';
    IF v_has_user_id THEN
      v_sql := v_sql || ' OR p.user_id = auth.uid()';
    END IF;
    IF v_has_clinic_id THEN
      v_sql := v_sql || ' OR public.current_user_has_clinic_membership(p.clinic_id) OR public.is_current_user_clinic_admin(p.clinic_id)';
    END IF;
    IF v_has_tenant_id THEN
      v_sql := v_sql || ' OR p.tenant_id IS NOT DISTINCT FROM public.current_user_tenant_id()';
    END IF;
    v_sql := v_sql || ')';
  ELSE
    v_sql := v_sql || ' AND FALSE';
  END IF;

  v_sql := v_sql || ')';

  EXECUTE v_sql INTO v_allowed USING v_patient_id;
  RETURN COALESCE(v_allowed, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.can_access_patient_attachment_object(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_insert_patient_attachment_object(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_patient_attachment_object(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_insert_patient_attachment_object(TEXT) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-attachments',
  'patient-attachments',
  false,
  10485760,
  ARRAY['image/*', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users can view patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "System can manage patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "curasoft_patient_attachments_read" ON storage.objects;
DROP POLICY IF EXISTS "curasoft_patient_attachments_insert" ON storage.objects;
DROP POLICY IF EXISTS "curasoft_patient_attachments_update" ON storage.objects;
DROP POLICY IF EXISTS "curasoft_patient_attachments_delete" ON storage.objects;

CREATE POLICY "curasoft_patient_attachments_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'patient-attachments'
  AND public.can_access_patient_attachment_object(name)
);

CREATE POLICY "curasoft_patient_attachments_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'patient-attachments'
  AND public.can_insert_patient_attachment_object(name)
);

CREATE POLICY "curasoft_patient_attachments_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'patient-attachments'
  AND public.can_access_patient_attachment_object(name)
)
WITH CHECK (
  bucket_id = 'patient-attachments'
  AND public.can_access_patient_attachment_object(name)
);

CREATE POLICY "curasoft_patient_attachments_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'patient-attachments'
  AND public.can_access_patient_attachment_object(name)
);

COMMIT;
