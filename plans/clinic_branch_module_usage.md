# Clinic/Branches Full Module (From Zero)

## Migration
Run:

```sql
-- execute the content of:
-- migrations/042_clinic_branch_full_module_bootstrap.sql
```

## End-to-End Flow

1. Create user in `auth.users` (via Supabase Auth sign-up/admin API).
2. Bootstrap clinic + main branch for that user:

```sql
select * from public.bootstrap_clinic_branch_workspace(
  'Main Clinic',
  'MAIN',
  'Main Branch',
  'MAIN'
);
```

3. Add extra branch:

```sql
select public.create_clinic_branch(
  '<<clinic_id>>',
  'Branch 2',
  'BR2',
  'BRANCH',
  false,
  null,
  true
);
```

4. Assign another user to clinic + branch:

```sql
select public.assign_user_to_clinic_branch(
  '<<target_user_auth_id>>',
  '<<clinic_id>>',
  '<<branch_id>>',
  'DOCTOR',
  false,
  array[]::text[],
  null
);
```

## Frontend Service
Use `services/clinicBranchModuleService.ts`:

- `bootstrapClinicBranchWorkspace(...)`
- `createClinicWithMainBranch(...)`
- `createClinicBranch(...)`
- `assignUserToClinicBranch(...)`
