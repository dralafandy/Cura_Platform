-- Fix RLS policy for insurance_companies to use clinic-based isolation
-- This addresses the "new row violates row-level security policy" error

-- ============================================================================
-- Step 0: Ensure the get_user_clinic_ids function exists (required for RLS)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_clinic_ids(p_user_id UUID)
RETURNS TABLE(clinic_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT uc.clinic_id
    FROM user_clinics uc
    WHERE uc.user_id = p_user_id
    AND uc.access_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also create a version that uses auth.uid() directly for simpler policies
CREATE OR REPLACE FUNCTION get_user_clinic_ids()
RETURNS TABLE(clinic_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT uc.clinic_id
    FROM user_clinics uc
    WHERE uc.user_id = auth.uid()
    AND uc.access_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Step 1: Add clinic_id column if it doesn't exist
-- ============================================================================
ALTER TABLE insurance_companies ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_insurance_companies_clinic_id ON insurance_companies(clinic_id);

-- ============================================================================
-- Step 2: Enable RLS on insurance_companies if not already enabled
-- ============================================================================
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Step 3: Create proper RLS policy using clinic isolation
-- Uses the same pattern as other clinic-isolated tables (patients, treatment_records, etc.)
-- ============================================================================
DROP POLICY IF EXISTS "insurance_companies_clinic_isolation" ON insurance_companies;
CREATE POLICY "insurance_companies_clinic_isolation" ON insurance_companies
    FOR ALL
    USING (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    )
    WITH CHECK (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    );

-- Also create a fallback policy for user_id-based access (for backwards compatibility)
-- This ensures users can still access records they own directly
DROP POLICY IF EXISTS "insurance_companies_user_access" ON insurance_companies;
CREATE POLICY "insurance_companies_user_access" ON insurance_companies
    FOR ALL
    USING (user_id = auth.uid());

-- ============================================================================
-- Step 4: Ensure insurance_related tables also have proper clinic_id and RLS
-- ============================================================================

-- Insurance Accounts
ALTER TABLE insurance_accounts ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_insurance_accounts_clinic_id ON insurance_accounts(clinic_id);
ALTER TABLE insurance_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insurance_accounts_clinic_isolation" ON insurance_accounts;
CREATE POLICY "insurance_accounts_clinic_isolation" ON insurance_accounts
    FOR ALL
    USING (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    )
    WITH CHECK (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    );

-- Patient Insurance Link
ALTER TABLE patient_insurance_link ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_patient_insurance_link_clinic_id ON patient_insurance_link(clinic_id);
ALTER TABLE patient_insurance_link ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patient_insurance_link_clinic_isolation" ON patient_insurance_link;
CREATE POLICY "patient_insurance_link_clinic_isolation" ON patient_insurance_link
    FOR ALL
    USING (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    )
    WITH CHECK (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    );

-- Treatment Insurance Link
ALTER TABLE treatment_insurance_link ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_treatment_insurance_link_clinic_id ON treatment_insurance_link(clinic_id);
ALTER TABLE treatment_insurance_link ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "treatment_insurance_link_clinic_isolation" ON treatment_insurance_link;
CREATE POLICY "treatment_insurance_link_clinic_isolation" ON treatment_insurance_link
    FOR ALL
    USING (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    )
    WITH CHECK (
        clinic_id IN (SELECT clinic_id FROM get_user_clinic_ids(auth.uid()))
        OR clinic_id IS NULL
    );

-- ============================================================================
-- Step 5: Update existing records to have clinic_id based on user_clinics
-- This ensures existing insurance companies are accessible
-- ============================================================================
UPDATE insurance_companies 
SET clinic_id = (
    SELECT uc.clinic_id 
    FROM user_clinics uc 
    WHERE uc.user_id = insurance_companies.user_id 
    AND uc.access_active = true 
    LIMIT 1
)
WHERE clinic_id IS NULL 
AND user_id IS NOT NULL;

UPDATE insurance_accounts 
SET clinic_id = (
    SELECT ic.clinic_id 
    FROM insurance_companies ic 
    WHERE ic.id = insurance_accounts.insurance_company_id
)
WHERE clinic_id IS NULL;

UPDATE patient_insurance_link 
SET clinic_id = (
    SELECT p.clinic_id 
    FROM patients p 
    WHERE p.id = patient_insurance_link.patient_id
)
WHERE clinic_id IS NULL;

UPDATE treatment_insurance_link 
SET clinic_id = (
    SELECT tr.clinic_id 
    FROM treatment_records tr 
    WHERE tr.id = treatment_insurance_link.treatment_record_id
)
WHERE clinic_id IS NULL;

-- ============================================================================
-- Step 6: Grant permissions (for service role or admin)
-- ============================================================================
GRANT ALL ON insurance_companies TO service_role;
GRANT ALL ON insurance_accounts TO service_role;
GRANT ALL ON patient_insurance_link TO service_role;
GRANT ALL ON treatment_insurance_link TO service_role;

-- ============================================================================
-- Verification: Check current policies
-- ============================================================================
SELECT 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename IN ('insurance_companies', 'insurance_accounts', 'patient_insurance_link', 'treatment_insurance_link')
ORDER BY tablename, policyname;
