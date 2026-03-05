-- ============================================================================
-- 048_link_current_user_tenant_context.sql
-- Purpose:
-- 1) Provide a secure self-heal RPC to link current user profile to tenant.
-- 2) Infer tenant context from memberships/users table for legacy accounts.
-- 3) Keep tenant linking self-scoped and non-escalating.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.link_current_user_tenant_context(
  p_preferred_tenant_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_profile_id UUID;
  v_email TEXT;
  v_username TEXT;
  v_candidate UUID;
  v_profile_tenant UUID;
  v_users_tenant UUID;
  v_has_up_tenant_id BOOLEAN := false;
  v_has_up_auth_id BOOLEAN := false;
  v_has_up_user_id BOOLEAN := false;
  v_has_up_updated_at BOOLEAN := false;
  v_has_users_tenant BOOLEAN := false;
  v_has_uca_user_id BOOLEAN := false;
  v_has_uca_clinic_id BOOLEAN := false;
  v_has_uca_is_active BOOLEAN := false;
  v_has_uc_user_id BOOLEAN := false;
  v_has_uc_clinic_id BOOLEAN := false;
  v_has_uc_access_active BOOLEAN := false;
  v_has_any_profile BOOLEAN := false;
  v_profile_match_expr TEXT := '(up.id = $1 OR up.id = $2)';
  v_tenant_candidates UUID[] := ARRAY[]::UUID[];
  v_tenant UUID;
  v_candidate_count INTEGER := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF to_regprocedure('public.current_user_profile_id()') IS NOT NULL THEN
    BEGIN
      SELECT public.current_user_profile_id() INTO v_profile_id;
    EXCEPTION
      WHEN OTHERS THEN
        v_profile_id := NULL;
    END;
  END IF;
  v_profile_id := COALESCE(v_profile_id, v_uid);

  IF to_regclass('public.user_profiles') IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'tenant_id'
    ) INTO v_has_up_tenant_id;

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

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'updated_at'
    ) INTO v_has_up_updated_at;
  END IF;

  IF NOT v_has_up_tenant_id THEN
    RETURN NULL;
  END IF;

  IF v_has_up_auth_id THEN
    v_profile_match_expr := v_profile_match_expr || ' OR up.auth_id = $1';
  END IF;
  IF v_has_up_user_id THEN
    v_profile_match_expr := v_profile_match_expr || ' OR up.user_id = $1 OR up.user_id = $2';
  END IF;
  v_profile_match_expr := v_profile_match_expr || ')';

  IF v_has_up_updated_at THEN
    EXECUTE format(
      'SELECT up.tenant_id
       FROM public.user_profiles up
       WHERE %s
         AND up.tenant_id IS NOT NULL
       ORDER BY up.updated_at DESC NULLS LAST
       LIMIT 1',
      v_profile_match_expr
    )
    INTO v_profile_tenant
    USING v_uid, v_profile_id;
  ELSE
    EXECUTE format(
      'SELECT up.tenant_id
       FROM public.user_profiles up
       WHERE %s
         AND up.tenant_id IS NOT NULL
       LIMIT 1',
      v_profile_match_expr
    )
    INTO v_profile_tenant
    USING v_uid, v_profile_id;
  END IF;

  IF v_profile_tenant IS NOT NULL THEN
    RETURN v_profile_tenant;
  END IF;

  IF p_preferred_tenant_id IS NOT NULL
     AND to_regprocedure('public.assert_current_user_can_access_tenant(uuid,boolean)') IS NOT NULL THEN
    BEGIN
      IF public.assert_current_user_can_access_tenant(p_preferred_tenant_id, false) THEN
        v_candidate := p_preferred_tenant_id;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        v_candidate := NULL;
    END;
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
      SELECT u.tenant_id
      INTO v_users_tenant
      FROM public.users u
      WHERE u.id = v_uid
      LIMIT 1;

      IF v_users_tenant IS NOT NULL THEN
        IF v_candidate IS NULL THEN
          v_candidate := v_users_tenant;
        ELSIF v_candidate IS DISTINCT FROM v_users_tenant THEN
          RETURN NULL;
        END IF;
      END IF;
    END IF;
  END IF;

  IF to_regclass('public.clinics') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'clinics'
        AND column_name = 'tenant_id'
    ) THEN
      IF to_regclass('public.user_clinic_access') IS NOT NULL THEN
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'user_clinic_access'
            AND column_name = 'user_id'
        ) INTO v_has_uca_user_id;

        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'user_clinic_access'
            AND column_name = 'clinic_id'
        ) INTO v_has_uca_clinic_id;

        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'user_clinic_access'
            AND column_name = 'is_active'
        ) INTO v_has_uca_is_active;

        IF v_has_uca_user_id AND v_has_uca_clinic_id THEN
          IF v_has_uca_is_active THEN
            FOR v_tenant IN
              SELECT DISTINCT c.tenant_id
              FROM public.user_clinic_access uca
              JOIN public.clinics c ON c.id = uca.clinic_id
              WHERE uca.user_id IN (v_uid, v_profile_id)
                AND COALESCE(uca.is_active, true) = true
                AND c.tenant_id IS NOT NULL
            LOOP
              IF NOT (v_tenant = ANY(v_tenant_candidates)) THEN
                v_tenant_candidates := array_append(v_tenant_candidates, v_tenant);
              END IF;
            END LOOP;
          ELSE
            FOR v_tenant IN
              SELECT DISTINCT c.tenant_id
              FROM public.user_clinic_access uca
              JOIN public.clinics c ON c.id = uca.clinic_id
              WHERE uca.user_id IN (v_uid, v_profile_id)
                AND c.tenant_id IS NOT NULL
            LOOP
              IF NOT (v_tenant = ANY(v_tenant_candidates)) THEN
                v_tenant_candidates := array_append(v_tenant_candidates, v_tenant);
              END IF;
            END LOOP;
          END IF;
        END IF;
      END IF;

      IF to_regclass('public.user_clinics') IS NOT NULL THEN
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'user_clinics'
            AND column_name = 'user_id'
        ) INTO v_has_uc_user_id;

        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'user_clinics'
            AND column_name = 'clinic_id'
        ) INTO v_has_uc_clinic_id;

        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'user_clinics'
            AND column_name = 'access_active'
        ) INTO v_has_uc_access_active;

        IF v_has_uc_user_id AND v_has_uc_clinic_id THEN
          IF v_has_uc_access_active THEN
            FOR v_tenant IN
              SELECT DISTINCT c.tenant_id
              FROM public.user_clinics uc
              JOIN public.clinics c ON c.id = uc.clinic_id
              WHERE uc.user_id IN (v_uid, v_profile_id)
                AND COALESCE(uc.access_active, true) = true
                AND c.tenant_id IS NOT NULL
            LOOP
              IF NOT (v_tenant = ANY(v_tenant_candidates)) THEN
                v_tenant_candidates := array_append(v_tenant_candidates, v_tenant);
              END IF;
            END LOOP;
          ELSE
            FOR v_tenant IN
              SELECT DISTINCT c.tenant_id
              FROM public.user_clinics uc
              JOIN public.clinics c ON c.id = uc.clinic_id
              WHERE uc.user_id IN (v_uid, v_profile_id)
                AND c.tenant_id IS NOT NULL
            LOOP
              IF NOT (v_tenant = ANY(v_tenant_candidates)) THEN
                v_tenant_candidates := array_append(v_tenant_candidates, v_tenant);
              END IF;
            END LOOP;
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  v_candidate_count := COALESCE(array_length(v_tenant_candidates, 1), 0);

  IF v_candidate_count > 0 THEN
    IF v_candidate IS NULL THEN
      IF v_candidate_count = 1 THEN
        v_candidate := v_tenant_candidates[1];
      ELSIF p_preferred_tenant_id IS NOT NULL AND p_preferred_tenant_id = ANY(v_tenant_candidates) THEN
        v_candidate := p_preferred_tenant_id;
      ELSE
        RETURN NULL;
      END IF;
    ELSE
      IF NOT (v_candidate = ANY(v_tenant_candidates)) THEN
        RETURN NULL;
      END IF;
      IF EXISTS (
        SELECT 1
        FROM unnest(v_tenant_candidates) AS t(tenant_id)
        WHERE t.tenant_id IS DISTINCT FROM v_candidate
      ) THEN
        RETURN NULL;
      END IF;
    END IF;
  END IF;

  IF v_candidate IS NULL THEN
    RETURN NULL;
  END IF;

  EXECUTE format(
    'SELECT EXISTS (
       SELECT 1
       FROM public.user_profiles up
       WHERE %s
     )',
    v_profile_match_expr
  )
  INTO v_has_any_profile
  USING v_uid, v_profile_id;

  IF v_has_any_profile THEN
    IF v_has_up_updated_at THEN
      EXECUTE format(
        'UPDATE public.user_profiles up
         SET tenant_id = $3,
             updated_at = NOW()
         WHERE %s
           AND up.tenant_id IS NULL',
        v_profile_match_expr
      )
      USING v_uid, v_profile_id, v_candidate;
    ELSE
      EXECUTE format(
        'UPDATE public.user_profiles up
         SET tenant_id = $3
         WHERE %s
           AND up.tenant_id IS NULL',
        v_profile_match_expr
      )
      USING v_uid, v_profile_id, v_candidate;
    END IF;
  ELSE
    SELECT LOWER(au.email)
    INTO v_email
    FROM auth.users au
    WHERE au.id = v_uid
    LIMIT 1;

    v_username := COALESCE(
      NULLIF(split_part(COALESCE(v_email, ''), '@', 1), ''),
      'user_' || replace(substring(v_uid::text, 1, 8), '-', '')
    );

    IF v_has_up_auth_id THEN
      INSERT INTO public.user_profiles (id, auth_id, username, email, role, status, tenant_id, created_at, updated_at)
      VALUES (v_profile_id, v_uid, v_username, v_email, 'DOCTOR', 'ACTIVE', v_candidate, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE
      SET
        auth_id = COALESCE(public.user_profiles.auth_id, EXCLUDED.auth_id),
        tenant_id = COALESCE(public.user_profiles.tenant_id, EXCLUDED.tenant_id),
        updated_at = NOW();
    ELSE
      INSERT INTO public.user_profiles (id, username, email, role, status, tenant_id, created_at, updated_at)
      VALUES (v_profile_id, v_username, v_email, 'DOCTOR', 'ACTIVE', v_candidate, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE
      SET
        tenant_id = COALESCE(public.user_profiles.tenant_id, EXCLUDED.tenant_id),
        updated_at = NOW();
    END IF;
  END IF;

  IF v_has_users_tenant THEN
    UPDATE public.users u
    SET tenant_id = v_candidate
    WHERE u.id = v_uid
      AND u.tenant_id IS NULL;
  END IF;

  RETURN v_candidate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.link_current_user_tenant_context(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_current_user_tenant_context(UUID) TO authenticated;

COMMIT;
