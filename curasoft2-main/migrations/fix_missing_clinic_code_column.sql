-- ============================================================================
-- Fix: Add missing 'code' column to clinics table
-- 
-- Issue: Migration 002_migrate_existing_data.sql failed because the 'code'
-- column was missing from the clinics table.
--
-- This fix adds the missing column if it doesn't exist.
-- ============================================================================

-- Add the code column if it doesn't exist
ALTER TABLE clinics 
ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE;

-- Add index on code column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_clinics_code ON clinics(code);

-- Verify the column was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinics' AND column_name = 'code'
    ) THEN
        RAISE NOTICE 'SUCCESS: code column now exists in clinics table';
    ELSE
        RAISE EXCEPTION 'FAILED: code column could not be added to clinics table';
    END IF;
END $$;
