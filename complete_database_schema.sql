-- ============================================================================
-- Curasoft Clinic Management System - Complete Database Schema
-- PostgreSQL (Supabase)
-- Version: 1.0.0
-- Created: 2026-02-26
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User status values
DO $$ BEGIN
    CREATE TYPE user_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User role values
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Permission values
DO $$ BEGIN
    CREATE TYPE permission_enum AS ENUM (
        'user:create', 'user:read', 'user:update', 'user:delete', 'user:manage_permissions',
        'role:create', 'role:read', 'role:update', 'role:delete', 'role:manage_permissions',
        'patient:create', 'patient:read', 'patient:update', 'patient:delete', 'patient:manage_attachments',
        'appointment:create', 'appointment:read', 'appointment:update', 'appointment:delete',
        'treatment:create', 'treatment:read', 'treatment:update', 'treatment:delete', 'treatment:manage_costs',
        'finance:view_reports', 'finance:manage_accounts', 'finance:manage_payments',
        'inventory:view', 'inventory:manage',
        'admin:access_system_settings', 'admin:manage_clinics', 'admin:access_audit_logs'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Audit action types
DO $$ BEGIN
    CREATE TYPE audit_action_enum AS ENUM (
        'CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PERMISSION_GRANT', 'PERMISSION_REVOKE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- USERS & AUTHENTICATION TABLES
-- ============================================================================

-- Users table for internal authentication
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Profiles table
DROP TABLE IF EXISTS user_profiles CASCADE;
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('ADMIN', 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST')) DEFAULT 'ADMIN',
    status TEXT CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')) DEFAULT 'ACTIVE',
    permissions TEXT[] DEFAULT '{}',
    custom_permissions TEXT[] DEFAULT '{}',
    override_permissions BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles table
DROP TABLE IF EXISTS roles CASCADE;
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default system roles
INSERT INTO roles (name, display_name, description, is_system, created_at, updated_at)
VALUES 
    ('ADMIN', 'Administrator', 'Full system access', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('DOCTOR', 'Doctor/Dentist', 'Patient and treatment management', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ASSISTANT', 'Dental Assistant', 'Assist with treatments and patient care', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('RECEPTIONIST', 'Receptionist', 'Appointment and patient coordination', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- Role Permissions table
DROP TABLE IF EXISTS role_permissions CASCADE;
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission permission_enum NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission)
);

-- Insert default permissions for ADMIN role
INSERT INTO role_permissions (role_id, permission)
SELECT roles.id, perms.perm FROM roles
CROSS JOIN (
    SELECT CAST(unnest AS permission_enum) as perm FROM unnest(ARRAY[
        'user:create', 'user:read', 'user:update', 'user:delete', 'user:manage_permissions',
        'role:create', 'role:read', 'role:update', 'role:delete', 'role:manage_permissions',
        'patient:create', 'patient:read', 'patient:update', 'patient:delete', 'patient:manage_attachments',
        'appointment:create', 'appointment:read', 'appointment:update', 'appointment:delete',
        'treatment:create', 'treatment:read', 'treatment:update', 'treatment:delete', 'treatment:manage_costs',
        'finance:view_reports', 'finance:manage_accounts', 'finance:manage_payments',
        'inventory:view', 'inventory:manage',
        'admin:access_system_settings', 'admin:manage_clinics', 'admin:access_audit_logs'
    ]::permission_enum[])
) AS perms
WHERE roles.name = 'ADMIN'
ON CONFLICT (role_id, permission) DO NOTHING;

-- Insert default permissions for DOCTOR role
INSERT INTO role_permissions (role_id, permission)
SELECT roles.id, perms.perm FROM roles
CROSS JOIN (
    SELECT CAST(unnest AS permission_enum) as perm FROM unnest(ARRAY[
        'user:read',
        'patient:create', 'patient:read', 'patient:update', 'patient:delete', 'patient:manage_attachments',
        'appointment:create', 'appointment:read', 'appointment:update', 'appointment:delete',
        'treatment:create', 'treatment:read', 'treatment:update', 'treatment:delete', 'treatment:manage_costs',
        'finance:view_reports',
        'inventory:view'
    ]::permission_enum[])
) AS perms
WHERE roles.name = 'DOCTOR'
ON CONFLICT (role_id, permission) DO NOTHING;

-- Insert default permissions for ASSISTANT role
INSERT INTO role_permissions (role_id, permission)
SELECT roles.id, perms.perm FROM roles
CROSS JOIN (
    SELECT CAST(unnest AS permission_enum) as perm FROM unnest(ARRAY[
        'user:read',
        'patient:read', 'patient:update',
        'appointment:read',
        'treatment:read',
        'inventory:view'
    ]::permission_enum[])
) AS perms
WHERE roles.name = 'ASSISTANT'
ON CONFLICT (role_id, permission) DO NOTHING;

-- Insert default permissions for RECEPTIONIST role
INSERT INTO role_permissions (role_id, permission)
SELECT roles.id, perms.perm FROM roles
CROSS JOIN (
    SELECT CAST(unnest AS permission_enum) as perm FROM unnest(ARRAY[
        'user:read',
        'patient:create', 'patient:read', 'patient:update',
        'appointment:create', 'appointment:read', 'appointment:update', 'appointment:delete',
        'finance:view_reports'
    ]::permission_enum[])
) AS perms
WHERE roles.name = 'RECEPTIONIST'
ON CONFLICT (role_id, permission) DO NOTHING;

-- User Permission Overrides table
DROP TABLE IF EXISTS user_permission_overrides CASCADE;
CREATE TABLE user_permission_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    permission permission_enum NOT NULL,
    granted BOOLEAN NOT NULL,
    reason VARCHAR(255),
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, permission)
);

-- Audit Logs table
DROP TABLE IF EXISTS audit_logs CASCADE;
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    action audit_action_enum NOT NULL,
    resource_type VARCHAR(255) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    changes JSONB,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CLINIC TABLES
-- ============================================================================

-- Dentists table
DROP TABLE IF EXISTS dentists CASCADE;
CREATE TABLE dentists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    specialty TEXT,
    color TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PATIENT TABLES
-- ============================================================================

-- Patients table
DROP TABLE IF EXISTS patients CASCADE;
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    dob DATE,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    phone TEXT,
    email TEXT,
    address TEXT,
    medical_history TEXT,
    treatment_notes TEXT,
    last_visit DATE,
    allergies TEXT,
    medications TEXT,
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    dental_chart JSONB DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient Attachments table
DROP TABLE IF EXISTS patient_attachments CASCADE;
CREATE TABLE patient_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    uploaded_by UUID REFERENCES users(id),
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- APPOINTMENTS TABLE
-- ============================================================================

DROP TABLE IF EXISTS appointments CASCADE;
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    dentist_id UUID REFERENCES dentists(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    status TEXT CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED')) DEFAULT 'SCHEDULED',
    reminder_time TEXT CHECK (reminder_time IN ('none', '1_hour_before', '2_hours_before', '1_day_before')) DEFAULT 'none',
    reminder_sent BOOLEAN DEFAULT FALSE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FINANCIAL TABLES
-- ============================================================================

-- Suppliers table
DROP TABLE IF EXISTS suppliers CASCADE;
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    type TEXT CHECK (type IN ('Material Supplier', 'Dental Lab')) DEFAULT 'Material Supplier',
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier Invoices table
DROP TABLE IF EXISTS supplier_invoices CASCADE;
CREATE TABLE supplier_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    invoice_number TEXT,
    invoice_date DATE NOT NULL,
    due_date DATE,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT CHECK (status IN ('UNPAID', 'PAID')) DEFAULT 'UNPAID',
    items JSONB DEFAULT '[]',
    invoice_image_url TEXT,
    payments JSONB DEFAULT '[]',
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier Invoice Attachments table
DROP TABLE IF EXISTS supplier_invoice_attachments CASCADE;
CREATE TABLE supplier_invoice_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_invoice_id UUID REFERENCES supplier_invoices(id) ON DELETE CASCADE,
    filename TEXT,
    original_filename TEXT,
    file_type TEXT,
    file_size BIGINT DEFAULT 0,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    uploaded_by UUID,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory Items table
DROP TABLE IF EXISTS inventory_items CASCADE;
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    current_stock INTEGER DEFAULT 0,
    unit_cost NUMERIC(10,2) DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    expiry_date DATE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
DROP TABLE IF EXISTS expenses CASCADE;
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    description TEXT,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    category TEXT CHECK (category IN ('RENT', 'SALARIES', 'UTILITIES', 'LAB_FEES', 'SUPPLIES', 'MARKETING', 'MISC')),
    method TEXT CHECK (method IN ('Cash', 'Instapay', 'Vodafone Cash', 'Other')) DEFAULT 'Cash',
    expense_receipt_image_url TEXT,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_invoice_id UUID,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for expenses.supplier_invoice_id
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_supplier_invoice
    FOREIGN KEY (supplier_invoice_id) REFERENCES supplier_invoices(id) ON DELETE SET NULL;

-- ============================================================================
-- TREATMENT TABLES
-- ============================================================================

-- Treatment Definitions table
DROP TABLE IF EXISTS treatment_definitions CASCADE;
CREATE TABLE treatment_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    base_price NUMERIC(10,2) DEFAULT 0,
    doctor_percentage NUMERIC(5,4) DEFAULT 0,
    clinic_percentage NUMERIC(5,4) DEFAULT 0,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctor-specific treatment percentages
DROP TABLE IF EXISTS treatment_doctor_percentages CASCADE;
CREATE TABLE treatment_doctor_percentages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treatment_definition_id UUID NOT NULL REFERENCES treatment_definitions(id) ON DELETE CASCADE,
    dentist_id UUID NOT NULL REFERENCES dentists(id) ON DELETE CASCADE,
    doctor_percentage NUMERIC(5,4) NOT NULL DEFAULT 0.50,
    clinic_percentage NUMERIC(5,4) NOT NULL DEFAULT 0.50,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_treatment_doctor_percentages UNIQUE (treatment_definition_id, dentist_id, user_id),
    CONSTRAINT chk_treatment_doctor_percentages_sum CHECK (
        doctor_percentage >= 0 AND doctor_percentage <= 1 AND
        clinic_percentage >= 0 AND clinic_percentage <= 1 AND
        abs((doctor_percentage + clinic_percentage) - 1) < 0.0001
    )
);

-- Treatment Records table
DROP TABLE IF EXISTS treatment_records CASCADE;
CREATE TABLE treatment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    dentist_id UUID REFERENCES dentists(id) ON DELETE CASCADE,
    treatment_date DATE NOT NULL,
    treatment_definition_id UUID REFERENCES treatment_definitions(id) ON DELETE SET NULL,
    notes TEXT,
    inventory_items_used JSONB DEFAULT '[]',
    total_treatment_cost NUMERIC(10,2) DEFAULT 0,
    doctor_share NUMERIC(10,2) DEFAULT 0,
    clinic_share NUMERIC(10,2) DEFAULT 0,
    affected_teeth TEXT[] DEFAULT '{}',
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PAYMENTS TABLES
-- ============================================================================

-- Payments table
DROP TABLE IF EXISTS payments CASCADE;
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    method TEXT CHECK (method IN ('Cash', 'Instapay', 'Vodafone Cash', 'Other', 'Discount')),
    notes TEXT,
    treatment_record_id UUID REFERENCES treatment_records(id) ON DELETE SET NULL,
    clinic_share NUMERIC(10,2) DEFAULT 0,
    doctor_share NUMERIC(10,2) DEFAULT 0,
    payment_receipt_image_url TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctor Payments table
DROP TABLE IF EXISTS doctor_payments CASCADE;
CREATE TABLE doctor_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dentist_id UUID REFERENCES dentists(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INSURANCE TABLES
-- ============================================================================

-- Insurance Companies table
DROP TABLE IF EXISTS insurance_companies CASCADE;
CREATE TABLE insurance_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insurance Accounts table
DROP TABLE IF EXISTS insurance_accounts CASCADE;
CREATE TABLE insurance_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insurance_company_id UUID NOT NULL REFERENCES insurance_companies(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    account_number TEXT,
    balance NUMERIC(15,2) NOT NULL DEFAULT 0,
    status TEXT CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_insurance_account_name_per_company UNIQUE (insurance_company_id, account_name, user_id)
);

-- Insurance Transactions table
DROP TABLE IF EXISTS insurance_transactions CASCADE;
CREATE TABLE insurance_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insurance_account_id UUID NOT NULL REFERENCES insurance_accounts(id) ON DELETE CASCADE,
    transaction_type TEXT CHECK (transaction_type IN ('CREDIT', 'DEBIT')) NOT NULL,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    transaction_date DATE NOT NULL,
    description TEXT,
    reference_number TEXT,
    related_entity_type TEXT CHECK (related_entity_type IN ('PATIENT', 'TREATMENT', 'DOCTOR', 'CLINIC')),
    related_entity_id UUID,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_insurance_transaction_amount_non_negative CHECK (amount >= 0)
);

-- Patient Insurance Link table
DROP TABLE IF EXISTS patient_insurance_link CASCADE;
CREATE TABLE patient_insurance_link (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    insurance_company_id UUID NOT NULL REFERENCES insurance_companies(id) ON DELETE CASCADE,
    policy_number TEXT,
    coverage_percentage NUMERIC(5,2) NOT NULL DEFAULT 100,
    effective_date DATE,
    expiry_date DATE,
    notes TEXT,
    is_primary BOOLEAN DEFAULT true,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_patient_insurance_coverage_percentage CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),
    CONSTRAINT chk_patient_insurance_dates CHECK (expiry_date IS NULL OR effective_date IS NULL OR expiry_date >= effective_date)
);

