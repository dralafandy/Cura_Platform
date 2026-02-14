-- Migration to remove multi-clinic functionality
-- Drops the clinics table and removes clinic_id columns from all affected tables
-- Removes associated foreign key constraints and indexes

-- Drop foreign key constraints referencing clinics(id)
ALTER TABLE clinic_users DROP CONSTRAINT IF EXISTS clinic_users_clinic_id_fkey;
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_clinic_id_fkey;
ALTER TABLE dentists DROP CONSTRAINT IF EXISTS dentists_clinic_id_fkey;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_clinic_id_fkey;
ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_clinic_id_fkey;
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_clinic_id_fkey;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_clinic_id_fkey;
ALTER TABLE treatment_definitions DROP CONSTRAINT IF EXISTS treatment_definitions_clinic_id_fkey;
ALTER TABLE treatment_records DROP CONSTRAINT IF EXISTS treatment_records_clinic_id_fkey;
ALTER TABLE lab_cases DROP CONSTRAINT IF EXISTS lab_cases_clinic_id_fkey;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_clinic_id_fkey;
ALTER TABLE supplier_invoices DROP CONSTRAINT IF EXISTS supplier_invoices_clinic_id_fkey;
ALTER TABLE doctor_payments DROP CONSTRAINT IF EXISTS doctor_payments_clinic_id_fkey;
ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS prescriptions_clinic_id_fkey;
ALTER TABLE prescription_items DROP CONSTRAINT IF EXISTS prescription_items_clinic_id_fkey;
ALTER TABLE clinic_settings DROP CONSTRAINT IF EXISTS clinic_settings_clinic_id_fkey;

-- Drop the clinics table
DROP TABLE IF EXISTS clinics CASCADE;

-- Remove clinic_id columns from affected tables
ALTER TABLE clinic_users DROP COLUMN IF EXISTS clinic_id;
ALTER TABLE patients DROP COLUMN IF EXISTS clinic_id;
ALTER TABLE dentists DROP COLUMN IF EXISTS clinic_id;
ALTER TABLE appointments DROP COLUMN IF EXISTS clinic_id;
ALTER TABLE suppliers DROP COLUMN IF EXISTS clinic_id;
ALTER TABLE inventory_items DROP COLUMN IF EXISTS clinic_id;
ALTER TABLE expenses DROP COLUMN IF EXISTS clinic_id;
ALTER TABLE treatment_definitions DROP COLUMN IF EXISTS clinic_id;
ALTER TABLE treatment_records DROP COLUMN IF EXISTS clinic_id;
ALTER TABLE lab_cases DROP COLUMN IF EXISTS clinic_id;
ALTER TABLE payments DROP COLUMN IF EXISTS clinic_id;
ALTER TABLE supplier_invoices DROP COLUMN IF EXISTS clinic_id;
ALTER TABLE doctor_payments DROP COLUMN IF EXISTS clinic_id;
ALTER TABLE prescriptions DROP COLUMN IF EXISTS clinic_id;
ALTER TABLE prescription_items DROP COLUMN IF EXISTS clinic_id;
ALTER TABLE clinic_settings DROP COLUMN IF EXISTS clinic_id;

-- Drop indexes associated with clinic_id
DROP INDEX IF EXISTS idx_clinics_name;
DROP INDEX IF EXISTS idx_clinic_users_clinic_id;
DROP INDEX IF EXISTS idx_patients_clinic_id;
DROP INDEX IF EXISTS idx_dentists_clinic_id;
DROP INDEX IF EXISTS idx_appointments_clinic_id;
DROP INDEX IF EXISTS idx_suppliers_clinic_id;
DROP INDEX IF EXISTS idx_inventory_items_clinic_id;
DROP INDEX IF EXISTS idx_expenses_clinic_id;
DROP INDEX IF EXISTS idx_treatment_definitions_clinic_id;
DROP INDEX IF EXISTS idx_treatment_records_clinic_id;
DROP INDEX IF EXISTS idx_lab_cases_clinic_id;
DROP INDEX IF EXISTS idx_payments_clinic_id;
DROP INDEX IF EXISTS idx_supplier_invoices_clinic_id;
DROP INDEX IF EXISTS idx_doctor_payments_clinic_id;
DROP INDEX IF EXISTS idx_prescriptions_clinic_id;
DROP INDEX IF EXISTS idx_prescription_items_clinic_id;
DROP INDEX IF EXISTS idx_clinic_settings_clinic_id;