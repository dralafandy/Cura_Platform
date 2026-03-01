-- ============================================================================
-- Migration: Add Clinics and Branches Support
-- 
-- Creates tables for multi-clinic/branch architecture
-- SAFE MIGRATION: All new tables, no existing data modification
-- 
-- Tables Created:
-- - clinics: Master clinic records
-- - clinic_branches: Branch locations under each clinic
-- - user_clinic_access: User to clinic/branch access mapping
-- - clinic_settings: Per-clinic configuration
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Clinic status
CREATE TYPE clinic_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- Branch type
CREATE TYPE branch_type_enum AS ENUM ('MAIN', 'BRANCH', 'MOBILE', 'VIRTUAL');

-- ============================================================================
-- CLINICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE, -- Short code for the clinic (e.g., 'MAIN', 'CLN1')
    description TEXT,
    
    -- Contact Information
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- Branding
    logo_url TEXT,
    primary_color VARCHAR(7), -- Hex color code
    secondary_color VARCHAR(7),
    
    -- Status
    status clinic_status_enum DEFAULT 'ACTIVE',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- Indexes for clinics
CREATE INDEX IF NOT EXISTS idx_clinics_status ON clinics(status);
CREATE INDEX IF NOT EXISTS idx_clinics_code ON clinics(code);

-- ============================================================================
-- CLINIC BRANCHES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinic_branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50), -- Branch code (e.g., 'MAIN', 'BR1')
    branch_type branch_type_enum DEFAULT 'BRANCH',
    
    -- Contact Information
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    
    -- Operating Hours (JSON for flexibility)
    operating_hours JSONB DEFAULT '{
        "monday": {"open": "09:00", "close": "17:00", "isOpen": true},
        "tuesday": {"open": "09:00", "close": "17:00", "isOpen": true},
        "wednesday": {"open": "09:00", "close": "17:00", "isOpen": true},
        "thursday": {"open": "09:00", "close": "17:00", "isOpen": true},
        "friday": {"open": "09:00", "close": "17:00", "isOpen": true},
        "saturday": {"open": "09:00", "close": "14:00", "isOpen": true},
        "sunday": {"open": "09:00", "close": "17:00", "isOpen": false}
    }',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_main_branch BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Unique constraint: code must be unique per clinic
    CONSTRAINT uq_branch_code_per_clinic UNIQUE (clinic_id, code)
);

-- Indexes for clinic_branches
CREATE INDEX IF NOT EXISTS idx_clinic_branches_clinic_id ON clinic_branches(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_branches_status ON clinic_branches(is_active);
CREATE INDEX IF NOT EXISTS idx_clinic_branches_main ON clinic_branches(is_main_branch);

-- ============================================================================
-- USER CLINIC ACCESS TABLE (Junction Table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_clinic_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL,
    
    -- Role at this clinic/branch (can be different from global role)
    role_at_clinic VARCHAR(50) NOT NULL DEFAULT 'RECEPTIONIST',
    
    -- Permissions specific to this clinic/branch
    custom_permissions TEXT[] DEFAULT '{}',
    
    -- Is this the default clinic for the user?
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Access status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT uq_user_clinic_branch UNIQUE (user_id, clinic_id, branch_id),
    CONSTRAINT chk_user_clinic_branch CHECK (
        (branch_id IS NULL) OR 
        (branch_id IN (SELECT id FROM clinic_branches WHERE clinic_id = user_clinic_access.clinic_id))
    )
);

-- Indexes for user_clinic_access
CREATE INDEX IF NOT EXISTS idx_user_clinic_access_user_id ON user_clinic_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_clinic_access_clinic_id ON user_clinic_access(clinic_id);
CREATE INDEX IF NOT EXISTS idx_user_clinic_access_branch_id ON user_clinic_access(branch_id);
CREATE INDEX IF NOT EXISTS idx_user_clinic_access_default ON user_clinic_access(is_default) WHERE is_default = TRUE;

-- ============================================================================
-- CLINIC SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinic_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES clinic_branches(id) ON DELETE CASCADE,
    
    -- Settings stored as JSON for flexibility
    settings JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Constraint: either clinic_id or branch_id must be set
    CONSTRAINT chk_clinic_settings_scope CHECK (
        (clinic_id IS NOT NULL) OR (branch_id IS NOT NULL)
    ),
    CONSTRAINT uq_clinic_settings UNIQUE (clinic_id, branch_id)
);

-- Indexes for clinic_settings
CREATE INDEX IF NOT EXISTS idx_clinic_settings_clinic_id ON clinic_settings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_settings_branch_id ON clinic_settings(branch_id);

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

-- Function to ensure only one default clinic per user
CREATE OR REPLACE FUNCTION ensure_single_default_clinic()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        UPDATE user_clinic_access 
        SET is_default = FALSE 
        WHERE user_id = NEW.user_id 
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single default clinic
CREATE TRIGGER trigger_ensure_single_default_clinic
BEFORE INSERT OR UPDATE ON user_clinic_access
FOR EACH ROW
EXECUTE FUNCTION ensure_single_default_clinic();

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_clinics_updated_at
BEFORE UPDATE ON clinics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinic_branches_updated_at
BEFORE UPDATE ON clinic_branches
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_clinic_access_updated_at
BEFORE UPDATE ON user_clinic_access
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinic_settings_updated_at
BEFORE UPDATE ON clinic_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