-- Treatment Insurance Link (Claims) table
DROP TABLE IF EXISTS treatment_insurance_link CASCADE;
CREATE TABLE treatment_insurance_link (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treatment_record_id UUID NOT NULL REFERENCES treatment_records(id) ON DELETE CASCADE,
    insurance_company_id UUID NOT NULL REFERENCES insurance_companies(id) ON DELETE CASCADE,
    claim_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    claim_status TEXT CHECK (claim_status IN ('PENDING', 'APPROVED', 'REJECTED', 'PAID')) NOT NULL DEFAULT 'PENDING',
    claim_date DATE,
    payment_date DATE,
    rejection_reason TEXT,
    notes TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_treatment_insurance_claim_amount CHECK (claim_amount >= 0),
    CONSTRAINT chk_treatment_insurance_payment_date CHECK (payment_date IS NULL OR claim_date IS NULL OR payment_date >= claim_date)
);

-- ============================================================================
-- LAB CASES TABLE
-- ============================================================================

DROP TABLE IF EXISTS lab_cases CASCADE;
CREATE TABLE lab_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    lab_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    case_type TEXT,
    sent_date DATE,
    due_date DATE,
    return_date DATE,
    status TEXT CHECK (status IN ('DRAFT', 'SENT_TO_LAB', 'RECEIVED_FROM_LAB', 'FITTED_TO_PATIENT', 'CANCELLED')) DEFAULT 'DRAFT',
    lab_cost NUMERIC(10,2) DEFAULT 0,
    notes TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PRESCRIPTIONS TABLES
