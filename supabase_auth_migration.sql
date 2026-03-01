-- ============================================================================
-- SUPABASE AUTH MIGRATION
-- This converts your app from custom auth to Supabase Auth
-- Enables true clinic-based data isolation with RLS
-- ============================================================================

-- ============================================================================
-- STEP 1: Add auth_id column to link user_profiles to Supabase Auth users
-- ============================================================================

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_id ON user_profiles(auth_id);

-- ============================================================================
-- STEP 2: Create function to handle new user signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user profile already exists with this email
  INSERT INTO public.user_profiles (id, username, email, role, status, created_at)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'DOCTOR'),
    'ACTIVE',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Create trigger for new user signup
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 4: Create function to get current user's profile
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(
  id UUID,
  username TEXT,
  email TEXT,
  role TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.username,
    up.email,
    up.role::TEXT,
    up.status::TEXT
  FROM public.user_profiles up
  WHERE up.auth_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;

-- ============================================================================
-- STEP 5: Create function to get user's accessible clinics (for RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_clinics()
RETURNS TABLE(clinic_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT uc.clinic_id
  FROM public.user_clinics uc
  WHERE uc.user_id = (
    SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()
  )
  AND uc.access_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_clinics() TO authenticated;

-- ============================================================================
-- STEP 6: Update RLS policies for clinic isolation
-- ============================================================================

-- Patients - Only see patients in user's clinics
DROP POLICY IF EXISTS "patients_clinic_isolation" ON patients;
CREATE POLICY "patients_clinic_isolation" ON patients
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM public.get_user_clinics())
        OR clinic_id IS NULL
    );

-- Patient Attachments
DROP POLICY IF EXISTS "patient_attachments_clinic_isolation" ON patient_attachments;
CREATE POLICY "patient_attachments_clinic_isolation" ON patient_attachments
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM public.get_user_clinics())
        OR clinic_id IS NULL
    );

-- Appointments
DROP POLICY IF EXISTS "appointments_clinic_isolation" ON appointments;
CREATE POLICY "appointments_clinic_isolation" ON appointments
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM public.get_user_clinics())
        OR clinic_id IS NULL
    );

-- Treatment Records
DROP POLICY IF EXISTS "treatment_records_clinic_isolation" ON treatment_records;
CREATE POLICY "treatment_records_clinic_isolation" ON treatment_records
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM public.get_user_clinics())
        OR clinic_id IS NULL
    );

-- Payments
DROP POLICY IF EXISTS "payments_clinic_isolation" ON payments;
CREATE POLICY "payments_clinic_isolation" ON payments
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM public.get_user_clinics())
        OR clinic_id IS NULL
    );

-- Expenses
DROP POLICY IF EXISTS "expenses_clinic_isolation" ON expenses;
CREATE POLICY "expenses_clinic_isolation" ON expenses
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM public.get_user_clinics())
        OR clinic_id IS NULL
    );

-- Suppliers
DROP POLICY IF EXISTS "suppliers_clinic_isolation" ON suppliers;
CREATE POLICY "suppliers_clinic_isolation" ON suppliers
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM public.get_user_clinics())
        OR clinic_id IS NULL
    );

-- Supplier Invoices
DROP POLICY IF EXISTS "supplier_invoices_clinic_isolation" ON supplier_invoices;
CREATE POLICY "supplier_invoices_clinic_isolation" ON supplier_invoices
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM public.get_user_clinics())
        OR clinic_id IS NULL
    );

-- Inventory Items
DROP POLICY IF EXISTS "inventory_items_clinic_isolation" ON inventory_items;
CREATE POLICY "inventory_items_clinic_isolation" ON inventory_items
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM public.get_user_clinics())
        OR clinic_id IS NULL
    );

-- Treatment Definitions
DROP POLICY IF EXISTS "treatment_definitions_clinic_isolation" ON treatment_definitions;
CREATE POLICY "treatment_definitions_clinic_isolation" ON treatment_definitions
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM public.get_user_clinics())
        OR clinic_id IS NULL
    );

-- Dentists
DROP POLICY IF EXISTS "dentists_clinic_isolation" ON dentists;
CREATE POLICY "dentists_clinic_isolation" ON dentists
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM public.get_user_clinics())
        OR clinic_id IS NULL
    );

-- Lab Cases
DROP POLICY IF EXISTS "lab_cases_clinic_isolation" ON lab_cases;
CREATE POLICY "lab_cases_clinic_isolation" ON lab_cases
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM public.get_user_clinics())
        OR clinic_id IS NULL
    );

-- Prescriptions
DROP POLICY IF EXISTS "prescriptions_clinic_isolation" ON prescriptions;
CREATE POLICY "prescriptions_clinic_isolation" ON prescriptions
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM public.get_user_clinics())
        OR clinic_id IS NULL
    );

-- Employees
DROP POLICY IF EXISTS "employees_clinic_isolation" ON employees;
CREATE POLICY "employees_clinic_isolation" ON employees
    FOR ALL USING (
        clinic_id IN (SELECT clinic_id FROM public.get_user_clinics())
        OR clinic_id IS NULL
    );

-- ============================================================================
-- STEP 7: Grant permissions
-- ============================================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- SUCCESS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================================';
    RAISE NOTICE 'SUPABASE AUTH MIGRATION COMPLETE!';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'What was done:';
    RAISE NOTICE '1. Added auth_id column to user_profiles';
    RAISE NOTICE '2. Created trigger to auto-create profiles on signup';
    RAISE NOTICE '3. Created helper functions for RLS';
    RAISE NOTICE '4. Updated RLS policies for clinic isolation';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Run the frontend migration (update LoginPage & AuthContext)';
    RAISE NOTICE '2. Link existing users to Supabase Auth accounts';
    RAISE NOTICE '========================================================';
END $$;
