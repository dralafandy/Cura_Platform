-- ============================================================================
-- Fix: Create/repair clinics and clinic_branches tables
-- 
-- Issue: Migration 001_add_clinics_and_branches.sql was not fully executed
-- Both tables need to exist for migration 002 to work
-- ============================================================================

-- Create clinic_status enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'clinic_status_enum') THEN
        CREATE TYPE clinic_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
    END IF;
END $$;

-- Create clinics table if it doesn't exist (with ALL columns)
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

-- Add missing columns to clinics (in case table already exists but is incomplete)
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

-- Create clinic_branches table if it doesn't exist
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

-- Add missing columns to clinic_branches (in case table already exists but is incomplete)
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

-- Create indexes for clinic_branches
CREATE INDEX IF NOT EXISTS idx_clinic_branches_clinic_id ON clinic_branches(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_branches_code ON clinic_branches(code);
CREATE INDEX IF NOT EXISTS idx_clinic_branches_is_main_branch ON clinic_branches(is_main_branch);

-- Create indexes for clinics
CREATE INDEX IF NOT EXISTS idx_clinics_code ON clinics(code);
CREATE INDEX IF NOT EXISTS idx_clinics_status ON clinics(status);

-- Verification
DO $$
BEGIN
    RAISE NOTICE '=== FIX COMPLETE ===';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinics') THEN
        RAISE NOTICE 'clinics table: EXISTS';
    ELSE
        RAISE EXCEPTION 'clinics table: MISSING';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinic_branches') THEN
        RAISE NOTICE 'clinic_branches table: EXISTS';
    ELSE
        RAISE EXCEPTION 'clinic_branches table: MISSING';
    END IF;
END $$;
