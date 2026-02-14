-- Drop existing table if it exists
DROP TABLE IF EXISTS doctor_payments CASCADE;

CREATE TABLE doctor_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dentist_id UUID NOT NULL REFERENCES dentists(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE doctor_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own doctor payments" ON doctor_payments
  FOR SELECT USING (auth.uid() = (SELECT user_id FROM dentists WHERE id = dentist_id));

CREATE POLICY "Users can insert their own doctor payments" ON doctor_payments
  FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM dentists WHERE id = dentist_id));

CREATE POLICY "Users can update their own doctor payments" ON doctor_payments
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM dentists WHERE id = dentist_id));

CREATE POLICY "Users can delete their own doctor payments" ON doctor_payments
  FOR DELETE USING (auth.uid() = (SELECT user_id FROM dentists WHERE id = dentist_id));
