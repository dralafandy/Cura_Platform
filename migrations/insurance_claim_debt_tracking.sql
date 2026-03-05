-- Migration: Add patient debt tracking to insurance claims
-- This migration adds fields to track patient debt for insurance claims and enables
-- automatic addition to clinic/doctor accounts when claims are paid

-- Add new columns to treatment_insurance_link table
ALTER TABLE treatment_insurance_link ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;
ALTER TABLE treatment_insurance_link ADD COLUMN IF NOT EXISTS clinic_share NUMERIC(10,2) DEFAULT 0;
ALTER TABLE treatment_insurance_link ADD COLUMN IF NOT EXISTS doctor_share NUMERIC(10,2) DEFAULT 0;
ALTER TABLE treatment_insurance_link ADD COLUMN IF NOT EXISTS is_patient_debt BOOLEAN DEFAULT TRUE;
ALTER TABLE treatment_insurance_link ADD COLUMN IF NOT EXISTS paid_to_clinic BOOLEAN DEFAULT FALSE;
ALTER TABLE treatment_insurance_link ADD COLUMN IF NOT EXISTS paid_to_doctor BOOLEAN DEFAULT FALSE;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_link_patient_id ON treatment_insurance_link(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_link_is_patient_debt ON treatment_insurance_link(is_patient_debt);

-- Add comments to explain the new columns
COMMENT ON COLUMN treatment_insurance_link.patient_id IS 'Patient who received treatment - used to track insurance debt';
COMMENT ON COLUMN treatment_insurance_link.clinic_share IS 'Clinic portion of the claim amount';
COMMENT ON COLUMN treatment_insurance_link.doctor_share IS 'Doctor portion of the claim amount';
COMMENT ON COLUMN treatment_insurance_link.is_patient_debt IS 'Whether the claim amount is still owed by patient (until insurance pays)';
COMMENT ON COLUMN treatment_insurance_link.paid_to_clinic IS 'Whether clinic share has been paid to clinic account';
COMMENT ON COLUMN treatment_insurance_link.paid_to_doctor IS 'Whether doctor share has been paid to doctor account';

DO $$
BEGIN
    RAISE NOTICE 'Insurance claim debt tracking migration completed successfully!';
    RAISE NOTICE 'Added columns: patient_id, clinic_share, doctor_share, is_patient_debt, paid_to_clinic, paid_to_doctor';
END $$;
