/**
 * RBAC Core Types
 * 
 * Clean Architecture - Domain Layer
 * Defines the core types and interfaces for the Role-Based Access Control system.
 */

import { Permission, UserRole, UserProfile, UserStatus } from '../../types';

// ============================================================================
// Permission Types
// ============================================================================

/**
 * Resource types for permission scoping
 */
export type ResourceType = 
  | 'patient'
  | 'appointment'
  | 'treatment'
  | 'prescription'
  | 'user'
  | 'finance'
  | 'inventory'
  | 'lab_case'
  | 'supplier'
  | 'report'
  | 'settings'
  | 'notification'
  | 'system';

/**
 * Action types for CRUD operations
 */
export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'view';

/**
 * Permission scope - defines what a permission allows
 */
export interface PermissionScope {
  resource: ResourceType;
  action: ActionType;
  scope?: 'own' | 'department' | 'all';
}

/**
 * Built-in system permissions that cannot be modified
 */
export const SYSTEM_PERMISSIONS: Permission[] = [];

/**
 * Permission categories for UI organization
 */
export interface PermissionCategory {
  name: string;
  description: string;
  permissions: Permission[];
  icon?: string;
}

// ============================================================================
// Role Types
// ============================================================================

/**
 * Extended role with additional metadata
 */
export interface RoleDefinition {
  id: string;
  name: UserRole;
  displayName: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean; // System roles cannot be deleted
  priority: number; // Higher priority roles take precedence
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Role assignment for a user
 */
export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy: string;
  expiresAt?: string;
}

// ============================================================================
// User Permission Types
// ============================================================================

/**
 * Custom permission override for a specific user
 */
export interface PermissionOverride {
  id: string;
  userId: string;
  permission: Permission;
  granted: boolean; // true = grant, false = deny
  reason?: string;
  createdAt: string;
  createdBy: string;
  expiresAt?: string;
}

/**
 * Effective permission result with source information
 */
export interface EffectivePermission {
  permission: Permission;
  granted: boolean;
  source: 'role' | 'override' | 'custom';
  reason?: string;
}

// ============================================================================
// Access Control Types
// ============================================================================

/**
 * Access control rule for route/component protection
 */
export interface AccessRule {
  /**
   * Required permission(s) to access the resource
   * - Single permission: must have that permission
   * - Array with requireAll: true: must have ALL permissions
   * - Array with requireAll: false: must have ANY of the permissions
   */
  permissions: Permission[] | Permission;
  
  /**
   * Whether ALL permissions are required (default: false = ANY)
   */
  requireAll?: boolean;
  
  /**
   * Fallback redirect URL when access is denied
   */
  redirectTo?: string;
  
  /**
   * Custom access denied message
   */
  message?: string;
  
  /**
   * Show access denied component instead of redirecting
   */
  showDeniedComponent?: boolean;
}

/**
 * Route access configuration
 */
export interface RouteAccess {
  path: string;
  rule: AccessRule;
  children?: RouteAccess[];
}

// ============================================================================
// RBAC Context Types
// ============================================================================

/**
 * RBAC context state
 */
export interface RBACState {
  isReady: boolean;
  permissions: Permission[];
  role: UserRole | null;
  isAdmin: boolean;
  customPermissions: Permission[];
  overrideMode: boolean;
}

/**
 * RBAC context actions
 */
export interface RBACActions {
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  getEffectivePermissions: () => Permission[];
  isRole: (role: UserRole) => boolean;
  can: (resource: ResourceType, action: ActionType, scope?: 'own' | 'department' | 'all') => boolean;
}

/**
 * Combined RBAC context type
 */
export type RBACContextType = RBACState & RBACActions;

// ============================================================================
// Permission Checker Options
// ============================================================================

/**
 * Options for permission checking
 */
export interface PermissionCheckOptions {
  /**
   * If true, admins bypass all permission checks
   */
  adminBypass?: boolean;
  
  /**
   * If true, checks custom overrides first
   */
  checkOverridesFirst?: boolean;
  
  /**
   * Custom callback for permission validation
   */
  validator?: (permission: Permission, userProfile: UserProfile | null) => boolean;
}

/**
 * Default permission check options
 */
export const DEFAULT_PERMISSION_OPTIONS: PermissionCheckOptions = {
  adminBypass: true,
  checkOverridesFirst: true,
};

// ============================================================================
// Export Types Summary
// ============================================================================

export type {
  UserProfile,
  UserRole,
  Permission,
  UserStatus
};
