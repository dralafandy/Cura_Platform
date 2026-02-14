-- Storage-Only Fix for Patient Attachments Upload Error
-- This script only fixes the storage RLS policies without changing other database structures
-- Run this if you only want to fix the upload error without recreating tables

-- =====================================================
-- PART 1: STORAGE BUCKET SETUP
-- =====================================================

-- Create patient-attachments storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-attachments',
  'patient-attachments',
  true, -- Make bucket public for easy access to uploaded files
  10485760, -- 10MB file size limit
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PART 2: STORAGE RLS POLICIES
-- =====================================================

-- Enable RLS on storage.objects table for the patient-attachments bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can view patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "System can manage patient attachments" ON storage.objects;

-- Storage RLS policies - Allow authenticated users full access
CREATE POLICY "Users can view patient attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'patient-attachments' AND (
      auth.role() = 'authenticated' OR
      auth.uid() IS NOT NULL
    )
  );

CREATE POLICY "Users can upload patient attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'patient-attachments' AND (
      auth.role() = 'authenticated' OR
      auth.uid() IS NOT NULL
    )
  );

CREATE POLICY "Users can update patient attachments" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'patient-attachments' AND (
      auth.role() = 'authenticated' OR
      auth.uid() IS NOT NULL
    )
  );

CREATE POLICY "Users can delete patient attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'patient-attachments' AND (
      auth.role() = 'authenticated' OR
      auth.uid() IS NOT NULL
    )
  );

-- =====================================================
-- PART 3: GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions for storage
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Grant permissions to anon role for public access to attachments
GRANT USAGE ON SCHEMA storage TO anon;
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT ON storage.buckets TO anon;

-- =====================================================
-- PART 4: SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Storage Fix Applied Successfully!';
  RAISE NOTICE '- Storage bucket "patient-attachments" is ready';
  RAISE NOTICE '- RLS policies allow authenticated users to upload files';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now test the patient attachments upload functionality.';
END $$;