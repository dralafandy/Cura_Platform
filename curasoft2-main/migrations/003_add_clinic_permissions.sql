-- ============================================================================
-- Migration: Add Clinic-Scoped Permissions
-- 
-- This migration:
-- 1. Adds new permission types for clinic management
-- 2. Creates views for clinic-scoped data access
-- 3. Adds helper functions for permission checking
-- 4. Updates existing permissions to include clinic context
-- ============================================================================

-- ============================================================================
-- STEP 1: Add New Permission Types to Enum
-- ============================================================================

-- Note: PostgreSQL doesn't allow adding values to existing enums easily
-- We'll create a new enum and migrate, or use a text-based approach
-- For this migration, we'll add clinic permissions as text in the permissions array

-- ============================================================================
-- STEP 2: Create Views for Clinic-Scoped Data Access
-- ============================================================================

-- View: User's accessible clinics with permissions
CREATE OR REPLACE VIEW user_clinics_view AS
SELECT 
    uca.user_id,
    c.id AS clinic_id,
    c.name AS clinic_name,
    c.code AS clinic_code,
    c.logo_url AS clinic_logo,
    c.status AS clinic_status,
    cb.id AS branch_id,
    cb.name AS branch_name,
    cb.code AS branch_code,
    cb.is_main_branch,
    uca.role_at_clinic,
    uca.is_default,
    uca.is_active AS access_active,
    uca.custom_permissions
FROM user_clinic_access uca
JOIN clinics c ON uca.clinic_id = c.id
LEFT JOIN clinic_branches cb ON uca.branch_id = cb.id
WHERE uca.is_active = TRUE AND c.status = 'ACTIVE';

-- View: Clinic summary with user count
CREATE OR REPLACE VIEW clinic_summary_view AS
SELECT 
    c.id,
    c.name,
    c.code,
    c.status,
    c.city,
    c.country,
    c.logo_url,
    c.primary_color,
    c.created_at,
    COUNT(DISTINCT uca.user_id) AS user_count,
    COUNT(DISTINCT cb.id) AS branch_count
FROM clinics c
LEFT JOIN user_clinic_access uca ON c.id = uca.clinic_id AND uca.is_active = TRUE
LEFT JOIN clinic_branches cb ON c.id = cb.clinic_id AND cb.is_active = TRUE
GROUP BY c.id, c.name, c.code, c.status, c.city, c.country, c.logo_url, c.primary_color, c.created_at;

-- View: Branch summary with user count
CREATE OR REPLACE VIEW branch_summary_view AS
SELECT 
    cb.id,
    cb.name,
    cb.code,
    cb.clinic_id,
    c.name AS clinic_name,
    cb.branch_type,
    cb.is_main_branch,
    cb.is_active,
    cb.city,
    cb.country,
    cb.operating_hours,
    cb.created_at,
    COUNT(DISTINCT uca.user_id) AS user_count
FROM clinic_branches cb
JOIN clinics c ON cb.clinic_id = c.id
LEFT JOIN user_clinic_access uca ON cb.id = uca.branch_id AND uca.is_active = TRUE
GROUP BY cb.id, cb.name, cb.code, cb.clinic_id, c.name, cb.branch_type, cb.is_main_branch, cb.is_active, cb.city, cb.country, cb.operating_hours, cb.created_at;

-- ============================================================================
-- STEP 3: Create Helper Functions
-- ============================================================================

-- Function: Check if user has access to a specific clinic
CREATE OR REPLACE FUNCTION user_has_clinic_access(
    p_user_id UUID,
    p_clinic_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_clinic_access
        WHERE user_id = p_user_id
        AND clinic_id = p_clinic_id
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user has access to a specific branch
CREATE OR REPLACE FUNCTION user_has_branch_access(
    p_user_id UUID,
    p_branch_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_clinic_access
        WHERE user_id = p_user_id
        AND branch_id = p_branch_id
        AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's default clinic
CREATE OR REPLACE FUNCTION get_user_default_clinic(
    p_user_id UUID
) RETURNS TABLE (
    clinic_id UUID,
    clinic_name VARCHAR,
    branch_id UUID,
    branch_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        cb.id,
        cb.name
    FROM user_clinic_access uca
    JOIN clinics c ON uca.clinic_id = c.id
    LEFT JOIN clinic_branches cb ON uca.branch_id = cb.id
    WHERE uca.user_id = p_user_id
    AND uca.is_default = TRUE
    AND uca.is_active = TRUE
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get all clinics accessible to a user
CREATE OR REPLACE FUNCTION get_user_clinics(
    p_user_id UUID
) RETURNS TABLE (
    clinic_id UUID,
    clinic_name VARCHAR,
    clinic_code VARCHAR,
    branch_id UUID,
    branch_name VARCHAR,
    is_main_branch BOOLEAN,
    is_default BOOLEAN,
    role_at_clinic VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.code,
        cb.id,
        cb.name,
        cb.is_main_branch,
        uca.is_default,
        uca.role_at_clinic
    FROM user_clinic_access uca
    JOIN clinics c ON uca.clinic_id = c.id
    LEFT JOIN clinic_branches cb ON uca.branch_id = cb.id
    WHERE uca.user_id = p_user_id
    AND uca.is_active = TRUE
    AND c.status = 'ACTIVE'
    ORDER BY uca.is_default DESC, c.name, cb.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: Update Existing Records with Default Clinic
-- ============================================================================

DO $$
DECLARE
    default_clinic_id UUID;
    main_branch_id UUID;
BEGIN
    -- Get default clinic and branch IDs
    SELECT id INTO default_clinic_id FROM clinics WHERE code = 'DEFAULT';
    SELECT id INTO main_branch_id FROM clinic_branches WHERE code = 'MAIN' AND clinic_id = default_clinic_id;
    
    -- Update all existing records to point to default clinic
    UPDATE patients SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE dentists SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE appointments SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE suppliers SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE inventory_items SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE expenses SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE treatment_definitions SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE treatment_records SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE insurance_companies SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE lab_cases SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE payments SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE supplier_invoices SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE prescriptions SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    UPDATE employees SET clinic_id = default_clinic_id, branch_id = main_branch_id WHERE clinic_id IS NULL;
    
    RAISE NOTICE 'All existing records updated with default clinic and branch';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
