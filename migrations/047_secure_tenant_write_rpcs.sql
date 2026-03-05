-- ============================================================================
-- 047_secure_tenant_write_rpcs.sql
-- Purpose:
-- 1) Move tenant write paths to secured RPCs.
-- 2) Revoke direct authenticated writes on tenants/tenant_invitations.
-- 3) Keep all tenant writes scoped and auditable.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.create_tenant_for_current_user(
  p_name TEXT,
  p_slug TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS TABLE (
  tenant_id UUID,
  user_id UUID
) AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_tenant_id UUID;
  v_slug TEXT;
  v_email TEXT;
  v_username TEXT;
  v_has_auth_id BOOLEAN := false;
  v_has_users_table BOOLEAN := false;
  v_has_users_tenant BOOLEAN := false;
  v_has_users_email BOOLEAN := false;
  v_has_users_owner BOOLEAN := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RAISE EXCEPTION 'Tenant name is required';
  END IF;

  v_slug := lower(btrim(COALESCE(p_slug, '')));
  IF v_slug = '' THEN
    RAISE EXCEPTION 'Tenant slug is required';
  END IF;
  IF v_slug !~ '^[a-z0-9-]+$' THEN
    RAISE EXCEPTION 'Tenant slug can only contain lowercase letters, numbers, and dashes';
  END IF;

  IF EXISTS (SELECT 1 FROM public.tenants t WHERE lower(t.slug) = v_slug) THEN
    RAISE EXCEPTION 'Tenant slug is already in use';
  END IF;

  SELECT lower(au.email)
  INTO v_email
  FROM auth.users au
  WHERE au.id = v_uid
  LIMIT 1;

  INSERT INTO public.tenants (
    name,
    slug,
    email,
    phone,
    subscription_status,
    subscription_plan,
    trial_start_date,
    trial_end_date,
    max_users,
    max_patients
  )
  VALUES (
    btrim(p_name),
    v_slug,
    COALESCE(NULLIF(lower(btrim(p_email)), ''), v_email),
    COALESCE(NULLIF(btrim(p_phone), ''), ''),
    'TRIAL',
    'trial',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '14 days',
    2,
    100
  )
  RETURNING id INTO v_tenant_id;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'user_profiles'
      AND c.column_name = 'auth_id'
  ) INTO v_has_auth_id;

  IF v_has_auth_id THEN
    UPDATE public.user_profiles up
    SET
      tenant_id = v_tenant_id,
      role = 'ADMIN',
      status = COALESCE(up.status, 'ACTIVE'),
      auth_id = COALESCE(up.auth_id, v_uid),
      updated_at = NOW()
    WHERE up.id = v_uid OR up.auth_id = v_uid;
  ELSE
    UPDATE public.user_profiles up
    SET
      tenant_id = v_tenant_id,
      role = 'ADMIN',
      status = COALESCE(up.status, 'ACTIVE'),
      updated_at = NOW()
    WHERE up.id = v_uid;
  END IF;

  IF NOT FOUND THEN
    v_username := COALESCE(
      NULLIF(split_part(COALESCE(v_email, ''), '@', 1), ''),
      'user_' || replace(substring(v_uid::text, 1, 8), '-', '')
    );

    IF v_has_auth_id THEN
      INSERT INTO public.user_profiles (id, auth_id, username, email, role, status, tenant_id, created_at, updated_at)
      VALUES (v_uid, v_uid, v_username, v_email, 'ADMIN', 'ACTIVE', v_tenant_id, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE
      SET
        auth_id = COALESCE(public.user_profiles.auth_id, EXCLUDED.auth_id),
        tenant_id = EXCLUDED.tenant_id,
        role = 'ADMIN',
        status = 'ACTIVE',
        updated_at = NOW();
    ELSE
      INSERT INTO public.user_profiles (id, username, email, role, status, tenant_id, created_at, updated_at)
      VALUES (v_uid, v_username, v_email, 'ADMIN', 'ACTIVE', v_tenant_id, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE
      SET
        tenant_id = EXCLUDED.tenant_id,
        role = 'ADMIN',
        status = 'ACTIVE',
        updated_at = NOW();
    END IF;
  END IF;

  SELECT to_regclass('public.users') IS NOT NULL INTO v_has_users_table;
  IF v_has_users_table THEN
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = 'users'
        AND c.column_name = 'tenant_id'
    ) INTO v_has_users_tenant;

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = 'users'
        AND c.column_name = 'email'
    ) INTO v_has_users_email;

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = 'users'
        AND c.column_name = 'is_owner'
    ) INTO v_has_users_owner;

    BEGIN
      IF v_has_users_tenant AND v_has_users_email AND v_has_users_owner THEN
        INSERT INTO public.users (id, email, tenant_id, is_owner)
        VALUES (v_uid, v_email, v_tenant_id, true)
        ON CONFLICT (id) DO UPDATE
        SET tenant_id = EXCLUDED.tenant_id,
            is_owner = true;
      ELSIF v_has_users_tenant AND v_has_users_email THEN
        INSERT INTO public.users (id, email, tenant_id)
        VALUES (v_uid, v_email, v_tenant_id)
        ON CONFLICT (id) DO UPDATE
        SET tenant_id = EXCLUDED.tenant_id;
      ELSIF v_has_users_tenant THEN
        INSERT INTO public.users (id, tenant_id)
        VALUES (v_uid, v_tenant_id)
        ON CONFLICT (id) DO UPDATE
        SET tenant_id = EXCLUDED.tenant_id;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- Keep tenant creation successful even if legacy users table shape is incompatible.
        NULL;
    END;
  END IF;

  RETURN QUERY SELECT v_tenant_id, v_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.update_tenant_secure(
  p_tenant_id UUID,
  p_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_logo_url TEXT DEFAULT NULL,
  p_primary_color TEXT DEFAULT NULL,
  p_secondary_color TEXT DEFAULT NULL,
  p_brand_name TEXT DEFAULT NULL,
  p_settings JSONB DEFAULT NULL,
  p_features JSONB DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL
)
RETURNS public.tenants AS $$
DECLARE
  v_row public.tenants%ROWTYPE;
