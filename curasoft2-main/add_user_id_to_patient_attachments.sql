-- SQL Script to Add user_id Column to patient_attachments Table
-- This script adds the missing user_id column while preserving existing data

-- ========================================
-- 1. ADD user_id COLUMN TO patient_attachments TABLE
-- ========================================

-- Add the user_id column with appropriate constraints
-- Set default to NULL initially, then populate with existing data
ALTER TABLE public.patient_attachments
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- ========================================
-- 2. POPULATE user_id WITH EXISTING DATA
-- ========================================

-- Copy data from uploaded_by to user_id for existing records
-- This preserves the existing data while adding the new column
UPDATE public.patient_attachments
SET user_id = uploaded_by
WHERE user_id IS NULL AND uploaded_by IS NOT NULL;

-- ========================================
-- 3. MAKE user_id NOT NULL (IF REQUIRED)
-- ========================================

-- After populating existing data, make user_id NOT NULL
-- Uncomment the following line if the application requires user_id to be NOT NULL:
-- ALTER TABLE public.patient_attachments ALTER COLUMN user_id SET NOT NULL;

-- ========================================
-- 4. UPDATE INDEXES (IF NEEDED)
-- ========================================

-- Add index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_patient_attachments_user_id
ON public.patient_attachments(user_id);

-- ========================================
-- 5. UPDATE RLS POLICIES (IF NEEDED)
-- ========================================

-- If you want to add policies based on user_id, uncomment and modify as needed:
-- Note: Existing policies should still work, but you may want to add user_id based policies

-- Example policy using user_id (uncomment if needed):
-- CREATE POLICY IF NOT EXISTS "Users can view their own attachments"
-- ON public.patient_attachments FOR SELECT
-- USING (user_id = auth.uid());

-- ========================================
-- 6. VERIFICATION QUERIES
-- ========================================

-- Verify the column was added and data was preserved
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'patient_attachments'
AND column_name = 'user_id';

-- Check that existing data was preserved
SELECT
    COUNT(*) as total_records,
    COUNT(user_id) as records_with_user_id,
    COUNT(uploaded_by) as records_with_uploaded_by
FROM public.patient_attachments;

-- Verify that user_id matches uploaded_by for existing records
SELECT
    COUNT(*) as matching_records
FROM public.patient_attachments
WHERE user_id = uploaded_by OR (user_id IS NULL AND uploaded_by IS NULL);

-- ========================================
-- 7. OPTIONAL: DROP uploaded_by COLUMN (AFTER TESTING)
-- ========================================

-- WARNING: Only run this after thoroughly testing that user_id works correctly
-- and you no longer need the uploaded_by column

-- DROP COLUMN IF EXISTS uploaded_by;

-- ========================================
-- 8. LOG COMPLETION
-- ========================================

-- Log that the migration completed successfully
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: user_id column added to patient_attachments table';
    RAISE NOTICE 'Existing data preserved and migrated from uploaded_by to user_id';
END $$;
