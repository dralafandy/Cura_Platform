-- Add doctor-specific treatment percentage overrides
-- This keeps default treatment percentages as fallback and allows admin to override per doctor.

CREATE TABLE IF NOT EXISTS treatment_doctor_percentages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treatment_definition_id UUID NOT NULL REFERENCES treatment_definitions(id) ON DELETE CASCADE,
    dentist_id UUID NOT NULL REFERENCES dentists(id) ON DELETE CASCADE,
    doctor_percentage NUMERIC(5,4) NOT NULL DEFAULT 0.50,
    clinic_percentage NUMERIC(5,4) NOT NULL DEFAULT 0.50,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_treatment_doctor_percentages UNIQUE (treatment_definition_id, dentist_id, user_id),
    CONSTRAINT chk_treatment_doctor_percentages_sum CHECK (
        doctor_percentage >= 0 AND doctor_percentage <= 1 AND
        clinic_percentage >= 0 AND clinic_percentage <= 1 AND
        abs((doctor_percentage + clinic_percentage) - 1) < 0.0001
    )
);

CREATE INDEX IF NOT EXISTS idx_treatment_doctor_percentages_user_id
    ON treatment_doctor_percentages(user_id);

CREATE INDEX IF NOT EXISTS idx_treatment_doctor_percentages_treatment_definition_id
    ON treatment_doctor_percentages(treatment_definition_id);

CREATE INDEX IF NOT EXISTS idx_treatment_doctor_percentages_dentist_id
    ON treatment_doctor_percentages(dentist_id);
