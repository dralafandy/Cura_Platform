/**
 * Auth Compatibility Shim
 * 
 * Provides backward compatibility for old auth imports
 * Re-exports new auth types and utilities with old names
 * 
 * This allows existing code to continue working while migrating to new auth system
 * 
 * Migration Path:
 * Old: import { Permission } from './types'
 * New: import { Permission } from './auth/types'
 * 
 * This file provides a bridge during the transition period.
 */

// Re-export new auth types with old import paths
export type { User, Role, Permission, AuditLog, Session } from './auth/types';
export { Permission, UserRole, UserStatus, AuditAction } from './auth/types';

// Re-export auth context and services
export { useAuth } from './auth/AuthContext';
export { userService, roleService, permissionService, auditService } from './auth/authService';

// Re-export middleware components
export {
  ProtectedRoute,
  PermissionGuard,
  RoleGuard,
  AccessDeniedPage,
  withAuth,
  withPermission,
  withRole,
  useHasPermission,
  useHasAnyPermission,
  useHasRole,
  useCurrentUser,
  getPermissionDisplayName,
} from './auth/middleware';

/**
 * IMPORTANT MIGRATION NOTICE:
 * 
 * The following old imports are DEPRECATED:
 * - import { Permission } from './types'
 * - import { usePermissions } from './hooks/usePermissions'
 * - import { ROLE_PERMISSIONS } from './utils/permissions'
 * 
 * These should be replaced with:
 * - import { Permission, useAuth } from './auth/AuthContext'
 * - Use: const { hasPermission } = useAuth()
 * 
 * Files to update:
 * 1. components/Sidebar.tsx
 * 2. components/Header.tsx
 * 3. components/BottomNavBar.tsx
 * 4. components/MobileDrawer.tsx
 * 5. components/patient/PatientDetailsModal.tsx
 * 6. components/patient/PatientDetailsPanel.tsx
 * 7. components/userManagement/UserForm.tsx
 * 8. components/userManagement/UserList.tsx
 * 9. components/userManagement/UserManagement.tsx
 * 10. components/userManagement/UserPermissions.tsx
 * 11. components/userManagement/EditUserPermissionsModal.tsx
 * 12. components/finance/AccountDetailsPage.tsx
 * 13. App.tsx
 * 14. LoginPage.tsx
 * 15. AuthApp.tsx
 * 16. hooks/usePermissions.ts (DELETE)
 * 17. utils/permissions.ts (DELETE)
 * 18. utils/authUtils.ts (DELETE)
 * 19. contexts/AuthContext.tsx - OLD (DELETE)
 * 20. services/userService.ts - OLD (DELETE)
 */