BEGIN
  IF NOT public.assert_current_user_can_access_tenant(p_tenant_id, true) THEN
    RAISE EXCEPTION 'Access denied for tenant %', p_tenant_id USING ERRCODE = '42501';
  END IF;

  UPDATE public.tenants t
  SET
    name = COALESCE(NULLIF(btrim(p_name), ''), t.name),
    email = CASE
      WHEN p_email IS NULL THEN t.email
      WHEN btrim(p_email) = '' THEN NULL
      ELSE lower(btrim(p_email))
    END,
    phone = CASE
      WHEN p_phone IS NULL THEN t.phone
      WHEN btrim(p_phone) = '' THEN NULL
      ELSE btrim(p_phone)
    END,
    address = CASE
      WHEN p_address IS NULL THEN t.address
      WHEN btrim(p_address) = '' THEN NULL
      ELSE btrim(p_address)
    END,
    description = CASE
      WHEN p_description IS NULL THEN t.description
      WHEN btrim(p_description) = '' THEN NULL
      ELSE p_description
    END,
    logo_url = CASE
      WHEN p_logo_url IS NULL THEN t.logo_url
      WHEN btrim(p_logo_url) = '' THEN NULL
      ELSE btrim(p_logo_url)
    END,
    primary_color = CASE
      WHEN p_primary_color IS NULL THEN t.primary_color
      WHEN btrim(p_primary_color) = '' THEN NULL
      ELSE btrim(p_primary_color)
    END,
    secondary_color = CASE
      WHEN p_secondary_color IS NULL THEN t.secondary_color
      WHEN btrim(p_secondary_color) = '' THEN NULL
      ELSE btrim(p_secondary_color)
    END,
    brand_name = CASE
      WHEN p_brand_name IS NULL THEN t.brand_name
      WHEN btrim(p_brand_name) = '' THEN NULL
      ELSE btrim(p_brand_name)
    END,
    settings = COALESCE(p_settings, t.settings),
    features = COALESCE(p_features, t.features),
    payment_method = COALESCE(NULLIF(btrim(p_payment_method), ''), t.payment_method),
    updated_at = NOW()
  WHERE t.id = p_tenant_id
  RETURNING t.* INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tenant not found';
  END IF;

  RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.create_tenant_invitation_secure(
  p_tenant_id UUID,
  p_email TEXT,
  p_role TEXT DEFAULT 'DOCTOR',
  p_expires_in_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  id UUID,
  token TEXT,
  expires_at TIMESTAMPTZ
) AS $$
DECLARE
  v_role TEXT := UPPER(COALESCE(NULLIF(btrim(p_role), ''), 'DOCTOR'));
  v_token TEXT := gen_random_uuid()::TEXT;
  v_invited_by UUID;
  v_expiry_days INTEGER := GREATEST(1, COALESCE(p_expires_in_days, 7));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Tenant id is required';
  END IF;

  IF NOT public.assert_current_user_can_access_tenant(p_tenant_id, true) THEN
    RAISE EXCEPTION 'Access denied for tenant %', p_tenant_id USING ERRCODE = '42501';
  END IF;

  IF p_email IS NULL OR btrim(p_email) = '' THEN
    RAISE EXCEPTION 'Invitation email is required';
  END IF;

  IF v_role NOT IN ('ADMIN', 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST') THEN
    RAISE EXCEPTION 'Invalid invitation role';
  END IF;

  IF to_regprocedure('public.current_user_profile_id()') IS NOT NULL THEN
    SELECT public.current_user_profile_id() INTO v_invited_by;
  ELSE
    v_invited_by := auth.uid();
  END IF;

  INSERT INTO public.tenant_invitations (
    tenant_id,
    email,
    role,
    status,
    invited_by,
    token,
    expires_at,
    created_at
  )
  VALUES (
    p_tenant_id,
    lower(btrim(p_email)),
    v_role,
    'PENDING',
    v_invited_by,
    v_token,
    NOW() + make_interval(days => v_expiry_days),
    NOW()
  )
  RETURNING tenant_invitations.id, tenant_invitations.token, tenant_invitations.expires_at
  INTO id, token, expires_at;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.create_tenant_for_current_user(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_tenant_secure(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_tenant_invitation_secure(UUID, TEXT, TEXT, INTEGER) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_tenant_for_current_user(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_tenant_secure(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_tenant_invitation_secure(UUID, TEXT, TEXT, INTEGER) TO authenticated;

-- Block direct writes for app clients; writes must go through secured RPCs.
DO $$
BEGIN
  IF to_regclass('public.tenants') IS NOT NULL THEN
    REVOKE INSERT, UPDATE, DELETE ON TABLE public.tenants FROM authenticated;
    GRANT SELECT ON TABLE public.tenants TO authenticated;
  END IF;

  IF to_regclass('public.tenant_invitations') IS NOT NULL THEN
    REVOKE INSERT, UPDATE, DELETE ON TABLE public.tenant_invitations FROM authenticated;
    GRANT SELECT ON TABLE public.tenant_invitations TO authenticated;
  END IF;
END
$$;

COMMIT;
