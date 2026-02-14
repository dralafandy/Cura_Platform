-- Create a system user for internal authentication
-- This ensures that internal session storage users have a corresponding database entry

-- Insert system user
INSERT INTO users (id, email, created_at, updated_at) 
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'system@internal',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert system user profile
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
) ON CONFLICT (user_id) DO NOTHING;

-- Update patient_attachments table to handle internal users
ALTER TABLE patient_attachments
DROP CONSTRAINT IF EXISTS patient_attachments_uploaded_by_fkey;

-- Recreate constraint with CASCADE to allow NULL for internal users
ALTER TABLE patient_attachments
ADD CONSTRAINT patient_attachments_uploaded_by_fkey
FOREIGN KEY (uploaded_by) REFERENCES users(id)
ON DELETE CASCADE;

-- Make uploaded_by nullable to support internal authentication
ALTER TABLE patient_attachments
ALTER COLUMN uploaded_by DROP NOT NULL;

-- Add a trigger to automatically assign system user for internal uploads
CREATE OR REPLACE FUNCTION handle_internal_user_attachments()
RETURNS TRIGGER AS $$
BEGIN
  -- If uploaded_by is NULL and we're using internal authentication
  IF NEW.uploaded_by IS NULL THEN
    -- Use system user for internal uploads
    NEW.uploaded_by := '00000000-0000-0000-0000-000000000001';
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

-- Create similar triggers for other tables that might be affected
-- Apply the same pattern to all tables with user_id references

-- Function to handle internal users for all tables
CREATE OR REPLACE FUNCTION handle_internal_user_all_tables()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is NULL, use system user
  IF NEW.user_id IS NULL THEN
    NEW.user_id := '00000000-0000-0000-0000-000000000001';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to other tables that have user_id constraints
DO $$
DECLARE
    table_name text;
    constraint_name text;
    table_record record;
BEGIN
    -- Get all tables that reference users via user_id
    FOR table_record IN
        SELECT DISTINCT
            kcu.table_name,
            tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'user_id'
        AND ccu.table_name = 'users'
        AND kcu.table_schema = 'public'
    LOOP
        -- Drop existing constraint
        constraint_name := table_record.constraint_name;
        table_name := table_record.table_name;

        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', table_name, constraint_name);

        -- Recreate constraint with CASCADE
        EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE', table_name, constraint_name);

        -- Make user_id nullable if not already
        EXECUTE format('ALTER TABLE %I ALTER COLUMN user_id DROP NOT NULL', table_name);

        -- Create trigger for this table
        EXECUTE format('CREATE TRIGGER trigger_handle_internal_user_%I
          BEFORE INSERT ON %I
          FOR EACH ROW
          EXECUTE FUNCTION handle_internal_user_all_tables()',
          replace(table_name, '.', '_'),
          table_name);
    END LOOP;
END $$;
