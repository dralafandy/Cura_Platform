-- ============================================================================
-- SIMPLE SECURE RLS POLICIES - Based on user_id (No clinic_id required)
-- ============================================================================
-- This is a simpler approach that filters by user_id instead of clinic_id.
-- This works for any database schema without requiring clinic_id columns.
-- ============================================================================

-- ============================================================================
-- STEP 1: Helper function to get user's assigned clinic IDs
-- ============================================================================

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

CREATE OR REPLACE FUNCTION get_user_clinic_ids(p_user_id UUID)
RETURNS TABLE(clinic_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT uc.clinic_id
    FROM user_clinics uc
    WHERE uc.user_id = p_user_id
    AND (uc.access_active = true OR uc.access_active IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_clinic_ids() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_clinic_ids(UUID) TO authenticated, anon;

-- ============================================================================
-- STEP 2: CLINICS TABLES - Allow access to user's assigned clinics
-- ============================================================================

-- Clinics - Users can see clinics they're assigned to
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinics_select" ON clinics;
DROP POLICY IF EXISTS "clinics_insert" ON clinics;
DROP POLICY IF EXISTS "clinics_update" ON clinics;
DROP POLICY IF EXISTS "clinics_delete" ON clinics;

CREATE POLICY "clinics_select" ON clinics FOR SELECT 
    USING (id IN (SELECT get_user_clinic_ids()) OR id IS NULL);

CREATE POLICY "clinics_insert" ON clinics FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "clinics_update" ON clinics FOR UPDATE 
    USING (id IN (SELECT get_user_clinic_ids()));

CREATE POLICY "clinics_delete" ON clinics FOR DELETE 
    USING (id IN (SELECT get_user_clinic_ids()));

-- Clinic Branches - Users can only see branches in their clinics
ALTER TABLE clinic_branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_branches_select" ON clinic_branches;
DROP POLICY IF EXISTS "clinic_branches_insert" ON clinic_branches;
DROP POLICY IF EXISTS "clinic_branches_update" ON clinic_branches;
DROP POLICY IF EXISTS "clinic_branches_delete" ON clinic_branches;

CREATE POLICY "clinic_branches_select" ON clinic_branches FOR SELECT 
    USING (clinic_id IN (SELECT get_user_clinic_ids()) OR clinic_id IS NULL);
CREATE POLICY "clinic_branches_insert" ON clinic_branches FOR INSERT 
    WITH CHECK (clinic_id IN (SELECT get_user_clinic_ids()) OR clinic_id IS NULL);
CREATE POLICY "clinic_branches_update" ON clinic_branches FOR UPDATE 
    USING (clinic_id IN (SELECT get_user_clinic_ids()) OR clinic_id IS NULL);
CREATE POLICY "clinic_branches_delete" ON clinic_branches FOR DELETE 
    USING (clinic_id IN (SELECT get_user_clinic_ids()) OR clinic_id IS NULL);

-- User Clinics - Users can only see their own clinic assignments
ALTER TABLE user_clinics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_clinics_select" ON user_clinics;
DROP POLICY IF EXISTS "user_clinics_insert" ON user_clinics;
DROP POLICY IF EXISTS "user_clinics_update" ON user_clinics;
DROP POLICY IF EXISTS "user_clinics_delete" ON user_clinics;

CREATE POLICY "user_clinics_select" ON user_clinics FOR SELECT 
    USING (user_id = auth.uid());
CREATE POLICY "user_clinics_insert" ON user_clinics FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_clinics_update" ON user_clinics FOR UPDATE 
    USING (user_id = auth.uid());
CREATE POLICY "user_clinics_delete" ON user_clinics FOR DELETE 
    USING (user_id = auth.uid());

-- ============================================================================
-- STEP 3: AUTH & USER TABLES - Keep RLS disabled (managed by app)
-- ============================================================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_permission_overrides DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: PATIENT DATA - Filter by user_id
-- ============================================================================

-- Dentists
ALTER TABLE dentists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dentists_select" ON dentists;
DROP POLICY IF EXISTS "dentists_insert" ON dentists;
DROP POLICY IF EXISTS "dentists_update" ON dentists;
DROP POLICY IF EXISTS "dentists_delete" ON dentists;

CREATE POLICY "dentists_select" ON dentists FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "dentists_insert" ON dentists FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "dentists_update" ON dentists FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "dentists_delete" ON dentists FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "patients_select" ON patients;
DROP POLICY IF EXISTS "patients_insert" ON patients;
DROP POLICY IF EXISTS "patients_update" ON patients;
DROP POLICY IF EXISTS "patients_delete" ON patients;

CREATE POLICY "patients_select" ON patients FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "patients_insert" ON patients FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "patients_update" ON patients FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "patients_delete" ON patients FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Patient Attachments
ALTER TABLE patient_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "patient_attachments_select" ON patient_attachments;
DROP POLICY IF EXISTS "patient_attachments_insert" ON patient_attachments;
DROP POLICY IF EXISTS "patient_attachments_update" ON patient_attachments;
DROP POLICY IF EXISTS "patient_attachments_delete" ON patient_attachments;

CREATE POLICY "patient_attachments_select" ON patient_attachments FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "patient_attachments_insert" ON patient_attachments FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "patient_attachments_update" ON patient_attachments FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "patient_attachments_delete" ON patient_attachments FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "appointments_select" ON appointments;
DROP POLICY IF EXISTS "appointments_insert" ON appointments;
DROP POLICY IF EXISTS "appointments_update" ON appointments;
DROP POLICY IF EXISTS "appointments_delete" ON appointments;

CREATE POLICY "appointments_select" ON appointments FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "appointments_insert" ON appointments FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "appointments_update" ON appointments FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "appointments_delete" ON appointments FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- STEP 5: FINANCIAL TABLES - Filter by user_id
-- ============================================================================

-- Suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "suppliers_select" ON suppliers;
DROP POLICY IF EXISTS "suppliers_insert" ON suppliers;
DROP POLICY IF EXISTS "suppliers_update" ON suppliers;
DROP POLICY IF EXISTS "suppliers_delete" ON suppliers;

CREATE POLICY "suppliers_select" ON suppliers FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "suppliers_insert" ON suppliers FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "suppliers_update" ON suppliers FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "suppliers_delete" ON suppliers FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Supplier Invoices
ALTER TABLE supplier_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "supplier_invoices_select" ON supplier_invoices;
DROP POLICY IF EXISTS "supplier_invoices_insert" ON supplier_invoices;
DROP POLICY IF EXISTS "supplier_invoices_update" ON supplier_invoices;
DROP POLICY IF EXISTS "supplier_invoices_delete" ON supplier_invoices;

CREATE POLICY "supplier_invoices_select" ON supplier_invoices FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "supplier_invoices_insert" ON supplier_invoices FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "supplier_invoices_update" ON supplier_invoices FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "supplier_invoices_delete" ON supplier_invoices FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Supplier Invoice Attachments
ALTER TABLE supplier_invoice_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "supplier_invoice_attachments_select" ON supplier_invoice_attachments;
DROP POLICY IF EXISTS "supplier_invoice_attachments_insert" ON supplier_invoice_attachments;
DROP POLICY IF EXISTS "supplier_invoice_attachments_update" ON supplier_invoice_attachments;
DROP POLICY IF EXISTS "supplier_invoice_attachments_delete" ON supplier_invoice_attachments;

CREATE POLICY "supplier_invoice_attachments_select" ON supplier_invoice_attachments FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "supplier_invoice_attachments_insert" ON supplier_invoice_attachments FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "supplier_invoice_attachments_update" ON supplier_invoice_attachments FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "supplier_invoice_attachments_delete" ON supplier_invoice_attachments FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Inventory Items
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_items_select" ON inventory_items;
DROP POLICY IF EXISTS "inventory_items_insert" ON inventory_items;
DROP POLICY IF EXISTS "inventory_items_update" ON inventory_items;
DROP POLICY IF EXISTS "inventory_items_delete" ON inventory_items;

CREATE POLICY "inventory_items_select" ON inventory_items FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "inventory_items_insert" ON inventory_items FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "inventory_items_update" ON inventory_items FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "inventory_items_delete" ON inventory_items FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expenses_select" ON expenses;
DROP POLICY IF EXISTS "expenses_insert" ON expenses;
DROP POLICY IF EXISTS "expenses_update" ON expenses;
DROP POLICY IF EXISTS "expenses_delete" ON expenses;

CREATE POLICY "expenses_select" ON expenses FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "expenses_insert" ON expenses FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "expenses_update" ON expenses FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "expenses_delete" ON expenses FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- STEP 6: TREATMENT TABLES - Filter by user_id
-- ============================================================================

-- Treatment Definitions
ALTER TABLE treatment_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "treatment_definitions_select" ON treatment_definitions;
DROP POLICY IF EXISTS "treatment_definitions_insert" ON treatment_definitions;
DROP POLICY IF EXISTS "treatment_definitions_update" ON treatment_definitions;
DROP POLICY IF EXISTS "treatment_definitions_delete" ON treatment_definitions;

CREATE POLICY "treatment_definitions_select" ON treatment_definitions FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "treatment_definitions_insert" ON treatment_definitions FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "treatment_definitions_update" ON treatment_definitions FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "treatment_definitions_delete" ON treatment_definitions FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Treatment Doctor Percentages
ALTER TABLE treatment_doctor_percentages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "treatment_doctor_percentages_select" ON treatment_doctor_percentages;
DROP POLICY IF EXISTS "treatment_doctor_percentages_insert" ON treatment_doctor_percentages;
DROP POLICY IF EXISTS "treatment_doctor_percentages_update" ON treatment_doctor_percentages;
DROP POLICY IF EXISTS "treatment_doctor_percentages_delete" ON treatment_doctor_percentages;

CREATE POLICY "treatment_doctor_percentages_select" ON treatment_doctor_percentages FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "treatment_doctor_percentages_insert" ON treatment_doctor_percentages FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "treatment_doctor_percentages_update" ON treatment_doctor_percentages FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "treatment_doctor_percentages_delete" ON treatment_doctor_percentages FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Treatment Records
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "treatment_records_select" ON treatment_records;
DROP POLICY IF EXISTS "treatment_records_insert" ON treatment_records;
DROP POLICY IF EXISTS "treatment_records_update" ON treatment_records;
DROP POLICY IF EXISTS "treatment_records_delete" ON treatment_records;

CREATE POLICY "treatment_records_select" ON treatment_records FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "treatment_records_insert" ON treatment_records FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "treatment_records_update" ON treatment_records FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "treatment_records_delete" ON treatment_records FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- STEP 7: PAYMENTS - Filter by user_id
-- ============================================================================

-- Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_select" ON payments;
DROP POLICY IF EXISTS "payments_insert" ON payments;
DROP POLICY IF EXISTS "payments_update" ON payments;
DROP POLICY IF EXISTS "payments_delete" ON payments;

CREATE POLICY "payments_select" ON payments FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "payments_insert" ON payments FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "payments_update" ON payments FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "payments_delete" ON payments FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Doctor Payments
ALTER TABLE doctor_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "doctor_payments_select" ON doctor_payments;
DROP POLICY IF EXISTS "doctor_payments_insert" ON doctor_payments;
DROP POLICY IF EXISTS "doctor_payments_update" ON doctor_payments;
DROP POLICY IF EXISTS "doctor_payments_delete" ON doctor_payments;

CREATE POLICY "doctor_payments_select" ON doctor_payments FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "doctor_payments_insert" ON doctor_payments FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "doctor_payments_update" ON doctor_payments FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "doctor_payments_delete" ON doctor_payments FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- STEP 8: INSURANCE TABLES - Filter by user_id
-- ============================================================================

-- Insurance Companies
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insurance_companies_select" ON insurance_companies;
DROP POLICY IF EXISTS "insurance_companies_insert" ON insurance_companies;
DROP POLICY IF EXISTS "insurance_companies_update" ON insurance_companies;
DROP POLICY IF EXISTS "insurance_companies_delete" ON insurance_companies;

CREATE POLICY "insurance_companies_select" ON insurance_companies FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "insurance_companies_insert" ON insurance_companies FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "insurance_companies_update" ON insurance_companies FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "insurance_companies_delete" ON insurance_companies FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Insurance Accounts
ALTER TABLE insurance_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insurance_accounts_select" ON insurance_accounts;
DROP POLICY IF EXISTS "insurance_accounts_insert" ON insurance_accounts;
DROP POLICY IF EXISTS "insurance_accounts_update" ON insurance_accounts;
DROP POLICY IF EXISTS "insurance_accounts_delete" ON insurance_accounts;

CREATE POLICY "insurance_accounts_select" ON insurance_accounts FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "insurance_accounts_insert" ON insurance_accounts FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "insurance_accounts_update" ON insurance_accounts FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "insurance_accounts_delete" ON insurance_accounts FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Insurance Transactions
ALTER TABLE insurance_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insurance_transactions_select" ON insurance_transactions;
DROP POLICY IF EXISTS "insurance_transactions_insert" ON insurance_transactions;
DROP POLICY IF EXISTS "insurance_transactions_update" ON insurance_transactions;
DROP POLICY IF EXISTS "insurance_transactions_delete" ON insurance_transactions;

CREATE POLICY "insurance_transactions_select" ON insurance_transactions FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "insurance_transactions_insert" ON insurance_transactions FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "insurance_transactions_update" ON insurance_transactions FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "insurance_transactions_delete" ON insurance_transactions FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Patient Insurance Link
ALTER TABLE patient_insurance_link ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "patient_insurance_link_select" ON patient_insurance_link;
DROP POLICY IF EXISTS "patient_insurance_link_insert" ON patient_insurance_link;
DROP POLICY IF EXISTS "patient_insurance_link_update" ON patient_insurance_link;
DROP POLICY IF EXISTS "patient_insurance_link_delete" ON patient_insurance_link;

CREATE POLICY "patient_insurance_link_select" ON patient_insurance_link FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "patient_insurance_link_insert" ON patient_insurance_link FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "patient_insurance_link_update" ON patient_insurance_link FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "patient_insurance_link_delete" ON patient_insurance_link FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Treatment Insurance Link
ALTER TABLE treatment_insurance_link ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "treatment_insurance_link_select" ON treatment_insurance_link;
DROP POLICY IF EXISTS "treatment_insurance_link_insert" ON treatment_insurance_link;
DROP POLICY IF EXISTS "treatment_insurance_link_update" ON treatment_insurance_link;
DROP POLICY IF EXISTS "treatment_insurance_link_delete" ON treatment_insurance_link;

CREATE POLICY "treatment_insurance_link_select" ON treatment_insurance_link FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "treatment_insurance_link_insert" ON treatment_insurance_link FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "treatment_insurance_link_update" ON treatment_insurance_link FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "treatment_insurance_link_delete" ON treatment_insurance_link FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- STEP 9: OTHER TABLES - Filter by user_id
-- ============================================================================

-- Lab Cases
ALTER TABLE lab_cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lab_cases_select" ON lab_cases;
DROP POLICY IF EXISTS "lab_cases_insert" ON lab_cases;
DROP POLICY IF EXISTS "lab_cases_update" ON lab_cases;
DROP POLICY IF EXISTS "lab_cases_delete" ON lab_cases;

CREATE POLICY "lab_cases_select" ON lab_cases FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "lab_cases_insert" ON lab_cases FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "lab_cases_update" ON lab_cases FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "lab_cases_delete" ON lab_cases FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Prescriptions
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prescriptions_select" ON prescriptions;
DROP POLICY IF EXISTS "prescriptions_insert" ON prescriptions;
DROP POLICY IF EXISTS "prescriptions_update" ON prescriptions;
DROP POLICY IF EXISTS "prescriptions_delete" ON prescriptions;

CREATE POLICY "prescriptions_select" ON prescriptions FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "prescriptions_insert" ON prescriptions FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "prescriptions_update" ON prescriptions FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "prescriptions_delete" ON prescriptions FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Prescription Items
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prescription_items_select" ON prescription_items;
DROP POLICY IF EXISTS "prescription_items_insert" ON prescription_items;
DROP POLICY IF EXISTS "prescription_items_update" ON prescription_items;
DROP POLICY IF EXISTS "prescription_items_delete" ON prescription_items;

CREATE POLICY "prescription_items_select" ON prescription_items FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "prescription_items_insert" ON prescription_items FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "prescription_items_update" ON prescription_items FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "prescription_items_delete" ON prescription_items FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "employees_select" ON employees;
DROP POLICY IF EXISTS "employees_insert" ON employees;
DROP POLICY IF EXISTS "employees_update" ON employees;
DROP POLICY IF EXISTS "employees_delete" ON employees;

CREATE POLICY "employees_select" ON employees FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "employees_insert" ON employees FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "employees_update" ON employees FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "employees_delete" ON employees FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Employee Attendance
ALTER TABLE employee_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "employee_attendance_select" ON employee_attendance;
DROP POLICY IF EXISTS "employee_attendance_insert" ON employee_attendance;
DROP POLICY IF EXISTS "employee_attendance_update" ON employee_attendance;
DROP POLICY IF EXISTS "employee_attendance_delete" ON employee_attendance;

CREATE POLICY "employee_attendance_select" ON employee_attendance FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "employee_attendance_insert" ON employee_attendance FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "employee_attendance_update" ON employee_attendance FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "employee_attendance_delete" ON employee_attendance FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- Employee Compensations
ALTER TABLE employee_compensations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "employee_compensations_select" ON employee_compensations;
DROP POLICY IF EXISTS "employee_compensations_insert" ON employee_compensations;
DROP POLICY IF EXISTS "employee_compensations_update" ON employee_compensations;
DROP POLICY IF EXISTS "employee_compensations_delete" ON employee_compensations;

CREATE POLICY "employee_compensations_select" ON employee_compensations FOR SELECT 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "employee_compensations_insert" ON employee_compensations FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "employee_compensations_update" ON employee_compensations FOR UPDATE 
    USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "employee_compensations_delete" ON employee_compensations FOR DELETE 
    USING (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 'Simple secure RLS policies applied successfully!' AS status;