-- ============================================================================

-- Prescriptions table
DROP TABLE IF EXISTS prescriptions CASCADE;
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    dentist_id UUID REFERENCES dentists(id) ON DELETE CASCADE,
    prescription_date DATE NOT NULL,
    notes TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescription Items table
DROP TABLE IF EXISTS prescription_items CASCADE;
CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    dosage TEXT,
    quantity INTEGER DEFAULT 1,
    instructions TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- EMPLOYEE TABLES
-- ============================================================================

-- Employees table
DROP TABLE IF EXISTS employees CASCADE;
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    position_title TEXT,
    base_salary NUMERIC(12,2) DEFAULT 0,
    hire_date DATE,
    status TEXT CHECK (status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Attendance table
DROP TABLE IF EXISTS employee_attendance CASCADE;
CREATE TABLE employee_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    status TEXT CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'LEAVE')) DEFAULT 'PRESENT',
    notes TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (employee_id, attendance_date)
);

-- Employee Compensation table
DROP TABLE IF EXISTS employee_compensations CASCADE;
CREATE TABLE employee_compensations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    entry_type TEXT CHECK (entry_type IN ('SALARY', 'BONUS', 'PENALTY', 'ADVANCE')) NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SYSTEM USER FOR INTERNAL OPERATIONS
-- ============================================================================

