-- Migration script to update clinic_id from old ID to new ID
-- Old clinic ID: 7bf0f614-b9b3-4713-9805-dd2712bf5f0b
-- New clinic ID: 941cca81-818d-434c-812d-b0db2d2fb9c7
-- This script updates all tables with clinic_id columns as specified
-- Run this script once to fix the data association issue

BEGIN;

-- Update patients table
UPDATE patients
SET clinic_id = '941cca81-818d-434c-812d-b0db2d2fb9c7'
WHERE clinic_id = '7bf0f614-b9b3-4713-9805-dd2712bf5f0b';

-- Update dentists table
UPDATE dentists
SET clinic_id = '941cca81-818d-434c-812d-b0db2d2fb9c7'
WHERE clinic_id = '7bf0f614-b9b3-4713-9805-dd2712bf5f0b';

-- Update appointments table
UPDATE appointments
SET clinic_id = '941cca81-818d-434c-812d-b0db2d2fb9c7'
WHERE clinic_id = '7bf0f614-b9b3-4713-9805-dd2712bf5f0b';

-- Update suppliers table
UPDATE suppliers
SET clinic_id = '941cca81-818d-434c-812d-b0db2d2fb9c7'
WHERE clinic_id = '7bf0f614-b9b3-4713-9805-dd2712bf5f0b';

-- Update inventory_items table
UPDATE inventory_items
SET clinic_id = '941cca81-818d-434c-812d-b0db2d2fb9c7'
WHERE clinic_id = '7bf0f614-b9b3-4713-9805-dd2712bf5f0b';

-- Update expenses table
UPDATE expenses
SET clinic_id = '941cca81-818d-434c-812d-b0db2d2fb9c7'
WHERE clinic_id = '7bf0f614-b9b3-4713-9805-dd2712bf5f0b';

-- Update treatment_definitions table
UPDATE treatment_definitions
SET clinic_id = '941cca81-818d-434c-812d-b0db2d2fb9c7'
WHERE clinic_id = '7bf0f614-b9b3-4713-9805-dd2712bf5f0b';

-- Update treatment_records table
UPDATE treatment_records
SET clinic_id = '941cca81-818d-434c-812d-b0db2d2fb9c7'
WHERE clinic_id = '7bf0f614-b9b3-4713-9805-dd2712bf5f0b';

-- Update lab_cases table
UPDATE lab_cases
SET clinic_id = '941cca81-818d-434c-812d-b0db2d2fb9c7'
WHERE clinic_id = '7bf0f614-b9b3-4713-9805-dd2712bf5f0b';

-- Update payments table
UPDATE payments
SET clinic_id = '941cca81-818d-434c-812d-b0db2d2fb9c7'
WHERE clinic_id = '7bf0f614-b9b3-4713-9805-dd2712bf5f0b';

-- Update supplier_invoices table
UPDATE supplier_invoices
SET clinic_id = '941cca81-818d-434c-812d-b0db2d2fb9c7'
WHERE clinic_id = '7bf0f614-b9b3-4713-9805-dd2712bf5f0b';

-- Update doctor_payments table
UPDATE doctor_payments
SET clinic_id = '941cca81-818d-434c-812d-b0db2d2fb9c7'
WHERE clinic_id = '7bf0f614-b9b3-4713-9805-dd2712bf5f0b';

-- Update prescriptions table
UPDATE prescriptions
SET clinic_id = '941cca81-818d-434c-812d-b0db2d2fb9c7'
WHERE clinic_id = '7bf0f614-b9b3-4713-9805-dd2712bf5f0b';

-- Update prescription_items table
UPDATE prescription_items
SET clinic_id = '941cca81-818d-434c-812d-b0db2d2fb9c7'
WHERE clinic_id = '7bf0f614-b9b3-4713-9805-dd2712bf5f0b';

COMMIT;