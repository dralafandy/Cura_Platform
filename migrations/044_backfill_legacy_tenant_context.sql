-- ============================================================================
-- 044_backfill_legacy_tenant_context.sql
-- Purpose:
-- 1) Bootstrap missing tenant context for legacy single-tenant data.
-- 2) Populate tenant_id on clinics, user_profiles, and users where NULL.
-- NOTE:
-- This migration is intended for legacy environments that effectively run as
-- a single tenant. Review before running on multi-tenant production data.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_has_tenants BOOLEAN;
  v_has_clinics_tenant BOOLEAN;
  v_has_user_profiles_tenant BOOLEAN;
  v_has_users_table BOOLEAN;
  v_has_users_tenant BOOLEAN;
  v_has_patients_table BOOLEAN;
  v_has_patients_tenant BOOLEAN;
  v_has_patients_clinic_id BOOLEAN;
  v_tenant_id UUID;
  v_slug TEXT;
BEGIN
  SELECT to_regclass('public.tenants') IS NOT NULL INTO v_has_tenants;
  IF NOT v_has_tenants THEN
    RAISE NOTICE 'Skipping: public.tenants table not found.';
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clinics'
      AND column_name = 'tenant_id'
  ) INTO v_has_clinics_tenant;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'tenant_id'
  ) INTO v_has_user_profiles_tenant;

  SELECT to_regclass('public.users') IS NOT NULL INTO v_has_users_table;
  IF v_has_users_table THEN
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'tenant_id'
    ) INTO v_has_users_tenant;
  ELSE
    v_has_users_tenant := false;
  END IF;

  SELECT to_regclass('public.patients') IS NOT NULL INTO v_has_patients_table;
  IF v_has_patients_table THEN
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
    ) INTO v_has_patients_clinic_id;
  ELSE
    v_has_patients_tenant := false;
    v_has_patients_clinic_id := false;
  END IF;

  IF NOT v_has_user_profiles_tenant AND NOT v_has_clinics_tenant THEN
    RAISE NOTICE 'Skipping: no tenant_id columns available on user_profiles/clinics.';
    RETURN;
  END IF;

  IF v_has_user_profiles_tenant THEN
    SELECT up.tenant_id
    INTO v_tenant_id
    FROM public.user_profiles up
    WHERE up.tenant_id IS NOT NULL
    ORDER BY up.updated_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF v_tenant_id IS NULL AND v_has_clinics_tenant THEN
    SELECT c.tenant_id
    INTO v_tenant_id
    FROM public.clinics c
    WHERE c.tenant_id IS NOT NULL
    ORDER BY c.updated_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF v_tenant_id IS NULL THEN
    v_slug := 'legacy-' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 12);
    INSERT INTO public.tenants (
      name,
      slug,
      subscription_status,
      subscription_plan,
      trial_start_date,
      trial_end_date,
      max_users,
      max_patients
    )
    VALUES (
      'Legacy Tenant',
      v_slug,
      'TRIAL',
      'trial',
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '14 days',
      50,
      5000
    )
    RETURNING id INTO v_tenant_id;
  END IF;

  IF v_has_clinics_tenant THEN
    UPDATE public.clinics
    SET tenant_id = v_tenant_id
    WHERE tenant_id IS NULL;
  END IF;

  IF v_has_user_profiles_tenant THEN
    UPDATE public.user_profiles
    SET tenant_id = v_tenant_id,
        updated_at = NOW()
    WHERE tenant_id IS NULL;
  END IF;

  IF v_has_users_table AND v_has_users_tenant THEN
    UPDATE public.users
    SET tenant_id = v_tenant_id
    WHERE tenant_id IS NULL;
  END IF;

  IF v_has_patients_tenant THEN
    -- First, infer patient tenant from linked clinic when possible.
    IF v_has_clinics_tenant AND v_has_patients_clinic_id THEN
      UPDATE public.patients p
      SET tenant_id = c.tenant_id
      FROM public.clinics c
      WHERE p.tenant_id IS NULL
        AND p.clinic_id = c.id
        AND c.tenant_id IS NOT NULL;
    END IF;

    -- Then fill any remaining legacy rows with the resolved tenant.
    UPDATE public.patients
    SET tenant_id = v_tenant_id
    WHERE tenant_id IS NULL;
  END IF;

  RAISE NOTICE 'Tenant backfill completed. Active tenant id: %', v_tenant_id;
END
$$;

COMMIT;
