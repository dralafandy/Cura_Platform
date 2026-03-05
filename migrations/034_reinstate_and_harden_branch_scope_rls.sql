-- ============================================================================
-- 034_reinstate_and_harden_branch_scope_rls.sql
-- Purpose:
-- 1) Re-apply branch/clinic scope RLS after potential rollback migrations.
-- 2) Enforce branch isolation for child tables that do not carry branch_id directly.
-- 3) Recreate branch-scoped convenience views.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.apply_branch_scope_rls(p_table TEXT, p_scope_column TEXT)
RETURNS VOID AS $$
DECLARE
  p RECORD;
  v_policy_prefix TEXT;
  v_using_expr TEXT;
  v_check_expr TEXT;
BEGIN
  IF to_regclass(format('public.%I', p_table)) IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = p_table
      AND c.relkind IN ('r', 'p')
  ) THEN
    RETURN;
  END IF;

  IF p_scope_column NOT IN ('branch_id', 'clinic_id') THEN
    RETURN;
  END IF;

  IF p_scope_column = 'branch_id' THEN
    v_using_expr := '(branch_id = public.current_session_branch_id())';
    v_check_expr := '(branch_id = public.current_session_branch_id())';
  ELSE
    v_using_expr := '(clinic_id = public.current_session_clinic_id())';
    v_check_expr := '(clinic_id = public.current_session_clinic_id())';
  END IF;

  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table);

  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = p_table
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p_table);
  END LOOP;

  v_policy_prefix := p_table || '_branch_scope';

  EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING %s', v_policy_prefix || '_select', p_table, v_using_expr);
  EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK %s', v_policy_prefix || '_insert', p_table, v_check_expr);
  EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING %s WITH CHECK %s', v_policy_prefix || '_update', p_table, v_using_expr, v_check_expr);
  EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING %s', v_policy_prefix || '_delete', p_table, v_using_expr);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.apply_parent_branch_scope_rls(
  p_table TEXT,
  p_fk_column TEXT,
  p_parent_table TEXT,
  p_parent_pk_column TEXT DEFAULT 'id',
  p_parent_branch_column TEXT DEFAULT 'branch_id'
)
RETURNS VOID AS $$
DECLARE
  p RECORD;
  v_policy_prefix TEXT;
  v_exists_expr TEXT;
  v_exists_check_expr TEXT;
BEGIN
  IF to_regclass(format('public.%I', p_table)) IS NULL THEN
    RETURN;
  END IF;

  IF to_regclass(format('public.%I', p_parent_table)) IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = p_table
      AND c.column_name = p_fk_column
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = p_parent_table
      AND c.column_name = p_parent_pk_column
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = p_parent_table
      AND c.column_name = p_parent_branch_column
  ) THEN
    RETURN;
  END IF;

  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table);

  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = p_table
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p_table);
  END LOOP;

  v_policy_prefix := p_table || '_derived_branch_scope';

  v_exists_expr := format(
    'EXISTS (SELECT 1 FROM public.%I parent WHERE parent.%I = %I.%I AND parent.%I = public.current_session_branch_id())',
    p_parent_table,
    p_parent_pk_column,
    p_table,
    p_fk_column,
    p_parent_branch_column
  );

  v_exists_check_expr := format(
    'EXISTS (SELECT 1 FROM public.%I parent WHERE parent.%I = %I AND parent.%I = public.current_session_branch_id())',
    p_parent_table,
    p_parent_pk_column,
    p_fk_column,
    p_parent_branch_column
  );

  EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (%s)', v_policy_prefix || '_select', p_table, v_exists_expr);
  EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (%s)', v_policy_prefix || '_insert', p_table, v_exists_check_expr);
  EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (%s) WITH CHECK (%s)', v_policy_prefix || '_update', p_table, v_exists_expr, v_exists_check_expr);
  EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (%s)', v_policy_prefix || '_delete', p_table, v_exists_expr);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.apply_branch_scope_rls(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.apply_parent_branch_scope_rls(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_branch_scope_rls(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_parent_branch_scope_rls(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

DO $$
DECLARE
  t RECORD;
  v_excluded TEXT[] := ARRAY[
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
    'tenant_usage_logs',
    'online_reservations',
    'working_hours'
  ];
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema
     AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'branch_id'
      AND tb.table_type = 'BASE TABLE'
      AND c.table_name <> ALL(v_excluded)
    GROUP BY c.table_name
  LOOP
    PERFORM public.apply_branch_scope_rls(t.table_name, 'branch_id');
  END LOOP;

  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema
     AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'clinic_id'
      AND tb.table_type = 'BASE TABLE'
      AND c.table_name <> ALL(v_excluded)
      AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns b
        WHERE b.table_schema = 'public'
          AND b.table_name = c.table_name
          AND b.column_name = 'branch_id'
      )
    GROUP BY c.table_name
  LOOP
    PERFORM public.apply_branch_scope_rls(t.table_name, 'clinic_id');
  END LOOP;
