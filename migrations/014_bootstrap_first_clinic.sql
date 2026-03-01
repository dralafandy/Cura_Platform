-- ============================================================================
-- 014_bootstrap_first_clinic.sql
-- Purpose: Bootstrap first clinic + access mapping after full reset
-- Notes:
-- - Creates one clinic if none exists
-- - Links latest auth user to that clinic as ADMIN if no mapping exists
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_user_id UUID;
  v_clinic_id UUID;
BEGIN
  -- Pick newest app user profile (FK in user_clinics points to user_profiles.id)
  SELECT u.id
  INTO v_user_id
  FROM public.user_profiles u
  ORDER BY u.created_at DESC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No user profile found. Create a user in user_profiles first, then rerun this migration.';
    RETURN;
  END IF;

  -- Create first clinic only if table is empty
  IF EXISTS (SELECT 1 FROM public.clinics LIMIT 1) THEN
    SELECT c.id INTO v_clinic_id FROM public.clinics c ORDER BY c.created_at NULLS LAST, c.id LIMIT 1;
  ELSE
    INSERT INTO public.clinics (id, name)
    VALUES (gen_random_uuid(), 'Main Clinic')
    RETURNING id INTO v_clinic_id;
  END IF;

  -- Link user to clinic if not already linked
  IF NOT EXISTS (
    SELECT 1
    FROM public.user_clinics uc
    WHERE uc.user_id = v_user_id
      AND uc.clinic_id = v_clinic_id
  ) THEN
    INSERT INTO public.user_clinics (user_id, clinic_id, role_at_clinic, access_active)
    VALUES (v_user_id, v_clinic_id, 'ADMIN', true);
  END IF;

  RAISE NOTICE 'Bootstrap complete. user_id=%, clinic_id=%', v_user_id, v_clinic_id;
END
$$;

COMMIT;

SELECT 'Bootstrap first clinic completed.' AS status;
