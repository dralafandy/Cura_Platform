-- ============================================================================
-- 039_expand_user_branch_memberships.sql
-- Purpose:
-- 1) Ensure users with clinic access can switch to all active branches
--    inside that clinic (prevents selector reverting to clinic).
-- 2) Keep user_clinics (legacy) synchronized with canonical access table.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_has_uca BOOLEAN := to_regclass('public.user_clinic_access') IS NOT NULL;
  v_has_uc BOOLEAN := to_regclass('public.user_clinics') IS NOT NULL;
BEGIN
  IF v_has_uca THEN
    -- Expand each user's clinic access to all active branches in that clinic.
    INSERT INTO public.user_clinic_access (
      user_id,
      clinic_id,
      branch_id,
      role_at_clinic,
      custom_permissions,
      is_default,
      is_active,
      created_by
    )
    SELECT
      base.user_id,
      base.clinic_id,
      cb.id AS branch_id,
      base.role_at_clinic,
      COALESCE(base.custom_permissions, ARRAY[]::text[]),
      false AS is_default,
      true AS is_active,
      base.created_by
    FROM (
      SELECT DISTINCT ON (uca.user_id, uca.clinic_id)
        uca.user_id,
        uca.clinic_id,
        uca.role_at_clinic,
        uca.custom_permissions,
        uca.created_by
      FROM public.user_clinic_access uca
      WHERE COALESCE(uca.is_active, true) = true
      ORDER BY uca.user_id, uca.clinic_id, COALESCE(uca.is_default, false) DESC, uca.updated_at DESC NULLS LAST
    ) base
    JOIN public.clinic_branches cb
      ON cb.clinic_id = base.clinic_id
     AND COALESCE(cb.is_active, true) = true
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.user_clinic_access existing
      WHERE existing.user_id = base.user_id
        AND existing.clinic_id = base.clinic_id
        AND existing.branch_id = cb.id
    );

    -- Keep exactly one default per user/clinic (prefer MAIN, else oldest).
    WITH ranked AS (
      SELECT
        uca.id,
        uca.user_id,
        uca.clinic_id,
        row_number() OVER (
          PARTITION BY uca.user_id, uca.clinic_id
          ORDER BY COALESCE(cb.is_main_branch, false) DESC, uca.created_at ASC NULLS LAST, uca.id
        ) AS rn
      FROM public.user_clinic_access uca
      LEFT JOIN public.clinic_branches cb ON cb.id = uca.branch_id
      WHERE COALESCE(uca.is_active, true) = true
    )
    UPDATE public.user_clinic_access uca
    SET is_default = (ranked.rn = 1)
    FROM ranked
    WHERE ranked.id = uca.id;
  END IF;

  IF v_has_uc AND v_has_uca THEN
    -- Sync legacy table from canonical table.
    INSERT INTO public.user_clinics (
      user_id,
      clinic_id,
      branch_id,
      role_at_clinic,
      custom_permissions,
      is_default,
      access_active,
      created_by
    )
    SELECT
      uca.user_id,
      uca.clinic_id,
      uca.branch_id,
      uca.role_at_clinic,
      COALESCE(uca.custom_permissions, ARRAY[]::text[]),
      COALESCE(uca.is_default, false),
      COALESCE(uca.is_active, true),
      uca.created_by
    FROM public.user_clinic_access uca
    WHERE COALESCE(uca.is_active, true) = true
      AND NOT EXISTS (
        SELECT 1
        FROM public.user_clinics uc
        WHERE uc.user_id = uca.user_id
          AND uc.clinic_id = uca.clinic_id
          AND uc.branch_id IS NOT DISTINCT FROM uca.branch_id
      );

    -- Mirror defaults by user/clinic.
    WITH ranked AS (
      SELECT
        uc.id,
        uc.user_id,
        uc.clinic_id,
        row_number() OVER (
          PARTITION BY uc.user_id, uc.clinic_id
          ORDER BY COALESCE(cb.is_main_branch, false) DESC, uc.created_at ASC NULLS LAST, uc.id
        ) AS rn
      FROM public.user_clinics uc
      LEFT JOIN public.clinic_branches cb ON cb.id = uc.branch_id
      WHERE COALESCE(uc.access_active, true) = true
    )
    UPDATE public.user_clinics uc
    SET is_default = (ranked.rn = 1),
        access_active = true
    FROM ranked
    WHERE ranked.id = uc.id;
  END IF;
END
$$;

COMMIT;
