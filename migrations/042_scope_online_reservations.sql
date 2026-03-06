-- Standalone-safe online reservations migration.
-- This can run even if the older unnumbered online reservation migration was never applied.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS working_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER DEFAULT 30,
  break_start TIME,
  break_end TIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT working_hours_day_unique UNIQUE (day_of_week)
);

INSERT INTO working_hours (day_of_week, start_time, end_time, slot_duration_minutes, is_active)
VALUES
  (0, '09:00', '18:00', 30, TRUE),
  (1, '09:00', '18:00', 30, TRUE),
  (2, '09:00', '18:00', 30, TRUE),
  (3, '09:00', '18:00', 30, TRUE),
  (4, '09:00', '18:00', 30, TRUE),
  (5, '09:00', '18:00', 30, TRUE),
  (6, '10:00', '14:00', 30, TRUE)
ON CONFLICT (day_of_week) DO NOTHING;

CREATE TABLE IF NOT EXISTS online_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT,
  preferred_dentist_id UUID REFERENCES dentists(id) ON DELETE SET NULL,
  service_id UUID REFERENCES treatment_definitions(id) ON DELETE SET NULL,
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  reason TEXT,
  status TEXT CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')) DEFAULT 'PENDING',
  admin_notes TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE IF EXISTS online_reservations
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES clinic_branches(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS appointments
  ADD COLUMN IF NOT EXISTS online_reservation_id UUID REFERENCES online_reservations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_online_reservations_status
  ON online_reservations(status);

CREATE INDEX IF NOT EXISTS idx_online_reservations_date
  ON online_reservations(requested_date);

CREATE INDEX IF NOT EXISTS idx_online_reservations_created_at
  ON online_reservations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_online_reservations_dentist
  ON online_reservations(preferred_dentist_id);

CREATE INDEX IF NOT EXISTS idx_online_reservations_clinic_id
  ON online_reservations(clinic_id);

CREATE INDEX IF NOT EXISTS idx_online_reservations_branch_id
  ON online_reservations(branch_id);

DROP TRIGGER IF EXISTS update_working_hours_updated_at ON working_hours;
CREATE TRIGGER update_working_hours_updated_at
BEFORE UPDATE ON working_hours
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_online_reservations_updated_at ON online_reservations;
CREATE TRIGGER update_online_reservations_updated_at
BEFORE UPDATE ON online_reservations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