-- Insert system user for internal authentication
INSERT INTO users (id, email, created_at, updated_at) 
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'system@internal',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert system user profile
INSERT INTO user_profiles (
    user_id,
    username,
    email,
    role,
    permissions,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'system_user',
    'system@internal',
    'ADMIN',
    ARRAY['manage_patients', 'view_attachments', 'upload_attachments', 'delete_attachments', 'all_permissions'],
    NOW(),
    NOW()
) ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at on all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_permission_overrides_updated_at BEFORE UPDATE ON user_permission_overrides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dentists_updated_at BEFORE UPDATE ON dentists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patient_attachments_updated_at BEFORE UPDATE ON patient_attachments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supplier_invoices_updated_at BEFORE UPDATE ON supplier_invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supplier_invoice_attachments_updated_at BEFORE UPDATE ON supplier_invoice_attachments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treatment_definitions_updated_at BEFORE UPDATE ON treatment_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treatment_doctor_percentages_updated_at BEFORE UPDATE ON treatment_doctor_percentages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treatment_records_updated_at BEFORE UPDATE ON treatment_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctor_payments_updated_at BEFORE UPDATE ON doctor_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_companies_updated_at BEFORE UPDATE ON insurance_companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_accounts_updated_at BEFORE UPDATE ON insurance_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_transactions_updated_at BEFORE UPDATE ON insurance_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patient_insurance_link_updated_at BEFORE UPDATE ON patient_insurance_link FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treatment_insurance_link_updated_at BEFORE UPDATE ON treatment_insurance_link FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_cases_updated_at BEFORE UPDATE ON lab_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prescription_items_updated_at BEFORE UPDATE ON prescription_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_attendance_updated_at BEFORE UPDATE ON employee_attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_compensations_updated_at BEFORE UPDATE ON employee_compensations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STORAGE BUCKET SETUP
-- ============================================================================

