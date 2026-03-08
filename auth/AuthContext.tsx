/**
 * Auth Context with Multi-Clinic Support.
 *
 * Security model:
 * - Source of truth is Supabase Auth session.
 * - No custom token/session emulation in sessionStorage.
 * - User profile is loaded from database for RBAC + clinic context.
 */

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import type { Session as SupabaseSession, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { Permission, UserRole, UserStatus } from './types';
import { ROLE_PERMISSIONS } from '../utils/permissions';
import { applyBranchSession, resetBranchSessionCache } from '../services/branchSessionService';
import type {
  User,
  LoginCredentials,
  Clinic,
  ClinicBranch,
  UserClinicAccess,
  ClinicSettings,
  ClinicPermission,
  AuthStateWithClinic,
  AuthContextTypeWithClinic,
} from './types';

type DBUserProfile = {
  id: string;
  auth_id?: string | null;
  tenant_id?: string | null;
  username?: string | null;
  email?: string | null;
  role?: string | null;
  status?: string | null;
  custom_permissions?: Permission[] | null;
  override_permissions?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type TenantAccessValidation = {
  isValid: boolean;
  message?: string;
};

const formatDateForMessage = (value?: string | null): string => {
  if (!value) return 'an unknown date';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const buildTenantAccessDeniedMessage = (
  status?: string | null,
  trialEndDate?: string | null,
  subscriptionEndDate?: string | null,
): string => {
  const normalizedStatus = String(status || '').toUpperCase();

  if (normalizedStatus === 'TRIAL') {
    if (trialEndDate) {
      return `Your trial period ended on ${formatDateForMessage(trialEndDate)}. Please renew your subscription to continue.`;
    }
    return 'Your trial period has ended. Please renew your subscription to continue.';
  }

  if (normalizedStatus === 'ACTIVE') {
    if (subscriptionEndDate) {
      return `Your subscription expired on ${formatDateForMessage(subscriptionEndDate)}. Please renew your subscription to continue.`;
    }
    return 'Your subscription is inactive. Please contact your administrator.';
  }

  if (normalizedStatus === 'SUSPENDED') {
    return 'Your subscription is suspended. Please contact your administrator.';
  }

  if (normalizedStatus === 'CANCELLED') {
    return 'Your subscription was cancelled. Please contact your administrator.';
  }

  if (normalizedStatus === 'EXPIRED') {
    return 'Your subscription has expired. Please renew your subscription to continue.';
  }

  return 'Your subscription is inactive. Please contact your administrator.';
};

const normalizeLoginErrorMessage = (error: unknown): string => {
  const rawMessage = String((error as any)?.message || '').trim();
  if (!rawMessage) {
    return 'Login failed. Please try again.';
  }

  const message = rawMessage.toLowerCase();
  const code = String((error as any)?.code || '').toLowerCase();

  if (
    message.includes('trial period') ||
    message.includes('subscription expired') ||
    message.includes('subscription is inactive') ||
    message.includes('subscription was cancelled') ||
    message.includes('subscription is suspended')
  ) {
    return rawMessage;
  }

  if (
    code === 'invalid_credentials' ||
    message.includes('invalid login credentials') ||
    message.includes('invalid username or password') ||
    message.includes('invalid email or password')
  ) {
    return 'Invalid email/username or password.';
  }

  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return 'Please verify your email address before signing in.';
  }

  if (message.includes('too many requests') || code === 'over_request_rate_limit') {
    return 'Too many login attempts. Please try again in a few minutes.';
  }

  return rawMessage;
};

const EMPTY_AUTH_STATE: AuthStateWithClinic = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  permissions: [],
  customPermissions: [],
  overrideMode: false,
  role: null,
  currentClinic: null,
  currentBranch: null,
  accessibleClinics: [],
  clinicSettings: null,
  isLoadingClinics: false,
  isSwitchingClinic: false,
};

const AUTH_OP_TIMEOUT_MS = 20000;
let clinicSettingsTableMissing = false;
type DbObjectState = 'unknown' | 'available' | 'missing';
let userClinicAccessTableState: DbObjectState = 'unknown';
let userClinicsTableState: DbObjectState = 'unknown';
let tenantLinkRpcState: DbObjectState = 'unknown';
let warnedMissingTenantLinkRpc = false;

const isMissingDbObjectError = (error: any, objectName: string): boolean => {
  if (!error) return false;
  const code = String(error.code || '');
  const message = String(error.message || '').toLowerCase();
  const target = objectName.toLowerCase();
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    message.includes('could not find the table') ||
    (message.includes('does not exist') && message.includes(target))
  );
};

const isMissingRpcFunctionError = (error: any, functionName: string): boolean => {
  if (!error) return false;
  const code = String(error.code || '').toUpperCase();
  const message = String(error.message || '').toLowerCase();
  const target = functionName.toLowerCase();
  return (
    code === 'PGRST202' ||
    code === '42883' ||
    message.includes('could not find the function') ||
    (message.includes('function') && message.includes(target) && message.includes('does not exist'))
  );
};

const isBranchAccessDeniedError = (error: unknown): boolean => {
  const message = String((error as any)?.message || '').toLowerCase();
  return message.includes('access denied to branch');
};

