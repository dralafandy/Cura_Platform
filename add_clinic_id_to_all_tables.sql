-- ============================================================================
-- Add clinic_id to tables that are missing it
-- Run this BEFORE running secure_rls_policies.sql
-- ============================================================================

-- Check if clinic_id exists in treatment_doctor_percentages, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'treatment_doctor_percentages' AND column_name = 'clinic_id') THEN
        ALTER TABLE treatment_doctor_percentages ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_treatment_doctor_percentages_clinic_id ON treatment_doctor_percentages(clinic_id);
    END IF;
END $$;

-- Check if clinic_id exists in prescription_items, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescription_items' AND column_name = 'clinic_id') THEN
        ALTER TABLE prescription_items ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_prescription_items_clinic_id ON prescription_items(clinic_id);
    END IF;
END $$;

-- Check if clinic_id exists in prescriptions, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'clinic_id') THEN
        ALTER TABLE prescriptions ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic_id ON prescriptions(clinic_id);
    END IF;
END $$;

-- Check if clinic_id exists in lab_cases, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_cases' AND column_name = 'clinic_id') THEN
        ALTER TABLE lab_cases ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_lab_cases_clinic_id ON lab_cases(clinic_id);
    END IF;
END $$;

-- Check if clinic_id exists in employee_attendance, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_attendance' AND column_name = 'clinic_id') THEN
        ALTER TABLE employee_attendance ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_employee_attendance_clinic_id ON employee_attendance(clinic_id);
    END IF;
END $$;

-- Check if clinic_id exists in employee_compensations, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employee_compensations' AND column_name = 'clinic_id') THEN
        ALTER TABLE employee_compensations ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_employee_compensations_clinic_id ON employee_compensations(clinic_id);
    END IF;
END $$;

-- Check if clinic_id exists in insurance_transactions, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'insurance_transactions' AND column_name = 'clinic_id') THEN
        ALTER TABLE insurance_transactions ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_insurance_transactions_clinic_id ON insurance_transactions(clinic_id);
    END IF;
END $$;

-- Check if clinic_id exists in doctor_payments, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctor_payments' AND column_name = 'clinic_id') THEN
        ALTER TABLE doctor_payments ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_doctor_payments_clinic_id ON doctor_payments(clinic_id);
    END IF;
END $$;

-- Final notice
SELECT 'Added clinic_id columns to all missing tables!' AS notice;
