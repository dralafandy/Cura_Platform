-- ============================================================================
-- 015_sync_auth_users_and_fix_clinic_fk.sql
-- Purpose:
-- 1) Ensure auth users exist in public.user_profiles (to satisfy FK)
-- 2) Create a default clinic assignment for latest user if missing
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_user_id UUID;
  v_clinic_id UUID;
  v_fk_target_table TEXT;
  v_fk_target_schema TEXT;
  v_user_exists_in_fk BOOLEAN;
  v_users_has_username BOOLEAN;
  v_users_has_email BOOLEAN;
  v_users_has_password_hash BOOLEAN;
  v_users_has_role BOOLEAN;
  v_users_has_status BOOLEAN;
  v_users_has_created_at BOOLEAN;
  v_users_has_updated_at BOOLEAN;
BEGIN
  -- --------------------------------------------------------------------------
  -- Step 1: Backfill missing user_profiles from auth.users
  -- --------------------------------------------------------------------------
  IF to_regclass('auth.users') IS NOT NULL AND to_regclass('public.user_profiles') IS NOT NULL THEN
    INSERT INTO public.user_profiles (
      id,
      username,
      email,
      password_hash,
      role,
      status,
      created_at,
      updated_at
    )
    SELECT
      au.id,
      'user_' || replace(substr(au.id::text, 1, 8), '-', ''),
      COALESCE(au.email, 'user_' || replace(substr(au.id::text, 1, 8), '-', '') || '@local.invalid'),
      'OAUTH_MANAGED',
      'RECEPTIONIST',
      'ACTIVE',
      NOW(),
      NOW()
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON up.id = au.id
    WHERE up.id IS NULL;
  END IF;

  -- --------------------------------------------------------------------------
  -- Step 2: Detect FK target table for user_clinics.user_id
  -- --------------------------------------------------------------------------
  SELECT
    n_ref.nspname,
    c_ref.relname
  INTO v_fk_target_schema, v_fk_target_table
  FROM pg_constraint con
  JOIN pg_class c_src ON c_src.oid = con.conrelid
  JOIN pg_namespace n_src ON n_src.oid = c_src.relnamespace
  JOIN pg_attribute a_src ON a_src.attrelid = c_src.oid AND a_src.attnum = ANY(con.conkey)
  JOIN pg_class c_ref ON c_ref.oid = con.confrelid
  JOIN pg_namespace n_ref ON n_ref.oid = c_ref.relnamespace
  WHERE con.contype = 'f'
    AND n_src.nspname = 'public'
    AND c_src.relname = 'user_clinics'
    AND a_src.attname = 'user_id'
  LIMIT 1;

  -- If FK points to users, try to backfill users IDs from user_profiles
  IF v_fk_target_schema = 'public' AND v_fk_target_table = 'users' AND to_regclass('public.users') IS NOT NULL THEN
    BEGIN
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'username'
      ) INTO v_users_has_username;
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email'
      ) INTO v_users_has_email;
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password_hash'
      ) INTO v_users_has_password_hash;
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
      ) INTO v_users_has_role;
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'status'
      ) INTO v_users_has_status;
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'created_at'
      ) INTO v_users_has_created_at;
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'updated_at'
      ) INTO v_users_has_updated_at;

      IF v_users_has_username AND v_users_has_email AND v_users_has_password_hash THEN
        INSERT INTO public.users (id, username, email, password_hash, role, status, created_at, updated_at)
        SELECT
          up.id,
          COALESCE(NULLIF(up.username, ''), 'user_' || replace(substr(up.id::text, 1, 8), '-', '')),
          COALESCE(NULLIF(up.email, ''), NULLIF(au.email, ''), 'user_' || replace(substr(up.id::text, 1, 8), '-', '') || '@local.invalid'),
          COALESCE(NULLIF(up.password_hash, ''), 'SYNC_PLACEHOLDER'),
          CASE WHEN v_users_has_role THEN COALESCE(up.role, 'RECEPTIONIST') ELSE NULL END,
          CASE WHEN v_users_has_status THEN COALESCE(up.status, 'ACTIVE') ELSE NULL END,
          CASE WHEN v_users_has_created_at THEN COALESCE(up.created_at, NOW()) ELSE NULL END,
          CASE WHEN v_users_has_updated_at THEN COALESCE(up.updated_at, NOW()) ELSE NULL END
        FROM public.user_profiles up
        LEFT JOIN auth.users au ON au.id = up.id
        LEFT JOIN public.users u ON u.id = up.id
        WHERE u.id IS NULL;
      ELSIF v_users_has_email AND v_users_has_password_hash THEN
        INSERT INTO public.users (id, email, password_hash)
        SELECT
          up.id,
          COALESCE(NULLIF(up.email, ''), NULLIF(au.email, ''), 'user_' || replace(substr(up.id::text, 1, 8), '-', '') || '@local.invalid'),
          COALESCE(NULLIF(up.password_hash, ''), 'SYNC_PLACEHOLDER')
        FROM public.user_profiles up
        LEFT JOIN auth.users au ON au.id = up.id
        LEFT JOIN public.users u ON u.id = up.id
        WHERE u.id IS NULL;
      ELSIF v_users_has_email AND v_users_has_username THEN
        INSERT INTO public.users (id, username, email)
        SELECT
          up.id,
          COALESCE(NULLIF(up.username, ''), 'user_' || replace(substr(up.id::text, 1, 8), '-', '')),
          COALESCE(NULLIF(up.email, ''), NULLIF(au.email, ''), 'user_' || replace(substr(up.id::text, 1, 8), '-', '') || '@local.invalid')
        FROM public.user_profiles up
        LEFT JOIN auth.users au ON au.id = up.id
        LEFT JOIN public.users u ON u.id = up.id
        WHERE u.id IS NULL;
      ELSIF v_users_has_email THEN
        INSERT INTO public.users (id, email)
        SELECT
          up.id,
          COALESCE(NULLIF(up.email, ''), NULLIF(au.email, ''), 'user_' || replace(substr(up.id::text, 1, 8), '-', '') || '@local.invalid')
        FROM public.user_profiles up
        LEFT JOIN auth.users au ON au.id = up.id
        LEFT JOIN public.users u ON u.id = up.id
        WHERE u.id IS NULL;
      ELSIF v_users_has_username THEN
        INSERT INTO public.users (id, username)
        SELECT
          up.id,
          COALESCE(NULLIF(up.username, ''), 'user_' || replace(substr(up.id::text, 1, 8), '-', ''))
        FROM public.user_profiles up
        LEFT JOIN public.users u ON u.id = up.id
        WHERE u.id IS NULL;
      ELSE
        INSERT INTO public.users (id)
        SELECT up.id
        FROM public.user_profiles up
        LEFT JOIN public.users u ON u.id = up.id
        WHERE u.id IS NULL;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Could not auto-sync public.users from user_profiles: %', SQLERRM;
    END;
  END IF;

  -- --------------------------------------------------------------------------
  -- Step 3: Pick latest user from the FK target table
  -- --------------------------------------------------------------------------
  IF v_fk_target_schema = 'public' AND v_fk_target_table = 'users' AND to_regclass('public.users') IS NOT NULL THEN
    SELECT u.id
    INTO v_user_id
    FROM public.users u
    ORDER BY u.created_at DESC NULLS LAST, u.id
    LIMIT 1;
  ELSE
    SELECT up.id
    INTO v_user_id
    FROM public.user_profiles up
    ORDER BY up.created_at DESC NULLS LAST, up.id
    LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found in FK target table (%.%). Sync your user source table first.',
      COALESCE(v_fk_target_schema, 'unknown'),
      COALESCE(v_fk_target_table, 'unknown');
  END IF;

  -- Final hard check: ensure chosen user exists in FK target table before INSERT
  IF v_fk_target_schema IS NOT NULL AND v_fk_target_table IS NOT NULL THEN
    EXECUTE format(
      'SELECT EXISTS (SELECT 1 FROM %I.%I WHERE id = $1)',
      v_fk_target_schema,
      v_fk_target_table
    )
    INTO v_user_exists_in_fk
    USING v_user_id;

    IF COALESCE(v_user_exists_in_fk, false) = false THEN
      RAISE EXCEPTION 'Aborting assignment: user_id % does not exist in FK target %.%',
        v_user_id, v_fk_target_schema, v_fk_target_table;
    END IF;
  END IF;

  SELECT c.id
  INTO v_clinic_id
  FROM public.clinics c
  ORDER BY c.created_at DESC NULLS LAST, c.id
  LIMIT 1;

  IF v_clinic_id IS NULL THEN
    INSERT INTO public.clinics (id, name)
    VALUES (gen_random_uuid(), 'Main Clinic')
    RETURNING id INTO v_clinic_id;
  END IF;

  -- --------------------------------------------------------------------------
  -- Step 4: Insert assignment in whichever table exists
  -- --------------------------------------------------------------------------
  IF to_regclass('public.user_clinics') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.user_clinics uc
      WHERE uc.user_id = v_user_id
        AND uc.clinic_id = v_clinic_id
    ) THEN
      INSERT INTO public.user_clinics (user_id, clinic_id, role_at_clinic, access_active)
      VALUES (v_user_id, v_clinic_id, 'ADMIN', true);
    END IF;
  ELSIF to_regclass('public.user_clinic_access') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.user_clinic_access uca
      WHERE uca.user_id = v_user_id
        AND uca.clinic_id = v_clinic_id
        AND uca.branch_id IS NULL
    ) THEN
      INSERT INTO public.user_clinic_access (user_id, clinic_id, role_at_clinic, is_active, is_default)
      VALUES (v_user_id, v_clinic_id, 'ADMIN', true, true);
    END IF;
  ELSE
    RAISE NOTICE 'No clinic assignment table found (user_clinics / user_clinic_access).';
  END IF;

  RAISE NOTICE 'Sync+assignment complete. user_id=%, clinic_id=%', v_user_id, v_clinic_id;
END
$$;

COMMIT;

SELECT 'Auth->profile sync and clinic FK fix completed.' AS status;
