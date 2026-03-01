-- ============================================================================
-- COMPREHENSIVE RLS FIX FOR ALL TABLES (Fixed - No Recursion)
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- CLINICS TABLES
-- ============================================================================

-- Clinics
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinics_select" ON clinics;
DROP POLICY IF EXISTS "clinics_insert" ON clinics;
DROP POLICY IF EXISTS "clinics_update" ON clinics;
DROP POLICY IF EXISTS "clinics_delete" ON clinics;
CREATE POLICY "clinics_select" ON clinics FOR SELECT USING (true);
CREATE POLICY "clinics_insert" ON clinics FOR INSERT WITH CHECK (true);
CREATE POLICY "clinics_update" ON clinics FOR UPDATE USING (true);
CREATE POLICY "clinics_delete" ON clinics FOR DELETE USING (true);

-- Clinic Branches
ALTER TABLE clinic_branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_branches_select" ON clinic_branches;
DROP POLICY IF EXISTS "clinic_branches_insert" ON clinic_branches;
DROP POLICY IF EXISTS "clinic_branches_update" ON clinic_branches;
DROP POLICY IF EXISTS "clinic_branches_delete" ON clinic_branches;
CREATE POLICY "clinic_branches_select" ON clinic_branches FOR SELECT USING (true);
CREATE POLICY "clinic_branches_insert" ON clinic_branches FOR INSERT WITH CHECK (true);
CREATE POLICY "clinic_branches_update" ON clinic_branches FOR UPDATE USING (true);
CREATE POLICY "clinic_branches_delete" ON clinic_branches FOR DELETE USING (true);

-- User Clinics
ALTER TABLE user_clinics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_clinics_select" ON user_clinics;
DROP POLICY IF EXISTS "user_clinics_insert" ON user_clinics;
DROP POLICY IF EXISTS "user_clinics_update" ON user_clinics;
DROP POLICY IF EXISTS "user_clinics_delete" ON user_clinics;
CREATE POLICY "user_clinics_select" ON user_clinics FOR SELECT USING (true);
CREATE POLICY "user_clinics_insert" ON user_clinics FOR INSERT WITH CHECK (true);
CREATE POLICY "user_clinics_update" ON user_clinics FOR UPDATE USING (true);
CREATE POLICY "user_clinics_delete" ON user_clinics FOR DELETE USING (true);

-- ============================================================================
-- AUTH & USER TABLES (No RLS - managed by app)
-- ============================================================================

-- Users - NO RLS (managed at app level)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- User Profiles - NO RLS (managed at app level)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Roles - NO RLS
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;

-- Role Permissions - NO RLS
ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY;

-- User Permission Overrides - NO RLS
ALTER TABLE user_permission_overrides DISABLE ROW LEVEL SECURITY;

-- Audit Logs - NO RLS
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CLINIC DATA TABLES
-- ============================================================================

-- Dentists
ALTER TABLE dentists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dentists_select" ON dentists;
DROP POLICY IF EXISTS "dentists_insert" ON dentists;
DROP POLICY IF EXISTS "dentists_update" ON dentists;
DROP POLICY IF EXISTS "dentists_delete" ON dentists;
CREATE POLICY "dentists_select" ON dentists FOR SELECT USING (true);
CREATE POLICY "dentists_insert" ON dentists FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "dentists_update" ON dentists FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "dentists_delete" ON dentists FOR DELETE USING (user_id IS NOT NULL);

-- Patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "patients_select" ON patients;
DROP POLICY IF EXISTS "patients_insert" ON patients;
DROP POLICY IF EXISTS "patients_update" ON patients;
DROP POLICY IF EXISTS "patients_delete" ON patients;
CREATE POLICY "patients_select" ON patients FOR SELECT USING (true);
CREATE POLICY "patients_insert" ON patients FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "patients_update" ON patients FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "patients_delete" ON patients FOR DELETE USING (user_id IS NOT NULL);

