-- ============================================================================
-- 050_backfill_treatment_branch_scope.sql
-- Purpose:
-- 1) Backfill missing branch_id for treatment_definitions and treatment_records.
-- 2) Keep treatment data aligned to branch scope for treatment management.
-- ============================================================================

BEGIN;

-- Make sure branch_id columns exist in legacy environments.
ALTER TABLE IF EXISTS public.treatment_definitions
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.clinic_branches(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.treatment_records
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.clinic_branches(id) ON DELETE SET NULL;

-- Helpful indexes (no-op if already present).
CREATE INDEX IF NOT EXISTS idx_treatment_definitions_branch_id ON public.treatment_definitions(branch_id);
CREATE INDEX IF NOT EXISTS idx_treatment_records_branch_id ON public.treatment_records(branch_id);

-- Candidate default branch per clinic.
WITH clinic_default_branch AS (
  SELECT
    cb.clinic_id,
    cb.id AS branch_id,
    ROW_NUMBER() OVER (
      PARTITION BY cb.clinic_id
      ORDER BY cb.is_main_branch DESC, cb.created_at ASC, cb.id ASC
    ) AS rn
  FROM public.clinic_branches cb
)
UPDATE public.treatment_definitions td
SET branch_id = cdb.branch_id
FROM clinic_default_branch cdb
WHERE td.branch_id IS NULL
  AND td.clinic_id = cdb.clinic_id
  AND cdb.rn = 1;

-- Prefer patient branch first.
UPDATE public.treatment_records tr
SET branch_id = p.branch_id
FROM public.patients p
WHERE tr.branch_id IS NULL
  AND tr.patient_id = p.id
  AND p.branch_id IS NOT NULL;

-- Then dentist branch.
UPDATE public.treatment_records tr
SET branch_id = d.branch_id
FROM public.dentists d
WHERE tr.branch_id IS NULL
  AND tr.dentist_id = d.id
  AND d.branch_id IS NOT NULL;

-- Then treatment definition branch.
UPDATE public.treatment_records tr
SET branch_id = td.branch_id
FROM public.treatment_definitions td
WHERE tr.branch_id IS NULL
  AND tr.treatment_definition_id = td.id
  AND td.branch_id IS NOT NULL;

-- Last fallback: clinic default branch.
WITH clinic_default_branch AS (
  SELECT
    cb.clinic_id,
    cb.id AS branch_id,
    ROW_NUMBER() OVER (
      PARTITION BY cb.clinic_id
      ORDER BY cb.is_main_branch DESC, cb.created_at ASC, cb.id ASC
    ) AS rn
  FROM public.clinic_branches cb
)
UPDATE public.treatment_records tr
SET branch_id = cdb.branch_id
FROM clinic_default_branch cdb
WHERE tr.branch_id IS NULL
  AND tr.clinic_id = cdb.clinic_id
  AND cdb.rn = 1;

COMMIT;
