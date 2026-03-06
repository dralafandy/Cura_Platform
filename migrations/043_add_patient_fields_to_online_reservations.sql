-- Add patient demographic fields required when converting online reservations into patients.

ALTER TABLE IF EXISTS online_reservations
  ADD COLUMN IF NOT EXISTS patient_dob DATE,
  ADD COLUMN IF NOT EXISTS patient_gender TEXT;
