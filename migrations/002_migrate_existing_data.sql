-- ============================================================================
-- Migration: Migrate Existing Data to Multi-Clinic Architecture
-- 
-- This migration:
-- 1. Creates a "Default Clinic" for existing data
-- 2. Creates a "Main Branch" under the default clinic
-- 3. Links all existing users to the default clinic
-- 4. Adds clinic_id columns to existing tables (nullable initially)
-- 5. Updates existing records to point to default clinic
-- 
-- SAFE MIGRATION: No data loss, all changes are additive
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Default Clinic and Main Branch
-- ============================================================================

DO $$
DECLARE
    default_clinic_id UUID;
    main_branch_id UUID;
    admin_user_id UUID;
BEGIN
    -- Find an admin user to use as creator
    SELECT id INTO admin_user_id 
    FROM user_profiles 
    WHERE role = 'ADMIN' 
    LIMIT 1;
    
    -- Create Default Clinic if it doesn't exist
    INSERT INTO clinics (
        id,
        name,
        code,
        description,
        status,
        created_by,
        updated_by
    )
    VALUES (
        '00000000-0000-0000-0000-000000000001'::UUID,
        'Default Clinic',
        'DEFAULT',
        'Default clinic for existing data migration',
        'ACTIVE',
        admin_user_id,
        admin_user_id
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO default_clinic_id;
    
    -- If clinic already existed, get its ID
    IF default_clinic_id IS NULL THEN
        SELECT id INTO default_clinic_id 
        FROM clinics 
        WHERE code = 'DEFAULT';
    END IF;
    
    -- Create Main Branch under Default Clinic
    INSERT INTO clinic_branches (
        id,
        clinic_id,
        name,
        code,
        branch_type,
        is_main_branch,
        is_active,
        created_by,
        updated_by
    )
    VALUES (
        '00000000-0000-0000-0000-000000000002'::UUID,
        default_clinic_id,
        'Main Branch',
        'MAIN',
        'MAIN',
        TRUE,
        TRUE,
        admin_user_id,
        admin_user_id
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO main_branch_id;
    
    -- If branch already existed, get its ID
    IF main_branch_id IS NULL THEN
        SELECT id INTO main_branch_id 
        FROM clinic_branches 
        WHERE code = 'MAIN' AND clinic_id = default_clinic_id;
    END IF;
    
    -- ============================================================================
    -- STEP 2: Link All Existing Users to Default Clinic
    -- ============================================================================
    
    -- Insert user_clinic_access records for all existing users
    INSERT INTO user_clinic_access (
        user_id,
        clinic_id,
        branch_id,
        role_at_clinic,
        is_default,
        is_active,
        created_by
    )
    SELECT 
        up.id,
        default_clinic_id,
        main_branch_id,
        up.role::VARCHAR,
        TRUE,
        TRUE,
        admin_user_id
    FROM user_profiles up
    WHERE NOT EXISTS (
        SELECT 1 FROM user_clinic_access uca 
        WHERE uca.user_id = up.id
    );
    
    RAISE NOTICE 'Migration complete: Default clinic and branch created, all users linked';
    RAISE NOTICE 'Default Clinic ID: %', default_clinic_id;
    RAISE NOTICE 'Main Branch ID: %', main_branch_id;
END $$;

-- ============================================================================
-- STEP 3: Add clinic_id and branch_id columns to existing tables
-- ============================================================================

-- Add clinic_id and branch_id to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_branch_id ON patients(branch_id);

-- Add clinic_id and branch_id to dentists table
ALTER TABLE dentists 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_dentists_clinic_id ON dentists(clinic_id);
CREATE INDEX IF NOT EXISTS idx_dentists_branch_id ON dentists(branch_id);

-- Add clinic_id and branch_id to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_branch_id ON appointments(branch_id);

-- Add clinic_id and branch_id to suppliers table
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_suppliers_clinic_id ON suppliers(clinic_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_branch_id ON suppliers(branch_id);

-- Add clinic_id and branch_id to inventory_items table
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_items_clinic_id ON inventory_items(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_branch_id ON inventory_items(branch_id);

-- Add clinic_id and branch_id to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_clinic_id ON expenses(clinic_id);
CREATE INDEX IF NOT EXISTS idx_expenses_branch_id ON expenses(branch_id);

-- Add clinic_id and branch_id to treatment_definitions table
ALTER TABLE treatment_definitions 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_treatment_definitions_clinic_id ON treatment_definitions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_definitions_branch_id ON treatment_definitions(branch_id);

-- Add clinic_id and branch_id to treatment_records table
ALTER TABLE treatment_records 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_treatment_records_clinic_id ON treatment_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_branch_id ON treatment_records(branch_id);

-- Add clinic_id and branch_id to insurance_companies table
ALTER TABLE insurance_companies 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_insurance_companies_clinic_id ON insurance_companies(clinic_id);
CREATE INDEX IF NOT EXISTS idx_insurance_companies_branch_id ON insurance_companies(branch_id);

-- Add clinic_id and branch_id to lab_cases table
ALTER TABLE lab_cases 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lab_cases_clinic_id ON lab_cases(clinic_id);
CREATE INDEX IF NOT EXISTS idx_lab_cases_branch_id ON lab_cases(branch_id);

-- Add clinic_id and branch_id to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payments_clinic_id ON payments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_payments_branch_id ON payments(branch_id);

-- Add clinic_id and branch_id to supplier_invoices table
ALTER TABLE supplier_invoices 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_supplier_invoices_clinic_id ON supplier_invoices(clinic_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_branch_id ON supplier_invoices(branch_id);

-- Add clinic_id and branch_id to prescriptions table
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic_id ON prescriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_branch_id ON prescriptions(branch_id);

-- Add clinic_id and branch_id to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_clinic_id ON employees(clinic_id);
CREATE INDEX IF NOT EXISTS idx_employees_branch_id ON employees(branch_id);

-- ============================================================================
-- STEP 4: Update existing records to point to default clinic
-- ============================================================================

DO $$
DECLARE
    default_clinic_id UUID;
    main_branch_id UUID;
BEGIN
    -- Get default clinic and branch IDs
    SELECT id INTO default_clinic_id FROM clinics WHERE code = 'DEFAULT';
    SELECT id INTO main_branch_id FROM clinic_branches WHERE code = 'MAIN' AND clinic_id = default_clinic_id;
    
    -- Update all existing records to point to default clinic
    UPDATE patients SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE dentists SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE appointments SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE suppliers SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE inventory_items SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE expenses SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE treatment_definitions SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE treatment_records SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE insurance_companies SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE lab_cases SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE payments SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE supplier_invoices SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE prescriptions SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE employees SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    
    RAISE NOTICE 'All existing records updated to default clinic';
END $$;

-- ============================================================================
-- STEP 5: Create default clinic settings
-- ============================================================================

DO $$
DECLARE
    default_clinic_id UUID;
    main_branch_id UUID;
BEGIN
    -- Get default clinic and branch IDs
    SELECT id INTO default_clinic_id FROM clinics WHERE code = 'DEFAULT';
    SELECT id INTO main_branch_id FROM clinic_branches WHERE code = 'MAIN' AND clinic_id = default_clinic_id;
    
    -- Insert default clinic settings
    INSERT INTO clinic_settings (
        clinic_id,
        branch_id,
        settings
    )
    VALUES (
        default_clinic_id,
        main_branch_id,
        '{
            "appointment": {
                "defaultDuration": 30,
                "bufferTime": 10,
                "maxAdvanceBookingDays": 90
            },
            "notifications": {
                "emailEnabled": true,
                "smsEnabled": false,
                "reminderHoursBefore": 24
            },
            "finance": {
                "currency": "EGP",
                "taxRate": 0.14
            },
            "migrated": true
        }'::JSONB
    );
    
    RAISE NOTICE 'Default clinic settings created';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