const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  return await new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise
      .then(value => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

const ROLE_VALUES = new Set<string>(Object.values(UserRole));
const STATUS_VALUES = new Set<string>(Object.values(UserStatus));

const normalizeRole = (role?: string | null): UserRole => {
  const value = (role || '').toUpperCase();
  return (ROLE_VALUES.has(value) ? value : UserRole.DOCTOR) as UserRole;
};

const normalizeStatus = (status?: string | null): UserStatus => {
  const value = (status || '').toUpperCase();
  return (STATUS_VALUES.has(value) ? value : UserStatus.ACTIVE) as UserStatus;
};

const toDate = (value?: string | null): Date => {
  if (!value) return new Date();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
};

const usernameFromEmail = (email?: string | null): string => {
  if (!email) return `user_${Math.random().toString(36).slice(2, 10)}`;
  const base = email.split('@')[0]?.trim();
  return base || `user_${Math.random().toString(36).slice(2, 10)}`;
};

const extractTenantIdFromPayload = (payload: unknown): string | null => {
  if (!payload) return null;
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    return trimmed || null;
  }
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const fromArray = extractTenantIdFromPayload(item);
      if (fromArray) return fromArray;
    }
    return null;
  }
  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    for (const key of ['tenant_id', 'current_user_tenant_id', 'clinic_tenant_id']) {
      const value = obj[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return null;
};

const uniquePermissions = (permissions: Permission[]): Permission[] => {
  return Array.from(new Set(permissions));
};

const fetchRolePermissionsFromDB = async (role: UserRole): Promise<Permission[]> => {
  if (!supabase) {
    return ROLE_PERMISSIONS[role] || [];
  }

  try {
    let rolePermissions: Permission[] = [];
    const { data: roleRow } = await supabase.from('roles').select('id').eq('name', role).maybeSingle();
    if (roleRow?.id) {
      const { data: rolePermsById } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role_id', roleRow.id);
      rolePermissions = (rolePermsById || []).map((rp: any) => rp.permission as Permission);
    }

    if (rolePermissions.length > 0) {
      return uniquePermissions(rolePermissions);
    }
  } catch (error) {
    console.error('Error fetching role permissions:', error);
  }

  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Get user permissions from database.
 */
const fetchUserPermissionsFromDB = async (
  userId: string,
  context?: { role: UserRole; customPermissions: Permission[]; overrideMode: boolean },
): Promise<Permission[]> => {
  if (!supabase) {
    if (!context) return [];
    if (context.role === UserRole.ADMIN) return Object.values(Permission);
    if (context.overrideMode) return uniquePermissions(context.customPermissions);
    return uniquePermissions([...(ROLE_PERMISSIONS[context.role] || []), ...context.customPermissions]);
  }

  try {
    let role: UserRole;
    let customPermissions: Permission[];
    let overrideMode: boolean;

    if (context) {
      role = context.role;
      customPermissions = context.customPermissions;
      overrideMode = context.overrideMode;
    } else {
      const { data: user, error: userError } = await supabase
        .from('user_profiles')
        .select('role, custom_permissions, override_permissions')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return [];
      }

      role = normalizeRole(user.role as string);
      customPermissions = (user.custom_permissions || []) as Permission[];
      overrideMode = user.override_permissions === true;
    }

    if (role === UserRole.ADMIN) {
      return Object.values(Permission);
    }

    if (overrideMode) {
      return uniquePermissions(customPermissions);
    }

    const rolePermissions = await fetchRolePermissionsFromDB(role);

    return uniquePermissions([...rolePermissions, ...customPermissions]);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return [];
  }
};

const fetchUserPermissionContextFromDB = async (
  userId: string,
): Promise<{ role: UserRole; customPermissions: Permission[]; overrideMode: boolean } | null> => {
  if (!supabase || !userId) return null;

  try {
    const profileById = await supabase
      .from('user_profiles')
      .select('role, custom_permissions, override_permissions')
      .eq('id', userId)
      .maybeSingle();

    let row: any = profileById.data;
    if (profileById.error || !row) {
      const profileByAuthId = await supabase
        .from('user_profiles')
        .select('role, custom_permissions, override_permissions')
        .eq('auth_id', userId)
        .maybeSingle();
      if (!profileByAuthId.error && profileByAuthId.data) {
        row = profileByAuthId.data;
      }
    }

    if (!row) return null;

    return {
      role: normalizeRole(row.role),
      customPermissions: (row.custom_permissions || []) as Permission[],
      overrideMode: row.override_permissions === true,
    };
  } catch (error) {
    console.error('Error fetching user permission context:', error);
    return null;
  }
};

const mapAccessRowToUserClinic = (
  row: any,
  clinicName?: string | null,
  branchName?: string | null,
): UserClinicAccess => ({
  id: row.id,
  userId: row.user_id,
  clinicId: row.clinic_id,
  clinicName: clinicName || row.clinic_name,
  branchId: row.branch_id,
  branchName: branchName || row.branch_name,
  roleAtClinic: normalizeRole(row.role_at_clinic),
  customPermissions: row.custom_permissions || [],
  isDefault: row.is_default === true,
  isActive: row.access_active === true || row.is_active === true || row.access_active == null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by,
});

const mergeUserClinicAccessRows = (rows: UserClinicAccess[]): UserClinicAccess[] => {
  const merged = new Map<string, UserClinicAccess>();

  for (const row of rows) {
    const key = `${row.clinicId}::${row.branchId || 'all'}::${row.roleAtClinic || ''}`;
    const prev = merged.get(key);
    if (!prev) {
      merged.set(key, row);
      continue;
    }

    merged.set(key, {
      ...prev,
      ...row,
      clinicName: row.clinicName || prev.clinicName,
      branchName: row.branchName || prev.branchName,
      customPermissions:
        row.customPermissions && row.customPermissions.length > 0
          ? row.customPermissions
          : prev.customPermissions,
      isDefault: prev.isDefault || row.isDefault,
      isActive: prev.isActive || row.isActive,
    });
  }

  return Array.from(merged.values())
    .filter((row) => row.isActive)
    .sort((a, b) => {
      if (a.isDefault === b.isDefault) {
        return String(a.clinicName || '').localeCompare(String(b.clinicName || ''));
      }
      return a.isDefault ? -1 : 1;
    });
};

const expandClinicWideAccessToBranches = async (rows: UserClinicAccess[]): Promise<UserClinicAccess[]> => {
  if (!supabase || rows.length === 0) return rows;

  const clinicWideByClinic = new Map<string, UserClinicAccess>();
  const existingBranchKeys = new Set<string>();

  for (const row of rows) {
    if (!row?.clinicId) continue;
    if (row.branchId) {
      existingBranchKeys.add(`${row.clinicId}::${row.branchId}`);
      continue;
    }
    if (!clinicWideByClinic.has(row.clinicId)) {
      clinicWideByClinic.set(row.clinicId, row);
    }
  }

  if (clinicWideByClinic.size === 0) return rows;

  const clinicIds = Array.from(clinicWideByClinic.keys());
  const { data: branchesData, error } = await supabase
    .from('clinic_branches')
    .select('id,clinic_id,name,is_active')
    .in('clinic_id', clinicIds)
    .eq('is_active', true);

  if (error || !branchesData || branchesData.length === 0) {
    return rows;
  }

  const syntheticRows: UserClinicAccess[] = [];
  const nowIso = new Date().toISOString();

  for (const branch of branchesData as any[]) {
    const clinicId = branch.clinic_id as string;
    const branchId = branch.id as string;
    const branchKey = `${clinicId}::${branchId}`;

    if (existingBranchKeys.has(branchKey)) continue;

    const base = clinicWideByClinic.get(clinicId);
    if (!base) continue;

    syntheticRows.push({
      ...base,
      id: `${base.id || clinicId}-synthetic-${branchId}`,
      branchId,
      branchName: branch.name || `Branch ${String(branchId).slice(0, 8)}`,
      isDefault: false,
      createdAt: base.createdAt || nowIso,
      updatedAt: base.updatedAt || nowIso,
    });
  }

  return [...rows, ...syntheticRows];
};

const fetchUserClinicsDirectFromTables = async (userIds: string[]): Promise<UserClinicAccess[]> => {
  if (!supabase || userIds.length === 0) return [];

  const rawRows: any[] = [];

  if (userClinicAccessTableState !== 'missing') {
    const ucaRes = await supabase
      .from('user_clinic_access')
      .select(
        'id,user_id,clinic_id,branch_id,role_at_clinic,custom_permissions,is_default,is_active,created_at,updated_at,created_by',
      )
      .in('user_id', userIds)
      .eq('is_active', true);

    if (ucaRes.error) {
      if (isMissingDbObjectError(ucaRes.error, 'user_clinic_access')) {
        userClinicAccessTableState = 'missing';
      }
    } else {
      userClinicAccessTableState = 'available';
      if (ucaRes.data) rawRows.push(...ucaRes.data);
    }
  }

  if (userClinicsTableState !== 'missing') {
    const ucRes = await supabase
      .from('user_clinics')
      .select(
        'id,user_id,clinic_id,branch_id,role_at_clinic,custom_permissions,is_default,access_active,created_at,updated_at,created_by',
      )
      .in('user_id', userIds)
      .eq('access_active', true);

    if (ucRes.error) {
      if (isMissingDbObjectError(ucRes.error, 'user_clinics')) {
        userClinicsTableState = 'missing';
      }
    } else {
      userClinicsTableState = 'available';
      if (ucRes.data) rawRows.push(...ucRes.data);
    }
  }

  if (rawRows.length === 0) return [];

  const clinicIds = Array.from(new Set(rawRows.map((r) => r.clinic_id).filter(Boolean)));
  const branchIds = Array.from(new Set(rawRows.map((r) => r.branch_id).filter(Boolean)));

  const clinicMap = new Map<string, { name?: string | null; status?: string | null }>();
  const branchMap = new Map<string, { name?: string | null }>();

  if (clinicIds.length > 0) {
    const { data: clinicsData } = await supabase
      .from('clinics')
      .select('id,name,status')
      .in('id', clinicIds);
    (clinicsData || []).forEach((c: any) => {
      clinicMap.set(c.id, { name: c.name, status: c.status });
    });
  }

  if (branchIds.length > 0) {
    const { data: branchesData } = await supabase
      .from('clinic_branches')
      .select('id,name,is_active')
      .in('id', branchIds);
    (branchesData || []).forEach((b: any) => {
      if (b.is_active === false) return;
      branchMap.set(b.id, { name: b.name });
    });
  }

  return rawRows
    .filter((row) => {
      const clinicMeta = clinicMap.get(row.clinic_id);
      if (!clinicMeta) return true;
      return !clinicMeta.status || clinicMeta.status === 'ACTIVE';
    })
    .map((row) =>
      mapAccessRowToUserClinic(
        row,
        clinicMap.get(row.clinic_id)?.name || null,
        branchMap.get(row.branch_id)?.name || null,
      ),
    );
};

/**
 * Fetch user's accessible clinics from database.
 */
const fetchUserClinicsFromDB = async (userId: string, authId?: string | null): Promise<UserClinicAccess[]> => {
  if (!supabase) return [];

  const userIds = Array.from(new Set([userId, authId || null].filter(Boolean) as string[]));

  try {
    let { data, error } = await supabase
      .from('user_clinics_view')
      .select('*')
      .in('user_id', userIds)
      .eq('access_active', true)
      .eq('clinic_status', 'ACTIVE')
      .order('is_default', { ascending: false })
      .order('clinic_name');

    if (error) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('user_clinics_view')
        .select('*')
        .in('user_id', userIds)
        .eq('access_active', true)
        .order('is_default', { ascending: false })
        .order('clinic_name');

      if (fallbackError) {
        const directRows = await fetchUserClinicsDirectFromTables(userIds);
        const mergedFallback = mergeUserClinicAccessRows(directRows);
        const expandedFallback = await expandClinicWideAccessToBranches(mergedFallback);
        return mergeUserClinicAccessRows(expandedFallback);
      }

      data = fallbackData;
    }

    const viewRows = (data || []).map((row: any) => mapAccessRowToUserClinic(row));
    const directRows = await fetchUserClinicsDirectFromTables(userIds);
    const mergedRows = mergeUserClinicAccessRows([...viewRows, ...directRows]);
    const expandedRows = await expandClinicWideAccessToBranches(mergedRows);
    return mergeUserClinicAccessRows(expandedRows);
  } catch (error) {
    console.error('Error fetching user clinics:', error);
    const directRows = await fetchUserClinicsDirectFromTables(userIds);
    const mergedRows = mergeUserClinicAccessRows(directRows);
    const expandedRows = await expandClinicWideAccessToBranches(mergedRows);
    return mergeUserClinicAccessRows(expandedRows);
  }
};