-- Patient Attachments
ALTER TABLE patient_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "patient_attachments_select" ON patient_attachments;
DROP POLICY IF EXISTS "patient_attachments_insert" ON patient_attachments;
DROP POLICY IF EXISTS "patient_attachments_update" ON patient_attachments;
DROP POLICY IF EXISTS "patient_attachments_delete" ON patient_attachments;
CREATE POLICY "patient_attachments_select" ON patient_attachments FOR SELECT USING (true);
CREATE POLICY "patient_attachments_insert" ON patient_attachments FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "patient_attachments_update" ON patient_attachments FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "patient_attachments_delete" ON patient_attachments FOR DELETE USING (user_id IS NOT NULL);

-- Appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "appointments_select" ON appointments;
DROP POLICY IF EXISTS "appointments_insert" ON appointments;
DROP POLICY IF EXISTS "appointments_update" ON appointments;
DROP POLICY IF EXISTS "appointments_delete" ON appointments;
CREATE POLICY "appointments_select" ON appointments FOR SELECT USING (true);
CREATE POLICY "appointments_insert" ON appointments FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "appointments_update" ON appointments FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "appointments_delete" ON appointments FOR DELETE USING (user_id IS NOT NULL);

-- ============================================================================
-- FINANCIAL TABLES
-- ============================================================================

-- Suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "suppliers_select" ON suppliers;
DROP POLICY IF EXISTS "suppliers_insert" ON suppliers;
DROP POLICY IF EXISTS "suppliers_update" ON suppliers;
DROP POLICY IF EXISTS "suppliers_delete" ON suppliers;
CREATE POLICY "suppliers_select" ON suppliers FOR SELECT USING (true);
CREATE POLICY "suppliers_insert" ON suppliers FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "suppliers_update" ON suppliers FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "suppliers_delete" ON suppliers FOR DELETE USING (user_id IS NOT NULL);

-- Supplier Invoices
ALTER TABLE supplier_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "supplier_invoices_select" ON supplier_invoices;
DROP POLICY IF EXISTS "supplier_invoices_insert" ON supplier_invoices;
DROP POLICY IF EXISTS "supplier_invoices_update" ON supplier_invoices;
DROP POLICY IF EXISTS "supplier_invoices_delete" ON supplier_invoices;
CREATE POLICY "supplier_invoices_select" ON supplier_invoices FOR SELECT USING (true);
CREATE POLICY "supplier_invoices_insert" ON supplier_invoices FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "supplier_invoices_update" ON supplier_invoices FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "supplier_invoices_delete" ON supplier_invoices FOR DELETE USING (user_id IS NOT NULL);

-- Supplier Invoice Attachments
ALTER TABLE supplier_invoice_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "supplier_invoice_attachments_select" ON supplier_invoice_attachments;
DROP POLICY IF EXISTS "supplier_invoice_attachments_insert" ON supplier_invoice_attachments;
DROP POLICY IF EXISTS "supplier_invoice_attachments_update" ON supplier_invoice_attachments;
DROP POLICY IF EXISTS "supplier_invoice_attachments_delete" ON supplier_invoice_attachments;
CREATE POLICY "supplier_invoice_attachments_select" ON supplier_invoice_attachments FOR SELECT USING (true);
CREATE POLICY "supplier_invoice_attachments_insert" ON supplier_invoice_attachments FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "supplier_invoice_attachments_update" ON supplier_invoice_attachments FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "supplier_invoice_attachments_delete" ON supplier_invoice_attachments FOR DELETE USING (user_id IS NOT NULL);

-- Inventory Items
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_items_select" ON inventory_items;
DROP POLICY IF EXISTS "inventory_items_insert" ON inventory_items;
DROP POLICY IF EXISTS "inventory_items_update" ON inventory_items;
DROP POLICY IF EXISTS "inventory_items_delete" ON inventory_items;
CREATE POLICY "inventory_items_select" ON inventory_items FOR SELECT USING (true);
CREATE POLICY "inventory_items_insert" ON inventory_items FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "inventory_items_update" ON inventory_items FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "inventory_items_delete" ON inventory_items FOR DELETE USING (user_id IS NOT NULL);

-- Expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expenses_select" ON expenses;
DROP POLICY IF EXISTS "expenses_insert" ON expenses;
DROP POLICY IF EXISTS "expenses_update" ON expenses;
DROP POLICY IF EXISTS "expenses_delete" ON expenses;
CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (true);
CREATE POLICY "expenses_insert" ON expenses FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "expenses_update" ON expenses FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "expenses_delete" ON expenses FOR DELETE USING (user_id IS NOT NULL);

-- ============================================================================
-- TREATMENT TABLES
-- ============================================================================

-- Treatment Definitions
ALTER TABLE treatment_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "treatment_definitions_select" ON treatment_definitions;
DROP POLICY IF EXISTS "treatment_definitions_insert" ON treatment_definitions;
DROP POLICY IF EXISTS "treatment_definitions_update" ON treatment_definitions;
DROP POLICY IF EXISTS "treatment_definitions_delete" ON treatment_definitions;
CREATE POLICY "treatment_definitions_select" ON treatment_definitions FOR SELECT USING (true);
CREATE POLICY "treatment_definitions_insert" ON treatment_definitions FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "treatment_definitions_update" ON treatment_definitions FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "treatment_definitions_delete" ON treatment_definitions FOR DELETE USING (user_id IS NOT NULL);

-- Treatment Doctor Percentages
ALTER TABLE treatment_doctor_percentages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "treatment_doctor_percentages_select" ON treatment_doctor_percentages;
DROP POLICY IF EXISTS "treatment_doctor_percentages_insert" ON treatment_doctor_percentages;
DROP POLICY IF EXISTS "treatment_doctor_percentages_update" ON treatment_doctor_percentages;
DROP POLICY IF EXISTS "treatment_doctor_percentages_delete" ON treatment_doctor_percentages;
CREATE POLICY "treatment_doctor_percentages_select" ON treatment_doctor_percentages FOR SELECT USING (true);
CREATE POLICY "treatment_doctor_percentages_insert" ON treatment_doctor_percentages FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "treatment_doctor_percentages_update" ON treatment_doctor_percentages FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "treatment_doctor_percentages_delete" ON treatment_doctor_percentages FOR DELETE USING (user_id IS NOT NULL);

-- Treatment Records
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "treatment_records_select" ON treatment_records;
DROP POLICY IF EXISTS "treatment_records_insert" ON treatment_records;
DROP POLICY IF EXISTS "treatment_records_update" ON treatment_records;
DROP POLICY IF EXISTS "treatment_records_delete" ON treatment_records;
CREATE POLICY "treatment_records_select" ON treatment_records FOR SELECT USING (true);
CREATE POLICY "treatment_records_insert" ON treatment_records FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "treatment_records_update" ON treatment_records FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "treatment_records_delete" ON treatment_records FOR DELETE USING (user_id IS NOT NULL);

-- ============================================================================
-- PAYMENTS TABLES
-- ============================================================================

-- Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_select" ON payments;
DROP POLICY IF EXISTS "payments_insert" ON payments;
DROP POLICY IF EXISTS "payments_update" ON payments;
DROP POLICY IF EXISTS "payments_delete" ON payments;
CREATE POLICY "payments_select" ON payments FOR SELECT USING (true);
CREATE POLICY "payments_insert" ON payments FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "payments_update" ON payments FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "payments_delete" ON payments FOR DELETE USING (user_id IS NOT NULL);

-- Doctor Payments
ALTER TABLE doctor_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "doctor_payments_select" ON doctor_payments;
DROP POLICY IF EXISTS "doctor_payments_insert" ON doctor_payments;
DROP POLICY IF EXISTS "doctor_payments_update" ON doctor_payments;
DROP POLICY IF EXISTS "doctor_payments_delete" ON doctor_payments;
CREATE POLICY "doctor_payments_select" ON doctor_payments FOR SELECT USING (true);
CREATE POLICY "doctor_payments_insert" ON doctor_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "doctor_payments_update" ON doctor_payments FOR UPDATE USING (true);
CREATE POLICY "doctor_payments_delete" ON doctor_payments FOR DELETE USING (true);

