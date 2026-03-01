-- ============================================================================
-- Quick Fix: Add clinic_status column to user_clinics_view
-- Run this SQL directly in Supabase SQL Editor to fix the API 400 error
-- ============================================================================

-- Add the missing clinic_status column to the view
CREATE OR REPLACE VIEW user_clinics_view AS
SELECT 
    uc.id,
    uc.user_id,
    uc.clinic_id,
    c.name AS clinic_name,
    c.code AS clinic_code,
    c.status AS clinic_status,
    uc.branch_id,
    cb.name AS branch_name,
    cb.branch_type,
    uc.role_at_clinic,
    uc.custom_permissions,
    uc.is_default,
    uc.access_active,
    uc.created_at,
    uc.updated_at,
    uc.created_by
FROM user_clinics uc
LEFT JOIN clinics c ON uc.clinic_id = c.id
LEFT JOIN clinic_branches cb ON uc.branch_id = cb.id
WHERE c.status = 'ACTIVE';

-- Verify the view has the new column
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_clinics_view' 
AND column_name = 'clinic_status';