END
$$;

-- Child tables that do not store branch_id directly.
DO $$
BEGIN
  PERFORM public.apply_parent_branch_scope_rls('patient_attachments', 'patient_id', 'patients');
  PERFORM public.apply_parent_branch_scope_rls('prescription_items', 'prescription_id', 'prescriptions');
  PERFORM public.apply_parent_branch_scope_rls('supplier_invoice_attachments', 'supplier_invoice_id', 'supplier_invoices');
  PERFORM public.apply_parent_branch_scope_rls('doctor_payments', 'dentist_id', 'dentists');
  PERFORM public.apply_parent_branch_scope_rls('insurance_accounts', 'insurance_company_id', 'insurance_companies');
  PERFORM public.apply_parent_branch_scope_rls('patient_insurance_link', 'patient_id', 'patients');
  PERFORM public.apply_parent_branch_scope_rls('treatment_insurance_link', 'treatment_record_id', 'treatment_records');
  PERFORM public.apply_parent_branch_scope_rls('employee_attendance', 'employee_id', 'employees');
  PERFORM public.apply_parent_branch_scope_rls('employee_compensations', 'employee_id', 'employees');
  PERFORM public.apply_parent_branch_scope_rls('employee_leave_requests', 'employee_id', 'employees');
END
$$;

DO $$
DECLARE
  p RECORD;
BEGIN
  IF to_regclass('public.insurance_transactions') IS NULL
     OR to_regclass('public.insurance_accounts') IS NULL
     OR to_regclass('public.insurance_companies') IS NULL THEN
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE public.insurance_transactions ENABLE ROW LEVEL SECURITY';

  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'insurance_transactions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.insurance_transactions', p.policyname);
  END LOOP;

  EXECUTE '
    CREATE POLICY insurance_transactions_derived_branch_scope_select
    ON public.insurance_transactions
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.insurance_accounts ia
        JOIN public.insurance_companies ic ON ic.id = ia.insurance_company_id
        WHERE ia.id = insurance_transactions.insurance_account_id
          AND ic.branch_id = public.current_session_branch_id()
      )
    )';

  EXECUTE '
    CREATE POLICY insurance_transactions_derived_branch_scope_insert
    ON public.insurance_transactions
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.insurance_accounts ia
        JOIN public.insurance_companies ic ON ic.id = ia.insurance_company_id
        WHERE ia.id = insurance_transactions.insurance_account_id
          AND ic.branch_id = public.current_session_branch_id()
      )
    )';

  EXECUTE '
    CREATE POLICY insurance_transactions_derived_branch_scope_update
    ON public.insurance_transactions
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1
        FROM public.insurance_accounts ia
        JOIN public.insurance_companies ic ON ic.id = ia.insurance_company_id
        WHERE ia.id = insurance_transactions.insurance_account_id
          AND ic.branch_id = public.current_session_branch_id()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.insurance_accounts ia
        JOIN public.insurance_companies ic ON ic.id = ia.insurance_company_id
        WHERE ia.id = insurance_transactions.insurance_account_id
          AND ic.branch_id = public.current_session_branch_id()
      )
    )';

  EXECUTE '
    CREATE POLICY insurance_transactions_derived_branch_scope_delete
    ON public.insurance_transactions
    FOR DELETE
    USING (
      EXISTS (
        SELECT 1
        FROM public.insurance_accounts ia
        JOIN public.insurance_companies ic ON ic.id = ia.insurance_company_id
        WHERE ia.id = insurance_transactions.insurance_account_id
          AND ic.branch_id = public.current_session_branch_id()
      )
    )';
END
$$;

CREATE OR REPLACE VIEW public.current_branch_user_clinics_view AS
SELECT *
FROM public.user_clinics_view
WHERE branch_id IS NOT DISTINCT FROM public.current_session_branch_id();

CREATE OR REPLACE VIEW public.current_branch_patients AS
SELECT *
FROM public.patients
WHERE branch_id = public.current_session_branch_id();

CREATE OR REPLACE VIEW public.current_branch_appointments AS
SELECT *
FROM public.appointments
WHERE branch_id = public.current_session_branch_id();

REVOKE ALL ON TABLE public.current_branch_user_clinics_view FROM PUBLIC;
REVOKE ALL ON TABLE public.current_branch_patients FROM PUBLIC;
REVOKE ALL ON TABLE public.current_branch_appointments FROM PUBLIC;
GRANT SELECT ON TABLE public.current_branch_user_clinics_view TO authenticated;
GRANT SELECT ON TABLE public.current_branch_patients TO authenticated;
GRANT SELECT ON TABLE public.current_branch_appointments TO authenticated;

COMMIT;
