/**
 * Clinic Management Page
 * 
 * Features:
 * - Create, edit, delete clinics
 * - Manage clinic branches
 * - Assign users to clinics
 * - Configure clinic settings
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../auth/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useI18n } from '../../hooks/useI18n';
import { useTheme } from '../../contexts/ThemeContext';
import type { Clinic, ClinicBranch, UserClinicAccess } from '../../auth/types';
import { UserRole, Permission } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

interface ClinicWithBranches extends Clinic {
  branches?: ClinicBranch[];
  userCount?: number;
}

interface AssignableUser {
  id: string;
  username?: string | null;
  role?: string | null;
  status?: string | null;
}

interface ClinicUserAssignment extends UserClinicAccess {
  userProfile?: AssignableUser;
}

interface BranchFormData {
  name: string;
  code: string;
  branchType: 'MAIN' | 'BRANCH' | 'MOBILE' | 'VIRTUAL';
  address: string;
  city: string;
  phone: string;
  email: string;
  isMainBranch: boolean;
}

interface ClinicFormData {
  name: string;
  code: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  primaryColor: string;
  secondaryColor: string;
}

const defaultClinicForm: ClinicFormData = {
  name: '',
  code: '',
  description: '',
  address: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  phone: '',
  email: '',
  website: '',
  primaryColor: '#0891b2',
  secondaryColor: '#0284c7',
};

const defaultBranchForm: BranchFormData = {
  name: '',
  code: '',
  branchType: 'BRANCH',
  address: '',
  city: '',
  phone: '',
  email: '',
  isMainBranch: false,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ClinicManagementPage: React.FC = () => {
  const { t } = useI18n();
  const { isDark } = useTheme();
  const { addNotification } = useNotification();
  const { isAdmin, hasPermission } = useAuth();

  // State
  const [clinics, setClinics] = useState<ClinicWithBranches[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<ClinicWithBranches | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'clinics' | 'branches' | 'users'>('clinics');
  
  // Modal states
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showUserAssignModal, setShowUserAssignModal] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [editingBranch, setEditingBranch] = useState<ClinicBranch | null>(null);
  const [clinicUsers, setClinicUsers] = useState<ClinicUserAssignment[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AssignableUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserRole, setSelectedUserRole] = useState<UserRole>(UserRole.RECEPTIONIST);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // Form data
  const [clinicForm, setClinicForm] = useState<ClinicFormData>(defaultClinicForm);
  const [branchForm, setBranchForm] = useState<BranchFormData>(defaultBranchForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check permissions
  const canManageClinics = isAdmin || hasPermission(Permission.SETTINGS_EDIT);
  const canViewBranches = isAdmin || hasPermission(Permission.CLINIC_BRANCH_VIEW);
  const canCreateBranches = isAdmin || hasPermission(Permission.CLINIC_BRANCH_CREATE);
  const canEditBranches = isAdmin || hasPermission(Permission.CLINIC_BRANCH_EDIT);
  const canDeleteBranches = isAdmin || hasPermission(Permission.CLINIC_BRANCH_DELETE);

  // Fetch clinics on mount
  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && selectedClinic) {
      fetchClinicUsers(selectedClinic.id);
    }
  }, [activeTab, selectedClinic]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchClinics = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      // Fetch clinics
      const { data: clinicsData, error: clinicsError } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false });

      if (clinicsError) throw clinicsError;

      // Fetch branches for each clinic
      const clinicsWithBranches = await Promise.all(
        (clinicsData || []).map(async (clinic) => {
          const { data: branches } = await supabase!
            .from('clinic_branches')
            .select('*')
            .eq('clinic_id', clinic.id)
            .order('is_main_branch', { ascending: false });

          // Count users assigned to this clinic
          const { count } = await supabase!
            .from('user_clinics')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', clinic.id);

          return {
            ...clinic,
            branches: branches || [],
            userCount: count || 0,
          } as ClinicWithBranches;
        })
      );

      setClinics(clinicsWithBranches);
      
      // Select first clinic by default
      if (clinicsWithBranches.length > 0 && !selectedClinic) {
        setSelectedClinic(clinicsWithBranches[0]);
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
      addNotification({
        message: 'Failed to load clinics',
        type: 'error' as any,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClinicUsers = async (clinicId: string) => {
    if (!supabase) return;

    setUsersLoading(true);
    try {
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('user_clinics')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      const assignments = (assignmentsData || []) as any[];
      const userIds = assignments.map((x) => x.user_id || x.userId).filter(Boolean);

      let profilesMap = new Map<string, AssignableUser>();
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, username, role, status')
          .in('id', userIds);

        if (profilesError) throw profilesError;
        profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p as AssignableUser]));
      }

      const merged: ClinicUserAssignment[] = assignments.map((item: any) => ({
        ...item,
        userProfile: profilesMap.get(item.user_id || item.userId),
      }));

      setClinicUsers(merged);

      const { data: allUsersData, error: allUsersError } = await supabase
        .from('user_profiles')
        .select('id, username, role, status')
        .order('username', { ascending: true });

      if (allUsersError) throw allUsersError;

      const assignedSet = new Set(merged.map((x: any) => x.user_id || x.userId));
      const filtered = ((allUsersData || []) as AssignableUser[]).filter((u) => !assignedSet.has(u.id));
      setAvailableUsers(filtered);
    } catch (error: any) {
      console.error('Error fetching clinic users:', error);
      addNotification({
        message: error.message || 'Failed to load clinic users',
        type: 'error' as any,
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const openAssignUserModal = () => {
    if (!selectedClinic) return;
    setSelectedUserId('');
    setSelectedUserRole(UserRole.RECEPTIONIST);
    setShowUserAssignModal(true);
  };

  const handleAssignUser = async () => {
    if (!supabase || !selectedClinic || !selectedUserId) return;

    setIsSubmitting(true);
    try {
      const existing = clinicUsers.find((x: any) => (x.user_id || x.userId) === selectedUserId);
      if (existing) {
        const { error } = await supabase
          .from('user_clinics')
          .update({
            role_at_clinic: selectedUserRole,
            access_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_clinics')
          .insert({
            user_id: selectedUserId,
            clinic_id: selectedClinic.id,
            role_at_clinic: selectedUserRole,
            access_active: true,
          });

        if (error) throw error;
      }

      addNotification({
        message: 'User assigned to clinic successfully',
        type: 'success' as any,
      });
      setShowUserAssignModal(false);
      await fetchClinicUsers(selectedClinic.id);
      await fetchClinics();
    } catch (error: any) {
      console.error('Error assigning user to clinic:', error);
      addNotification({
        message: error.message || 'Failed to assign user',
        type: 'error' as any,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveUserAssignment = async (assignmentId: string) => {
    if (!supabase || !selectedClinic) return;
    if (!window.confirm('Remove this user from the clinic?')) return;

    try {
      const { error } = await supabase
        .from('user_clinics')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      addNotification({
        message: 'User removed from clinic',
        type: 'success' as any,
      });
      await fetchClinicUsers(selectedClinic.id);
      await fetchClinics();
    } catch (error: any) {
      console.error('Error removing user assignment:', error);
      addNotification({
        message: error.message || 'Failed to remove user',
        type: 'error' as any,
      });
    }
  };

  // ============================================================================
  // CLINIC CRUD
  // ============================================================================

  const handleCreateClinic = async () => {
    if (!supabase || !canManageClinics) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('clinics')
        .insert({
          name: clinicForm.name,
          code: clinicForm.code || undefined,
          description: clinicForm.description || undefined,
          address: clinicForm.address || undefined,
          city: clinicForm.city || undefined,
          state: clinicForm.state || undefined,
          country: clinicForm.country || undefined,
          postal_code: clinicForm.postalCode || undefined,
          phone: clinicForm.phone || undefined,
          email: clinicForm.email || undefined,
          website: clinicForm.website || undefined,
          primary_color: clinicForm.primaryColor || undefined,
          secondary_color: clinicForm.secondaryColor || undefined,
          status: 'ACTIVE',
        })
        .select()
        .single();

      if (error) throw error;

      addNotification({
        message: `Clinic "${clinicForm.name}" created successfully`,
        type: 'success' as any,
      });

      setShowClinicModal(false);
      setClinicForm(defaultClinicForm);
      fetchClinics();
    } catch (error: any) {
      console.error('Error creating clinic:', error);
      addNotification({
        message: error.message || 'Failed to create clinic',
        type: 'error' as any,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClinic = async () => {
    if (!supabase || !canManageClinics || !editingClinic) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('clinics')
        .update({
          name: clinicForm.name,
          code: clinicForm.code || undefined,
          description: clinicForm.description || undefined,
          address: clinicForm.address || undefined,
          city: clinicForm.city || undefined,
          state: clinicForm.state || undefined,
          country: clinicForm.country || undefined,
          postal_code: clinicForm.postalCode || undefined,
          phone: clinicForm.phone || undefined,
          email: clinicForm.email || undefined,
          website: clinicForm.website || undefined,
          primary_color: clinicForm.primaryColor || undefined,
          secondary_color: clinicForm.secondaryColor || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingClinic.id);

      if (error) throw error;

      addNotification({
        message: `Clinic "${clinicForm.name}" updated successfully`,
        type: 'success' as any,
      });

      setShowClinicModal(false);
      setEditingClinic(null);
      setClinicForm(defaultClinicForm);
      fetchClinics();
    } catch (error: any) {
      console.error('Error updating clinic:', error);
      addNotification({
        message: error.message || 'Failed to update clinic',
        type: 'error' as any,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClinic = async (clinic: Clinic) => {
    if (!supabase || !canManageClinics) return;
    
    if (!window.confirm(`Are you sure you want to delete "${clinic.name}"? This will also delete all branches and user assignments.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clinics')
        .delete()
        .eq('id', clinic.id);

      if (error) throw error;

      addNotification({
        message: `Clinic "${clinic.name}" deleted successfully`,
        type: 'success' as any,
      });

      if (selectedClinic?.id === clinic.id) {
        setSelectedClinic(null);
      }
      fetchClinics();
    } catch (error: any) {
      console.error('Error deleting clinic:', error);
      addNotification({
        message: error.message || 'Failed to delete clinic',
        type: 'error' as any,
      });
    }
  };

  // ============================================================================
  // BRANCH CRUD
  // ============================================================================

  const handleCreateBranch = async () => {
    if (!supabase || !canCreateBranches || !selectedClinic) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('clinic_branches')
        .insert({
          clinic_id: selectedClinic.id,
          name: branchForm.name,
          code: branchForm.code || undefined,
          branch_type: branchForm.branchType,
          address: branchForm.address || undefined,
          city: branchForm.city || undefined,
          phone: branchForm.phone || undefined,
          email: branchForm.email || undefined,
          is_main_branch: branchForm.isMainBranch,
          is_active: true,
        });

      if (error) throw error;

      addNotification({
        message: `Branch "${branchForm.name}" created successfully`,
        type: 'success' as any,
      });

      setShowBranchModal(false);
      setBranchForm(defaultBranchForm);
      fetchClinics();
    } catch (error: any) {
      console.error('Error creating branch:', error);
      addNotification({
        message: error.message || 'Failed to create branch',
        type: 'error' as any,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBranch = async () => {
    if (!supabase || !canEditBranches || !editingBranch) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('clinic_branches')
        .update({
          name: branchForm.name,
          code: branchForm.code || undefined,
          branch_type: branchForm.branchType,
          address: branchForm.address || undefined,
          city: branchForm.city || undefined,
          phone: branchForm.phone || undefined,
          email: branchForm.email || undefined,
          is_main_branch: branchForm.isMainBranch,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingBranch.id);

      if (error) throw error;

      addNotification({
        message: `Branch "${branchForm.name}" updated successfully`,
        type: 'success' as any,
      });

      setShowBranchModal(false);
      setEditingBranch(null);
      setBranchForm(defaultBranchForm);
      fetchClinics();
    } catch (error: any) {
      console.error('Error updating branch:', error);
      addNotification({
        message: error.message || 'Failed to update branch',
        type: 'error' as any,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBranch = async (branch: ClinicBranch) => {
    if (!supabase || !canDeleteBranches) return;
    
    if (!window.confirm(`Are you sure you want to delete branch "${branch.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clinic_branches')
        .delete()
        .eq('id', branch.id);

      if (error) throw error;

      addNotification({
        message: `Branch "${branch.name}" deleted successfully`,
        type: 'success' as any,
      });
      fetchClinics();
    } catch (error: any) {
      console.error('Error deleting branch:', error);
      addNotification({
        message: error.message || 'Failed to delete branch',
        type: 'error' as any,
      });
    }
  };

  // ============================================================================
  // MODAL HANDLERS
  // ============================================================================

  const openCreateClinicModal = () => {
    setEditingClinic(null);
    setClinicForm(defaultClinicForm);
    setShowClinicModal(true);
  };

  const openEditClinicModal = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setClinicForm({
      name: clinic.name,
      code: clinic.code || '',
      description: clinic.description || '',
      address: clinic.address || '',
      city: clinic.city || '',
      state: clinic.state || '',
      country: clinic.country || '',
      postalCode: clinic.postalCode || '',
      phone: clinic.phone || '',
      email: clinic.email || '',
      website: clinic.website || '',
      primaryColor: clinic.primaryColor || '#0891b2',
      secondaryColor: clinic.secondaryColor || '#0284c7',
    });
    setShowClinicModal(true);
  };

  const openCreateBranchModal = () => {
    if (!selectedClinic) {
      addNotification({
        message: 'Please select a clinic first',
        type: 'warning' as any,
      });
      return;
    }
    setEditingBranch(null);
    setBranchForm(defaultBranchForm);
    setShowBranchModal(true);
  };

  const openEditBranchModal = (branch: ClinicBranch) => {
    setEditingBranch(branch);
    setBranchForm({
      name: branch.name,
      code: branch.code || '',
      branchType: branch.branchType,
      address: branch.address || '',
      city: branch.city || '',
      phone: branch.phone || '',
      email: branch.email || '',
      isMainBranch: branch.isMainBranch,
    });
    setShowBranchModal(true);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!canManageClinics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Access Denied</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">You don't have permission to manage clinics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Clinic Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage clinics, branches, and user assignments
          </p>
        </div>
        <button
          onClick={openCreateClinicModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Clinic
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clinics List */}
        <div className="lg:col-span-1">
          <div className={`rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                Clinics ({clinics.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-slate-500 dark:text-slate-400 mt-2">Loading clinics...</p>
                </div>
              ) : clinics.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-slate-500 dark:text-slate-400">No clinics found</p>
                  <button
                    onClick={openCreateClinicModal}
                    className="mt-3 text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                  >
                    Create your first clinic
                  </button>
                </div>
              ) : (
                clinics.map((clinic) => (
                  <div
                    key={clinic.id}
                    onClick={() => setSelectedClinic(clinic)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedClinic?.id === clinic.id
                        ? 'bg-cyan-50 dark:bg-cyan-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: clinic.primaryColor || '#0891b2' }}
                        >
                          {clinic.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-800 dark:text-slate-100">
                            {clinic.name}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {clinic.branches?.length || 0} branches • {clinic.userCount || 0} users
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        clinic.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {clinic.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Clinic Details */}
        <div className="lg:col-span-2">
          {selectedClinic ? (
            <div className={`rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
              {/* Clinic Header */}
              <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'} flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: selectedClinic.primaryColor || '#0891b2' }}
                  >
                    {selectedClinic.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                      {selectedClinic.name}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {selectedClinic.code && `Code: ${selectedClinic.code}`}
                      {selectedClinic.city && ` • ${selectedClinic.city}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditClinicModal(selectedClinic)}
                    className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Edit Clinic"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteClinic(selectedClinic)}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Delete Clinic"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className="flex gap-1 px-4">
                  {[
                    ...(canViewBranches ? [{ id: 'branches', label: 'Branches', count: selectedClinic.branches?.length || 0 }] : []),
                    { id: 'users', label: 'Users', count: selectedClinic.userCount || 0 },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                          : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {tab.label}
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        activeTab === tab.id
                          ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'branches' && canViewBranches && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-slate-800 dark:text-slate-100">
                        Branches
                      </h3>
                      {canCreateBranches && (
                        <button
                          onClick={openCreateBranchModal}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Branch
                        </button>
                      )}
                    </div>

                    {selectedClinic.branches && selectedClinic.branches.length > 0 ? (
                      <div className="space-y-3">
                        {selectedClinic.branches.map((branch) => (
                          <div
                            key={branch.id}
                            className={`p-4 rounded-lg border ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  branch.isMainBranch
                                    ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400'
                                    : 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
                                }`}>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-slate-800 dark:text-slate-100">
                                      {branch.name}
                                    </h4>
                                    {branch.isMainBranch && (
                                      <span className="px-2 py-0.5 text-xs font-medium bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 rounded-full">
                                        Main
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {branch.branchType} {branch.city && `• ${branch.city}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {canEditBranches && (
                                  <button
                                    onClick={() => openEditBranchModal(branch)}
                                    className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-600 rounded transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                )}
                                {canDeleteBranches && (
                                  <button
                                    onClick={() => handleDeleteBranch(branch)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-600 rounded transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-slate-500 dark:text-slate-400">No branches yet</p>
                        {canCreateBranches && (
                          <button
                            onClick={openCreateBranchModal}
                            className="mt-3 text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                          >
                            Add your first branch
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'users' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-slate-800 dark:text-slate-100">
                        Assigned Users
                      </h3>
                      <button
                        onClick={openAssignUserModal}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Assign User
                      </button>
                    </div>

                    {usersLoading ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Loading users...</p>
                      </div>
                    ) : clinicUsers.length === 0 ? (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p className="text-slate-500 dark:text-slate-400">No users assigned to this clinic</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {clinicUsers.map((assignment: any) => (
                          <div
                            key={assignment.id}
                            className={`p-4 rounded-lg border ${isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-slate-800 dark:text-slate-100">
                                  {assignment.userProfile?.username || assignment.user_id}
                                </h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  @{assignment.userProfile?.username || 'unknown'} • {assignment.role_at_clinic || 'RECEPTIONIST'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  assignment.access_active
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}>
                                  {assignment.access_active ? 'Active' : 'Inactive'}
                                </span>
                                <button
                                  onClick={() => handleRemoveUserAssignment(assignment.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-600 rounded transition-colors"
                                  title="Remove user from clinic"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={`rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm flex items-center justify-center min-h-[400px]`}>
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-slate-500 dark:text-slate-400">Select a clinic to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clinic Modal */}
      {showClinicModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-xl`}>
            <div className={`sticky top-0 px-6 py-4 border-b ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} flex items-center justify-between`}>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                {editingClinic ? 'Edit Clinic' : 'Create New Clinic'}
              </h2>
              <button
                onClick={() => {
                  setShowClinicModal(false);
                  setEditingClinic(null);
                  setClinicForm(defaultClinicForm);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); editingClinic ? handleUpdateClinic() : handleCreateClinic(); }} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Clinic Name *
                  </label>
                  <input
                    type="text"
                    value={clinicForm.name}
                    onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                    required
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                    placeholder="Enter clinic name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    value={clinicForm.code}
                    onChange={(e) => setClinicForm({ ...clinicForm, code: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                    placeholder="e.g., CLINIC001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={clinicForm.phone}
                    onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={clinicForm.email}
                    onChange={(e) => setClinicForm({ ...clinicForm, email: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={clinicForm.website}
                    onChange={(e) => setClinicForm({ ...clinicForm, website: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={clinicForm.address}
                    onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                    placeholder="Enter address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={clinicForm.city}
                    onChange={(e) => setClinicForm({ ...clinicForm, city: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={clinicForm.country}
                    onChange={(e) => setClinicForm({ ...clinicForm, country: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                    placeholder="Enter country"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={clinicForm.description}
                    onChange={(e) => setClinicForm({ ...clinicForm, description: e.target.value })}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                    placeholder="Enter clinic description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={clinicForm.primaryColor}
                      onChange={(e) => setClinicForm({ ...clinicForm, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={clinicForm.primaryColor}
                      onChange={(e) => setClinicForm({ ...clinicForm, primaryColor: e.target.value })}
                      className={`flex-1 px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={clinicForm.secondaryColor}
                      onChange={(e) => setClinicForm({ ...clinicForm, secondaryColor: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={clinicForm.secondaryColor}
                      onChange={(e) => setClinicForm({ ...clinicForm, secondaryColor: e.target.value })}
                      className={`flex-1 px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                    />
                  </div>
                </div>
              </div>

              <div className={`pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'} flex justify-end gap-3`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowClinicModal(false);
                    setEditingClinic(null);
                    setClinicForm(defaultClinicForm);
                  }}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !clinicForm.name}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : editingClinic ? 'Update Clinic' : 'Create Clinic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branch Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-xl`}>
            <div className={`sticky top-0 px-6 py-4 border-b ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} flex items-center justify-between`}>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                {editingBranch ? 'Edit Branch' : 'Create New Branch'}
              </h2>
              <button
                onClick={() => {
                  setShowBranchModal(false);
                  setEditingBranch(null);
                  setBranchForm(defaultBranchForm);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); editingBranch ? handleUpdateBranch() : handleCreateBranch(); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  required
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                  placeholder="Enter branch name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                    placeholder="e.g., BR001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Type
                  </label>
                  <select
                    value={branchForm.branchType}
                    onChange={(e) => setBranchForm({ ...branchForm, branchType: e.target.value as any })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                  >
                    <option value="MAIN">Main</option>
                    <option value="BRANCH">Branch</option>
                    <option value="MOBILE">Mobile</option>
                    <option value="VIRTUAL">Virtual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                  placeholder="Enter address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={branchForm.city}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                    placeholder="Enter phone"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isMainBranch"
                  checked={branchForm.isMainBranch}
                  onChange={(e) => setBranchForm({ ...branchForm, isMainBranch: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 border-slate-300 rounded focus:ring-cyan-500"
                />
                <label htmlFor="isMainBranch" className="text-sm text-slate-700 dark:text-slate-300">
                  Set as main branch
                </label>
              </div>

              <div className={`pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'} flex justify-end gap-3`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowBranchModal(false);
                    setEditingBranch(null);
                    setBranchForm(defaultBranchForm);
                  }}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !branchForm.name}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : editingBranch ? 'Update Branch' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Assignment Modal */}
      {showUserAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-lg rounded-xl ${isDark ? 'bg-slate-800' : 'bg-white'} shadow-xl`}>
            <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'} flex items-center justify-between`}>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                Assign User to Clinic
              </h2>
              <button
                onClick={() => setShowUserAssignModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAssignUser();
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  User
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                >
                  <option value="">Select user</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username || u.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Role at Clinic
                </label>
                <select
                  value={selectedUserRole}
                  onChange={(e) => setSelectedUserRole(e.target.value as UserRole)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'} focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
                >
                  <option value={UserRole.ADMIN}>ADMIN</option>
                  <option value={UserRole.DOCTOR}>DOCTOR</option>
                  <option value={UserRole.ASSISTANT}>ASSISTANT</option>
                  <option value={UserRole.RECEPTIONIST}>RECEPTIONIST</option>
                </select>
              </div>
              <div className={`pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'} flex justify-end gap-3`}>
                <button
                  type="button"
                  onClick={() => setShowUserAssignModal(false)}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedUserId}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Assign User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicManagementPage;
