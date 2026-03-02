/**
 * Auth Services
 * Handles all authentication and authorization operations
 * 
 * Features:
 * - User management (CRUD)
 * - Role management
 * - Permission management
 * - Session management
 * - Audit logging
 */

import { supabase } from '../supabaseClient';
import type {
  User,
  Role,
  Permission,
  UserRole,
  UserStatus,
  CreateUserInput,
  UpdateUserInput,
  ServiceResponse,
  AuditLog,
  AuditAction,
} from './types';

// ============================================================================
// USER OPERATIONS
// ============================================================================

export const userService = {
  /**
   * Create new user
   */
  async createUser(input: CreateUserInput): Promise<ServiceResponse<User>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: String(input.email || '').toLowerCase(),
        password: input.password,
        options: {
          data: {
            username: input.username,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create auth user');

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(
          {
            id: authData.user.id,
            user_id: authData.user.id,
            auth_id: authData.user.id,
            username: input.username,
            email: input.email,
            first_name: input.firstName,
            last_name: input.lastName,
            role: input.role,
            status: input.status || UserStatus.ACTIVE,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        )
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: data as User };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create user',
      };
    }
  },

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<ServiceResponse<User>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return { success: true, data: data as User };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch user',
      };
    }
  },

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    input: UpdateUserInput
  ): Promise<ServiceResponse<User>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: data as User };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update user',
      };
    }
  },

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<ServiceResponse<void>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete user',
      };
    }
  },

  /**
   * List all users
   */
  async listUsers(
    limit: number = 50,
    offset: number = 0
  ): Promise<ServiceResponse<{ users: User[]; total: number }>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      const { data, error, count } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: { users: data as User[], total: count || 0 },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to list users',
      };
    }
  },

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<ServiceResponse<void>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const currentUser = sessionData.session?.user;
      if (!currentUser || currentUser.id !== userId) {
        return { success: false, error: 'You can only change your own password from this client.' };
      }

      // Re-authenticate user by signing in with current password.
      const userEmail = currentUser.email;
      if (!userEmail) {
        return { success: false, error: 'Current user has no email in auth session.' };
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: oldPassword,
      });
      if (signInError) {
        return { success: false, error: 'Invalid current password' };
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to change password',
      };
    }
  },
};

// ============================================================================
// ROLE OPERATIONS
// ============================================================================

export const roleService = {
  /**
   * Get all roles
   */
  async getAllRoles(): Promise<ServiceResponse<Role[]>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      return { success: true, data: data as Role[] };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch roles',
      };
    }
  },

  /**
   * Get role permissions
   */
  async getRolePermissions(roleId: string): Promise<ServiceResponse<Permission[]>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role_id', roleId);

      if (error) throw error;

      return {
        success: true,
        data: data?.map((row: any) => row.permission) || [],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch role permissions',
      };
    }
  },

  /**
   * Update role permissions
   */
  async updateRolePermissions(
    roleId: string,
    permissions: Permission[]
  ): Promise<ServiceResponse<void>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      // Delete existing permissions
      await supabase.from('role_permissions').delete().eq('role_id', roleId);

      // Insert new permissions
      const permissionRecords = permissions.map(permission => ({
        role_id: roleId,
        permission,
      }));

      const { error } = await supabase
        .from('role_permissions')
        .insert(permissionRecords);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update role permissions',
      };
    }
  },
};

// ============================================================================
// PERMISSION OPERATIONS
// ============================================================================

export const permissionService = {
  /**
   * Check if user has permission
   */
  async hasPermission(userId: string, permission: Permission): Promise<boolean> {
    try {
      if (!supabase) return false;

      // Get user's permissions
      const { data: userPerms, error } = await supabase
        .from('user_permission_overrides')
        .select('granted')
        .eq('user_id', userId)
        .eq('permission', permission)
        .single();

      if (!error && userPerms) {
        return userPerms.granted;
      }

      // Check role permissions
      const { data: user } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (!user) return false;

      const { data: rolePerm } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role_name', user.role)
        .eq('permission', permission)
        .single();

      return !!rolePerm;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  },

  /**
   * Grant permission override
   */
  async grantPermissionOverride(
    userId: string,
    permission: Permission,
    reason?: string,
    expiresAt?: Date
  ): Promise<ServiceResponse<void>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      const { error } = await supabase
        .from('user_permission_overrides')
        .insert({
          user_id: userId,
          permission,
          granted: true,
          reason,
          expires_at: expiresAt?.toISOString(),
        });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to grant permission',
      };
    }
  },

  /**
   * Revoke permission override
   */
  async revokePermissionOverride(
    userId: string,
    permission: Permission
  ): Promise<ServiceResponse<void>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      const { error } = await supabase
        .from('user_permission_overrides')
        .delete()
        .match({ user_id: userId, permission });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to revoke permission',
      };
    }
  },
};

// ============================================================================
// AUDIT OPERATIONS
// ============================================================================

export const auditService = {
  /**
   * Log audit event
   */
  async logEvent(
    userId: string,
    action: AuditAction,
    resourceType: string,
    resourceId: string,
    changes?: Record<string, any>
  ): Promise<void> {
    try {
      if (!supabase) return;

      await supabase.from('audit_logs').insert({
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        changes,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  },

  /**
   * Get audit logs
   */
  async getAuditLogs(
    filters?: {
      userId?: string;
      action?: AuditAction;
      resourceType?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 100
  ): Promise<ServiceResponse<AuditLog[]>> {
    try {
      if (!supabase) {
        return { success: false, error: 'Database not configured' };
      }

      let query = supabase.from('audit_logs').select('*');

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }
      if (filters?.startDate) {
        query = query.gte('timestamp', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('timestamp', filters.endDate.toISOString());
      }

      const { data, error } = await query
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, data: data as AuditLog[] };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch audit logs',
      };
    }
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Password hashing/verification are intentionally removed from client-side auth service.
