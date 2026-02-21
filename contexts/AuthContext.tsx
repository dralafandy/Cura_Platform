/**
 * AuthContext - Authentication and authorization context provider
 * 
 * Features:
 * - User authentication state management
 * - Session persistence
 * - Permission integration
 * - OAuth support (Google, Facebook)
 */

import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import { UserProfile, UserRole, Permission } from '../types';
import { usePermissions } from '../hooks/usePermissions';
import { updateLastLogin } from '../services/userService';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface AuthContextType {
  // User state
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  isAdmin: boolean;
  
  // Auth methods
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  
  // User profile methods
  refetchUserProfile: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  
  // Permission helpers (from usePermissions hook)
  checkPermission: (permission: Permission) => boolean;
  hasPermission: (permission: Permission) => boolean;
  checkAnyPermission: (permissions: Permission[]) => boolean;
  checkAllPermissions: (permissions: Permission[]) => boolean;
  checkCustomPermission: (permission: Permission) => boolean;
}


// ============================================================================
// Context Creation
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session storage keys
const SESSION_KEY = 'clinic_session';
const SESSION_EXPIRY_HOURS = 24;

// ============================================================================
// Provider Component
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize permissions hook with current user profile
  const permissions = usePermissions(userProfile);

  // ============================================================================
  // Session Management
  // ============================================================================

  /**
   * Check if session is valid (not expired)
   */
  const isSessionValid = useCallback((sessionData: any): boolean => {
    if (!sessionData?.loginTime) return false;
    const loginTime = new Date(sessionData.loginTime).getTime();
    const expiryTime = loginTime + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
    return Date.now() < expiryTime;
  }, []);

  /**
   * Save session to storage
   */
  const saveSession = useCallback((userData: UserProfile) => {
    const sessionData = {
      user: userData,
      loginTime: new Date().toISOString(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  }, []);

  /**
   * Clear session from storage
   */
  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  /**
   * Load session from storage
   */
  const loadSession = useCallback((): UserProfile | null => {
    try {
      const sessionData = sessionStorage.getItem(SESSION_KEY);
      if (!sessionData) return null;

      const parsed = JSON.parse(sessionData);
      if (!isSessionValid(parsed)) {
        clearSession();
        return null;
      }

      return parsed.user;
    } catch (error) {
      console.error('Error loading session:', error);
      clearSession();
      return null;
    }
  }, [isSessionValid, clearSession]);

  // ============================================================================
  // User Profile Management
  // ============================================================================

  /**
   * Fetch user profile from Supabase
   */
  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    if (!supabase) return null;

    try {
      // Try to find by user_id first
      let { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // If not found, try by OAuth ID
      if (!profile && !error) {
        const { data: oauthProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('oauth_id', userId)
          .single();
        
        profile = oauthProfile;
      }

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }, []);

  /**
   * Create profile for OAuth user
   */
  const createOAuthProfile = useCallback(async (
    userId: string, 
    email: string, 
    provider: string
  ): Promise<UserProfile | null> => {
    if (!supabase) return null;

    try {
      const { data: newProfile, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          username: email || `oauth_${userId}`,
          role: UserRole.ADMIN, // Default role for OAuth users
          status: 'ACTIVE',
          oauth_provider: provider,
          oauth_id: userId,
          oauth_email: email,
          linked_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating OAuth profile:', error);
        return null;
      }

      return newProfile;
    } catch (error) {
      console.error('Error creating OAuth profile:', error);
      return null;
    }
  }, []);

  /**
   * Refetch user profile
   */
  const refetchUserProfile = useCallback(async () => {
    if (!user?.id) return;

    const profile = await fetchUserProfile(user.id);
    if (profile) {
      setUserProfile(profile);
      saveSession(profile);
    }
  }, [user?.id, fetchUserProfile, saveSession]);

  /**
   * Update user profile
   */
  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!supabase || !userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userProfile.id)
        .select()
        .single();

      if (error) throw error;

      setUserProfile(data);
      saveSession(data);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }, [userProfile?.id, saveSession]);

  // ============================================================================
  // Auth State Change Handler
  // ============================================================================

  useEffect(() => {
    // Check for stored session first
    const storedUser = loadSession();
    if (storedUser) {
      setUserProfile(storedUser);
      // Legacy/local profiles may not have user_id; fall back to profile id.
      const restoredUserId = storedUser.user_id || storedUser.id;
      setUser(restoredUserId ? ({ id: restoredUserId } as User) : null);
      setIsLoading(false);
      return;
    }

    // If no Supabase, stop loading
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, !!newSession);
        
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          let profile = await fetchUserProfile(newSession.user.id);

          // If no profile found, check for OAuth
          if (!profile) {
            const oauthProvider = newSession.user.app_metadata?.provider;
            if (oauthProvider) {
              profile = await createOAuthProfile(
                newSession.user.id,
                newSession.user.email || '',
                oauthProvider
              );
            }
          }

          if (profile) {
            setUserProfile(profile);
            saveSession(profile);
            await updateLastLogin(profile.id);
          }
        } else {
          setUserProfile(null);
          clearSession();
        }

        setIsLoading(false);
      }
    );

    // Initial session check
    const initSession = async () => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          
          let profile = await fetchUserProfile(initialSession.user.id);
          
          if (profile) {
            setUserProfile(profile);
            saveSession(profile);
          }
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();


    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, createOAuthProfile, loadSession, saveSession, clearSession]);

  // ============================================================================
  // Auth Methods
  // ============================================================================

  /**
   * Login with email and password
   */
  const login = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  }, []);

  /**
   * Sign up with email and password
   */
  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
  }, []);

  /**
   * Login with Google OAuth
   */
  const loginWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        scopes: 'email profile',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      if (error.message?.includes('provider is not enabled')) {
        throw new Error('Google OAuth is not enabled. Please enable it in Supabase Dashboard.');
      }
      throw error;
    }
  }, []);

  /**
   * Login with Facebook OAuth
   */
  const loginWithFacebook = useCallback(async () => {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: window.location.origin,
        scopes: 'email public_profile',
        queryParams: {
          response_type: 'code',
        },
      },
    });

    if (error) {
      if (error.message?.includes('provider is not enabled')) {
        throw new Error('Facebook OAuth is not enabled. Please enable it in Supabase Dashboard.');
      }
      throw error;
    }
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      clearSession();
      
      if (supabase) {
        await supabase.auth.signOut();
      }
      
      setUser(null);
      setUserProfile(null);
      setSession(null);
      
      // Force reload to clear all state
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      // Force reload anyway
      window.location.reload();
    }
  }, [clearSession]);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const isAuthenticated = useMemo(() => !!user && !!userProfile, [user, userProfile]);
  const isAdmin = useMemo(() => userProfile?.role === UserRole.ADMIN, [userProfile?.role]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value = useMemo(() => ({
    // User state
    user,
    userProfile,
    session,
    
    // Auth state
    isAuthenticated,
    isLoading,
    loading: isLoading,
    isAdmin,
    
    // Auth methods
    login,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    signUp,
    
    // User profile methods
    refetchUserProfile,
    updateUserProfile,
    
    // Permission helpers
    checkPermission: permissions.checkPermission,
    hasPermission: permissions.checkPermission,
    checkAnyPermission: permissions.checkAnyPermission,
    checkAllPermissions: permissions.checkAllPermissions,
    checkCustomPermission: permissions.checkCustomPermission,
  }), [
    user,
    userProfile,
    session,
    isAuthenticated,
    isLoading,
    isAdmin,
    login,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    signUp,
    refetchUserProfile,
    updateUserProfile,
    permissions,
  ]);


  // ============================================================================
  // Render
  // ============================================================================

  if (isLoading) {
    // You can return a loading spinner here if needed
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