const fetchClinicFromDB = async (clinicId: string): Promise<Clinic | null> => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', clinicId)
      .eq('status', 'ACTIVE')
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      code: data.code,
      description: data.description,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postal_code,
      phone: data.phone,
      email: data.email,
      website: data.website,
      logoUrl: data.logo_url,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
    };
  } catch {
    return null;
  }
};

const fetchBranchFromDB = async (branchId: string): Promise<ClinicBranch | null> => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('clinic_branches')
      .select('*')
      .eq('id', branchId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      clinicId: data.clinic_id,
      name: data.name,
      code: data.code,
      branchType: data.branch_type,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postal_code,
      phone: data.phone,
      email: data.email,
      operatingHours: data.operating_hours,
      isActive: data.is_active,
      isMainBranch: data.is_main_branch,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
    };
  } catch {
    return null;
  }
};

const fetchClinicSettingsFromDB = async (clinicId: string, branchId?: string): Promise<ClinicSettings | null> => {
  if (!supabase) return null;
  if (clinicSettingsTableMissing) return null;

  try {
    let query = supabase.from('clinic_settings').select('*').eq('clinic_id', clinicId);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    } else {
      query = query.is('branch_id', null);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      if (isMissingDbObjectError(error, 'clinic_settings')) {
        clinicSettingsTableMissing = true;
      }
      return null;
    }

    return {
      id: data.id,
      clinicId: data.clinic_id,
      branchId: data.branch_id,
      settings: data.settings || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
    };
  } catch {
    return null;
  }
};

