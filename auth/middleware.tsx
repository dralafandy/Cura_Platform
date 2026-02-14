/**
 * Auth Middleware
 * Provides route protection, permission checking, and access control
 */

import React, { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { Permission } from './types';

// ============================================================================
// PROTECTED ROUTE COMPONENT
// ============================================================================

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: Permission | Permission[];
  fallback?: ReactNode;
}

/**
 * ProtectedRoute: Wraps routes requiring authentication
 * 
 * Usage:
 * <ProtectedRoute requiredPermission="user:create">
 *   <UserManagement />
 * </ProtectedRoute>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  fallback = <AccessDeniedPage />,
}) => {
  const { user, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return fallback;
  }

  // Check permission if required
  if (requiredPermission) {
    const { hasAllPermissions } = useAuth();
    const permissions = Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission];

    if (!hasAllPermissions(permissions)) {
      return fallback;
    }
  }

  return <>{children}</>;
};

// ============================================================================
// PERMISSION GUARD COMPONENT
// ============================================================================

interface PermissionGuardProps {
  children: ReactNode;
  permission: Permission | Permission[];
  fallback?: ReactNode;
  requireAll?: boolean; // true = all permissions, false = any permission
}

/**
 * PermissionGuard: Conditionally render based on permissions
 * 
 * Usage:
 * <PermissionGuard permission="patient:delete">
 *   <DeleteButton />
 * </PermissionGuard>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  fallback = null,
  requireAll = true,
}) => {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  const { hasPermission, hasAnyPermissions, hasAllPermissions } = useAuth();
  const permissions = Array.isArray(permission) ? permission : [permission];

  let hasAccess = false;
  if (requireAll) {
    hasAccess = hasAllPermissions(permissions);
  } else {
    hasAccess = hasAnyPermissions(permissions);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ============================================================================
// ROLE GUARD COMPONENT
// ============================================================================

interface RoleGuardProps {
  children: ReactNode;
  role: string | string[];
  fallback?: ReactNode;
  requireAll?: boolean;
}

/**
 * RoleGuard: Conditionally render based on user role
 * 
 * Usage:
 * <RoleGuard role="ADMIN">
 *   <AdminPanel />
 * </RoleGuard>
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  role,
  fallback = null,
  requireAll = false,
}) => {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  const roles = Array.isArray(role) ? role : [role];
  const hasRole = requireAll
    ? roles.every(r => user.role === r)
    : roles.some(r => user.role === r);

  if (!hasRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ============================================================================
// ACCESS DENIED PAGE
// ============================================================================

export const AccessDeniedPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">403</h1>
        <p className="text-xl text-gray-600 mb-6">Access Denied</p>
        <p className="text-gray-500 mb-8">You do not have permission to access this resource.</p>
        <a
          href="/"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

// ============================================================================
// HIGHER-ORDER COMPONENT (HOC)
// ============================================================================

/**
 * withAuth: HOC for protecting components
 * 
 * Usage:
 * export default withAuth(UserManagement, 'user:read');
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission?: Permission | Permission[]
) {
  return function WithAuthComponent(props: P) {
    return (
      <ProtectedRoute requiredPermission={requiredPermission}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * withPermission: HOC for permission checking
 * 
 * Usage:
 * export default withPermission(DeleteButton, 'patient:delete');
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission | Permission[],
  requireAll: boolean = true
) {
  return function WithPermissionComponent(props: P) {
    return (
      <PermissionGuard permission={permission} requireAll={requireAll}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

/**
 * withRole: HOC for role checking
 * 
 * Usage:
 * export default withRole(AdminDashboard, 'ADMIN');
 */
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  role: string | string[],
  requireAll: boolean = false
) {
  return function WithRoleComponent(props: P) {
    return (
      <RoleGuard role={role} requireAll={requireAll}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user has specific permission (hook version)
 */
export function useHasPermission(permission: Permission | Permission[]): boolean {
  const { hasAllPermissions, hasAnyPermissions } = useAuth();
  const permissions = Array.isArray(permission) ? permission : [permission];
  return Array.isArray(permission) ? hasAllPermissions(permissions) : hasAllPermissions([permissions as Permission]);
}

/**
 * Check if user has any of the specified permissions
 */
export function useHasAnyPermission(
  permissions: Permission[]
): boolean {
  const { hasAnyPermissions } = useAuth();
  return hasAnyPermissions(permissions);
}

/**
 * Check if user has specific role
 */
export function useHasRole(role: string | string[]): boolean {
  const { user } = useAuth();
  if (!user) return false;

  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.role);
}

/**
 * Get current user info
 */
export function useCurrentUser() {
  const { user, loading } = useAuth();
  return { user, loading };
}

// ============================================================================
// PERMISSION CHECKING UTILITIES
// ============================================================================

/**
 * Merge permission arrays and remove duplicates
 */
export function mergePermissions(
  ...permissionArrays: (Permission[] | undefined)[]
): Permission[] {
  const merged = new Set<Permission>();
  permissionArrays.forEach(arr => {
    arr?.forEach(p => merged.add(p));
  });
  return Array.from(merged);
}

/**
 * Filter permissions by prefix (e.g., 'user*' -> all user permissions)
 */
export function getPermissionsByPrefix(
  permissions: Permission[],
  prefix: string
): Permission[] {
  return permissions.filter(p => p.startsWith(prefix));
}

/**
 * Get all CRUD permissions for a resource
 */
export function getResourcePermissions(resource: string): Permission[] {
  return [
    `${resource}:create`,
    `${resource}:read`,
    `${resource}:update`,
    `${resource}:delete`,
  ] as Permission[];
}

// ============================================================================
// PERMISSION DISPLAY UTILITIES
// ============================================================================

/**
 * Convert permission enum to display string
 */
export function getPermissionDisplayName(permission: Permission): string {
  const displayMap: Record<Permission, string> = {
    'user:create': 'Create Users',
    'user:read': 'View Users',
    'user:update': 'Update Users',
    'user:delete': 'Delete Users',
    'user:manage_permissions': 'Manage User Permissions',
    'role:create': 'Create Roles',
    'role:read': 'View Roles',
    'role:update': 'Update Roles',
    'role:delete': 'Delete Roles',
    'role:manage_permissions': 'Manage Role Permissions',
    'patient:create': 'Create Patients',
    'patient:read': 'View Patients',
    'patient:update': 'Update Patients',
    'patient:delete': 'Delete Patients',
    'patient:manage_attachments': 'Manage Patient Attachments',
    'appointment:create': 'Create Appointments',
    'appointment:read': 'View Appointments',
    'appointment:update': 'Update Appointments',
    'appointment:delete': 'Delete Appointments',
    'treatment:create': 'Create Treatments',
    'treatment:read': 'View Treatments',
    'treatment:update': 'Update Treatments',
    'treatment:delete': 'Delete Treatments',
    'treatment:manage_costs': 'Manage Treatment Costs',
    'finance:view_reports': 'View Financial Reports',
    'finance:manage_accounts': 'Manage Financial Accounts',
    'finance:manage_payments': 'Manage Payments',
    'inventory:view': 'View Inventory',
    'inventory:manage': 'Manage Inventory',
    'admin:access_system_settings': 'Access System Settings',
    'admin:manage_clinics': 'Manage Clinics',
    'admin:access_audit_logs': 'Access Audit Logs',
  };

  return displayMap[permission] || permission;
}

/**
 * Group permissions by resource
 */
export function groupPermissionsByResource(
  permissions: Permission[]
): Record<string, Permission[]> {
  const grouped: Record<string, Permission[]> = {};

  permissions.forEach(permission => {
    const [resource] = permission.split(':');
    if (!grouped[resource]) {
      grouped[resource] = [];
    }
    grouped[resource].push(permission);
  });

  return grouped;
}
