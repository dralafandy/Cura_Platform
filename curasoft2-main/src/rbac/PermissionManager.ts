/**
 * Permission Manager Service
 * 
 * Clean Architecture - Application Layer
 * Centralized permission management service for the RBAC system.
 */

import { Permission, UserRole, UserProfile } from '../../types';
import { 
  PermissionCheckOptions, 
  DEFAULT_PERMISSION_OPTIONS, 
  EffectivePermission,
  ResourceType,
  ActionType
} from './types';
import { ROLE_PERMISSIONS } from '../../utils/permissions';

// ============================================================================
// User Type for Permission Manager
// ============================================================================

/**
 * Minimal user interface required for permission checking
 * This allows compatibility with both User (from auth/types) and UserProfile (from types)
 */
export interface PermissionUser {
  id: string;
  role: UserRole;
  custom_permissions?: Permission[];
  override_permissions?: boolean;
  permissions?: string[]; // Legacy permissions array for backward compatibility
}

// ============================================================================
// Role Permission Definitions
// ============================================================================

/**
 * Default permissions for each role - single source of truth
 */
export const RBAC_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission),
  
  [UserRole.DOCTOR]: [
    // Patient Management
    Permission.PATIENT_VIEW,
    Permission.PATIENT_CREATE,
    Permission.PATIENT_EDIT,
    
    // Appointments
    Permission.APPOINTMENT_VIEW,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_EDIT,
    
    // Treatments
    Permission.TREATMENT_VIEW,
    Permission.TREATMENT_CREATE,
    Permission.TREATMENT_EDIT,
    
    // Prescriptions
    Permission.PRESCRIPTION_VIEW,
    Permission.PRESCRIPTION_CREATE,
    Permission.PRESCRIPTION_EDIT,
    
    // Lab Cases
    Permission.LAB_CASE_VIEW,
    Permission.LAB_CASE_MANAGE,
    
    // Reports
    Permission.REPORTS_VIEW,
    Permission.REPORTS_GENERATE,
    
    // Notifications
    Permission.NOTIFICATIONS_VIEW,
    Permission.NOTIFICATIONS_MANAGE,
    
    // Finance (limited)
    Permission.FINANCE_VIEW,
    Permission.FINANCE_ACCOUNTS_VIEW,
    
    // Settings (view only)
    Permission.SETTINGS_VIEW,
  ],
  
  [UserRole.ASSISTANT]: [
    // Patient Management
    Permission.PATIENT_VIEW,
    Permission.PATIENT_CREATE,
    Permission.PATIENT_EDIT,
    
    // Appointments
    Permission.APPOINTMENT_VIEW,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_EDIT,
    
    // Treatments
    Permission.TREATMENT_VIEW,
    Permission.TREATMENT_CREATE,
    Permission.TREATMENT_EDIT,
    
    // Prescriptions
    Permission.PRESCRIPTION_VIEW,
    Permission.PRESCRIPTION_CREATE,
    Permission.PRESCRIPTION_EDIT,
    
    // Lab Cases
    Permission.LAB_CASE_VIEW,
    Permission.LAB_CASE_MANAGE,
    
    // Inventory
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_MANAGE,
    Permission.INVENTORY_LOW_STOCK_ALERT,
    
    // Suppliers
    Permission.SUPPLIER_VIEW,
    
    // Reports
    Permission.REPORTS_VIEW,
    
    // Notifications
    Permission.NOTIFICATIONS_VIEW,
    Permission.NOTIFICATIONS_MANAGE,
    
    // Finance (limited)
    Permission.FINANCE_VIEW,
    Permission.FINANCE_EXPENSES_MANAGE,
    
    // Settings (view only)
    Permission.SETTINGS_VIEW,
  ],
  
  [UserRole.RECEPTIONIST]: [
    // Patient Management
    Permission.PATIENT_VIEW,
    Permission.PATIENT_CREATE,
    Permission.PATIENT_EDIT,
    
    // Appointments (full access)
    Permission.APPOINTMENT_VIEW,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_EDIT,
    Permission.APPOINTMENT_DELETE,
    
    // Finance (limited)
    Permission.FINANCE_VIEW,
    Permission.FINANCE_EXPENSES_MANAGE,
    
    // Reports
    Permission.REPORTS_VIEW,
    
    // Notifications
    Permission.NOTIFICATIONS_VIEW,
    Permission.NOTIFICATIONS_MANAGE,
    
    // Settings (view only)
    Permission.SETTINGS_VIEW,
  ],
};

