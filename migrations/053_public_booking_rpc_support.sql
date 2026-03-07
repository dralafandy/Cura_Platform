-- ============================================================================
-- 053_public_booking_rpc_support.sql
-- Purpose:
-- Enable the public booking page to work with strict RLS by exposing only the
-- minimum clinic-scoped booking data through SECURITY DEFINER RPC functions.
-- ============================================================================

BEGIN;

ALTER TABLE IF EXISTS public.online_reservations
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.clinic_branches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS patient_dob DATE,
  ADD COLUMN IF NOT EXISTS patient_gender TEXT;

CREATE INDEX IF NOT EXISTS idx_online_reservations_clinic_scope
  ON public.online_reservations(clinic_id);

CREATE INDEX IF NOT EXISTS idx_online_reservations_branch_scope
  ON public.online_reservations(branch_id);

CREATE OR REPLACE FUNCTION public.resolve_public_booking_scope(
  p_clinic_id UUID DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE (
  clinic_id UUID,
  clinic_name TEXT,
  branch_id UUID,
  branch_name TEXT,
  display_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  logo_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_clinic RECORD;
  v_branch RECORD;
BEGIN
  IF p_branch_id IS NOT NULL THEN
    SELECT
      cb.id,
      cb.clinic_id,
      cb.name,
      cb.phone,
      cb.email,
      cb.address,
      c.name AS clinic_name,
      c.phone AS clinic_phone,
      c.email AS clinic_email,
      c.address AS clinic_address,
      c.logo_url
    INTO v_branch
    FROM public.clinic_branches cb
    JOIN public.clinics c
      ON c.id = cb.clinic_id
    WHERE cb.id = p_branch_id
      AND COALESCE(cb.is_active, true) = true
      AND COALESCE(c.status, 'ACTIVE') = 'ACTIVE'
    LIMIT 1;

    IF NOT FOUND THEN
      RETURN;
    END IF;

    IF p_clinic_id IS NOT NULL AND v_branch.clinic_id IS DISTINCT FROM p_clinic_id THEN
      RETURN;
    END IF;

    RETURN QUERY
    SELECT
      v_branch.clinic_id,
      v_branch.clinic_name,
      v_branch.id,
      v_branch.name,
      COALESCE(NULLIF(v_branch.name, ''), v_branch.clinic_name),
      COALESCE(NULLIF(v_branch.phone, ''), v_branch.clinic_phone),
      COALESCE(NULLIF(v_branch.email, ''), v_branch.clinic_email),
      COALESCE(NULLIF(v_branch.address, ''), v_branch.clinic_address),
      v_branch.logo_url;

    RETURN;
  END IF;

  IF p_clinic_id IS NULL THEN
    RETURN;
  END IF;

  SELECT
    c.id,
    c.name,
    c.phone,
    c.email,
    c.address,
    c.logo_url
  INTO v_clinic
  FROM public.clinics c
  WHERE c.id = p_clinic_id
    AND COALESCE(c.status, 'ACTIVE') = 'ACTIVE'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    v_clinic.id,
    v_clinic.name,
    NULL::UUID,
    NULL::TEXT,
    v_clinic.name,
    v_clinic.phone,
    v_clinic.email,
    v_clinic.address,
    v_clinic.logo_url;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_booking_context(
  p_clinic_id UUID DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE (
  clinic_id UUID,
  clinic_name TEXT,
  branch_id UUID,
  branch_name TEXT,
  display_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  logo_url TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT *
  FROM public.resolve_public_booking_scope(p_clinic_id, p_branch_id);
$$;

CREATE OR REPLACE FUNCTION public.get_public_booking_dentists(
  p_clinic_id UUID DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  specialty TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_scope RECORD;
BEGIN
  SELECT *
  INTO v_scope
  FROM public.resolve_public_booking_scope(p_clinic_id, p_branch_id)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    d.id,
    d.name,
    COALESCE(d.specialty, '')
  FROM public.dentists d
  WHERE d.clinic_id = v_scope.clinic_id
    AND (
      v_scope.branch_id IS NULL
      OR d.branch_id = v_scope.branch_id
      OR d.branch_id IS NULL
    )
  ORDER BY d.name;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_booking_services(
  p_clinic_id UUID DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  base_price NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_scope RECORD;
BEGIN
  SELECT *
  INTO v_scope
  FROM public.resolve_public_booking_scope(p_clinic_id, p_branch_id)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    td.id,
    td.name,
    COALESCE(td.description, ''),
    td.base_price
  FROM public.treatment_definitions td
  WHERE td.clinic_id = v_scope.clinic_id
    AND (
      v_scope.branch_id IS NULL
      OR td.branch_id = v_scope.branch_id
      OR td.branch_id IS NULL
    )
  ORDER BY td.name;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_booking_working_hours(
  p_day_of_week INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  day_of_week INTEGER,
  start_time TIME,
  end_time TIME,
  slot_duration_minutes INTEGER,
  break_start TIME,
  break_end TIME,
  is_active BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT
    wh.id,
    wh.day_of_week,
    wh.start_time,
    wh.end_time,
    wh.slot_duration_minutes,
    wh.break_start,
    wh.break_end,
    wh.is_active
  FROM public.working_hours wh
  WHERE COALESCE(wh.is_active, true) = true
    AND (p_day_of_week IS NULL OR wh.day_of_week = p_day_of_week)
  ORDER BY wh.day_of_week;
$$;

CREATE OR REPLACE FUNCTION public.get_public_booking_appointments(
  p_date DATE,
  p_clinic_id UUID DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL,
  p_dentist_id UUID DEFAULT NULL
)
RETURNS TABLE (
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  dentist_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_scope RECORD;
BEGIN
  IF p_date IS NULL THEN
    RETURN;
  END IF;

  SELECT *
  INTO v_scope
  FROM public.resolve_public_booking_scope(p_clinic_id, p_branch_id)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    a.start_time,
    a.end_time,
    a.dentist_id
  FROM public.appointments a
  WHERE a.clinic_id = v_scope.clinic_id
    AND (
      v_scope.branch_id IS NULL
      OR a.branch_id = v_scope.branch_id
      OR a.branch_id IS NULL
    )
    AND (p_dentist_id IS NULL OR a.dentist_id = p_dentist_id)
    AND a.start_time >= p_date::timestamp
    AND a.start_time < (p_date::timestamp + INTERVAL '1 day')
    AND a.status IN ('SCHEDULED', 'CONFIRMED')
  ORDER BY a.start_time;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_public_online_reservation(
  p_clinic_id UUID DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL,
  p_patient_name TEXT DEFAULT NULL,
  p_patient_dob DATE DEFAULT NULL,
  p_patient_gender TEXT DEFAULT NULL,
  p_patient_phone TEXT DEFAULT NULL,
  p_patient_email TEXT DEFAULT NULL,
  p_preferred_dentist_id UUID DEFAULT NULL,
  p_service_id UUID DEFAULT NULL,
  p_requested_date DATE DEFAULT NULL,
  p_requested_time TIME DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT 30,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_scope RECORD;
  v_reservation_id UUID;
BEGIN
  SELECT *
  INTO v_scope
  FROM public.resolve_public_booking_scope(p_clinic_id, p_branch_id)
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid clinic or branch for this booking link';
  END IF;

  IF p_patient_name IS NULL OR btrim(p_patient_name) = '' THEN
    RAISE EXCEPTION 'Patient name is required';
  END IF;

  IF p_patient_phone IS NULL OR btrim(p_patient_phone) = '' THEN
    RAISE EXCEPTION 'Patient phone is required';
  END IF;

  IF p_requested_date IS NULL OR p_requested_time IS NULL THEN
    RAISE EXCEPTION 'Requested date and time are required';
  END IF;

  IF p_patient_gender IS NOT NULL AND p_patient_gender NOT IN ('Male', 'Female', 'Other') THEN
    RAISE EXCEPTION 'Invalid patient gender';
  END IF;

  IF p_preferred_dentist_id IS NOT NULL THEN
    PERFORM 1
    FROM public.dentists d
    WHERE d.id = p_preferred_dentist_id
      AND d.clinic_id = v_scope.clinic_id
      AND (
        v_scope.branch_id IS NULL
        OR d.branch_id = v_scope.branch_id
        OR d.branch_id IS NULL
      );

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Selected dentist is not available for this booking link';
    END IF;
  END IF;

  IF p_service_id IS NOT NULL THEN
    PERFORM 1
    FROM public.treatment_definitions td
    WHERE td.id = p_service_id
      AND td.clinic_id = v_scope.clinic_id
      AND (
        v_scope.branch_id IS NULL
        OR td.branch_id = v_scope.branch_id
        OR td.branch_id IS NULL
      );

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Selected service is not available for this booking link';
    END IF;
  END IF;

  INSERT INTO public.online_reservations (
    clinic_id,
    branch_id,
    patient_name,
    patient_dob,
    patient_gender,
    patient_phone,
    patient_email,
    preferred_dentist_id,
    service_id,
    requested_date,
    requested_time,
    duration_minutes,
    reason,
    status
  )
  VALUES (
    v_scope.clinic_id,
    v_scope.branch_id,
    btrim(p_patient_name),
    p_patient_dob,
    p_patient_gender,
    btrim(p_patient_phone),
    NULLIF(btrim(COALESCE(p_patient_email, '')), ''),
    p_preferred_dentist_id,
    p_service_id,
    p_requested_date,
    p_requested_time,
    GREATEST(COALESCE(p_duration_minutes, 30), 15),
    NULLIF(btrim(COALESCE(p_reason, '')), ''),
    'PENDING'
  )
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.resolve_public_booking_scope(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_booking_context(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_booking_dentists(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_booking_services(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_booking_working_hours(INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_booking_appointments(DATE, UUID, UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_public_online_reservation(UUID, UUID, TEXT, DATE, TEXT, TEXT, TEXT, UUID, UUID, DATE, TIME, INTEGER, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_public_booking_context(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_booking_dentists(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_booking_services(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_booking_working_hours(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_booking_appointments(DATE, UUID, UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_online_reservation(UUID, UUID, TEXT, DATE, TEXT, TEXT, TEXT, UUID, UUID, DATE, TIME, INTEGER, TEXT) TO anon, authenticated;

COMMIT;
