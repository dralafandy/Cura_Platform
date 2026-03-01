/**
 * RBAC Context and Hook
 * 
 * Clean Architecture - Infrastructure Layer (React Integration)
 * Provides React context and hooks for accessing RBAC functionality.
 */

import React, { createContext, useContext, useMemo, ReactNode, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Permission, UserRole } from '../../types';
import { PermissionManager, createPermissionManager } from './PermissionManager';
import { 
  RBACContextType, 
  AccessRule,
  ResourceType, 
  ActionType 
} from './types';

// ============================================================================
// Context Creation
// ============================================================================

const RBACContext = createContext<RBACContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface RBACProviderProps {
  children: ReactNode;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({ children }) => {
  const { user, isAdmin, isLoading } = useAuth();

  // Create permission manager instance
  const permissionManager = useMemo(() => {
    return createPermissionManager(user);
  }, [user]);

  // Check single permission
  const hasPermission = useCallback((permission: Permission): boolean => {
    return permissionManager.hasPermission(permission);
  }, [permissionManager]);

  // Check if user has ANY of the specified permissions
  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return permissionManager.hasAnyPermission(permissions);
  }, [permissionManager]);

  // Check if user has ALL of the specified permissions
  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    return permissionManager.hasAllPermissions(permissions);
  }, [permissionManager]);

  // Get all effective permissions
  const getEffectivePermissions = useCallback((): Permission[] => {
    return permissionManager.getEffectivePermissions();
  }, [permissionManager]);

  // Check if user has a specific role
  const checkIsRole = useCallback((role: UserRole): boolean => {
    return permissionManager.isRole(role);
  }, [permissionManager]);

  // Resource-action permission check
  const checkCan = useCallback((
    resource: ResourceType, 
    action: ActionType, 
    scope?: 'own' | 'department' | 'all'
  ): boolean => {
    return permissionManager.can(resource, action, scope);
  }, [permissionManager]);

  // Context value
  const value = useMemo<RBACContextType>(() => ({
    // State
    isReady: !isLoading,
    permissions: getEffectivePermissions(),
    role: user?.role ?? null,
    isAdmin,
    customPermissions: (user as any)?.custom_permissions ?? [],
    overrideMode: (user as any)?.override_permissions ?? false,
    
    // Actions
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getEffectivePermissions,
    isRole: checkIsRole,
    can: checkCan,
  }), [
    isLoading,
    user,
    isAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getEffectivePermissions,
    checkIsRole,
    checkCan,
  ]);

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
};

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * Hook to access RBAC functionality
 */
export function useRBAC(): RBACContextType {
  const context = useContext(RBACContext);
  
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  
  return context;
}

/**
 * Hook to check a single permission with optional fallback
 */
export function useCheckPermission(permission: Permission, fallback: boolean = false): boolean {
  const { hasPermission, isReady } = useRBAC();
  
  if (!isReady) {
    return fallback;
  }
  
  return hasPermission(permission);
}

/**
 * Hook to check multiple permissions (any or all)
 */
export function useCheckPermissions(permissions: Permission[], requireAll: boolean = false, fallback: boolean = false): boolean {
  const { hasAnyPermission, hasAllPermissions, isReady } = useRBAC();
  
  if (!isReady) {
    return fallback;
  }
  
  if (requireAll) {
    return hasAllPermissions(permissions);
  }
  
  return hasAnyPermission(permissions);
}

/**
 * Hook to check if user has a specific role
 */
export function useCheckRole(role: UserRole): boolean {
  const { isRole: checkRole, isReady } = useRBAC();
  
  if (!isReady) {
    return false;
  }
  
  return checkRole(role);
}

/**
 * Hook to check resource-action permissions
 */
export function useCheckCan(resource: ResourceType, action: ActionType, scope: 'own' | 'department' | 'all' = 'all'): boolean {
  const { can: checkCan, isReady } = useRBAC();
  
  if (!isReady) {
    return false;
  }
  
  return checkCan(resource, action, scope);
}

// ============================================================================
// Access Control Components
// ============================================================================

/**
 * Props for RequirePermission component
 */
interface RequirePermissionProps {
  permission: Permission | Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  showFallback?: boolean;
  children: React.ReactNode;
}

/**
 * Component that conditionally renders children based on permissions
 */
export const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission,
  requireAll = false,
  fallback = null,
  showFallback = true,
  children,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isReady } = useRBAC();

  if (!isReady) {
    return showFallback ? <>{fallback}</> : null;
  }

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  if (!hasAccess) {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

/**
 * Props for RequireRole component
 */
interface RequireRoleProps {
  role: UserRole | UserRole[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  showFallback?: boolean;
  children: React.ReactNode;
}

/**
 * Component that conditionally renders children based on user role
 */
export const RequireRole: React.FC<RequireRoleProps> = ({
  role,
  requireAll = false,
  fallback = null,
  showFallback = true,
  children,
}) => {
  const { isRole: checkRole, isReady } = useRBAC();

  if (!isReady) {
    return showFallback ? <>{fallback}</> : null;
  }

  const roles = Array.isArray(role) ? role : [role];
  const hasAccess = requireAll
    ? roles.every(r => checkRole(r))
    : roles.some(r => checkRole(r));

  if (!hasAccess) {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

/**
 * Props for AccessControl component
 */
interface AccessControlProps {
  rule: AccessRule;
  fallback?: React.ReactNode;
  showFallback?: boolean;
  children: React.ReactNode;
}

/**
 * Component with advanced access control using AccessRule
 */
export const AccessControl: React.FC<AccessControlProps> = ({
  rule,
  fallback = null,
  showFallback = true,
  children,
}) => {
  const { hasAnyPermission, hasAllPermissions, isReady } = useRBAC();

  if (!isReady) {
    return showFallback ? <>{fallback}</> : null;
  }

  const permissions = Array.isArray(rule.permissions) 
    ? rule.permissions 
    : [rule.permissions];
  
  const hasAccess = rule.requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  if (!hasAccess) {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

// ============================================================================
// Index export
// ============================================================================

export default RBACProvider;