// ============================================================================
// Permission Manager Class
// ============================================================================

/**
 * Centralized permission management
 */
export class PermissionManager {
  private user: PermissionUser | null;
  private options: PermissionCheckOptions;

  constructor(user: PermissionUser | null, options: PermissionCheckOptions = DEFAULT_PERMISSION_OPTIONS) {
    this.user = user;
    this.options = { ...DEFAULT_PERMISSION_OPTIONS, ...options };
  }

  // ==========================================================================
  // Core Permission Checks
  // ==========================================================================

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: Permission): boolean {
    // If no user profile, deny access
    if (!this.user) {
      return false;
    }

    // Admin bypass
    if (this.options.adminBypass && this.user.role === UserRole.ADMIN) {
      return true;
    }

    // Check custom overrides first
    if (this.options.checkOverridesFirst) {
      const overrideResult = this.checkOverride(permission);
      if (overrideResult !== null) {
        return overrideResult;
      }
    }

    // Check role-based permissions
    const rolePermissions = this.getRolePermissions();
    if (rolePermissions.includes(permission)) {
      return true;
    }

    // Check custom permissions
    const customPermissions = this.user.custom_permissions || [];
    if (customPermissions.includes(permission)) {
      return true;
    }

    // Check legacy permissions array for backward compatibility
    if (this.user.permissions && Array.isArray(this.user.permissions)) {
      const permissionString = permission.toString().toLowerCase();
      return this.user.permissions.some((p: string) => 
        p.toLowerCase() === permissionString || 
        p.toLowerCase().replace(/_/g, '') === permissionString.replace(/_/g, '')
      );
    }

    return false;
  }

  /**
   * Check if user has ANY of the specified permissions
   */
  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has ALL of the specified permissions
   */
  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  // ==========================================================================
  // Role-Based Helpers
  // ==========================================================================

  /**
   * Check if user has a specific role
   */
  isRole(role: UserRole): boolean {
    return this.user?.role === role;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.user?.role === UserRole.ADMIN;
  }

  /**
   * Check if user is doctor
   */
  isDoctor(): boolean {
    return this.user?.role === UserRole.DOCTOR;
  }

  /**
   * Check if user is assistant
   */
  isAssistant(): boolean {
    return this.user?.role === UserRole.ASSISTANT;
  }

  /**
   * Check if user is receptionist
   */
  isReceptionist(): boolean {
    return this.user?.role === UserRole.RECEPTIONIST;
  }

  // ==========================================================================
  // Resource-Action Permission Checks
  // ==========================================================================

  /**
   * Check permission using resource and action
   * Maps resource+action to a Permission enum value
   */
  can(resource: ResourceType, action: ActionType, scope: 'own' | 'department' | 'all' = 'all'): boolean {
    const permission = this.mapResourceActionToPermission(resource, action);
    if (!permission) {
      // If no direct mapping, check if user has any permission for this resource
      return this.hasResourcePermission(resource);
    }
    return this.hasPermission(permission);
  }

  /**
   * Map resource and action to a Permission enum
   */
  private mapResourceActionToPermission(resource: ResourceType, action: ActionType): Permission | null {
    const mapping: Record<string, Record<ActionType, Permission>> = {
      patient: {
        create: Permission.PATIENT_CREATE,
        read: Permission.PATIENT_VIEW,
        update: Permission.PATIENT_EDIT,
        delete: Permission.PATIENT_DELETE,
        manage: Permission.PATIENT_EDIT,
        view: Permission.PATIENT_VIEW,
      },
      appointment: {
        create: Permission.APPOINTMENT_CREATE,
        read: Permission.APPOINTMENT_VIEW,
        update: Permission.APPOINTMENT_EDIT,
        delete: Permission.APPOINTMENT_DELETE,
        manage: Permission.APPOINTMENT_EDIT,
        view: Permission.APPOINTMENT_VIEW,
      },
      treatment: {
        create: Permission.TREATMENT_CREATE,
        read: Permission.TREATMENT_VIEW,
        update: Permission.TREATMENT_EDIT,
        delete: Permission.TREATMENT_DELETE,
        manage: Permission.TREATMENT_EDIT,
        view: Permission.TREATMENT_VIEW,
      },
      prescription: {
        create: Permission.PRESCRIPTION_CREATE,
        read: Permission.PRESCRIPTION_VIEW,
        update: Permission.PRESCRIPTION_EDIT,
        delete: Permission.PRESCRIPTION_DELETE,
        manage: Permission.PRESCRIPTION_EDIT,
        view: Permission.PRESCRIPTION_VIEW,
      },
      user: {
        create: Permission.USER_MANAGEMENT_CREATE,
        read: Permission.USER_MANAGEMENT_VIEW,
        update: Permission.USER_MANAGEMENT_EDIT,
        delete: Permission.USER_MANAGEMENT_DELETE,
        manage: Permission.USER_MANAGEMENT_EDIT,
        view: Permission.USER_MANAGEMENT_VIEW,
      },
      finance: {
        create: Permission.FINANCE_INVOICES_MANAGE,
        read: Permission.FINANCE_VIEW,
        update: Permission.FINANCE_ACCOUNTS_MANAGE,
        delete: Permission.FINANCE_ACCOUNTS_MANAGE,
        manage: Permission.FINANCE_ACCOUNTS_MANAGE,
        view: Permission.FINANCE_VIEW,
      },
      inventory: {
        create: Permission.INVENTORY_MANAGE,
        read: Permission.INVENTORY_VIEW,
        update: Permission.INVENTORY_MANAGE,
        delete: Permission.INVENTORY_MANAGE,
        manage: Permission.INVENTORY_MANAGE,
        view: Permission.INVENTORY_VIEW,
      },
      lab_case: {
        create: Permission.LAB_CASE_MANAGE,
        read: Permission.LAB_CASE_VIEW,
        update: Permission.LAB_CASE_MANAGE,
        delete: Permission.LAB_CASE_MANAGE,
        manage: Permission.LAB_CASE_MANAGE,
        view: Permission.LAB_CASE_VIEW,
      },
      supplier: {
        create: Permission.SUPPLIER_MANAGE,
        read: Permission.SUPPLIER_VIEW,
        update: Permission.SUPPLIER_MANAGE,
        delete: Permission.SUPPLIER_MANAGE,
        manage: Permission.SUPPLIER_MANAGE,
        view: Permission.SUPPLIER_VIEW,
      },
      report: {
        create: Permission.REPORTS_GENERATE,
        read: Permission.REPORTS_VIEW,
        update: Permission.REPORTS_GENERATE,
        delete: Permission.REPORTS_GENERATE,
        manage: Permission.REPORTS_GENERATE,
        view: Permission.REPORTS_VIEW,
      },
      settings: {
        create: Permission.SETTINGS_EDIT,
        read: Permission.SETTINGS_VIEW,
        update: Permission.SETTINGS_EDIT,
        delete: Permission.SETTINGS_EDIT,
        manage: Permission.SETTINGS_EDIT,
        view: Permission.SETTINGS_VIEW,
      },
      notification: {
        create: Permission.NOTIFICATIONS_MANAGE,
        read: Permission.NOTIFICATIONS_VIEW,
        update: Permission.NOTIFICATIONS_MANAGE,
        delete: Permission.NOTIFICATIONS_MANAGE,
        manage: Permission.NOTIFICATIONS_MANAGE,
        view: Permission.NOTIFICATIONS_VIEW,
      },
      system: {
        create: Permission.SYSTEM_BACKUP,
        read: Permission.SYSTEM_LOGS_VIEW,
        update: Permission.SYSTEM_RESTORE,
        delete: Permission.SYSTEM_BACKUP,
        manage: Permission.SYSTEM_BACKUP,
        view: Permission.SYSTEM_LOGS_VIEW,
      },
    };

    return mapping[resource]?.[action] ?? null;
  }

  /**
   * Check if user has any permission for a resource type
   */
  private hasResourcePermission(resource: ResourceType): boolean {
    const allPermissions = this.getEffectivePermissions();
    const resourcePrefix = `${resource}_`;
    
    return allPermissions.some(permission => 
      permission.toString().toLowerCase().startsWith(resourcePrefix)
    );
  }

  // ==========================================================================
  // Effective Permissions
  // ==========================================================================

  /**
   * Get all effective permissions for the user
   */
  getEffectivePermissions(): Permission[] {
    if (!this.user) {
      return [];
    }

    // Admin has all permissions
    if (this.user.role === UserRole.ADMIN) {
      return Object.values(Permission);
    }

    // Get role permissions
    const rolePermissions = this.getRolePermissions();

    // Check override mode
    if (this.user.override_permissions) {
      return this.user.custom_permissions || [];
    }

    // Combine role and custom permissions
    const customPermissions = this.user.custom_permissions || [];
    const combined = new Set([...rolePermissions, ...customPermissions]);
    
    // Add legacy permissions for backward compatibility
    if (this.user.permissions && Array.isArray(this.user.permissions)) {
      // Convert legacy permissions to enum if possible
      this.user.permissions.forEach((p: string) => {
        const upperPermission = p.toUpperCase().replace(/ /g, '_') as Permission;
        if (Object.values(Permission).includes(upperPermission)) {
          combined.add(upperPermission);
        }
      });
    }

    return Array.from(combined);
  }

  /**
   * Get permissions from role only (without custom permissions)
   */
  getRolePermissions(): Permission[] {
    if (!this.user) {
      return [];
    }

    return RBAC_ROLE_PERMISSIONS[this.user.role] || [];
  }

  /**
   * Get effective permission details with source information
   */
  getEffectivePermissionDetails(): EffectivePermission[] {
    const allPermissions = Object.values(Permission);
    const rolePermissions = this.getRolePermissions();
    const customPermissions = this.user?.custom_permissions || [];

    return allPermissions.map(permission => {
      // Check if granted by role
      if (rolePermissions.includes(permission)) {
        return {
          permission,
          granted: true,
          source: 'role',
        };
      }

      // Check if granted by custom permissions
      if (customPermissions.includes(permission)) {
        return {
          permission,
          granted: true,
          source: 'custom',
        };
      }

      return {
        permission,
        granted: false,
        source: 'role',
      };
    });
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Check permission override (returns null if no override exists)
   */
  private checkOverride(permission: Permission): boolean | null {
    // This would check a PermissionOverride table in a real implementation
    // For now, we use the override_permissions flag on the user profile
    if (this.user?.override_permissions) {
      const customPermissions = this.user.custom_permissions || [];
      return customPermissions.includes(permission);
    }

    return null;
  }

  // ==========================================================================
  // Static Methods
  // ==========================================================================

  /**
   * Create a new PermissionManager instance
   */
  static create(userProfile: UserProfile | null): PermissionManager {
    return new PermissionManager(userProfile);
  }

  /**
   * Check if a role has a specific permission (static method)
   */
  static roleHasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = RBAC_ROLE_PERMISSIONS[role];
    return permissions?.includes(permission) ?? false;
  }

  /**
   * Get all permissions for a role (static method)
   */
  static getRolePermissions(role: UserRole): Permission[] {
    return RBAC_ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Get all available roles with their permissions
   */
  static getAllRoles(): Array<{ role: UserRole; permissions: Permission[]; displayName: string }> {
    return [
      { role: UserRole.ADMIN, permissions: RBAC_ROLE_PERMISSIONS[UserRole.ADMIN], displayName: 'Administrator' },
      { role: UserRole.DOCTOR, permissions: RBAC_ROLE_PERMISSIONS[UserRole.DOCTOR], displayName: 'Doctor' },
      { role: UserRole.ASSISTANT, permissions: RBAC_ROLE_PERMISSIONS[UserRole.ASSISTANT], displayName: 'Assistant' },
      { role: UserRole.RECEPTIONIST, permissions: RBAC_ROLE_PERMISSIONS[UserRole.RECEPTIONIST], displayName: 'Receptionist' },
    ];
  }
}

// ============================================================================
// Export Default Instance Creator
// ============================================================================

/**
 * Create a permission manager for the given user profile
 */
export const createPermissionManager = (user: PermissionUser | null): PermissionManager => {
  return new PermissionManager(user);
};

export default PermissionManager;
