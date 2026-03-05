import { supabase } from '../supabaseClient';
import type { ClinicServiceResponse } from '../auth/types';

export interface CreateClinicWithMainBranchInput {
  clinicName: string;
  clinicCode?: string;
  mainBranchName?: string;
  mainBranchCode?: string;
  ownerUserId?: string;
  ownerRole?: string;
  settings?: Record<string, any>;
}

export interface CreateClinicWithMainBranchResult {
  clinic_id: string;
  main_branch_id: string;
  owner_profile_id: string;
}

export interface CreateClinicBranchInput {
  clinicId: string;
  branchName: string;
  branchCode?: string;
  branchType?: 'MAIN' | 'BRANCH' | 'MOBILE' | 'VIRTUAL';
  setAsMain?: boolean;
  createdBy?: string;
  copyClinicWideMemberships?: boolean;
}

export interface AssignUserToClinicBranchInput {
  targetUserId: string;
  clinicId: string;
  branchId?: string | null;
  roleAtClinic?: string;
  isDefault?: boolean;
  customPermissions?: string[];
  createdBy?: string;
}

const extractRpcRow = <T>(data: any): T | null => {
  if (!data) return null;
  if (Array.isArray(data)) return (data[0] as T) || null;
  return data as T;
};

export const createClinicWithMainBranch = async (
  input: CreateClinicWithMainBranchInput,
): Promise<ClinicServiceResponse<CreateClinicWithMainBranchResult>> => {
  try {
    if (!supabase) return { success: false, error: 'Database not configured' };

    const { data, error } = await supabase.rpc('create_clinic_with_main_branch', {
      p_clinic_name: input.clinicName,
      p_clinic_code: input.clinicCode || null,
      p_main_branch_name: input.mainBranchName || 'Main Branch',
      p_main_branch_code: input.mainBranchCode || 'MAIN',
      p_owner_user_id: input.ownerUserId || null,
      p_owner_role: input.ownerRole || 'ADMIN',
      p_settings: input.settings || {},
    });

    if (error) return { success: false, error: error.message };

    const row = extractRpcRow<CreateClinicWithMainBranchResult>(data);
    if (!row) return { success: false, error: 'No row returned from create_clinic_with_main_branch' };

    return { success: true, data: row };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to create clinic with main branch' };
  }
};

export const createClinicBranch = async (
  input: CreateClinicBranchInput,
): Promise<ClinicServiceResponse<{ branchId: string }>> => {
  try {
    if (!supabase) return { success: false, error: 'Database not configured' };

    const { data, error } = await supabase.rpc('create_clinic_branch', {
      p_clinic_id: input.clinicId,
      p_branch_name: input.branchName,
      p_branch_code: input.branchCode || null,
      p_branch_type: input.branchType || 'BRANCH',
      p_set_as_main: input.setAsMain === true,
      p_created_by: input.createdBy || null,
      p_copy_clinic_wide_memberships: input.copyClinicWideMemberships !== false,
    });

    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: 'No branch id returned from create_clinic_branch' };

    return { success: true, data: { branchId: String(data) } };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to create branch' };
  }
};

export const assignUserToClinicBranch = async (
  input: AssignUserToClinicBranchInput,
): Promise<ClinicServiceResponse<{ accessId: string }>> => {
  try {
    if (!supabase) return { success: false, error: 'Database not configured' };

    const { data, error } = await supabase.rpc('assign_user_to_clinic_branch', {
      p_target_user_id: input.targetUserId,
      p_clinic_id: input.clinicId,
      p_branch_id: input.branchId || null,
      p_role_at_clinic: input.roleAtClinic || 'DOCTOR',
      p_is_default: input.isDefault === true,
      p_custom_permissions: input.customPermissions || [],
      p_created_by: input.createdBy || null,
    });

    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: 'No access id returned from assign_user_to_clinic_branch' };

    return { success: true, data: { accessId: String(data) } };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to assign user to clinic/branch' };
  }
};

export const bootstrapClinicBranchWorkspace = async (input?: {
  clinicName?: string;
  clinicCode?: string;
  mainBranchName?: string;
  mainBranchCode?: string;
}): Promise<ClinicServiceResponse<CreateClinicWithMainBranchResult>> => {
  try {
    if (!supabase) return { success: false, error: 'Database not configured' };

    const { data, error } = await supabase.rpc('bootstrap_clinic_branch_workspace', {
      p_clinic_name: input?.clinicName || 'Main Clinic',
      p_clinic_code: input?.clinicCode || 'MAIN',
      p_main_branch_name: input?.mainBranchName || 'Main Branch',
      p_main_branch_code: input?.mainBranchCode || 'MAIN',
    });

    if (error) return { success: false, error: error.message };

    const row = extractRpcRow<CreateClinicWithMainBranchResult>(data);
    if (!row) return { success: false, error: 'No row returned from bootstrap_clinic_branch_workspace' };

    return { success: true, data: row };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to bootstrap clinic/branch workspace' };
  }
};

export const clinicBranchModuleService = {
  createClinicWithMainBranch,
  createClinicBranch,
  assignUserToClinicBranch,
  bootstrapClinicBranchWorkspace,
};

export default clinicBranchModuleService;
