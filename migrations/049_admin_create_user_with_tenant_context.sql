-- ============================================================================
-- 049_admin_create_user_with_tenant_context.sql
-- Purpose:
-- 1) Allow clinic admins to create users (including ADMIN) in clinic scope.
-- 2) Enforce tenant_id linking at creation time for user_profiles/users.
-- 3) Keep compatibility by reusing admin_create_non_admin_user_for_clinic.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_create_user_for_clinic(
  p_auth_user_id UUID,
  p_username TEXT,
  p_email TEXT,
  p_role TEXT DEFAULT 'ASSISTANT',
  p_status TEXT DEFAULT 'ACTIVE',
  p_clinic_id UUID DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL,
  p_dentist_id UUID DEFAULT NULL,
  p_is_default BOOLEAN DEFAULT true
)
RETURNS TABLE (
  user_id UUID,
  clinic_id UUID,
  access_table TEXT
) AS $$
DECLARE
  v_role TEXT := UPPER(COALESCE(BTRIM(p_role), 'ASSISTANT'));
  v_status TEXT := UPPER(COALESCE(BTRIM(p_status), 'ACTIVE'));
  v_create_role TEXT;
  v_tenant_id UUID;
  v_has_clinic_tenant BOOLEAN := false;
  v_has_users_tenant BOOLEAN := false;
  v_has_up_auth_id BOOLEAN := false;
  v_has_up_user_id BOOLEAN := false;
  v_has_uca_role BOOLEAN := false;
  v_has_uc_role BOOLEAN := false;
  v_existing_tenant UUID;
  v_created_user_id UUID;
  v_created_clinic_id UUID;
  v_created_access_table TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Missing target user id';
  END IF;
  IF p_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Missing clinic id';
  END IF;

  IF v_role NOT IN ('ADMIN', 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;
  IF v_status NOT IN ('ACTIVE', 'INACTIVE', 'SUSPENDED') THEN
    RAISE EXCEPTION 'Invalid user status';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clinics'
      AND column_name = 'tenant_id'
  ) INTO v_has_clinic_tenant;

  IF v_has_clinic_tenant THEN
    SELECT c.tenant_id
    INTO v_tenant_id
    FROM public.clinics c
    WHERE c.id = p_clinic_id
    LIMIT 1;
  END IF;

  IF v_role = 'ADMIN' AND v_has_clinic_tenant AND v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Clinic tenant_id is required to create ADMIN user';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'auth_id'
  ) INTO v_has_up_auth_id;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'user_id'
  ) INTO v_has_up_user_id;

  IF v_has_clinic_tenant AND v_tenant_id IS NOT NULL THEN
    IF v_has_up_auth_id THEN
      SELECT up.tenant_id
      INTO v_existing_tenant
      FROM public.user_profiles up
      WHERE up.id = p_auth_user_id OR up.auth_id = p_auth_user_id
      ORDER BY up.updated_at DESC NULLS LAST
      LIMIT 1;
    ELSE
      SELECT up.tenant_id
      INTO v_existing_tenant
      FROM public.user_profiles up
      WHERE up.id = p_auth_user_id
      ORDER BY up.updated_at DESC NULLS LAST
      LIMIT 1;
    END IF;

    IF v_existing_tenant IS NOT NULL AND v_existing_tenant IS DISTINCT FROM v_tenant_id THEN
      RAISE EXCEPTION 'Target user is already linked to another tenant';
    END IF;
  END IF;

  v_create_role := CASE WHEN v_role = 'ADMIN' THEN 'ASSISTANT' ELSE v_role END;

  SELECT created.user_id, created.clinic_id, created.access_table
  INTO v_created_user_id, v_created_clinic_id, v_created_access_table
  FROM public.admin_create_non_admin_user_for_clinic(
    p_auth_user_id,
    p_username,
    p_email,
    v_create_role,
    v_status,
    p_clinic_id,
    p_branch_id,
    CASE WHEN v_role = 'DOCTOR' THEN p_dentist_id ELSE NULL END,
    p_is_default
  ) created
  LIMIT 1;

  IF v_created_user_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create user in clinic scope';
  END IF;

  IF v_has_up_auth_id AND v_has_up_user_id THEN
    UPDATE public.user_profiles up
    SET
      role = v_role,
      status = v_status,
      dentist_id = CASE WHEN v_role = 'DOCTOR' THEN p_dentist_id ELSE NULL END,
      tenant_id = COALESCE(up.tenant_id, v_tenant_id),
      updated_at = NOW()
    WHERE up.id = p_auth_user_id
       OR up.auth_id = p_auth_user_id
       OR up.user_id = p_auth_user_id;
  ELSIF v_has_up_auth_id THEN
    UPDATE public.user_profiles up
    SET
      role = v_role,
      status = v_status,
      dentist_id = CASE WHEN v_role = 'DOCTOR' THEN p_dentist_id ELSE NULL END,
      tenant_id = COALESCE(up.tenant_id, v_tenant_id),
      updated_at = NOW()
    WHERE up.id = p_auth_user_id
       OR up.auth_id = p_auth_user_id;
  ELSIF v_has_up_user_id THEN
    UPDATE public.user_profiles up
    SET
      role = v_role,
      status = v_status,
      dentist_id = CASE WHEN v_role = 'DOCTOR' THEN p_dentist_id ELSE NULL END,
      tenant_id = COALESCE(up.tenant_id, v_tenant_id),
      updated_at = NOW()
    WHERE up.id = p_auth_user_id
       OR up.user_id = p_auth_user_id;
  ELSE
    UPDATE public.user_profiles up
    SET
      role = v_role,
      status = v_status,
      dentist_id = CASE WHEN v_role = 'DOCTOR' THEN p_dentist_id ELSE NULL END,
      tenant_id = COALESCE(up.tenant_id, v_tenant_id),
      updated_at = NOW()
    WHERE up.id = p_auth_user_id;
  END IF;

  IF to_regclass('public.users') IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'tenant_id'
    ) INTO v_has_users_tenant;

    IF v_has_users_tenant THEN
      UPDATE public.users u
      SET tenant_id = COALESCE(u.tenant_id, v_tenant_id)
      WHERE u.id = p_auth_user_id;
    END IF;
  END IF;

  IF v_role = 'ADMIN' THEN
    IF to_regclass('public.user_clinic_access') IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_clinic_access'
          AND column_name = 'role_at_clinic'
      ) INTO v_has_uca_role;

      IF v_has_uca_role THEN
        UPDATE public.user_clinic_access uca
        SET role_at_clinic = 'ADMIN'
        WHERE uca.user_id = v_created_user_id
          AND uca.clinic_id = p_clinic_id
          AND (
            p_branch_id IS NULL
            OR uca.branch_id IS NOT DISTINCT FROM p_branch_id
          );
      END IF;
    END IF;

    IF to_regclass('public.user_clinics') IS NOT NULL THEN
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_clinics'
          AND column_name = 'role_at_clinic'
      ) INTO v_has_uc_role;

      IF v_has_uc_role THEN
        UPDATE public.user_clinics uc
        SET role_at_clinic = 'ADMIN'
        WHERE uc.user_id = v_created_user_id
          AND uc.clinic_id = p_clinic_id
          AND (
            p_branch_id IS NULL
            OR uc.branch_id IS NOT DISTINCT FROM p_branch_id
          );
      END IF;
    END IF;
  END IF;

  RETURN QUERY
  SELECT v_created_user_id, v_created_clinic_id, v_created_access_table;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.admin_create_user_for_clinic(UUID, TEXT, TEXT, TEXT, TEXT, UUID, UUID, UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_create_user_for_clinic(UUID, TEXT, TEXT, TEXT, TEXT, UUID, UUID, UUID, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_tenant_invitation_secure(p_token TEXT)
RETURNS TABLE (
  tenant_id UUID,
  role TEXT,
  status TEXT
) AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT;
  v_tenant_id UUID;
  v_role TEXT;
  v_has_users_tenant BOOLEAN := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_token IS NULL OR btrim(p_token) = '' THEN
    RAISE EXCEPTION 'Invitation token is required';
  END IF;

  v_email := public.current_auth_user_email();
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'No authenticated email found';
  END IF;

  UPDATE public.tenant_invitations ti
  SET status = 'ACCEPTED'
  WHERE ti.token = p_token
    AND LOWER(ti.email) = v_email
    AND ti.status = 'PENDING'
    AND ti.expires_at > NOW()
  RETURNING ti.tenant_id, UPPER(COALESCE(ti.role, 'DOCTOR')), ti.status
  INTO v_tenant_id, v_role, status;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Invalid, expired, or already-used invitation token';
  END IF;

  role := CASE
    WHEN v_role IN ('ADMIN', 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST') THEN v_role
    ELSE 'DOCTOR'
  END;
  tenant_id := v_tenant_id;

  UPDATE public.user_profiles up
  SET
    tenant_id = COALESCE(up.tenant_id, v_tenant_id),
    role = CASE
      WHEN up.role IS NULL OR up.role = '' OR up.role = 'DOCTOR' THEN role
      ELSE up.role
    END,
    status = COALESCE(up.status, 'ACTIVE'),
    auth_id = COALESCE(up.auth_id, v_uid),
    updated_at = NOW()
  WHERE up.id = v_uid OR up.auth_id = v_uid;

  IF NOT FOUND THEN
    INSERT INTO public.user_profiles (id, auth_id, username, email, role, status, tenant_id, created_at, updated_at)
    SELECT
      v_uid,
      v_uid,
      COALESCE(NULLIF(SPLIT_PART(COALESCE(au.email, ''), '@', 1), ''), 'user_' || REPLACE(SUBSTRING(v_uid::text, 1, 8), '-', '')),
      au.email,
      role,
      'ACTIVE',
      v_tenant_id,
      NOW(),
      NOW()
    FROM auth.users au
    WHERE au.id = v_uid
    ON CONFLICT (id) DO UPDATE
    SET
      auth_id = COALESCE(public.user_profiles.auth_id, EXCLUDED.auth_id),
      tenant_id = COALESCE(public.user_profiles.tenant_id, EXCLUDED.tenant_id),
      role = CASE
        WHEN public.user_profiles.role IS NULL OR public.user_profiles.role = '' OR public.user_profiles.role = 'DOCTOR'
          THEN EXCLUDED.role
        ELSE public.user_profiles.role
      END,
      status = COALESCE(public.user_profiles.status, EXCLUDED.status),
      updated_at = NOW();
  END IF;

  IF to_regclass('public.users') IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'tenant_id'
    ) INTO v_has_users_tenant;

    IF v_has_users_tenant THEN
      UPDATE public.users u
      SET tenant_id = COALESCE(u.tenant_id, v_tenant_id)
      WHERE u.id = v_uid;
    END IF;
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.accept_tenant_invitation_secure(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_tenant_invitation_secure(TEXT) TO authenticated;

COMMIT;
