-- ============================================================================
-- 031_admin_update_user_profile_for_scope.sql
-- Purpose:
-- Allow clinic admins to update scoped user profile fields in selected clinic/branch.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_update_user_profile_for_scope(
  p_target_user_id UUID,
  p_username TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_clinic_id UUID DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  email TEXT,
  role TEXT,
  status TEXT,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_can_manage BOOLEAN := false;
  v_target_role TEXT;
  v_new_role TEXT := NULLIF(UPPER(BTRIM(COALESCE(p_role, ''))), '');
  v_new_status TEXT := NULLIF(UPPER(BTRIM(COALESCE(p_status, ''))), '');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user id is required';
  END IF;
  IF p_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Clinic id is required';
  END IF;

  BEGIN
    EXECUTE 'SELECT public.current_user_can_manage_clinic_scope($1, $2)'
      INTO v_can_manage
      USING p_clinic_id, p_branch_id;
  EXCEPTION
    WHEN undefined_function THEN
      BEGIN
        EXECUTE 'SELECT public.is_current_user_clinic_admin($1)'
          INTO v_can_manage
          USING p_clinic_id;
      EXCEPTION
        WHEN undefined_function THEN
          v_can_manage := false;
      END;
  END;

  IF NOT COALESCE(v_can_manage, false) THEN
    RAISE EXCEPTION 'Access denied: admin clinic scope required';
  END IF;

  SELECT scoped.role
  INTO v_target_role
  FROM public.admin_list_users_for_clinic(p_clinic_id, true, p_branch_id) scoped
  WHERE scoped.id = p_target_user_id
  LIMIT 1;

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'Target user is outside selected clinic/branch scope';
  END IF;

  IF UPPER(COALESCE(v_target_role, '')) = 'ADMIN' THEN
    RAISE EXCEPTION 'Access denied: cannot modify ADMIN from this flow';
  END IF;

  IF v_new_status IS NOT NULL AND v_new_status NOT IN ('ACTIVE', 'INACTIVE', 'SUSPENDED') THEN
    RAISE EXCEPTION 'Invalid status value';
  END IF;

  IF v_new_role IS NOT NULL AND v_new_role NOT IN ('DOCTOR', 'ASSISTANT', 'RECEPTIONIST') THEN
    RAISE EXCEPTION 'Invalid role value';
  END IF;

  UPDATE public.user_profiles up
  SET username = COALESCE(NULLIF(BTRIM(p_username), ''), up.username),
      status = COALESCE(v_new_status, up.status),
      role = COALESCE(v_new_role, up.role),
      updated_at = NOW()
  WHERE up.id = p_target_user_id;

  RETURN QUERY
  SELECT up.id,
         up.username::TEXT,
         up.email::TEXT,
         up.role::TEXT,
         up.status::TEXT,
         up.updated_at::TIMESTAMPTZ
  FROM public.user_profiles up
  WHERE up.id = p_target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.admin_update_user_profile_for_scope(UUID, TEXT, TEXT, TEXT, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_user_profile_for_scope(UUID, TEXT, TEXT, TEXT, UUID, UUID) TO authenticated;

COMMIT;
