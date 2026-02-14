-- Online Reservation System Migration
-- This script creates the necessary tables for the public booking feature

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS online_reservations CASCADE;
DROP TABLE IF EXISTS working_hours CASCADE;

-- Working Hours Table - Stores clinic operating hours and slot configurations
CREATE TABLE working_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INTEGER DEFAULT 30,
    break_start TIME,
    break_end TIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(day_of_week)
);

-- Insert default working hours (can be customized in Settings)
INSERT INTO working_hours (day_of_week, start_time, end_time, slot_duration_minutes, is_active) VALUES
(0, '09:00', '18:00', 30, TRUE), -- Sunday
(1, '09:00', '18:00', 30, TRUE), -- Monday
(2, '09:00', '18:00', 30, TRUE), -- Tuesday
(3, '09:00', '18:00', 30, TRUE), -- Wednesday
(4, '09:00', '18:00', 30, TRUE), -- Thursday
(5, '09:00', '18:00', 30, TRUE), -- Friday
(6, '10:00', '14:00', 30, TRUE); -- Saturday

-- Online Reservations Table - Stores public booking requests
CREATE TABLE online_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Create indexes for efficient querying
CREATE INDEX idx_online_reservations_status ON online_reservations(status);
CREATE INDEX idx_online_reservations_date ON online_reservations(requested_date);
CREATE INDEX idx_online_reservations_created_at ON online_reservations(created_at DESC);
CREATE INDEX idx_online_reservations_dentist ON online_reservations(preferred_dentist_id);

-- Add foreign key constraint for appointments linking to online reservations
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS online_reservation_id UUID REFERENCES online_reservations(id) ON DELETE SET NULL;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for auto-updating timestamps
CREATE TRIGGER update_working_hours_updated_at
    BEFORE UPDATE ON working_hours
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_online_reservations_updated_at
    BEFORE UPDATE ON online_reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE online_reservations ENABLE ROW LEVEL SECURITY;
