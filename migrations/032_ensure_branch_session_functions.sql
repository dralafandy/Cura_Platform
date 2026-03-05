-- ============================================================================
-- 032_ensure_branch_session_functions.sql
-- Purpose:
-- Ensure branch session helper functions exist even if prior migration failed.
-- ============================================================================

BEGIN;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS active_branch_id UUID REFERENCES public.clinic_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_active_branch_id
  ON public.user_profiles(active_branch_id);

CREATE OR REPLACE FUNCTION public.current_session_branch_id()
RETURNS UUID AS $$
DECLARE
  v_setting TEXT;
  v_branch_id UUID;
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

  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT up.active_branch_id
  INTO v_branch_id
  FROM public.user_profiles up
  WHERE up.id = auth.uid()
  LIMIT 1;

  RETURN v_branch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.current_session_clinic_id()
RETURNS UUID AS $$
DECLARE
  v_branch_id UUID;
  v_clinic_id UUID;
BEGIN
  v_branch_id := public.current_session_branch_id();
  IF v_branch_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT cb.clinic_id
  INTO v_clinic_id
  FROM public.clinic_branches cb
  WHERE cb.id = v_branch_id
  LIMIT 1;

  RETURN v_clinic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.set_current_branch(bid UUID)
RETURNS VOID AS $$
DECLARE
  v_allowed BOOLEAN := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF bid IS NULL THEN
    RAISE EXCEPTION 'Branch id is required';
  END IF;

  IF to_regclass('public.user_has_branch_membership') IS NOT NULL THEN
    SELECT public.user_has_branch_membership(auth.uid(), bid) INTO v_allowed;
  END IF;

  IF COALESCE(v_allowed, false) = false AND to_regclass('public.current_user_can_read_clinic_scope') IS NOT NULL THEN
    SELECT public.current_user_can_read_clinic_scope(NULL, bid) INTO v_allowed;
  END IF;

  IF COALESCE(v_allowed, false) = false THEN
    RAISE EXCEPTION 'Access denied to branch %', bid;
  END IF;

  PERFORM set_config('app.current_branch_id', bid::TEXT, true);

  UPDATE public.user_profiles
  SET active_branch_id = bid,
      updated_at = NOW()
  WHERE id = auth.uid();
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
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  PERFORM set_config('app.current_branch_id', '', true);

  UPDATE public.user_profiles
  SET active_branch_id = NULL,
      updated_at = NOW()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.current_session_branch_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_session_clinic_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_current_branch(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_current_branch(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.clear_current_branch() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_session_branch_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_session_clinic_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_branch(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_current_branch(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_current_branch() TO authenticated;

COMMIT;
