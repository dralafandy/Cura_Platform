-- ============================================================================
-- 017_fix_clinic_created_by_fk.sql
-- Purpose:
-- 1) Ensure auth users are mapped to public.user_profiles (id/auth_id).
-- 2) Normalize clinics/clinic_branches created_by & updated_by to user_profiles.id.
-- 3) Prevent future FK failures via BEFORE INSERT/UPDATE trigger.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Ensure auth_id exists and is indexed (safe if already applied).
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_id ON public.user_profiles(auth_id);

-- ---------------------------------------------------------------------------
-- Backfill auth_id from matching profile ids.
-- ---------------------------------------------------------------------------
UPDATE public.user_profiles up
SET auth_id = up.id
WHERE up.auth_id IS NULL
  AND EXISTS (SELECT 1 FROM auth.users au WHERE au.id = up.id);

-- ---------------------------------------------------------------------------
-- Insert missing profiles for existing auth users (legacy safety).
-- ---------------------------------------------------------------------------
INSERT INTO public.user_profiles (id, auth_id, username, email, role, status, created_at, updated_at)
SELECT
  au.id,
  au.id,
  COALESCE(NULLIF(SPLIT_PART(COALESCE(au.email, ''), '@', 1), ''), 'user_' || REPLACE(SUBSTRING(au.id::text, 1, 8), '-', '')),
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

-- ---------------------------------------------------------------------------
-- Resolve profile id from either user_profiles.id or user_profiles.auth_id.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_user_profile_id(p_uid UUID)
RETURNS UUID AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  IF p_uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT up.id
  INTO v_profile_id
  FROM public.user_profiles up
  WHERE up.id = p_uid
  LIMIT 1;

  IF v_profile_id IS NOT NULL THEN
    RETURN v_profile_id;
  END IF;

  SELECT up.id
  INTO v_profile_id
  FROM public.user_profiles up
  WHERE up.auth_id = p_uid
  LIMIT 1;

  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

REVOKE EXECUTE ON FUNCTION public.resolve_user_profile_id(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_user_profile_id(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- One-time normalization for historical rows.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.clinics') IS NOT NULL THEN
    -- Remove unsafe defaults (if any) that may set created_by/updated_by to auth.uid() directly.
    EXECUTE 'ALTER TABLE public.clinics ALTER COLUMN created_by DROP DEFAULT';
    EXECUTE 'ALTER TABLE public.clinics ALTER COLUMN updated_by DROP DEFAULT';

    -- Map values that currently store auth.uid() into actual user_profiles.id
    UPDATE public.clinics c
    SET created_by = up.id
    FROM public.user_profiles up
    WHERE c.created_by = up.auth_id
      AND NOT EXISTS (SELECT 1 FROM public.user_profiles ok WHERE ok.id = c.created_by);

    UPDATE public.clinics c
    SET updated_by = up.id
    FROM public.user_profiles up
    WHERE c.updated_by = up.auth_id
      AND NOT EXISTS (SELECT 1 FROM public.user_profiles ok WHERE ok.id = c.updated_by);

    -- Null any orphan references to satisfy FK permanently
    UPDATE public.clinics c
    SET created_by = NULL
    WHERE c.created_by IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = c.created_by);

    UPDATE public.clinics c
    SET updated_by = NULL
    WHERE c.updated_by IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = c.updated_by);
  END IF;

  IF to_regclass('public.clinic_branches') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.clinic_branches ALTER COLUMN created_by DROP DEFAULT';
    EXECUTE 'ALTER TABLE public.clinic_branches ALTER COLUMN updated_by DROP DEFAULT';

    UPDATE public.clinic_branches cb
    SET created_by = up.id
    FROM public.user_profiles up
    WHERE cb.created_by = up.auth_id
      AND NOT EXISTS (SELECT 1 FROM public.user_profiles ok WHERE ok.id = cb.created_by);

    UPDATE public.clinic_branches cb
    SET updated_by = up.id
    FROM public.user_profiles up
    WHERE cb.updated_by = up.auth_id
      AND NOT EXISTS (SELECT 1 FROM public.user_profiles ok WHERE ok.id = cb.updated_by);

    UPDATE public.clinic_branches cb
    SET created_by = NULL
    WHERE cb.created_by IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = cb.created_by);

    UPDATE public.clinic_branches cb
    SET updated_by = NULL
    WHERE cb.updated_by IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = cb.updated_by);
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Trigger function: normalize created_by/updated_by before write.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_clinic_audit_user_refs()
RETURNS TRIGGER AS $$
DECLARE
  v_auth_uid UUID;
BEGIN
  v_auth_uid := auth.uid();

  IF TG_OP = 'INSERT' THEN
    NEW.created_by := public.resolve_user_profile_id(COALESCE(NEW.created_by, v_auth_uid));
    NEW.updated_by := public.resolve_user_profile_id(COALESCE(NEW.updated_by, NEW.created_by, v_auth_uid));
  ELSE
    NEW.created_by := public.resolve_user_profile_id(NEW.created_by);
    NEW.updated_by := public.resolve_user_profile_id(COALESCE(NEW.updated_by, v_auth_uid));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- ---------------------------------------------------------------------------
-- Attach triggers to clinics + clinic_branches.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.clinics') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_normalize_clinics_audit_refs ON public.clinics;
    CREATE TRIGGER trg_normalize_clinics_audit_refs
      BEFORE INSERT OR UPDATE ON public.clinics
      FOR EACH ROW EXECUTE FUNCTION public.normalize_clinic_audit_user_refs();
  END IF;

  IF to_regclass('public.clinic_branches') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_normalize_clinic_branches_audit_refs ON public.clinic_branches;
    CREATE TRIGGER trg_normalize_clinic_branches_audit_refs
      BEFORE INSERT OR UPDATE ON public.clinic_branches
      FOR EACH ROW EXECUTE FUNCTION public.normalize_clinic_audit_user_refs();
  END IF;
END
$$;

COMMIT;
