-- Supplier Invoice Attachments System Setup Script
-- This script creates a separate table for supplier invoice attachments
-- Based on the new column names provided: supplier_id, invoice_number, invoice_date, invoice_image_url, user_id

-- =====================================================
-- CREATE SUPPLIER INVOICE ATTACHMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.supplier_invoice_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_invoice_id UUID NOT NULL REFERENCES public.supplier_invoices(id) ON DELETE CASCADE,
    filename TEXT,
    original_filename TEXT,
    file_type TEXT,
    file_size BIGINT DEFAULT 0,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    uploaded_by UUID,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Ensure legacy DBs that already created the table without the invoice FK/column
-- get the required column and foreign-key. These operations are idempotent.
ALTER TABLE public.supplier_invoice_attachments
        ADD COLUMN IF NOT EXISTS supplier_invoice_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.supplier_invoice_attachments'::regclass
            AND contype = 'f'
            AND conname = 'fk_supplier_invoice_attachments_supplier_invoice_id'
    ) THEN
        BEGIN
            ALTER TABLE public.supplier_invoice_attachments
                ADD CONSTRAINT fk_supplier_invoice_attachments_supplier_invoice_id
                FOREIGN KEY (supplier_invoice_id) REFERENCES public.supplier_invoices(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL; END;
    END IF;
END $$;

-- Ensure all expected columns exist (idempotent). Do not add NOT NULL constraints here
-- because existing rows may violate them; add columns without constraints so migration is safe.
ALTER TABLE public.supplier_invoice_attachments
    ADD COLUMN IF NOT EXISTS filename TEXT,
    ADD COLUMN IF NOT EXISTS original_filename TEXT,
    ADD COLUMN IF NOT EXISTS file_type TEXT,
    ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS file_url TEXT,
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS uploaded_by UUID,
    ADD COLUMN IF NOT EXISTS user_id UUID,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_supplier_invoice_attachments_supplier_invoice_id ON public.supplier_invoice_attachments(supplier_invoice_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoice_attachments_uploaded_by ON public.supplier_invoice_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_supplier_invoice_attachments_user_id ON public.supplier_invoice_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoice_attachments_created_at ON public.supplier_invoice_attachments(created_at);

-- =====================================================
-- DATABASE RLS POLICIES
-- =====================================================

-- Enable RLS on supplier_invoice_attachments table
ALTER TABLE public.supplier_invoice_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view supplier invoice attachments" ON public.supplier_invoice_attachments;
DROP POLICY IF EXISTS "Users can insert supplier invoice attachments" ON public.supplier_invoice_attachments;
DROP POLICY IF EXISTS "Users can update supplier invoice attachments" ON public.supplier_invoice_attachments;
DROP POLICY IF EXISTS "Users can delete supplier invoice attachments" ON public.supplier_invoice_attachments;

-- Create RLS policies for supplier_invoice_attachments table
CREATE POLICY "Users can view supplier invoice attachments" ON public.supplier_invoice_attachments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert supplier invoice attachments" ON public.supplier_invoice_attachments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update supplier invoice attachments" ON public.supplier_invoice_attachments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete supplier invoice attachments" ON public.supplier_invoice_attachments
    FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users for supplier_invoice_attachments table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_invoice_attachments TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

-- Display success message
DO $$
BEGIN
  RAISE NOTICE 'Supplier Invoice Attachments System Setup Complete!';
  RAISE NOTICE '- Supplier invoice attachments table created with RLS policies';
  RAISE NOTICE '- Indexes created for performance';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now manage supplier invoice attachments separately.';
END $$;
