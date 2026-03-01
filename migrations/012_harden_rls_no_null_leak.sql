-- ============================================================================
-- 012_harden_rls_no_null_leak.sql
-- Purpose: Prevent cross-tenant data leakage caused by NULL clinic_id/user_id
-- ============================================================================

BEGIN;

-- Utility: check if a column exists on a table
CREATE OR REPLACE FUNCTION column_exists(p_table TEXT, p_column TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table
      AND column_name = p_column
  );
END;
$$ LANGUAGE plpgsql;

-- 1) Keep helper function available
CREATE OR REPLACE FUNCTION get_user_clinic_ids()
RETURNS TABLE(clinic_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT uc.clinic_id
  FROM user_clinics uc
  WHERE uc.user_id = auth.uid()
    AND (uc.access_active = true OR uc.access_active IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_clinic_ids() TO authenticated;

-- 2) Reduce public exposure
REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon;

-- 3) Harden RLS policy generator (NO "... OR clinic_id IS NULL" and NO "... OR user_id IS NULL")
CREATE OR REPLACE PROCEDURE apply_strict_rls_policy(
  p_table TEXT,
  p_use_user_id BOOLEAN DEFAULT false,
  p_use_clinic_id BOOLEAN DEFAULT false
)
LANGUAGE plpgsql AS $$
DECLARE
  pol RECORD;
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', p_table);
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', p_table);

  -- Drop ALL existing policies on table (old scripts used many names like dentists_select, etc.)
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = p_table
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, p_table);
  END LOOP;

  IF p_use_clinic_id THEN
    EXECUTE format(
      'CREATE POLICY "rls_select" ON %I FOR SELECT USING (clinic_id IN (SELECT get_user_clinic_ids()))',
      p_table
    );
    EXECUTE format(
      'CREATE POLICY "rls_insert" ON %I FOR INSERT WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids()))',
      p_table
    );
    EXECUTE format(
      'CREATE POLICY "rls_update" ON %I FOR UPDATE USING (clinic_id IN (SELECT get_user_clinic_ids())) WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids()))',
      p_table
    );
    EXECUTE format(
      'CREATE POLICY "rls_delete" ON %I FOR DELETE USING (clinic_id IN (SELECT get_user_clinic_ids()))',
      p_table
    );
  ELSIF p_use_user_id THEN
    EXECUTE format(
      'CREATE POLICY "rls_select" ON %I FOR SELECT USING (user_id = auth.uid())',
      p_table
    );
    EXECUTE format(
      'CREATE POLICY "rls_insert" ON %I FOR INSERT WITH CHECK (user_id = auth.uid())',
      p_table
    );
    EXECUTE format(
      'CREATE POLICY "rls_update" ON %I FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
      p_table
    );
    EXECUTE format(
      'CREATE POLICY "rls_delete" ON %I FOR DELETE USING (user_id = auth.uid())',
      p_table
    );
  ELSE
    -- fallback is authenticated-only, not anon
    EXECUTE format(
      'CREATE POLICY "rls_select" ON %I FOR SELECT USING (auth.uid() IS NOT NULL)',
      p_table
    );
    EXECUTE format(
      'CREATE POLICY "rls_insert" ON %I FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)',
      p_table
    );
    EXECUTE format(
      'CREATE POLICY "rls_update" ON %I FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)',
      p_table
    );
    EXECUTE format(
      'CREATE POLICY "rls_delete" ON %I FOR DELETE USING (auth.uid() IS NOT NULL)',
      p_table
    );
  END IF;
END;
$$;

-- 4) Apply strict policies to key tables (expand as needed)
DO $$
DECLARE
  t TEXT;
  target_tables TEXT[] := ARRAY[
    'dentists',
    'patients',
    'appointments',
    'patient_attachments',
    'suppliers',
    'supplier_invoices',
    'supplier_invoice_attachments',
    'inventory_items',
    'expenses',
    'treatment_definitions',
    'treatment_records',
    'payments',
    'doctor_payments',
    'insurance_companies',
    'insurance_accounts',
    'insurance_transactions',
    'patient_insurance_link',
    'treatment_insurance_link',
    'lab_cases',
    'prescriptions',
    'prescription_items',
    'employees',
    'employee_attendance',
    'employee_compensations'
  ];
BEGIN
  FOREACH t IN ARRAY target_tables LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      RAISE NOTICE 'Skipping %. Table does not exist.', t;
    ELSIF column_exists(t, 'clinic_id') THEN
      CALL apply_strict_rls_policy(t, false, true);
    ELSIF column_exists(t, 'user_id') THEN
      CALL apply_strict_rls_policy(t, true, false);
    ELSE
      RAISE NOTICE 'Skipping %. Neither clinic_id nor user_id exists.', t;
    END IF;
  END LOOP;
END;
$$;

-- 5) Optional hardening: enforce NOT NULL on clinic_id for highest-risk tables
-- Run only after backfilling NULL clinic_id rows
-- ALTER TABLE dentists ALTER COLUMN clinic_id SET NOT NULL;
-- ALTER TABLE patients ALTER COLUMN clinic_id SET NOT NULL;
-- ALTER TABLE appointments ALTER COLUMN clinic_id SET NOT NULL;

COMMIT;

SELECT 'RLS hardening migration completed (no NULL leak).' AS status;
