-- Fix payroll RPC visibility for PostgREST schema cache
-- Ensures the function exists with the expected args and has EXECUTE grants.

CREATE OR REPLACE FUNCTION public.generate_monthly_salaries(
  p_user_id UUID,
  p_month DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_month_start DATE := date_trunc('month', p_month)::date;
  v_month_end DATE := (date_trunc('month', p_month) + interval '1 month - 1 day')::date;
  v_inserted_count INTEGER := 0;
BEGIN
  INSERT INTO public.employee_compensations (
    employee_id, entry_date, entry_type, amount, notes, user_id
  )
  SELECT
    e.id,
    v_month_end,
    'SALARY',
    e.base_salary,
    CONCAT('Auto salary generated for month ', to_char(v_month_start, 'YYYY-MM')),
    p_user_id
  FROM public.employees e
  WHERE e.user_id = p_user_id
    AND e.status = 'ACTIVE'
    AND NOT EXISTS (
      SELECT 1
      FROM public.employee_compensations c
      WHERE c.employee_id = e.id
        AND c.entry_type = 'SALARY'
        AND date_trunc('month', c.entry_date)::date = v_month_start
    );

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  RETURN v_inserted_count;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT EXECUTE ON FUNCTION public.generate_monthly_salaries(UUID, DATE) TO authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.generate_monthly_salaries(UUID, DATE) TO service_role;
  END IF;
END
$$;

-- Ask PostgREST to refresh schema cache (safe no-op on unsupported setups)
NOTIFY pgrst, 'reload schema';
