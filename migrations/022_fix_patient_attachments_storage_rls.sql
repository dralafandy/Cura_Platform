-- ============================================================================
-- 022_fix_patient_attachments_storage_rls.sql
-- Purpose: Ensure patient attachment uploads to Supabase Storage are allowed
-- for authenticated users under RLS.
-- ============================================================================

BEGIN;

-- Ensure bucket exists with expected settings.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-attachments',
  'patient-attachments',
  true,
  10485760,
  ARRAY['image/*', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- NOTE:
-- We intentionally avoid ALTER TABLE / GRANT on storage.objects here because
-- those commands require table ownership on managed Supabase storage tables.
-- Supabase storage already has RLS enabled; policy changes below are sufficient.

DROP POLICY IF EXISTS "Users can view patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "System can manage patient attachments" ON storage.objects;
DROP POLICY IF EXISTS "curasoft_patient_attachments_read" ON storage.objects;
DROP POLICY IF EXISTS "curasoft_patient_attachments_insert" ON storage.objects;
DROP POLICY IF EXISTS "curasoft_patient_attachments_update" ON storage.objects;
DROP POLICY IF EXISTS "curasoft_patient_attachments_delete" ON storage.objects;

CREATE POLICY "curasoft_patient_attachments_read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'patient-attachments');

CREATE POLICY "curasoft_patient_attachments_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'patient-attachments'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "curasoft_patient_attachments_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'patient-attachments'
  AND owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'patient-attachments'
  AND owner = auth.uid()
);

CREATE POLICY "curasoft_patient_attachments_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'patient-attachments'
  AND owner = auth.uid()
);

COMMIT;

SELECT 'Storage RLS policy fix applied for patient-attachments bucket.' AS status;
