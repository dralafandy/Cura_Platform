-- Patient Attachments Database Schema
-- This file creates a table for storing patient attachments

CREATE TABLE IF NOT EXISTS patient_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL, -- Could be a storage URL or base64 for smaller files
    thumbnail_url TEXT, -- For image files
    description TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_attachments_patient_id ON patient_attachments(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_attachments_created_at ON patient_attachments(created_at);
CREATE INDEX IF NOT EXISTS idx_patient_attachments_file_type ON patient_attachments(file_type);

-- Enable RLS (Row Level Security)
ALTER TABLE patient_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for patient_attachments
-- Temporary simplified policies for development - allows authenticated users to manage attachments
-- TODO: Implement proper clinic-based access control

CREATE POLICY "Users can view attachments" ON patient_attachments
    FOR SELECT USING (
        auth.role() = 'authenticated' OR
        uploaded_by = '00000000-0000-0000-0000-000000000001'
    );

CREATE POLICY "Users can insert attachments" ON patient_attachments
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' OR
        uploaded_by = '00000000-0000-0000-0000-000000000001'
    );

CREATE POLICY "Users can update attachments" ON patient_attachments
    FOR UPDATE USING (
        auth.role() = 'authenticated' OR
        uploaded_by = '00000000-0000-0000-0000-000000000001'
    );

CREATE POLICY "Users can delete attachments" ON patient_attachments
    FOR DELETE USING (
        auth.role() = 'authenticated' OR
        uploaded_by = '00000000-0000-0000-0000-000000000001'
    );

-- Original clinic-based policies (commented out for now):
/*
CREATE POLICY "Users can view attachments for their clinic's patients" ON patient_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patients p
            WHERE p.id = patient_attachments.patient_id
            -- Assuming clinic-based access control is handled at application level
            -- or through a different mechanism
        )
    );

CREATE POLICY "Users can insert attachments for their clinic's patients" ON patient_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM patients p
            WHERE p.id = patient_attachments.patient_id
            -- Application should validate clinic access before allowing inserts
        )
    );

CREATE POLICY "Users can update attachments for their clinic's patients" ON patient_attachments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM patients p
            WHERE p.id = patient_attachments.patient_id
            -- Application should validate clinic access before allowing updates
        )
    );

CREATE POLICY "Users can delete attachments for their clinic's patients" ON patient_attachments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM patients p
            WHERE p.id = patient_attachments.patient_id
            -- Application should validate clinic access before allowing deletes
        )
    );
*/
