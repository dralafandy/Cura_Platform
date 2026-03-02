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
  username?: string | null;
  email?: string | null;
  role?: string | null;
  status?: string | null;
  custom_permissions?: Permission[] | null;
  override_permissions?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
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

const AUTH_OP_TIMEOUT_MS = 12000;

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

/**
 * Get user permissions from database.
 */
const fetchUserPermissionsFromDB = async (userId: string): Promise<Permission[]> => {
  if (!supabase) return [];

  try {
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('role, custom_permissions, override_permissions')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return [];
    }

    const role = normalizeRole(user.role as string);

    if (role === UserRole.ADMIN) {
      return Object.values(Permission);
    }

    const customPermissions: Permission[] = (user.custom_permissions || []) as Permission[];
    const overrideMode = user.override_permissions === true;

    if (overrideMode) {
      return customPermissions;
    }

    const { data: rolePerms, error: byRoleNameError } = await supabase
      .from('role_permissions')
      .select('permission')
      .eq('role_name', role);

    let rolePermissions: Permission[] = [];

    if (!byRoleNameError && rolePerms) {
      rolePermissions = rolePerms.map((rp: any) => rp.permission as Permission);
    } else {
      const { data: roleRow } = await supabase.from('roles').select('id').eq('name', role).maybeSingle();
      if (roleRow?.id) {
        const { data: rolePermsById } = await supabase
          .from('role_permissions')
          .select('permission')
          .eq('role_id', roleRow.id);
        rolePermissions = (rolePermsById || []).map((rp: any) => rp.permission as Permission);
      }
    }

    return Array.from(new Set([...rolePermissions, ...customPermissions]));
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return [];
  }
};

/**
 * Fetch user's accessible clinics from database.
 */
