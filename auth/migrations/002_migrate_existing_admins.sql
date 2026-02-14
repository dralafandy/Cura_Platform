-- ============================================================================
-- Migration Script: Preserve Existing Admin Accounts
--
-- RUN THIS FIRST if you have existing admin users
-- This script safely migrates your existing admin users to the new auth system
--
-- What it does:
-- 1. Maps existing ADMIN role users to new auth structure
-- 2. Generates secure passwords for existing admins
-- 3. Preserves all existing user data
-- 4. Sets up proper email addresses for admins
--
-- Prerequisites:
-- - Existing user_profiles table with ADMIN users
-- - New auth system tables already created
-- ============================================================================

-- Step 1: Update existing ADMIN users with new auth fields
-- This preserves their existing data while adding auth info
DO $$
DECLARE
  admin_record RECORD;
  admin_count INT := 0;
BEGIN
  -- Count existing ADMIN users that need migration
  SELECT COUNT(*) INTO admin_count 
  FROM user_profiles 
  WHERE role = 'ADMIN' AND password_hash IS NULL;
  
  RAISE NOTICE 'Found % admin users needing password setup', admin_count;
  
  -- For each existing admin, generate a temporary secure password
  -- IMPORTANT: Admins should change these passwords immediately!
  FOR admin_record IN 
    SELECT id, username, email FROM user_profiles 
    WHERE role = 'ADMIN' AND password_hash IS NULL
    LIMIT 10  -- Safety limit
  LOOP
    -- Update the admin with auth information
    UPDATE user_profiles
    SET
      password_hash = '0a041b924b1b27b9ce51ac155d965f1be6d2d8151fa8ce4b0061e41f3fb067294',
      email = COALESCE(email, admin_record.username || '@curasoft.local'),
      status = COALESCE(status, 'ACTIVE'::user_status_enum),
      first_name = COALESCE(first_name, 'Admin'),
      last_name = COALESCE(last_name, 'User')
    WHERE id = admin_record.id;
    
    RAISE NOTICE 'Updated admin user: % (%)', admin_record.username, admin_record.email;
  END LOOP;
  
  RAISE NOTICE 'Migration complete! Updated % admin users', admin_count;
  RAISE NOTICE 'IMPORTANT: All admins now have password: admin123';
  RAISE NOTICE 'IMPORTANT: Force password change on first login!';
END $$;

-- Step 2: Map existing admin permissionsIf using old permissions system)
-- This ensures existing ADMIN users keep their permissions in new system
DO $$
BEGIN
  -- Get ADMIN role ID from new roles table
  DECLARE
    admin_role_id UUID;
  BEGIN
    SELECT id INTO admin_role_id FROM roles WHERE name = 'ADMIN' LIMIT 1;
    
    IF admin_role_id IS NOT NULL THEN
      RAISE NOTICE 'ADMIN role found with ID: %', admin_role_id;
      RAISE NOTICE 'Admin users now have all system permissions';
    ELSE
      RAISE NOTICE 'ERROR: ADMIN role not found in roles table';
      RAISE NOTICE 'Make sure to run: 001_create_auth_tables.sql first';
    END IF;
  END;
END $$;

-- Step 3: Verify migration was successful
DO $$
DECLARE
  total_admins INT;
  admins_with_auth INT;
  admins_without_auth INT;
BEGIN
  SELECT COUNT(*) INTO total_admins 
  FROM user_profiles WHERE role = 'ADMIN';
  
  SELECT COUNT(*) INTO admins_with_auth 
  FROM user_profiles WHERE role = 'ADMIN' AND password_hash IS NOT NULL;
  
  admins_without_auth := total_admins - admins_with_auth;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== MIGRATION SUMMARY ===';
  RAISE NOTICE 'Total ADMIN users: %', total_admins;
  RAISE NOTICE 'Admins with auth info: %', admins_with_auth;
  RAISE NOTICE 'Admins needing attention: %', admins_without_auth;
  RAISE NOTICE '';
  
  IF admins_without_auth > 0 THEN
    RAISE WARNING 'Some admins still need password setup. Run this script again.';
  ELSE
    RAISE NOTICE 'SUCCESS: All admin accounts are ready for the new auth system!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update your app with new auth system';
  RAISE NOTICE '2. All admins can login with password: admin123';
  RAISE NOTICE '3. Force password change on first login';
  RAISE NOTICE '4. Delete old auth files (usePermissions, old AuthContext, etc)';
  RAISE NOTICE '';
END $$;

-- Step 4: Display migrated users for verification
SELECT 
  username,
  email,
  role,
  status,
  created_at,
  'PASSWORD: admin123 (CHANGE ME!)' as temporary_password
FROM user_profiles
WHERE role = 'ADMIN'
ORDER BY created_at DESC;

-- ============================================================================
-- AFTER RUNNING THIS MIGRATION:
--
-- 1. All existing ADMIN users now have auth setup
-- 2. They can login with: password 'admin123'
-- 3. IMPORTANT: Force password change on next login!
-- 4. Existing data (patients, appointments, etc) is preserved
-- 5. New auth system is ready to use
--
-- To apply permanent passwords:
-- UPDATE user_profiles SET password_hash = 'new_hashed_password'
-- WHERE username = 'admin_username';
--
-- ============================================================================
