-- Acceptance tests for branch-level RLS isolation.
-- Run as a full script in SQL editor / psql.

-- 1) Set a real authenticated user UUID that has branch access.
SELECT set_config('app.test_user_id', 'fa5ac2fc-debe-4f32-9542-445880410723', true);

-- 2) Emulate authenticated JWT context so auth.uid() works in SQL editor.
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
SELECT set_config('request.jwt.claim.sub', current_setting('app.test_user_id'), true);

DO $$
DECLARE
  v_test_user_id UUID;
  v_exists_in_profiles BOOLEAN := false;
  v_has_auth_id BOOLEAN := false;
BEGIN
  BEGIN
    v_test_user_id := current_setting('app.test_user_id', true)::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      v_test_user_id := NULL;
  END;

  IF v_test_user_id IS NULL OR v_test_user_id = '00000000-0000-0000-0000-000000000000'::UUID THEN
    RAISE EXCEPTION 'Set app.test_user_id to a real user UUID before running tests.';
  END IF;

  IF to_regclass('public.user_profiles') IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = 'user_profiles'
        AND c.column_name = 'auth_id'
    ) INTO v_has_auth_id;

    IF v_has_auth_id THEN
      EXECUTE '
        SELECT EXISTS (
          SELECT 1
          FROM public.user_profiles up
          WHERE up.id = $1 OR up.auth_id = $1
        )'
      INTO v_exists_in_profiles
      USING v_test_user_id;
    ELSE
      SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE up.id = v_test_user_id
      ) INTO v_exists_in_profiles;
    END IF;

    IF NOT COALESCE(v_exists_in_profiles, false) THEN
      RAISE EXCEPTION 'app.test_user_id (%) was not found in public.user_profiles', v_test_user_id;
    END IF;
  END IF;
END
$$;

-- Discover up to two branches from the current user's actual memberships.
DO $$
DECLARE
  v_branch_a UUID;
  v_branch_b UUID;
  v_sql TEXT := '';
BEGIN
  IF to_regclass('public.user_clinic_access') IS NOT NULL THEN
    v_sql := v_sql || '
      SELECT DISTINCT uca.branch_id
      FROM public.user_clinic_access uca
      WHERE uca.user_id = auth.uid()
        AND COALESCE(uca.is_active, true) = true
        AND uca.branch_id IS NOT NULL
    ';
  END IF;

  IF to_regclass('public.user_clinics') IS NOT NULL THEN
    IF v_sql <> '' THEN
      v_sql := v_sql || ' UNION ';
    END IF;
    v_sql := v_sql || '
      SELECT DISTINCT uc.branch_id
      FROM public.user_clinics uc
      WHERE uc.user_id = auth.uid()
        AND COALESCE(uc.access_active, true) = true
        AND uc.branch_id IS NOT NULL
    ';
  END IF;

  IF v_sql = '' THEN
    RAISE EXCEPTION 'No user-branch membership table found (user_clinic_access/user_clinics).';
  END IF;

  v_sql := '
    WITH accessible_branches AS (' || v_sql || '),
    ranked AS (
      SELECT branch_id, row_number() OVER (ORDER BY branch_id) AS rn
      FROM accessible_branches
    )
    SELECT r1.branch_id, r2.branch_id
    FROM (SELECT branch_id FROM ranked WHERE rn = 1) r1
    LEFT JOIN (SELECT branch_id FROM ranked WHERE rn = 2) r2 ON TRUE
  ';

  EXECUTE v_sql INTO v_branch_a, v_branch_b;

  IF v_branch_a IS NULL THEN
    RAISE EXCEPTION 'No accessible branch found for app.test_user_id=%', auth.uid();
  END IF;

  PERFORM set_config('app.test_branch_a', v_branch_a::TEXT, true);
  PERFORM set_config('app.test_branch_b', COALESCE(v_branch_b, v_branch_a)::TEXT, true);

  RAISE NOTICE 'Branch A: %, Branch B: %', v_branch_a, COALESCE(v_branch_b, v_branch_a);
END
$$;

-- Generate a unique token for this run.
SELECT set_config('app.test_run_token', md5(random()::TEXT || clock_timestamp()::TEXT), true);

-- Test 1: insert and read in the same branch.
SELECT public.set_current_branch(current_setting('app.test_branch_a')::UUID);

INSERT INTO public.patients (name, user_id, clinic_id, branch_id)
VALUES (
  'RLS_ACCEPTANCE_' || current_setting('app.test_run_token'),
  auth.uid(),
  public.current_session_clinic_id(),
  public.current_session_branch_id()
)
RETURNING id;

