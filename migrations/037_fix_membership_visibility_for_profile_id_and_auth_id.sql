-- ============================================================================
-- 037_fix_membership_visibility_for_profile_id_and_auth_id.sql
-- Purpose:
-- 1) Ensure user clinic/branch memberships are visible when user_profiles.id
--    differs from auth.uid() and is linked via auth_id.
-- 2) Rebuild self-only policies to accept both ids safely.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.current_user_profile_id()
RETURNS UUID AS $$
DECLARE
  v_uid UUID;
  v_profile_id UUID;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT up.id
  INTO v_profile_id
  FROM public.user_profiles up
  WHERE up.id = v_uid
     OR (EXISTS (
           SELECT 1
           FROM information_schema.columns c
           WHERE c.table_schema = 'public'
             AND c.table_name = 'user_profiles'
             AND c.column_name = 'auth_id'
         ) AND up.auth_id = v_uid)
  ORDER BY CASE WHEN up.id = v_uid THEN 0 ELSE 1 END
  LIMIT 1;

  RETURN COALESCE(v_profile_id, v_uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.current_user_profile_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_profile_id() TO authenticated;

DO $$
BEGIN
  IF to_regclass('public.user_clinic_access') IS NOT NULL THEN
    ALTER TABLE public.user_clinic_access ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS rls_select ON public.user_clinic_access;
    DROP POLICY IF EXISTS rls_insert ON public.user_clinic_access;
    DROP POLICY IF EXISTS rls_update ON public.user_clinic_access;
    DROP POLICY IF EXISTS rls_delete ON public.user_clinic_access;
    DROP POLICY IF EXISTS user_clinic_access_select_self_only ON public.user_clinic_access;
    DROP POLICY IF EXISTS user_clinic_access_insert_self_only ON public.user_clinic_access;
    DROP POLICY IF EXISTS user_clinic_access_update_self_only ON public.user_clinic_access;
    DROP POLICY IF EXISTS user_clinic_access_delete_self_only ON public.user_clinic_access;

    CREATE POLICY user_clinic_access_select_self_only ON public.user_clinic_access
      FOR SELECT USING (user_id = auth.uid() OR user_id = public.current_user_profile_id());

    CREATE POLICY user_clinic_access_insert_self_only ON public.user_clinic_access
      FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id = public.current_user_profile_id());

    CREATE POLICY user_clinic_access_update_self_only ON public.user_clinic_access
      FOR UPDATE USING (user_id = auth.uid() OR user_id = public.current_user_profile_id())
      WITH CHECK (user_id = auth.uid() OR user_id = public.current_user_profile_id());

    CREATE POLICY user_clinic_access_delete_self_only ON public.user_clinic_access
      FOR DELETE USING (user_id = auth.uid() OR user_id = public.current_user_profile_id());
  END IF;

  IF to_regclass('public.user_clinics') IS NOT NULL THEN
    ALTER TABLE public.user_clinics ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS rls_select ON public.user_clinics;
    DROP POLICY IF EXISTS rls_insert ON public.user_clinics;
    DROP POLICY IF EXISTS rls_update ON public.user_clinics;
    DROP POLICY IF EXISTS rls_delete ON public.user_clinics;
    DROP POLICY IF EXISTS user_clinics_select_own ON public.user_clinics;
    DROP POLICY IF EXISTS user_clinics_insert_own ON public.user_clinics;
    DROP POLICY IF EXISTS user_clinics_update_own ON public.user_clinics;

    CREATE POLICY user_clinics_select_own ON public.user_clinics
      FOR SELECT USING (user_id = auth.uid() OR user_id = public.current_user_profile_id());

    CREATE POLICY user_clinics_insert_own ON public.user_clinics
      FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id = public.current_user_profile_id());

    CREATE POLICY user_clinics_update_own ON public.user_clinics
      FOR UPDATE USING (user_id = auth.uid() OR user_id = public.current_user_profile_id())
      WITH CHECK (user_id = auth.uid() OR user_id = public.current_user_profile_id());
  END IF;
END
$$;

COMMIT;