-- Create patient-attachments storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'patient-attachments',
    'patient-attachments',
    true,
    10485760,
    ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);

-- Roles indexes
CREATE INDEX idx_roles_name ON roles(name);

-- Role permissions indexes
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission);

-- User permission overrides indexes
CREATE INDEX idx_user_overrides_user_id ON user_permission_overrides(user_id);
CREATE INDEX idx_user_overrides_permission ON user_permission_overrides(permission);
CREATE INDEX idx_user_overrides_expires ON user_permission_overrides(expires_at);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Patients indexes
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);

-- Patient attachments indexes
CREATE INDEX IF NOT EXISTS idx_patient_attachments_patient_id ON patient_attachments(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_attachments_created_at ON patient_attachments(created_at);
CREATE INDEX IF NOT EXISTS idx_patient_attachments_file_type ON patient_attachments(file_type);
CREATE INDEX IF NOT EXISTS idx_patient_attachments_uploaded_by ON patient_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_patient_attachments_user_id ON patient_attachments(user_id);

-- Dentists indexes
CREATE INDEX IF NOT EXISTS idx_dentists_user_id ON dentists(user_id);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_dentist_id ON appointments(dentist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);

-- Suppliers indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);

-- Supplier invoices indexes
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_user_id ON supplier_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier_id ON supplier_invoices(supplier_id);

