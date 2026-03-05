-- ============================================================================
-- 036_reset_and_reseed_clinic_branch_user_scope.sql
-- Purpose:
-- 1) Purge experimental clinic/branch scoped data.
-- 2) Recreate a clean baseline clinic + branches.
-- 3) Re-link all existing user_profiles to the new baseline in a unified way.
--
-- WARNING:
-- - This is destructive for clinic/branch-scoped operational data.
-- - Intended only for non-production / experimental environments.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Step 1) Purge all clinic/branch-scoped tables (except identity/security tables)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_truncate_list TEXT;
  v_core_truncate_list TEXT;
BEGIN
  -- Core clinic scope tables (explicit): these may not have clinic_id/branch_id columns.
  SELECT string_agg(format('public.%I', t.tbl), ', ' ORDER BY t.tbl)
  INTO v_core_truncate_list
  FROM (
    SELECT 'clinic_settings'::TEXT AS tbl
    UNION ALL SELECT 'user_clinic_access'
    UNION ALL SELECT 'user_clinics'
    UNION ALL SELECT 'clinic_branches'
    UNION ALL SELECT 'clinics'
  ) t
  WHERE to_regclass(format('public.%I', t.tbl)) IS NOT NULL;

  IF v_core_truncate_list IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || v_core_truncate_list || ' RESTART IDENTITY CASCADE';
  END IF;

  SELECT string_agg(format('public.%I', t.table_name), ', ' ORDER BY t.table_name)
  INTO v_truncate_list
  FROM (
    SELECT DISTINCT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema
     AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND tb.table_type = 'BASE TABLE'
      AND c.column_name IN ('clinic_id', 'branch_id')
      AND c.table_name NOT IN (
        'user_profiles',
        'users',
        'roles',
        'role_permissions',
        'user_permission_overrides',
        'tenants',
        'subscription_plans',
        'subscription_invoices',
        'tenant_invitations',
        'tenant_usage_logs'
      )
  ) t;

  IF v_truncate_list IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || v_truncate_list || ' RESTART IDENTITY CASCADE';
  END IF;
END
$$;

-- Clear persisted active branch context for all users.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'active_branch_id'
  ) THEN
    EXECUTE '
      UPDATE public.user_profiles
      SET active_branch_id = NULL,
          updated_at = NOW()
      WHERE active_branch_id IS NOT NULL
    ';
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Step 2) Build new baseline clinic + branches
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_owner_profile_id UUID;
  v_clinic_id UUID;
  v_branch_main_id UUID;
  v_branch_secondary_id UUID;
  v_now TIMESTAMPTZ := NOW();
  v_has_auth_id BOOLEAN := false;
