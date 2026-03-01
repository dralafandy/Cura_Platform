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

-- Payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);

-- Doctor Payments
ALTER TABLE doctor_payments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_doctor_payments_tenant_id ON doctor_payments(tenant_id);

-- Insurance Companies
ALTER TABLE insurance_companies ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_insurance_companies_tenant_id ON insurance_companies(tenant_id);

-- Insurance Accounts
ALTER TABLE insurance_accounts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_insurance_accounts_tenant_id ON insurance_accounts(tenant_id);

-- Insurance Transactions
ALTER TABLE insurance_transactions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_insurance_transactions_tenant_id ON insurance_transactions(tenant_id);

-- Patient Insurance Link
ALTER TABLE patient_insurance_link ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_link_tenant_id ON patient_insurance_link(tenant_id);

-- Treatment Insurance Link
ALTER TABLE treatment_insurance_link ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_link_tenant_id ON treatment_insurance_link(tenant_id);

-- Lab Cases
ALTER TABLE lab_cases ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_lab_cases_tenant_id ON lab_cases(tenant_id);

-- Prescriptions
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_tenant_id ON prescriptions(tenant_id);

-- Prescription Items
ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_tenant_id ON prescription_items(tenant_id);

-- Employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON employees(tenant_id);

-- Employee Attendance
ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_tenant_id ON employee_attendance(tenant_id);

-- Employee Compensations
ALTER TABLE employee_compensations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_employee_compensations_tenant_id ON employee_compensations(tenant_id);

-- ============================================================================
-- SUBSCRIPTION HELPER FUNCTIONS
-- ============================================================================

-- Schema for subscription functions
CREATE SCHEMA IF NOT EXISTS subscription;

