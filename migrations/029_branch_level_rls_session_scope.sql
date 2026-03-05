-- ============================================================================
-- 029_branch_level_rls_session_scope.sql
-- Purpose:
-- 1) Move data isolation from user scope to branch scope.
-- 2) Enforce branch context via RLS + session helpers.
-- 3) Backfill missing branch_id values when possible.
-- ============================================================================

BEGIN;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS active_branch_id UUID REFERENCES public.clinic_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_active_branch_id
  ON public.user_profiles(active_branch_id);

CREATE OR REPLACE FUNCTION public.current_session_branch_id()
RETURNS UUID AS $$
DECLARE
  v_setting TEXT;
  v_branch_id UUID;
BEGIN
  BEGIN
    v_setting := current_setting('app.current_branch_id', true);
  EXCEPTION
    WHEN OTHERS THEN
      v_setting := NULL;
  END;

  IF v_setting IS NOT NULL AND btrim(v_setting) <> '' THEN
    BEGIN
      v_branch_id := v_setting::UUID;
    EXCEPTION
      WHEN OTHERS THEN
        v_branch_id := NULL;
    END;
  END IF;

  IF v_branch_id IS NOT NULL THEN
    RETURN v_branch_id;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT up.active_branch_id
    INTO v_branch_id
  FROM public.user_profiles up
  WHERE up.id = auth.uid()
  LIMIT 1;

  IF v_branch_id IS NULL AND to_regclass('public.user_clinic_access') IS NOT NULL THEN
    SELECT uca.branch_id
      INTO v_branch_id
    FROM public.user_clinic_access uca
    WHERE uca.user_id = auth.uid()
      AND COALESCE(uca.is_active, true) = true
      AND uca.branch_id IS NOT NULL
    ORDER BY COALESCE(uca.is_default, false) DESC, uca.created_at ASC
    LIMIT 1;
  END IF;

  IF v_branch_id IS NULL AND to_regclass('public.user_clinics') IS NOT NULL THEN
    SELECT uc.branch_id
      INTO v_branch_id
    FROM public.user_clinics uc
    WHERE uc.user_id = auth.uid()
      AND COALESCE(uc.access_active, true) = true
      AND uc.branch_id IS NOT NULL
    ORDER BY COALESCE(uc.is_default, false) DESC, uc.created_at ASC
    LIMIT 1;
  END IF;

  RETURN v_branch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.current_session_clinic_id()
RETURNS UUID AS $$
DECLARE
  v_branch_id UUID;
  v_clinic_id UUID;
BEGIN
  v_branch_id := public.current_session_branch_id();
  IF v_branch_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT cb.clinic_id
    INTO v_clinic_id
  FROM public.clinic_branches cb
  WHERE cb.id = v_branch_id
  LIMIT 1;

  RETURN v_clinic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.set_current_branch(bid UUID)
RETURNS VOID AS $$
DECLARE
  v_allowed BOOLEAN := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF bid IS NULL THEN
    RAISE EXCEPTION 'Branch id is required';
  END IF;

  IF to_regclass('public.user_has_branch_membership') IS NOT NULL THEN
    SELECT public.user_has_branch_membership(auth.uid(), bid) INTO v_allowed;
  END IF;

  IF COALESCE(v_allowed, false) = false AND to_regclass('public.current_user_can_read_clinic_scope') IS NOT NULL THEN
    SELECT public.current_user_can_read_clinic_scope(NULL, bid) INTO v_allowed;
  END IF;

  IF COALESCE(v_allowed, false) = false THEN
    RAISE EXCEPTION 'Access denied to branch %', bid;
  END IF;

  PERFORM set_config('app.current_branch_id', bid::TEXT, true);

  UPDATE public.user_profiles
  SET active_branch_id = bid,
      updated_at = NOW()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.set_current_branch(bid TEXT)
