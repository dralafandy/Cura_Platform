-- ============================================================================
-- Migration: Add status column to user_profiles table
-- 
-- This migration adds the missing 'status' column to user_profiles table
-- which is required by UserManagement.tsx and other components
-- 
-- Run this migration to fix: ERROR: 42703: column "status" does not exist
-- ============================================================================

-- First, check if user_profiles table exists
DO $$ 
BEGIN
  -- Check if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    -- Check if status column already exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'status') THEN
      -- Add status column with default value
      ALTER TABLE user_profiles ADD COLUMN status TEXT DEFAULT 'ACTIVE';
      
      -- Add CHECK constraint for valid status values
      ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_status_check 
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'));
      
      -- Add index for better query performance
      CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
      
      RAISE NOTICE 'Successfully added status column to user_profiles table';
    ELSE
      RAISE NOTICE 'status column already exists in user_profiles table';
    END IF;
  ELSE
    RAISE NOTICE 'user_profiles table does not exist';
  END IF;
END $$;

-- ============================================================================
-- Also add missing columns that might be needed
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    -- Add dentist_id column if it doesn't exist (needed for DOCTOR role users)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'dentist_id') THEN
      ALTER TABLE user_profiles ADD COLUMN dentist_id UUID;
      RAISE NOTICE 'Successfully added dentist_id column to user_profiles table';
    END IF;
    
    -- Add custom_permissions column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'custom_permissions') THEN
      ALTER TABLE user_profiles ADD COLUMN custom_permissions TEXT[] DEFAULT '{}';
      RAISE NOTICE 'Successfully added custom_permissions column to user_profiles table';
    END IF;
    
    -- Add override_permissions column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'override_permissions') THEN
      ALTER TABLE user_profiles ADD COLUMN override_permissions BOOLEAN DEFAULT FALSE;
      RAISE NOTICE 'Successfully added override_permissions column to user_profiles table';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
