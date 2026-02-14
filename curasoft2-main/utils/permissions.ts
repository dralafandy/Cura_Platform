/**
 * Permissions Utility - Role-based access control (RBAC) system
 * 
 * Features:
 * - Role-permission mappings
 * - Permission checking functions
 * - Permission categories for UI organization
 */

import { Permission, UserRole } from '../types';

// ============================================================================
// Role-Permission Mappings
// ============================================================================

/**
 * Default permissions for each role
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
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
// Permission Categories for UI Organization
// ============================================================================

export const PERMISSION_CATEGORIES: Record<string, Permission[]> = {
  'User Management': [
    Permission.USER_MANAGEMENT_VIEW,
    Permission.USER_MANAGEMENT_CREATE,
    Permission.USER_MANAGEMENT_EDIT,
    Permission.USER_MANAGEMENT_DELETE,
  ],
  'Patient Management': [
    Permission.PATIENT_VIEW,
    Permission.PATIENT_CREATE,
    Permission.PATIENT_EDIT,
    Permission.PATIENT_DELETE,
  ],
  'Appointments': [
    Permission.APPOINTMENT_VIEW,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_EDIT,
    Permission.APPOINTMENT_DELETE,
  ],
  'Treatments': [
    Permission.TREATMENT_VIEW,
    Permission.TREATMENT_CREATE,
    Permission.TREATMENT_EDIT,
    Permission.TREATMENT_DELETE,
  ],
  'Prescriptions': [
    Permission.PRESCRIPTION_VIEW,
    Permission.PRESCRIPTION_CREATE,
    Permission.PRESCRIPTION_EDIT,
    Permission.PRESCRIPTION_DELETE,
  ],
  'Finance': [
    Permission.FINANCE_VIEW,
    Permission.FINANCE_EXPENSES_MANAGE,
    Permission.FINANCE_INVOICES_MANAGE,
    Permission.FINANCE_ACCOUNTS_VIEW,
    Permission.FINANCE_ACCOUNTS_MANAGE,
  ],
  'Inventory': [
    Permission.INVENTORY_VIEW,
    Permission.INVENTORY_MANAGE,
    Permission.INVENTORY_LOW_STOCK_ALERT,
  ],
  'Lab Cases': [
    Permission.LAB_CASE_VIEW,
    Permission.LAB_CASE_MANAGE,
  ],
  'Suppliers': [
    Permission.SUPPLIER_VIEW,
    Permission.SUPPLIER_MANAGE,
  ],
  'Reports': [
    Permission.REPORTS_VIEW,
    Permission.REPORTS_GENERATE,
  ],
  'Settings': [
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
  ],
  'Notifications': [
    Permission.NOTIFICATIONS_VIEW,
    Permission.NOTIFICATIONS_MANAGE,
  ],
  'System Administration': [
    Permission.SYSTEM_BACKUP,
    Permission.SYSTEM_RESTORE,
    Permission.SYSTEM_LOGS_VIEW,
  ],
};

// ============================================================================
// Display Names for Permissions
// ============================================================================

export const PERMISSION_DISPLAY_NAMES: Record<Permission, string> = {
  [Permission.USER_MANAGEMENT_VIEW]: 'View Users',
  [Permission.USER_MANAGEMENT_CREATE]: 'Create Users',
  [Permission.USER_MANAGEMENT_EDIT]: 'Edit Users',
  [Permission.USER_MANAGEMENT_DELETE]: 'Delete Users',
  
  [Permission.PATIENT_VIEW]: 'View Patients',
  [Permission.PATIENT_CREATE]: 'Create Patients',
  [Permission.PATIENT_EDIT]: 'Edit Patients',
  [Permission.PATIENT_DELETE]: 'Delete Patients',
  
  [Permission.APPOINTMENT_VIEW]: 'View Appointments',
  [Permission.APPOINTMENT_CREATE]: 'Create Appointments',
  [Permission.APPOINTMENT_EDIT]: 'Edit Appointments',
  [Permission.APPOINTMENT_DELETE]: 'Delete Appointments',
  
  [Permission.TREATMENT_VIEW]: 'View Treatments',
  [Permission.TREATMENT_CREATE]: 'Create Treatments',
  [Permission.TREATMENT_EDIT]: 'Edit Treatments',
  [Permission.TREATMENT_DELETE]: 'Delete Treatments',
  
  [Permission.PRESCRIPTION_VIEW]: 'View Prescriptions',
  [Permission.PRESCRIPTION_CREATE]: 'Create Prescriptions',
  [Permission.PRESCRIPTION_EDIT]: 'Edit Prescriptions',
  [Permission.PRESCRIPTION_DELETE]: 'Delete Prescriptions',
  
  [Permission.FINANCE_VIEW]: 'View Finance',
  [Permission.FINANCE_EXPENSES_MANAGE]: 'Manage Expenses',
  [Permission.FINANCE_INVOICES_MANAGE]: 'Manage Invoices',
  [Permission.FINANCE_ACCOUNTS_VIEW]: 'View Accounts',
  [Permission.FINANCE_ACCOUNTS_MANAGE]: 'Manage Accounts',
  
  [Permission.INVENTORY_VIEW]: 'View Inventory',
  [Permission.INVENTORY_MANAGE]: 'Manage Inventory',
  [Permission.INVENTORY_LOW_STOCK_ALERT]: 'Low Stock Alerts',
  
  [Permission.LAB_CASE_VIEW]: 'View Lab Cases',
  [Permission.LAB_CASE_MANAGE]: 'Manage Lab Cases',
  
  [Permission.SUPPLIER_VIEW]: 'View Suppliers',
  [Permission.SUPPLIER_MANAGE]: 'Manage Suppliers',
  
  [Permission.REPORTS_VIEW]: 'View Reports',
  [Permission.REPORTS_GENERATE]: 'Generate Reports',
  
  [Permission.SETTINGS_VIEW]: 'View Settings',
  [Permission.SETTINGS_EDIT]: 'Edit Settings',
  
  [Permission.NOTIFICATIONS_VIEW]: 'View Notifications',
  [Permission.NOTIFICATIONS_MANAGE]: 'Manage Notifications',
  
  [Permission.SYSTEM_BACKUP]: 'System Backup',
  [Permission.SYSTEM_RESTORE]: 'System Restore',
  [Permission.SYSTEM_LOGS_VIEW]: 'View System Logs',
};

// ============================================================================
// Permission Checking Functions
// ============================================================================

/**
 * Get display name for a permission
 */
