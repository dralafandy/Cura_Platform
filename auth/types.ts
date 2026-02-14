/**
 * Authentication & Authorization Types
 * Clean, well-structured type definitions for the new auth system
 */

// ============================================================================
// USER ROLES
// ============================================================================

export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  ASSISTANT = 'ASSISTANT',
  RECEPTIONIST = 'RECEPTIONIST',
}

// ============================================================================
// USER PERMISSIONS
// ============================================================================

export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // Patients
  PATIENT_CREATE = 'patient:create',
  PATIENT_READ = 'patient:read',
  PATIENT_UPDATE = 'patient:update',
  PATIENT_DELETE = 'patient:delete',

  // Appointments
  APPOINTMENT_CREATE = 'appointment:create',
  APPOINTMENT_READ = 'appointment:read',
  APPOINTMENT_UPDATE = 'appointment:update',
  APPOINTMENT_DELETE = 'appointment:delete',

  // Treatments
  TREATMENT_CREATE = 'treatment:create',
  TREATMENT_READ = 'treatment:read',
  TREATMENT_UPDATE = 'treatment:update',
  TREATMENT_DELETE = 'treatment:delete',

  // Finance & Payments
  FINANCE_VIEW = 'finance:view',
  FINANCE_MANAGE = 'finance:manage',
  PAYMENT_VIEW = 'payment:view',
  PAYMENT_MANAGE = 'payment:manage',

  // Inventory
  INVENTORY_VIEW = 'inventory:view',
  INVENTORY_MANAGE = 'inventory:manage',

  // Reports
  REPORT_VIEW = 'report:view',
  REPORT_GENERATE = 'report:generate',

  // System
  SYSTEM_SETTINGS = 'system:settings',
}

// ============================================================================
// USER STATUS
// ============================================================================

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface User {
  id: string;
  email?: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  status: UserStatus;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface Role {
  id: string;
  name: UserRole;
  displayName: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean; // System roles cannot be deleted
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permission: Permission;
  createdAt: Date;
}

export interface UserRole_Assignment {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy: string;
}

export interface UserPermissionOverride {
  id: string;
  userId: string;
  permission: Permission;
  granted: boolean; // true = grant, false = deny (override)
  reason?: string;
  createdAt: Date;
  createdBy: string;
  expiresAt?: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PERMISSION_GRANT = 'PERMISSION_GRANT',
  PERMISSION_REVOKE = 'PERMISSION_REVOKE',
}

// ============================================================================
// AUTH CONTEXT
// ============================================================================

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  permissions: Permission[];
  role: UserRole | null;
  token?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface CreateUserInput {
  username: string;
  email?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status?: UserStatus;
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  avatar_url?: string;
}

// ============================================================================
// SESSION
// ============================================================================

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string;
  expiresAt: Date;
  createdAt: Date;
  lastActivityAt: Date;
  isActive: boolean;
}

// ============================================================================
// SERVICE RESPONSES
// ============================================================================

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