const fetchUserClinicsFromDB = async (userId: string): Promise<UserClinicAccess[]> => {
  if (!supabase) return [];

  try {
    let { data, error } = await supabase
      .from('user_clinics_view')
      .select('*')
      .eq('user_id', userId)
      .eq('access_active', true)
      .eq('clinic_status', 'ACTIVE')
      .order('is_default', { ascending: false })
      .order('clinic_name');

    if (error) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('user_clinics_view')
        .select('*')
        .eq('user_id', userId)
        .eq('access_active', true)
        .order('is_default', { ascending: false })
        .order('clinic_name');

      if (fallbackError) {
        return [];
      }

      data = fallbackData;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      clinicId: row.clinic_id,
      clinicName: row.clinic_name,
      branchId: row.branch_id,
      branchName: row.branch_name,
      roleAtClinic: normalizeRole(row.role_at_clinic),
      customPermissions: row.custom_permissions || [],
      isDefault: row.is_default,
      isActive: row.access_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
    }));
  } catch (error) {
    console.error('Error fetching user clinics:', error);
    return [];
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

  try {
    let query = supabase.from('clinic_settings').select('*').eq('clinic_id', clinicId);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    } else {
      query = query.is('branch_id', null);
    }

    const { data, error } = await query.single();

    if (error || !data) {
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

const isTenantAccessValid = async (userId: string): Promise<boolean> => {
  if (!supabase) return true;

  try {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile?.tenant_id) return true;

    const { data, error } = await supabase.rpc('get_tenant_info', { p_tenant_id: profile.tenant_id });

    if (!error && data && data[0]) {
      return data[0].is_subscription_valid === true;
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('subscription_status, trial_end_date, subscription_end_date')
      .eq('id', profile.tenant_id)
      .single();

    if (tenantError || !tenant) return true;

    const today = new Date().toISOString().split('T')[0];
    if (tenant.subscription_status === 'TRIAL') {
      return !!tenant.trial_end_date && tenant.trial_end_date >= today;
    }
    if (tenant.subscription_status === 'ACTIVE') {
      return !tenant.subscription_end_date || tenant.subscription_end_date >= today;
    }

    return false;
  } catch (error) {
    console.error('Tenant validation failed:', error);
    return true;
  }
};

const mapProfileToUser = (profile: DBUserProfile, authUser: SupabaseUser): User => {
  const role = normalizeRole(profile.role);
  const status = normalizeStatus(profile.status);

  return {
    id: profile.id,
    email: profile.email || authUser.email,
    username: profile.username || usernameFromEmail(profile.email || authUser.email),
    role,
    status,
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
    setAuthState({ ...EMPTY_AUTH_STATE, isLoading: false });
  }, []);

  const ensureUserProfile = useCallback(async (authUser: SupabaseUser): Promise<DBUserProfile | null> => {
    if (!supabase) return null;

    const { data: existing, error: selectError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    const now = new Date().toISOString();

    if (existing) {
      const patch: Record<string, unknown> = {};
      if ((existing as any).auth_id !== authUser.id) patch.auth_id = authUser.id;
      if (authUser.email && existing.email !== authUser.email) patch.email = authUser.email;
      if (!existing.username) patch.username = usernameFromEmail(authUser.email);

      if (Object.keys(patch).length > 0) {
        const { error: updateErr } = await supabase.from('user_profiles').update(patch).eq('id', authUser.id);
        if (updateErr) {
          console.warn('Failed to patch profile columns:', updateErr.message);
        }
      }

      return {
        ...(existing as DBUserProfile),
        ...(patch as Partial<DBUserProfile>),
      };
    }

    const basePayload = {
      id: authUser.id,
      username: usernameFromEmail(authUser.email),
      email: authUser.email || null,
      role: 'DOCTOR',
      status: 'ACTIVE',
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

    const { data: fallback } = await supabase.from('user_profiles').select('*').eq('id', authUser.id).maybeSingle();
    return (fallback as DBUserProfile) || null;
  }, []);

  const hydrateFromSession = useCallback(
    async (session: SupabaseSession | null, isActive: () => boolean = () => true) => {
      if (!isActive()) return;

      if (!supabase || !session?.user) {
        clearAuthState();
        return;
      }

      setAuthState(prev => ({ ...prev, isLoading: true }));

      try {
        const authUser = session.user;
        const profile = await ensureUserProfile(authUser);

        if (!profile?.id) {
          clearAuthState();
          return;
        }

        const tenantValid = await isTenantAccessValid(profile.id);
        if (!tenantValid) {
          await supabase.auth.signOut();
          clearAuthState();
          return;
        }

        const permissions = await fetchUserPermissionsFromDB(profile.id);
        const accessibleClinics = await fetchUserClinicsFromDB(profile.id);

        const preferredClinicId = localStorage.getItem('currentClinicId');
        const preferredBranchId = localStorage.getItem('currentBranchId');

        const selectedAccess =
          accessibleClinics.find(
            c => c.clinicId === preferredClinicId && (!preferredBranchId || c.branchId === preferredBranchId),
          ) ||
          accessibleClinics.find(c => c.isDefault) ||
          accessibleClinics[0];

        let currentClinic: Clinic | null = null;
        let currentBranch: ClinicBranch | null = null;

        if (selectedAccess?.clinicId) {
          currentClinic = await fetchClinicFromDB(selectedAccess.clinicId);
          if (selectedAccess.branchId) {
            currentBranch = await fetchBranchFromDB(selectedAccess.branchId);
          }
        }

        const clinicSettings = currentClinic
          ? await fetchClinicSettingsFromDB(currentClinic.id, currentBranch?.id)
          : null;

        if (currentClinic?.id) {
          localStorage.setItem('currentClinicId', currentClinic.id);
        }
        if (currentBranch?.id) {
          localStorage.setItem('currentBranchId', currentBranch.id);
        } else {
          localStorage.removeItem('currentBranchId');
        }

        const role = normalizeRole(profile.role);
        const status = normalizeStatus(profile.status);
        const user = mapProfileToUser(
          {
            ...profile,
            role,
            status,
          },
          authUser,
        );

        if (!isActive()) return;

        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user,
          permissions,
          customPermissions: (profile.custom_permissions || []) as Permission[],
          overrideMode: profile.override_permissions === true,
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

        await withTimeout(
          hydrateFromSession(data.session, () => active),
          AUTH_OP_TIMEOUT_MS,
          'hydrateFromSession(init)',
        );
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

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        await withTimeout(
          hydrateFromSession(session, () => active),
          AUTH_OP_TIMEOUT_MS,
          'hydrateFromSession(authChange)',
        );
      } catch (error) {
        console.error('Auth state change hydration failed:', error);
        if (!active) return;
        clearAuthState();
      }
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

      await hydrateFromSession(data.session);
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
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

        localStorage.setItem('currentClinicId', clinic.id);
        if (branch?.id) {
          localStorage.setItem('currentBranchId', branch.id);
        } else {
          localStorage.removeItem('currentBranchId');
        }

        setAuthState(prev => ({
          ...prev,
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
    [authState.accessibleClinics],
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
      const accessibleClinics = await fetchUserClinicsFromDB(authState.user.id);

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
      return authState.permissions.includes(permission as unknown as Permission);
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
