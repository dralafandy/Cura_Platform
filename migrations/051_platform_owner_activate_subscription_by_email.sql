-- ============================================================================
-- 051_platform_owner_activate_subscription_by_email.sql
-- Purpose:
-- 1) Allow platform owner to change plan by user email without exposing users.
-- 2) Keep lookup and enforcement server-side only.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.platform_owner_activate_subscription_by_email(
  p_user_email TEXT,
  p_plan_slug TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  v_email TEXT := LOWER(BTRIM(COALESCE(p_user_email, '')));
  v_tenant_id UUID;
  v_tenant_count INTEGER := 0;
  v_ok BOOLEAN := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.is_platform_owner() THEN
    RAISE EXCEPTION 'Access denied: platform owner only' USING ERRCODE = '42501';
  END IF;

  IF v_email = '' THEN
    RAISE EXCEPTION 'User email is required';
  END IF;

  IF p_plan_slug IS NULL OR BTRIM(p_plan_slug) = '' THEN
    RAISE EXCEPTION 'Plan slug is required';
  END IF;

  SELECT COUNT(DISTINCT up.tenant_id)
  INTO v_tenant_count
  FROM public.user_profiles up
  WHERE LOWER(COALESCE(up.email, '')) = v_email
    AND up.tenant_id IS NOT NULL;

  IF v_tenant_count = 0 THEN
    RAISE EXCEPTION 'No tenant found for this email';
  ELSIF v_tenant_count > 1 THEN
    RAISE EXCEPTION 'Email is linked to multiple tenants; use tenant-specific flow';
  END IF;

  SELECT up.tenant_id
  INTO v_tenant_id
  FROM public.user_profiles up
  WHERE LOWER(COALESCE(up.email, '')) = v_email
    AND up.tenant_id IS NOT NULL
  ORDER BY up.updated_at DESC NULLS LAST
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant found for this email';
  END IF;

  SELECT public.activate_subscription(v_tenant_id, LOWER(BTRIM(p_plan_slug)))
  INTO v_ok;

  IF v_ok IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Failed to activate subscription';
  END IF;

  RETURN v_tenant_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.platform_owner_activate_subscription_by_email(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.platform_owner_activate_subscription_by_email(TEXT, TEXT) TO authenticated;

COMMIT;
