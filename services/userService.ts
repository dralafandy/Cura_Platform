/**
 * User Service - Handles all user management operations
 * 
 * Features:
 * - User CRUD operations
 * - Role and permission management
 * - Activity logging
 * - Password hashing
 */

import { createEphemeralSupabaseClient, supabase } from '../supabaseClient';
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
  clinicId?: string;
  branchId?: string | null;
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

const getCurrentAuthUserId = async (): Promise<string | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user?.id ?? null;
};

const getSelfScopeFilter = (authUserId: string): string => `id.eq.${authUserId},auth_id.eq.${authUserId}`;

const getCurrentClinicScope = (): { clinicId: string | null; branchId: string | null } => {
  const clinicId = localStorage.getItem('currentClinicId');
  const branchId = localStorage.getItem('currentBranchId');
  return {
    clinicId: clinicId && clinicId.trim().length > 0 ? clinicId : null,
    branchId: branchId && branchId.trim().length > 0 ? branchId : null,
  };
};

// ============================================================================
// Password Hashing Utility
// ============================================================================

/**
 * Deprecated: password hashes must not be generated client-side.
 * Supabase Auth handles password hashing server-side.
 */
export const hashPassword = async (_password: string): Promise<string> => {
  throw new Error('Client-side password hashing is disabled. Use Supabase Auth.');
};

/**
 * Deprecated: password verification must happen through Supabase Auth.
 */
