-- ============================================================================
-- Multi-Tenant Migration for Curasoft Clinic Management System
-- ============================================================================
-- This migration adds multi-tenancy support with 14-day trial period
-- Run this AFTER the complete_database_schema.sql
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TENANTS TABLE (Organizations/Clinics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    description TEXT,
    
    -- Subscription Management
    subscription_status TEXT DEFAULT 'TRIAL' 
        CHECK (subscription_status IN ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED')),
    subscription_plan TEXT DEFAULT 'TRIAL',
    trial_start_date DATE DEFAULT CURRENT_DATE,
    trial_end_date DATE,
    subscription_start_date DATE,
    subscription_end_date DATE,
    max_users INTEGER DEFAULT 3,
    max_patients INTEGER DEFAULT 500,
    
    -- Payment Information
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    payment_method TEXT DEFAULT 'monthly',
    last_payment_date DATE,
    next_payment_date DATE,
    
    -- Settings & Features
    settings JSONB DEFAULT '{}',
    features JSONB DEFAULT '{"api_access": false, "white_label": false, "custom_domain": false}',
    
    -- Branding (White Label)
    primary_color TEXT DEFAULT '#007bff',
    secondary_color TEXT DEFAULT '#6c757d',
    brand_name TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for tenants
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants(email);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON tenants(subscription_status);

-- ============================================================================
-- SUBSCRIPTION PLANS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price_monthly NUMERIC(10,2) DEFAULT 0,
    price_yearly NUMERIC(10,2) DEFAULT 0,
    max_users INTEGER DEFAULT 3,
    max_patients INTEGER DEFAULT 500,
    max_storage_mb INTEGER DEFAULT 1000,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    is_trial BOOLEAN DEFAULT false,
    trial_days INTEGER DEFAULT 14,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name_ar, name_en, slug, description, price_monthly, price_yearly, max_users, max_patients, is_trial, trial_days, sort_order) VALUES
('تجريبي', 'Trial', 'trial', 'تجربة مجانية لمدة 14 يوم', 0, 0, 2, 100, true, 14, 0),
('أساسي', 'Basic', 'basic', 'خطة أساسية للعيادات الصغيرة', 299, 2990, 3, 500, false, 0, 1),
('احترافي', 'Professional', 'professional', 'خطة احترافية للعيادات المتوسطة', 499, 4990, 10, 2000, false, 0, 2),
('مؤسسات', 'Enterprise', 'enterprise', 'خطة المؤسسات للعيادات الكبيرة', 999, 9990, 999999, 999999, false, 0, 3)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- TENANT INVITATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'DOCTOR',
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED')),
    invited_by UUID REFERENCES user_profiles(id),
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_invitations_token ON tenant_invitations(token);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_email ON tenant_invitations(email);

-- ============================================================================
-- ADD TENANT_ID TO USERS TABLE
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);

-- ============================================================================
-- ADD TENANT_ID TO USER_PROFILES TABLE
-- ============================================================================

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS can_invite_users BOOLEAN DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES user_profiles(id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_id ON user_profiles(tenant_id);

-- ============================================================================
-- ADD TENANT_ID TO ALL DATA TABLES
-- ============================================================================

-- Patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_patients_tenant_id ON patients(tenant_id);

-- Patient Attachments
ALTER TABLE patient_attachments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_patient_attachments_tenant_id ON patient_attachments(tenant_id);

-- Dentists
ALTER TABLE dentists ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_dentists_tenant_id ON dentists(tenant_id);

-- Appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON appointments(tenant_id);

-- Suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON suppliers(tenant_id);

-- Supplier Invoices
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_tenant_id ON supplier_invoices(tenant_id);

-- Supplier Invoice Attachments
ALTER TABLE supplier_invoice_attachments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoice_attachments_tenant_id ON supplier_invoice_attachments(tenant_id);

-- Inventory Items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant_id ON inventory_items(tenant_id);

-- Expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON expenses(tenant_id);

-- Treatment Definitions
ALTER TABLE treatment_definitions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_treatment_definitions_tenant_id ON treatment_definitions(tenant_id);

-- Treatment Doctor Percentages
ALTER TABLE treatment_doctor_percentages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_treatment_doctor_percentages_tenant_id ON treatment_doctor_percentages(tenant_id);

-- Treatment Records
ALTER TABLE treatment_records ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_tenant_id ON treatment_records(tenant_id);

-- NOTE:
-- This file previously ended with an incomplete SQL statement.
-- Keep this migration syntactically valid; any additional tenant columns
-- should be introduced in a follow-up migration file.