RETURNS VOID AS $$
BEGIN
  IF bid IS NULL OR btrim(bid) = '' THEN
    RAISE EXCEPTION 'Branch id is required';
  END IF;

  PERFORM public.set_current_branch(bid::UUID);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.clear_current_branch()
RETURNS VOID AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  PERFORM set_config('app.current_branch_id', '', true);

  UPDATE public.user_profiles
  SET active_branch_id = NULL,
      updated_at = NOW()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.current_session_branch_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_session_clinic_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_current_branch(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_current_branch(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.clear_current_branch() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_session_branch_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_session_clinic_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_branch(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_branch(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_current_branch() TO authenticated;

CREATE OR REPLACE FUNCTION public.apply_branch_scope_rls(p_table TEXT, p_scope_column TEXT)
RETURNS VOID AS $$
DECLARE
  p RECORD;
  v_policy_prefix TEXT;
  v_using_expr TEXT;
  v_check_expr TEXT;
BEGIN
  IF to_regclass(format('public.%I', p_table)) IS NULL THEN
    RETURN;
  END IF;

  -- Only physical/partitioned tables support RLS (exclude views/materialized views).
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = p_table
      AND c.relkind IN ('r', 'p')
  ) THEN
    RETURN;
  END IF;

  IF p_scope_column NOT IN ('branch_id', 'clinic_id') THEN
    RETURN;
  END IF;

  IF p_scope_column = 'branch_id' THEN
    v_using_expr := '(branch_id = public.current_session_branch_id())';
    v_check_expr := '(branch_id = public.current_session_branch_id())';
  ELSE
    v_using_expr := '(clinic_id = public.current_session_clinic_id())';
    v_check_expr := '(clinic_id = public.current_session_clinic_id())';
  END IF;

  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table);

  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = p_table
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p_table);
  END LOOP;

  v_policy_prefix := p_table || '_branch_scope';

  EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING %s', v_policy_prefix || '_select', p_table, v_using_expr);
  EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK %s', v_policy_prefix || '_insert', p_table, v_check_expr);
  EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING %s WITH CHECK %s', v_policy_prefix || '_update', p_table, v_using_expr, v_check_expr);
  EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING %s', v_policy_prefix || '_delete', p_table, v_using_expr);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.apply_branch_scope_rls(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_branch_scope_rls(TEXT, TEXT) TO authenticated;

DO $$
DECLARE
  t RECORD;
  v_excluded TEXT[] := ARRAY[
    'clinics',
    'clinic_branches',
    'clinic_settings',
    'user_clinics',
    'user_clinic_access',
    'user_profiles',
    'users',
    'roles',
    'role_permissions',
    'user_permission_overrides',
    'audit_logs',
    'tenants',
    'subscription_plans',
    'subscription_invoices',
    'tenant_invitations',
    'tenant_usage_logs',
    'online_reservations',
    'working_hours'
  ];
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema
     AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'branch_id'
      AND tb.table_type = 'BASE TABLE'
      AND c.table_name <> ALL(v_excluded)
    GROUP BY c.table_name
  LOOP
    PERFORM public.apply_branch_scope_rls(t.table_name, 'branch_id');
  END LOOP;

  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema
     AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'clinic_id'
      AND tb.table_type = 'BASE TABLE'
      AND c.table_name <> ALL(v_excluded)
      AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns b
        WHERE b.table_schema = 'public'
          AND b.table_name = c.table_name
          AND b.column_name = 'branch_id'
      )
    GROUP BY c.table_name
  LOOP
    PERFORM public.apply_branch_scope_rls(t.table_name, 'clinic_id');
  END LOOP;
END
$$;

DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema
     AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'branch_id'
      AND tb.table_type = 'BASE TABLE'
    GROUP BY c.table_name
  LOOP
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (branch_id)', 'idx_' || t.table_name || '_branch_scope', t.table_name);
  END LOOP;

  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema
     AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'clinic_id'
      AND tb.table_type = 'BASE TABLE'
    GROUP BY c.table_name
  LOOP
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (clinic_id)', 'idx_' || t.table_name || '_clinic_scope', t.table_name);
  END LOOP;