const isTenantAccessValid = async (userId: string): Promise<TenantAccessValidation> => {
  if (!supabase) {
    return {
      isValid: false,
      message: 'Unable to validate subscription status. Please contact support.',
    };
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      return {
        isValid: false,
        message: 'Unable to validate subscription status. Please contact support.',
      };
    }
    if (!profile?.tenant_id) return { isValid: true };

    let rpcValidity: boolean | null = null;

    const { data, error } = await supabase.rpc('get_tenant_info', { p_tenant_id: profile.tenant_id });
    const rpcRow = Array.isArray(data) ? data[0] : data;

    if (!error && rpcRow && typeof rpcRow.is_subscription_valid === 'boolean') {
      rpcValidity = rpcRow.is_subscription_valid === true;
      if (rpcValidity) {
        return { isValid: true };
      }
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('subscription_status, trial_end_date, subscription_end_date')
      .eq('id', profile.tenant_id)
      .maybeSingle();

    if (!tenantError && tenant) {
      const today = new Date().toISOString().split('T')[0];
      const status = String(tenant.subscription_status || '').toUpperCase();

      if (status === 'TRIAL') {
        const isTrialValid = !!tenant.trial_end_date && tenant.trial_end_date >= today;
        return {
          isValid: isTrialValid,
          message: isTrialValid
            ? undefined
            : buildTenantAccessDeniedMessage(status, tenant.trial_end_date, tenant.subscription_end_date),
        };
      }

      if (status === 'ACTIVE') {
        const isSubscriptionValid = !tenant.subscription_end_date || tenant.subscription_end_date >= today;
        return {
          isValid: isSubscriptionValid,
          message: isSubscriptionValid
            ? undefined
            : buildTenantAccessDeniedMessage(status, tenant.trial_end_date, tenant.subscription_end_date),
        };
      }

      return {
        isValid: false,
        message: buildTenantAccessDeniedMessage(status, tenant.trial_end_date, tenant.subscription_end_date),
      };
    }

    if (rpcValidity === false) {
      return {
        isValid: false,
        message: buildTenantAccessDeniedMessage(),
      };
    }

    return {
      isValid: false,
      message: 'Unable to validate subscription status. Please contact support.',
    };
  } catch (error) {
    console.error('Tenant validation failed:', error);
    return {
      isValid: false,
      message: 'Unable to validate subscription status. Please contact support.',
    };
  }
};

