-- ============================================================================
-- 035_fix_branch_session_profile_resolution.sql
-- Purpose:
-- 1) Make branch session functions work when user_profiles uses auth_id mapping.
-- 2) Keep branch context resolvable even when active_branch_id is still NULL.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.current_session_branch_id()
RETURNS UUID AS $$
DECLARE
  v_setting TEXT;
  v_branch_id UUID;
  v_auth_uid UUID;
  v_profile_uid UUID;
  v_has_auth_id BOOLEAN := false;
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

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'user_profiles'
      AND c.column_name = 'auth_id'
  ) INTO v_has_auth_id;

  IF to_regprocedure('public.resolve_user_profile_id(uuid)') IS NOT NULL THEN
    SELECT public.resolve_user_profile_id(v_auth_uid)
    INTO v_profile_uid;
  END IF;

  IF v_profile_uid IS NULL THEN
    v_profile_uid := v_auth_uid;
  END IF;

  IF to_regclass('public.user_profiles') IS NOT NULL THEN
    IF v_has_auth_id THEN
      SELECT up.active_branch_id
      INTO v_branch_id
      FROM public.user_profiles up
      WHERE up.id = v_profile_uid OR up.auth_id = v_auth_uid
      ORDER BY CASE WHEN up.id = v_profile_uid THEN 0 ELSE 1 END
      LIMIT 1;
    ELSE
      SELECT up.active_branch_id
      INTO v_branch_id
      FROM public.user_profiles up
      WHERE up.id = v_profile_uid
      LIMIT 1;
    END IF;
  END IF;

  IF v_branch_id IS NULL AND to_regclass('public.user_clinic_access') IS NOT NULL THEN
    IF v_has_auth_id THEN
      SELECT uca.branch_id
      INTO v_branch_id
      FROM public.user_clinic_access uca
      WHERE (uca.user_id = v_profile_uid OR uca.user_id = v_auth_uid)
        AND COALESCE(uca.is_active, true) = true
        AND uca.branch_id IS NOT NULL
      ORDER BY COALESCE(uca.is_default, false) DESC, uca.created_at ASC NULLS LAST
      LIMIT 1;
    ELSE
      SELECT uca.branch_id
      INTO v_branch_id
      FROM public.user_clinic_access uca
      WHERE uca.user_id = v_profile_uid
        AND COALESCE(uca.is_active, true) = true
        AND uca.branch_id IS NOT NULL
      ORDER BY COALESCE(uca.is_default, false) DESC, uca.created_at ASC NULLS LAST
      LIMIT 1;
    END IF;
  END IF;

  IF v_branch_id IS NULL AND to_regclass('public.user_clinics') IS NOT NULL THEN
    IF v_has_auth_id THEN
      SELECT uc.branch_id
      INTO v_branch_id
      FROM public.user_clinics uc
      WHERE (uc.user_id = v_profile_uid OR uc.user_id = v_auth_uid)
        AND COALESCE(uc.access_active, true) = true
        AND uc.branch_id IS NOT NULL
      ORDER BY COALESCE(uc.is_default, false) DESC, uc.created_at ASC NULLS LAST
      LIMIT 1;
    ELSE
      SELECT uc.branch_id
      INTO v_branch_id
      FROM public.user_clinics uc
      WHERE uc.user_id = v_profile_uid
        AND COALESCE(uc.access_active, true) = true
        AND uc.branch_id IS NOT NULL
      ORDER BY COALESCE(uc.is_default, false) DESC, uc.created_at ASC NULLS LAST
      LIMIT 1;
    END IF;
  END IF;

  RETURN v_branch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.set_current_branch(bid UUID)
RETURNS VOID AS $$
DECLARE
  v_allowed BOOLEAN := false;
  v_auth_uid UUID;
  v_profile_uid UUID;
  v_has_auth_id BOOLEAN := false;
BEGIN
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF bid IS NULL THEN
    RAISE EXCEPTION 'Branch id is required';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'user_profiles'
      AND c.column_name = 'auth_id'
  ) INTO v_has_auth_id;

  IF to_regprocedure('public.resolve_user_profile_id(uuid)') IS NOT NULL THEN
    SELECT public.resolve_user_profile_id(v_auth_uid)
    INTO v_profile_uid;
  END IF;

  IF v_profile_uid IS NULL THEN
    v_profile_uid := v_auth_uid;
  END IF;

  IF to_regclass('public.user_has_branch_membership') IS NOT NULL THEN
    SELECT public.user_has_branch_membership(v_auth_uid, bid) INTO v_allowed;

    IF COALESCE(v_allowed, false) = false AND v_profile_uid IS DISTINCT FROM v_auth_uid THEN
      SELECT public.user_has_branch_membership(v_profile_uid, bid) INTO v_allowed;
    END IF;
  END IF;

  IF COALESCE(v_allowed, false) = false AND to_regclass('public.current_user_can_read_clinic_scope') IS NOT NULL THEN
    SELECT public.current_user_can_read_clinic_scope(NULL, bid) INTO v_allowed;
  END IF;

  IF COALESCE(v_allowed, false) = false THEN
    RAISE EXCEPTION 'Access denied to branch %', bid;
  END IF;

  PERFORM set_config('app.current_branch_id', bid::TEXT, true);

  IF to_regclass('public.user_profiles') IS NOT NULL THEN
    IF v_has_auth_id THEN
      UPDATE public.user_profiles
      SET active_branch_id = bid,
          updated_at = NOW()
      WHERE id = v_profile_uid OR auth_id = v_auth_uid;
    ELSE
      UPDATE public.user_profiles
      SET active_branch_id = bid,
          updated_at = NOW()
      WHERE id = v_profile_uid;
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

CREATE OR REPLACE FUNCTION public.clear_current_branch()
RETURNS VOID AS $$
DECLARE
  v_auth_uid UUID;
  v_profile_uid UUID;
  v_has_auth_id BOOLEAN := false;
BEGIN
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'user_profiles'
      AND c.column_name = 'auth_id'
  ) INTO v_has_auth_id;

  IF to_regprocedure('public.resolve_user_profile_id(uuid)') IS NOT NULL THEN
    SELECT public.resolve_user_profile_id(v_auth_uid)
    INTO v_profile_uid;
  END IF;

  IF v_profile_uid IS NULL THEN
    v_profile_uid := v_auth_uid;
  END IF;

  PERFORM set_config('app.current_branch_id', '', true);

  IF to_regclass('public.user_profiles') IS NOT NULL THEN
    IF v_has_auth_id THEN
      UPDATE public.user_profiles
      SET active_branch_id = NULL,
          updated_at = NOW()
      WHERE id = v_profile_uid OR auth_id = v_auth_uid;
    ELSE
      UPDATE public.user_profiles
      SET active_branch_id = NULL,
          updated_at = NOW()
      WHERE id = v_profile_uid;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.current_session_branch_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_current_branch(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_current_branch(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.clear_current_branch() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_session_branch_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_branch(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_branch(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_current_branch() TO authenticated;

COMMIT;
