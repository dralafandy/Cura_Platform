-- ============================================================================
-- Fix: Add clinic_id and branch_id columns to all tables
-- 
-- Issue: Migration 002_migrate_existing_data.sql adds these columns
-- but some tables are missing them
-- ============================================================================

-- Add clinic_id and branch_id to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_branch_id ON patients(branch_id);

-- Add clinic_id and branch_id to dentists table
ALTER TABLE dentists ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
ALTER TABLE dentists ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_dentists_clinic_id ON dentists(clinic_id);
CREATE INDEX IF NOT EXISTS idx_dentists_branch_id ON dentists(branch_id);

-- Add clinic_id and branch_id to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_branch_id ON appointments(branch_id);

-- Add clinic_id and branch_id to suppliers table
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_suppliers_clinic_id ON suppliers(clinic_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_branch_id ON suppliers(branch_id);

-- Add clinic_id and branch_id to inventory_items table
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_items_clinic_id ON inventory_items(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_branch_id ON inventory_items(branch_id);

-- Add clinic_id and branch_id to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_clinic_id ON expenses(clinic_id);
CREATE INDEX IF NOT EXISTS idx_expenses_branch_id ON expenses(branch_id);

-- Add clinic_id and branch_id to treatment_definitions table
ALTER TABLE treatment_definitions ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
ALTER TABLE treatment_definitions ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_treatment_definitions_clinic_id ON treatment_definitions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_definitions_branch_id ON treatment_definitions(branch_id);

-- Add clinic_id and branch_id to treatment_records table
ALTER TABLE treatment_records ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
ALTER TABLE treatment_records ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_treatment_records_clinic_id ON treatment_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_branch_id ON treatment_records(branch_id);

-- Add clinic_id and branch_id to insurance_companies table
ALTER TABLE insurance_companies ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
ALTER TABLE insurance_companies ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_insurance_companies_clinic_id ON insurance_companies(clinic_id);
CREATE INDEX IF NOT EXISTS idx_insurance_companies_branch_id ON insurance_companies(branch_id);

-- Add clinic_id and branch_id to lab_cases table
ALTER TABLE lab_cases ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
ALTER TABLE lab_cases ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_lab_cases_clinic_id ON lab_cases(clinic_id);
CREATE INDEX IF NOT EXISTS idx_lab_cases_branch_id ON lab_cases(branch_id);

-- Add clinic_id and branch_id to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_payments_clinic_id ON payments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_payments_branch_id ON payments(branch_id);

-- Add clinic_id and branch_id to supplier_invoices table
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_clinic_id ON supplier_invoices(clinic_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_branch_id ON supplier_invoices(branch_id);

-- Add clinic_id and branch_id to prescriptions table
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic_id ON prescriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_branch_id ON prescriptions(branch_id);

-- Add clinic_id and branch_id to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_employees_clinic_id ON employees(clinic_id);
CREATE INDEX IF NOT EXISTS idx_employees_branch_id ON employees(branch_id);

DO $$
BEGIN
    RAISE NOTICE '=== All clinic_id and branch_id columns added ===';
END $$;
