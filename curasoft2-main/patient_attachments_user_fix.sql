-- Patient Attachments System - Database Schema (User-Permitted Operations Only)
-- This script contains only operations that regular Supabase users can execute

-- ========================================
-- 1. CREATE PATIENT ATTACHMENTS TABLE
-- ========================================

-- Create patient_attachments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.patient_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- ========================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ========================================

-- Enable RLS on the table
ALTER TABLE public.patient_attachments ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. CREATE RLS POLICIES (User-Permitted)
-- ========================================

-- Policy: Users can view their clinic's patient attachments
CREATE POLICY IF NOT EXISTS "Users can view clinic patient attachments"
ON public.patient_attachments FOR SELECT
USING (
    patient_id IN (
        SELECT id FROM public.patients 
        WHERE clinic_id = (
            SELECT clinic_id FROM auth.users 
            WHERE id = auth.uid()
        )
    )
);

-- Policy: Users can insert attachments for their clinic's patients
CREATE POLICY IF NOT EXISTS "Users can insert clinic patient attachments"
ON public.patient_attachments FOR INSERT
WITH CHECK (
    patient_id IN (
        SELECT id FROM public.patients 
        WHERE clinic_id = (
            SELECT clinic_id FROM auth.users 
            WHERE id = auth.uid()
        )
    )
);

-- Policy: Users can update attachments for their clinic's patients
CREATE POLICY IF NOT EXISTS "Users can update clinic patient attachments"
ON public.patient_attachments FOR UPDATE
USING (
    patient_id IN (
        SELECT id FROM public.patients 
        WHERE clinic_id = (
            SELECT clinic_id FROM auth.users 
            WHERE id = auth.uid()
        )
    )
)
WITH CHECK (
    patient_id IN (
        SELECT id FROM public.patients 
        WHERE clinic_id = (
            SELECT clinic_id FROM auth.users 
            WHERE id = auth.uid()
        )
    )
);

-- Policy: Users can delete attachments for their clinic's patients
CREATE POLICY IF NOT EXISTS "Users can delete clinic patient attachments"
ON public.patient_attachments FOR DELETE
USING (
    patient_id IN (
        SELECT id FROM public.patients 
        WHERE clinic_id = (
            SELECT clinic_id FROM auth.users 
            WHERE id = auth.uid()
        )
    )
);

-- ========================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Index for patient_id lookups
CREATE INDEX IF NOT EXISTS idx_patient_attachments_patient_id 
ON public.patient_attachments(patient_id);

-- Index for uploaded_by lookups
CREATE INDEX IF NOT EXISTS idx_patient_attachments_uploaded_by 
ON public.patient_attachments(uploaded_by);

-- Index for file_path lookups
CREATE INDEX IF NOT EXISTS idx_patient_attachments_file_path 
ON public.patient_attachments(file_path);

-- ========================================
-- 5. CREATE TRIGGERS FOR UPDATED_AT
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_patient_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_patient_attachments_updated_at ON public.patient_attachments;
CREATE TRIGGER update_patient_attachments_updated_at
    BEFORE UPDATE ON public.patient_attachments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_patient_attachments_updated_at();

-- ========================================
-- 6. ADD COMMENTS FOR DOCUMENTATION
-- ========================================

COMMENT ON TABLE public.patient_attachments IS 'Stores file attachments for patients';
COMMENT ON COLUMN public.patient_attachments.id IS 'Unique identifier for the attachment';
COMMENT ON COLUMN public.patient_attachments.patient_id IS 'Reference to the patient';
COMMENT ON COLUMN public.patient_attachments.file_name IS 'Original name of the uploaded file';
COMMENT ON COLUMN public.patient_attachments.file_path IS 'Storage path in Supabase storage';
COMMENT ON COLUMN public.patient_attachments.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.patient_attachments.file_type IS 'MIME type of the file';
COMMENT ON COLUMN public.patient_attachments.uploaded_by IS 'User who uploaded the file';
COMMENT ON COLUMN public.patient_attachments.uploaded_at IS 'When the file was uploaded';
COMMENT ON COLUMN public.patient_attachments.updated_at IS 'When the record was last updated';
COMMENT ON COLUMN public.patient_attachments.is_deleted IS 'Soft delete flag';

-- ========================================
-- 7. VERIFICATION QUERY
-- ========================================

-- Verify table creation
SELECT 
    table_name,
    table_type,
    has_inserts,
    has_selects,
    has_updates,
    has_deletes
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'patient_attachments';