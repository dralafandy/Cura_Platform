-- ============================================================================
-- Fix: Add ALL missing columns to clinics table
-- 
-- Issue: The clinics table was created but is missing multiple columns
-- needed by migration 002_migrate_existing_data.sql
--
-- This fix adds all missing columns based on the schema in 
-- 001_add_clinics_and_branches.sql
-- ============================================================================

-- Add missing columns if they don't exist
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

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_clinics_code ON clinics(code);
CREATE INDEX IF NOT EXISTS idx_clinics_status ON clinics(status);

-- Verify all required columns exist
DO $$
DECLARE
    missing_columns TEXT := '';
    col_exists BOOLEAN;
BEGIN
    FOR col_exists, missing_columns IN 
        SELECT 
            EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'clinics' AND column_name = col),
            col
        FROM unnest(ARRAY['code', 'description', 'name', 'status']) AS col
    LOOP
        IF NOT col_exists THEN
            RAISE NOTICE 'WARNING: Column % is missing', missing_columns;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'SUCCESS: All required columns added to clinics table';
END $$;
