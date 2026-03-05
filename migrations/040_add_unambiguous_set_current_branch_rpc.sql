-- ============================================================================
-- 040_add_unambiguous_set_current_branch_rpc.sql
-- Purpose:
-- Add an unambiguous RPC endpoint for PostgREST/Supabase clients to set
-- current branch without overload resolution conflicts.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.set_current_branch_uuid(bid UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM public.set_current_branch(bid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.set_current_branch_uuid(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_current_branch_uuid(UUID) TO authenticated;

COMMIT;
