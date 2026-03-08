on_and_user_console.sql
-- Purpose:
-- 1) Add richer subscription limits (clinics/branches) and package permissions.
-- 2) Provide platform-owner RPCs for plans, tenants, and global user control.
-- 3) Keep strict security: platform owner or service_role only.
-- ============================================================================

BEGIN;

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS max_clinics INTEGER,
  ADD COLUMN IF NOT EXISTS max_branches INTEGER,
  ADD COLUMN IF NOT EXISTS package_permissions TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS max_clinics INTEGER,
  ADD COLUMN IF NOT EXISTS max_branches INTEGER,
  ADD COLUMN IF NOT EXISTS package_pe
  خقِXT[];

UPDATE public.subscription_plans
SET
  max_clinics = COALESCE(
    max_clinics,
    CASE LOWER(COALESCE(slug, ''))
      WHEN 'trial' THEN 1
      WHEN 'basic' THEN 1
      WHEN 'starter' THEN 1
      WHEN 'professional' THEN 3
      WHEN 'enterprise' THEN 999999
      ELSE 1
    END
  ),
  max_branches = COALESCE(
    max_branches,
    CASE LOWER(COALESCE(slug, ''))
      WHEN 'trial' THEN 1
      WHEN 'basic' THEN 2
      WHEN 'starter' THEN 2
      WHEN 'professional' THEN 8
      WHEN 'enterprise' THEN 999999
      ELSE 2
    END
  ),
  package_permissions = COALESCE(package_permissions, ARRAY[]::TEXT[]);

UPDATE public.tenants t
SET
  max_clinics = COALESCE(t.max_clinics, sp.max_clinics, 1),
  max_branches = COALESCE(t.max_branches, sp.max_branches, 2),
  package_permissions = COALESCE(t.package_permissions, sp.package_permissions, ARRAY[]::TEXT[])
FROM public.subscription_plans sp
WHERE LOWER(COALESCE(t.subscription_plan, 'trial')) = LOWER(sp.slug);

UPDATE public.tenants
SET
  max_clinics = COALESCE(max_clinics, 1),
  max_branches = COALESCE(max_branches, 2),
  package_permissions = COALESCE(package_permissions, ARRAY[]::TEXT[])
WHERE max_clinics IS NULL
   OR max_branches IS NULL
   OR package_permissions IS NULL;

ALTER TABLE public.subscription_plans
  ALTER COLUMN max_clinics SET DEFAULT 1,
  ALTER COLUMN max_branches SET DEFAULT 2,
  ALTER COLUMN package_permissions SET DEFAULT ARRAY[]::TEXT[];

ALTER TABLE public.tenants
  ALTER COLUMN max_clinics SET DEFAULT 1,
  ALTER COLUMN max_branches SET DEFAULT 2,
  ALTER COLUMN package_permissions SET DEFAULT ARRAY[]::TEXT[];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'subscription_plans_max_clinics_positive'
  ) THEN
    ALTER TABLE public.subscription_plans
      ADD CONSTRAINT subscription_plans_max_clinics_positive
      CHECK (max_clinics IS NULL OR max_clinics > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'subscription_plans_max_branches_positive'
  ) THEN
    ALTER TABLE public.subscription_plans
      ADD CONSTRAINT subscription_plans_max_branches_positive
      CHECK (max_branches IS NULL OR max_branches > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tenants_max_clinics_positive'
  ) THEN
    ALTER TABLE public.tenants
      ADD CONSTRAINT tenants_max_clinics_positive
      CHECK (max_clinics IS NULL OR max_clinics > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tenants_max_branches_positive'
  ) THEN
    ALTER TABLE public.tenants
      ADD CONSTRAINT tenants_max_branches_positive
      CHECK (max_branches IS NULL OR max_branches > 0);
  END IF;
END;
$$;

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

