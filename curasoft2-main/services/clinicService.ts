/**
 * Clinic Service
 * 
 * Handles all clinic and branch related operations
 * - CRUD operations for clinics and branches
 * - User-clinic access management
 * - Clinic settings management
 */

import { supabase } from '../supabaseClient';
import type {
  Clinic,
  ClinicBranch,
  UserClinicAccess,
  ClinicSettings,
  CreateClinicInput,
  UpdateClinicInput,
  CreateBranchInput,
  UpdateBranchInput,
  AssignUserToClinicInput,
  UpdateUserClinicAccessInput,
  ClinicServiceResponse,
  PaginatedClinicResponse,
} from '../auth/types';

// ============================================================================
// CLINIC OPERATIONS
// ============================================================================

/**
 * Get all clinics accessible to the current user
 */
export const getUserClinics = async (): Promise<ClinicServiceResponse<UserClinicAccess[]>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    const { data, error } = await supabase
      .from('user_clinics_view')
      .select('*')
      .order('is_default', { ascending: false })
      .order('clinic_name');

    if (error) {
      console.error('Error fetching user clinics:', error);
      return { success: false, error: error.message };
    }

    const clinics: UserClinicAccess[] = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      clinicId: row.clinic_id,
      clinicName: row.clinic_name,
      branchId: row.branch_id,
      branchName: row.branch_name,
      roleAtClinic: row.role_at_clinic,
      customPermissions: row.custom_permissions || [],
      isDefault: row.is_default,
      isActive: row.access_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
    }));

    return { success: true, data: clinics };
  } catch (error: any) {
    console.error('Error in getUserClinics:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get clinic details by ID
 */
export const getClinicById = async (clinicId: string): Promise<ClinicServiceResponse<Clinic>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    const { data, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', clinicId)
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Clinic not found' };
    }

    const clinic: Clinic = {
      id: data.id,
      name: data.name,
      code: data.code,
      description: data.description,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postal_code,
      phone: data.phone,
      email: data.email,
      website: data.website,
      logoUrl: data.logo_url,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
    };

    return { success: true, data: clinic };
  } catch (error: any) {
    console.error('Error in getClinicById:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all clinics (admin only)
 */
export const getAllClinics = async (
  page: number = 1,
  pageSize: number = 50
): Promise<ClinicServiceResponse<PaginatedClinicResponse<Clinic>>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('clinics')
      .select('*', { count: 'exact' })
      .order('name')
      .range(from, to);

    if (error) {
      return { success: false, error: error.message };
    }

    const clinics: Clinic[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description,
      address: row.address,
      city: row.city,
      state: row.state,
      country: row.country,
      postalCode: row.postal_code,
      phone: row.phone,
      email: row.email,
      website: row.website,
      logoUrl: row.logo_url,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
    }));

    return {
      success: true,
      data: {
        items: clinics,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };
  } catch (error: any) {
    console.error('Error in getAllClinics:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// BRANCH OPERATIONS
// ============================================================================

/**
 * Get branches for a clinic
 */
export const getClinicBranches = async (clinicId: string): Promise<ClinicServiceResponse<ClinicBranch[]>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    const { data, error } = await supabase
      .from('clinic_branches')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('is_main_branch', { ascending: false })
      .order('name');

    if (error) {
      return { success: false, error: error.message };
    }

    const branches: ClinicBranch[] = (data || []).map((row: any) => ({
      id: row.id,
      clinicId: row.clinic_id,
      name: row.name,
      code: row.code,
      branchType: row.branch_type,
      address: row.address,
      city: row.city,
      state: row.state,
      country: row.country,
      postalCode: row.postal_code,
      phone: row.phone,
      email: row.email,
      operatingHours: row.operating_hours,
      isActive: row.is_active,
      isMainBranch: row.is_main_branch,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
    }));

    return { success: true, data: branches };
  } catch (error: any) {
    console.error('Error in getClinicBranches:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get branch by ID
 */
export const getBranchById = async (branchId: string): Promise<ClinicServiceResponse<ClinicBranch>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    const { data, error } = await supabase
      .from('clinic_branches')
      .select('*')
      .eq('id', branchId)
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Branch not found' };
    }

    const branch: ClinicBranch = {
      id: data.id,
      clinicId: data.clinic_id,
      name: data.name,
      code: data.code,
      branchType: data.branch_type,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postal_code,
      phone: data.phone,
      email: data.email,
      operatingHours: data.operating_hours,
      isActive: data.is_active,
      isMainBranch: data.is_main_branch,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
    };

    return { success: true, data: branch };
  } catch (error: any) {
    console.error('Error in getBranchById:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// USER-CLINIC ACCESS OPERATIONS
// ============================================================================

/**
 * Assign user to clinic
 */
export const assignUserToClinic = async (
  input: AssignUserToClinicInput
): Promise<ClinicServiceResponse<UserClinicAccess>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    const { data, error } = await supabase
      .from('user_clinic_access')
      .insert({
        user_id: input.userId,
        clinic_id: input.clinicId,
        branch_id: input.branchId,
        role_at_clinic: input.roleAtClinic,
        custom_permissions: input.customPermissions || [],
        is_default: input.isDefault || false,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const access: UserClinicAccess = {
      id: data.id,
      userId: data.user_id,
      clinicId: data.clinic_id,
      branchId: data.branch_id,
      roleAtClinic: data.role_at_clinic,
      customPermissions: data.custom_permissions || [],
      isDefault: data.is_default,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
    };

    return { success: true, data: access };
  } catch (error: any) {
    console.error('Error in assignUserToClinic:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove user from clinic
 */
export const removeUserFromClinic = async (
  userId: string,
  clinicId: string,
  branchId?: string
): Promise<ClinicServiceResponse<void>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    let query = supabase
      .from('user_clinic_access')
      .delete()
      .eq('user_id', userId)
      .eq('clinic_id', clinicId);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in removeUserFromClinic:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// CLINIC SETTINGS OPERATIONS
// ============================================================================

/**
 * Get clinic settings
 */
export const getClinicSettings = async (
  clinicId: string,
  branchId?: string
): Promise<ClinicServiceResponse<ClinicSettings>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    let query = supabase
      .from('clinic_settings')
      .select('*')
      .eq('clinic_id', clinicId);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    } else {
      query = query.is('branch_id', null);
    }

    const { data, error } = await query.single();

    if (error) {
      return { success: false, error: error.message };
    }

    const settings: ClinicSettings = {
      id: data.id,
      clinicId: data.clinic_id,
      branchId: data.branch_id,
      settings: data.settings || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
    };

    return { success: true, data: settings };
  } catch (error: any) {
    console.error('Error in getClinicSettings:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update clinic settings
 */
export const updateClinicSettings = async (
  clinicId: string,
  settings: Partial<ClinicSettings['settings']>,
  branchId?: string
): Promise<ClinicServiceResponse<ClinicSettings>> => {
  try {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    // Get current settings
    const currentResult = await getClinicSettings(clinicId, branchId);
    if (!currentResult.success) {
      return { success: false, error: currentResult.error };
    }

    const currentSettings = currentResult.data!;
    const mergedSettings = {
      ...currentSettings.settings,
      ...settings,
    };

    const { data, error } = await supabase
      .from('clinic_settings')
      .update({
        settings: mergedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentSettings.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const updatedSettings: ClinicSettings = {
      id: data.id,
      clinicId: data.clinic_id,
      branchId: data.branch_id,
      settings: data.settings || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
    };

    return { success: true, data: updatedSettings };
  } catch (error: any) {
    console.error('Error in updateClinicSettings:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export const clinicService = {
  // Clinic operations
  getUserClinics,
  getClinicById,
  getAllClinics,
  
  // Branch operations
  getClinicBranches,
  getBranchById,
  
  // User-clinic access
  assignUserToClinic,
  removeUserFromClinic,
  
  // Settings
  getClinicSettings,
  updateClinicSettings,
};

export default clinicService;