-- ============================================================================
-- 026_admin_user_management_clinic_scope.sql
-- Purpose:
-- 1) Allow admins to create NON-ADMIN users from app UI.
-- 2) Auto-link created user to a selected clinic scope.
-- 3) Expose clinic-scoped user list for UserManagement page.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_create_non_admin_user_for_clinic(
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
  v_actor UUID := auth.uid();
  v_can_manage BOOLEAN := false;
  v_role TEXT := UPPER(COALESCE(BTRIM(p_role), 'ASSISTANT'));
  v_status TEXT := UPPER(COALESCE(BTRIM(p_status), 'ACTIVE'));
  v_access_table TEXT;
  v_active_column TEXT;
  v_has_id BOOLEAN;
  v_has_branch_id BOOLEAN;
  v_has_role_at_clinic BOOLEAN;
  v_has_is_default BOOLEAN;
  v_has_active BOOLEAN;
  v_has_created_by BOOLEAN;
  v_has_updated_by BOOLEAN;
  v_has_created_at BOOLEAN;
  v_has_updated_at BOOLEAN;
  v_has_up_id BOOLEAN;
  v_has_up_auth_id BOOLEAN;
  v_has_up_user_id BOOLEAN;
  v_assignment_user_id UUID;
  v_actor_fk_id UUID;
  v_actor_match_clause TEXT;
  v_where_clause TEXT;
  v_exists BOOLEAN := false;
  v_insert_columns TEXT[] := ARRAY[]::TEXT[];
  v_insert_values TEXT[] := ARRAY[]::TEXT[];
  v_update_sets TEXT[] := ARRAY[]::TEXT[];
  v_sql TEXT;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Missing target user id';
  END IF;
  IF p_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Missing clinic id';
  END IF;
  IF p_username IS NULL OR BTRIM(p_username) = '' THEN
    RAISE EXCEPTION 'Username is required';
  END IF;
  IF p_email IS NULL OR BTRIM(p_email) = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  IF v_role NOT IN ('DOCTOR', 'ASSISTANT', 'RECEPTIONIST') THEN
    RAISE EXCEPTION 'Only non-admin roles are allowed';
  END IF;
  IF v_status NOT IN ('ACTIVE', 'INACTIVE', 'SUSPENDED') THEN
    RAISE EXCEPTION 'Invalid user status';
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

  IF to_regclass('public.user_clinic_access') IS NOT NULL THEN
    v_access_table := 'user_clinic_access';
    v_active_column := 'is_active';
  ELSIF to_regclass('public.user_clinics') IS NOT NULL THEN
    v_access_table := 'user_clinics';
    v_active_column := 'access_active';
  ELSE
    RAISE EXCEPTION 'No clinic assignment table found';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = v_access_table AND column_name = 'id'
  ) INTO v_has_id;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = v_access_table AND column_name = 'branch_id'
  ) INTO v_has_branch_id;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = v_access_table AND column_name = 'role_at_clinic'
  ) INTO v_has_role_at_clinic;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = v_access_table AND column_name = 'is_default'
  ) INTO v_has_is_default;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = v_access_table AND column_name = v_active_column
  ) INTO v_has_active;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = v_access_table AND column_name = 'created_by'
  ) INTO v_has_created_by;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = v_access_table AND column_name = 'updated_by'
  ) INTO v_has_updated_by;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = v_access_table AND column_name = 'created_at'
  ) INTO v_has_created_at;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = v_access_table AND column_name = 'updated_at'
  ) INTO v_has_updated_at;

  -- Ensure parent row exists for user_profiles.user_id FK before touching user_profiles.
  IF to_regclass('public.users') IS NOT NULL THEN
    BEGIN
      INSERT INTO public.users (id, email, created_at, updated_at)
      VALUES (p_auth_user_id, LOWER(BTRIM(p_email)), NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION
      WHEN undefined_column THEN
        BEGIN
          INSERT INTO public.users (id, email)
          VALUES (p_auth_user_id, LOWER(BTRIM(p_email)))
          ON CONFLICT (id) DO NOTHING;
        EXCEPTION
          WHEN undefined_column THEN
            INSERT INTO public.users (id)
            VALUES (p_auth_user_id)
            ON CONFLICT (id) DO NOTHING;
        END;
    END;
  END IF;

  v_sql := format(
    'INSERT INTO public.user_profiles (id, username, email, role, status, updated_at)
     VALUES (%L::uuid, %L, %L, %L, %L, NOW())
     ON CONFLICT (id) DO UPDATE
     SET username = EXCLUDED.username,
         email = EXCLUDED.email,
         role = EXCLUDED.role,
         status = EXCLUDED.status,
         updated_at = NOW()',
    p_auth_user_id,
    BTRIM(p_username),
    LOWER(BTRIM(p_email)),
    v_role,
    v_status
  );
  EXECUTE v_sql;

  BEGIN
    UPDATE public.user_profiles
    SET auth_id = COALESCE(auth_id, p_auth_user_id)
    WHERE id = p_auth_user_id;
  EXCEPTION
    WHEN undefined_column THEN
      NULL;
  END;

  BEGIN
    UPDATE public.user_profiles up
    SET user_id = COALESCE(up.user_id, p_auth_user_id)
    WHERE up.id = p_auth_user_id;
  EXCEPTION
    WHEN undefined_column THEN
      NULL;
  END;

  BEGIN
    UPDATE public.user_profiles
    SET dentist_id = CASE WHEN v_role = 'DOCTOR' THEN p_dentist_id ELSE NULL END
    WHERE id = p_auth_user_id;
  EXCEPTION
    WHEN undefined_column THEN
      NULL;
  END;

  v_assignment_user_id := p_auth_user_id;
  BEGIN
    EXECUTE 'SELECT public.resolve_actor_id_for_fk($1, $2, $3)'
      INTO v_assignment_user_id
      USING v_access_table, 'user_id', p_auth_user_id;
  EXCEPTION
    WHEN undefined_function THEN
      v_assignment_user_id := p_auth_user_id;
  END;
  IF v_assignment_user_id IS NULL THEN
    v_assignment_user_id := p_auth_user_id;
  END IF;

  IF to_regclass('public.users') IS NOT NULL THEN
    BEGIN
      INSERT INTO public.users (id, email, created_at, updated_at)
      VALUES (v_assignment_user_id, LOWER(BTRIM(p_email)), NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION
      WHEN undefined_column THEN
        BEGIN
          INSERT INTO public.users (id, email)
          VALUES (v_assignment_user_id, LOWER(BTRIM(p_email)))
          ON CONFLICT (id) DO NOTHING;
        EXCEPTION
          WHEN undefined_column THEN
            INSERT INTO public.users (id)
            VALUES (v_assignment_user_id)
            ON CONFLICT (id) DO NOTHING;
        END;
    END;
  END IF;

  v_actor_fk_id := v_actor;
  BEGIN
    EXECUTE 'SELECT public.resolve_actor_id_for_fk($1, $2, $3)'
      INTO v_actor_fk_id
      USING v_access_table, 'created_by', v_actor;
  EXCEPTION
    WHEN undefined_function THEN
      v_actor_fk_id := v_actor;
  END;
  IF v_actor_fk_id IS NULL THEN
    v_actor_fk_id := v_actor;
  END IF;

  v_where_clause := format(
    'user_id = %L::uuid AND clinic_id = %L::uuid',
    v_assignment_user_id,
    p_clinic_id
  );
  IF v_has_branch_id THEN
    v_where_clause := v_where_clause || format(' AND branch_id IS NOT DISTINCT FROM %L::uuid', p_branch_id);
  END IF;

  v_sql := format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE %s)', v_access_table, v_where_clause);
  EXECUTE v_sql INTO v_exists;

  IF v_exists THEN
    IF v_has_role_at_clinic THEN
      v_update_sets := array_append(v_update_sets, format('role_at_clinic = %L', v_role));
    END IF;
    IF v_has_active THEN
      v_update_sets := array_append(v_update_sets, format('%I = true', v_active_column));
    END IF;
    IF v_has_is_default THEN
      v_update_sets := array_append(v_update_sets, format('is_default = %s', CASE WHEN p_is_default THEN 'true' ELSE 'false' END));
    END IF;
    IF v_has_branch_id THEN
      v_update_sets := array_append(v_update_sets, format('branch_id = %L::uuid', p_branch_id));
    END IF;
    IF v_has_updated_by THEN
      v_update_sets := array_append(v_update_sets, format('updated_by = %L::uuid', v_actor_fk_id));
    END IF;
    IF v_has_updated_at THEN
      v_update_sets := array_append(v_update_sets, 'updated_at = NOW()');
    END IF;

    IF array_length(v_update_sets, 1) IS NOT NULL THEN
      v_sql := format(
        'UPDATE public.%I SET %s WHERE %s',
        v_access_table,
        array_to_string(v_update_sets, ', '),
        v_where_clause
      );
      EXECUTE v_sql;
    END IF;
  ELSE
    v_insert_columns := array_append(v_insert_columns, 'user_id');
    v_insert_values := array_append(v_insert_values, format('%L::uuid', v_assignment_user_id));
    v_insert_columns := array_append(v_insert_columns, 'clinic_id');
    v_insert_values := array_append(v_insert_values, format('%L::uuid', p_clinic_id));

    IF v_has_branch_id THEN
      v_insert_columns := array_append(v_insert_columns, 'branch_id');
      v_insert_values := array_append(v_insert_values, format('%L::uuid', p_branch_id));
    END IF;
    IF v_has_role_at_clinic THEN
      v_insert_columns := array_append(v_insert_columns, 'role_at_clinic');
      v_insert_values := array_append(v_insert_values, format('%L', v_role));
    END IF;
    IF v_has_is_default THEN
      v_insert_columns := array_append(v_insert_columns, 'is_default');
      v_insert_values := array_append(v_insert_values, CASE WHEN p_is_default THEN 'true' ELSE 'false' END);
    END IF;
    IF v_has_active THEN
      v_insert_columns := array_append(v_insert_columns, quote_ident(v_active_column));
      v_insert_values := array_append(v_insert_values, 'true');
    END IF;
    IF v_has_created_by THEN
      v_insert_columns := array_append(v_insert_columns, 'created_by');
      v_insert_values := array_append(v_insert_values, format('%L::uuid', v_actor_fk_id));
    END IF;
    IF v_has_updated_by THEN
      v_insert_columns := array_append(v_insert_columns, 'updated_by');
      v_insert_values := array_append(v_insert_values, format('%L::uuid', v_actor_fk_id));
    END IF;
    IF v_has_created_at THEN
      v_insert_columns := array_append(v_insert_columns, 'created_at');
      v_insert_values := array_append(v_insert_values, 'NOW()');
    END IF;
    IF v_has_updated_at THEN
      v_insert_columns := array_append(v_insert_columns, 'updated_at');
      v_insert_values := array_append(v_insert_values, 'NOW()');
    END IF;

    v_sql := format(
      'INSERT INTO public.%I (%s) VALUES (%s)',
      v_access_table,
      array_to_string(v_insert_columns, ', '),
      array_to_string(v_insert_values, ', ')
    );
    BEGIN
      EXECUTE v_sql;
    EXCEPTION
      WHEN unique_violation THEN
        IF v_has_role_at_clinic THEN
          v_update_sets := ARRAY[format('role_at_clinic = %L', v_role)];
        ELSE
          v_update_sets := ARRAY[]::TEXT[];
        END IF;
        IF v_has_active THEN
          v_update_sets := array_append(v_update_sets, format('%I = true', v_active_column));
        END IF;
        IF v_has_is_default THEN
          v_update_sets := array_append(v_update_sets, format('is_default = %s', CASE WHEN p_is_default THEN 'true' ELSE 'false' END));
        END IF;
        IF v_has_updated_by THEN
          v_update_sets := array_append(v_update_sets, format('updated_by = %L::uuid', v_actor_fk_id));
        END IF;
        IF v_has_updated_at THEN
          v_update_sets := array_append(v_update_sets, 'updated_at = NOW()');
        END IF;
        IF array_length(v_update_sets, 1) IS NOT NULL THEN
          v_sql := format(
            'UPDATE public.%I SET %s WHERE %s',
            v_access_table,
            array_to_string(v_update_sets, ', '),
            v_where_clause
          );
          EXECUTE v_sql;
        END IF;
    END;
  END IF;

  RETURN QUERY
  SELECT v_assignment_user_id, p_clinic_id, v_access_table;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.admin_create_non_admin_user_for_clinic(
  UUID, TEXT, TEXT, TEXT, TEXT, UUID, UUID, UUID, BOOLEAN
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_create_non_admin_user_for_clinic(
  UUID, TEXT, TEXT, TEXT, TEXT, UUID, UUID, UUID, BOOLEAN
) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_users_for_clinic(
  p_clinic_id UUID,
  p_include_admins BOOLEAN DEFAULT true,
  p_branch_id UUID DEFAULT NULL
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
  override_permissions BOOLEAN
) AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_can_manage BOOLEAN := false;
  v_access_table TEXT;
  v_active_column TEXT;
  v_has_active BOOLEAN;
  v_has_branch_id BOOLEAN;
  v_has_up_user_id BOOLEAN;
  v_has_up_auth_id BOOLEAN;
  v_has_up_email BOOLEAN;
  v_has_up_role BOOLEAN;
  v_has_up_status BOOLEAN;
  v_has_up_dentist_id BOOLEAN;
  v_has_up_created_at BOOLEAN;
  v_has_up_updated_at BOOLEAN;
  v_has_up_last_login BOOLEAN;
  v_has_up_custom_permissions BOOLEAN;
  v_has_up_override_permissions BOOLEAN;
  v_has_up_id BOOLEAN;
  v_actor_match_clause TEXT;
  v_join_expr TEXT;
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

  IF to_regclass('public.user_clinic_access') IS NOT NULL THEN
    v_access_table := 'user_clinic_access';
    v_active_column := 'is_active';
  ELSIF to_regclass('public.user_clinics') IS NOT NULL THEN
    v_access_table := 'user_clinics';
    v_active_column := 'access_active';
  ELSE
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = v_access_table AND column_name = v_active_column
  ) INTO v_has_active;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = v_access_table AND column_name = 'branch_id'
  ) INTO v_has_branch_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'user_id'
  ) INTO v_has_up_user_id;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'auth_id'
  ) INTO v_has_up_auth_id;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'email'
  ) INTO v_has_up_email;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'role'
  ) INTO v_has_up_role;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'status'
  ) INTO v_has_up_status;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'dentist_id'
  ) INTO v_has_up_dentist_id;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'created_at'
  ) INTO v_has_up_created_at;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'updated_at'
  ) INTO v_has_up_updated_at;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'last_login'
  ) INTO v_has_up_last_login;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'custom_permissions'
  ) INTO v_has_up_custom_permissions;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'override_permissions'
  ) INTO v_has_up_override_permissions;

  v_join_expr := 'src.user_id = up.id';
  IF v_has_up_user_id AND v_has_up_auth_id THEN
    v_join_expr := '(src.user_id = up.id OR src.user_id = up.user_id OR src.user_id = up.auth_id)';
  ELSIF v_has_up_user_id THEN
    v_join_expr := '(src.user_id = up.id OR src.user_id = up.user_id)';
  ELSIF v_has_up_auth_id THEN
    v_join_expr := '(src.user_id = up.id OR src.user_id = up.auth_id)';
  END IF;

  v_user_id_expr := CASE WHEN v_has_up_user_id THEN 'COALESCE(up.user_id, up.id)::uuid' ELSE 'up.id::uuid' END;
  v_auth_id_expr := CASE WHEN v_has_up_auth_id THEN 'up.auth_id::uuid' ELSE 'NULL::uuid' END;
  v_email_expr := CASE WHEN v_has_up_email THEN 'up.email::text' ELSE 'NULL::text' END;
  v_role_expr := CASE WHEN v_has_up_role THEN 'up.role::text' ELSE quote_literal('ASSISTANT') || '::text' END;
  v_status_expr := CASE WHEN v_has_up_status THEN 'up.status::text' ELSE quote_literal('ACTIVE') || '::text' END;
  v_dentist_expr := CASE WHEN v_has_up_dentist_id THEN 'up.dentist_id::uuid' ELSE 'NULL::uuid' END;
  v_created_expr := CASE WHEN v_has_up_created_at THEN 'up.created_at::timestamptz' ELSE 'NOW()::timestamptz' END;
  v_updated_expr := CASE WHEN v_has_up_updated_at THEN 'up.updated_at::timestamptz' ELSE 'NOW()::timestamptz' END;
  v_last_login_expr := CASE WHEN v_has_up_last_login THEN 'up.last_login::timestamptz' ELSE 'NULL::timestamptz' END;
  v_custom_perm_expr := CASE WHEN v_has_up_custom_permissions THEN 'COALESCE(up.custom_permissions::text[], ARRAY[]::text[])' ELSE 'ARRAY[]::text[]' END;
  v_override_expr := CASE WHEN v_has_up_override_permissions THEN 'COALESCE(up.override_permissions, false)::boolean' ELSE 'false::boolean' END;

  v_sql := format(
    'SELECT id, user_id, auth_id, username, email, role, status, dentist_id, created_at, updated_at, last_login, custom_permissions, override_permissions
     FROM (
       SELECT DISTINCT ON (up.id)
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
         %s AS override_permissions
       FROM public.user_profiles up
       JOIN public.%I src ON %s
       WHERE src.clinic_id = $1
         %s
         %s
         %s
       ORDER BY up.id, %s DESC
     ) scoped
     ORDER BY created_at DESC',
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
    v_access_table,
    v_join_expr,
    CASE WHEN v_has_active THEN format('AND COALESCE(src.%I, true) = true', v_active_column) ELSE '' END,
    CASE WHEN p_include_admins THEN '' ELSE 'AND COALESCE(up.role::text, '''') <> ''ADMIN''' END,
    CASE WHEN v_has_branch_id THEN 'AND ($2::uuid IS NULL OR src.branch_id IS NOT DISTINCT FROM $2::uuid)' ELSE '' END,
    v_created_expr
  );

  RETURN QUERY EXECUTE v_sql USING p_clinic_id, p_branch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.admin_list_users_for_clinic(UUID, BOOLEAN, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_users_for_clinic(UUID, BOOLEAN, UUID) TO authenticated;

COMMIT;
