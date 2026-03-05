-- ============================================================================
-- 043_enforce_tenant_link_on_clinic_membership.sql
-- Purpose:
-- 1) Auto-sync user tenant when user is assigned to a clinic.
-- 2) Enforce tenant context for clinic create/update operations.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.sync_user_tenant_from_clinic_membership()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_has_clinics_tenant BOOLEAN;
  v_has_up_auth_id BOOLEAN;
  v_has_up_user_id BOOLEAN;
  v_has_users_tenant BOOLEAN;
BEGIN
  IF NEW.user_id IS NULL OR NEW.clinic_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clinics'
      AND column_name = 'tenant_id'
  ) INTO v_has_clinics_tenant;

  IF NOT v_has_clinics_tenant THEN
    RETURN NEW;
  END IF;

  EXECUTE 'SELECT c.tenant_id FROM public.clinics c WHERE c.id = $1 LIMIT 1'
    INTO v_tenant_id
    USING NEW.clinic_id;

  IF v_tenant_id IS NULL THEN
    RETURN NEW;
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

  IF v_has_up_auth_id AND v_has_up_user_id THEN
    EXECUTE '
      UPDATE public.user_profiles
      SET tenant_id = $1, updated_at = NOW()
      WHERE (id = $2 OR auth_id = $2 OR user_id = $2)
        AND (tenant_id IS NULL OR tenant_id IS DISTINCT FROM $1)
    '
    USING v_tenant_id, NEW.user_id;
  ELSIF v_has_up_auth_id THEN
    EXECUTE '
      UPDATE public.user_profiles
      SET tenant_id = $1, updated_at = NOW()
      WHERE (id = $2 OR auth_id = $2)
        AND (tenant_id IS NULL OR tenant_id IS DISTINCT FROM $1)
    '
    USING v_tenant_id, NEW.user_id;
  ELSIF v_has_up_user_id THEN
    EXECUTE '
      UPDATE public.user_profiles
      SET tenant_id = $1, updated_at = NOW()
      WHERE (id = $2 OR user_id = $2)
        AND (tenant_id IS NULL OR tenant_id IS DISTINCT FROM $1)
    '
    USING v_tenant_id, NEW.user_id;
  ELSE
    EXECUTE '
      UPDATE public.user_profiles
      SET tenant_id = $1, updated_at = NOW()
      WHERE id = $2
        AND (tenant_id IS NULL OR tenant_id IS DISTINCT FROM $1)
    '
    USING v_tenant_id, NEW.user_id;
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
      EXECUTE '
        UPDATE public.users
        SET tenant_id = $1
        WHERE id = $2
          AND (tenant_id IS NULL OR tenant_id IS DISTINCT FROM $1)
      '
      USING v_tenant_id, NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

DO $$
BEGIN
  IF to_regclass('public.user_clinic_access') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_sync_user_tenant_from_clinic_access ON public.user_clinic_access';
    EXECUTE '
      CREATE TRIGGER trg_sync_user_tenant_from_clinic_access
      AFTER INSERT OR UPDATE OF user_id, clinic_id ON public.user_clinic_access
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_user_tenant_from_clinic_membership()
    ';
  END IF;

  IF to_regclass('public.user_clinics') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_sync_user_tenant_from_user_clinics ON public.user_clinics';
    EXECUTE '
      CREATE TRIGGER trg_sync_user_tenant_from_user_clinics
      AFTER INSERT OR UPDATE OF user_id, clinic_id ON public.user_clinics
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_user_tenant_from_clinic_membership()
    ';
  END IF;
END
$$;

-- Backfill existing memberships immediately by forcing no-op updates that fire the trigger.
DO $$
BEGIN
  IF to_regclass('public.user_clinic_access') IS NOT NULL THEN
    EXECUTE '
      UPDATE public.user_clinic_access
      SET clinic_id = clinic_id
      WHERE clinic_id IS NOT NULL
        AND user_id IS NOT NULL
    ';
  END IF;

  IF to_regclass('public.user_clinics') IS NOT NULL THEN
    EXECUTE '
      UPDATE public.user_clinics
      SET clinic_id = clinic_id
      WHERE clinic_id IS NOT NULL
        AND user_id IS NOT NULL
    ';
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.enforce_clinic_tenant_id()
RETURNS TRIGGER AS $$
DECLARE
  v_has_tenant_column BOOLEAN;
  v_current_tenant UUID;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clinics'
      AND column_name = 'tenant_id'
  ) INTO v_has_tenant_column;

  IF NOT v_has_tenant_column THEN
    RETURN NEW;
  END IF;

  IF NEW.tenant_id IS NULL THEN
    BEGIN
      v_current_tenant := public.current_user_tenant_id();
    EXCEPTION
      WHEN undefined_function THEN
        v_current_tenant := NULL;
    END;

    IF v_current_tenant IS NOT NULL THEN
      NEW.tenant_id := v_current_tenant;
    END IF;
  END IF;

  IF NEW.tenant_id IS NULL AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Clinic tenant_id is required. Link your account to a tenant first.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

DO $$
BEGIN
  IF to_regclass('public.clinics') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_enforce_clinic_tenant_id ON public.clinics';
    EXECUTE '
      CREATE TRIGGER trg_enforce_clinic_tenant_id
      BEFORE INSERT OR UPDATE ON public.clinics
      FOR EACH ROW
      EXECUTE FUNCTION public.enforce_clinic_tenant_id()
    ';
  END IF;
END
$$;

COMMIT;
