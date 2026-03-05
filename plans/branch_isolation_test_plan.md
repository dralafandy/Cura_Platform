# Branch-Level Isolation Test Plan

## Scope
- Patients, appointments, payments, prescriptions, treatment records, attachments and all tables with `branch_id` or `clinic_id`.
- RLS is the final enforcement layer.

## Standard SQL Policy Template
```sql
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY your_table_branch_select ON your_table
FOR SELECT
USING (branch_id = public.current_session_branch_id());

CREATE POLICY your_table_branch_insert ON your_table
FOR INSERT
WITH CHECK (branch_id = public.current_session_branch_id());

CREATE POLICY your_table_branch_update ON your_table
FOR UPDATE
USING (branch_id = public.current_session_branch_id())
WITH CHECK (branch_id = public.current_session_branch_id());

CREATE POLICY your_table_branch_delete ON your_table
FOR DELETE
USING (branch_id = public.current_session_branch_id());
```

## Data Migration Plan
1. Backup database snapshot.
2. Apply `migrations/029_branch_level_rls_session_scope.sql`.
3. Validate `branch_id` backfill results for rows previously null.
4. Fix unresolved rows manually using clinic membership mapping.
5. Deploy frontend/backend code that calls `set_current_branch` before data operations.
6. Run acceptance SQL in `tests/acceptance/branch_scope_acceptance.sql`.
7. If rollback needed, apply `migrations/030_rollback_branch_level_rls_session_scope.sql`.

## Acceptance Cases
1. Branch A user creates patient, branch A peers can read it, branch B cannot.
2. Cross-branch read/update is rejected by DB policy.
3. API insert with wrong branch is rejected by DB policy.
4. Multi-branch user switches branch and sees only new branch data.
5. New admin/user flow includes explicit clinic/branch selection and created user is scoped to it.

## Expected PR Description
`Fix multi-tenant isolation to branch level — apply RLS and session branch setting across tenant tables; update backend middleware and frontend branch handling; add migrations and tests.`