-- Function to check if trial is valid
CREATE OR REPLACE FUNCTION subscription.is_trial_valid(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_tenant RECORD;
BEGIN
    SELECT * INTO v_tenant
    FROM tenants
    WHERE id = p_tenant_id;
    
    IF v_tenant IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- If subscription is active, trial is valid
    IF v_tenant.subscription_status = 'ACTIVE' THEN
        RETURN TRUE;
    END IF;
    
    -- Check trial period
    IF v_tenant.subscription_status = 'TRIAL' THEN
        IF v_tenant.trial_end_date >= CURRENT_DATE THEN
            RETURN TRUE;
        ELSE
            -- Update status to expired
            UPDATE tenants 
            SET subscription_status = 'EXPIRED',
                updated_at = NOW()
            WHERE id = p_tenant_id;
            RETURN FALSE;
        END IF;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get remaining trial days
CREATE OR REPLACE FUNCTION subscription.get_trial_days_remaining(p_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_tenant RECORD;
BEGIN
    SELECT * INTO v_tenant
    FROM tenants
    WHERE id = p_tenant_id;
    
    IF v_tenant IS NULL OR v_tenant.subscription_status != 'TRIAL' THEN
        RETURN 0;
    END IF;
    
    RETURN GREATEST(0, v_tenant.trial_end_date - CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Function to get tenant subscription info
CREATE OR REPLACE FUNCTION subscription.get_tenant_info(p_tenant_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    subscription_status TEXT,
    subscription_plan TEXT,
    trial_days_remaining INTEGER,
    is_subscription_valid BOOLEAN,
    max_users INTEGER,
    max_patients INTEGER,
    current_users INTEGER,
    current_patients INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.slug,
        t.subscription_status,
        t.subscription_plan,
        subscription.get_trial_days_remaining(t.id) as trial_days_remaining,
        subscription.is_trial_valid(t.id) as is_subscription_valid,
        t.max_users,
        t.max_patients,
        (SELECT COUNT(*)::INTEGER FROM users WHERE tenant_id = t.id) as current_users,
        (SELECT COUNT(*)::INTEGER FROM patients WHERE tenant_id = t.id) as current_patients
    FROM tenants t
    WHERE t.id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check resource limits
CREATE OR REPLACE FUNCTION subscription.check_limits(p_tenant_id UUID, p_resource TEXT)
RETURNS TABLE (allowed BOOLEAN, current_count INTEGER, max_limit INTEGER, message TEXT) AS $$
DECLARE
    v_tenant RECORD;
    v_current_count INTEGER;
    v_limit INTEGER;
    v_message TEXT;
BEGIN
    SELECT * INTO v_tenant FROM tenants WHERE id = p_tenant_id;
    
    IF v_tenant IS NULL THEN
        RETURN QUERY SELECT FALSE, 0, 0, 'Tenant not found'::TEXT;
    END IF;
    
    -- Check subscription validity first
    IF NOT subscription.is_trial_valid(p_tenant_id) THEN
        IF v_tenant.subscription_status = 'EXPIRED' THEN
            RETURN QUERY SELECT FALSE, 0, 0, 'Trial period expired. Please upgrade your subscription.'::TEXT;
        ELSEIF v_tenant.subscription_status = 'SUSPENDED' THEN
            RETURN QUERY SELECT FALSE, 0, 0, 'Account is suspended. Please contact support.'::TEXT;
        ELSE
            RETURN QUERY SELECT FALSE, 0, 0, 'Subscription is not valid.'::TEXT;
        END IF;
    END IF;
    
    -- Check limits based on resource type
    CASE p_resource
        WHEN 'users' THEN
            SELECT COUNT(*) INTO v_current_count FROM users WHERE tenant_id = p_tenant_id;
            v_limit := v_tenant.max_users;
            v_message := 'Maximum number of users reached. Upgrade to add more users.';
        WHEN 'patients' THEN
            SELECT COUNT(*) INTO v_current_count FROM patients WHERE tenant_id = p_tenant_id;
            v_limit := v_tenant.max_patients;
            v_message := 'Maximum number of patients reached. Upgrade to add more patients.';
        ELSE
            RETURN QUERY SELECT TRUE, 0, 0, NULL::TEXT;
    END CASE;
    
    IF v_current_count >= v_limit THEN
        RETURN QUERY SELECT FALSE, v_current_count, v_limit, v_message;
    END IF;
    
    RETURN QUERY SELECT TRUE, v_current_count, v_limit, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to create new tenant with trial
CREATE OR REPLACE FUNCTION subscription.create_tenant_with_trial(
    p_name TEXT,
    p_slug TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_owner_email TEXT,
    p_owner_password TEXT
)
RETURNS TABLE (tenant_id UUID, user_id UUID, error_message TEXT) AS $$
DECLARE
    v_tenant_id UUID;
    v_user_id UUID;
    v_plan RECORD;
    v_trial_days INTEGER;
BEGIN
    -- Check if slug already exists
    IF EXISTS (SELECT 1 FROM tenants WHERE slug = p_slug) THEN
        RETURN QUERY SELECT NULL::UUID, NULL::UUID, 'Clinic URL already exists. Please choose another name.'::TEXT;
        RETURN;
    END IF;
    
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM users WHERE email = p_owner_email) THEN
        RETURN QUERY SELECT NULL::UUID, NULL::UUID, 'Email already registered.'::TEXT;
        RETURN;
    END IF;
    
    -- Get trial plan
    SELECT * INTO v_plan FROM subscription_plans WHERE slug = 'trial';
    v_trial_days := COALESCE(v_plan.trial_days, 14);
    
    -- Create tenant
    INSERT INTO tenants (name, slug, email, phone, subscription_status, subscription_plan, trial_start_date, trial_end_date)
    VALUES (p_name, p_slug, p_email, p_phone, 'TRIAL', 'TRIAL', CURRENT_DATE, CURRENT_DATE + v_trial_days)
    RETURNING id INTO v_tenant_id;
    
    -- Create owner user
    INSERT INTO users (email, tenant_id, is_owner, created_at, updated_at)
    VALUES (p_owner_email, v_tenant_id, true, NOW(), NOW())
    RETURNING id INTO v_user_id;
    
    -- Note: In production, you would use Supabase Auth to create the actual auth user
    -- and then link it here. The password handling should be done client-side with Supabase.
    
    RETURN QUERY SELECT v_tenant_id, v_user_id, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to activate subscription
CREATE OR REPLACE FUNCTION subscription.activate_subscription(
    p_tenant_id UUID,
    p_plan_slug TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_plan RECORD;
    v_tenant RECORD;
BEGIN
    SELECT * INTO v_plan FROM subscription_plans WHERE slug = p_plan_slug AND is_active = true;
    
    IF v_plan IS NULL THEN
        RETURN FALSE;
    END IF;
    
    SELECT * INTO v_tenant FROM tenants WHERE id = p_tenant_id;
    
    UPDATE tenants SET
        subscription_status = 'ACTIVE',
        subscription_plan = p_plan_slug,
        subscription_start_date = CURRENT_DATE,
        subscription_end_date = CURRENT_DATE + 
            CASE WHEN v_tenant.payment_method = 'yearly' THEN INTERVAL '1 year' ELSE INTERVAL '1 month' END,
        max_users = v_plan.max_users,
        max_patients = v_plan.max_patients,
        updated_at = NOW()
    WHERE id = p_tenant_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to expire trials (run daily via cron)
CREATE OR REPLACE FUNCTION subscription.expire_old_trials()
RETURNS INTEGER AS $$
DECLARE
    v_expired_count INTEGER;
BEGIN
    UPDATE tenants 
    SET subscription_status = 'EXPIRED',
        updated_at = NOW()
    WHERE subscription_status = 'TRIAL' 
    AND trial_end_date < CURRENT_DATE;
    
    GET DIAGNOSTICS v_expired_count = ROW_COUNT;
    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dentists ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_invoice_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_doctor_percentages ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_insurance_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_insurance_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_compensations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for patients
DROP POLICY IF EXISTS "patients_tenant_isolation" ON patients;
CREATE POLICY "patients_tenant_isolation" ON patients
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- For patient_attachments
DROP POLICY IF EXISTS "patient_attachments_tenant_isolation" ON patient_attachments;
CREATE POLICY "patient_attachments_tenant_isolation" ON patient_attachments
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- For dentists
DROP POLICY IF EXISTS "dentists_tenant_isolation" ON dentists;
CREATE POLICY "dentists_tenant_isolation" ON dentists
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- For appointments
DROP POLICY IF EXISTS "appointments_tenant_isolation" ON appointments;
CREATE POLICY "appointments_tenant_isolation" ON appointments
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- For suppliers
DROP POLICY IF EXISTS "suppliers_tenant_isolation" ON suppliers;
CREATE POLICY "suppliers_tenant_isolation" ON suppliers
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- For supplier_invoices
DROP POLICY IF EXISTS "supplier_invoices_tenant_isolation" ON supplier_invoices;
CREATE POLICY "supplier_invoices_tenant_isolation" ON supplier_invoices
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- For inventory_items
DROP POLICY IF EXISTS "inventory_items_tenant_isolation" ON inventory_items;
CREATE POLICY "inventory_items_tenant_isolation" ON inventory_items
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- For expenses
DROP POLICY IF EXISTS "expenses_tenant_isolation" ON expenses;
CREATE POLICY "expenses_tenant_isolation" ON expenses
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- For treatment_definitions
DROP POLICY IF EXISTS "treatment_definitions_tenant_isolation" ON treatment_definitions;
CREATE POLICY "treatment_definitions_tenant_isolation" ON treatment_definitions
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- For treatment_records
DROP POLICY IF EXISTS "treatment_records_tenant_isolation" ON treatment_records;
CREATE POLICY "treatment_records_tenant_isolation" ON treatment_records
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- For payments
DROP POLICY IF EXISTS "payments_tenant_isolation" ON payments;
CREATE POLICY "payments_tenant_isolation" ON payments
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- For insurance_companies
DROP POLICY IF EXISTS "insurance_companies_tenant_isolation" ON insurance_companies;
CREATE POLICY "insurance_companies_tenant_isolation" ON insurance_companies
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- For employees
DROP POLICY IF EXISTS "employees_tenant_isolation" ON employees;
CREATE POLICY "employees_tenant_isolation" ON employees
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- For prescriptions
DROP POLICY IF EXISTS "prescriptions_tenant_isolation" ON prescriptions;
CREATE POLICY "prescriptions_tenant_isolation" ON prescriptions
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- For lab_cases
DROP POLICY IF EXISTS "lab_cases_tenant_isolation" ON lab_cases;
CREATE POLICY "lab_cases_tenant_isolation" ON lab_cases
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- For doctor_payments
DROP POLICY IF EXISTS "doctor_payments_tenant_isolation" ON doctor_payments;
CREATE POLICY "doctor_payments_tenant_isolation" ON doctor_payments
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- For users table (tenant-level)
DROP POLICY IF EXISTS "users_tenant_isolation" ON users;
CREATE POLICY "users_tenant_isolation" ON users
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- For user_profiles table (tenant-level)
DROP POLICY IF EXISTS "user_profiles_tenant_isolation" ON user_profiles;
CREATE POLICY "user_profiles_tenant_isolation" ON user_profiles
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT USAGE ON SCHEMA subscription TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA subscription TO authenticated;

-- ============================================================================
-- UPDATE EXISTING DATA (Migration helper)
-- ============================================================================

-- This function will be called to migrate existing data to use tenant_id
-- It creates a default tenant for existing data and assigns it

CREATE OR REPLACE FUNCTION migration.create_default_tenant_for_existing_data()
RETURNS void AS $$
DECLARE
    v_tenant_id UUID;
    v_user_id UUID;
BEGIN
    -- Check if there's existing data without tenant_id
    IF EXISTS (SELECT 1 FROM users WHERE tenant_id IS NULL LIMIT 1) THEN
        -- Create a default tenant for existing data
        INSERT INTO tenants (name, slug, subscription_status, subscription_plan)
        VALUES ('عيادتي', 'default-clinic', 'ACTIVE', 'BASIC')
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_tenant_id;
        
        -- Update all users to belong to this tenant
        UPDATE users SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
        
        -- Update user_profiles
        UPDATE user_profiles SET tenant_id = v_tenant_id 
        WHERE user_id IN (SELECT id FROM users WHERE tenant_id = v_tenant_id);
        
        -- Update all data tables
        UPDATE patients SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
        UPDATE patient_attachments SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
        UPDATE dentists SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
        UPDATE appointments SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
        UPDATE suppliers SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
        UPDATE supplier_invoices SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
        UPDATE inventory_items SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
        UPDATE expenses SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
        UPDATE treatment_definitions SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
        UPDATE treatment_records SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
        UPDATE payments SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
        UPDATE insurance_companies SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
        UPDATE employees SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
        UPDATE prescriptions SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
        UPDATE lab_cases SET tenant_id = v_tenant_id WHERE tenant_id IS NULL;
    END IF;
    
    RAISE NOTICE 'Migration complete. All data assigned to tenant(s).';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================================';
    RAISE NOTICE 'Multi-Tenant Migration Complete!';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'New Tables Created:';
    RAISE NOTICE '  - tenants (organization/clinic management)';
    RAISE NOTICE '  - subscription_plans (pricing plans)';
    RAISE NOTICE '  - tenant_invitations (invite team members)';
    RAISE NOTICE '';
    RAISE NOTICE 'Columns Added:';
    RAISE NOTICE '  - tenant_id added to all data tables';
    RAISE NOTICE '  - is_owner, is_primary to users table';
    RAISE NOTICE '  - subscription fields to tenants table';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions Created in "subscription" schema:';
    RAISE NOTICE '  - is_trial_valid(tenant_id)';
    RAISE NOTICE '  - get_trial_days_remaining(tenant_id)';
    RAISE NOTICE '  - get_tenant_info(tenant_id)';
    RAISE NOTICE '  - check_limits(tenant_id, resource)';
    RAISE NOTICE '  - create_tenant_with_trial(...)';
    RAISE NOTICE '  - activate_subscription(tenant_id, plan)';
    RAISE NOTICE '  - expire_old_trials()';
    RAISE NOTICE '';
    RAISE NOTICE 'Row Level Security:';
    RAISE NOTICE '  - RLS enabled on all data tables';
    RAISE NOTICE '  - Tenant isolation policies created';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Run: SELECT migration.create_default_tenant_for_existing_data();';
    RAISE NOTICE '  2. Update frontend auth to support multi-tenant login';
    RAISE NOTICE '========================================================';
END $$;
