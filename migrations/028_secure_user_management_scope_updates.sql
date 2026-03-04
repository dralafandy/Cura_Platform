-- ============================================================================
-- 028_secure_user_management_scope_updates.sql
-- Purpose:
-- 1) Enforce clinic/branch-scoped authorization for role and permission updates.
-- 2) Prevent direct broad updates to user_profiles from frontend flows.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_update_user_permissions_for_scope(
  p_target_user_id UUID,
  p_custom_permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_override_permissions BOOLEAN DEFAULT false,
  p_clinic_id UUID DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  custom_permissions TEXT[],
  override_permissions BOOLEAN,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_can_manage BOOLEAN := false;
  v_target_role TEXT;
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
    RAISE EXCEPTION 'Access denied: cannot modify ADMIN permissions from this flow';
  END IF;

  RETURN QUERY
  UPDATE public.user_profiles up
  SET custom_permissions = COALESCE(p_custom_permissions, ARRAY[]::TEXT[]),
      override_permissions = COALESCE(p_override_permissions, false),
      updated_at = NOW()
  WHERE up.id = p_target_user_id
  RETURNING up.id,
            COALESCE(up.custom_permissions, ARRAY[]::TEXT[])::TEXT[],
            COALESCE(up.override_permissions, false)::BOOLEAN,
            up.updated_at::TIMESTAMPTZ;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user profile not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.admin_update_user_role_for_scope(
  p_target_user_id UUID,
  p_new_role TEXT,
  p_clinic_id UUID DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL,
  p_dentist_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  role TEXT,
  dentist_id UUID,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_can_manage BOOLEAN := false;
  v_target_role TEXT;
  v_new_role TEXT := UPPER(COALESCE(BTRIM(p_new_role), ''));
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
  IF v_new_role NOT IN ('DOCTOR', 'ASSISTANT', 'RECEPTIONIST') THEN
    RAISE EXCEPTION 'Only non-admin roles are allowed';
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
    RAISE EXCEPTION 'Access denied: cannot modify ADMIN role from this flow';
  END IF;

  RETURN QUERY
  UPDATE public.user_profiles up
  SET role = v_new_role,
      dentist_id = CASE WHEN v_new_role = 'DOCTOR' THEN p_dentist_id ELSE NULL END,
      updated_at = NOW()
  WHERE up.id = p_target_user_id
  RETURNING up.id,
            up.role::TEXT,
            up.dentist_id,
            up.updated_at::TIMESTAMPTZ;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user profile not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.admin_update_user_permissions_for_scope(UUID, TEXT[], BOOLEAN, UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_role_for_scope(UUID, TEXT, UUID, UUID, UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_update_user_permissions_for_scope(UUID, TEXT[], BOOLEAN, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role_for_scope(UUID, TEXT, UUID, UUID, UUID) TO authenticated;

COMMIT;
