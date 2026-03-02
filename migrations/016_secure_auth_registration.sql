-- ============================================================================
-- 016_secure_auth_registration.sql
-- Purpose:
-- 1) Harden auth/profile sync and remove client-role trust.
-- 2) Lock down user tables (revoke anon, enable safe RLS).
-- 3) Provide secure RPC to promote current user as tenant owner.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Ensure auth_id exists and is indexed.
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_id ON public.user_profiles(auth_id);

-- Backfill auth_id where profile id already matches auth user id.
UPDATE public.user_profiles up
SET auth_id = up.id
WHERE up.auth_id IS NULL
  AND EXISTS (SELECT 1 FROM auth.users au WHERE au.id = up.id);

-- ---------------------------------------------------------------------------
-- Safe trigger: create/patch user_profiles row on auth signup.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
BEGIN
  v_username := NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), '');
  IF v_username IS NULL THEN
    v_username := NULLIF(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1), '');
  END IF;
  IF v_username IS NULL THEN
    v_username := 'user_' || REPLACE(SUBSTRING(NEW.id::text, 1, 8), '-', '');
  END IF;

  INSERT INTO public.user_profiles (id, auth_id, username, email, role, status, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.id,
    v_username,
    NEW.email,
    'DOCTOR',
    'ACTIVE',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    auth_id = EXCLUDED.auth_id,
    email = COALESCE(EXCLUDED.email, public.user_profiles.email),
    username = COALESCE(NULLIF(public.user_profiles.username, ''), EXCLUDED.username),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Admin helper (security definer): current user admin check.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE (up.id = auth.uid() OR up.auth_id = auth.uid())
      AND up.role = 'ADMIN'
      AND COALESCE(up.status, 'ACTIVE') = 'ACTIVE'
  ) INTO v_is_admin;

  RETURN COALESCE(v_is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.current_user_tenant_id()
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT up.tenant_id
  INTO v_tenant_id
  FROM public.user_profiles up
  WHERE up.id = auth.uid() OR up.auth_id = auth.uid()
  ORDER BY up.updated_at DESC NULLS LAST
  LIMIT 1;

  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.is_current_user_admin_for_tenant(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  IF p_tenant_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE (up.id = auth.uid() OR up.auth_id = auth.uid())
      AND up.role = 'ADMIN'
      AND COALESCE(up.status, 'ACTIVE') = 'ACTIVE'
      AND up.tenant_id IS NOT DISTINCT FROM p_tenant_id
  ) INTO v_is_admin;

  RETURN COALESCE(v_is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.current_user_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_tenant_id() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin_for_tenant(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin_for_tenant(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Secure self-only owner promotion RPC.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.promote_current_user_to_tenant_owner(p_tenant_id UUID)
RETURNS VOID AS $$
DECLARE
  v_uid UUID;
  v_tenant_exists BOOLEAN;
  v_other_owner_exists BOOLEAN;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.tenants t WHERE t.id = p_tenant_id
  ) INTO v_tenant_exists;

  IF NOT COALESCE(v_tenant_exists, false) THEN
    RAISE EXCEPTION 'Invalid tenant id';
  END IF;

  -- Prevent taking ownership of an existing tenant that already has an owner/admin.
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.tenant_id = p_tenant_id
      AND up.role = 'ADMIN'
      AND COALESCE(up.status, 'ACTIVE') = 'ACTIVE'
      AND NOT (up.id = v_uid OR up.auth_id = v_uid)
  ) INTO v_other_owner_exists;

  IF COALESCE(v_other_owner_exists, false) THEN
    RAISE EXCEPTION 'Tenant already has an owner/admin';
  END IF;

  UPDATE public.user_profiles
  SET
    role = 'ADMIN',
    status = COALESCE(status, 'ACTIVE'),
    tenant_id = p_tenant_id,
    auth_id = COALESCE(auth_id, v_uid),
    updated_at = NOW()
  WHERE id = v_uid OR auth_id = v_uid;

  IF NOT FOUND THEN
    INSERT INTO public.user_profiles (id, auth_id, username, email, role, status, tenant_id, created_at, updated_at)
    SELECT
      v_uid,
      v_uid,
      COALESCE(NULLIF(SPLIT_PART(COALESCE(au.email, ''), '@', 1), ''), 'user_' || REPLACE(SUBSTRING(v_uid::text, 1, 8), '-', '')),
      au.email,
      'ADMIN',
      'ACTIVE',
      p_tenant_id,
      NOW(),
      NOW()
    FROM auth.users au
    WHERE au.id = v_uid;
  END IF;

  IF to_regclass('public.users') IS NOT NULL THEN
    UPDATE public.users
    SET
      tenant_id = p_tenant_id,
      is_owner = true
    WHERE id = v_uid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

REVOKE EXECUTE ON FUNCTION public.promote_current_user_to_tenant_owner(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_current_user_to_tenant_owner(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Tighten grants (no anon access to user tables).
-- ---------------------------------------------------------------------------
REVOKE ALL ON TABLE public.user_profiles FROM anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_profiles TO authenticated;

DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON TABLE public.users FROM anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON TABLE public.users TO authenticated';
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- RLS for user_profiles.
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_profiles_select_self_or_admin ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_insert_self_or_admin ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_self_or_admin ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_admin_only ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_delete_admin_only ON public.user_profiles;

CREATE POLICY user_profiles_select_self_or_admin ON public.user_profiles
FOR SELECT
USING (
  id = auth.uid()
  OR auth_id = auth.uid()
  OR public.is_current_user_admin_for_tenant(tenant_id)
);

CREATE POLICY user_profiles_insert_self_or_admin ON public.user_profiles
FOR INSERT
WITH CHECK (
  public.is_current_user_admin_for_tenant(tenant_id)
  OR (
    (id = auth.uid() OR auth_id = auth.uid())
    AND COALESCE(role, 'DOCTOR') = 'DOCTOR'
    AND COALESCE(status, 'ACTIVE') = 'ACTIVE'
    AND tenant_id IS NOT DISTINCT FROM public.current_user_tenant_id()
  )
);

CREATE POLICY user_profiles_update_admin_only ON public.user_profiles
FOR UPDATE
USING (public.is_current_user_admin_for_tenant(tenant_id))
WITH CHECK (public.is_current_user_admin_for_tenant(tenant_id));

CREATE POLICY user_profiles_delete_admin_only ON public.user_profiles
FOR DELETE
USING (public.is_current_user_admin_for_tenant(tenant_id));

-- ---------------------------------------------------------------------------
-- RLS for users (if table exists and is used).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_users_has_tenant_id BOOLEAN;
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS users_select_self_or_admin ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS users_insert_self_or_admin ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS users_update_self_or_admin ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS users_insert_admin_only ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS users_update_admin_only ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS users_delete_admin_only ON public.users';

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = 'users'
        AND c.column_name = 'tenant_id'
    ) INTO v_users_has_tenant_id;

    IF v_users_has_tenant_id THEN
      EXECUTE $sql$
        CREATE POLICY users_select_self_or_admin ON public.users
        FOR SELECT
        USING (id = auth.uid() OR public.is_current_user_admin_for_tenant(tenant_id))
      $sql$;

      EXECUTE $sql$
        CREATE POLICY users_insert_admin_only ON public.users
        FOR INSERT
        WITH CHECK (public.is_current_user_admin_for_tenant(tenant_id))
      $sql$;

      EXECUTE $sql$
        CREATE POLICY users_update_admin_only ON public.users
        FOR UPDATE
        USING (public.is_current_user_admin_for_tenant(tenant_id))
        WITH CHECK (public.is_current_user_admin_for_tenant(tenant_id))
      $sql$;

      EXECUTE $sql$
        CREATE POLICY users_delete_admin_only ON public.users
        FOR DELETE
        USING (public.is_current_user_admin_for_tenant(tenant_id))
      $sql$;
    ELSE
      EXECUTE $sql$
        CREATE POLICY users_select_self_or_admin ON public.users
        FOR SELECT
        USING (id = auth.uid() OR public.is_current_user_admin())
      $sql$;

      EXECUTE $sql$
        CREATE POLICY users_insert_admin_only ON public.users
        FOR INSERT
        WITH CHECK (public.is_current_user_admin())
      $sql$;

      EXECUTE $sql$
        CREATE POLICY users_update_admin_only ON public.users
        FOR UPDATE
        USING (public.is_current_user_admin())
        WITH CHECK (public.is_current_user_admin())
      $sql$;

      EXECUTE $sql$
        CREATE POLICY users_delete_admin_only ON public.users
        FOR DELETE
        USING (public.is_current_user_admin())
      $sql$;
    END IF;
  END IF;
END
$$;

COMMIT;
