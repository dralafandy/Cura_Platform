-- ============================================================================
-- Add Custom Permissions Columns to user_profiles
-- 
-- This migration adds the missing columns for the custom permissions system:
-- - custom_permissions: Array of custom permission strings beyond role-based permissions
-- - override_permissions: Boolean to control whether to use only custom permissions
-- ============================================================================

-- Add custom_permissions column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'custom_permissions'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN custom_permissions TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added custom_permissions column to user_profiles';
  ELSE
    RAISE NOTICE 'custom_permissions column already exists';
  END IF;
END $$;

-- Add override_permissions column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'override_permissions'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN override_permissions BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added override_permissions column to user_profiles';
  ELSE
    RAISE NOTICE 'override_permissions column already exists';
  END IF;
END $$;

-- Create index for faster permission lookups (optional but helpful)
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);

-- Grant necessary permissions (adjust as needed for your setup)
-- COMMENT ON COLUMN user_profiles.custom_permissions IS 'Custom permissions beyond role-based permissions';
-- COMMENT ON COLUMN user_profiles.override_permissions IS 'When true, use only custom_permissions, ignoring role-based permissions';

RAISE NOTICE 'Migration completed successfully: Added custom_permissions and override_permissions columns to user_profiles';
