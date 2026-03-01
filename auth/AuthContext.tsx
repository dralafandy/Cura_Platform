/**
 * Auth Context with Multi-Clinic Support
 * 
 * Features:
 * - Simple, focused authentication
 * - Session management
 * - Permission checking
 * - Multi-clinic/branch support
 * - Clean architecture
 */

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { Permission, UserRole, UserStatus } from './types'; // Import from auth/types.ts which re-exports from root
import type { 
  User, 
  AuthState, 
  LoginCredentials,
  Clinic,
  ClinicBranch,
  UserClinicAccess,
  ClinicSettings,
  ClinicPermission,
  AuthStateWithClinic,
  AuthContextTypeWithClinic
} from './types';

/**
 * Get user permissions from database
 * Handles role permissions, custom permissions, and override mode
 */
const fetchUserPermissionsFromDB = async (userId: string): Promise<Permission[]> => {
  if (!supabase) return [];
  
  try {
    // Get user's full profile including custom permissions
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('role, custom_permissions, override_permissions')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Error fetching user:', userError);
      return [];
    }

    // ADMIN users get all permissions
    if (user.role === 'ADMIN') {
      // Import all permissions from types
      const allPermissions = Object.values(Permission);
      return allPermissions;
    }

    // Get role permissions from role_permissions table
    const { data: rolePerms } = await supabase
      .from('role_permissions')
      .select('permission')
      .eq('role_name', user.role);

    const rolePermissions: Permission[] = rolePerms?.map(rp => rp.permission) || [];

    // Get custom permissions from user profile
    const customPermissions: Permission[] = user.custom_permissions || [];
    
    // Check if override mode is enabled
    const overrideMode = user.override_permissions === true;

    // If override mode is enabled, only use custom permissions
    if (overrideMode) {
      return customPermissions;
    }

    // Otherwise, combine role permissions with custom permissions
    const combinedPermissions = new Set([...rolePermissions, ...customPermissions]);
    return Array.from(combinedPermissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return [];
  }
};

/**
 * Fetch user's accessible clinics from database
 */
const fetchUserClinicsFromDB = async (userId: string): Promise<UserClinicAccess[]> => {
  if (!supabase) return [];
  
  try {
    // First try with clinic_status filter
    let { data, error } = await supabase
      .from('user_clinics_view')
      .select('*')
      .eq('user_id', userId)
      .eq('access_active', true)
      .eq('clinic_status', 'ACTIVE')
      .order('is_default', { ascending: false })
      .order('clinic_name');

    if (error) {
      console.log('Error fetching with clinic_status, trying alternative query:', error.message);
      
      // Fallback: Try without clinic_status filter (for older database schemas)
      // The view might not have clinic_status column in older versions
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('user_clinics_view')
        .select('*')
        .eq('user_id', userId)
        .eq('access_active', true)
        .order('is_default', { ascending: false })
        .order('clinic_name');
      
      if (fallbackError) {
        console.error('Error fetching user clinics (fallback):', fallbackError);
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
      roleAtClinic: row.role_at_clinic as UserRole,
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

/**
 * Fetch clinic details from database
 */
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
      console.error('Error fetching clinic:', error);
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
  } catch (error) {
    console.error('Error fetching clinic:', error);
    return null;
  }
};

/**
 * Fetch branch details from database
 */
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
      console.error('Error fetching branch:', error);
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
  } catch (error) {
    console.error('Error fetching branch:', error);
    return null;
  }
};

/**
 * Fetch clinic settings from database
 */
