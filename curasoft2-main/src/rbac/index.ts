/**
 * RBAC Module - Public API
 * 
 * Clean Architecture - Infrastructure Layer
 * Main entry point for the RBAC system.
 */

// Core Types
export * from './types';

// Permission Manager
export { PermissionManager, createPermissionManager, RBAC_ROLE_PERMISSIONS } from './PermissionManager';

// React Context and Hooks
export {
  RBACProvider,
  useRBAC,
  useCheckPermission,
  useCheckPermissions,
  useCheckRole,
  useCheckCan,
  RequirePermission,
  RequireRole,
  AccessControl,
  default as RBACProviderDefault
} from './RBACContext';

// ============================================================================
// Convenience Re-exports
// ============================================================================

// Re-export commonly used types and functions for easier imports
export type { RBACContextType, AccessRule, EffectivePermission, PermissionCategory } from './types';