CREATE OR REPLACE FUNCTION public.platform_owner_list_subscription_plans()
RETURNS TABLE (
  id UUID,
  slug TEXT,
  name_ar TEXT,
  name_en TEXT,
  description TEXT,
  price_monthly NUMERIC,
  price_yearly NUMERIC,
  max_users INTEGER,
  max_patients INTEGER,
  max_clinics INTEGER,
  max_branches INTEGER,
  max_storage_mb INTEGER,
  package_permissions TEXT[],
  features JSONB,
  is_active BOOLEAN,
  is_trial BOOLEAN,
  trial_days INTEGER,
  sort_order INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.platform_owner_is_authorized() THEN
    RAISE EXCEPTION 'Access denied: platform owner only' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    sp.id,
    sp.slug,
    sp.name_ar,
    sp.name_en,
    sp.description,
    sp.price_monthly,
    sp.price_yearly,
    sp.max_users,
    sp.max_patients,
    sp.max_clinics,
    sp.max_branches,
    sp.max_storage_mb,
    COALESCE(sp.package_permissions, ARRAY[]::TEXT[]),
    COALESCE(sp.features, '[]'::JSONB),
    COALESCE(sp.is_active, true),
    COALESCE(sp.is_trial, false),
    COALESCE(sp.trial_days, 14),
    COALESCE(sp.sort_order, 0),
    sp.created_at,
    sp.updated_at
  FROM public.subscription_plans sp
  ORDER BY COALESCE(sp.sort_order, 0), sp.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.platform_owner_upsert_subscription_plan(
  p_plan_id UUID DEFAULT NULL,
  p_slug TEXT DEFAULT NULL,
  p_name_ar TEXT DEFAULT NULL,
  p_name_en TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_price_monthly NUMERIC DEFAULT 0,
  p_price_yearly NUMERIC DEFAULT 0,
  p_max_users INTEGER DEFAULT NULL,
  p_max_patients INTEGER DEFAULT NULL,
  p_max_clinics INTEGER DEFAULT NULL,
  p_max_branches INTEGER DEFAULT NULL,
  p_max_storage_mb INTEGER DEFAULT 1000,
  p_package_permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_features JSONB DEFAULT '[]'::JSONB,
  p_is_active BOOLEAN DEFAULT true,
  p_is_trial BOOLEAN DEFAULT false,
  p_trial_days INTEGER DEFAULT 14,
  p_sort_order INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  v_plan_id UUID;
  v_slug TEXT := LOWER(BTRIM(COALESCE(p_slug, '')));
BEGIN
  IF NOT public.platform_owner_is_authorized() THEN
    RAISE EXCEPTION 'Access denied: platform owner only' USING ERRCODE = '42501';
  END IF;

  IF v_slug = '' THEN
    RAISE EXCEPTION 'Plan slug is required';
  END IF;
  IF BTRIM(COALESCE(p_name_ar, '')) = '' THEN
    RAISE EXCEPTION 'Arabic plan name is required';
  END IF;
  IF BTRIM(COALESCE(p_name_en, '')) = '' THEN
    RAISE EXCEPTION 'English plan name is required';
  END IF;
  IF p_max_users IS NOT NULL AND p_max_users <= 0 THEN
    RAISE EXCEPTION 'max_users must be positive';
  END IF;
  IF p_max_patients IS NOT NULL AND p_max_patients <= 0 THEN
    RAISE EXCEPTION 'max_patients must be positive';
  END IF;
  IF p_max_clinics IS NOT NULL AND p_max_clinics <= 0 THEN
    RAISE EXCEPTION 'max_clinics must be positive';
  END IF;
  IF p_max_branches IS NOT NULL AND p_max_branches <= 0 THEN
    RAISE EXCEPTION 'max_branches must be positive';
  END IF;

  IF p_plan_id IS NOT NULL THEN
    UPDATE public.subscription_plans sp
    SET
      slug = v_slug,
      name_ar = BTRIM(p_name_ar),
      name_en = BTRIM(p_name_en),
      description = p_description,
      price_monthly = COALESCE(p_price_monthly, 0),
      price_yearly = COALESCE(p_price_yearly, 0),
      max_users = p_max_users,
      max_patients = p_max_patients,
      max_clinics = p_max_clinics,
      max_branches = p_max_branches,
      max_storage_mb = COALESCE(p_max_storage_mb, 1000),
      package_permissions = COALESCE(p_package_permissions, ARRAY[]::TEXT[]),
      features = COALESCE(p_features, '[]'::JSONB),
      is_active = COALESCE(p_is_active, true),
      is_trial = COALESCE(p_is_trial, false),
      trial_days = GREATEST(0, COALESCE(p_trial_days, 14)),
      sort_order = COALESCE(p_sort_order, 0),
      updated_at = NOW()
    WHERE sp.id = p_plan_id
    RETURNING sp.id INTO v_plan_id;
  END IF;

  IF v_plan_id IS NOT NULL THEN
    RETURN v_plan_id;
  END IF;

  INSERT INTO public.subscription_plans (
    slug,
    name_ar,
    name_en,
    description,
    price_monthly,
    price_yearly,
    max_users,
    max_patients,
    max_clinics,
    max_branches,
    max_storage_mb,
    package_permissions,
    features,
    is_active,
    is_trial,
    trial_days,
    sort_order,
    created_at,
    updated_at
  ) VALUES (
    v_slug,
    BTRIM(p_name_ar),
    BTRIM(p_name_en),
    p_description,
    COALESCE(p_price_monthly, 0),
    COALESCE(p_price_yearly, 0),
    p_max_users,
    p_max_patients,
    p_max_clinics,
    p_max_branches,
    COALESCE(p_max_storage_mb, 1000),
    COALESCE(p_package_permissions, ARRAY[]::TEXT[]),
    COALESCE(p_features, '[]'::JSONB),
    COALESCE(p_is_active, true),
    COALESCE(p_is_trial, false),
    GREATEST(0, COALESCE(p_trial_days, 14)),
    COALESCE(p_sort_order, 0),
    NOW(),
    NOW()
  )
  ON CONFLICT (slug) DO UPDATE
  SET
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    max_users = EXCLUDED.max_users,
    max_patients = EXCLUDED.max_patients,
    max_clinics = EXCLUDED.max_clinics,
    max_branches = EXCLUDED.max_branches,
    max_storage_mb = EXCLUDED.max_storage_mb,
    package_permissions = EXCLUDED.package_permissions,
    features = EXCLUDED.features,
    is_active = EXCLUDED.is_active,
    is_trial = EXCLUDED.is_trial,
    trial_days = EXCLUDED.trial_days,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW()
  RETURNING subscription_plans.id INTO v_plan_id;

  RETURN v_plan_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_owner_apply_subscription_plan(
  p_tenant_id UUID,
  p_plan_slug TEXT,
  p_subscription_status TEXT DEFAULT 'ACTIVE',
  p_duration_days INTEGER DEFAULT 30
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  v_plan public.subscription_plans%ROWTYPE;
  v_status TEXT := UPPER(BTRIM(COALESCE(p_subscription_status, 'ACTIVE')));
  v_duration_days INTEGER := GREATEST(1, COALESCE(p_duration_days, 30));
BEGIN
  IF NOT public.platform_owner_is_authorized() THEN
    RAISE EXCEPTION 'Access denied: platform owner only' USING ERRCODE = '42501';
  END IF;

  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant id is required';
  END IF;

  IF v_status NOT IN ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED') THEN
    RAISE EXCEPTION 'Invalid subscription status';
  END IF;

  SELECT *
  INTO v_plan
  FROM public.subscription_plans
  WHERE LOWER(slug) = LOWER(BTRIM(COALESCE(p_plan_slug, '')))
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan not found or inactive';
  END IF;

  UPDATE public.tenants t
  SET
    subscription_plan = v_plan.slug,
    subscription_status = v_status,
    trial_start_date = CASE
      WHEN v_status = 'TRIAL' THEN CURRENT_DATE
      ELSE t.trial_start_date
    END,
    trial_end_date = CASE
      WHEN v_status = 'TRIAL' THEN CURRENT_DATE + GREATEST(1, COALESCE(v_plan.trial_days, 14))
      ELSE t.trial_end_date
    END,
    subscription_start_date = CASE
      WHEN v_status = 'ACTIVE' THEN CURRENT_DATE
      ELSE t.subscription_start_date
    END,
    subscription_end_date = CASE
      WHEN v_status = 'ACTIVE' THEN CURRENT_DATE + v_duration_days
      WHEN v_status IN ('SUSPENDED', 'CANCELLED', 'EXPIRED') THEN CURRENT_DATE
      ELSE t.subscription_end_date
    END,
    max_users = COALESCE(v_plan.max_users, t.max_users),
    max_patients = COALESCE(v_plan.max_patients, t.max_patients),
    max_clinics = COALESCE(v_plan.max_clinics, t.max_clinics),
    max_branches = COALESCE(v_plan.max_branches, t.max_branches),
    package_permissions = COALESCE(v_plan.package_permissions, ARRAY[]::TEXT[]),
    updated_at = NOW()
  WHERE t.id = p_tenant_id;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.activate_subscription(p_tenant_id UUID, p_plan_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
BEGIN
  RETURN public.platform_owner_apply_subscription_plan(
    p_tenant_id,
    p_plan_slug,
    'ACTIVE',
    30
  );
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
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.platform_owner_list_users_with_tenant(
  p_search TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL,
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  auth_id UUID,
  username TEXT,
  email TEXT,
  role TEXT,
  status TEXT,
  tenant_id UUID,
  tenant_name TEXT,
  dentist_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  custom_permissions TEXT[],
  override_permissions BOOLEAN,
  total_count BIGINT
) AS $$
DECLARE
  v_search TEXT := NULLIF(BTRIM(COALESCE(p_search, '')), '');
  v_role TEXT := NULLIF(UPPER(BTRIM(COALESCE(p_role, ''))), '');
  v_status TEXT := NULLIF(UPPER(BTRIM(COALESCE(p_status, ''))), '');
  v_offset INTEGER := GREATEST(0, COALESCE(p_offset, 0));
  v_limit INTEGER := LEAST(500, GREATEST(1, COALESCE(p_limit, 50)));
BEGIN
  IF NOT public.platform_owner_is_authorized() THEN
    RAISE EXCEPTION 'Access denied: platform owner only' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    up.id::UUID,
    COALESCE(up.user_id, up.id)::UUID AS user_id,
    up.auth_id::UUID,
    up.username::TEXT,
    up.email::TEXT,
    COALESCE(up.role, 'ASSISTANT')::TEXT AS role,
    COALESCE(up.status, 'ACTIVE')::TEXT AS status,
    up.tenant_id::UUID AS tenant_id,
    t.name::TEXT AS tenant_name,
    up.dentist_id::UUID AS dentist_id,
    up.created_at::TIMESTAMPTZ,
    up.updated_at::TIMESTAMPTZ,
    up.last_login::TIMESTAMPTZ,
    COALESCE(up.custom_permissions, ARRAY[]::TEXT[])::TEXT[] AS custom_permissions,
    COALESCE(up.override_permissions, false)::BOOLEAN AS override_permissions,
    COUNT(*) OVER()::BIGINT AS total_count
  FROM public.user_profiles up
  LEFT JOIN public.tenants t ON t.id = up.tenant_id
  WHERE (v_search IS NULL OR
      LOWER(COALESCE(up.username, '')) LIKE '%' || LOWER(v_search) || '%' OR
      LOWER(COALESCE(up.email, '')) LIKE '%' || LOWER(v_search) || '%')
    AND (v_role IS NULL OR UPPER(COALESCE(up.role, '')) = v_role)
    AND (v_status IS NULL OR UPPER(COALESCE(up.status, '')) = v_status)
    AND (p_tenant_id IS NULL OR up.tenant_id IS NOT DISTINCT FROM p_tenant_id)
  ORDER BY up.created_at DESC
  OFFSET v_offset
  LIMIT v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.platform_owner_update_user_profile(
  p_target_user_id UUID,
  p_username TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  email TEXT,
  role TEXT,
  status TEXT,
  tenant_id UUID,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_role TEXT := NULLIF(UPPER(BTRIM(COALESCE(p_role, ''))), '');
  v_status TEXT := NULLIF(UPPER(BTRIM(COALESCE(p_status, ''))), '');
BEGIN
  IF NOT public.platform_owner_is_authorized() THEN
    RAISE EXCEPTION 'Access denied: platform owner only' USING ERRCODE = '42501';
  END IF;

  IF p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user id is required';
  END IF;

  IF v_role IS NOT NULL AND v_role NOT IN ('ADMIN', 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST') THEN
    RAISE EXCEPTION 'Invalid role value';
  END IF;
  IF v_status IS NOT NULL AND v_status NOT IN ('ACTIVE', 'INACTIVE', 'SUSPENDED') THEN
    RAISE EXCEPTION 'Invalid status value';
  END IF;

  RETURN QUERY
  UPDATE public.user_profiles up
  SET
    username = COALESCE(NULLIF(BTRIM(COALESCE(p_username, '')), ''), up.username),
    role = COALESCE(v_role, up.role),
    status = COALESCE(v_status, up.status),
    tenant_id = COALESCE(p_tenant_id, up.tenant_id),
    updated_at = NOW()
  WHERE up.id = p_target_user_id
  RETURNING
    up.id::UUID,
    up.username::TEXT,
    up.email::TEXT,
    up.role::TEXT,
    up.status::TEXT,
    up.tenant_id::UUID,
    up.updated_at::TIMESTAMPTZ;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user profile not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.platform_owner_update_user_permissions(
  p_target_user_id UUID,
  p_custom_permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_override_permissions BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  custom_permissions TEXT[],
  override_permissions BOOLEAN,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.platform_owner_is_authorized() THEN
    RAISE EXCEPTION 'Access denied: platform owner only' USING ERRCODE = '42501';
  END IF;

  IF p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user id is required';
  END IF;

  RETURN QUERY
  UPDATE public.user_profiles up
  SET
    custom_permissions = COALESCE(p_custom_permissions, ARRAY[]::TEXT[]),
    override_permissions = COALESCE(p_override_permissions, false),
    updated_at = NOW()
  WHERE up.id = p_target_user_id
  RETURNING
    up.id::UUID,
    COALESCE(up.custom_permissions, ARRAY[]::TEXT[])::TEXT[],
    COALESCE(up.override_permissions, false)::BOOLEAN,
    up.updated_at::TIMESTAMPTZ;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user profile not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.platform_owner_is_authorized() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.platform_owner_list_subscription_plans() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.platform_owner_upsert_subscription_plan(UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, TEXT[], JSONB, BOOLEAN, BOOLEAN, INTEGER, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.platform_owner_apply_subscription_plan(UUID, TEXT, TEXT, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.platform_owner_list_tenant_subscriptions(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.platform_owner_list_users_with_tenant(TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.platform_owner_update_user_profile(UUID, TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.platform_owner_update_user_permissions(UUID, TEXT[], BOOLEAN) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.platform_owner_is_authorized() TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_owner_list_subscription_plans() TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_owner_upsert_subscription_plan(UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, TEXT[], JSONB, BOOLEAN, BOOLEAN, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_owner_apply_subscription_plan(UUID, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_owner_list_tenant_subscriptions(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_owner_list_users_with_tenant(TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_owner_update_user_profile(UUID, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_owner_update_user_permissions(UUID, TEXT[], BOOLEAN) TO authenticated;

COMMIT;
