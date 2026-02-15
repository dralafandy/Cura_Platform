/**
 * NEW Clean Auth Context
 * Replaces old AuthContext.tsx
 * 
 * Features:
 * - Simple, focused authentication
 * - Session management
 * - Permission checking
 * - Clean architecture
 */

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import type { User, AuthState, Permission, UserRole, LoginCredentials } from './types';

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
    // (custom permissions add to role permissions, not replace them)
    const combinedPermissions = new Set([...rolePermissions, ...customPermissions]);
    return Array.from(combinedPermissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return [];
  }
};

interface AuthContextType {
  // Auth State
  authState: AuthState;
  
  // Auth Methods
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // Permission Helpers
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasCustomPermission: (permission: Permission) => boolean;
  
  // Helpers
  isAdmin: boolean;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    permissions: [],
    customPermissions: [],
    overrideMode: false,
    role: null,
  });

  /**
   * Initialize auth on mount
   */
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Try to get current session
      const sessionData = sessionStorage.getItem('clinic_auth_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        // Verify session is still valid
        if (new Date(session.expiresAt) > new Date()) {
          // Refresh permissions from database to get latest custom permissions
          const currentUser = session.user;
          if (currentUser && currentUser.id && supabase) {
            try {
              // Fetch latest user data including custom_permissions
              const { data: userData } = await supabase
                .from('user_profiles')
                .select('role, custom_permissions, override_permissions')
                .eq('id', currentUser.id)
                .single();
              
              if (userData) {
                // Get fresh permissions from database
                const freshPermissions = await fetchUserPermissionsFromDB(currentUser.id);
                
                // Update session with fresh permissions
                session.permissions = freshPermissions;
                session.user = { ...currentUser, ...userData };
                sessionStorage.setItem('clinic_auth_session', JSON.stringify(session));
                
                setAuthState({
                  isAuthenticated: true,
                  isLoading: false,
                  user: session.user,
                  permissions: freshPermissions,
                  customPermissions: userData.custom_permissions || [],
                  overrideMode: userData.override_permissions || false,
                  role: userData.role,
                  token: session.token,
                });
                return;
              }
            } catch (refreshError) {
              console.error('Error refreshing permissions:', refreshError);
              // Fall back to session permissions if refresh fails
            }
          }
          
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: session.user,
            permissions: session.permissions,
            customPermissions: [],
            overrideMode: false,
            role: session.user.role,
            token: session.token,
          });
          return;
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

      // Verify password (in production, use bcrypt verification)
      // For now, using simple hash comparison
      if (credentials.password !== user.password_hash) {
        throw new Error('Invalid username or password');
      }

      // Get user permissions
      const permissions = await fetchUserPermissionsFromDB(user.id);

      // Create session
      const sessionData = {
        user: user as User,
        permissions,
        token: `token_${user.id}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      sessionStorage.setItem('clinic_auth_session', JSON.stringify(sessionData));

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: user as User,
        permissions,
        customPermissions: [],
        overrideMode: false,
        role: user.role,
        token: sessionData.token,
      });

    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      sessionStorage.removeItem('clinic_auth_session');
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        permissions: [],
        customPermissions: [],
        overrideMode: false,
        role: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    // Implement session refresh logic if needed
  }, []);

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

  // Check if user has a custom permission (not from role)
  const hasCustomPermission = useCallback((permission: Permission): boolean => {
    return authState.customPermissions.includes(permission);
  }, [authState.customPermissions]);

  const isAdmin = authState.role === 'ADMIN';

  const value: AuthContextType = {
    authState,
    login,
    logout,
    refreshSession,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasCustomPermission,
    isAdmin,
    user: authState.user,
    isLoading: authState.isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
