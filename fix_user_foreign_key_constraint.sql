-- Fix User Foreign Key Constraint for Patient Attachments
-- This script ensures that the system user exists and handles internal authentication properly

-- Check if system user already exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000001') THEN
    INSERT INTO users (id, email, created_at, updated_at)
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      'system@internal',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Check if system user profile already exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = '00000000-0000-0000-0000-000000000001') THEN
    INSERT INTO user_profiles (
      user_id,
      username,
      role,
      permissions,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000001',
      'system_user',
      'ADMIN',
      ARRAY['manage_patients', 'view_attachments', 'upload_attachments', 'delete_attachments', 'all_permissions'],
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Update patient_attachments table to handle internal users
-- Drop existing constraints if they exist
ALTER TABLE patient_attachments
DROP CONSTRAINT IF EXISTS patient_attachments_uploaded_by_fkey;

ALTER TABLE patient_attachments
DROP CONSTRAINT IF EXISTS patient_attachments_user_id_fkey;

-- Recreate constraints with CASCADE to allow proper handling
ALTER TABLE patient_attachments
ADD CONSTRAINT patient_attachments_uploaded_by_fkey
FOREIGN KEY (uploaded_by) REFERENCES users(id)
ON DELETE CASCADE;

ALTER TABLE patient_attachments
ADD CONSTRAINT patient_attachments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE CASCADE;

-- Make both columns nullable to support internal authentication
ALTER TABLE patient_attachments
ALTER COLUMN uploaded_by DROP NOT NULL;

ALTER TABLE patient_attachments
ALTER COLUMN user_id DROP NOT NULL;

-- Add a trigger to automatically assign system user for internal uploads
CREATE OR REPLACE FUNCTION handle_internal_user_attachments()
RETURNS TRIGGER AS $$
BEGIN
  -- If uploaded_by is NULL or references a non-existent user, use system user
  IF NEW.uploaded_by IS NULL OR NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.uploaded_by) THEN
    NEW.uploaded_by := '00000000-0000-0000-0000-000000000001';
  END IF;

  -- If user_id is NULL or references a non-existent user, use system user
  IF NEW.user_id IS NULL OR NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.user_id) THEN
    NEW.user_id := '00000000-0000-0000-0000-000000000001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for patient_attachments
DROP TRIGGER IF EXISTS trigger_handle_internal_user_attachments ON patient_attachments;
CREATE TRIGGER trigger_handle_internal_user_attachments
  BEFORE INSERT ON patient_attachments
  FOR EACH ROW
  EXECUTE FUNCTION handle_internal_user_attachments();

-- Also create trigger for updates
DROP TRIGGER IF EXISTS trigger_handle_internal_user_attachments_update ON patient_attachments;
CREATE TRIGGER trigger_handle_internal_user_attachments_update
  BEFORE UPDATE ON patient_attachments
  FOR EACH ROW
  EXECUTE FUNCTION handle_internal_user_attachments();

-- Update existing attachments that might reference non-existent users
UPDATE patient_attachments
SET uploaded_by = '00000000-0000-0000-0000-000000000001'
WHERE uploaded_by NOT IN (SELECT id FROM users);

UPDATE patient_attachments
SET user_id = '00000000-0000-0000-0000-000000000001'
WHERE user_id NOT IN (SELECT id FROM users);