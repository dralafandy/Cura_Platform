-- ============================================================================
-- 056_enforce_patients_clinics_branches_limits.sql
-- Purpose:
-- 1) Provide robust tenant resource usage counters across mixed schemas.
-- 2) Extend check_limits() to users/patients/clinics/branches.
-- 3) Enforce hard insert limits at DB layer for patients/clinics/clinic_branches.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.compute_tenant_resource_usage(p_tenant_id UUID)
RETURNS TABLE (
  current_users BIGINT,
  current_patients BIGINT,
  current_clinics BIGINT,
  current_branches BIGINT,
  max_users INTEGER,
  max_patients INTEGER,
  max_clinics INTEGER,
  max_branches INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  v_has_user_profiles_tenant BOOLEAN := false;
  v_has_users_tenant BOOLEAN := false;
  v_has_patients_tenant BOOLEAN := false;
  v_has_patients_clinic BOOLEAN := false;
  v_has_patients_branch BOOLEAN := false;
  v_has_clinics_tenant BOOLEAN := false;
  v_has_user_clinic_access BOOLEAN := false;
  v_has_clinic_branches BOOLEAN := false;
  v_patient_predicates TEXT[] := ARRAY[]::TEXT[];
  v_patients_sql TEXT;
  v_current_users BIGINT := 0;
  v_current_patients BIGINT := 0;
  v_current_clinics BIGINT := 0;
  v_current_branches BIGINT := 0;
  v_max_users INTEGER := 0;
  v_max_patients INTEGER := 0;
  v_max_clinics INTEGER := 0;
  v_max_branches INTEGER := 0;
BEGIN
  IF p_tenant_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = p_tenant_id) THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'tenant_id'
  ) INTO v_has_user_profiles_tenant;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'tenant_id'
  ) INTO v_has_users_tenant;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'patients' AND column_name = 'tenant_id'
  ) INTO v_has_patients_tenant;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'patients' AND column_name = 'clinic_id'
  ) INTO v_has_patients_clinic;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'patients' AND column_name = 'branch_id'
  ) INTO v_has_patients_branch;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinics' AND column_name = 'tenant_id'
  ) INTO v_has_clinics_tenant;

  SELECT to_regclass('public.user_clinic_access') IS NOT NULL INTO v_has_user_clinic_access;
  SELECT to_regclass('public.clinic_branches') IS NOT NULL INTO v_has_clinic_branches;

  IF v_has_user_profiles_tenant THEN
    EXECUTE
      'SELECT COUNT(*)::BIGINT FROM public.user_profiles up
       WHERE up.tenant_id = $1 AND COALESCE(up.status, ''ACTIVE'') = ''ACTIVE'''
    USING p_tenant_id
    INTO v_current_users;
  ELSIF v_has_users_tenant THEN
    EXECUTE
      'SELECT COUNT(*)::BIGINT FROM public.users u WHERE u.tenant_id = $1'
    USING p_tenant_id
    INTO v_current_users;
  END IF;

  IF v_has_patients_tenant THEN
    v_patient_predicates := array_append(v_patient_predicates, 'p.tenant_id = $1');
  END IF;

  IF v_has_clinics_tenant AND v_has_patients_clinic THEN
    v_patient_predicates := array_append(v_patient_predicates, 'EXISTS (
      SELECT 1
      FROM public.clinics c
      WHERE c.id = p.clinic_id
        AND c.tenant_id = $1
    )');
  END IF;

  IF v_has_clinics_tenant AND v_has_patients_branch AND v_has_clinic_branches THEN
    v_patient_predicates := array_append(v_patient_predicates, 'EXISTS (
      SELECT 1
      FROM public.clinic_branches cb
      JOIN public.clinics c ON c.id = cb.clinic_id
      WHERE cb.id = p.branch_id
        AND c.tenant_id = $1
    )');
  END IF;

  IF v_has_user_clinic_access AND v_has_user_profiles_tenant AND v_has_patients_clinic THEN
    v_patient_predicates := array_append(v_patient_predicates, 'EXISTS (
      SELECT 1
      FROM public.user_clinic_access uca
      JOIN public.user_profiles up2 ON up2.id = uca.user_id
      WHERE uca.clinic_id = p.clinic_id
        AND up2.tenant_id = $1
    )');
  END IF;

  IF v_has_user_clinic_access AND v_has_user_profiles_tenant AND v_has_patients_branch AND v_has_clinic_branches THEN
    v_patient_predicates := array_append(v_patient_predicates, 'EXISTS (
      SELECT 1
      FROM public.clinic_branches cb
      JOIN public.user_clinic_access uca ON uca.clinic_id = cb.clinic_id
      JOIN public.user_profiles up2 ON up2.id = uca.user_id
      WHERE cb.id = p.branch_id
        AND up2.tenant_id = $1
    )');
  END IF;

  IF COALESCE(array_length(v_patient_predicates, 1), 0) > 0 THEN
    v_patients_sql := 'SELECT COUNT(DISTINCT p.id)::BIGINT
      FROM public.patients p
      WHERE ' || array_to_string(v_patient_predicates, ' OR ');

    EXECUTE v_patients_sql
    USING p_tenant_id
    INTO v_current_patients;
  END IF;

  IF v_has_clinics_tenant THEN
    EXECUTE
      'SELECT COUNT(*)::BIGINT FROM public.clinics c WHERE c.tenant_id = $1'
    USING p_tenant_id
    INTO v_current_clinics;
  ELSIF v_has_user_clinic_access AND v_has_user_profiles_tenant THEN
    EXECUTE
      'SELECT COUNT(DISTINCT uca.clinic_id)::BIGINT
       FROM public.user_clinic_access uca
       JOIN public.user_profiles up2 ON up2.id = uca.user_id
       WHERE up2.tenant_id = $1'
    USING p_tenant_id
    INTO v_current_clinics;
  END IF;

  IF v_has_clinic_branches THEN
    IF v_has_clinics_tenant THEN
      EXECUTE
        'SELECT COUNT(DISTINCT cb.id)::BIGINT
         FROM public.clinic_branches cb
         JOIN public.clinics c ON c.id = cb.clinic_id
         WHERE c.tenant_id = $1
           AND COALESCE(cb.is_active, TRUE) = TRUE'
      USING p_tenant_id
      INTO v_current_branches;
    ELSIF v_has_user_clinic_access AND v_has_user_profiles_tenant THEN
      EXECUTE
        'SELECT COUNT(DISTINCT cb.id)::BIGINT
         FROM public.clinic_branches cb
         JOIN public.user_clinic_access uca ON uca.clinic_id = cb.clinic_id
         JOIN public.user_profiles up2 ON up2.id = uca.user_id
         WHERE up2.tenant_id = $1
           AND COALESCE(cb.is_active, TRUE) = TRUE'
      USING p_tenant_id
      INTO v_current_branches;
    END IF;
  END IF;

  SELECT
    COALESCE(t.max_users, 2147483647),
    COALESCE(t.max_patients, 2147483647),
    COALESCE(t.max_clinics, 2147483647),
    COALESCE(t.max_branches, 2147483647)
  INTO
    v_max_users,
    v_max_patients,
    v_max_clinics,
    v_max_branches
  FROM public.tenants t
  WHERE t.id = p_tenant_id;

  RETURN QUERY
  SELECT
    v_current_users,
    v_current_patients,
    v_current_clinics,
    v_current_branches,
    v_max_users,
    v_max_patients,
    v_max_clinics,
    v_max_branches;
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
  v_resource TEXT := LOWER(BTRIM(COALESCE(p_resource, '')));
  v_usage RECORD;
BEGIN
  IF NOT public.assert_current_user_can_access_tenant(p_tenant_id, false) THEN
    RAISE EXCEPTION 'Access denied for tenant %', p_tenant_id USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_usage
  FROM public.compute_tenant_resource_usage(p_tenant_id)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0::BIGINT, 0, 'Tenant not found';
    RETURN;
  END IF;

  IF v_resource = 'users' THEN
    RETURN QUERY
    SELECT
      (v_usage.current_users < v_usage.max_users),
      v_usage.current_users,
      v_usage.max_users,
      CASE
        WHEN v_usage.current_users >= v_usage.max_users THEN 'User limit reached for current plan'
        ELSE 'OK'
      END;
  ELSIF v_resource = 'patients' THEN
    RETURN QUERY
    SELECT
      (v_usage.current_patients < v_usage.max_patients),
      v_usage.current_patients,
      v_usage.max_patients,
      CASE
        WHEN v_usage.current_patients >= v_usage.max_patients THEN 'Patient limit reached for current plan'
        ELSE 'OK'
      END;
  ELSIF v_resource = 'clinics' THEN
    RETURN QUERY
    SELECT
      (v_usage.current_clinics < v_usage.max_clinics),
      v_usage.current_clinics,
      v_usage.max_clinics,
      CASE
        WHEN v_usage.current_clinics >= v_usage.max_clinics THEN 'Clinic limit reached for current plan'
        ELSE 'OK'
      END;
  ELSIF v_resource = 'branches' THEN
    RETURN QUERY
    SELECT
      (v_usage.current_branches < v_usage.max_branches),
      v_usage.current_branches,
      v_usage.max_branches,
      CASE
        WHEN v_usage.current_branches >= v_usage.max_branches THEN 'Branch limit reached for current plan'
        ELSE 'OK'
      END;
  ELSE
    RETURN QUERY SELECT FALSE, 0::BIGINT, 0, 'Unsupported resource type';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_tenant_resource_limit(
  p_tenant_id UUID,
  p_resource TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  v_resource TEXT := LOWER(BTRIM(COALESCE(p_resource, '')));
  v_usage RECORD;
  v_current BIGINT;
  v_max INTEGER;
BEGIN
  IF p_tenant_id IS NULL THEN
    RETURN;
  END IF;

  SELECT *
  INTO v_usage
  FROM public.compute_tenant_resource_usage(p_tenant_id)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_resource = 'patients' THEN
    v_current := v_usage.current_patients;
    v_max := v_usage.max_patients;
  ELSIF v_resource = 'clinics' THEN
    v_current := v_usage.current_clinics;
    v_max := v_usage.max_clinics;
  ELSIF v_resource = 'branches' THEN
    v_current := v_usage.current_branches;
    v_max := v_usage.max_branches;
  ELSIF v_resource = 'users' THEN
    v_current := v_usage.current_users;
    v_max := v_usage.max_users;
  ELSE
    RETURN;
  END IF;

  IF v_current >= v_max THEN
    RAISE EXCEPTION '% limit reached (%/%). Cannot add more.',
      INITCAP(v_resource), v_current, v_max
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_subscription_resource_limits_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  v_resource TEXT;
  v_payload JSONB := to_jsonb(NEW);
  v_tenant_text TEXT;
  v_clinic_text TEXT;
  v_branch_text TEXT;
  v_user_text TEXT;
  v_created_by_text TEXT;
  v_tenant_id UUID;
  v_clinic_id UUID;
  v_branch_id UUID;
  v_user_id UUID;
  v_created_by UUID;
  v_has_clinics_tenant BOOLEAN := false;
  v_has_user_profiles_tenant BOOLEAN := false;
  v_has_users_tenant BOOLEAN := false;
  v_has_user_profiles_auth_id BOOLEAN := false;
BEGIN
  IF TG_TABLE_NAME = 'patients' THEN
    v_resource := 'patients';
  ELSIF TG_TABLE_NAME = 'clinics' THEN
    v_resource := 'clinics';
  ELSIF TG_TABLE_NAME = 'clinic_branches' THEN
    v_resource := 'branches';
  ELSE
    RETURN NEW;
  END IF;

  v_tenant_text := NULLIF(BTRIM(COALESCE(v_payload->>'tenant_id', '')), '');
  v_clinic_text := NULLIF(BTRIM(COALESCE(v_payload->>'clinic_id', '')), '');
  v_branch_text := NULLIF(BTRIM(COALESCE(v_payload->>'branch_id', '')), '');
  v_user_text := NULLIF(BTRIM(COALESCE(v_payload->>'user_id', '')), '');
  v_created_by_text := NULLIF(BTRIM(COALESCE(v_payload->>'created_by', '')), '');

  BEGIN
    v_tenant_id := CASE WHEN v_tenant_text IS NULL THEN NULL ELSE v_tenant_text::UUID END;
  EXCEPTION
    WHEN OTHERS THEN v_tenant_id := NULL;
  END;
  BEGIN
    v_clinic_id := CASE WHEN v_clinic_text IS NULL THEN NULL ELSE v_clinic_text::UUID END;
  EXCEPTION
    WHEN OTHERS THEN v_clinic_id := NULL;
  END;
  BEGIN
    v_branch_id := CASE WHEN v_branch_text IS NULL THEN NULL ELSE v_branch_text::UUID END;
  EXCEPTION
    WHEN OTHERS THEN v_branch_id := NULL;
  END;
  BEGIN
    v_user_id := CASE WHEN v_user_text IS NULL THEN NULL ELSE v_user_text::UUID END;
  EXCEPTION
    WHEN OTHERS THEN v_user_id := NULL;
  END;
  BEGIN
    v_created_by := CASE WHEN v_created_by_text IS NULL THEN NULL ELSE v_created_by_text::UUID END;
  EXCEPTION
    WHEN OTHERS THEN v_created_by := NULL;
  END;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinics' AND column_name = 'tenant_id'
  ) INTO v_has_clinics_tenant;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'tenant_id'
  ) INTO v_has_user_profiles_tenant;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'tenant_id'
  ) INTO v_has_users_tenant;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'auth_id'
  ) INTO v_has_user_profiles_auth_id;

  IF v_tenant_id IS NULL AND v_clinic_id IS NOT NULL AND v_has_clinics_tenant THEN
    EXECUTE
      'SELECT c.tenant_id FROM public.clinics c WHERE c.id = $1 LIMIT 1'
    USING v_clinic_id
    INTO v_tenant_id;
  END IF;

  IF v_tenant_id IS NULL AND v_branch_id IS NOT NULL AND v_has_clinics_tenant AND to_regclass('public.clinic_branches') IS NOT NULL THEN
    EXECUTE
      'SELECT c.tenant_id
       FROM public.clinic_branches cb
       JOIN public.clinics c ON c.id = cb.clinic_id
       WHERE cb.id = $1
       LIMIT 1'
    USING v_branch_id
    INTO v_tenant_id;
  END IF;

  IF v_tenant_id IS NULL AND v_user_id IS NOT NULL AND v_has_user_profiles_tenant THEN
    IF v_has_user_profiles_auth_id THEN
      EXECUTE
        'SELECT up.tenant_id
         FROM public.user_profiles up
         WHERE up.id = $1 OR up.auth_id = $1
         LIMIT 1'
      USING v_user_id
      INTO v_tenant_id;
    ELSE
      EXECUTE
        'SELECT up.tenant_id
         FROM public.user_profiles up
         WHERE up.id = $1
         LIMIT 1'
      USING v_user_id
      INTO v_tenant_id;
    END IF;
  END IF;

  IF v_tenant_id IS NULL AND v_user_id IS NOT NULL AND v_has_users_tenant THEN
    EXECUTE
      'SELECT u.tenant_id FROM public.users u WHERE u.id = $1 LIMIT 1'
    USING v_user_id
    INTO v_tenant_id;
  END IF;

  IF v_tenant_id IS NULL AND v_created_by IS NOT NULL AND v_has_user_profiles_tenant THEN
    IF v_has_user_profiles_auth_id THEN
      EXECUTE
        'SELECT up.tenant_id
         FROM public.user_profiles up
         WHERE up.id = $1 OR up.auth_id = $1
         LIMIT 1'
      USING v_created_by
      INTO v_tenant_id;
    ELSE
      EXECUTE
        'SELECT up.tenant_id
         FROM public.user_profiles up
         WHERE up.id = $1
         LIMIT 1'
      USING v_created_by
      INTO v_tenant_id;
    END IF;
  END IF;

  IF v_tenant_id IS NULL THEN
    BEGIN
      v_tenant_id := public.current_user_tenant_id();
    EXCEPTION
      WHEN undefined_function THEN
        v_tenant_id := NULL;
      WHEN OTHERS THEN
        v_tenant_id := NULL;
    END;
  END IF;

  PERFORM public.enforce_tenant_resource_limit(v_tenant_id, v_resource);
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.patients') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_enforce_limit_patients_insert'
  ) THEN
    CREATE TRIGGER trg_enforce_limit_patients_insert
    BEFORE INSERT ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.enforce_subscription_resource_limits_on_insert();
  END IF;

  IF to_regclass('public.clinics') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_enforce_limit_clinics_insert'
  ) THEN
    CREATE TRIGGER trg_enforce_limit_clinics_insert
    BEFORE INSERT ON public.clinics
    FOR EACH ROW EXECUTE FUNCTION public.enforce_subscription_resource_limits_on_insert();
  END IF;

  IF to_regclass('public.clinic_branches') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_enforce_limit_branches_insert'
  ) THEN
    CREATE TRIGGER trg_enforce_limit_branches_insert
    BEFORE INSERT ON public.clinic_branches
    FOR EACH ROW EXECUTE FUNCTION public.enforce_subscription_resource_limits_on_insert();
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.compute_tenant_resource_usage(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_tenant_resource_limit(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_subscription_resource_limits_on_insert() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_limits(UUID, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.check_limits(UUID, TEXT) TO authenticated;

COMMIT;
