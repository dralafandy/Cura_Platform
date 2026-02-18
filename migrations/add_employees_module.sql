-- Employees module migration (safe / non-destructive)
-- This migration only adds new tables and indexes.
-- Existing data in current tables remains unchanged.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Generic updated_at trigger function (created only if missing)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Core employees table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  position_title TEXT,
  base_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  hire_date DATE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);

-- Optional linkage: doctor (dentist) <-> employee
-- Safe: adds nullable column only; does not alter existing rows.
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS dentist_id UUID;

DO $$
BEGIN
  -- Add FK only if dentists table exists and constraint is not already present
  IF to_regclass('public.dentists') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'fk_employees_dentist_id'
    ) THEN
      ALTER TABLE public.employees
      ADD CONSTRAINT fk_employees_dentist_id
      FOREIGN KEY (dentist_id)
      REFERENCES public.dentists(id)
      ON DELETE SET NULL;
    END IF;
  END IF;
END
$$;

-- Enforce one employee per dentist when linked (nullable-safe)
CREATE UNIQUE INDEX IF NOT EXISTS uq_employees_dentist_id
ON public.employees(dentist_id)
WHERE dentist_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_employees_set_updated_at ON public.employees;
CREATE TRIGGER trg_employees_set_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Attendance table
CREATE TABLE IF NOT EXISTS public.employee_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  status TEXT NOT NULL DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'LEAVE')),
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_employee_attendance_day UNIQUE (employee_id, attendance_date)
);

-- Ensure checkout is not earlier than check-in when both are provided
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_employee_attendance_time_order'
  ) THEN
    ALTER TABLE public.employee_attendance
    ADD CONSTRAINT chk_employee_attendance_time_order
    CHECK (
      check_in_time IS NULL
      OR check_out_time IS NULL
      OR check_out_time >= check_in_time
    );
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_employee_attendance_user_id ON public.employee_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_employee_id ON public.employee_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_date ON public.employee_attendance(attendance_date);

