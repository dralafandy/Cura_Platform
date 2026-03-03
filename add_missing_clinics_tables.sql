-- DEPRECATED - DO NOT RUN
--
-- This legacy script recreates clinic tables and grants permissive access that
-- can break tenant isolation. Use hardened migrations under `migrations/` only.
DO $$
BEGIN
  RAISE EXCEPTION 'Deprecated script blocked: use migrations/016+ and migrations/023_lockdown_data_isolation.sql';
END $$;

-- ============================================================================
-- Add Missing Clinics Tables
-- This migration adds the clinics, clinic_branches, user_clinics tables
-- and user_clinics_view that are required by the application
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CLINICS TABLE
-- ============================================================================

DROP TABLE IF EXISTS clinics CASCADE;
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    description TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'Egypt',
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#0891b2',
    secondary_color TEXT DEFAULT '#0284c7',
    status TEXT CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- ============================================================================
-- CLINIC BRANCHES TABLE
-- ============================================================================

DROP TABLE IF EXISTS clinic_branches CASCADE;
CREATE TABLE clinic_branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    branch_type TEXT CHECK (branch_type IN ('MAIN', 'BRANCH', 'MOBILE', 'VIRTUAL')) DEFAULT 'BRANCH',
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'Egypt',
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    operating_hours JSONB DEFAULT '{
        "monday": {"open": "09:00", "close": "17:00", "isOpen": true},
        "tuesday": {"open": "09:00", "close": "17:00", "isOpen": true},
        "wednesday": {"open": "09:00", "close": "17:00", "isOpen": true},
        "thursday": {"open": "09:00", "close": "17:00", "isOpen": true},
        "friday": {"open": "09:00", "close": "17:00", "isOpen": true},
        "saturday": {"open": "09:00", "close": "17:00", "isOpen": true},
        "sunday": {"open": "09:00", "close": "17:00", "isOpen": false}
    }'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    is_main_branch BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- ============================================================================
-- USER CLINICS TABLE (User access to clinics)
-- ============================================================================

DROP TABLE IF EXISTS user_clinics CASCADE;
CREATE TABLE user_clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL,
    role_at_clinic TEXT CHECK (role_at_clinic IN ('ADMIN', 'DOCTOR', 'ASSISTANT', 'RECEPTIONIST')) DEFAULT 'DOCTOR',
    custom_permissions TEXT[] DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    access_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    UNIQUE(user_id, clinic_id, branch_id)
);

-- ============================================================================
-- USER CLINICS VIEW (For easy querying of user clinic access)
-- ============================================================================

DROP VIEW IF EXISTS user_clinics_view CASCADE;
CREATE OR REPLACE VIEW user_clinics_view AS
SELECT 
    uc.id,
    uc.user_id,
    uc.clinic_id,
    c.name AS clinic_name,
    c.code AS clinic_code,
    c.status AS clinic_status,
    uc.branch_id,
    cb.name AS branch_name,
    cb.branch_type,
    uc.role_at_clinic,
    uc.custom_permissions,
    uc.is_default,
    uc.access_active,
    uc.created_at,
    uc.updated_at,
    uc.created_by
FROM user_clinics uc
LEFT JOIN clinics c ON uc.clinic_id = c.id
LEFT JOIN clinic_branches cb ON uc.branch_id = cb.id
WHERE c.status = 'ACTIVE';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON clinics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON clinic_branches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_clinics TO authenticated;

-- Grant access to anon (for public booking if needed)
GRANT SELECT ON clinics TO anon;
GRANT SELECT ON clinic_branches TO anon;
GRANT SELECT ON user_clinics_view TO anon;

-- Grant usage on sequence (for auto-generated IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_clinics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR CLINICS
-- ============================================================================

-- Clinics: Users can see all active clinics
DROP POLICY IF EXISTS "clinics_select_all" ON clinics;
CREATE POLICY "clinics_select_all" ON clinics
    FOR SELECT USING (status = 'ACTIVE');

-- Clinics: Users can insert if authenticated
DROP POLICY IF EXISTS "clinics_insert_authenticated" ON clinics;
CREATE POLICY "clinics_insert_authenticated" ON clinics
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Clinics: Users can update active clinics
DROP POLICY IF EXISTS "clinics_update_active" ON clinics;
CREATE POLICY "clinics_update_active" ON clinics
    FOR UPDATE USING (status = 'ACTIVE')
    WITH CHECK (status = 'ACTIVE' OR status = 'INACTIVE');

-- ============================================================================
-- RLS POLICIES FOR CLINIC_BRANCHES
-- ============================================================================

-- Clinic Branches: Users can see all branches of active clinics
DROP POLICY IF EXISTS "clinic_branches_select_all" ON clinic_branches;
CREATE POLICY "clinic_branches_select_all" ON clinic_branches
    FOR SELECT USING (
        clinic_id IN (SELECT id FROM clinics WHERE status = 'ACTIVE')
    );

-- Clinic Branches: Users can insert if authenticated
DROP POLICY IF EXISTS "clinic_branches_insert_authenticated" ON clinic_branches;
CREATE POLICY "clinic_branches_insert_authenticated" ON clinic_branches
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Clinic Branches: Users can update branches of active clinics
DROP POLICY IF EXISTS "clinic_branches_update_active" ON clinic_branches;
CREATE POLICY "clinic_branches_update_active" ON clinic_branches
    FOR UPDATE USING (
        clinic_id IN (SELECT id FROM clinics WHERE status = 'ACTIVE')
    );

-- ============================================================================
-- RLS POLICIES FOR USER_CLINICS
-- ============================================================================

-- User Clinics: Users can see their own clinic assignments
DROP POLICY IF EXISTS "user_clinics_select_own" ON user_clinics;
CREATE POLICY "user_clinics_select_own" ON user_clinics
    FOR SELECT USING (
        user_id = auth.uid() 
        OR auth.role() = 'authenticated'
    );

-- User Clinics: Users can insert their own clinic assignments
DROP POLICY IF EXISTS "user_clinics_insert_own" ON user_clinics;
CREATE POLICY "user_clinics_insert_own" ON user_clinics
    FOR INSERT WITH CHECK (
        user_id = auth.uid() 
        OR auth.role() = 'authenticated'
    );

-- User Clinics: Users can update their own clinic assignments
DROP POLICY IF EXISTS "user_clinics_update_own" ON user_clinics;
CREATE POLICY "user_clinics_update_own" ON user_clinics
    FOR UPDATE USING (
        user_id = auth.uid() 
        OR auth.role() = 'authenticated'
    );

-- ============================================================================
-- CREATE DEFAULT CLINIC (Optional - for initial setup)
-- ============================================================================

-- Insert a default clinic if none exists
INSERT INTO clinics (name, code, description, status, primary_color, secondary_color)
SELECT 'Default Clinic', 'DEFAULT', 'Default clinic for initial setup', 'ACTIVE', '#0891b2', '#0284c7'
WHERE NOT EXISTS (SELECT 1 FROM clinics LIMIT 1);