-- Supplier invoice attachments indexes
CREATE INDEX IF NOT EXISTS idx_supplier_invoice_attachments_supplier_invoice_id ON supplier_invoice_attachments(supplier_invoice_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoice_attachments_uploaded_by ON supplier_invoice_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_supplier_invoice_attachments_user_id ON supplier_invoice_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoice_attachments_created_at ON supplier_invoice_attachments(created_at);

-- Inventory items indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_supplier_id ON inventory_items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON inventory_items(name);

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier_id ON expenses(supplier_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Treatment definitions indexes
CREATE INDEX IF NOT EXISTS idx_treatment_definitions_user_id ON treatment_definitions(user_id);

-- Treatment doctor percentages indexes
CREATE INDEX IF NOT EXISTS idx_treatment_doctor_percentages_user_id ON treatment_doctor_percentages(user_id);
CREATE INDEX IF NOT EXISTS idx_treatment_doctor_percentages_treatment_definition_id ON treatment_doctor_percentages(treatment_definition_id);
CREATE INDEX IF NOT EXISTS idx_treatment_doctor_percentages_dentist_id ON treatment_doctor_percentages(dentist_id);

-- Treatment records indexes
CREATE INDEX IF NOT EXISTS idx_treatment_records_user_id ON treatment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_patient_id ON treatment_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_dentist_id ON treatment_records(dentist_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_treatment_date ON treatment_records(treatment_date);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_treatment_record_id ON payments(treatment_record_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);

-- Doctor payments indexes
CREATE INDEX IF NOT EXISTS idx_doctor_payments_dentist_id ON doctor_payments(dentist_id);

-- Insurance companies indexes
CREATE INDEX IF NOT EXISTS idx_insurance_companies_user_id ON insurance_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_companies_name ON insurance_companies(name);

-- Insurance accounts indexes
CREATE INDEX IF NOT EXISTS idx_insurance_accounts_company_id ON insurance_accounts(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_insurance_accounts_user_id ON insurance_accounts(user_id);

-- Insurance transactions indexes
CREATE INDEX IF NOT EXISTS idx_insurance_transactions_account_id ON insurance_transactions(insurance_account_id);
CREATE INDEX IF NOT EXISTS idx_insurance_transactions_user_id ON insurance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_transactions_date ON insurance_transactions(transaction_date);

-- Patient insurance link indexes
CREATE INDEX IF NOT EXISTS idx_patient_insurance_link_patient_id ON patient_insurance_link(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_link_company_id ON patient_insurance_link(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_link_user_id ON patient_insurance_link(user_id);

-- Treatment insurance link indexes
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_link_treatment_record_id ON treatment_insurance_link(treatment_record_id);
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_link_company_id ON treatment_insurance_link(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_link_status ON treatment_insurance_link(claim_status);
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_link_user_id ON treatment_insurance_link(user_id);

-- Lab cases indexes
CREATE INDEX IF NOT EXISTS idx_lab_cases_user_id ON lab_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_cases_patient_id ON lab_cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_cases_lab_id ON lab_cases(lab_id);

-- Prescriptions indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_dentist_id ON prescriptions(dentist_id);

-- Prescription items indexes
CREATE INDEX IF NOT EXISTS idx_prescription_items_user_id ON prescription_items(user_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription_id ON prescription_items(prescription_id);

-- Employees indexes
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);

-- Employee attendance indexes
CREATE INDEX IF NOT EXISTS idx_employee_attendance_user_id ON employee_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_employee_id ON employee_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_date ON employee_attendance(attendance_date);

-- Employee compensations indexes
CREATE INDEX IF NOT EXISTS idx_employee_compensations_user_id ON employee_compensations(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_compensations_employee_id ON employee_compensations(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_compensations_date ON employee_compensations(entry_date);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for getting user details with their permissions
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.first_name,
    u.last_name,
    u.role::text as role,
    u.status::text as status,
    array_agg(DISTINCT rp.permission::text) FILTER (WHERE rp.permission IS NOT NULL) as role_permissions,
    array_agg(DISTINCT upo.permission::text) FILTER (WHERE upo.granted = true) as override_permissions
FROM user_profiles u
LEFT JOIN role_permissions rp ON rp.role_id = (
    SELECT id FROM roles WHERE name = u.role::text
)
LEFT JOIN user_permission_overrides upo ON upo.user_id = u.id AND upo.granted = true
GROUP BY u.id, u.username, u.email, u.first_name, u.last_name, u.role, u.status;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to anon role for public access
GRANT USAGE ON SCHEMA storage TO anon;
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT ON storage.buckets TO anon;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================================';
    RAISE NOTICE 'Curasoft Clinic Management System - Database Setup Complete!';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Core Tables Created:';
    RAISE NOTICE '  - users, user_profiles, roles, role_permissions';
    RAISE NOTICE '  - user_permission_overrides, audit_logs';
    RAISE NOTICE '  - patients, patient_attachments';
    RAISE NOTICE '  - dentists, appointments';
    RAISE NOTICE '  - suppliers, supplier_invoices, supplier_invoice_attachments';
    RAISE NOTICE '  - inventory_items, expenses';
    RAISE NOTICE '  - treatment_definitions, treatment_doctor_percentages';
    RAISE NOTICE '  - treatment_records, payments, doctor_payments';
    RAISE NOTICE '  - insurance_companies, insurance_accounts, insurance_transactions';
    RAISE NOTICE '  - patient_insurance_link, treatment_insurance_link';
    RAISE NOTICE '  - lab_cases';
    RAISE NOTICE '  - prescriptions, prescription_items';
    RAISE NOTICE '  - employees, employee_attendance, employee_compensations';
    RAISE NOTICE '';
    RAISE NOTICE 'Storage Buckets Created:';
    RAISE NOTICE '  - patient-attachments';
    RAISE NOTICE '';
    RAISE NOTICE 'Views Created:';
    RAISE NOTICE '  - user_permissions_view';
    RAISE NOTICE '';
    RAISE NOTICE 'All indexes and triggers have been created.';
    RAISE NOTICE '';
    RAISE NOTICE 'Database is ready for use!';
    RAISE NOTICE '========================================================';
END $$;
