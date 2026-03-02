-- Migration: enforce strict self-only visibility for user/account tables.
-- Goal: even ADMIN users can access only their own user/profile rows.

BEGIN;

-- ---------------------------------------------------------------------------
-- user_profiles: self-only RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_profiles_select_self_or_admin ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_insert_self_or_admin ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_self_or_admin ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_admin_only ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_delete_admin_only ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_select_self_only ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_insert_self_only ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update_self_only ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_delete_self_only ON public.user_profiles;

CREATE POLICY user_profiles_select_self_only ON public.user_profiles
FOR SELECT
USING (id = auth.uid() OR auth_id = auth.uid());

CREATE POLICY user_profiles_insert_self_only ON public.user_profiles
FOR INSERT
WITH CHECK (id = auth.uid() OR auth_id = auth.uid());

CREATE POLICY user_profiles_update_self_only ON public.user_profiles
FOR UPDATE
USING (id = auth.uid() OR auth_id = auth.uid())
WITH CHECK (id = auth.uid() OR auth_id = auth.uid());

CREATE POLICY user_profiles_delete_self_only ON public.user_profiles
FOR DELETE
USING (id = auth.uid() OR auth_id = auth.uid());

-- ---------------------------------------------------------------------------
-- users table (if present): self-only RLS
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS users_select_self_or_admin ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS users_insert_self_or_admin ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS users_update_self_or_admin ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS users_insert_admin_only ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS users_update_admin_only ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS users_delete_admin_only ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS users_select_self_only ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS users_insert_self_only ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS users_update_self_only ON public.users';
    EXECUTE 'DROP POLICY IF EXISTS users_delete_self_only ON public.users';

    EXECUTE $sql$
      CREATE POLICY users_select_self_only ON public.users
      FOR SELECT
      USING (id = auth.uid())
    $sql$;

    EXECUTE $sql$
      CREATE POLICY users_insert_self_only ON public.users
      FOR INSERT
      WITH CHECK (id = auth.uid())
    $sql$;

    EXECUTE $sql$
      CREATE POLICY users_update_self_only ON public.users
      FOR UPDATE
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid())
    $sql$;

    EXECUTE $sql$
      CREATE POLICY users_delete_self_only ON public.users
      FOR DELETE
      USING (id = auth.uid())
    $sql$;
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- user_clinics/user_clinic_access (if present): self-only RLS
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.user_clinics') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.user_clinics ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS rls_select ON public.user_clinics';
    EXECUTE 'DROP POLICY IF EXISTS rls_insert ON public.user_clinics';
    EXECUTE 'DROP POLICY IF EXISTS rls_update ON public.user_clinics';
    EXECUTE 'DROP POLICY IF EXISTS rls_delete ON public.user_clinics';
    EXECUTE 'DROP POLICY IF EXISTS user_clinics_select_self_only ON public.user_clinics';
    EXECUTE 'DROP POLICY IF EXISTS user_clinics_insert_self_only ON public.user_clinics';
    EXECUTE 'DROP POLICY IF EXISTS user_clinics_update_self_only ON public.user_clinics';
    EXECUTE 'DROP POLICY IF EXISTS user_clinics_delete_self_only ON public.user_clinics';

    EXECUTE $sql$
      CREATE POLICY user_clinics_select_self_only ON public.user_clinics
      FOR SELECT USING (user_id = auth.uid())
    $sql$;
    EXECUTE $sql$
      CREATE POLICY user_clinics_insert_self_only ON public.user_clinics
      FOR INSERT WITH CHECK (user_id = auth.uid())
    $sql$;
    EXECUTE $sql$
      CREATE POLICY user_clinics_update_self_only ON public.user_clinics
      FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())
    $sql$;
    EXECUTE $sql$
      CREATE POLICY user_clinics_delete_self_only ON public.user_clinics
      FOR DELETE USING (user_id = auth.uid())
    $sql$;
  END IF;

  IF to_regclass('public.user_clinic_access') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.user_clinic_access ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS rls_select ON public.user_clinic_access';
    EXECUTE 'DROP POLICY IF EXISTS rls_insert ON public.user_clinic_access';
    EXECUTE 'DROP POLICY IF EXISTS rls_update ON public.user_clinic_access';
    EXECUTE 'DROP POLICY IF EXISTS rls_delete ON public.user_clinic_access';
    EXECUTE 'DROP POLICY IF EXISTS user_clinic_access_select_self_only ON public.user_clinic_access';
    EXECUTE 'DROP POLICY IF EXISTS user_clinic_access_insert_self_only ON public.user_clinic_access';
    EXECUTE 'DROP POLICY IF EXISTS user_clinic_access_update_self_only ON public.user_clinic_access';
    EXECUTE 'DROP POLICY IF EXISTS user_clinic_access_delete_self_only ON public.user_clinic_access';

    EXECUTE $sql$
      CREATE POLICY user_clinic_access_select_self_only ON public.user_clinic_access
      FOR SELECT USING (user_id = auth.uid())
    $sql$;
    EXECUTE $sql$
      CREATE POLICY user_clinic_access_insert_self_only ON public.user_clinic_access
      FOR INSERT WITH CHECK (user_id = auth.uid())
    $sql$;
    EXECUTE $sql$
      CREATE POLICY user_clinic_access_update_self_only ON public.user_clinic_access
      FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())
    $sql$;
    EXECUTE $sql$
      CREATE POLICY user_clinic_access_delete_self_only ON public.user_clinic_access
      FOR DELETE USING (user_id = auth.uid())
    $sql$;
  END IF;
END
$$;

COMMIT;

