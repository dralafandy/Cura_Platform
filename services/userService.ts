/**
 * User Service - Handles all user management operations
 * 
 * Features:
 * - User CRUD operations
 * - Role and permission management
 * - Activity logging
 * - Password hashing
 */

import { supabase } from '../supabaseClient';
import { 
  UserProfile, 
  UserRole, 
  UserStatus, 
  Permission, 
  UserActivityLog 
} from '../types';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
}

export interface UpdateUserRequest {
  id: string;
  username?: string;
  role?: UserRole;
  status?: UserStatus;
  custom_permissions?: Permission[];
  override_permissions?: boolean;
}

export interface UserServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Password Hashing Utility
// ============================================================================

/**
 * Simple password hashing using SHA-256 (for demo purposes)
 * In production, use bcrypt or similar with salt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Verify password against hash
 * Supports multiple hash formats for backward compatibility
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  if (!hash) return false;
  
  // Try SHA-256 (new format)
  const passwordHash = await hashPassword(password);
  if (passwordHash === hash) return true;
  
  // Try direct comparison (for plain text passwords during development)
  if (password === hash) return true;
  
  // If hash starts with $2b$ or $2a$, it's likely bcrypt (not supported in browser)
  // Return false for unsupported formats
  return false;
};


// ============================================================================
// User CRUD Operations
// ============================================================================

/**
 * Get all users
 */
export const getAllUsers = async (): Promise<UserServiceResponse<UserProfile[]>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return { success: false, error: error.message || 'Failed to fetch users' };
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (id: string): Promise<UserServiceResponse<UserProfile>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('User not found');

    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return { success: false, error: error.message || 'Failed to fetch user' };
  }
};

/**
 * Get user by username (case-insensitive)
 */
export const getUserByUsername = async (username: string): Promise<UserServiceResponse<UserProfile>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .ilike('username', username.toLowerCase())
      .single();

    if (error) throw error;
    if (!data) throw new Error('User not found');

    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching user by username:', error);
    return { success: false, error: error.message || 'Failed to fetch user' };
  }
};

/**
 * Create new user
 */
export const createUser = async (request: CreateUserRequest): Promise<UserServiceResponse<UserProfile>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .ilike('username', request.username.toLowerCase())
      .single();

    if (existingUser) {
      return { success: false, error: 'Username already exists' };
    }

    // Create auth user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: request.email,
      password: request.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create auth user');

    // Hash password for direct login
    const passwordHash = await hashPassword(request.password);

    // Create user profile
    const { data: newUser, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        user_id: authData.user.id,
        username: request.username,
        role: request.role,
        status: request.status || UserStatus.ACTIVE,
        password_hash: passwordHash,
      })
      .select()
      .single();

    if (profileError) throw profileError;

    // Log activity
    await logActivity(newUser.id, 'user_created', `User ${request.username} created with role ${request.role}`);

    return { success: true, data: newUser };
  } catch (error: any) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message || 'Failed to create user' };
  }
};

/**
 * Update existing user
 */
export const updateUser = async (request: UpdateUserRequest): Promise<UserServiceResponse<UserProfile>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    // Check if username is being changed and if it already exists
    if (request.username) {
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .ilike('username', request.username.toLowerCase())
        .neq('id', request.id)
        .single();

      if (existingUser) {
        return { success: false, error: 'Username already exists' };
      }
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (request.username) updateData.username = request.username;
    if (request.role) updateData.role = request.role;
    if (request.status) updateData.status = request.status;
    if (request.custom_permissions !== undefined) updateData.custom_permissions = request.custom_permissions;
    if (request.override_permissions !== undefined) updateData.override_permissions = request.override_permissions;

    const { data: updatedUser, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', request.id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity(request.id, 'user_updated', `User ${updatedUser.username} updated`);

    return { success: true, data: updatedUser };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message || 'Failed to update user' };
  }
};

/**
 * Delete user
 */
export const deleteUser = async (id: string): Promise<UserServiceResponse<void>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    // Get user info before deletion for logging
    const { data: user } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log activity
    await logActivity(id, 'user_deleted', `User ${user?.username || id} deleted`);

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message || 'Failed to delete user' };
  }
};

/**
 * Update user status
 */
export const updateUserStatus = async (id: string, status: UserStatus): Promise<UserServiceResponse<UserProfile>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity(id, 'status_updated', `User status changed to ${status}`);

    return { success: true, data };
  } catch (error: any) {
    console.error('Error updating user status:', error);
    return { success: false, error: error.message || 'Failed to update user status' };
  }
};

/**
 * Update user role
 */
export const updateUserRole = async (id: string, role: UserRole): Promise<UserServiceResponse<UserProfile>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity(id, 'role_updated', `User role changed to ${role}`);

    return { success: true, data };
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return { success: false, error: error.message || 'Failed to update user role' };
  }
};

/**
 * Update user permissions
 */
export const updateUserPermissions = async (
  id: string, 
  permissions: Permission[], 
  overrideMode: boolean
): Promise<UserServiceResponse<UserProfile>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        custom_permissions: permissions,
        override_permissions: overrideMode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity(id, 'permissions_updated', `User permissions updated (override: ${overrideMode})`);

    return { success: true, data };
  } catch (error: any) {
    console.error('Error updating user permissions:', error);
    return { success: false, error: error.message || 'Failed to update user permissions' };
  }
};

/**
 * Update last login timestamp
 */
export const updateLastLogin = async (id: string): Promise<UserServiceResponse<void>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating last login:', error);
    return { success: false, error: error.message || 'Failed to update last login' };
  }
};

// ============================================================================
// Activity Logging
// ============================================================================

/**
 * Log user activity
 */
export const logActivity = async (
  userId: string, 
  action: string, 
  details?: string
): Promise<UserServiceResponse<void>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    const { error } = await supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        action,
        details,
        timestamp: new Date().toISOString(),
        ip_address: window.location.hostname,
      });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error logging activity:', error);
    return { success: false, error: error.message || 'Failed to log activity' };
  }
};

/**
 * Get user activity logs
 */
export const getUserActivityLogs = async (userId: string): Promise<UserServiceResponse<UserActivityLog[]>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    const { data, error } = await supabase
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error fetching activity logs:', error);
    return { success: false, error: error.message || 'Failed to fetch activity logs' };
  }
};

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Bulk delete users
 */
export const bulkDeleteUsers = async (ids: string[]): Promise<UserServiceResponse<number>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    const { error, count } = await supabase
      .from('user_profiles')
      .delete()
      .in('id', ids);

    if (error) throw error;

    // Log activity for each deleted user
    for (const id of ids) {
      await logActivity(id, 'user_deleted_bulk', 'User deleted in bulk operation');
    }

    return { success: true, data: count || ids.length };
  } catch (error: any) {
    console.error('Error bulk deleting users:', error);
    return { success: false, error: error.message || 'Failed to delete users' };
  }
};

/**
 * Bulk update user status
 */
export const bulkUpdateUserStatus = async (
  ids: string[], 
  status: UserStatus
): Promise<UserServiceResponse<number>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    const { error, count } = await supabase
      .from('user_profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (error) throw error;

    // Log activity for each updated user
    for (const id of ids) {
      await logActivity(id, 'status_updated_bulk', `Status changed to ${status} in bulk operation`);
    }

    return { success: true, data: count || ids.length };
  } catch (error: any) {
    console.error('Error bulk updating user status:', error);
    return { success: false, error: error.message || 'Failed to update user status' };
  }
};
