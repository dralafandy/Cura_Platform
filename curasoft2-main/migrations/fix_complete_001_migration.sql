-- ============================================================================
-- Fix: Complete migration 001_add_clinics_and_branches.sql
-- 
-- Issue: Migration 001 was not fully executed - multiple tables are missing
-- This fix creates ALL tables and structures from migration 001
-- ============================================================================

-- Create clinic_status enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clinic_status_enum') THEN
        CREATE TYPE clinic_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
    END IF;
END $$;

-- ============================================================================
-- CLINICS TABLE
-- ============================================================================

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
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- Add missing columns to clinics
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE;
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
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS updated_by UUID;

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
    code VARCHAR(50),
    branch_type VARCHAR(50) DEFAULT 'BRANCH',
    is_main_branch BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- Add missing columns to clinic_branches
ALTER TABLE clinic_branches ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE clinic_branches ADD COLUMN IF NOT EXISTS branch_type VARCHAR(50);
ALTER TABLE clinic_branches ADD COLUMN IF NOT EXISTS is_main_branch BOOLEAN;
ALTER TABLE clinic_branches ADD COLUMN IF NOT EXISTS is_active BOOLEAN;
ALTER TABLE clinic_branches ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE clinic_branches ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE clinic_branches ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE clinic_branches ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE clinic_branches ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE clinic_branches ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Indexes for clinic_branches
CREATE INDEX IF NOT EXISTS idx_clinic_branches_clinic_id ON clinic_branches(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_branches_code ON clinic_branches(code);
CREATE INDEX IF NOT EXISTS idx_clinic_branches_is_main_branch ON clinic_branches(is_main_branch);

-- ============================================================================
-- USER CLINIC ACCESS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_clinic_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL,
    role_at_clinic VARCHAR(50) NOT NULL DEFAULT 'RECEPTIONIST',
    custom_permissions TEXT[] DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    CONSTRAINT uq_user_clinic_branch UNIQUE (user_id, clinic_id, branch_id)
);

-- Indexes for user_clinic_access
CREATE INDEX IF NOT EXISTS idx_user_clinic_access_user_id ON user_clinic_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_clinic_access_clinic_id ON user_clinic_access(clinic_id);
CREATE INDEX IF NOT EXISTS idx_user_clinic_access_branch_id ON user_clinic_access(branch_id);

-- ============================================================================
-- CLINIC SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinic_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES clinic_branches(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
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
DROP TRIGGER IF EXISTS trigger_ensure_single_default_clinic ON user_clinic_access;
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
DROP TRIGGER IF EXISTS update_clinics_updated_at ON clinics;
CREATE TRIGGER update_clinics_updated_at
BEFORE UPDATE ON clinics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clinic_branches_updated_at ON clinic_branches;
CREATE TRIGGER update_clinic_branches_updated_at
BEFORE UPDATE ON clinic_branches
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clinic_settings_updated_at ON clinic_settings;
CREATE TRIGGER update_clinic_settings_updated_at
BEFORE UPDATE ON clinic_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== MIGRATION 001 FIX COMPLETE ===';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinics') THEN
        RAISE NOTICE 'clinics: OK';
    ELSE
        RAISE EXCEPTION 'clinics: FAILED';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinic_branches') THEN
        RAISE NOTICE 'clinic_branches: OK';
    ELSE
        RAISE EXCEPTION 'clinic_branches: FAILED';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_clinic_access') THEN
        RAISE NOTICE 'user_clinic_access: OK';
    ELSE
        RAISE EXCEPTION 'user_clinic_access: FAILED';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinic_settings') THEN
        RAISE NOTICE 'clinic_settings: OK';
    ELSE
        RAISE EXCEPTION 'clinic_settings: FAILED';
    END IF;
    
    RAISE NOTICE '=== ALL TABLES CREATED SUCCESSFULLY ===';
END $$;
