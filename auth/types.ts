/**
 * Authentication & Authorization Types
 * Clean, well-structured type definitions for the new auth system
 */

// Re-export Permission, UserRole, and UserStatus from root types for consistency
export { Permission, UserRole, UserStatus } from '../types';

// Import for local use in this file
import { Permission, UserRole, UserStatus } from '../types';

// ============================================================================
// USER ROLES (kept for backward compatibility - delegates to root types)
// ============================================================================

// UserRole is now imported from root types.ts

// ============================================================================
// USER PERMISSIONS (kept for backward compatibility - delegates to root types)
// ============================================================================

// Permission is now imported from root types.ts

// ============================================================================
// USER STATUS
// ============================================================================

// UserStatus is now imported from root types.ts

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
  customPermissions: Permission[];
  overrideMode: boolean;
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
// CLINIC & BRANCH TYPES
// ============================================================================

export interface Clinic {
  id: string;
  name: string;
  code?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ClinicBranch {
  id: string;
  clinicId: string;
  clinicName?: string; // Joined field
  name: string;
  code?: string;
  branchType: 'MAIN' | 'BRANCH' | 'MOBILE' | 'VIRTUAL';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  operatingHours?: OperatingHours;
  isActive: boolean;
  isMainBranch: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string; // HH:MM format
  close: string; // HH:MM format
  isOpen: boolean;
  breakStart?: string;
  breakEnd?: string;
}

export interface UserClinicAccess {
  id: string;
  userId: string;
  clinicId: string;
  clinicName?: string; // Joined field
  branchId?: string;
  branchName?: string; // Joined field
  roleAtClinic: UserRole;
  customPermissions: Permission[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface ClinicSettings {
  id: string;
  clinicId: string;
  clinicName?: string;
  branchId?: string;
  branchName?: string;
  settings: {
    appointment?: {
      defaultDuration?: number;
      bufferTime?: number;
      maxAdvanceBookingDays?: number;
    };
    notifications?: {
      emailEnabled?: boolean;
      smsEnabled?: boolean;
      reminderHoursBefore?: number;
    };
    finance?: {
      currency?: string;
      taxRate?: number;
    };
    migrated?: boolean;
    migrationDate?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// ============================================================================
// CLINIC PERMISSIONS
// ============================================================================

export enum ClinicPermission {
  // Clinic Management
  CLINIC_CREATE = 'clinic:create',
  CLINIC_VIEW = 'clinic:view',
  CLINIC_UPDATE = 'clinic:update',
  CLINIC_DELETE = 'clinic:delete',
  CLINIC_MANAGE_SETTINGS = 'clinic:manage_settings',
  
  // Branch Management
  BRANCH_CREATE = 'branch:create',
  BRANCH_VIEW = 'branch:view',
  BRANCH_UPDATE = 'branch:update',
  BRANCH_DELETE = 'branch:delete',
  BRANCH_MANAGE_HOURS = 'branch:manage_hours',
  
  // User-Clinic Assignment
  USER_CLINIC_ASSIGN = 'user_clinic:assign',
  USER_CLINIC_REMOVE = 'user_clinic:remove',
  USER_CLINIC_UPDATE_ROLE = 'user_clinic:update_role',
}

// ============================================================================
// AUTH STATE WITH CLINIC CONTEXT
// ============================================================================

export interface AuthStateWithClinic extends AuthState {
  // Clinic Context
  currentClinic: Clinic | null;
  currentBranch: ClinicBranch | null;
  accessibleClinics: UserClinicAccess[];
  clinicSettings: ClinicSettings | null;
  
  // Clinic Loading States
  isLoadingClinics: boolean;
  isSwitchingClinic: boolean;
}

// ============================================================================
// AUTH CONTEXT TYPE (Base)
// ============================================================================

export interface AuthContextType {
  // Auth State
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // Permission Helpers
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasCustomPermission: (permission: Permission) => boolean;
  // Backward compatibility aliases for legacy screens/components
  checkPermission: (permission: Permission) => boolean;
  checkAnyPermission: (permissions: Permission[]) => boolean;
  checkAllPermissions: (permissions: Permission[]) => boolean;
  checkCustomPermission: (permission: Permission) => boolean;
  
  // Helpers
  isAdmin: boolean;
  user: User | null;
  userProfile: User | null; // Alias for backward compatibility
  isLoading: boolean;
  loading: boolean; // Alias for backward compatibility
}

// ============================================================================
// AUTH CONTEXT TYPE WITH CLINIC METHODS
// ============================================================================

export interface AuthContextTypeWithClinic extends AuthContextType {
  // Clinic State
  currentClinic: Clinic | null;
  currentBranch: ClinicBranch | null;
  accessibleClinics: UserClinicAccess[];
  clinicSettings: ClinicSettings | null;
  isLoadingClinics: boolean;
  isSwitchingClinic: boolean;
  
  // Clinic Methods
  switchClinic: (clinicId: string, branchId?: string) => Promise<void>;
  switchBranch: (branchId: string) => Promise<void>;
  refreshClinics: () => Promise<void>;
  hasClinicPermission: (permission: ClinicPermission) => boolean;
  hasClinicAccess: (clinicId: string) => boolean;
  hasBranchAccess: (branchId: string) => boolean;
}

// ============================================================================
// SERVICE INPUT/OUTPUT TYPES
// ============================================================================

// ============================================================================
// MULTI-TENANT TYPES (Subscriptions & Tenants)
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  
  // Subscription
  subscription_status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
  subscription_plan: string;
  trial_start_date?: string;
  trial_end_date?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  max_users: number;
  max_patients: number;
  
  // Payment
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  payment_method?: 'monthly' | 'yearly';
  
  // Settings
  settings?: Record<string, any>;
  features?: Record<string, boolean>;
  
  // Branding
  primary_color?: string;
  secondary_color?: string;
  brand_name?: string;
  
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_patients: number;
  max_storage_mb: number;
  features: string[];
  is_active: boolean;
  is_trial: boolean;
  trial_days: number;
  sort_order: number;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  subscription_status: string;
  subscription_plan: string;
  trial_days_remaining: number;
  is_subscription_valid: boolean;
  max_users: number;
  max_patients: number;
  current_users: number;
  current_patients: number;
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  owner_email: string;
  owner_password?: string;
}

export interface CreateClinicInput {
  name: string;
  code?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface UpdateClinicInput {
  name?: string;
  code?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface CreateBranchInput {
  clinicId: string;
  name: string;
  code?: string;
  branchType?: 'MAIN' | 'BRANCH' | 'MOBILE' | 'VIRTUAL';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  operatingHours?: OperatingHours;
  isMainBranch?: boolean;
}

export interface UpdateBranchInput {
  name?: string;
  code?: string;
  branchType?: 'MAIN' | 'BRANCH' | 'MOBILE' | 'VIRTUAL';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  operatingHours?: OperatingHours;
  isActive?: boolean;
  isMainBranch?: boolean;
}

export interface AssignUserToClinicInput {
  userId: string;
  clinicId: string;
  branchId?: string;
  roleAtClinic: UserRole;
  customPermissions?: Permission[];
  isDefault?: boolean;
}

export interface UpdateUserClinicAccessInput {
  roleAtClinic?: UserRole;
  customPermissions?: Permission[];
  isDefault?: boolean;
  isActive?: boolean;
}

export interface ClinicServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedClinicResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
