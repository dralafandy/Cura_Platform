-- ============================================================================
-- 050_restrict_plan_changes_to_platform_owner.sql
-- Purpose:
-- 1) Restrict subscription plan changes to platform owner account(s).
-- 2) Keep service_role bypass for backend automation.
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS BOOLEAN AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  SELECT LOWER(au.email)
  INTO v_email
  FROM auth.users au
  WHERE au.id = auth.uid()
  LIMIT 1;

  RETURN v_email IN (
    'dralafandy@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_catalog;

CREATE OR REPLACE FUNCTION public.activate_subscription(p_tenant_id UUID, p_plan_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_catalog
AS $$
DECLARE
  v_plan subscription_plans%ROWTYPE;
  v_role_claim TEXT;
BEGIN
  BEGIN
    v_role_claim := current_setting('request.jwt.claim.role', true);
  EXCEPTION
    WHEN OTHERS THEN
      v_role_claim := NULL;
  END;

  IF COALESCE(v_role_claim, '') <> 'service_role' AND NOT public.is_platform_owner() THEN
    RAISE EXCEPTION 'Access denied: platform owner only' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_plan
  FROM subscription_plans
  WHERE slug = p_plan_slug
    AND is_active = true
    AND is_trial = false;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  UPDATE tenants
  SET
    subscription_status = 'ACTIVE',
    subscription_plan = v_plan.slug,
    subscription_start_date = CURRENT_DATE,
    subscription_end_date = CURRENT_DATE + INTERVAL '30 days',
    max_users = v_plan.max_users,
    max_patients = v_plan.max_patients,
    updated_at = NOW()
  WHERE id = p_tenant_id;

  RETURN FOUND;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_platform_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_owner() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.activate_subscription(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_subscription(UUID, TEXT) TO authenticated;

COMMIT;