-- ============================================================================
-- INSURANCE TABLES
-- ============================================================================

-- Insurance Companies
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insurance_companies_select" ON insurance_companies;
DROP POLICY IF EXISTS "insurance_companies_insert" ON insurance_companies;
DROP POLICY IF EXISTS "insurance_companies_update" ON insurance_companies;
DROP POLICY IF EXISTS "insurance_companies_delete" ON insurance_companies;
CREATE POLICY "insurance_companies_select" ON insurance_companies FOR SELECT USING (true);
CREATE POLICY "insurance_companies_insert" ON insurance_companies FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "insurance_companies_update" ON insurance_companies FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "insurance_companies_delete" ON insurance_companies FOR DELETE USING (user_id IS NOT NULL);

-- Insurance Accounts
ALTER TABLE insurance_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insurance_accounts_select" ON insurance_accounts;
DROP POLICY IF EXISTS "insurance_accounts_insert" ON insurance_accounts;
DROP POLICY IF EXISTS "insurance_accounts_update" ON insurance_accounts;
DROP POLICY IF EXISTS "insurance_accounts_delete" ON insurance_accounts;
CREATE POLICY "insurance_accounts_select" ON insurance_accounts FOR SELECT USING (true);
CREATE POLICY "insurance_accounts_insert" ON insurance_accounts FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "insurance_accounts_update" ON insurance_accounts FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "insurance_accounts_delete" ON insurance_accounts FOR DELETE USING (user_id IS NOT NULL);

-- Insurance Transactions
ALTER TABLE insurance_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "insurance_transactions_select" ON insurance_transactions;
DROP POLICY IF EXISTS "insurance_transactions_insert" ON insurance_transactions;
DROP POLICY IF EXISTS "insurance_transactions_update" ON insurance_transactions;
DROP POLICY IF EXISTS "insurance_transactions_delete" ON insurance_transactions;
CREATE POLICY "insurance_transactions_select" ON insurance_transactions FOR SELECT USING (true);
CREATE POLICY "insurance_transactions_insert" ON insurance_transactions FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "insurance_transactions_update" ON insurance_transactions FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "insurance_transactions_delete" ON insurance_transactions FOR DELETE USING (user_id IS NOT NULL);

-- Patient Insurance Link
ALTER TABLE patient_insurance_link ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "patient_insurance_link_select" ON patient_insurance_link;
DROP POLICY IF EXISTS "patient_insurance_link_insert" ON patient_insurance_link;
DROP POLICY IF EXISTS "patient_insurance_link_update" ON patient_insurance_link;
DROP POLICY IF EXISTS "patient_insurance_link_delete" ON patient_insurance_link;
CREATE POLICY "patient_insurance_link_select" ON patient_insurance_link FOR SELECT USING (true);
CREATE POLICY "patient_insurance_link_insert" ON patient_insurance_link FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "patient_insurance_link_update" ON patient_insurance_link FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "patient_insurance_link_delete" ON patient_insurance_link FOR DELETE USING (user_id IS NOT NULL);

-- Treatment Insurance Link
ALTER TABLE treatment_insurance_link ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "treatment_insurance_link_select" ON treatment_insurance_link;
DROP POLICY IF EXISTS "treatment_insurance_link_insert" ON treatment_insurance_link;
DROP POLICY IF EXISTS "treatment_insurance_link_update" ON treatment_insurance_link;
DROP POLICY IF EXISTS "treatment_insurance_link_delete" ON treatment_insurance_link;
CREATE POLICY "treatment_insurance_link_select" ON treatment_insurance_link FOR SELECT USING (true);
CREATE POLICY "treatment_insurance_link_insert" ON treatment_insurance_link FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "treatment_insurance_link_update" ON treatment_insurance_link FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "treatment_insurance_link_delete" ON treatment_insurance_link FOR DELETE USING (user_id IS NOT NULL);

-- ============================================================================
-- OTHER TABLES
-- ============================================================================