const mapProfileToUser = (
  profile: DBUserProfile,
  authUser: SupabaseUser,
  permissions: Permission[],
  customPermissions: Permission[],
  overrideMode: boolean,
): User => {
  const role = normalizeRole(profile.role);
  const status = normalizeStatus(profile.status);

  return {
    id: profile.id,
    user_id: profile.id,
    auth_id: profile.auth_id || authUser.id,
    dentist_id: (profile as any)?.dentist_id || null,
    email: profile.email || authUser.email,
    username: profile.username || usernameFromEmail(profile.email || authUser.email),
    role,
    status,
    custom_permissions: customPermissions,
    override_permissions: overrideMode,
    permissions,
    firstName: undefined,
    lastName: undefined,
    phone: undefined,
    avatar_url: undefined,
    lastLogin: undefined,
    createdAt: toDate(profile.created_at),
    updatedAt: toDate(profile.updated_at),
  };
};

const AuthContext = createContext<AuthContextTypeWithClinic | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthStateWithClinic>({
    ...EMPTY_AUTH_STATE,
    isLoading: true,
  });

  const clearAuthState = useCallback(() => {
    localStorage.removeItem('currentClinicId');
    localStorage.removeItem('currentBranchId');
    resetBranchSessionCache();
    void applyBranchSession(null, true).catch((error) => {
      console.warn('Failed to clear branch session context:', error);
    });
    setAuthState({ ...EMPTY_AUTH_STATE, isLoading: false });
  }, []);

  const tryLinkCurrentUserTenantContext = useCallback(
    async (preferredTenantId?: string | null): Promise<string | null> => {
      if (!supabase) return null;
      if (tenantLinkRpcState === 'missing') return null;

      try {
        const { data, error } = await supabase.rpc('link_current_user_tenant_context', {
          p_preferred_tenant_id: preferredTenantId ?? null,
        });

        if (error) {
          if (isMissingRpcFunctionError(error, 'link_current_user_tenant_context')) {
            tenantLinkRpcState = 'missing';
            if (!warnedMissingTenantLinkRpc) {
              warnedMissingTenantLinkRpc = true;
              console.warn('Tenant link RPC is missing. Apply migration 048_link_current_user_tenant_context.sql.');
            }
            return null;
          }
          return null;
        }

        tenantLinkRpcState = 'available';
        return extractTenantIdFromPayload(data);
      } catch {
        return null;
      }
    },
    []
  );

  const ensureUserProfile = useCallback(async (authUser: SupabaseUser): Promise<DBUserProfile | null> => {
    if (!supabase) return null;

    const { data: byId, error: selectError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    const now = new Date().toISOString();

    let existing = byId as DBUserProfile | null;
    if (!existing) {
      const { data: byAuthId, error: byAuthIdError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle();
      if (!byAuthIdError && byAuthId) {
        existing = byAuthId as DBUserProfile;
      }
    }

    let tenantFromUsers: string | null = null;
    try {
      const { data: usersRow, error: usersError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', authUser.id)
        .maybeSingle();
      if (!usersError && usersRow && typeof (usersRow as any).tenant_id === 'string') {
        tenantFromUsers = (usersRow as any).tenant_id as string;
      }
    } catch {
      tenantFromUsers = null;
    }

    if (!tenantFromUsers) {
      const linkedTenantId = await tryLinkCurrentUserTenantContext(null);
      if (linkedTenantId) {
        tenantFromUsers = linkedTenantId;
      }
    }

    if (existing) {
      if (!existing.tenant_id) {
        const linkedTenantId = await tryLinkCurrentUserTenantContext(tenantFromUsers || null);
        if (linkedTenantId) {
          existing = { ...(existing as DBUserProfile), tenant_id: linkedTenantId };
        }
      }

      const patch: Record<string, unknown> = {};
      if ((existing as any).auth_id !== authUser.id) patch.auth_id = authUser.id;
      if (authUser.email && existing.email !== authUser.email) patch.email = authUser.email;
      if (!existing.username) patch.username = usernameFromEmail(authUser.email);
      let patchApplied = false;

      if (Object.keys(patch).length > 0) {
        const { error: updateErr } = await supabase.from('user_profiles').update(patch).eq('id', existing.id);
        if (updateErr) {
          console.warn('Failed to patch profile columns:', updateErr.message);
        } else {
          patchApplied = true;
        }
      }

      if (patchApplied) {
        return {
          ...(existing as DBUserProfile),
          ...(patch as Partial<DBUserProfile>),
        };
      }

      return existing as DBUserProfile;
    }

    const basePayload = {
      id: authUser.id,
      username: usernameFromEmail(authUser.email),
      email: authUser.email || null,
      role: 'DOCTOR',
      status: 'ACTIVE',
      tenant_id: tenantFromUsers,
      created_at: now,
      updated_at: now,
    } as Record<string, unknown>;

    const attempts: Record<string, unknown>[] = [
      { ...basePayload, auth_id: authUser.id },
      { ...basePayload },
      {
        id: authUser.id,
        username: usernameFromEmail(authUser.email),
        role: 'DOCTOR',
        status: 'ACTIVE',
      },
    ];

    for (const payload of attempts) {
      const { data: inserted, error: insertError } = await supabase
        .from('user_profiles')
        .insert(payload)
        .select('*')
        .maybeSingle();

      if (!insertError && inserted) {
        return inserted as DBUserProfile;
      }
    }

    const { data: fallbackById } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();
    if (fallbackById) {
      return fallbackById as DBUserProfile;
    }

    const { data: fallbackByAuthId } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('auth_id', authUser.id)
      .maybeSingle();
    return (fallbackByAuthId as DBUserProfile) || null;
  }, []);

  const hydrateFromSession = useCallback(
    async (
      session: SupabaseSession | null,
      isActive: () => boolean = () => true,
      options: { throwOnError?: boolean } = {},
    ) => {
      const throwOnError = options.throwOnError === true;
      if (!isActive()) return;

      if (!supabase || !session?.user) {
        clearAuthState();
        if (throwOnError) {
          throw new Error('No active session found.');
        }
        return;
      }

      setAuthState(prev => ({ ...prev, isLoading: true }));

      try {
        const authUser = session.user;
        const profile = await ensureUserProfile(authUser);

        if (!profile?.id) {
          clearAuthState();
          if (throwOnError) {
            throw new Error('Unable to load your user profile.');
          }
          return;
        }

        const tenantAccess = await isTenantAccessValid(profile.id);
        if (!tenantAccess.isValid) {
          await supabase.auth.signOut();
          clearAuthState();
          throw new Error(tenantAccess.message || buildTenantAccessDeniedMessage());
        }

        const accessibleClinics = await fetchUserClinicsFromDB(profile.id, authUser.id);

        const preferredClinicId = localStorage.getItem('currentClinicId');
        const preferredBranchId = localStorage.getItem('currentBranchId');

        const selectedAccess =
          accessibleClinics.find(
            c => c.clinicId === preferredClinicId && (!preferredBranchId || c.branchId === preferredBranchId),
          ) ||
          accessibleClinics.find(c => c.isDefault) ||
          accessibleClinics[0];

        const profileRole = normalizeRole(profile.role);
        const role =
          profileRole === UserRole.ADMIN
            ? UserRole.ADMIN
            : normalizeRole(selectedAccess?.roleAtClinic || profile.role);
        const mergedCustomPermissions = uniquePermissions([
          ...((profile.custom_permissions || []) as Permission[]),
          ...((selectedAccess?.customPermissions || []) as Permission[]),
        ]);
        const overrideMode = profile.override_permissions === true;
        const permissions = await fetchUserPermissionsFromDB(profile.id, {
          role,
          customPermissions: mergedCustomPermissions,
          overrideMode,
        });

        let currentClinic: Clinic | null = null;
        let currentBranch: ClinicBranch | null = null;

        if (selectedAccess?.clinicId) {
          currentClinic = await fetchClinicFromDB(selectedAccess.clinicId);
          if (selectedAccess.branchId) {
            currentBranch = await fetchBranchFromDB(selectedAccess.branchId);
          }
        }

        if (currentBranch?.id) {
          try {
            await applyBranchSession(currentBranch.id, true);
          } catch (error) {
            if (!isBranchAccessDeniedError(error)) {
              throw error;
            }
            console.warn('Branch session denied during hydration, falling back to clinic-level context:', error);
            currentBranch = null;
            localStorage.removeItem('currentBranchId');
            await applyBranchSession(null, true);
          }
        } else {
          await applyBranchSession(null, true);
        }

        const clinicSettings = currentClinic ? await fetchClinicSettingsFromDB(currentClinic.id, currentBranch?.id) : null;

        if (currentClinic?.id) {
          localStorage.setItem('currentClinicId', currentClinic.id);
        }
        if (currentBranch?.id) {
          localStorage.setItem('currentBranchId', currentBranch.id);
        } else {
          localStorage.removeItem('currentBranchId');
        }

        const status = normalizeStatus(profile.status);
        const user = mapProfileToUser(
          {
            ...profile,
            role,
            status,
          },
          authUser,
          permissions,
          mergedCustomPermissions,
          overrideMode,
        );

        if (!isActive()) return;

        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user,
          permissions,
          customPermissions: mergedCustomPermissions,
          overrideMode,
          role,
          token: session.access_token,
          currentClinic,
          currentBranch,
          accessibleClinics,
          clinicSettings,
          isLoadingClinics: false,
          isSwitchingClinic: false,
        });
      } catch (error) {
        console.error('Failed to hydrate auth state:', error);
        if (!isActive()) return;
        clearAuthState();
        if (throwOnError) {
          throw error instanceof Error ? error : new Error('Failed to load your account session.');
        }
      }
    },
    [clearAuthState, ensureUserProfile],
  );

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        if (!supabase) {
          clearAuthState();
          return;
        }

        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_OP_TIMEOUT_MS,
          'auth.getSession',
        );
        if (error) {
          throw error;
        }

        await hydrateFromSession(data.session, () => active);
      } catch (error) {
        console.error('Auth init failed:', error);
        if (!active) return;
        clearAuthState();
      }
    };

    init();

    if (!supabase) {
      return () => {
        active = false;
      };
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Do not await heavy async work directly in this callback to avoid auth lock contention.
      setTimeout(async () => {
        try {
          await hydrateFromSession(session, () => active);
        } catch (error) {
          console.error('Auth state change hydration failed:', error);
          if (!active) return;
          clearAuthState();
        }
      }, 0);
    });

    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
    };
  }, [clearAuthState, hydrateFromSession]);

  // Guard against indefinite loading due network/auth edge cases.
  useEffect(() => {
    if (!authState.isLoading) return;

    const timer = setTimeout(() => {
      setAuthState(prev => {
        if (!prev.isLoading) return prev;
        return { ...prev, isLoading: false };
      });
    }, AUTH_OP_TIMEOUT_MS + 3000);

    return () => clearTimeout(timer);
  }, [authState.isLoading]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const identity = credentials.username.trim().toLowerCase();
      let email = identity;

      if (!identity.includes('@')) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('email')
          .ilike('username', identity)
          .maybeSingle();

        if (profileError || !profile?.email) {
          throw new Error('Invalid username or password');
        }

        email = String(profile.email).toLowerCase();
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: credentials.password,
      });

      if (error || !data.session) {
        throw new Error(error?.message || 'Invalid username or password');
      }

      await hydrateFromSession(data.session, () => true, { throwOnError: true });
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw new Error(normalizeLoginErrorMessage(error));
    }
  }, [hydrateFromSession]);

  const logout = useCallback(async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } finally {
      clearAuthState();
    }
  }, [clearAuthState]);

  const refreshSession = useCallback(async () => {
    if (!supabase) {
      clearAuthState();
      return;
    }

    const { data } = await supabase.auth.getSession();
    await hydrateFromSession(data.session);
  }, [clearAuthState, hydrateFromSession]);

  const switchClinic = useCallback(
    async (clinicId: string, branchId?: string) => {
      setAuthState(prev => ({ ...prev, isSwitchingClinic: true }));

      try {
        if (!supabase) {
          throw new Error('Database not configured');
        }

        const hasAccess = authState.accessibleClinics.some(
          c => c.clinicId === clinicId && (!branchId || c.branchId === branchId),
        );

        if (!hasAccess) {
          throw new Error('You do not have access to this clinic/branch');
        }

        const clinic = await fetchClinicFromDB(clinicId);
        if (!clinic) {
          throw new Error('Clinic not found');
        }

        let branch: ClinicBranch | null = null;
        if (branchId) {
          branch = await fetchBranchFromDB(branchId);
          if (!branch) {
            throw new Error('Branch not found');
          }
        }

        const clinicSettings = await fetchClinicSettingsFromDB(clinicId, branchId);

        const scopedAccess = authState.accessibleClinics.find(
          c => c.clinicId === clinicId && (!branchId || c.branchId === branchId),
        );
        const permissionContext = authState.user?.id
          ? await fetchUserPermissionContextFromDB(authState.user.id)
          : null;
        const profileRole = permissionContext?.role || authState.user?.role || authState.role || UserRole.DOCTOR;
        const role =
          profileRole === UserRole.ADMIN
            ? UserRole.ADMIN
            : normalizeRole(scopedAccess?.roleAtClinic || profileRole);
        const customPermissions = uniquePermissions([
          ...((permissionContext?.customPermissions || []) as Permission[]),
          ...((scopedAccess?.customPermissions || []) as Permission[]),
        ]);
        const overrideMode = permissionContext?.overrideMode ?? authState.overrideMode;
        const permissions = authState.user?.id
          ? await fetchUserPermissionsFromDB(authState.user.id, {
              role,
              customPermissions,
              overrideMode,
            })
          : authState.permissions;

        localStorage.setItem('currentClinicId', clinic.id);
        if (branch?.id) {
          localStorage.setItem('currentBranchId', branch.id);
        } else {
          localStorage.removeItem('currentBranchId');
        }
        await applyBranchSession(branch?.id || null, true);

        setAuthState(prev => ({
          ...prev,
          role,
          permissions,
          customPermissions,
          overrideMode,
          user: prev.user
            ? {
                ...prev.user,
                role,
                custom_permissions: customPermissions,
                override_permissions: overrideMode,
                permissions,
              }
            : prev.user,
          currentClinic: clinic,
          currentBranch: branch,
          clinicSettings,
          isSwitchingClinic: false,
        }));
      } catch (error) {
        setAuthState(prev => ({ ...prev, isSwitchingClinic: false }));
        throw error;
      }
    },
    [authState.accessibleClinics, authState.permissions, authState.overrideMode, authState.role, authState.user],
  );

  const switchBranch = useCallback(
    async (branchId: string) => {
      if (!authState.currentClinic) {
        throw new Error('No clinic selected');
      }
      return switchClinic(authState.currentClinic.id, branchId);
    },
    [authState.currentClinic, switchClinic],
  );

  const refreshClinics = useCallback(async () => {
    if (!authState.user?.id || !supabase) return;

    setAuthState(prev => ({ ...prev, isLoadingClinics: true }));

    try {
      const accessibleClinics = await fetchUserClinicsFromDB(
        authState.user.id,
        (authState.user as any)?.auth_id || authState.user.id,
      );

      setAuthState(prev => ({
        ...prev,
        accessibleClinics,
        isLoadingClinics: false,
      }));
    } catch (error) {
      console.error('Error refreshing clinics:', error);
      setAuthState(prev => ({ ...prev, isLoadingClinics: false }));
    }
  }, [authState.user?.id]);

  const hasClinicPermission = useCallback(
    (permission: ClinicPermission): boolean => {
      const mappedPermission = (() => {
        switch (permission) {
          case ClinicPermission.CLINIC_VIEW:
            return Permission.SETTINGS_VIEW;
          case ClinicPermission.CLINIC_CREATE:
          case ClinicPermission.CLINIC_UPDATE:
          case ClinicPermission.CLINIC_DELETE:
          case ClinicPermission.CLINIC_MANAGE_SETTINGS:
            return Permission.SETTINGS_EDIT;
          case ClinicPermission.BRANCH_VIEW:
            return Permission.CLINIC_BRANCH_VIEW;
          case ClinicPermission.BRANCH_CREATE:
            return Permission.CLINIC_BRANCH_CREATE;
          case ClinicPermission.BRANCH_UPDATE:
          case ClinicPermission.BRANCH_MANAGE_HOURS:
            return Permission.CLINIC_BRANCH_EDIT;
          case ClinicPermission.BRANCH_DELETE:
            return Permission.CLINIC_BRANCH_DELETE;
          case ClinicPermission.USER_CLINIC_ASSIGN:
          case ClinicPermission.USER_CLINIC_REMOVE:
          case ClinicPermission.USER_CLINIC_UPDATE_ROLE:
            return Permission.USER_MANAGEMENT_EDIT;
          default:
            return null;
        }
      })();

      if (!mappedPermission) return false;
      return authState.permissions.includes(mappedPermission);
    },
    [authState.permissions],
  );

  const hasClinicAccess = useCallback(
    (clinicId: string): boolean => {
      return authState.accessibleClinics.some(c => c.clinicId === clinicId && c.isActive);
    },
    [authState.accessibleClinics],
  );

  const hasBranchAccess = useCallback(
    (branchId: string): boolean => {
      return authState.accessibleClinics.some(c => c.branchId === branchId && c.isActive);
    },
    [authState.accessibleClinics],
  );

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return authState.permissions.includes(permission);
    },
    [authState.permissions],
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => permissions.some(p => authState.permissions.includes(p)),
    [authState.permissions],
  );

  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => permissions.every(p => authState.permissions.includes(p)),
    [authState.permissions],
  );

  const hasRole = useCallback((role: UserRole): boolean => authState.role === role, [authState.role]);

  const hasCustomPermission = useCallback(
    (permission: Permission): boolean => authState.customPermissions?.includes(permission) || false,
    [authState.customPermissions],
  );

  const loginWithGoogle = useCallback(async () => {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      throw error;
    }
  }, []);

  const loginWithFacebook = useCallback(async () => {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      throw error;
    }
  }, []);

  const value: AuthContextTypeWithClinic = {
    login,
    logout,
    refreshSession,
    loginWithGoogle,
    loginWithFacebook,

    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasCustomPermission,
    checkPermission: hasPermission,
    checkAnyPermission: hasAnyPermission,
    checkAllPermissions: hasAllPermissions,
    checkCustomPermission: hasCustomPermission,

    isAdmin: authState.role?.toUpperCase() === 'ADMIN',
    user: authState.user,
    userProfile: authState.user,
    isLoading: authState.isLoading,
    loading: authState.isLoading,

    currentClinic: authState.currentClinic,
    currentBranch: authState.currentBranch,
    accessibleClinics: authState.accessibleClinics,
    clinicSettings: authState.clinicSettings,
    isLoadingClinics: authState.isLoadingClinics,
    isSwitchingClinic: authState.isSwitchingClinic,

    switchClinic,
    switchBranch,
    refreshClinics,
    hasClinicPermission,
    hasClinicAccess,
    hasBranchAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextTypeWithClinic => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      login: async () => {},
      loginWithGoogle: async () => {},
      loginWithFacebook: async () => {},
      logout: async () => {},
      refreshSession: async () => {},
      hasPermission: () => false,
      hasAnyPermission: () => false,
      hasAllPermissions: () => false,
      hasRole: () => false,
      hasCustomPermission: () => false,
      checkPermission: () => false,
      checkAnyPermission: () => false,
      checkAllPermissions: () => false,
      checkCustomPermission: () => false,
      isAdmin: false,
      user: null,
      userProfile: null,
      isLoading: true,
      loading: true,
      currentClinic: null,
      currentBranch: null,
      accessibleClinics: [],
      clinicSettings: null,
      isLoadingClinics: true,
      isSwitchingClinic: false,
      switchClinic: async () => {},
      switchBranch: async () => {},
      refreshClinics: async () => {},
      hasClinicPermission: () => false,
      hasClinicAccess: () => false,
      hasBranchAccess: () => false,
    };
  }
  return context;
};