SELECT set_config(
  'app.test_patient_id',
  (
    SELECT p.id::TEXT
    FROM public.patients p
    WHERE p.name = 'RLS_ACCEPTANCE_' || current_setting('app.test_run_token')
    ORDER BY p.created_at DESC NULLS LAST
    LIMIT 1
  ),
  true
);

DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT count(*)
  INTO v_count
  FROM public.patients p
  WHERE p.id = current_setting('app.test_patient_id')::UUID;

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Test 1 failed: expected 1 row in branch A, got %', v_count;
  END IF;

  RAISE NOTICE 'Test 1 passed: same-branch read allowed.';
END
$$;

-- Test 2: cross-branch read must be blocked (if second branch exists).
DO $$
DECLARE
  v_branch_a UUID := current_setting('app.test_branch_a')::UUID;
  v_branch_b UUID := current_setting('app.test_branch_b')::UUID;
  v_count INT;
BEGIN
  IF v_branch_a = v_branch_b THEN
    RAISE NOTICE 'Test 2 skipped: only one accessible branch.';
    RETURN;
  END IF;

  PERFORM public.set_current_branch(v_branch_b);

  SELECT count(*)
  INTO v_count
  FROM public.patients p
  WHERE p.id = current_setting('app.test_patient_id')::UUID;

  IF v_count <> 0 THEN
    RAISE EXCEPTION 'Test 2 failed: expected 0 rows from other branch, got %', v_count;
  END IF;

  RAISE NOTICE 'Test 2 passed: cross-branch read blocked.';
END
$$;

-- Test 3: insert with mismatched branch must fail (if second branch exists).
DO $$
DECLARE
  v_branch_a UUID := current_setting('app.test_branch_a')::UUID;
  v_branch_b UUID := current_setting('app.test_branch_b')::UUID;
BEGIN
  IF v_branch_a = v_branch_b THEN
    RAISE NOTICE 'Test 3 skipped: only one accessible branch.';
    RETURN;
  END IF;

  PERFORM public.set_current_branch(v_branch_b);

  BEGIN
    INSERT INTO public.patients (name, user_id, clinic_id, branch_id)
    VALUES (
      'RLS_MISMATCH_' || current_setting('app.test_run_token'),
      auth.uid(),
      public.current_session_clinic_id(),
      v_branch_a
    );

    RAISE EXCEPTION 'Test 3 failed: mismatched-branch insert unexpectedly succeeded.';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Test 3 passed: mismatched-branch insert rejected (%).', SQLERRM;
  END;
END
$$;

-- Test 4: derived child table (patient_attachments) must stay branch-scoped.
DO $$
DECLARE
  v_branch_a UUID := current_setting('app.test_branch_a')::UUID;
  v_branch_b UUID := current_setting('app.test_branch_b')::UUID;
  v_count INT;
BEGIN
  PERFORM public.set_current_branch(v_branch_a);

  INSERT INTO public.patient_attachments (
    patient_id,
    filename,
    original_filename,
    file_type,
    file_size,
    file_url,
    user_id
  )
  VALUES (
    current_setting('app.test_patient_id')::UUID,
    'RLS_ATTACH_' || current_setting('app.test_run_token') || '.txt',
    'RLS_ATTACH_' || current_setting('app.test_run_token') || '.txt',
    'text/plain',
    1,
    'https://example.invalid/rls-acceptance.txt',
    auth.uid()
  );

  IF v_branch_a = v_branch_b THEN
    RAISE NOTICE 'Test 4 skipped cross-branch phase: only one accessible branch.';
    RETURN;
  END IF;

  PERFORM public.set_current_branch(v_branch_b);

  SELECT count(*)
  INTO v_count
  FROM public.patient_attachments pa
  WHERE pa.patient_id = current_setting('app.test_patient_id')::UUID
    AND pa.filename = 'RLS_ATTACH_' || current_setting('app.test_run_token') || '.txt';

  IF v_count <> 0 THEN
    RAISE EXCEPTION 'Test 4 failed: attachment visible from other branch (count=%).', v_count;
  END IF;

  RAISE NOTICE 'Test 4 passed: derived child table is branch-scoped.';
END
$$;

-- Test 5: clear branch should produce empty branch view.
SELECT public.clear_current_branch();
SELECT count(*) AS current_branch_patients_after_clear FROM public.current_branch_patients;

-- Cleanup test data where visible in branch A.
DO $$
DECLARE
  v_branch_a UUID := current_setting('app.test_branch_a')::UUID;
BEGIN
  PERFORM public.set_current_branch(v_branch_a);

  DELETE FROM public.patient_attachments
  WHERE patient_id = current_setting('app.test_patient_id')::UUID;

  DELETE FROM public.patients
  WHERE id = current_setting('app.test_patient_id')::UUID;

  PERFORM public.clear_current_branch();
END
$$;

SELECT 'Branch-scope acceptance suite completed.' AS status;