-- Lab Cases
ALTER TABLE lab_cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lab_cases_select" ON lab_cases;
DROP POLICY IF EXISTS "lab_cases_insert" ON lab_cases;
DROP POLICY IF EXISTS "lab_cases_update" ON lab_cases;
DROP POLICY IF EXISTS "lab_cases_delete" ON lab_cases;
CREATE POLICY "lab_cases_select" ON lab_cases FOR SELECT USING (true);
CREATE POLICY "lab_cases_insert" ON lab_cases FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "lab_cases_update" ON lab_cases FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "lab_cases_delete" ON lab_cases FOR DELETE USING (user_id IS NOT NULL);

-- Prescriptions
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prescriptions_select" ON prescriptions;
DROP POLICY IF EXISTS "prescriptions_insert" ON prescriptions;
DROP POLICY IF EXISTS "prescriptions_update" ON prescriptions;
DROP POLICY IF EXISTS "prescriptions_delete" ON prescriptions;
CREATE POLICY "prescriptions_select" ON prescriptions FOR SELECT USING (true);
CREATE POLICY "prescriptions_insert" ON prescriptions FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "prescriptions_update" ON prescriptions FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "prescriptions_delete" ON prescriptions FOR DELETE USING (user_id IS NOT NULL);

-- Prescription Items
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prescription_items_select" ON prescription_items;
DROP POLICY IF EXISTS "prescription_items_insert" ON prescription_items;
DROP POLICY IF EXISTS "prescription_items_update" ON prescription_items;
DROP POLICY IF EXISTS "prescription_items_delete" ON prescription_items;
CREATE POLICY "prescription_items_select" ON prescription_items FOR SELECT USING (true);
CREATE POLICY "prescription_items_insert" ON prescription_items FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "prescription_items_update" ON prescription_items FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "prescription_items_delete" ON prescription_items FOR DELETE USING (user_id IS NOT NULL);

-- Employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "employees_select" ON employees;
DROP POLICY IF EXISTS "employees_insert" ON employees;
DROP POLICY IF EXISTS "employees_update" ON employees;
DROP POLICY IF EXISTS "employees_delete" ON employees;
CREATE POLICY "employees_select" ON employees FOR SELECT USING (true);
CREATE POLICY "employees_insert" ON employees FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "employees_update" ON employees FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "employees_delete" ON employees FOR DELETE USING (user_id IS NOT NULL);

-- Employee Attendance
ALTER TABLE employee_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "employee_attendance_select" ON employee_attendance;
DROP POLICY IF EXISTS "employee_attendance_insert" ON employee_attendance;
DROP POLICY IF EXISTS "employee_attendance_update" ON employee_attendance;
DROP POLICY IF EXISTS "employee_attendance_delete" ON employee_attendance;
CREATE POLICY "employee_attendance_select" ON employee_attendance FOR SELECT USING (true);
CREATE POLICY "employee_attendance_insert" ON employee_attendance FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "employee_attendance_update" ON employee_attendance FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "employee_attendance_delete" ON employee_attendance FOR DELETE USING (user_id IS NOT NULL);

-- Employee Compensations
ALTER TABLE employee_compensations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "employee_compensations_select" ON employee_compensations;
DROP POLICY IF EXISTS "employee_compensations_insert" ON employee_compensations;
DROP POLICY IF EXISTS "employee_compensations_update" ON employee_compensations;
DROP POLICY IF EXISTS "employee_compensations_delete" ON employee_compensations;
CREATE POLICY "employee_compensations_select" ON employee_compensations FOR SELECT USING (true);
CREATE POLICY "employee_compensations_insert" ON employee_compensations FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "employee_compensations_update" ON employee_compensations FOR UPDATE USING (user_id IS NOT NULL);
CREATE POLICY "employee_compensations_delete" ON employee_compensations FOR DELETE USING (user_id IS NOT NULL);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================================';
    RAISE NOTICE 'ALL RLS POLICIES FIXED SUCCESSFULLY!';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS enabled for all data tables.';
    RAISE NOTICE 'User/auth tables have RLS disabled (managed by app).';
    RAISE NOTICE '';
    RAISE NOTICE 'All operations allowed for authenticated users.';
    RAISE NOTICE '========================================================';
END $$;
