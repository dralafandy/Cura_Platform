-- ============================================================================
-- 020_fix_users_rls_recursion.sql
-- Purpose:
-- 1) Eliminate recursive RLS policies on public.users.
-- 2) Rebuild user/user_profiles policies in a non-recursive way.
-- 3) Keep admin checks centralized in SECURITY DEFINER helper functions.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Helper functions used by RLS predicates.
-- Keep these SECURITY DEFINER so policy checks do not recurse through caller RLS.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_has_auth_id BOOLEAN;
  v_sql TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'auth_id'
  ) INTO v_has_auth_id;

  IF v_has_auth_id THEN
    v_sql := $q$
      SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE (up.id = auth.uid() OR up.auth_id = auth.uid())
          AND up.role = 'ADMIN'
          AND COALESCE(up.status, 'ACTIVE') = 'ACTIVE'
      )
    $q$;
  ELSE
    v_sql := $q$
      SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE up.id = auth.uid()
          AND up.role = 'ADMIN'
          AND COALESCE(up.status, 'ACTIVE') = 'ACTIVE'
      )
    $q$;
  END IF;

  EXECUTE v_sql INTO v_is_admin;

  RETURN COALESCE(v_is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.current_user_tenant_id()
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
  v_has_tenant_id BOOLEAN;
  v_has_auth_id BOOLEAN;
  v_sql TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'tenant_id'
  ) INTO v_has_tenant_id;

  IF NOT v_has_tenant_id THEN
    RETURN NULL;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'auth_id'
  ) INTO v_has_auth_id;

  IF v_has_auth_id THEN
    v_sql := $q$
      SELECT up.tenant_id
      FROM public.user_profiles up
      WHERE up.id = auth.uid() OR up.auth_id = auth.uid()
      ORDER BY up.updated_at DESC NULLS LAST
      LIMIT 1
    $q$;
  ELSE
    v_sql := $q$
      SELECT up.tenant_id
      FROM public.user_profiles up
      WHERE up.id = auth.uid()
      ORDER BY up.updated_at DESC NULLS LAST
      LIMIT 1
    $q$;
  END IF;

  EXECUTE v_sql INTO v_tenant_id;

  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.is_current_user_admin_for_tenant(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_has_tenant_id BOOLEAN;
  v_has_auth_id BOOLEAN;
  v_sql TEXT;
BEGIN
  IF p_tenant_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'tenant_id'
  ) INTO v_has_tenant_id;

  IF NOT v_has_tenant_id THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'auth_id'
  ) INTO v_has_auth_id;

  IF v_has_auth_id THEN
    v_sql := $q$
      SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE (up.id = auth.uid() OR up.auth_id = auth.uid())
          AND up.role = 'ADMIN'
          AND COALESCE(up.status, 'ACTIVE') = 'ACTIVE'
          AND up.tenant_id IS NOT DISTINCT FROM $1
      )
    $q$;
  ELSE
    v_sql := $q$
      SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE up.id = auth.uid()
          AND up.role = 'ADMIN'
          AND COALESCE(up.status, 'ACTIVE') = 'ACTIVE'
          AND up.tenant_id IS NOT DISTINCT FROM $1
      )
    $q$;
  END IF;

  EXECUTE v_sql INTO v_is_admin USING p_tenant_id;

  RETURN COALESCE(v_is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.current_user_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_tenant_id() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin_for_tenant(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin_for_tenant(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Rebuild user_profiles RLS policies with dynamic column support.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  p RECORD;
  v_has_auth_id BOOLEAN;
  v_has_tenant_id BOOLEAN;
  v_self_expr TEXT;
  v_admin_expr TEXT;
  v_insert_self_expr TEXT;
BEGIN
  IF to_regclass('public.user_profiles') IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'auth_id'
  ) INTO v_has_auth_id;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'tenant_id'
  ) INTO v_has_tenant_id;

  v_self_expr := '(id = auth.uid())';
  IF v_has_auth_id THEN
    v_self_expr := '(id = auth.uid() OR auth_id = auth.uid())';
  END IF;

  IF v_has_tenant_id THEN
    v_admin_expr := 'public.is_current_user_admin_for_tenant(tenant_id)';
    v_insert_self_expr := v_self_expr ||
      ' AND COALESCE(role, ''DOCTOR'') = ''DOCTOR''' ||
      ' AND COALESCE(status, ''ACTIVE'') = ''ACTIVE''' ||
      ' AND tenant_id IS NOT DISTINCT FROM public.current_user_tenant_id()';
  ELSE
    v_admin_expr := 'public.is_current_user_admin()';
    v_insert_self_expr := v_self_expr ||
      ' AND COALESCE(role, ''DOCTOR'') = ''DOCTOR''' ||
      ' AND COALESCE(status, ''ACTIVE'') = ''ACTIVE''';
  END IF;

  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles', p.policyname);
  END LOOP;

  EXECUTE 'ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY';

  EXECUTE format(
    'CREATE POLICY user_profiles_select_self_or_admin ON public.user_profiles FOR SELECT USING ((%s) OR (%s))',
    v_self_expr,
    v_admin_expr
  );

  EXECUTE format(
    'CREATE POLICY user_profiles_insert_self_or_admin ON public.user_profiles FOR INSERT WITH CHECK ((%s) OR (%s))',
    v_admin_expr,
    v_insert_self_expr
  );

  EXECUTE format(
    'CREATE POLICY user_profiles_update_admin_only ON public.user_profiles FOR UPDATE USING (%s) WITH CHECK (%s)',
    v_admin_expr,
    v_admin_expr
  );

  EXECUTE format(
    'CREATE POLICY user_profiles_delete_admin_only ON public.user_profiles FOR DELETE USING (%s)',
    v_admin_expr
  );
END
$$;

-- ---------------------------------------------------------------------------
-- Rebuild users RLS policies and drop any unknown recursive policy names.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  p RECORD;
  v_has_tenant_id BOOLEAN;
  v_admin_expr TEXT;
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'tenant_id'
  ) INTO v_has_tenant_id;

  IF v_has_tenant_id THEN
    v_admin_expr := 'public.is_current_user_admin_for_tenant(tenant_id)';
  ELSE
    v_admin_expr := 'public.is_current_user_admin()';
  END IF;

  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', p.policyname);
  END LOOP;

  EXECUTE 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY';

  EXECUTE format(
    'CREATE POLICY users_select_self_or_admin ON public.users FOR SELECT USING ((id = auth.uid()) OR (%s))',
    v_admin_expr
  );

  EXECUTE format(
    'CREATE POLICY users_insert_self_or_admin ON public.users FOR INSERT WITH CHECK ((id = auth.uid()) OR (%s))',
    v_admin_expr
  );

  EXECUTE format(
    'CREATE POLICY users_update_self_or_admin ON public.users FOR UPDATE USING ((id = auth.uid()) OR (%s)) WITH CHECK ((id = auth.uid()) OR (%s))',
    v_admin_expr,
    v_admin_expr
  );

  EXECUTE format(
    'CREATE POLICY users_delete_admin_only ON public.users FOR DELETE USING (%s)',
    v_admin_expr
  );
END
$$;

COMMIT;
