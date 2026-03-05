-- Migration: Create patient_insurance_debts table
-- Purpose: Track insurance debts on patient accounts

-- Create the patient_insurance_debts table
CREATE TABLE IF NOT EXISTS patient_insurance_debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    treatment_record_id UUID NOT NULL REFERENCES treatment_records(id) ON DELETE CASCADE,
    insurance_company_id UUID NOT NULL REFERENCES insurance_companies(id) ON DELETE RESTRICT,
    claim_id UUID REFERENCES treatment_insurance_link(id) ON DELETE SET NULL,
    original_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    remaining_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIAL', 'PAID', 'CANCELLED')),
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add timestamps trigger
CREATE TRIGGER update_patient_insurance_debts_updated_at 
    BEFORE UPDATE ON patient_insurance_debts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_insurance_debts_patient_id 
    ON patient_insurance_debts(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_debts_treatment_record_id 
    ON patient_insurance_debts(treatment_record_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_debts_insurance_company_id 
    ON patient_insurance_debts(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_debts_claim_id 
    ON patient_insurance_debts(claim_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_debts_status 
    ON patient_insurance_debts(status);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_debts_user_id 
    ON patient_insurance_debts(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_debts_clinic_id 
    ON patient_insurance_debts(clinic_id);

-- Enable RLS
ALTER TABLE patient_insurance_debts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "patient_insurance_debts_user_policy" ON patient_insurance_debts;
CREATE POLICY "patient_insurance_debts_user_policy" ON patient_insurance_debts
    FOR ALL USING (user_id = auth.uid());

-- Add clinic_id to treatment_insurance_link if not exists (for linking debts)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'treatment_insurance_link' AND column_name = 'debt_id'
    ) THEN
        ALTER TABLE treatment_insurance_link ADD COLUMN IF NOT EXISTS debt_id UUID REFERENCES patient_insurance_debts(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add paid_amount column to track partial payments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'treatment_insurance_link' AND column_name = 'paid_amount'
    ) THEN
        ALTER TABLE treatment_insurance_link ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;
    END IF;
END $$;

RAISE NOTICE 'Migration 045: patient_insurance_debts table created successfully';