BEGIN
  -- Bootstrap user_profiles from auth.users if table is empty.
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles LIMIT 1) THEN
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'auth_id'
    ) INTO v_has_auth_id;

    IF v_has_auth_id THEN
      INSERT INTO public.user_profiles (id, auth_id, username, email, role, status, created_at, updated_at)
      SELECT
        au.id,
        au.id,
        COALESCE(
          NULLIF(SPLIT_PART(COALESCE(au.email, ''), '@', 1), ''),
          'user_' || REPLACE(SUBSTRING(au.id::TEXT, 1, 8), '-', '')
        ),
        au.email,
        'DOCTOR',
        'ACTIVE',
        NOW(),
        NOW()
      FROM auth.users au
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE up.id = au.id OR up.auth_id = au.id
      );
    ELSE
      INSERT INTO public.user_profiles (id, username, email, role, status, created_at, updated_at)
      SELECT
        au.id,
        COALESCE(
          NULLIF(SPLIT_PART(COALESCE(au.email, ''), '@', 1), ''),
          'user_' || REPLACE(SUBSTRING(au.id::TEXT, 1, 8), '-', '')
        ),
        au.email,
        'DOCTOR',
        'ACTIVE',
        NOW(),
        NOW()
      FROM auth.users au
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE up.id = au.id
      );
    END IF;
  END IF;

  SELECT up.id
  INTO v_owner_profile_id
  FROM public.user_profiles up
  ORDER BY
    CASE WHEN UPPER(COALESCE(up.role::TEXT, '')) = 'ADMIN' THEN 0 ELSE 1 END,
    up.created_at ASC NULLS LAST,
    up.id
  LIMIT 1;

  IF v_owner_profile_id IS NULL THEN
    RAISE EXCEPTION 'No rows found in public.user_profiles (and no bootstrap source in auth.users).';
  END IF;

  SELECT c.id
  INTO v_clinic_id
  FROM public.clinics c
  WHERE c.code = 'MAIN'
  ORDER BY c.created_at ASC NULLS LAST, c.id
  LIMIT 1;

  IF v_clinic_id IS NULL THEN
    INSERT INTO public.clinics (name, code)
    VALUES ('Main Clinic', 'MAIN')
    RETURNING id INTO v_clinic_id;
  ELSE
    UPDATE public.clinics
    SET name = 'Main Clinic'
    WHERE id = v_clinic_id;
  END IF;

  -- Set optional clinic metadata if columns are available.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinics' AND column_name = 'status'
  ) THEN
    UPDATE public.clinics
    SET status = 'ACTIVE'
    WHERE id = v_clinic_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinics' AND column_name = 'created_by'
  ) THEN
    UPDATE public.clinics
    SET created_by = v_owner_profile_id
    WHERE id = v_clinic_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinics' AND column_name = 'updated_by'
  ) THEN
    UPDATE public.clinics
    SET updated_by = v_owner_profile_id
    WHERE id = v_clinic_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinics' AND column_name = 'created_at'
  ) THEN
    UPDATE public.clinics
    SET created_at = v_now
    WHERE id = v_clinic_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinics' AND column_name = 'updated_at'
  ) THEN
    UPDATE public.clinics
    SET updated_at = v_now
    WHERE id = v_clinic_id;
  END IF;

  SELECT cb.id
  INTO v_branch_main_id
  FROM public.clinic_branches cb
  WHERE cb.clinic_id = v_clinic_id
    AND cb.code = 'MAIN'
  ORDER BY cb.created_at ASC NULLS LAST, cb.id
  LIMIT 1;

  IF v_branch_main_id IS NULL THEN
    INSERT INTO public.clinic_branches (clinic_id, name, code)
    VALUES (v_clinic_id, 'Main Branch', 'MAIN')
    RETURNING id INTO v_branch_main_id;
  ELSE
    UPDATE public.clinic_branches
    SET name = 'Main Branch'
    WHERE id = v_branch_main_id;
  END IF;

  SELECT cb.id
  INTO v_branch_secondary_id
  FROM public.clinic_branches cb
  WHERE cb.clinic_id = v_clinic_id
    AND cb.code = 'BR2'
  ORDER BY cb.created_at ASC NULLS LAST, cb.id
  LIMIT 1;

  IF v_branch_secondary_id IS NULL THEN
    INSERT INTO public.clinic_branches (clinic_id, name, code)
    VALUES (v_clinic_id, 'Branch 2', 'BR2')
    RETURNING id INTO v_branch_secondary_id;
  ELSE
    UPDATE public.clinic_branches
    SET name = 'Branch 2'
    WHERE id = v_branch_secondary_id;
  END IF;

  -- Set optional branch metadata if columns are available.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinic_branches' AND column_name = 'branch_type'
  ) THEN
    UPDATE public.clinic_branches
    SET branch_type = 'MAIN'
    WHERE id = v_branch_main_id;

    UPDATE public.clinic_branches
    SET branch_type = 'BRANCH'
    WHERE id = v_branch_secondary_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinic_branches' AND column_name = 'is_main_branch'
  ) THEN
    UPDATE public.clinic_branches
    SET is_main_branch = (id = v_branch_main_id)
    WHERE clinic_id = v_clinic_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinic_branches' AND column_name = 'is_active'
  ) THEN
    UPDATE public.clinic_branches
    SET is_active = TRUE
    WHERE clinic_id = v_clinic_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinic_branches' AND column_name = 'created_by'
  ) THEN
    UPDATE public.clinic_branches
    SET created_by = v_owner_profile_id
    WHERE clinic_id = v_clinic_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinic_branches' AND column_name = 'updated_by'
  ) THEN
    UPDATE public.clinic_branches
    SET updated_by = v_owner_profile_id
    WHERE clinic_id = v_clinic_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinic_branches' AND column_name = 'created_at'
  ) THEN
    UPDATE public.clinic_branches
    SET created_at = v_now
    WHERE clinic_id = v_clinic_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinic_branches' AND column_name = 'updated_at'
  ) THEN
    UPDATE public.clinic_branches
    SET updated_at = v_now
    WHERE clinic_id = v_clinic_id;
  END IF;

  -- -------------------------------------------------------------------------
  -- Step 3) Unified relink in canonical table: user_clinic_access
  -- -------------------------------------------------------------------------
  IF to_regclass('public.user_clinic_access') IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE public.user_clinic_access RESTART IDENTITY CASCADE';

    INSERT INTO public.user_clinic_access (user_id, clinic_id, branch_id)
    SELECT up.id, v_clinic_id, cb.id
    FROM public.user_profiles up
    JOIN public.clinic_branches cb
      ON cb.clinic_id = v_clinic_id
     AND COALESCE(cb.is_active, true) = true;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_clinic_access' AND column_name = 'role_at_clinic'
    ) THEN
      UPDATE public.user_clinic_access uca
      SET role_at_clinic = CASE
        WHEN UPPER(COALESCE(up.role::TEXT, '')) IN ('ADMIN', 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST')
          THEN UPPER(up.role::TEXT)
        ELSE 'RECEPTIONIST'
      END
      FROM public.user_profiles up
      WHERE up.id = uca.user_id;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_clinic_access' AND column_name = 'custom_permissions'
    ) THEN
      UPDATE public.user_clinic_access
      SET custom_permissions = ARRAY[]::TEXT[];
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_clinic_access' AND column_name = 'is_default'
    ) THEN
      UPDATE public.user_clinic_access
      SET is_default = (branch_id = v_branch_main_id);
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_clinic_access' AND column_name = 'is_active'
    ) THEN
      UPDATE public.user_clinic_access
      SET is_active = TRUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_clinic_access' AND column_name = 'created_by'
    ) THEN
      UPDATE public.user_clinic_access
      SET created_by = v_owner_profile_id;
    END IF;
  END IF;

  -- -------------------------------------------------------------------------
  -- Step 4) Sync legacy table user_clinics from canonical source (if exists)
  -- -------------------------------------------------------------------------
  IF to_regclass('public.user_clinics') IS NOT NULL AND to_regclass('public.user_clinic_access') IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE public.user_clinics RESTART IDENTITY CASCADE';

    INSERT INTO public.user_clinics (user_id, clinic_id, branch_id)
    SELECT uca.user_id, uca.clinic_id, uca.branch_id
    FROM public.user_clinic_access uca;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_clinics' AND column_name = 'role_at_clinic'
    ) THEN
      UPDATE public.user_clinics uc
      SET role_at_clinic = CASE
        WHEN UPPER(COALESCE(up.role::TEXT, '')) IN ('ADMIN', 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST')
          THEN UPPER(up.role::TEXT)
        ELSE 'RECEPTIONIST'
      END
      FROM public.user_profiles up
      WHERE up.id = uc.user_id;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_clinics' AND column_name = 'custom_permissions'
    ) THEN
      UPDATE public.user_clinics
      SET custom_permissions = ARRAY[]::TEXT[];
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_clinics' AND column_name = 'is_default'
    ) THEN
      UPDATE public.user_clinics
      SET is_default = (branch_id = v_branch_main_id);
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_clinics' AND column_name = 'access_active'
    ) THEN
      UPDATE public.user_clinics
      SET access_active = TRUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_clinics' AND column_name = 'is_active'
    ) THEN
      UPDATE public.user_clinics
      SET is_active = TRUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_clinics' AND column_name = 'created_by'
    ) THEN
      UPDATE public.user_clinics
      SET created_by = v_owner_profile_id;
    END IF;
  END IF;

  -- Set each user current active branch to the new main branch.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'active_branch_id'
  ) THEN
    UPDATE public.user_profiles
    SET active_branch_id = v_branch_main_id,
        updated_at = NOW();
  END IF;

  RAISE NOTICE 'Reset complete. Clinic=% MainBranch=% SecondaryBranch=% OwnerProfile=%',
    v_clinic_id, v_branch_main_id, v_branch_secondary_id, v_owner_profile_id;
END
$$;

COMMIT;

-- Optional sanity checks after execution:
-- SELECT count(*) AS clinics_count FROM public.clinics;
-- SELECT count(*) AS branches_count FROM public.clinic_branches;
-- SELECT count(*) AS user_access_count FROM public.user_clinic_access;
-- SELECT count(*) AS user_legacy_access_count FROM public.user_clinics;
