-- SQL Script to create the clinic management database schema
-- This script drops and recreates all necessary tables
-- Designed for PostgreSQL (Supabase)
-- Row Level Security (RLS) is disabled for all tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for internal authentication
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Profiles table for internal user management
DROP TABLE IF EXISTS user_profiles CASCADE;
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('ADMIN', 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST')) DEFAULT 'ADMIN',
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Appointments table
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
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_invoice_id UUID,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
    notes TEXT,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_treatment_insurance_claim_amount CHECK (claim_amount >= 0),
    CONSTRAINT chk_treatment_insurance_payment_date CHECK (payment_date IS NULL OR claim_date IS NULL OR payment_date >= claim_date)
);

-- Lab Cases table
DROP TABLE IF EXISTS lab_cases CASCADE;
CREATE TABLE lab_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    lab_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
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

-- Add foreign key constraint for expenses.supplier_invoice_id after supplier_invoices table is created
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_supplier_invoice
    FOREIGN KEY (supplier_invoice_id) REFERENCES supplier_invoices(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_dentists_user_id ON dentists(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_dentist_id ON appointments(dentist_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_supplier_id ON inventory_items(supplier_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier_id ON expenses(supplier_id);
CREATE INDEX IF NOT EXISTS idx_treatment_definitions_user_id ON treatment_definitions(user_id);
CREATE INDEX IF NOT EXISTS idx_treatment_doctor_percentages_user_id ON treatment_doctor_percentages(user_id);
CREATE INDEX IF NOT EXISTS idx_treatment_doctor_percentages_treatment_definition_id ON treatment_doctor_percentages(treatment_definition_id);
CREATE INDEX IF NOT EXISTS idx_treatment_doctor_percentages_dentist_id ON treatment_doctor_percentages(dentist_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_user_id ON treatment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_patient_id ON treatment_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_dentist_id ON treatment_records(dentist_id);
CREATE INDEX IF NOT EXISTS idx_insurance_companies_user_id ON insurance_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_accounts_company_id ON insurance_accounts(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_insurance_accounts_user_id ON insurance_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_transactions_account_id ON insurance_transactions(insurance_account_id);
CREATE INDEX IF NOT EXISTS idx_insurance_transactions_user_id ON insurance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_transactions_date ON insurance_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_link_patient_id ON patient_insurance_link(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_link_company_id ON patient_insurance_link(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_link_user_id ON patient_insurance_link(user_id);
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_link_treatment_record_id ON treatment_insurance_link(treatment_record_id);
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_link_company_id ON treatment_insurance_link(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_link_status ON treatment_insurance_link(claim_status);
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_link_user_id ON treatment_insurance_link(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_cases_user_id ON lab_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_cases_patient_id ON lab_cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_cases_lab_id ON lab_cases(lab_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_treatment_record_id ON payments(treatment_record_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_user_id ON supplier_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier_id ON supplier_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_doctor_payments_dentist_id ON doctor_payments(dentist_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_dentist_id ON prescriptions(dentist_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_user_id ON prescription_items(user_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription_id ON prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_user_id ON employee_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_employee_id ON employee_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_date ON employee_attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_employee_compensations_user_id ON employee_compensations(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_compensations_employee_id ON employee_compensations(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_compensations_date ON employee_compensations(entry_date);
