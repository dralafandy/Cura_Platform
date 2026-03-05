-- ============================================================================
-- 033_autofill_scope_columns_for_branch_rls.sql
-- Purpose:
-- Auto-fill user_id / clinic_id / branch_id before write so strict branch RLS
-- does not fail when legacy code omits scope columns.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.autofill_scope_columns()
RETURNS trigger AS $$
DECLARE
  v_branch_id UUID;
  v_clinic_id UUID;
BEGIN
  v_branch_id := public.current_session_branch_id();
  v_clinic_id := public.current_session_clinic_id();

  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    IF to_jsonb(NEW) ? 'user_id' THEN
      NEW.user_id := COALESCE(NEW.user_id, auth.uid());
    END IF;

    IF to_jsonb(NEW) ? 'branch_id' THEN
      NEW.branch_id := COALESCE(NEW.branch_id, v_branch_id);
    END IF;

    IF to_jsonb(NEW) ? 'clinic_id' THEN
      NEW.clinic_id := COALESCE(NEW.clinic_id, v_clinic_id);

      IF NEW.clinic_id IS NULL AND NEW.branch_id IS NOT NULL THEN
        SELECT cb.clinic_id
        INTO NEW.clinic_id
        FROM public.clinic_branches cb
        WHERE cb.id = NEW.branch_id
        LIMIT 1;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.autofill_scope_columns() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.autofill_scope_columns() TO authenticated;

DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT tb.table_name
    FROM information_schema.tables tb
    WHERE tb.table_schema = 'public'
      AND tb.table_type = 'BASE TABLE'
      AND tb.table_name NOT IN (
        'clinics',
        'clinic_branches',
        'clinic_settings',
        'user_clinics',
        'user_clinic_access',
        'user_profiles',
        'users',
        'roles',
        'role_permissions',
        'user_permission_overrides',
        'audit_logs',
        'tenants',
        'subscription_plans',
        'subscription_invoices',
        'tenant_invitations',
        'tenant_usage_logs'
      )
      AND EXISTS (
        SELECT 1
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = tb.table_name
          AND c.column_name IN ('user_id', 'clinic_id', 'branch_id')
      )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_autofill_scope ON public.%I', t.table_name, t.table_name);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_autofill_scope BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.autofill_scope_columns()',
      t.table_name,
      t.table_name
    );
  END LOOP;
END
$$;

COMMIT;
