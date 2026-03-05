-- ============================================================================
-- 046_lockdown_tenant_and_membership_security.sql
-- Purpose:
-- 1) Close tenant escalation via direct clinic membership inserts.
-- 2) Harden tenant/subscription RPCs with tenant-scoped authorization checks.
-- 3) Enable/lock RLS on tenants + tenant_invitations.
-- 4) Restrict high-risk bootstrap RPCs to service_role only.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Shared tenant auth helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_auth_user_email()
RETURNS TEXT AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT LOWER(au.email)
  INTO v_email
  FROM auth.users au
  WHERE au.id = auth.uid()
  LIMIT 1;

  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.assert_current_user_can_access_tenant(
  p_tenant_id UUID,
  p_require_admin BOOLEAN DEFAULT false
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role_claim TEXT;
  v_current_tenant UUID;
BEGIN
  IF p_tenant_id IS NULL THEN
    RETURN false;
  END IF;

  BEGIN
    v_role_claim := current_setting('request.jwt.claim.role', true);
  EXCEPTION
    WHEN OTHERS THEN
      v_role_claim := NULL;
  END;

  -- Service role bypasses app-level tenant checks.
  IF v_role_claim = 'service_role' THEN
    RETURN true;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF p_require_admin THEN
    BEGIN
      RETURN public.is_current_user_admin_for_tenant(p_tenant_id);
    EXCEPTION
      WHEN undefined_function THEN
        RETURN EXISTS (
          SELECT 1
          FROM public.user_profiles up
          WHERE up.id = auth.uid()
            AND up.role = 'ADMIN'
            AND COALESCE(up.status, 'ACTIVE') = 'ACTIVE'
            AND up.tenant_id IS NOT DISTINCT FROM p_tenant_id
        );
    END;
  END IF;

  BEGIN
    v_current_tenant := public.current_user_tenant_id();
  EXCEPTION
    WHEN undefined_function THEN
      v_current_tenant := NULL;
  END;

  IF v_current_tenant IS NOT NULL
     AND v_current_tenant IS NOT DISTINCT FROM p_tenant_id THEN
    RETURN true;
  END IF;

  BEGIN
    IF public.is_current_user_admin_for_tenant(p_tenant_id) THEN
      RETURN true;
    END IF;
  EXCEPTION
    WHEN undefined_function THEN
      NULL;
  END;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.current_auth_user_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_auth_user_email() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.assert_current_user_can_access_tenant(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assert_current_user_can_access_tenant(UUID, BOOLEAN) TO authenticated;

-- ---------------------------------------------------------------------------
-- Harden subscription/tenant RPCs from 011 with scoped authorization.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_tenant_subscription_status(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  v_tenant tenants%ROWTYPE;
  v_new_status TEXT;
BEGIN
  IF NOT public.assert_current_user_can_access_tenant(p_tenant_id, false) THEN
    RAISE EXCEPTION 'Access denied for tenant %', p_tenant_id USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_tenant
  FROM tenants
  WHERE id = p_tenant_id;

  IF NOT FOUND THEN
    RETURN 'NOT_FOUND';
  END IF;

  v_new_status := v_tenant.subscription_status;

  IF v_tenant.subscription_status = 'TRIAL'
     AND v_tenant.trial_end_date IS NOT NULL
     AND v_tenant.trial_end_date < CURRENT_DATE THEN
    v_new_status := 'EXPIRED';
  ELSIF v_tenant.subscription_status = 'ACTIVE'
        AND v_tenant.subscription_end_date IS NOT NULL
        AND v_tenant.subscription_end_date < CURRENT_DATE THEN
    v_new_status := 'EXPIRED';
  END IF;

  IF v_new_status <> v_tenant.subscription_status THEN
    UPDATE tenants
    SET subscription_status = v_new_status,
        updated_at = NOW()
    WHERE id = p_tenant_id;
  END IF;

  RETURN v_new_status;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_trial_valid(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  v_status TEXT;
  v_trial_end DATE;
BEGIN
  IF NOT public.assert_current_user_can_access_tenant(p_tenant_id, false) THEN
    RAISE EXCEPTION 'Access denied for tenant %', p_tenant_id USING ERRCODE = '42501';
  END IF;

  PERFORM public.refresh_tenant_subscription_status(p_tenant_id);

  SELECT subscription_status, trial_end_date
  INTO v_status, v_trial_end
  FROM tenants
  WHERE id = p_tenant_id;

  RETURN v_status = 'TRIAL' AND v_trial_end >= CURRENT_DATE;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_trial_days_remaining(p_tenant_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  v_trial_end DATE;
BEGIN
  IF NOT public.assert_current_user_can_access_tenant(p_tenant_id, false) THEN
    RAISE EXCEPTION 'Access denied for tenant %', p_tenant_id USING ERRCODE = '42501';
  END IF;

  SELECT trial_end_date
  INTO v_trial_end
  FROM tenants
  WHERE id = p_tenant_id;

  IF v_trial_end IS NULL THEN
    RETURN 0;
  END IF;

  RETURN GREATEST(0, (v_trial_end - CURRENT_DATE));
END;
$$;

CREATE OR REPLACE FUNCTION public.get_tenant_info(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  subscription_status TEXT,
  subscription_plan TEXT,
  trial_days_remaining INTEGER,
  is_subscription_valid BOOLEAN,
  max_users INTEGER,
  max_patients INTEGER,
  current_users BIGINT,
  current_patients BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
BEGIN
  IF NOT public.assert_current_user_can_access_tenant(p_tenant_id, false) THEN
    RAISE EXCEPTION 'Access denied for tenant %', p_tenant_id USING ERRCODE = '42501';
  END IF;

  PERFORM public.refresh_tenant_subscription_status(p_tenant_id);

  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.slug,
    t.subscription_status,
    t.subscription_plan,
    public.get_trial_days_remaining(t.id),
    (
      (t.subscription_status = 'TRIAL' AND COALESCE(t.trial_end_date, CURRENT_DATE - 1) >= CURRENT_DATE)
      OR
      (t.subscription_status = 'ACTIVE' AND COALESCE(t.subscription_end_date, CURRENT_DATE + 1) >= CURRENT_DATE)
    ) AS is_subscription_valid,
    t.max_users,
    t.max_patients,
    (SELECT COUNT(*) FROM user_profiles up WHERE up.tenant_id = t.id AND up.status = 'ACTIVE') AS current_users,
    (SELECT COUNT(*) FROM patients p WHERE p.tenant_id = t.id) AS current_patients
  FROM tenants t
  WHERE t.id = p_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_limits(p_tenant_id UUID, p_resource TEXT)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count BIGINT,
  max_limit INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  v_info RECORD;
BEGIN
  IF NOT public.assert_current_user_can_access_tenant(p_tenant_id, false) THEN
    RAISE EXCEPTION 'Access denied for tenant %', p_tenant_id USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_info
  FROM public.get_tenant_info(p_tenant_id)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0::BIGINT, 0, 'Tenant not found';
    RETURN;
  END IF;

  IF p_resource = 'users' THEN
    RETURN QUERY SELECT
      (v_info.current_users < v_info.max_users),
      v_info.current_users,
      v_info.max_users,
      CASE
        WHEN v_info.current_users >= v_info.max_users THEN 'User limit reached for current plan'
        ELSE 'OK'
      END;
  ELSIF p_resource = 'patients' THEN
    RETURN QUERY SELECT
      (v_info.current_patients < v_info.max_patients),
      v_info.current_patients,
      v_info.max_patients,
      CASE
        WHEN v_info.current_patients >= v_info.max_patients THEN 'Patient limit reached for current plan'
        ELSE 'OK'
      END;
  ELSE
    RETURN QUERY SELECT FALSE, 0::BIGINT, 0, 'Unsupported resource type';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.activate_subscription(p_tenant_id UUID, p_plan_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  v_plan subscription_plans%ROWTYPE;
BEGIN
  IF NOT public.assert_current_user_can_access_tenant(p_tenant_id, true) THEN
    RAISE EXCEPTION 'Access denied for tenant %', p_tenant_id USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_plan
  FROM subscription_plans
  WHERE slug = p_plan_slug
    AND is_active = true
    AND is_trial = false;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  UPDATE tenants
  SET
    subscription_status = 'ACTIVE',
    subscription_plan = v_plan.slug,
    subscription_start_date = CURRENT_DATE,
    subscription_end_date = CURRENT_DATE + INTERVAL '30 days',
    max_users = v_plan.max_users,
    max_patients = v_plan.max_patients,
    updated_at = NOW()
  WHERE id = p_tenant_id;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_subscription_valid(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  v_info RECORD;
BEGIN
  IF NOT public.assert_current_user_can_access_tenant(p_tenant_id, false) THEN
    RAISE EXCEPTION 'Access denied for tenant %', p_tenant_id USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_info
  FROM public.get_tenant_info(p_tenant_id)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  RETURN v_info.is_subscription_valid;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refresh_tenant_subscription_status(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_trial_valid(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_trial_days_remaining(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_tenant_info(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_limits(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.activate_subscription(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_subscription_valid(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_trial_valid(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trial_days_remaining(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_limits(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_subscription(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_subscription_valid(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS lockdown on tenants + tenant_invitations
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  p RECORD;
BEGIN
  IF to_regclass('public.tenants') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY';

    FOR p IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'tenants'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.tenants', p.policyname);
    END LOOP;

    EXECUTE '
      CREATE POLICY tenants_select_scoped
      ON public.tenants
      FOR SELECT
      USING (public.assert_current_user_can_access_tenant(id, false))';

    EXECUTE '
      CREATE POLICY tenants_insert_authenticated
      ON public.tenants
      FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL)';

    EXECUTE '
      CREATE POLICY tenants_update_admin
      ON public.tenants
      FOR UPDATE
      USING (public.assert_current_user_can_access_tenant(id, true))
      WITH CHECK (public.assert_current_user_can_access_tenant(id, true))';

    EXECUTE '
      CREATE POLICY tenants_delete_blocked
      ON public.tenants
      FOR DELETE
      USING (false)';

    EXECUTE 'REVOKE ALL ON TABLE public.tenants FROM anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON TABLE public.tenants TO authenticated';
  END IF;

  IF to_regclass('public.tenant_invitations') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY';

    FOR p IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'tenant_invitations'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.tenant_invitations', p.policyname);
    END LOOP;

    EXECUTE '
      CREATE POLICY tenant_invitations_select_scoped
      ON public.tenant_invitations
      FOR SELECT
      USING (
        public.assert_current_user_can_access_tenant(tenant_id, true)
        OR LOWER(email) = public.current_auth_user_email()
      )';

    EXECUTE '
      CREATE POLICY tenant_invitations_insert_admin
      ON public.tenant_invitations
      FOR INSERT
      WITH CHECK (public.assert_current_user_can_access_tenant(tenant_id, true))';

    EXECUTE '
      CREATE POLICY tenant_invitations_update_admin
      ON public.tenant_invitations
      FOR UPDATE
      USING (public.assert_current_user_can_access_tenant(tenant_id, true))
      WITH CHECK (public.assert_current_user_can_access_tenant(tenant_id, true))';

    EXECUTE '
      CREATE POLICY tenant_invitations_delete_admin
      ON public.tenant_invitations
      FOR DELETE
      USING (public.assert_current_user_can_access_tenant(tenant_id, true))';

    EXECUTE 'REVOKE ALL ON TABLE public.tenant_invitations FROM anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tenant_invitations TO authenticated';
  END IF;
END
$$;

-- Secure invitation acceptance path for invited users (without broad table UPDATE).
CREATE OR REPLACE FUNCTION public.accept_tenant_invitation_secure(p_token TEXT)
RETURNS TABLE (
  tenant_id UUID,
  role TEXT,
  status TEXT
) AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_token IS NULL OR btrim(p_token) = '' THEN
    RAISE EXCEPTION 'Invitation token is required';
  END IF;

  v_email := public.current_auth_user_email();
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'No authenticated email found';
  END IF;

  RETURN QUERY
  UPDATE public.tenant_invitations ti
  SET status = 'ACCEPTED'
  WHERE ti.token = p_token
    AND LOWER(ti.email) = v_email
    AND ti.status = 'PENDING'
    AND ti.expires_at > NOW()
  RETURNING ti.tenant_id, ti.role, ti.status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid, expired, or already-used invitation token';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.accept_tenant_invitation_secure(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_tenant_invitation_secure(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Membership RLS hardening (close self-insert escalation across clinics).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  p RECORD;
  v_has_branch_id BOOLEAN;
  v_self_expr TEXT;
  v_manage_expr TEXT;
BEGIN
  v_self_expr := 'user_id = auth.uid()';
  IF to_regprocedure('public.current_user_profile_id()') IS NOT NULL THEN
    v_self_expr := '(user_id = auth.uid() OR user_id = public.current_user_profile_id())';
  END IF;

  IF to_regclass('public.user_clinic_access') IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_clinic_access'
        AND column_name = 'branch_id'
    ) INTO v_has_branch_id;

    IF to_regprocedure('public.current_user_can_manage_clinic_scope(uuid,uuid)') IS NOT NULL THEN
      IF v_has_branch_id THEN
        v_manage_expr := 'public.current_user_can_manage_clinic_scope(clinic_id, branch_id)';
      ELSE
        v_manage_expr := 'public.current_user_can_manage_clinic_scope(clinic_id, NULL)';
      END IF;
    ELSE
      v_manage_expr := 'public.is_current_user_admin()';
    END IF;

    EXECUTE 'ALTER TABLE public.user_clinic_access ENABLE ROW LEVEL SECURITY';

    FOR p IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'user_clinic_access'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_clinic_access', p.policyname);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY user_clinic_access_select_scoped ON public.user_clinic_access FOR SELECT USING ((%s) OR (%s))',
      v_self_expr,
      v_manage_expr
    );
    EXECUTE format(
      'CREATE POLICY user_clinic_access_insert_admin_scope ON public.user_clinic_access FOR INSERT WITH CHECK (%s)',
      v_manage_expr
    );
    EXECUTE format(
      'CREATE POLICY user_clinic_access_update_admin_scope ON public.user_clinic_access FOR UPDATE USING (%s) WITH CHECK (%s)',
      v_manage_expr,
      v_manage_expr
    );
    EXECUTE format(
      'CREATE POLICY user_clinic_access_delete_admin_scope ON public.user_clinic_access FOR DELETE USING (%s)',
      v_manage_expr
    );
  END IF;

  IF to_regclass('public.user_clinics') IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_clinics'
        AND column_name = 'branch_id'
    ) INTO v_has_branch_id;

    IF to_regprocedure('public.current_user_can_manage_clinic_scope(uuid,uuid)') IS NOT NULL THEN
      IF v_has_branch_id THEN
        v_manage_expr := 'public.current_user_can_manage_clinic_scope(clinic_id, branch_id)';
      ELSE
        v_manage_expr := 'public.current_user_can_manage_clinic_scope(clinic_id, NULL)';
      END IF;
    ELSE
      v_manage_expr := 'public.is_current_user_admin()';
    END IF;

    EXECUTE 'ALTER TABLE public.user_clinics ENABLE ROW LEVEL SECURITY';

    FOR p IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'user_clinics'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_clinics', p.policyname);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY user_clinics_select_scoped ON public.user_clinics FOR SELECT USING ((%s) OR (%s))',
      v_self_expr,
      v_manage_expr
    );
    EXECUTE format(
      'CREATE POLICY user_clinics_insert_admin_scope ON public.user_clinics FOR INSERT WITH CHECK (%s)',
      v_manage_expr
    );
    EXECUTE format(
      'CREATE POLICY user_clinics_update_admin_scope ON public.user_clinics FOR UPDATE USING (%s) WITH CHECK (%s)',
      v_manage_expr,
      v_manage_expr
    );
    EXECUTE format(
      'CREATE POLICY user_clinics_delete_admin_scope ON public.user_clinics FOR DELETE USING (%s)',
      v_manage_expr
    );
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Reduce attack surface: high-risk bootstrap RPCs should be service-only.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regprocedure('public.assign_user_to_clinic_branch(uuid,uuid,uuid,text,boolean,text[],uuid)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.assign_user_to_clinic_branch(UUID, UUID, UUID, TEXT, BOOLEAN, TEXT[], UUID) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.assign_user_to_clinic_branch(UUID, UUID, UUID, TEXT, BOOLEAN, TEXT[], UUID) FROM authenticated;
    GRANT EXECUTE ON FUNCTION public.assign_user_to_clinic_branch(UUID, UUID, UUID, TEXT, BOOLEAN, TEXT[], UUID) TO service_role;
  END IF;

  IF to_regprocedure('public.create_clinic_branch(uuid,text,text,text,boolean,uuid,boolean)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.create_clinic_branch(UUID, TEXT, TEXT, TEXT, BOOLEAN, UUID, BOOLEAN) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.create_clinic_branch(UUID, TEXT, TEXT, TEXT, BOOLEAN, UUID, BOOLEAN) FROM authenticated;
    GRANT EXECUTE ON FUNCTION public.create_clinic_branch(UUID, TEXT, TEXT, TEXT, BOOLEAN, UUID, BOOLEAN) TO service_role;
  END IF;

  IF to_regprocedure('public.create_clinic_with_main_branch(text,text,text,text,uuid,text,jsonb)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.create_clinic_with_main_branch(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, JSONB) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.create_clinic_with_main_branch(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, JSONB) FROM authenticated;
    GRANT EXECUTE ON FUNCTION public.create_clinic_with_main_branch(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, JSONB) TO service_role;
  END IF;

  IF to_regprocedure('public.bootstrap_clinic_branch_workspace(text,text,text,text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.bootstrap_clinic_branch_workspace(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.bootstrap_clinic_branch_workspace(TEXT, TEXT, TEXT, TEXT) FROM authenticated;
    GRANT EXECUTE ON FUNCTION public.bootstrap_clinic_branch_workspace(TEXT, TEXT, TEXT, TEXT) TO service_role;
  END IF;
END
$$;

COMMIT;
