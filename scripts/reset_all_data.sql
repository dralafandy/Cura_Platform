-- WARNING:
-- This script permanently deletes ALL rows from all tables in the public schema.
-- It keeps the table structure (schema), constraints, and policies.
-- Use only when you really want a clean start.

BEGIN;

DO $$
DECLARE
  public_tables text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO public_tables
  FROM pg_tables
  WHERE schemaname = 'public';

  IF public_tables IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || public_tables || ' RESTART IDENTITY CASCADE';
  END IF;
END $$;

COMMIT;

-- Optional hard reset for auth users (uncomment only if you want to delete login accounts too):
-- DELETE FROM auth.identities;
-- DELETE FROM auth.users;

-- Optional hard reset for storage files (uncomment only if you want to remove uploaded files too):
-- DELETE FROM storage.objects;
-- DELETE FROM storage.buckets;

