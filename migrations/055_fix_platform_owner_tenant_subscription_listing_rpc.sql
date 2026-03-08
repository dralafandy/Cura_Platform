-- ============================================================================
-- 055_fix_platform_owner_tenant_subscription_listing_rpc.sql
-- Purpose:
-- 1) Make platform owner tenant subscription listing resilient across schemas.
-- 2) Avoid runtime failures when clinics/patients/user tables differ by env.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.platform_owner_is_authorized()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  v_role_claim TEXT;
BEGIN
  BEGIN
    v_role_claim := current_setting('request.jwt.claim.role', true);
  EXCEPTION
    WHEN OTHERS THEN
      v_role_claim := NULL;
  END;

  IF COALESCE(v_role_claim, '') = 'service_role' THEN
    RETURN true;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  RETURN public.is_platform_owner();
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_owner_list_tenant_subscriptions(
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  tenant_id UUID,
  tenant_name TEXT,
  tenant_slug TEXT,
  subscription_status TEXT,
  subscription_plan TEXT,
  trial_end_date DATE,
  subscription_end_date DATE,
  max_users INTEGER,
  max_patients INTEGER,
  max_clinics INTEGER,
  max_branches INTEGER,
  current_users BIGINT,
  current_patients BIGINT,
  current_clinics BIGINT,
  current_branches BIGINT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  v_search TEXT := NULLIF(BTRIM(COALESCE(p_search, '')), '');
  v_status TEXT := NULLIF(UPPER(BTRIM(COALESCE(p_status, ''))), '');
  v_offset INTEGER := GREATEST(0, COALESCE(p_offset, 0));
  v_limit INTEGER := LEAST(500, GREATEST(1, COALESCE(p_limit, 50)));
  v_has_user_profiles_tenant BOOLEAN := false;
  v_has_users_tenant BOOLEAN := false;
  v_has_patients_tenant BOOLEAN := false;
  v_has_patients_clinic BOOLEAN := false;
  v_has_patients_branch BOOLEAN := false;
  v_has_clinics_tenant BOOLEAN := false;
  v_has_user_clinic_access BOOLEAN := false;
  v_has_clinic_branches BOOLEAN := false;
  v_patient_predicates TEXT[] := ARRAY[]::TEXT[];
  v_current_users_sql TEXT := '0::BIGINT';
  v_current_patients_sql TEXT := '0::BIGINT';
  v_current_clinics_sql TEXT := '0::BIGINT';
  v_current_branches_sql TEXT := '0::BIGINT';
  v_sql TEXT;
BEGIN
  IF NOT public.platform_owner_is_authorized() THEN
    RAISE EXCEPTION 'Access denied: platform owner only' USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'tenant_id'
  ) INTO v_has_user_profiles_tenant;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'tenant_id'
  ) INTO v_has_users_tenant;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'patients'
      AND column_name = 'tenant_id'
  ) INTO v_has_patients_tenant;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'patients'
      AND column_name = 'clinic_id'
  ) INTO v_has_patients_clinic;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'patients'
      AND column_name = 'branch_id'
  ) INTO v_has_patients_branch;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clinics'
      AND column_name = 'tenant_id'
  ) INTO v_has_clinics_tenant;

  SELECT to_regclass('public.user_clinic_access') IS NOT NULL INTO v_has_user_clinic_access;
  SELECT to_regclass('public.clinic_branches') IS NOT NULL INTO v_has_clinic_branches;

  IF v_has_user_profiles_tenant THEN
    v_current_users_sql := '(SELECT COUNT(*)::BIGINT FROM public.user_profiles up WHERE up.tenant_id = t.id)';
  ELSIF v_has_users_tenant THEN
    v_current_users_sql := '(SELECT COUNT(*)::BIGINT FROM public.users u WHERE u.tenant_id = t.id)';
  END IF;

  IF v_has_patients_tenant THEN
    v_patient_predicates := array_append(v_patient_predicates, 'p.tenant_id = t.id');
  END IF;

  IF v_has_patients_clinic AND v_has_clinics_tenant THEN
    v_patient_predicates := array_append(v_patient_predicates, 'EXISTS (
      SELECT 1
      FROM public.clinics c
      WHERE c.id = p.clinic_id
        AND c.tenant_id = t.id
    )');
  END IF;

  IF v_has_patients_branch AND v_has_clinic_branches AND v_has_clinics_tenant THEN
    v_patient_predicates := array_append(v_patient_predicates, 'EXISTS (
      SELECT 1
      FROM public.clinic_branches cb
      JOIN public.clinics c ON c.id = cb.clinic_id
      WHERE cb.id = p.branch_id
        AND c.tenant_id = t.id
    )');
  END IF;

  IF v_has_patients_clinic AND v_has_user_clinic_access AND v_has_user_profiles_tenant THEN
    v_patient_predicates := array_append(v_patient_predicates, 'EXISTS (
      SELECT 1
      FROM public.user_clinic_access uca
      JOIN public.user_profiles up2 ON up2.id = uca.user_id
      WHERE uca.clinic_id = p.clinic_id
        AND up2.tenant_id = t.id
    )');
  END IF;

  IF v_has_patients_branch AND v_has_clinic_branches AND v_has_user_clinic_access AND v_has_user_profiles_tenant THEN
    v_patient_predicates := array_append(v_patient_predicates, 'EXISTS (
      SELECT 1
      FROM public.clinic_branches cb
      JOIN public.user_clinic_access uca ON uca.clinic_id = cb.clinic_id
      JOIN public.user_profiles up2 ON up2.id = uca.user_id
      WHERE cb.id = p.branch_id
        AND up2.tenant_id = t.id
    )');
  END IF;

  IF COALESCE(array_length(v_patient_predicates, 1), 0) > 0 THEN
    v_current_patients_sql := '(
      SELECT COUNT(DISTINCT p.id)::BIGINT
      FROM public.patients p
      WHERE ' || array_to_string(v_patient_predicates, ' OR ') || '
    )';
  END IF;

  IF v_has_clinics_tenant THEN
    v_current_clinics_sql := '(SELECT COUNT(*)::BIGINT FROM public.clinics c WHERE c.tenant_id = t.id)';
    IF v_has_clinic_branches THEN
      v_current_branches_sql := '(
        SELECT COUNT(*)::BIGINT
        FROM public.clinic_branches cb
        JOIN public.clinics c ON c.id = cb.clinic_id
        WHERE c.tenant_id = t.id
          AND COALESCE(cb.is_active, true) = true
      )';
    END IF;
  ELSIF v_has_user_clinic_access AND v_has_user_profiles_tenant THEN
    v_current_clinics_sql := '(
      SELECT COUNT(DISTINCT uca.clinic_id)::BIGINT
      FROM public.user_clinic_access uca
      JOIN public.user_profiles up2 ON up2.id = uca.user_id
      WHERE up2.tenant_id = t.id
    )';
    IF v_has_clinic_branches THEN
      v_current_branches_sql := '(
        SELECT COUNT(DISTINCT cb.id)::BIGINT
        FROM public.clinic_branches cb
        JOIN public.user_clinic_access uca ON uca.clinic_id = cb.clinic_id
        JOIN public.user_profiles up2 ON up2.id = uca.user_id
        WHERE up2.tenant_id = t.id
          AND COALESCE(cb.is_active, true) = true
      )';
    END IF;
  END IF;

  v_sql := format(
    $q$
    WITH scoped AS (
      SELECT t.*
      FROM public.tenants t
      WHERE ($1 IS NULL OR
        LOWER(COALESCE(t.name, '')) LIKE '%%' || LOWER($1) || '%%' OR
        LOWER(COALESCE(t.slug, '')) LIKE '%%' || LOWER($1) || '%%' OR
        LOWER(COALESCE(t.email, '')) LIKE '%%' || LOWER($1) || '%%')
        AND ($2 IS NULL OR UPPER(COALESCE(t.subscription_status, '')) = $2)
    )
    SELECT
      t.id AS tenant_id,
      t.name AS tenant_name,
      t.slug AS tenant_slug,
      COALESCE(t.subscription_status, 'UNKNOWN') AS subscription_status,
      COALESCE(t.subscription_plan, 'trial') AS subscription_plan,
      t.trial_end_date,
      t.subscription_end_date,
      t.max_users,
      t.max_patients,
      t.max_clinics,
      t.max_branches,
      %1$s AS current_users,
      %2$s AS current_patients,
      %3$s AS current_clinics,
      %4$s AS current_branches,
      COUNT(*) OVER()::BIGINT AS total_count
    FROM scoped t
    ORDER BY t.updated_at DESC NULLS LAST, t.created_at DESC NULLS LAST
    OFFSET $3
    LIMIT $4
    $q$,
    v_current_users_sql,
    v_current_patients_sql,
    v_current_clinics_sql,
    v_current_branches_sql
  );

  RETURN QUERY EXECUTE v_sql USING v_search, v_status, v_offset, v_limit;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.platform_owner_is_authorized() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.platform_owner_list_tenant_subscriptions(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.platform_owner_is_authorized() TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_owner_list_tenant_subscriptions(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;

COMMIT;
