-- ============================================================================
-- 025_enforce_self_only_on_user_owned_tables.sql
-- Purpose:
-- Enforce strict self-only RLS (user_id = auth.uid()) on all user-owned data tables.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.apply_self_only_rls_on_user_owned_table(p_table TEXT)
RETURNS VOID AS $$
DECLARE
  p RECORD;
BEGIN
  IF to_regclass(format('public.%I', p_table)) IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table
      AND column_name = 'user_id'
  ) THEN
    RETURN;
  END IF;

  EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', p_table);
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', p_table);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table);
  EXECUTE format('ALTER TABLE public.%I NO FORCE ROW LEVEL SECURITY', p_table);

  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = p_table
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p_table);
  END LOOP;

  EXECUTE format(
    'CREATE POLICY rls_select_self_only ON public.%I FOR SELECT USING (user_id = auth.uid())',
    p_table
  );
  EXECUTE format(
    'CREATE POLICY rls_insert_self_only ON public.%I FOR INSERT WITH CHECK (user_id = auth.uid())',
    p_table
  );
  EXECUTE format(
    'CREATE POLICY rls_update_self_only ON public.%I FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
    p_table
  );
  EXECUTE format(
    'CREATE POLICY rls_delete_self_only ON public.%I FOR DELETE USING (user_id = auth.uid())',
    p_table
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.apply_self_only_rls_on_user_owned_table(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_self_only_rls_on_user_owned_table(TEXT) TO authenticated;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'patients',
    'dentists',
    'appointments',
    'suppliers',
    'supplier_invoices',
    'supplier_invoice_attachments',
    'inventory_items',
    'expenses',
    'treatment_definitions',
    'treatment_doctor_percentages',
    'treatment_records',
    'payments',
    'doctor_payments',
    'prescriptions',
    'prescription_items',
    'patient_attachments',
    'insurance_companies',
    'insurance_accounts',
    'insurance_transactions',
    'patient_insurance_link',
    'treatment_insurance_link',
    'employees',
    'employee_attendance',
    'employee_compensations',
    'employee_leave_requests'
  ] LOOP
    PERFORM public.apply_self_only_rls_on_user_owned_table(t);
  END LOOP;
END
$$;

COMMIT;