export const getPermissionDisplayName = (permission: Permission): string => {
  return PERMISSION_DISPLAY_NAMES[permission] || permission;
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Get effective permissions for a user considering role and custom permissions
 */
export const getEffectivePermissions = (
  role: UserRole,
  customPermissions?: Permission[],
  overrideMode: boolean = false
): Permission[] => {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  
  // If override mode is enabled, only use custom permissions
  if (overrideMode && customPermissions) {
    return customPermissions;
  }
  
  // Combine role permissions with custom permissions
  if (customPermissions && customPermissions.length > 0) {
    const combined = new Set([...rolePermissions, ...customPermissions]);
    return Array.from(combined);
  }
  
  return rolePermissions;
};

/**
 * Check if a user has a specific permission
 */
export const hasPermission = (
  role: UserRole,
  permission: Permission,
  customPermissions?: Permission[],
  overrideMode: boolean = false
): boolean => {
  // If override mode is enabled, only check custom permissions
  if (overrideMode && customPermissions) {
    return customPermissions.includes(permission);
  }
  
  // Check custom permissions first
  if (customPermissions?.includes(permission)) {
    return true;
  }
  
  // Fall back to role-based permissions
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};

/**
 * Check if a user has any of the specified permissions
 */
export const hasAnyPermission = (
  role: UserRole,
  permissions: Permission[],
  customPermissions?: Permission[],
  overrideMode: boolean = false
): boolean => {
  return permissions.some(permission => 
    hasPermission(role, permission, customPermissions, overrideMode)
  );
};

/**
 * Check if a user has all of the specified permissions
 */
export const hasAllPermissions = (
  role: UserRole,
  permissions: Permission[],
  customPermissions?: Permission[],
  overrideMode: boolean = false
): boolean => {
  return permissions.every(permission => 
    hasPermission(role, permission, customPermissions, overrideMode)
  );
};

// ============================================================================
// User Profile Permission Helpers
// ============================================================================

interface UserWithPermissions {
  role: UserRole;
  custom_permissions?: Permission[];
  override_permissions?: boolean;
}

/**
 * Check if a user has a specific permission (convenience function for user profiles)
 */
export const checkUserPermission = (
  user: UserWithPermissions | null,
  permission: Permission
): boolean => {
  if (!user) return false;
  return hasPermission(
    user.role, 
    permission, 
    user.custom_permissions, 
    user.override_permissions
  );
};

/**
 * Get all permissions for a user (convenience function for user profiles)
 */
export const getUserPermissions = (user: UserWithPermissions | null): Permission[] => {
  if (!user) return [];
  return getEffectivePermissions(
    user.role, 
    user.custom_permissions, 
    user.override_permissions
  );
};

// ============================================================================
// Role Helpers
// ============================================================================

/**
 * Get all available roles
 */
export const getAllRoles = (): UserRole[] => {
  return Object.values(UserRole);
};

/**
 * Get display name for a role
 */
export const getRoleDisplayName = (role: UserRole): string => {
  const displayNames: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Administrator',
    [UserRole.DOCTOR]: 'Doctor',
    [UserRole.ASSISTANT]: 'Assistant',
    [UserRole.RECEPTIONIST]: 'Receptionist',
  };
  return displayNames[role] || role;
};

/**
 * Get role color for UI
 */
export const getRoleColor = (role: UserRole): string => {
  const colors: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    [UserRole.DOCTOR]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    [UserRole.ASSISTANT]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    [UserRole.RECEPTIONIST]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
};
