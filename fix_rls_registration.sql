-- DEPRECATED - DO NOT RUN
--
-- This file previously contained permissive RLS/GRANT logic that can expose data.
-- Use hardened migrations under `migrations/` instead.

DO $$
BEGIN
  RAISE EXCEPTION 'Deprecated script blocked: use migrations/012_harden_rls_no_null_leak.sql and newer secure migrations.';
END $$;
