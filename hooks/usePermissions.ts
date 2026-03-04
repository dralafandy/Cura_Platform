import { useMemo } from 'react';
import { UserProfile, Permission } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions, 
  getEffectivePermissions 
} from '../utils/permissions';

/**
 * usePermissions Hook - React hook for permission checking
 * 
 * Features:
 * - Check single permission
 * - Check multiple permissions (any/all)
 * - Get all effective permissions
 * - Role-based helpers
 * - Backward compatible with old permissions array
 */
type PermissionProfile =
  | Pick<UserProfile, 'role' | 'custom_permissions' | 'override_permissions' | 'permissions'>
  | null
  | undefined;

export const usePermissions = (userProfile?: PermissionProfile) => {
  const { userProfile: authUserProfile } = useAuth();
  const effectiveProfile = (userProfile ?? (authUserProfile as PermissionProfile)) ?? null;

  const permissions = useMemo(() => {
    // If no user profile, return default permissions
    if (!effectiveProfile) {
      return {
        checkPermission: () => false,
        checkAnyPermission: () => false,
        checkAllPermissions: () => false,
        checkCustomPermission: () => false,
        getAllPermissions: () => [],
        userRole: null,
        isAdmin: false,
        isDoctor: false,
        isAssistant: false,
        isReceptionist: false,
        customPermissions: [],
        overridePermissions: false,
      };
    }

    const userRole = effectiveProfile.role;
    const customPermissions = effectiveProfile.custom_permissions || [];
    const overridePermissions = effectiveProfile.override_permissions || false;

    // Check if user is admin
    const isAdmin = userRole === 'ADMIN';
    const isDoctor = userRole === 'DOCTOR';
    const isAssistant = userRole === 'ASSISTANT';
    const isReceptionist = userRole === 'RECEPTIONIST';

    // Check single permission
    const checkPermission = (permission: Permission): boolean => {
      // Admin has all permissions
      if (isAdmin) return true;
      
      // Check if user has the permission using new system
      const hasNewPermission = hasPermission(userRole, permission, customPermissions, overridePermissions);
      if (hasNewPermission) return true;
      
      // Backward compatibility: check old permissions array
      if (effectiveProfile.permissions && Array.isArray(effectiveProfile.permissions)) {
        // Convert old permission string to new enum if needed
        const oldPermissionString = permission.toString().toLowerCase();
        return effectiveProfile.permissions.some((p: string) => 
          p.toLowerCase() === oldPermissionString || 
          p.toLowerCase().replace(/_/g, '') === oldPermissionString.replace(/_/g, '')
        );
      }
      
      return false;
    };

    // Check if user has any of the specified permissions
    const checkAnyPermission = (permissions: Permission[]): boolean => {
      return permissions.some(permission => checkPermission(permission));
    };

    // Check if user has a custom permission ONLY (not from role)
    // This ignores role-based permissions and only checks custom_permissions
    const checkCustomPermission = (permission: Permission): boolean => {
      // If admin, they have all permissions through role
      // But we still want to check if it was explicitly granted in custom permissions
      return customPermissions.includes(permission);
    };

    // Check if user has all specified permissions
    const checkAllPermissions = (permissions: Permission[]): boolean => {
      return permissions.every(permission => checkPermission(permission));
    };

    // Get all effective permissions
    const getAllPermissions = (): Permission[] => {
      return getEffectivePermissions(userRole, customPermissions, overridePermissions);
    };

    return {
      checkPermission,
      checkAnyPermission,
      checkAllPermissions,
      checkCustomPermission,
      getAllPermissions,
      userRole,
      isAdmin,
      isDoctor,
      isAssistant,
      isReceptionist,
      customPermissions,
      overridePermissions,
    };
  }, [effectiveProfile]);

  return permissions;
};

export default usePermissions;
