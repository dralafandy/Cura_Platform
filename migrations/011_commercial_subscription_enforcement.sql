-- ============================================================================
-- Commercial Subscription Enforcement
-- ============================================================================
-- Purpose:
-- - Complete missing subscription RPC functions
-- - Enforce 14-day trial and paid subscription validity checks
-- - Provide reusable functions for frontend checks
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure trial end date is always set to 14 days by default
ALTER TABLE tenants
  ALTER COLUMN trial_start_date SET DEFAULT CURRENT_DATE;

UPDATE tenants
SET trial_end_date = COALESCE(trial_end_date, trial_start_date + 14)
WHERE trial_end_date IS NULL;

-- Keep subscription status in sync with trial/subscription dates
CREATE OR REPLACE FUNCTION refresh_tenant_subscription_status(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant tenants%ROWTYPE;
  v_new_status TEXT;
BEGIN
  SELECT *
  INTO v_tenant
  FROM tenants
  WHERE id = p_tenant_id;

  IF NOT FOUND THEN
    RETURN 'NOT_FOUND';
  END IF;

  v_new_status := v_tenant.subscription_status;

  IF v_tenant.subscription_status = 'TRIAL'
     AND v_tenant.trial_end_date IS NOT NULL
     AND v_tenant.trial_end_date < CURRENT_DATE THEN
    v_new_status := 'EXPIRED';
  ELSIF v_tenant.subscription_status = 'ACTIVE'
        AND v_tenant.subscription_end_date IS NOT NULL
        AND v_tenant.subscription_end_date < CURRENT_DATE THEN
    v_new_status := 'EXPIRED';
  END IF;

  IF v_new_status <> v_tenant.subscription_status THEN
    UPDATE tenants
    SET subscription_status = v_new_status,
        updated_at = NOW()
    WHERE id = p_tenant_id;
  END IF;

  RETURN v_new_status;
END;
$$;

CREATE OR REPLACE FUNCTION is_trial_valid(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status TEXT;
  v_trial_end DATE;
BEGIN
  PERFORM refresh_tenant_subscription_status(p_tenant_id);

  SELECT subscription_status, trial_end_date
  INTO v_status, v_trial_end
  FROM tenants
  WHERE id = p_tenant_id;

  RETURN v_status = 'TRIAL' AND v_trial_end >= CURRENT_DATE;
END;
$$;

CREATE OR REPLACE FUNCTION get_trial_days_remaining(p_tenant_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trial_end DATE;
BEGIN
  SELECT trial_end_date
  INTO v_trial_end
  FROM tenants
  WHERE id = p_tenant_id;

  IF v_trial_end IS NULL THEN
    RETURN 0;
  END IF;

  RETURN GREATEST(0, (v_trial_end - CURRENT_DATE));
END;
$$;

CREATE OR REPLACE FUNCTION get_tenant_info(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  subscription_status TEXT,
  subscription_plan TEXT,
  trial_days_remaining INTEGER,
  is_subscription_valid BOOLEAN,
  max_users INTEGER,
  max_patients INTEGER,
  current_users BIGINT,
  current_patients BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM refresh_tenant_subscription_status(p_tenant_id);

  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.slug,
    t.subscription_status,
    t.subscription_plan,
    get_trial_days_remaining(t.id),
    (
      (t.subscription_status = 'TRIAL' AND COALESCE(t.trial_end_date, CURRENT_DATE - 1) >= CURRENT_DATE)
      OR
      (t.subscription_status = 'ACTIVE' AND COALESCE(t.subscription_end_date, CURRENT_DATE + 1) >= CURRENT_DATE)
    ) AS is_subscription_valid,
    t.max_users,
    t.max_patients,
    (SELECT COUNT(*) FROM user_profiles up WHERE up.tenant_id = t.id AND up.status = 'ACTIVE') AS current_users,
    (SELECT COUNT(*) FROM patients p WHERE p.tenant_id = t.id) AS current_patients
  FROM tenants t
  WHERE t.id = p_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION check_limits(p_tenant_id UUID, p_resource TEXT)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count BIGINT,
  max_limit INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_info RECORD;
BEGIN
  SELECT *
  INTO v_info
  FROM get_tenant_info(p_tenant_id)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0::BIGINT, 0, 'Tenant not found';
    RETURN;
  END IF;

  IF p_resource = 'users' THEN
    RETURN QUERY SELECT
      (v_info.current_users < v_info.max_users),
      v_info.current_users,
      v_info.max_users,
      CASE
        WHEN v_info.current_users >= v_info.max_users THEN 'User limit reached for current plan'
        ELSE 'OK'
      END;
  ELSIF p_resource = 'patients' THEN
    RETURN QUERY SELECT
      (v_info.current_patients < v_info.max_patients),
      v_info.current_patients,
      v_info.max_patients,
      CASE
        WHEN v_info.current_patients >= v_info.max_patients THEN 'Patient limit reached for current plan'
        ELSE 'OK'
      END;
  ELSE
    RETURN QUERY SELECT FALSE, 0::BIGINT, 0, 'Unsupported resource type';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION activate_subscription(p_tenant_id UUID, p_plan_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan subscription_plans%ROWTYPE;
BEGIN
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

CREATE OR REPLACE FUNCTION is_subscription_valid(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_info RECORD;
BEGIN
  SELECT *
  INTO v_info
  FROM get_tenant_info(p_tenant_id)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  RETURN v_info.is_subscription_valid;
END;
$$;