END
$$;

CREATE OR REPLACE FUNCTION public.resolve_user_default_branch(
  p_user_id UUID,
  p_clinic_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_branch_id UUID;
BEGIN
  IF p_user_id IS NULL OR p_clinic_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF to_regclass('public.user_clinic_access') IS NOT NULL THEN
    SELECT uca.branch_id
      INTO v_branch_id
    FROM public.user_clinic_access uca
    WHERE uca.user_id = p_user_id
      AND uca.clinic_id = p_clinic_id
      AND COALESCE(uca.is_active, true) = true
      AND uca.branch_id IS NOT NULL
    ORDER BY COALESCE(uca.is_default, false) DESC, uca.created_at ASC
    LIMIT 1;
  END IF;

  IF v_branch_id IS NULL AND to_regclass('public.user_clinics') IS NOT NULL THEN
    SELECT uc.branch_id
      INTO v_branch_id
    FROM public.user_clinics uc
    WHERE uc.user_id = p_user_id
      AND uc.clinic_id = p_clinic_id
      AND COALESCE(uc.access_active, true) = true
      AND uc.branch_id IS NOT NULL
    ORDER BY COALESCE(uc.is_default, false) DESC, uc.created_at ASC
    LIMIT 1;
  END IF;

  RETURN v_branch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.resolve_user_default_branch(
  p_user_id UUID,
  p_clinic_id TEXT
)
RETURNS UUID AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  IF p_clinic_id IS NULL OR btrim(p_clinic_id) = '' THEN
    RETURN NULL;
  END IF;

  BEGIN
    v_clinic_id := p_clinic_id::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN NULL;
  END;

  RETURN public.resolve_user_default_branch(p_user_id, v_clinic_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema
     AND tb.table_name = c.table_name
    JOIN information_schema.columns u
      ON u.table_schema = c.table_schema
     AND u.table_name = c.table_name
     AND u.column_name = 'user_id'
    JOIN information_schema.columns cl
      ON cl.table_schema = c.table_schema
     AND cl.table_name = c.table_name
     AND cl.column_name = 'clinic_id'
    WHERE c.table_schema = 'public'
      AND c.column_name = 'branch_id'
      AND tb.table_type = 'BASE TABLE'
      AND c.table_name NOT IN ('clinic_branches', 'user_clinics', 'user_clinic_access', 'clinic_settings')
    GROUP BY c.table_name
  LOOP
    EXECUTE format(
      'UPDATE public.%I dst
       SET branch_id = public.resolve_user_default_branch(dst.user_id, dst.clinic_id)
       WHERE dst.branch_id IS NULL
         AND dst.clinic_id IS NOT NULL
         AND dst.user_id IS NOT NULL',
      t.table_name
    );
  END LOOP;
END
$$;

CREATE OR REPLACE VIEW public.current_branch_user_clinics_view AS
SELECT *
FROM public.user_clinics_view
WHERE branch_id IS NOT DISTINCT FROM public.current_session_branch_id();

CREATE OR REPLACE VIEW public.current_branch_patients AS
SELECT *
FROM public.patients
WHERE branch_id = public.current_session_branch_id();

CREATE OR REPLACE VIEW public.current_branch_appointments AS
SELECT *
FROM public.appointments
WHERE branch_id = public.current_session_branch_id();

REVOKE ALL ON TABLE public.current_branch_user_clinics_view FROM PUBLIC;
REVOKE ALL ON TABLE public.current_branch_patients FROM PUBLIC;
REVOKE ALL ON TABLE public.current_branch_appointments FROM PUBLIC;
GRANT SELECT ON TABLE public.current_branch_user_clinics_view TO authenticated;
GRANT SELECT ON TABLE public.current_branch_patients TO authenticated;
GRANT SELECT ON TABLE public.current_branch_appointments TO authenticated;

COMMIT;
