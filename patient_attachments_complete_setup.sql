-- Complete Patient Attachments System Setup Script
-- This script sets up everything needed for the patient attachments system to work

-- =====================================================
-- PART 1: CREATE SYSTEM USER (if not exists)
-- =====================================================

-- Insert system user for internal authentication (into public.users table)
INSERT INTO public.users (id, email, created_at, updated_at) 
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'system@internal',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert system user profile
INSERT INTO public.user_profiles (
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

-- =====================================================
-- PART 2: CREATE PATIENT ATTACHMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.patient_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    uploaded_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_attachments_patient_id ON public.patient_attachments(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_attachments_created_at ON public.patient_attachments(created_at);
CREATE INDEX IF NOT EXISTS idx_patient_attachments_file_type ON public.patient_attachments(file_type);

-- =====================================================
-- PART 3: DATABASE RLS POLICIES
-- =====================================================

-- Enable RLS on patient_attachments table
ALTER TABLE public.patient_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view attachments" ON public.patient_attachments;
DROP POLICY IF EXISTS "Users can insert attachments" ON public.patient_attachments;
DROP POLICY IF EXISTS "Users can update attachments" ON public.patient_attachments;
DROP POLICY IF EXISTS "Users can delete attachments" ON public.patient_attachments;

-- Create RLS policies for patient_attachments table
CREATE POLICY "Users can view attachments" ON public.patient_attachments
    FOR SELECT USING (
        auth.role() = 'authenticated' OR
        uploaded_by = '00000000-0000-0000-0000-000000000001'
    );

CREATE POLICY "Users can insert attachments" ON public.patient_attachments
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' OR
        uploaded_by = '00000000-0000-0000-0000-000000000001'
    );

CREATE POLICY "Users can update attachments" ON public.patient_attachments
    FOR UPDATE USING (
        auth.role() = 'authenticated' OR
        uploaded_by = '00000000-0000-0000-0000-000000000001'
    );

CREATE POLICY "Users can delete attachments" ON public.patient_attachments
    FOR DELETE USING (
        auth.role() = 'authenticated' OR
        uploaded_by = '00000000-0000-0000-0000-000000000001'
    );

-- =====================================================
-- PART 4: STORAGE BUCKET AND POLICIES
-- =====================================================

-- Create patient-attachments storage bucket
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

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can view patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "System can manage patient attachments" ON storage.objects;

-- Storage RLS policies
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

CREATE POLICY "System can manage patient attachments" ON storage.objects
  FOR ALL USING (
    bucket_id = 'patient-attachments' AND (
      auth.uid() = '00000000-0000-0000-0000-000000000001' OR
      auth.jwt() ->> 'email' = 'system@internal'
    )
  );

-- =====================================================
-- PART 5: GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users for patient_attachments table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_attachments TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant necessary permissions for storage
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Grant permissions to anon role for public access to attachments
GRANT USAGE ON SCHEMA storage TO anon;
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT ON storage.buckets TO anon;

-- =====================================================
-- PART 6: TRIGGERS FOR AUTOMATIC SYSTEM USER ASSIGNMENT
-- =====================================================

-- Function to automatically assign system user for internal uploads
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
DROP TRIGGER IF EXISTS trigger_handle_internal_user_attachments ON public.patient_attachments;
CREATE TRIGGER trigger_handle_internal_user_attachments
  BEFORE INSERT ON public.patient_attachments
  FOR EACH ROW
  EXECUTE FUNCTION handle_internal_user_attachments();

-- =====================================================
-- PART 7: SUCCESS MESSAGE
-- =====================================================

-- Display success message
DO $$
BEGIN
  RAISE NOTICE 'Patient Attachments System Setup Complete!';
  RAISE NOTICE '- Patient attachments table created with RLS policies';
  RAISE NOTICE '- Storage bucket "patient-attachments" created with public access';
  RAISE NOTICE '- Storage RLS policies configured for authenticated users';
  RAISE NOTICE '- System user configured for internal authentication';
  RAISE NOTICE '- Triggers set up for automatic user assignment';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now upload patient attachments without errors.';
END $$;