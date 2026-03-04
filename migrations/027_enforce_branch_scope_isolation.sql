-- ============================================================================
-- 027_enforce_branch_scope_isolation.sql
-- Purpose:
-- 1) Enforce true branch-level membership checks (not clinic-only fallback).
-- 2) Make read scope checks branch-aware when branch_id is provided.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.user_has_branch_membership(
  p_user_id UUID,
  p_branch_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  IF p_user_id IS NULL OR p_branch_id IS NULL THEN
    RETURN false;
  END IF;

  IF to_regclass('public.clinic_branches') IS NULL THEN
    RETURN false;
  END IF;

  SELECT cb.clinic_id
  INTO v_clinic_id
  FROM public.clinic_branches cb
  WHERE cb.id = p_branch_id
  LIMIT 1;

  IF v_clinic_id IS NULL THEN
    RETURN false;
  END IF;

  IF to_regclass('public.user_clinics') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.user_clinics uc
      WHERE uc.user_id = p_user_id
        AND uc.clinic_id = v_clinic_id
        AND (uc.access_active IS NULL OR uc.access_active = true)
        AND uc.branch_id = p_branch_id
    ) THEN
      RETURN true;
    END IF;
  END IF;

  IF to_regclass('public.user_clinic_access') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.user_clinic_access uca
      WHERE uca.user_id = p_user_id
        AND uca.clinic_id = v_clinic_id
        AND (uca.is_active IS NULL OR uca.is_active = true)
        AND uca.branch_id = p_branch_id
    ) THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.user_has_branch_access(
  p_user_id UUID,
  p_branch_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_clinic_id UUID;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS NULL OR p_branch_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT cb.clinic_id
  INTO v_clinic_id
  FROM public.clinic_branches cb
  WHERE cb.id = p_branch_id
  LIMIT 1;

  IF v_clinic_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_user_id IS DISTINCT FROM auth.uid()
     AND NOT public.is_current_user_clinic_admin(v_clinic_id) THEN
    RETURN false;
  END IF;

  RETURN public.user_has_branch_membership(p_user_id, p_branch_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.current_user_can_read_clinic_scope(
  p_clinic_id UUID,
  p_branch_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_effective_clinic_id UUID;
  v_uid UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  v_effective_clinic_id := public.resolve_effective_clinic_id(p_clinic_id, p_branch_id);
  IF v_effective_clinic_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_branch_id IS NOT NULL THEN
    RETURN public.user_has_branch_access(v_uid, p_branch_id)
      OR public.is_current_user_clinic_admin(v_effective_clinic_id);
  END IF;

  RETURN public.current_user_has_clinic_membership(v_effective_clinic_id)
    OR public.is_current_user_clinic_admin(v_effective_clinic_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.user_has_branch_membership(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_has_branch_access(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_can_read_clinic_scope(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_branch_membership(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_branch_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_can_read_clinic_scope(UUID, UUID) TO authenticated;

COMMIT;