DROP TRIGGER IF EXISTS trg_employee_attendance_set_updated_at ON public.employee_attendance;
CREATE TRIGGER trg_employee_attendance_set_updated_at
BEFORE UPDATE ON public.employee_attendance
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Compensation table for salary/bonus/penalty/advance
CREATE TABLE IF NOT EXISTS public.employee_compensations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('SALARY', 'BONUS', 'PENALTY', 'ADVANCE')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_compensations_user_id ON public.employee_compensations(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_compensations_employee_id ON public.employee_compensations(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_compensations_date ON public.employee_compensations(entry_date);
CREATE INDEX IF NOT EXISTS idx_employee_compensations_type ON public.employee_compensations(entry_type);

DROP TRIGGER IF EXISTS trg_employee_compensations_set_updated_at ON public.employee_compensations;
CREATE TRIGGER trg_employee_compensations_set_updated_at
BEFORE UPDATE ON public.employee_compensations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Leave requests table
CREATE TABLE IF NOT EXISTS public.employee_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL DEFAULT 'ANNUAL' CHECK (leave_type IN ('ANNUAL', 'SICK', 'EMERGENCY', 'UNPAID', 'OTHER')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER GENERATED ALWAYS AS ((end_date - start_date) + 1) STORED,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  reason TEXT,
  decision_note TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_employee_leave_date_order CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_employee_leave_requests_user_id ON public.employee_leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_leave_requests_employee_id ON public.employee_leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_leave_requests_status ON public.employee_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_employee_leave_requests_start_date ON public.employee_leave_requests(start_date);

DROP TRIGGER IF EXISTS trg_employee_leave_requests_set_updated_at ON public.employee_leave_requests;
CREATE TRIGGER trg_employee_leave_requests_set_updated_at
BEFORE UPDATE ON public.employee_leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Automation: when leave is approved, upsert attendance as LEAVE across leave date range
CREATE OR REPLACE FUNCTION public.apply_leave_request_to_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'APPROVED' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.employee_attendance (
      employee_id,
      attendance_date,
      status,
      notes,
      user_id
    )
    SELECT
      NEW.employee_id,
      d::date,
      'LEAVE',
      CONCAT('Auto leave from request ', NEW.id),
      NEW.user_id
    FROM generate_series(NEW.start_date, NEW.end_date, interval '1 day') AS d
    ON CONFLICT (employee_id, attendance_date)
    DO UPDATE SET
      status = 'LEAVE',
      notes = EXCLUDED.notes,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_leave_request_to_attendance ON public.employee_leave_requests;
CREATE TRIGGER trg_apply_leave_request_to_attendance
AFTER UPDATE ON public.employee_leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.apply_leave_request_to_attendance();

-- Enforce only one salary record per employee per month
CREATE UNIQUE INDEX IF NOT EXISTS uq_employee_salary_month
ON public.employee_compensations (
  employee_id,
  (date_trunc('month', entry_date::timestamp)::date)
)
WHERE entry_type = 'SALARY';

-- Helpful analytics view for attendance + compensation by month
CREATE OR REPLACE VIEW public.v_employee_monthly_analytics AS
WITH attendance_agg AS (
  SELECT
    a.user_id,
    a.employee_id,
    date_trunc('month', a.attendance_date)::date AS month_start,
    COUNT(*) FILTER (WHERE a.status = 'PRESENT') AS present_days,
    COUNT(*) FILTER (WHERE a.status = 'LATE') AS late_days,
    COUNT(*) FILTER (WHERE a.status = 'ABSENT') AS absent_days,
    COUNT(*) FILTER (WHERE a.status = 'LEAVE') AS leave_days
  FROM public.employee_attendance a
  GROUP BY a.user_id, a.employee_id, date_trunc('month', a.attendance_date)::date
),
comp_agg AS (
  SELECT
    c.user_id,
    c.employee_id,
    date_trunc('month', c.entry_date)::date AS month_start,
    COALESCE(SUM(c.amount) FILTER (WHERE c.entry_type = 'SALARY'), 0) AS salary_total,
    COALESCE(SUM(c.amount) FILTER (WHERE c.entry_type = 'BONUS'), 0) AS bonus_total,
    COALESCE(SUM(c.amount) FILTER (WHERE c.entry_type = 'PENALTY'), 0) AS penalty_total,
    COALESCE(SUM(c.amount) FILTER (WHERE c.entry_type = 'ADVANCE'), 0) AS advance_total
  FROM public.employee_compensations c
  GROUP BY c.user_id, c.employee_id, date_trunc('month', c.entry_date)::date
)
SELECT
  e.user_id,
  e.id AS employee_id,
  e.full_name,
  COALESCE(a.month_start, c.month_start) AS month_start,
  COALESCE(a.present_days, 0) AS present_days,
  COALESCE(a.late_days, 0) AS late_days,
  COALESCE(a.absent_days, 0) AS absent_days,
  COALESCE(a.leave_days, 0) AS leave_days,
  COALESCE(c.salary_total, 0) AS salary_total,
  COALESCE(c.bonus_total, 0) AS bonus_total,
  COALESCE(c.penalty_total, 0) AS penalty_total,
  COALESCE(c.advance_total, 0) AS advance_total,
  COALESCE(c.salary_total, 0) + COALESCE(c.bonus_total, 0) - COALESCE(c.penalty_total, 0) - COALESCE(c.advance_total, 0) AS net_total
FROM public.employees e
LEFT JOIN attendance_agg a ON a.employee_id = e.id
LEFT JOIN comp_agg c
  ON c.employee_id = e.id
  AND (a.month_start IS NULL OR c.month_start = a.month_start);

-- Automation: generate salary entries for active employees for a specific month
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

-- =========================================================
-- RLS Policies (safe / idempotent)
-- =========================================================

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_compensations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_leave_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- employees
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employees' AND policyname = 'employees_select_own') THEN
    CREATE POLICY employees_select_own ON public.employees FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employees' AND policyname = 'employees_insert_own') THEN
    CREATE POLICY employees_insert_own ON public.employees FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employees' AND policyname = 'employees_update_own') THEN
    CREATE POLICY employees_update_own ON public.employees FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employees' AND policyname = 'employees_delete_own') THEN
    CREATE POLICY employees_delete_own ON public.employees FOR DELETE USING (user_id = auth.uid());
  END IF;

  -- employee_attendance
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employee_attendance' AND policyname = 'employee_attendance_select_own') THEN
    CREATE POLICY employee_attendance_select_own ON public.employee_attendance FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employee_attendance' AND policyname = 'employee_attendance_insert_own') THEN
    CREATE POLICY employee_attendance_insert_own ON public.employee_attendance FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employee_attendance' AND policyname = 'employee_attendance_update_own') THEN
    CREATE POLICY employee_attendance_update_own ON public.employee_attendance FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employee_attendance' AND policyname = 'employee_attendance_delete_own') THEN
    CREATE POLICY employee_attendance_delete_own ON public.employee_attendance FOR DELETE USING (user_id = auth.uid());
  END IF;

  -- employee_compensations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employee_compensations' AND policyname = 'employee_compensations_select_own') THEN
    CREATE POLICY employee_compensations_select_own ON public.employee_compensations FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employee_compensations' AND policyname = 'employee_compensations_insert_own') THEN
    CREATE POLICY employee_compensations_insert_own ON public.employee_compensations FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employee_compensations' AND policyname = 'employee_compensations_update_own') THEN
    CREATE POLICY employee_compensations_update_own ON public.employee_compensations FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employee_compensations' AND policyname = 'employee_compensations_delete_own') THEN
    CREATE POLICY employee_compensations_delete_own ON public.employee_compensations FOR DELETE USING (user_id = auth.uid());
  END IF;

  -- employee_leave_requests
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employee_leave_requests' AND policyname = 'employee_leave_requests_select_own') THEN
    CREATE POLICY employee_leave_requests_select_own ON public.employee_leave_requests FOR SELECT USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employee_leave_requests' AND policyname = 'employee_leave_requests_insert_own') THEN
    CREATE POLICY employee_leave_requests_insert_own ON public.employee_leave_requests FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employee_leave_requests' AND policyname = 'employee_leave_requests_update_own') THEN
    CREATE POLICY employee_leave_requests_update_own ON public.employee_leave_requests FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employee_leave_requests' AND policyname = 'employee_leave_requests_delete_own') THEN
    CREATE POLICY employee_leave_requests_delete_own ON public.employee_leave_requests FOR DELETE USING (user_id = auth.uid());
  END IF;
END
$$;
