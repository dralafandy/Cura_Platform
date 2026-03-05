-- ============================================================================
-- 041_fix_branch_membership_resolution_and_clinic_wide_access.sql
-- Purpose:
-- 1) Resolve user membership checks across auth uid and profile id.
-- 2) Treat clinic-wide access (branch_id IS NULL) as valid for switching
--    between active branches within the same clinic.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.user_has_branch_membership(
  p_user_id UUID,
  p_branch_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_clinic_id UUID;
  v_profile_id UUID;
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
    AND COALESCE(cb.is_active, true) = true
  LIMIT 1;

  IF v_clinic_id IS NULL THEN
    RETURN false;
  END IF;

  v_profile_id := p_user_id;
  IF to_regprocedure('public.resolve_user_profile_id(uuid)') IS NOT NULL THEN
    SELECT public.resolve_user_profile_id(p_user_id)
    INTO v_profile_id;
  END IF;
  v_profile_id := COALESCE(v_profile_id, p_user_id);

  IF to_regclass('public.user_clinics') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.user_clinics uc
      WHERE (uc.user_id = p_user_id OR uc.user_id = v_profile_id)
        AND uc.clinic_id = v_clinic_id
        AND COALESCE(uc.access_active, true) = true
        AND (uc.branch_id = p_branch_id OR uc.branch_id IS NULL)
    ) THEN
      RETURN true;
    END IF;
  END IF;

  IF to_regclass('public.user_clinic_access') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.user_clinic_access uca
      WHERE (uca.user_id = p_user_id OR uca.user_id = v_profile_id)
        AND uca.clinic_id = v_clinic_id
        AND COALESCE(uca.is_active, true) = true
        AND (uca.branch_id = p_branch_id OR uca.branch_id IS NULL)
    ) THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.user_has_branch_membership(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_branch_membership(UUID, UUID) TO authenticated;

COMMIT;
