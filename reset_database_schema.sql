-- SQL Script to reset all clinic management database tables
-- This script drops all existing tables and recreates them from scratch
-- Designed for PostgreSQL (Supabase)
-- WARNING: This will permanently delete ALL data in the database
-- Use with extreme caution - only in development/testing environments

-- ===========================================
-- DROP ALL EXISTING TABLES (in reverse order)
-- ===========================================

DROP TABLE IF EXISTS doctor_payments CASCADE;
DROP TABLE IF EXISTS supplier_invoices CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS lab_cases CASCADE;
DROP TABLE IF EXISTS treatment_records CASCADE;
DROP TABLE IF EXISTS treatment_definitions CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS dentists CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

-- ===========================================
-- RECREATE ALL TABLES
-- ===========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Patients table
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

-- Treatment Records table
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

-- Lab Cases table
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
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    method TEXT CHECK (method IN ('Cash', 'Credit Card', 'Bank Transfer', 'Other', 'Discount')),
    notes TEXT,
    treatment_record_id UUID REFERENCES treatment_records(id) ON DELETE SET NULL,
    clinic_share NUMERIC(10,2) DEFAULT 0,
    doctor_share NUMERIC(10,2) DEFAULT 0,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier Invoices table
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
CREATE TABLE doctor_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dentist_id UUID REFERENCES dentists(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for expenses.supplier_invoice_id after supplier_invoices table is created
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_supplier_invoice
    FOREIGN KEY (supplier_invoice_id) REFERENCES supplier_invoices(id) ON DELETE SET NULL;

-- ===========================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- ===========================================

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
CREATE INDEX IF NOT EXISTS idx_treatment_records_user_id ON treatment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_patient_id ON treatment_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_dentist_id ON treatment_records(dentist_id);
CREATE INDEX IF NOT EXISTS idx_lab_cases_user_id ON lab_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_cases_patient_id ON lab_cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_cases_lab_id ON lab_cases(lab_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_treatment_record_id ON payments(treatment_record_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_user_id ON supplier_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier_id ON supplier_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_doctor_payments_dentist_id ON doctor_payments(dentist_id);

-- ===========================================
-- RESET COMPLETE
-- ===========================================

-- Optional: Add a comment to indicate successful reset
DO $$
BEGIN
    RAISE NOTICE 'Database reset completed successfully. All tables have been dropped and recreated.';
END $$;
