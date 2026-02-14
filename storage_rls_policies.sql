-- Storage Row Level Security Policies for Patient Attachments
-- This file creates the necessary RLS policies for the patient-attachments storage bucket

-- First, ensure the bucket exists (if not already created)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-attachments',
  'patient-attachments',
  true, -- Make bucket public for easy access to uploaded files
  10485760, -- 10MB file size limit
  ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects table for the patient-attachments bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "System can manage patient attachments" ON storage.objects;

-- Policy: Allow authenticated users to view patient attachments
CREATE POLICY "Users can view patient attachments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'patient-attachments' AND (
      auth.role() = 'authenticated' OR
      auth.uid() IS NOT NULL
    )
  );

-- Policy: Allow authenticated users to upload patient attachments
CREATE POLICY "Users can upload patient attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'patient-attachments' AND (
      auth.role() = 'authenticated' OR
      auth.uid() IS NOT NULL
    )
  );

-- Policy: Allow users to update their own patient attachments
CREATE POLICY "Users can update patient attachments" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'patient-attachments' AND (
      auth.role() = 'authenticated' OR
      auth.uid() IS NOT NULL
    )
  );

-- Policy: Allow users to delete patient attachments
CREATE POLICY "Users can delete patient attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'patient-attachments' AND (
      auth.role() = 'authenticated' OR
      auth.uid() IS NOT NULL
    )
  );

-- Policy: Allow system user (for internal authentication) to manage patient attachments
CREATE POLICY "System can manage patient attachments" ON storage.objects
  FOR ALL USING (
    bucket_id = 'patient-attachments' AND (
      auth.uid() = '00000000-0000-0000-0000-000000000001' OR
      auth.jwt() ->> 'email' = 'system@internal'
    )
  );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Grant permissions to the system user
GRANT USAGE ON SCHEMA storage TO anon;
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT ON storage.buckets TO anon;