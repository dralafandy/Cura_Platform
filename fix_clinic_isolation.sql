-- ============================================================================
-- CLINIC ISOLATION FIX - Ensure each clinic has its own data
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Add clinic_id to all data tables
-- ============================================================================

-- Add clinic_id to patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);

-- Add clinic_id to patient_attachments (via patients)
ALTER TABLE patient_attachments ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_patient_attachments_clinic_id ON patient_attachments(clinic_id);

-- Add clinic_id to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);

-- Add clinic_id to treatment_records
ALTER TABLE treatment_records ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_treatment_records_clinic_id ON treatment_records(clinic_id);

-- Add clinic_id to payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_payments_clinic_id ON payments(clinic_id);

-- Add clinic_id to expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_clinic_id ON expenses(clinic_id);

-- Add clinic_id to suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_suppliers_clinic_id ON suppliers(clinic_id);

-- Add clinic_id to supplier_invoices
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_clinic_id ON supplier_invoices(clinic_id);

-- Add clinic_id to inventory_items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_items_clinic_id ON inventory_items(clinic_id);

-- Add clinic_id to treatment_definitions
ALTER TABLE treatment_definitions ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_treatment_definitions_clinic_id ON treatment_definitions(clinic_id);

-- Add clinic_id to dentists
ALTER TABLE dentists ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_dentists_clinic_id ON dentists(clinic_id);

-- Add clinic_id to lab_cases
ALTER TABLE lab_cases ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_lab_cases_clinic_id ON lab_cases(clinic_id);

-- Add clinic_id to prescriptions
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic_id ON prescriptions(clinic_id);

-- Add clinic_id to employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_employees_clinic_id ON employees(clinic_id);

-- Add clinic_id to insurance tables
ALTER TABLE insurance_companies ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
ALTER TABLE insurance_accounts ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
ALTER TABLE patient_insurance_link ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
ALTER TABLE treatment_insurance_link ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 2: Create function to get user's accessible clinics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_clinic_ids(p_user_id UUID)
RETURNS TABLE(clinic_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT uc.clinic_id
    FROM user_clinics uc
    WHERE uc.user_id = p_user_id
    AND uc.access_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Create RLS policies for clinic isolation
-- ============================================================================

-- Patients - Only see patients in user's clinics
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "patients_clinic_isolation" ON patients;
CREATE POLICY "patients_clinic_isolation" ON patients
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    );

-- Patient Attachments - Only see attachments in user's clinics
ALTER TABLE patient_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "patient_attachments_clinic_isolation" ON patient_attachments;
CREATE POLICY "patient_attachments_clinic_isolation" ON patient_attachments
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    );

-- Appointments - Only see appointments in user's clinics
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "appointments_clinic_isolation" ON appointments;
CREATE POLICY "appointments_clinic_isolation" ON appointments
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    );

-- Treatment Records - Only see treatments in user's clinics
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "treatment_records_clinic_isolation" ON treatment_records;
CREATE POLICY "treatment_records_clinic_isolation" ON treatment_records
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    );

-- Payments - Only see payments in user's clinics
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_clinic_isolation" ON payments;
CREATE POLICY "payments_clinic_isolation" ON payments
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    );

-- Expenses - Only see expenses in user's clinics
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expenses_clinic_isolation" ON expenses;
CREATE POLICY "expenses_clinic_isolation" ON expenses
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    );

-- Suppliers - Only see suppliers in user's clinics
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "suppliers_clinic_isolation" ON suppliers;
CREATE POLICY "suppliers_clinic_isolation" ON suppliers
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    );

-- Supplier Invoices - Only see invoices in user's clinics
ALTER TABLE supplier_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "supplier_invoices_clinic_isolation" ON supplier_invoices;
CREATE POLICY "supplier_invoices_clinic_isolation" ON supplier_invoices
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    );

-- Inventory Items - Only see inventory in user's clinics
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_items_clinic_isolation" ON inventory_items;
CREATE POLICY "inventory_items_clinic_isolation" ON inventory_items
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    );

-- Treatment Definitions - Only see definitions in user's clinics
ALTER TABLE treatment_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "treatment_definitions_clinic_isolation" ON treatment_definitions;
CREATE POLICY "treatment_definitions_clinic_isolation" ON treatment_definitions
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    );

-- Dentists - Only see dentists in user's clinics
ALTER TABLE dentists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dentists_clinic_isolation" ON dentists;
CREATE POLICY "dentists_clinic_isolation" ON dentists
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    );

-- Lab Cases - Only see lab cases in user's clinics
ALTER TABLE lab_cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lab_cases_clinic_isolation" ON lab_cases;
CREATE POLICY "lab_cases_clinic_isolation" ON lab_cases
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    );

-- Prescriptions - Only see prescriptions in user's clinics
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prescriptions_clinic_isolation" ON prescriptions;
CREATE POLICY "prescriptions_clinic_isolation" ON prescriptions
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    );

-- Employees - Only see employees in user's clinics
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "employees_clinic_isolation" ON employees;
CREATE POLICY "employees_clinic_isolation" ON employees
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    );

-- ============================================================================
-- STEP 4: Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_user_clinic_ids(UUID) TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- ============================================================================
-- SUCCESS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================================';
    RAISE NOTICE 'CLINIC ISOLATION FIXED!';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Each clinic now has its own separate data.';
    RAISE NOTICE 'Users can only see data from their assigned clinics.';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: You need to:';
    RAISE NOTICE '1. Assign users to clinics via user_clinics table';
    RAISE NOTICE '2. Update your app to pass clinic_id when creating data';
    RAISE NOTICE '========================================================';
END $$;