export const verifyPassword = async (_password: string, _hash: string): Promise<boolean> => {
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

    const authUserId = await getCurrentAuthUserId();
    if (!authUserId) {
      return { success: false, error: 'Authentication required' };
    }

    const { clinicId, branchId } = getCurrentClinicScope();

    if (clinicId) {
      const { data, error } = await supabase.rpc('admin_list_users_for_clinic', {
        p_clinic_id: clinicId,
        p_include_admins: true,
        p_branch_id: branchId,
      });
      if (!error && Array.isArray(data)) {
        return { success: true, data: data as UserProfile[] };
      }
    }

    const { data: selfData, error: selfError } = await supabase
      .from('user_profiles')
      .select('*')
      .or(getSelfScopeFilter(authUserId))
      .order('created_at', { ascending: false });

    if (selfError) throw selfError;

    return { success: true, data: selfData || [] };
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
    const authUserId = await getCurrentAuthUserId();
    if (!authUserId) {
      return { success: false, error: 'Authentication required' };
    }
    if (id !== authUserId) {
      return { success: false, error: 'Access denied: self-only scope' };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .or(getSelfScopeFilter(authUserId))
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
    const authUserId = await getCurrentAuthUserId();
    if (!authUserId) {
      return { success: false, error: 'Authentication required' };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .ilike('username', username.toLowerCase())
      .or(getSelfScopeFilter(authUserId))
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
    if (request.role === UserRole.ADMIN) {
      return {
        success: false,
        error: 'ADMIN role cannot be assigned in scoped create flow. Create DOCTOR and grant ADMIN permissions.',
      };
    }

    const { clinicId: scopedClinicId, branchId: scopedBranchId } = getCurrentClinicScope();
    const clinicId = request.clinicId || scopedClinicId;
    const branchId = request.branchId !== undefined ? request.branchId : scopedBranchId;
    if (!clinicId) {
      return { success: false, error: 'Clinic scope is required to create users' };
    }
    if (!branchId) {
      return { success: false, error: 'Clinic branch scope is required to create users' };
    }

    const ephemeral = createEphemeralSupabaseClient();
    if (!ephemeral) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    const signUpResult = await ephemeral.auth.signUp({
      email: request.email.trim().toLowerCase(),
      password: request.password,
      options: {
        data: {
          username: request.username.trim(),
        },
      },
    });

    if (signUpResult.error || !signUpResult.data.user?.id) {
      throw new Error(signUpResult.error?.message || 'Failed to create auth user');
    }

    const newAuthUserId = signUpResult.data.user.id;
    const rpcResult = await supabase.rpc('admin_create_user_for_clinic', {
      p_auth_user_id: newAuthUserId,
      p_username: request.username.trim(),
      p_email: request.email.trim().toLowerCase(),
      p_role: request.role,
      p_status: request.status || UserStatus.ACTIVE,
      p_clinic_id: clinicId,
      p_branch_id: branchId,
      p_is_default: true,
    });

    if (rpcResult.error) {
      throw new Error(rpcResult.error.message || 'Failed to create user in clinic scope');
    }

    const { data: createdRows, error: listError } = await supabase.rpc('admin_list_users_for_clinic', {
      p_clinic_id: clinicId,
      p_include_admins: true,
      p_branch_id: branchId,
    });
    if (listError) {
      throw new Error(listError.message || 'User created but failed to load created record');
    }

    const createdUser = (createdRows || []).find((row: any) => row.id === newAuthUserId) as UserProfile | undefined;
    if (!createdUser) {
      throw new Error('User was created but not visible in current clinic/branch scope');
    }

    return { success: true, data: createdUser };
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

    const authUserId = await getCurrentAuthUserId();
    if (!authUserId) {
      return { success: false, error: 'Authentication required' };
    }
    if (request.id !== authUserId) {
      const { clinicId, branchId } = getCurrentClinicScope();
      if (!clinicId) {
        return { success: false, error: 'Clinic scope is required to update another user' };
      }
      if (request.role === UserRole.ADMIN) {
        return {
          success: false,
          error: 'ADMIN role cannot be assigned in scoped update flow. Use permissions for elevated access.',
        };
      }

      const { data: rpcData, error: rpcError } = await supabase.rpc('admin_update_user_profile_for_scope', {
        p_target_user_id: request.id,
        p_username: request.username ?? null,
        p_status: request.status ?? null,
        p_role: request.role ?? null,
        p_clinic_id: clinicId,
        p_branch_id: branchId,
      });
      if (rpcError) {
        throw rpcError;
      }
      const updated = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      return { success: true, data: updated as UserProfile };
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
      .or(getSelfScopeFilter(authUserId))
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
    const authUserId = await getCurrentAuthUserId();
    if (!authUserId) {
      return { success: false, error: 'Authentication required' };
    }
    if (id !== authUserId) {
      return { success: false, error: 'Access denied: self-only scope' };
    }

    // Get user info before deletion for logging
    const { data: user } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('id', id)
      .or(getSelfScopeFilter(authUserId))
      .single();

    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id)
      .or(getSelfScopeFilter(authUserId));

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
    const authUserId = await getCurrentAuthUserId();
    if (!authUserId) {
      return { success: false, error: 'Authentication required' };
    }
    if (id !== authUserId) {
      return { success: false, error: 'Access denied: self-only scope' };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .or(getSelfScopeFilter(authUserId))
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
    const authUserId = await getCurrentAuthUserId();
    if (!authUserId) {
      return { success: false, error: 'Authentication required' };
    }
    if (id !== authUserId) {
      const { clinicId, branchId } = getCurrentClinicScope();
      if (!clinicId) {
        return { success: false, error: 'Clinic scope is required to update another user role' };
      }
      if (role === UserRole.ADMIN) {
        return {
          success: false,
          error: 'ADMIN role cannot be assigned in scoped role updates. Use permissions for elevated access.',
        };
      }

      const { data: rpcData, error: rpcError } = await supabase.rpc('admin_update_user_role_for_scope', {
        p_target_user_id: id,
        p_new_role: role,
        p_clinic_id: clinicId,
        p_branch_id: branchId,
        p_dentist_id: null,
      });
      if (rpcError) {
        throw rpcError;
      }
      const updated = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      return { success: true, data: updated as UserProfile };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .or(getSelfScopeFilter(authUserId))
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
    const authUserId = await getCurrentAuthUserId();
    if (!authUserId) {
      return { success: false, error: 'Authentication required' };
    }
    if (id !== authUserId) {
      const { clinicId, branchId } = getCurrentClinicScope();
      if (!clinicId) {
        return { success: false, error: 'Clinic scope is required to update another user permissions' };
      }
      const { data: rpcData, error: rpcError } = await supabase.rpc('admin_update_user_permissions_for_scope', {
        p_target_user_id: id,
        p_custom_permissions: permissions,
        p_override_permissions: overrideMode,
        p_clinic_id: clinicId,
        p_branch_id: branchId,
      });
      if (rpcError) {
        throw rpcError;
      }
      const updated = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      return { success: true, data: updated as UserProfile };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        custom_permissions: permissions,
        override_permissions: overrideMode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .or(getSelfScopeFilter(authUserId))
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
    const authUserId = await getCurrentAuthUserId();
    if (!authUserId) {
      return { success: false, error: 'Authentication required' };
    }
    if (id !== authUserId) {
      return { success: false, error: 'Access denied: self-only scope' };
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', id)
      .or(getSelfScopeFilter(authUserId));

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
    const authUserId = await getCurrentAuthUserId();
    if (!authUserId) {
      return { success: false, error: 'Authentication required' };
    }
    if (userId !== authUserId) {
      return { success: false, error: 'Access denied: self-only scope' };
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
    const authUserId = await getCurrentAuthUserId();
    if (!authUserId) {
      return { success: false, error: 'Authentication required' };
    }
    if (ids.some((id) => id !== authUserId)) {
      return { success: false, error: 'Access denied: self-only scope' };
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
    const authUserId = await getCurrentAuthUserId();
    if (!authUserId) {
      return { success: false, error: 'Authentication required' };
    }
    if (ids.some((id) => id !== authUserId)) {
      return { success: false, error: 'Access denied: self-only scope' };
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

