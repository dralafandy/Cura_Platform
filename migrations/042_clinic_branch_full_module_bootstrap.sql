-- ============================================================================
-- 042_clinic_branch_full_module_bootstrap.sql
-- Full Clinic/Branches module bootstrap from zero (idempotent).
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF to_regclass('public.user_profiles') IS NULL THEN
    RAISE EXCEPTION 'public.user_profiles is required before running migration 042';
  END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- Core tables
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(64),
  description TEXT,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  phone VARCHAR(30),
  email VARCHAR(255),
  website VARCHAR(255),
  logo_url TEXT,
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_clinics_code_nonnull
  ON public.clinics(code)
  WHERE code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.clinic_branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(64),
  branch_type TEXT NOT NULL DEFAULT 'BRANCH',
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  phone VARCHAR(30),
  email VARCHAR(255),
  operating_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_main_branch BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_clinic_branches_code_per_clinic_nonnull
  ON public.clinic_branches(clinic_id, code)
  WHERE code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.user_clinic_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.clinic_branches(id) ON DELETE SET NULL,
  role_at_clinic VARCHAR(50) NOT NULL DEFAULT 'DOCTOR',
  custom_permissions TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_clinic_access_clinic_wide
  ON public.user_clinic_access(user_id, clinic_id)
  WHERE branch_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_clinic_access_branch_scoped
  ON public.user_clinic_access(user_id, clinic_id, branch_id)
  WHERE branch_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.clinic_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.clinic_branches(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_clinic_settings_clinic_level
  ON public.clinic_settings(clinic_id)
  WHERE branch_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_clinic_settings_branch_level
  ON public.clinic_settings(clinic_id, branch_id)
  WHERE branch_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_row_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_clinics_updated_at') THEN
    CREATE TRIGGER trg_clinics_updated_at BEFORE UPDATE ON public.clinics
    FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_clinic_branches_updated_at') THEN
    CREATE TRIGGER trg_clinic_branches_updated_at BEFORE UPDATE ON public.clinic_branches
    FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_clinic_access_updated_at') THEN
    CREATE TRIGGER trg_user_clinic_access_updated_at BEFORE UPDATE ON public.user_clinic_access
    FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_clinic_settings_updated_at') THEN
    CREATE TRIGGER trg_clinic_settings_updated_at BEFORE UPDATE ON public.clinic_settings
    FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();
  END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- Auth/profile helpers
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.resolve_user_profile_id(p_uid UUID)
RETURNS UUID AS $$
DECLARE
  v_profile_id UUID;
  v_has_auth_id BOOLEAN := FALSE;
BEGIN
  IF p_uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'user_profiles'
      AND c.column_name = 'auth_id'
  ) INTO v_has_auth_id;

  IF v_has_auth_id THEN
    SELECT up.id INTO v_profile_id
    FROM public.user_profiles up
    WHERE up.id = p_uid OR up.auth_id = p_uid
    ORDER BY CASE WHEN up.id = p_uid THEN 0 ELSE 1 END
    LIMIT 1;
  ELSE
    SELECT up.id INTO v_profile_id
    FROM public.user_profiles up
    WHERE up.id = p_uid
    LIMIT 1;
  END IF;

  RETURN COALESCE(v_profile_id, p_uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.current_user_profile_id()
RETURNS UUID AS $$
BEGIN
  RETURN public.resolve_user_profile_id(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT up.role::text INTO v_role
  FROM public.user_profiles up
  WHERE up.id = public.current_user_profile_id()
  LIMIT 1;

  RETURN UPPER(COALESCE(v_role, '')) = 'ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.ensure_user_profile_exists(
  p_auth_user_id UUID,
  p_email TEXT DEFAULT NULL,
  p_username TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_profile_id UUID;
  v_username TEXT;
  v_has_auth_id BOOLEAN := FALSE;
BEGIN
  IF p_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'User id is required';
  END IF;

  v_profile_id := public.resolve_user_profile_id(p_auth_user_id);
  IF EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = v_profile_id) THEN
    RETURN v_profile_id;
  END IF;

  v_username := NULLIF(BTRIM(COALESCE(p_username, '')), '');
  IF v_username IS NULL THEN
    v_username := 'user_' || SUBSTRING(REPLACE(v_profile_id::text, '-', ''), 1, 8);
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'user_profiles'
      AND c.column_name = 'auth_id'
  ) INTO v_has_auth_id;

  IF v_has_auth_id THEN
    INSERT INTO public.user_profiles (id, auth_id, username, email, role, status, created_at, updated_at)
    VALUES (v_profile_id, p_auth_user_id, v_username, p_email, 'DOCTOR', 'ACTIVE', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  ELSE
    INSERT INTO public.user_profiles (id, username, email, role, status, created_at, updated_at)
    VALUES (v_profile_id, v_username, p_email, 'DOCTOR', 'ACTIVE', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

-- ----------------------------------------------------------------------------
-- Core workflow RPCs
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.assign_user_to_clinic_branch(
  p_target_user_id UUID,
  p_clinic_id UUID,
  p_branch_id UUID DEFAULT NULL,
  p_role_at_clinic TEXT DEFAULT 'DOCTOR',
  p_is_default BOOLEAN DEFAULT FALSE,
  p_custom_permissions TEXT[] DEFAULT ARRAY[]::text[],
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_auth_uid UUID := auth.uid();
  v_target_profile_id UUID;
  v_actor_profile_id UUID;
  v_access_id UUID;
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_target_user_id IS NULL OR p_clinic_id IS NULL THEN
    RAISE EXCEPTION 'target user and clinic are required';
  END IF;
  IF p_target_user_id IS DISTINCT FROM v_auth_uid AND NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Only admin can assign access for other users';
  END IF;

  v_target_profile_id := public.ensure_user_profile_exists(p_target_user_id, NULL, NULL);
  v_actor_profile_id := public.ensure_user_profile_exists(COALESCE(p_created_by, v_auth_uid), NULL, NULL);

  IF p_is_default THEN
    UPDATE public.user_clinic_access
    SET is_default = FALSE
    WHERE user_id = v_target_profile_id AND clinic_id = p_clinic_id;
  END IF;

  SELECT id INTO v_access_id
  FROM public.user_clinic_access
  WHERE user_id = v_target_profile_id
    AND clinic_id = p_clinic_id
    AND branch_id IS NOT DISTINCT FROM p_branch_id
  LIMIT 1;

  IF v_access_id IS NULL THEN
    INSERT INTO public.user_clinic_access (
      user_id, clinic_id, branch_id, role_at_clinic,
      custom_permissions, is_default, is_active, created_by
    )
    VALUES (
      v_target_profile_id, p_clinic_id, p_branch_id,
      COALESCE(NULLIF(BTRIM(p_role_at_clinic), ''), 'DOCTOR'),
      COALESCE(p_custom_permissions, ARRAY[]::text[]),
      COALESCE(p_is_default, FALSE), TRUE, v_actor_profile_id
    )
    RETURNING id INTO v_access_id;
  ELSE
    UPDATE public.user_clinic_access
    SET role_at_clinic = COALESCE(NULLIF(BTRIM(p_role_at_clinic), ''), role_at_clinic),
        custom_permissions = COALESCE(p_custom_permissions, custom_permissions),
        is_default = COALESCE(p_is_default, is_default),
        is_active = TRUE
    WHERE id = v_access_id;
  END IF;

  RETURN v_access_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.create_clinic_branch(
  p_clinic_id UUID,
  p_branch_name TEXT,
  p_branch_code TEXT DEFAULT NULL,
  p_branch_type TEXT DEFAULT 'BRANCH',
  p_set_as_main BOOLEAN DEFAULT FALSE,
  p_created_by UUID DEFAULT NULL,
  p_copy_clinic_wide_memberships BOOLEAN DEFAULT TRUE
)
RETURNS UUID AS $$
DECLARE
  v_auth_uid UUID := auth.uid();
  v_actor_profile_id UUID;
  v_branch_code TEXT;
  v_branch_id UUID;
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_clinic_id IS NULL OR COALESCE(BTRIM(p_branch_name), '') = '' THEN
    RAISE EXCEPTION 'clinic id and branch name are required';
  END IF;

  v_actor_profile_id := public.ensure_user_profile_exists(COALESCE(p_created_by, v_auth_uid), NULL, NULL);
  v_branch_code := UPPER(COALESCE(NULLIF(BTRIM(p_branch_code), ''), regexp_replace(p_branch_name, '[^A-Za-z0-9]+', '', 'g')));
  IF COALESCE(v_branch_code, '') = '' THEN
    v_branch_code := 'BR_' || SUBSTRING(REPLACE(uuid_generate_v4()::text, '-', ''), 1, 6);
  END IF;

  IF p_set_as_main THEN
    UPDATE public.clinic_branches SET is_main_branch = FALSE WHERE clinic_id = p_clinic_id;
  END IF;

  INSERT INTO public.clinic_branches (
    clinic_id, name, code, branch_type, is_active, is_main_branch, created_by, updated_by
  )
  VALUES (
    p_clinic_id, BTRIM(p_branch_name), v_branch_code, UPPER(COALESCE(NULLIF(BTRIM(p_branch_type), ''), 'BRANCH')),
    TRUE, COALESCE(p_set_as_main, FALSE), v_actor_profile_id, v_actor_profile_id
  )
  RETURNING id INTO v_branch_id;

  IF p_copy_clinic_wide_memberships THEN
    INSERT INTO public.user_clinic_access (
      user_id, clinic_id, branch_id, role_at_clinic, custom_permissions, is_default, is_active, created_by
    )
    SELECT uca.user_id, p_clinic_id, v_branch_id, uca.role_at_clinic, uca.custom_permissions, FALSE, TRUE, v_actor_profile_id
    FROM public.user_clinic_access uca
    WHERE uca.clinic_id = p_clinic_id
      AND uca.branch_id IS NULL
      AND COALESCE(uca.is_active, TRUE) = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM public.user_clinic_access existing
        WHERE existing.user_id = uca.user_id
          AND existing.clinic_id = p_clinic_id
          AND existing.branch_id = v_branch_id
      );
  END IF;

  RETURN v_branch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.create_clinic_with_main_branch(
  p_clinic_name TEXT,
  p_clinic_code TEXT DEFAULT NULL,
  p_main_branch_name TEXT DEFAULT 'Main Branch',
  p_main_branch_code TEXT DEFAULT 'MAIN',
  p_owner_user_id UUID DEFAULT NULL,
  p_owner_role TEXT DEFAULT 'ADMIN',
  p_settings JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (clinic_id UUID, main_branch_id UUID, owner_profile_id UUID) AS $$
DECLARE
  v_owner_auth_uid UUID := COALESCE(p_owner_user_id, auth.uid());
  v_owner_profile_id UUID;
  v_clinic_id UUID;
  v_branch_id UUID;
  v_clinic_code TEXT;
BEGIN
  IF COALESCE(BTRIM(p_clinic_name), '') = '' THEN
    RAISE EXCEPTION 'Clinic name is required';
  END IF;

  v_owner_profile_id := public.ensure_user_profile_exists(v_owner_auth_uid, NULL, NULL);
  v_clinic_code := UPPER(COALESCE(NULLIF(BTRIM(p_clinic_code), ''), regexp_replace(p_clinic_name, '[^A-Za-z0-9]+', '', 'g')));
  IF COALESCE(v_clinic_code, '') = '' THEN
    v_clinic_code := 'CLINIC_' || SUBSTRING(REPLACE(uuid_generate_v4()::text, '-', ''), 1, 6);
  END IF;

  INSERT INTO public.clinics (name, code, status, created_by, updated_by)
  VALUES (BTRIM(p_clinic_name), v_clinic_code, 'ACTIVE', v_owner_profile_id, v_owner_profile_id)
  RETURNING id INTO v_clinic_id;

  v_branch_id := public.create_clinic_branch(
    v_clinic_id,
    COALESCE(NULLIF(BTRIM(p_main_branch_name), ''), 'Main Branch'),
    COALESCE(NULLIF(BTRIM(p_main_branch_code), ''), 'MAIN'),
    'MAIN',
    TRUE,
    v_owner_auth_uid,
    FALSE
  );

  PERFORM public.assign_user_to_clinic_branch(v_owner_auth_uid, v_clinic_id, NULL, p_owner_role, TRUE, ARRAY[]::text[], v_owner_auth_uid);
  PERFORM public.assign_user_to_clinic_branch(v_owner_auth_uid, v_clinic_id, v_branch_id, p_owner_role, FALSE, ARRAY[]::text[], v_owner_auth_uid);

  INSERT INTO public.clinic_settings (clinic_id, branch_id, settings, created_by, updated_by)
  VALUES (v_clinic_id, NULL, COALESCE(p_settings, '{}'::jsonb), v_owner_profile_id, v_owner_profile_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.clinic_settings (clinic_id, branch_id, settings, created_by, updated_by)
  VALUES (v_clinic_id, v_branch_id, COALESCE(p_settings, '{}'::jsonb), v_owner_profile_id, v_owner_profile_id)
  ON CONFLICT DO NOTHING;

  clinic_id := v_clinic_id;
  main_branch_id := v_branch_id;
  owner_profile_id := v_owner_profile_id;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.bootstrap_clinic_branch_workspace(
  p_clinic_name TEXT DEFAULT 'Main Clinic',
  p_clinic_code TEXT DEFAULT 'MAIN',
  p_main_branch_name TEXT DEFAULT 'Main Branch',
  p_main_branch_code TEXT DEFAULT 'MAIN'
)
RETURNS TABLE (clinic_id UUID, main_branch_id UUID, owner_profile_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.create_clinic_with_main_branch(
    p_clinic_name,
    p_clinic_code,
    p_main_branch_name,
    p_main_branch_code,
    auth.uid(),
    'ADMIN',
    '{"appointment":{"defaultDuration":30},"finance":{"currency":"USD"}}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

-- ----------------------------------------------------------------------------
-- Branch-session membership/session RPCs (self-contained for branch switching)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_has_branch_membership(
  p_user_id UUID,
  p_branch_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_clinic_id UUID;
  v_profile_id UUID;
BEGIN
  IF p_user_id IS NULL OR p_branch_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT cb.clinic_id
  INTO v_clinic_id
  FROM public.clinic_branches cb
  WHERE cb.id = p_branch_id
    AND COALESCE(cb.is_active, TRUE) = TRUE
  LIMIT 1;

  IF v_clinic_id IS NULL THEN
    RETURN FALSE;
  END IF;

  v_profile_id := COALESCE(public.resolve_user_profile_id(p_user_id), p_user_id);

  IF to_regclass('public.user_clinics') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.user_clinics uc
      WHERE (uc.user_id = p_user_id OR uc.user_id = v_profile_id)
        AND uc.clinic_id = v_clinic_id
        AND COALESCE(uc.access_active, TRUE) = TRUE
        AND (uc.branch_id = p_branch_id OR uc.branch_id IS NULL)
    ) THEN
      RETURN TRUE;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.user_clinic_access uca
    WHERE (uca.user_id = p_user_id OR uca.user_id = v_profile_id)
      AND uca.clinic_id = v_clinic_id
      AND COALESCE(uca.is_active, TRUE) = TRUE
      AND (uca.branch_id = p_branch_id OR uca.branch_id IS NULL)
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.current_session_branch_id()
RETURNS UUID AS $$
DECLARE
  v_setting TEXT;
  v_branch_id UUID;
  v_auth_uid UUID;
  v_profile_uid UUID;
  v_has_auth_id BOOLEAN := FALSE;
  v_has_active_branch BOOLEAN := FALSE;
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

  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
    RETURN NULL;
  END IF;
  v_profile_uid := COALESCE(public.resolve_user_profile_id(v_auth_uid), v_auth_uid);

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'user_profiles'
      AND c.column_name = 'auth_id'
  ) INTO v_has_auth_id;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'user_profiles'
      AND c.column_name = 'active_branch_id'
  ) INTO v_has_active_branch;

  IF v_has_active_branch THEN
    IF v_has_auth_id THEN
      SELECT up.active_branch_id
      INTO v_branch_id
      FROM public.user_profiles up
      WHERE up.id = v_profile_uid OR up.id = v_auth_uid OR up.auth_id = v_auth_uid
      ORDER BY CASE WHEN up.id = v_profile_uid THEN 0 ELSE 1 END
      LIMIT 1;
    ELSE
      SELECT up.active_branch_id
      INTO v_branch_id
      FROM public.user_profiles up
      WHERE up.id = v_profile_uid OR up.id = v_auth_uid
      ORDER BY CASE WHEN up.id = v_profile_uid THEN 0 ELSE 1 END
      LIMIT 1;
    END IF;
  END IF;

  IF v_branch_id IS NULL THEN
    SELECT uca.branch_id
    INTO v_branch_id
    FROM public.user_clinic_access uca
    WHERE (uca.user_id = v_auth_uid OR uca.user_id = v_profile_uid)
      AND COALESCE(uca.is_active, TRUE) = TRUE
      AND uca.branch_id IS NOT NULL
    ORDER BY COALESCE(uca.is_default, FALSE) DESC, uca.created_at ASC NULLS LAST
    LIMIT 1;
  END IF;

  RETURN v_branch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.set_current_branch(bid UUID)
RETURNS VOID AS $$
DECLARE
  v_auth_uid UUID;
  v_profile_uid UUID;
  v_allowed BOOLEAN := FALSE;
  v_has_auth_id BOOLEAN := FALSE;
  v_has_active_branch BOOLEAN := FALSE;
BEGIN
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF bid IS NULL THEN
    RAISE EXCEPTION 'Branch id is required';
  END IF;

  v_profile_uid := COALESCE(public.resolve_user_profile_id(v_auth_uid), v_auth_uid);

  SELECT public.user_has_branch_membership(v_auth_uid, bid) INTO v_allowed;
  IF COALESCE(v_allowed, FALSE) = FALSE AND v_profile_uid IS DISTINCT FROM v_auth_uid THEN
    SELECT public.user_has_branch_membership(v_profile_uid, bid) INTO v_allowed;
  END IF;

  IF COALESCE(v_allowed, FALSE) = FALSE THEN
    RAISE EXCEPTION 'Access denied to branch %', bid;
  END IF;

  PERFORM set_config('app.current_branch_id', bid::TEXT, true);

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'user_profiles'
      AND c.column_name = 'auth_id'
  ) INTO v_has_auth_id;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'user_profiles'
      AND c.column_name = 'active_branch_id'
  ) INTO v_has_active_branch;

  IF v_has_active_branch THEN
    IF v_has_auth_id THEN
      UPDATE public.user_profiles
      SET active_branch_id = bid,
          updated_at = NOW()
      WHERE id = v_profile_uid OR id = v_auth_uid OR auth_id = v_auth_uid;
    ELSE
      UPDATE public.user_profiles
      SET active_branch_id = bid,
          updated_at = NOW()
      WHERE id = v_profile_uid OR id = v_auth_uid;
    END IF;
  END IF;
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

CREATE OR REPLACE FUNCTION public.set_current_branch_uuid(bid UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM public.set_current_branch(bid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.clear_current_branch()
RETURNS VOID AS $$
DECLARE
  v_auth_uid UUID;
  v_profile_uid UUID;
  v_has_auth_id BOOLEAN := FALSE;
  v_has_active_branch BOOLEAN := FALSE;
BEGIN
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_profile_uid := COALESCE(public.resolve_user_profile_id(v_auth_uid), v_auth_uid);
  PERFORM set_config('app.current_branch_id', '', true);

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'user_profiles'
      AND c.column_name = 'auth_id'
  ) INTO v_has_auth_id;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'user_profiles'
      AND c.column_name = 'active_branch_id'
  ) INTO v_has_active_branch;

  IF v_has_active_branch THEN
    IF v_has_auth_id THEN
      UPDATE public.user_profiles
      SET active_branch_id = NULL,
          updated_at = NOW()
      WHERE id = v_profile_uid OR id = v_auth_uid OR auth_id = v_auth_uid;
    ELSE
      UPDATE public.user_profiles
      SET active_branch_id = NULL,
          updated_at = NOW()
      WHERE id = v_profile_uid OR id = v_auth_uid;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

-- ----------------------------------------------------------------------------
-- Unified view for frontend
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.user_clinics_view AS
SELECT
  uca.id,
  uca.user_id,
  c.id AS clinic_id,
  c.name AS clinic_name,
  c.code AS clinic_code,
  cb.id AS branch_id,
  cb.name AS branch_name,
  cb.code AS branch_code,
  COALESCE(cb.is_main_branch, FALSE) AS is_main_branch,
  uca.role_at_clinic::varchar AS role_at_clinic,
  COALESCE(uca.custom_permissions, ARRAY[]::text[]) AS custom_permissions,
  COALESCE(uca.is_default, FALSE) AS is_default,
  COALESCE(uca.is_active, TRUE) AS access_active,
  c.status::text AS clinic_status,
  c.logo_url AS clinic_logo,
  uca.created_at,
  uca.updated_at,
  uca.created_by
FROM public.user_clinic_access uca
JOIN public.clinics c ON c.id = uca.clinic_id
LEFT JOIN public.clinic_branches cb ON cb.id = uca.branch_id
WHERE (uca.user_id = auth.uid() OR uca.user_id = public.current_user_profile_id())
  AND COALESCE(uca.is_active, TRUE) = TRUE;

-- ----------------------------------------------------------------------------
-- Grants
-- ----------------------------------------------------------------------------

REVOKE ALL ON TABLE public.user_clinics_view FROM anon;
REVOKE ALL ON TABLE public.user_clinics_view FROM PUBLIC;
GRANT SELECT ON TABLE public.user_clinics_view TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.clinics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.clinic_branches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_clinic_access TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.clinic_settings TO authenticated;

REVOKE EXECUTE ON FUNCTION public.resolve_user_profile_id(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_profile_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_user_profile_exists(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.assign_user_to_clinic_branch(UUID, UUID, UUID, TEXT, BOOLEAN, TEXT[], UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_clinic_branch(UUID, TEXT, TEXT, TEXT, BOOLEAN, UUID, BOOLEAN) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_clinic_with_main_branch(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bootstrap_clinic_branch_workspace(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_has_branch_membership(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_session_branch_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_current_branch(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_current_branch(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_current_branch_uuid(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.clear_current_branch() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.resolve_user_profile_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile_exists(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_user_to_clinic_branch(UUID, UUID, UUID, TEXT, BOOLEAN, TEXT[], UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_clinic_branch(UUID, TEXT, TEXT, TEXT, BOOLEAN, UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_clinic_with_main_branch(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_clinic_branch_workspace(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_branch_membership(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_session_branch_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_branch(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_branch(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_branch_uuid(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_current_branch() TO authenticated;

COMMIT;