const fetchClinicSettingsFromDB = async (clinicId: string, branchId?: string): Promise<ClinicSettings | null> => {
  if (!supabase) return null;
  
  try {
    let query = supabase
      .from('clinic_settings')
      .select('*')
      .eq('clinic_id', clinicId);
    
    if (branchId) {
      query = query.eq('branch_id', branchId);
    } else {
      query = query.is('branch_id', null);
    }
    
    const { data, error } = await query.single();

    if (error || !data) {
      console.error('Error fetching clinic settings:', error);
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
  } catch (error) {
    console.error('Error fetching clinic settings:', error);
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

    const { data, error } = await supabase
      .rpc('get_tenant_info', { p_tenant_id: profile.tenant_id });

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

const AuthContext = createContext<AuthContextTypeWithClinic | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component with Multi-Clinic Support
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthStateWithClinic>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    permissions: [],
    customPermissions: [],
    overrideMode: false,
    role: null,
    // Clinic state
    currentClinic: null,
    currentBranch: null,
    accessibleClinics: [],
    clinicSettings: null,
    isLoadingClinics: false,
    isSwitchingClinic: false,
  });

  /**
   * Initialize auth on mount
   */
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Try to get current session - support both new and legacy keys
      let sessionData = sessionStorage.getItem('clinic_auth_session');
      
      // Also check for legacy key from LoginPage
      if (!sessionData) {
        sessionData = sessionStorage.getItem('clinic_session');
      }
      
      if (sessionData) {
        const session = JSON.parse(sessionData);
        
        // Check if session is valid - support both new format (expiresAt) and legacy format (loginTime)
        const expiresAt = session.expiresAt || (session.loginTime ? new Date(new Date(session.loginTime).getTime() + 24 * 60 * 60 * 1000).toISOString() : null);
        const isValid = expiresAt && new Date(expiresAt) > new Date();
        
        if (isValid) {
          // Refresh permissions from database to get latest custom permissions
          const currentUser = session.user;
          if (currentUser && currentUser.id && supabase) {
            try {
              // Fetch latest user data including custom_permissions
              const { data: userData } = await supabase
                .from('user_profiles')
                .select('role, custom_permissions, override_permissions, tenant_id')
                .eq('id', currentUser.id)
                .single();
              
              if (userData) {
                const tenantValid = await isTenantAccessValid(currentUser.id);
                if (!tenantValid) {
                  sessionStorage.removeItem('clinic_auth_session');
                  sessionStorage.removeItem('clinic_session');
                  setAuthState(prev => ({ ...prev, isLoading: false }));
                  return;
                }

                // Get fresh permissions from database
                const freshPermissions = await fetchUserPermissionsFromDB(currentUser.id);
                
                // Get user's accessible clinics
                const accessibleClinics = await fetchUserClinicsFromDB(currentUser.id);
                
                // Get current clinic from session or use default
                let currentClinic = session.currentClinic;
                let currentBranch = session.currentBranch;
                
                if (!currentClinic && accessibleClinics.length > 0) {
                  // Use default clinic or first available
                  const defaultAccess = accessibleClinics.find(c => c.isDefault) || accessibleClinics[0];
                  currentClinic = await fetchClinicFromDB(defaultAccess.clinicId);
                  if (defaultAccess.branchId) {
                    currentBranch = await fetchBranchFromDB(defaultAccess.branchId);
                  }
                }
                
                // Get clinic settings
                const clinicSettings = currentClinic 
                  ? await fetchClinicSettingsFromDB(currentClinic.id, currentBranch?.id)
                  : null;
                
                // Update session with fresh data
                session.permissions = freshPermissions;
                session.user = { ...currentUser, ...userData };
                session.currentClinic = currentClinic;
                session.currentBranch = currentBranch;
                session.clinicSettings = clinicSettings;
                sessionStorage.setItem('clinic_auth_session', JSON.stringify(session));
                // Also save to legacy key for backward compatibility with LoginPage
                sessionStorage.setItem('clinic_session', JSON.stringify(session));
                
                setAuthState({
                  isAuthenticated: true,
                  isLoading: false,
                  user: session.user,
                  permissions: freshPermissions,
                  customPermissions: userData.custom_permissions || [],
                  overrideMode: userData.override_permissions || false,
                  role: userData.role,
                  token: session.token,
                  // Clinic state
                  currentClinic,
                  currentBranch,
                  accessibleClinics,
                  clinicSettings,
                  isLoadingClinics: false,
                  isSwitchingClinic: false,
                });
                return;
              } else {
                // User not found in database - clear invalid session
                console.warn('User not found in database, clearing session');
                sessionStorage.removeItem('clinic_auth_session');
                sessionStorage.removeItem('clinic_session');
                setAuthState(prev => ({ ...prev, isLoading: false }));
                return;
              }
            } catch (refreshError) {
              console.error('Error refreshing permissions:', refreshError);
              // Fall back to session permissions if refresh fails
            }
          } else {
            // User not found in database - clear invalid session
            console.warn('User not found in database during refresh, clearing session');
            sessionStorage.removeItem('clinic_auth_session');
            sessionStorage.removeItem('clinic_session');
            setAuthState(prev => ({ ...prev, isLoading: false }));
            return;
          }
        } else {
          sessionStorage.removeItem('clinic_auth_session');
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      if (!supabase) {
        throw new Error('Database not configured');
      }

      // Fetch user from database
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', credentials.username)
        .single();

      if (error || !users) {
        throw new Error('Invalid username or password');
      }

      const user = users as any;

      const tenantValid = await isTenantAccessValid(user.id);
      if (!tenantValid) {
        throw new Error('Trial or subscription has expired. Please upgrade to continue.');
      }

      // Verify password (in production, use bcrypt verification)
      if (credentials.password !== user.password_hash) {
        throw new Error('Invalid username or password');
      }

      // Get user permissions
      const permissions = await fetchUserPermissionsFromDB(user.id);
      
      // Get user's accessible clinics
      const accessibleClinics = await fetchUserClinicsFromDB(user.id);
      
      // Determine current clinic
      let currentClinic: Clinic | null = null;
      let currentBranch: ClinicBranch | null = null;
      
      if (accessibleClinics.length > 0) {
        // Use default clinic or first available
        const defaultAccess = accessibleClinics.find(c => c.isDefault) || accessibleClinics[0];
        currentClinic = await fetchClinicFromDB(defaultAccess.clinicId);
        if (defaultAccess.branchId) {
          currentBranch = await fetchBranchFromDB(defaultAccess.branchId);
        }
      }
      
      // Get clinic settings
      const clinicSettings = currentClinic 
        ? await fetchClinicSettingsFromDB(currentClinic.id, currentBranch?.id)
        : null;

      // Create session
      const sessionData = {
        user: user as User,
        permissions,
        token: `token_${user.id}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        // Clinic context
        currentClinic,
        currentBranch,
        accessibleClinics,
        clinicSettings,
      };

      sessionStorage.setItem('clinic_auth_session', JSON.stringify(sessionData));
      // Also save to legacy key for backward compatibility
      sessionStorage.setItem('clinic_session', JSON.stringify(sessionData));

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: user as User,
        permissions,
        customPermissions: [],
        overrideMode: false,
        role: user.role,
        token: sessionData.token,
        // Clinic state
        currentClinic,
        currentBranch,
        accessibleClinics,
        clinicSettings,
        isLoadingClinics: false,
        isSwitchingClinic: false,
      });

    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      sessionStorage.removeItem('clinic_auth_session');
      sessionStorage.removeItem('clinic_session');
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        permissions: [],
        customPermissions: [],
        overrideMode: false,
        role: null,
        // Clinic state
        currentClinic: null,
        currentBranch: null,
        accessibleClinics: [],
        clinicSettings: null,
        isLoadingClinics: false,
        isSwitchingClinic: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    // Implement session refresh logic if needed
  }, []);

  const switchClinic = useCallback(async (clinicId: string, branchId?: string) => {
    setAuthState(prev => ({ ...prev, isSwitchingClinic: true }));
    
    try {
      if (!supabase) {
        throw new Error('Database not configured');
      }

      // Verify user has access to this clinic
      const hasAccess = authState.accessibleClinics.some(
        c => c.clinicId === clinicId && (!branchId || c.branchId === branchId)
      );
      
      if (!hasAccess) {
        throw new Error('You do not have access to this clinic/branch');
      }

      // Fetch clinic and branch details
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

      // Fetch clinic settings
      const clinicSettings = await fetchClinicSettingsFromDB(clinicId, branchId);

      // Update session
      const sessionData = sessionStorage.getItem('clinic_auth_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.currentClinic = clinic;
        session.currentBranch = branch;
        session.clinicSettings = clinicSettings;
        sessionStorage.setItem('clinic_auth_session', JSON.stringify(session));
        // Also save to legacy key for backward compatibility
        sessionStorage.setItem('clinic_session', JSON.stringify(session));
      }

      // Update state
      setAuthState(prev => ({
        ...prev,
        currentClinic: clinic,
        currentBranch: branch,
        clinicSettings,
        isSwitchingClinic: false,
      }));

    } catch (error) {
      console.error('Error switching clinic:', error);
      setAuthState(prev => ({ ...prev, isSwitchingClinic: false }));
      throw error;
    }
  }, [authState.accessibleClinics]);

  const switchBranch = useCallback(async (branchId: string) => {
    if (!authState.currentClinic) {
      throw new Error('No clinic selected');
    }
    return switchClinic(authState.currentClinic.id, branchId);
  }, [authState.currentClinic, switchClinic]);

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

  const hasClinicPermission = useCallback((permission: ClinicPermission): boolean => {
    // Check if user has the permission in their current clinic context
    // This is a simplified check - in production, you'd check against the user's
    // role_at_clinic and custom_permissions for the current clinic
    return authState.permissions.includes(permission as unknown as Permission);
  }, [authState.permissions]);

  const hasClinicAccess = useCallback((clinicId: string): boolean => {
    return authState.accessibleClinics.some(c => c.clinicId === clinicId && c.isActive);
  }, [authState.accessibleClinics]);

  const hasBranchAccess = useCallback((branchId: string): boolean => {
    return authState.accessibleClinics.some(c => c.branchId === branchId && c.isActive);
  }, [authState.accessibleClinics]);

  // Permission helper functions (for backward compatibility)
  const hasPermission = useCallback((permission: Permission): boolean => {
    return authState.permissions.includes(permission);
  }, [authState.permissions]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return permissions.some(p => authState.permissions.includes(p));
  }, [authState.permissions]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    return permissions.every(p => authState.permissions.includes(p));
  }, [authState.permissions]);

  const hasRole = useCallback((role: UserRole): boolean => {
    return authState.role === role;
  }, [authState.role]);

  const hasCustomPermission = useCallback((permission: Permission): boolean => {
    return authState.customPermissions?.includes(permission) || false;
  }, [authState.customPermissions]);

  const value: AuthContextTypeWithClinic = {
    // Auth Methods
    login,
    logout,
    refreshSession,
    loginWithGoogle: async () => {
      // Google OAuth not implemented yet - placeholder
      throw new Error('Google login not implemented');
    },
    loginWithFacebook: async () => {
      // Facebook OAuth not implemented yet - placeholder
      throw new Error('Facebook login not implemented');
    },
    
    // Permission Helpers
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasCustomPermission,
    
    // Helpers
    isAdmin: authState.role?.toUpperCase() === 'ADMIN',
    user: authState.user,
    userProfile: authState.user, // Alias for backward compatibility
    isLoading: authState.isLoading,
    loading: authState.isLoading, // Alias for backward compatibility
    
    // Clinic State
    currentClinic: authState.currentClinic,
    currentBranch: authState.currentBranch,
    accessibleClinics: authState.accessibleClinics,
    clinicSettings: authState.clinicSettings,
    isLoadingClinics: authState.isLoadingClinics,
    isSwitchingClinic: authState.isSwitchingClinic,
    
    // Clinic Methods
    switchClinic,
    switchBranch,
    refreshClinics,
    hasClinicPermission,
    hasClinicAccess,
    hasBranchAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * Returns the auth context or a default value if used outside AuthProvider
 */
export const useAuth = (): AuthContextTypeWithClinic => {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a default context instead of throwing an error
    // This prevents "Cannot read properties of null" errors
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
