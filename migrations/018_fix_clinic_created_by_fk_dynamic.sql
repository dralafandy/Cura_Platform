-- ============================================================================
-- 018_fix_clinic_created_by_fk_dynamic.sql
-- Purpose:
-- 1) Detect real FK target for clinics/clinic_branches created_by, updated_by.
-- 2) Normalize actor ids dynamically (supports FK -> user_profiles or FK -> users).
-- 3) Prevent future FK violations with robust BEFORE INSERT/UPDATE trigger.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- FK target detector for a given table/column.
-- Returns referenced table name: 'user_profiles' | 'users' | NULL
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_fk_target_table_for_column(
  p_table_name TEXT,
  p_column_name TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_target TEXT;
BEGIN
  SELECT c_ref.relname
  INTO v_target
  FROM pg_constraint con
  JOIN pg_class c_src ON c_src.oid = con.conrelid
  JOIN pg_namespace n_src ON n_src.oid = c_src.relnamespace
  JOIN pg_attribute a_src ON a_src.attrelid = c_src.oid AND a_src.attnum = ANY(con.conkey)
  JOIN pg_class c_ref ON c_ref.oid = con.confrelid
  JOIN pg_namespace n_ref ON n_ref.oid = c_ref.relnamespace
  WHERE con.contype = 'f'
    AND n_src.nspname = 'public'
    AND c_src.relname = p_table_name
    AND a_src.attname = p_column_name
    AND n_ref.nspname = 'public'
  LIMIT 1;

  RETURN v_target;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.get_fk_target_table_for_column(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_fk_target_table_for_column(TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Resolve actor id for a specific FK target table.
-- p_target_table: 'user_profiles' or 'users'
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_actor_id_for_target(
  p_uid UUID,
  p_target_table TEXT
)
RETURNS UUID AS $$
DECLARE
  v_resolved UUID;
  v_exists BOOLEAN;
BEGIN
  IF p_uid IS NULL OR p_target_table IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_target_table = 'user_profiles' THEN
    -- Direct profile id
    IF EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = p_uid) THEN
      RETURN p_uid;
    END IF;

    -- auth id -> profile id
    SELECT up.id
    INTO v_resolved
    FROM public.user_profiles up
    WHERE up.auth_id = p_uid
    LIMIT 1;

    RETURN v_resolved;
  END IF;

  IF p_target_table = 'users' THEN
    -- Some deployments do not have public.users table.
    IF to_regclass('public.users') IS NULL THEN
      RETURN NULL;
    END IF;

    -- Direct users id
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.users u WHERE u.id = $1)'
      INTO v_exists
      USING p_uid;

    IF COALESCE(v_exists, false) THEN
      RETURN p_uid;
    END IF;

    -- Try map auth/profile id to users.id through user_profiles.id
    SELECT up.id
    INTO v_resolved
    FROM public.user_profiles up
    WHERE up.id = p_uid OR up.auth_id = p_uid
    ORDER BY CASE WHEN up.id = p_uid THEN 0 ELSE 1 END
    LIMIT 1;

    IF v_resolved IS NULL THEN
      RETURN NULL;
    END IF;

    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.users u WHERE u.id = $1)'
      INTO v_exists
      USING v_resolved;

    IF COALESCE(v_exists, false) THEN
      RETURN v_resolved;
    END IF;

    RETURN NULL;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.resolve_actor_id_for_target(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_actor_id_for_target(UUID, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Resolve actor id by reading the FK target of table/column dynamically.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_actor_id_for_fk(
  p_table_name TEXT,
  p_column_name TEXT,
  p_uid UUID
)
RETURNS UUID AS $$
DECLARE
  v_target TEXT;
BEGIN
  v_target := public.get_fk_target_table_for_column(p_table_name, p_column_name);
  RETURN public.resolve_actor_id_for_target(p_uid, v_target);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.resolve_actor_id_for_fk(TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_actor_id_for_fk(TEXT, TEXT, UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- Remove unsafe defaults if present.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.clinics') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.clinics ALTER COLUMN created_by DROP DEFAULT';
    EXECUTE 'ALTER TABLE public.clinics ALTER COLUMN updated_by DROP DEFAULT';
  END IF;

  IF to_regclass('public.clinic_branches') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.clinic_branches ALTER COLUMN created_by DROP DEFAULT';
    EXECUTE 'ALTER TABLE public.clinic_branches ALTER COLUMN updated_by DROP DEFAULT';
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Normalize existing rows according to actual FK targets.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.clinics') IS NOT NULL THEN
    UPDATE public.clinics c
    SET created_by = public.resolve_actor_id_for_fk('clinics', 'created_by', c.created_by)
    WHERE c.created_by IS NOT NULL;

    UPDATE public.clinics c
    SET updated_by = public.resolve_actor_id_for_fk('clinics', 'updated_by', c.updated_by)
    WHERE c.updated_by IS NOT NULL;
  END IF;

  IF to_regclass('public.clinic_branches') IS NOT NULL THEN
    UPDATE public.clinic_branches cb
    SET created_by = public.resolve_actor_id_for_fk('clinic_branches', 'created_by', cb.created_by)
    WHERE cb.created_by IS NOT NULL;

    UPDATE public.clinic_branches cb
    SET updated_by = public.resolve_actor_id_for_fk('clinic_branches', 'updated_by', cb.updated_by)
    WHERE cb.updated_by IS NOT NULL;
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- Robust trigger: always resolves created_by/updated_by to a valid FK id.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_clinic_audit_user_refs_dynamic()
RETURNS TRIGGER AS $$
DECLARE
  v_auth_uid UUID;
BEGIN
  v_auth_uid := auth.uid();

  IF TG_OP = 'INSERT' THEN
    NEW.created_by := public.resolve_actor_id_for_fk(
      TG_TABLE_NAME,
      'created_by',
      COALESCE(NEW.created_by, v_auth_uid)
    );
    NEW.updated_by := public.resolve_actor_id_for_fk(
      TG_TABLE_NAME,
      'updated_by',
      COALESCE(NEW.updated_by, NEW.created_by, v_auth_uid)
    );
  ELSE
    NEW.created_by := public.resolve_actor_id_for_fk(TG_TABLE_NAME, 'created_by', NEW.created_by);
    NEW.updated_by := public.resolve_actor_id_for_fk(
      TG_TABLE_NAME,
      'updated_by',
      COALESCE(NEW.updated_by, v_auth_uid)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

-- ---------------------------------------------------------------------------
-- Attach trigger on clinics and clinic_branches.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.clinics') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_normalize_clinics_audit_refs ON public.clinics;
    DROP TRIGGER IF EXISTS trg_normalize_clinics_audit_refs_dynamic ON public.clinics;
    CREATE TRIGGER trg_normalize_clinics_audit_refs_dynamic
      BEFORE INSERT OR UPDATE ON public.clinics
      FOR EACH ROW EXECUTE FUNCTION public.normalize_clinic_audit_user_refs_dynamic();
  END IF;

  IF to_regclass('public.clinic_branches') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_normalize_clinic_branches_audit_refs ON public.clinic_branches;
    DROP TRIGGER IF EXISTS trg_normalize_clinic_branches_audit_refs_dynamic ON public.clinic_branches;
    CREATE TRIGGER trg_normalize_clinic_branches_audit_refs_dynamic
      BEFORE INSERT OR UPDATE ON public.clinic_branches
      FOR EACH ROW EXECUTE FUNCTION public.normalize_clinic_audit_user_refs_dynamic();
  END IF;
END
$$;

COMMIT;
