-- ============================================================================
-- Complete Fix: All prerequisites for migration 002
-- 
-- This combines ALL fixes needed to run migration 002 successfully
-- ============================================================================

-- PART 1: Create enum type
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clinic_status_enum') THEN
        CREATE TYPE clinic_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
    END IF;
END $$;

-- PART 2: Create clinics table
CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    status clinic_status_enum DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Add missing columns to clinics
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7);

CREATE INDEX IF NOT EXISTS idx_clinics_status ON clinics(status);
CREATE INDEX IF NOT EXISTS idx_clinics_code ON clinics(code);

-- PART 3: Create clinic_branches table
CREATE TABLE IF NOT EXISTS clinic_branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    branch_type VARCHAR(50),
    is_main_branch BOOLEAN,
    is_active BOOLEAN,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Add FK to clinic_branches (safe way)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'clinic_branches_clinic_id_fkey'
    ) THEN
        ALTER TABLE clinic_branches ADD CONSTRAINT clinic_branches_clinic_id_fkey 
        FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_clinic_branches_clinic_id ON clinic_branches(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_branches_code ON clinic_branches(code);
CREATE INDEX IF NOT EXISTS idx_clinic_branches_is_main_branch ON clinic_branches(is_main_branch);

-- PART 4: Create user_clinic_access table
CREATE TABLE IF NOT EXISTS user_clinic_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    clinic_id UUID NOT NULL,
    branch_id UUID,
    role_at_clinic VARCHAR(50),
    custom_permissions TEXT[],
    is_default BOOLEAN,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

DO $$
BEGIN
    ALTER TABLE user_clinic_access ADD COLUMN IF NOT EXISTS user_id UUID;
    ALTER TABLE user_clinic_access ADD COLUMN IF NOT EXISTS clinic_id UUID;
    ALTER TABLE user_clinic_access ADD COLUMN IF NOT EXISTS branch_id UUID;
    ALTER TABLE user_clinic_access ADD COLUMN IF NOT EXISTS role_at_clinic VARCHAR(50);
    ALTER TABLE user_clinic_access ADD COLUMN IF NOT EXISTS custom_permissions TEXT[];
    ALTER TABLE user_clinic_access ADD COLUMN IF NOT EXISTS is_default BOOLEAN;
    ALTER TABLE user_clinic_access ADD COLUMN IF NOT EXISTS is_active BOOLEAN;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Add FKs to user_clinic_access
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'uca_user_id_fkey') THEN
        ALTER TABLE user_clinic_access ADD CONSTRAINT uca_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'uca_clinic_id_fkey') THEN
        ALTER TABLE user_clinic_access ADD CONSTRAINT uca_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'uca_branch_id_fkey') THEN
        ALTER TABLE user_clinic_access ADD CONSTRAINT uca_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES clinic_branches(id) ON DELETE SET NULL;
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_clinic_access_user_id ON user_clinic_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_clinic_access_clinic_id ON user_clinic_access(clinic_id);
CREATE INDEX IF NOT EXISTS idx_user_clinic_access_branch_id ON user_clinic_access(branch_id);

-- PART 5: Create clinic_settings table
CREATE TABLE IF NOT EXISTS clinic_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL,
    branch_id UUID,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

DO $$
BEGIN
    ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS clinic_id UUID;
    ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS branch_id UUID;
    ALTER TABLE clinic_settings ADD COLUMN IF NOT EXISTS settings JSONB;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_clinic_settings_clinic_id ON clinic_settings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_settings_branch_id ON clinic_settings(branch_id);

-- PART 6: Add clinic_id and branch_id to all tables
-- Patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinic_id UUID;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS branch_id UUID;
CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_branch_id ON patients(branch_id);

-- Dentists
ALTER TABLE dentists ADD COLUMN IF NOT EXISTS clinic_id UUID;
ALTER TABLE dentists ADD COLUMN IF NOT EXISTS branch_id UUID;
CREATE INDEX IF NOT EXISTS idx_dentists_clinic_id ON dentists(clinic_id);
CREATE INDEX IF NOT EXISTS idx_dentists_branch_id ON dentists(branch_id);

-- Appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS clinic_id UUID;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS branch_id UUID;
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_branch_id ON appointments(branch_id);

-- Suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS clinic_id UUID;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS branch_id UUID;
CREATE INDEX IF NOT EXISTS idx_suppliers_clinic_id ON suppliers(clinic_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_branch_id ON suppliers(branch_id);

-- Inventory Items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS clinic_id UUID;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS branch_id UUID;
CREATE INDEX IF NOT EXISTS idx_inventory_items_clinic_id ON inventory_items(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_branch_id ON inventory_items(branch_id);

-- Expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS clinic_id UUID;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS branch_id UUID;
CREATE INDEX IF NOT EXISTS idx_expenses_clinic_id ON expenses(clinic_id);
CREATE INDEX IF NOT EXISTS idx_expenses_branch_id ON expenses(branch_id);

-- Treatment Definitions
ALTER TABLE treatment_definitions ADD COLUMN IF NOT EXISTS clinic_id UUID;
ALTER TABLE treatment_definitions ADD COLUMN IF NOT EXISTS branch_id UUID;
CREATE INDEX IF NOT EXISTS idx_treatment_definitions_clinic_id ON treatment_definitions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_definitions_branch_id ON treatment_definitions(branch_id);

-- Treatment Records
ALTER TABLE treatment_records ADD COLUMN IF NOT EXISTS clinic_id UUID;
ALTER TABLE treatment_records ADD COLUMN IF NOT EXISTS branch_id UUID;
CREATE INDEX IF NOT EXISTS idx_treatment_records_clinic_id ON treatment_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_branch_id ON treatment_records(branch_id);

-- Insurance Companies
ALTER TABLE insurance_companies ADD COLUMN IF NOT EXISTS clinic_id UUID;
ALTER TABLE insurance_companies ADD COLUMN IF NOT EXISTS branch_id UUID;
CREATE INDEX IF NOT EXISTS idx_insurance_companies_clinic_id ON insurance_companies(clinic_id);
CREATE INDEX IF NOT EXISTS idx_insurance_companies_branch_id ON insurance_companies(branch_id);

-- Lab Cases
ALTER TABLE lab_cases ADD COLUMN IF NOT EXISTS clinic_id UUID;
ALTER TABLE lab_cases ADD COLUMN IF NOT EXISTS branch_id UUID;
CREATE INDEX IF NOT EXISTS idx_lab_cases_clinic_id ON lab_cases(clinic_id);
CREATE INDEX IF NOT EXISTS idx_lab_cases_branch_id ON lab_cases(branch_id);

-- Payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS clinic_id UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS branch_id UUID;
CREATE INDEX IF NOT EXISTS idx_payments_clinic_id ON payments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_payments_branch_id ON payments(branch_id);

-- Supplier Invoices
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS clinic_id UUID;
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS branch_id UUID;
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_clinic_id ON supplier_invoices(clinic_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_branch_id ON supplier_invoices(branch_id);

-- Prescriptions
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS clinic_id UUID;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS branch_id UUID;
CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic_id ON prescriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_branch_id ON prescriptions(branch_id);

-- Employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS clinic_id UUID;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS branch_id UUID;
CREATE INDEX IF NOT EXISTS idx_employees_clinic_id ON employees(clinic_id);
CREATE INDEX IF NOT EXISTS idx_employees_branch_id ON employees(branch_id);

-- Verification
DO $$
BEGIN
    RAISE NOTICE '=== FIX COMPLETE: All tables and columns created ===';
END $$;
