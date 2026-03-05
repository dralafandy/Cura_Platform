-- ============================================================================
-- 052_platform_owner_list_all_users.sql
-- Purpose:
-- 1) Provide platform-owner-only listing of all users across tenants.
-- 2) Keep filtering and pagination server-side.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.platform_owner_list_users(
  p_search TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  auth_id UUID,
  username TEXT,
  email TEXT,
  role TEXT,
  status TEXT,
  dentist_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  custom_permissions TEXT[],
  override_permissions BOOLEAN,
  total_count BIGINT
) AS $$
DECLARE
  v_search TEXT := NULLIF(BTRIM(COALESCE(p_search, '')), '');
  v_role TEXT := NULLIF(UPPER(BTRIM(COALESCE(p_role, ''))), '');
  v_status TEXT := NULLIF(UPPER(BTRIM(COALESCE(p_status, ''))), '');
  v_offset INTEGER := GREATEST(0, COALESCE(p_offset, 0));
  v_limit INTEGER := LEAST(500, GREATEST(1, COALESCE(p_limit, 50)));
  v_has_up_user_id BOOLEAN := false;
  v_has_up_auth_id BOOLEAN := false;
  v_has_up_email BOOLEAN := false;
  v_has_up_role BOOLEAN := false;
  v_has_up_status BOOLEAN := false;
  v_has_up_dentist BOOLEAN := false;
  v_has_up_created BOOLEAN := false;
  v_has_up_updated BOOLEAN := false;
  v_has_up_last_login BOOLEAN := false;
  v_has_up_custom_perm BOOLEAN := false;
  v_has_up_override BOOLEAN := false;
  v_user_id_expr TEXT;
  v_auth_id_expr TEXT;
  v_email_expr TEXT;
  v_role_expr TEXT;
  v_status_expr TEXT;
  v_dentist_expr TEXT;
  v_created_expr TEXT;
  v_updated_expr TEXT;
  v_last_login_expr TEXT;
  v_custom_perm_expr TEXT;
  v_override_expr TEXT;
  v_sql TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.is_platform_owner() THEN
    RAISE EXCEPTION 'Access denied: platform owner only' USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'user_id'
  ) INTO v_has_up_user_id;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'auth_id'
  ) INTO v_has_up_auth_id;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'email'
  ) INTO v_has_up_email;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'role'
  ) INTO v_has_up_role;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'status'
  ) INTO v_has_up_status;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'dentist_id'
  ) INTO v_has_up_dentist;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'created_at'
  ) INTO v_has_up_created;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'updated_at'
  ) INTO v_has_up_updated;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'last_login'
  ) INTO v_has_up_last_login;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'custom_permissions'
  ) INTO v_has_up_custom_perm;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'override_permissions'
  ) INTO v_has_up_override;

  v_user_id_expr := CASE WHEN v_has_up_user_id THEN 'COALESCE(up.user_id, up.id)::uuid' ELSE 'up.id::uuid' END;
  v_auth_id_expr := CASE WHEN v_has_up_auth_id THEN 'up.auth_id::uuid' ELSE 'NULL::uuid' END;
  v_email_expr := CASE WHEN v_has_up_email THEN 'up.email::text' ELSE 'NULL::text' END;
  v_role_expr := CASE WHEN v_has_up_role THEN 'COALESCE(up.role::text, '''')' ELSE '''''' END;
  v_status_expr := CASE WHEN v_has_up_status THEN 'COALESCE(up.status::text, '''')' ELSE '''''' END;
  v_dentist_expr := CASE WHEN v_has_up_dentist THEN 'up.dentist_id::uuid' ELSE 'NULL::uuid' END;
  v_created_expr := CASE WHEN v_has_up_created THEN 'up.created_at::timestamptz' ELSE 'NOW()::timestamptz' END;
  v_updated_expr := CASE WHEN v_has_up_updated THEN 'up.updated_at::timestamptz' ELSE 'NOW()::timestamptz' END;
  v_last_login_expr := CASE WHEN v_has_up_last_login THEN 'up.last_login::timestamptz' ELSE 'NULL::timestamptz' END;
  v_custom_perm_expr := CASE WHEN v_has_up_custom_perm THEN 'COALESCE(up.custom_permissions::text[], ARRAY[]::text[])' ELSE 'ARRAY[]::text[]' END;
  v_override_expr := CASE WHEN v_has_up_override THEN 'COALESCE(up.override_permissions, false)::boolean' ELSE 'false::boolean' END;

  v_sql := format(
    'SELECT
       up.id::uuid AS id,
       %s AS user_id,
       %s AS auth_id,
       up.username::text AS username,
       %s AS email,
       %s AS role,
       %s AS status,
       %s AS dentist_id,
       %s AS created_at,
       %s AS updated_at,
       %s AS last_login,
       %s AS custom_permissions,
       %s AS override_permissions,
       COUNT(*) OVER()::bigint AS total_count
     FROM public.user_profiles up
     WHERE ($1::text IS NULL OR
           lower(coalesce(up.username::text, '''')) LIKE ''%%'' || lower($1::text) || ''%%'' OR
           lower(coalesce(%s, '''')) LIKE ''%%'' || lower($1::text) || ''%%'')
       AND ($2::text IS NULL OR upper(coalesce(%s, '''')) = $2::text)
       AND ($3::text IS NULL OR upper(coalesce(%s, '''')) = $3::text)
     ORDER BY %s DESC
     OFFSET $4 LIMIT $5',
    v_user_id_expr,
    v_auth_id_expr,
    v_email_expr,
    v_role_expr,
    v_status_expr,
    v_dentist_expr,
    v_created_expr,
    v_updated_expr,
    v_last_login_expr,
    v_custom_perm_expr,
    v_override_expr,
    v_email_expr,
    v_role_expr,
    v_status_expr,
    v_created_expr
  );

  RETURN QUERY EXECUTE v_sql USING v_search, v_role, v_status, v_offset, v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.platform_owner_list_users(TEXT, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.platform_owner_list_users(TEXT, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;

COMMIT;
