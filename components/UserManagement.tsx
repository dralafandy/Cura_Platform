import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, createEphemeralSupabaseClient } from '../supabaseClient';
import { UserProfile, UserRole, UserStatus, NotificationType, Permission, Dentist } from '../types';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ToastContainer from './ToastContainer';
import { useNotification } from '../contexts/NotificationContext';
import { ROLE_PERMISSIONS, PERMISSION_CATEGORIES, getPermissionDisplayName } from '../utils/permissions';

// Configuration constants
const USERS_PER_PAGE = 10;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 100;



interface UserFormData {
  username: string;
  email: string;
  password: string;
  newPassword: string;
  confirmPassword: string;
  role: UserRole;
  status: UserStatus;
  dentist_id?: string | null;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  newPassword?: string;
  confirmPassword?: string;
  dentist_id?: string;
  clinic_id?: string;
  branch_id?: string;
  role?: string;
}

interface ClinicOption {
  id: string;
  name: string;
}

interface BranchOption {
  id: string;
  name: string;
}

// Role badge colors map - single source of truth
const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  [UserRole.RECEPTIONIST]: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  [UserRole.DOCTOR]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  [UserRole.ASSISTANT]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

// Status badge colors map
const STATUS_BADGE_COLORS: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  [UserStatus.INACTIVE]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  [UserStatus.SUSPENDED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const UserManagement: React.FC = () => {
  const { user: currentUser, userProfile, currentClinic, currentBranch, accessibleClinics, refreshSession } = useAuth();
  const { addNotification } = useNotification();
  const { theme } = useTheme();
  const currentUserId = currentUser?.id ?? null;
  const isAdmin = userProfile?.role === UserRole.ADMIN;
  const canViewUserManagement = isAdmin;
  const canManageUsers = isAdmin;

  // Users without management permissions remain in self-only scope.
  const SELF_ONLY_MODE = !canManageUsers;
  
  // Check if supabase is available
  if (!supabase) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> Supabase client is not initialized. Please check your configuration.
        </div>
      </div>
    );
  }
  
  // State management
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showEditPermissionsModal, setShowEditPermissionsModal] = useState(false);
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<UserProfile | null>(null);
  const [customPermissions, setCustomPermissions] = useState<Permission[]>([]);
  const [overridePermissions, setOverridePermissions] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [changingRoleFor, setChangingRoleFor] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; userId: string | null; type: 'single' | 'bulk' }>({ isOpen: false, userId: null, type: 'single' });
  const [oauthUnlinkConfirm, setOauthUnlinkConfirm] = useState<{ isOpen: boolean; userId: string | null; provider: string | null }>({ isOpen: false, userId: null, provider: null });
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [selectedCreateBranchId, setSelectedCreateBranchId] = useState('');
  const [clinicBranchOptions, setClinicBranchOptions] = useState<BranchOption[]>([]);

  // Form state

  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    newPassword: '',
    confirmPassword: '',
    role: UserRole.ASSISTANT,
    status: UserStatus.ACTIVE,
    dentist_id: null,
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const usersPerPage = USERS_PER_PAGE;

  const clinicOptions = useMemo<ClinicOption[]>(() => {
    const map = new Map<string, string>();
    (accessibleClinics || []).forEach((entry: any) => {
      if (entry?.clinicId) {
        map.set(entry.clinicId, entry.clinicName || `Clinic ${entry.clinicId.slice(0, 8)}`);
      }
    });
    if (currentClinic?.id) {
      map.set(currentClinic.id, currentClinic.name || `Clinic ${currentClinic.id.slice(0, 8)}`);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [accessibleClinics, currentClinic?.id, currentClinic?.name]);

  const selectedBranchId = useMemo<string | null>(() => {
    if (!selectedClinicId) return null;
    if (currentClinic?.id === selectedClinicId && currentBranch?.id) return currentBranch.id;

    const scoped = (accessibleClinics || []).filter((entry: any) => entry?.clinicId === selectedClinicId && entry?.isActive);
    if (scoped.length === 0) return null;

    const preferred = scoped.find((entry: any) => entry?.isDefault && entry?.branchId) || scoped.find((entry: any) => entry?.branchId);
    return preferred?.branchId || null;
  }, [selectedClinicId, currentClinic?.id, currentBranch?.id, accessibleClinics]);

  useEffect(() => {
    if (clinicOptions.length === 0) {
      setSelectedClinicId('');
      return;
    }
    setSelectedClinicId(prev => {
      if (prev && clinicOptions.some(c => c.id === prev)) return prev;
      if (currentClinic?.id && clinicOptions.some(c => c.id === currentClinic.id)) return currentClinic.id;
      return clinicOptions[0].id;
    });
  }, [clinicOptions, currentClinic?.id]);

  useEffect(() => {
    if (SELF_ONLY_MODE || !selectedClinicId) {
      setClinicBranchOptions([]);
      return;
    }

    let cancelled = false;

    const loadClinicBranches = async () => {
      const { data, error } = await supabase
        .from('clinic_branches')
        .select('id, name, is_main_branch')
        .eq('clinic_id', selectedClinicId)
        .eq('is_active', true)
        .order('is_main_branch', { ascending: false })
        .order('name', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error('Failed to fetch clinic branches:', error);
        setClinicBranchOptions([]);
        return;
      }

      const options = ((data || []) as any[]).map((row) => ({
        id: String(row.id),
        name: String(row.name || `Branch ${String(row.id).slice(0, 8)}`),
      }));
      setClinicBranchOptions(options);
    };

    loadClinicBranches();

    return () => {
      cancelled = true;
    };
  }, [SELF_ONLY_MODE, selectedClinicId]);

  useEffect(() => {
    if (editingUser || !showModal) return;

    setSelectedCreateBranchId((prev) => {
      if (prev && clinicBranchOptions.some((branch) => branch.id === prev)) return prev;
      if (selectedBranchId && clinicBranchOptions.some((branch) => branch.id === selectedBranchId)) return selectedBranchId;
      return clinicBranchOptions[0]?.id || '';
    });
  }, [editingUser, showModal, clinicBranchOptions, selectedBranchId]);

  const isSelfTarget = useCallback((targetUserId?: string | null): boolean => {
    return Boolean(currentUserId && targetUserId && targetUserId === currentUserId);
  }, [currentUserId]);

  const notifySelfOnlyViolation = useCallback((actionLabel: string) => {
    addNotification({
      message: `${actionLabel} is restricted to your own account only.`,
      type: NotificationType.ERROR,
    });
  }, [addNotification]);

  // Unified error handler
  const handleError = (error: unknown, context: string): string => {
    const err = error as { message?: string; code?: string };
    let message = 'An unexpected error occurred';
    
    if (err.code === 'PGRST116') message = 'Record not found';
    else if (err.code === '23505') message = 'Username already exists';
    else if (err.code === '42501') message = 'Permission denied';
    else if (err.message?.includes('network')) message = 'Network error. Please check your connection';
    else if (err.message) message = err.message;
    
    console.error(`${context}:`, error);
    addNotification({ message: `${context}: ${message}`, type: NotificationType.ERROR });
    return message;
  };

  // Fetch users from database with pagination.
  const fetchUsers = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      if (!currentUserId) {
        setUsers([]);
        setTotalUsers(0);
        return;
      }
      const from = (page - 1) * usersPerPage;
      const to = from + usersPerPage - 1;

      if (!SELF_ONLY_MODE) {
        if (!selectedClinicId) {
          setUsers([]);
          setTotalUsers(0);
          return;
        }

        const { data, error } = await supabase.rpc('admin_list_users_for_clinic', {
          p_clinic_id: selectedClinicId,
          p_include_admins: true,
          p_branch_id: selectedBranchId,
        });
        if (error) throw error;

        const rows = (Array.isArray(data) ? data : []) as any[];
        const filtered = rows.filter((user) => {
          const matchesSearch = !searchTerm || String(user.username || '').toLowerCase().includes(searchTerm.toLowerCase());
          const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
          const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
          return matchesSearch && matchesRole && matchesStatus;
        });

        const paginated = filtered.slice(from, to + 1).map((user: any) => ({
          ...user,
          user_id: user.user_id || user.id,
        }));

        setUsers(paginated as UserProfile[]);
        setTotalUsers(filtered.length);
        return;
      }

      // Self-only mode fallback.
      let query = supabase
        .from('user_profiles')
        .select('id, user_id, auth_id, username, email, role, status, dentist_id, created_at, updated_at, last_login, custom_permissions, override_permissions', { count: 'exact' });

      if (searchTerm) {
        query = query.ilike('username', `%${searchTerm}%`);
      }
      if (roleFilter !== 'ALL') {
        query = query.eq('role', roleFilter);
      }
      if (statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }

      query = query.or(`id.eq.${currentUserId},auth_id.eq.${currentUserId}`);

      const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);
      if (error) throw error;

      const rawData = data || [];
      const mappedData = rawData.map((user: any) => ({ ...user, user_id: user.user_id || user.id }));
      setUsers(mappedData as UserProfile[]);
      setTotalUsers(count || 0);
    } catch (error) {
      handleError(error, 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, searchTerm, roleFilter, selectedClinicId, selectedBranchId, statusFilter, usersPerPage, SELF_ONLY_MODE]);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [fetchUsers, currentPage]);

  const fetchDentists = useCallback(async () => {
    try {
      if (!currentUserId) {
        setDentists([]);
        return;
      }
      const { data, error } = await supabase
        .from('dentists')
        .select('id, name, specialty, color')
        .eq('user_id', currentUserId)
        .order('name', { ascending: true });
      if (error) throw error;
      setDentists((data || []) as Dentist[]);
    } catch (error) {
      handleError(error, 'Failed to fetch doctors');
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchDentists();
  }, [fetchDentists]);

  // Validate form data
  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 50) {
      errors.username = 'Username must be less than 50 characters';
    }

    // Email validation (only for new users)
    if (!editingUser) {
      if (!selectedClinicId) {
        errors.clinic_id = 'Clinic is required';
      }
      if (!selectedCreateBranchId) {
        errors.branch_id = 'Clinic branch is required';
      }

      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Email is invalid';
      }

      if (formData.role === UserRole.ADMIN) {
        errors.role = 'Only non-admin users can be created from this page';
      }

      // Password validation (only for new users) - stronger policy
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < MIN_PASSWORD_LENGTH) {
        errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
      } else if (formData.password.length > MAX_PASSWORD_LENGTH) {
        errors.password = `Password must be less than ${MAX_PASSWORD_LENGTH} characters`;
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        errors.password = 'Password must contain uppercase, lowercase, and number';
      }
    }

    // Password reset validation (only for editing users)
    if (editingUser && isResettingPassword) {
      if (!formData.newPassword) {
        errors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < MIN_PASSWORD_LENGTH) {
        errors.newPassword = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
      } else if (formData.newPassword.length > MAX_PASSWORD_LENGTH) {
        errors.newPassword = `Password must be less than ${MAX_PASSWORD_LENGTH} characters`;
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
        errors.newPassword = 'Password must contain uppercase, lowercase, and number';
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    if (formData.role === UserRole.DOCTOR && !formData.dentist_id) {
      errors.dentist_id = 'Please link this user to a doctor profile';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, editingUser, isResettingPassword, selectedClinicId, selectedCreateBranchId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingUser) {
        // Update existing user
        await handleUpdateUser();
      } else {
        // Create new user
        await handleCreateUser();
      }

      // Close modal and refresh users
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      await fetchUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      addNotification({ 
        message: error.message || 'Failed to save user', 
        type: NotificationType.ERROR 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create new user
  const handleCreateUser = async () => {
    if (SELF_ONLY_MODE) {
      throw new Error('Creating additional users is disabled while account isolation is active.');
    }
    if (!selectedClinicId) {
      throw new Error('Please select a clinic');
    }
    if (!selectedCreateBranchId) {
      throw new Error('Please select a clinic branch');
    }
    if (formData.role === UserRole.ADMIN) {
      throw new Error('Only non-admin users can be created from this page.');
    }

    try {
      const email = formData.email.trim().toLowerCase();
      const isolatedSupabase = createEphemeralSupabaseClient();
      if (!isolatedSupabase) {
        throw new Error('Failed to initialize isolated auth client');
      }

      const { data: authData, error: authError } = await isolatedSupabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            username: formData.username.trim(),
          },
        },
      });

      if (authError) {
        throw new Error(authError.message || 'Failed to create auth user');
      }

      if (!authData.user || (Array.isArray((authData.user as any).identities) && (authData.user as any).identities.length === 0)) {
        throw new Error('Failed to create user. Email may already be registered.');
      }

      const requiresEmailConfirmation = !authData.session && !authData.user.email_confirmed_at;

      const { error: linkError } = await supabase.rpc('admin_create_non_admin_user_for_clinic', {
        p_auth_user_id: authData.user.id,
        p_username: formData.username.trim(),
        p_email: email,
        p_role: formData.role,
        p_status: formData.status,
        p_clinic_id: selectedClinicId,
        p_branch_id: selectedCreateBranchId,
        p_dentist_id: formData.role === UserRole.DOCTOR ? (formData.dentist_id || null) : null,
        p_is_default: true,
      });
      if (linkError) {
        throw new Error(linkError.message || 'Failed to link user to clinic');
      }

      if (requiresEmailConfirmation) {
        addNotification({
          message: 'User created, but email confirmation is required before first login.',
          type: NotificationType.WARNING,
        });
      } else {
        addNotification({ message: 'User created successfully', type: NotificationType.SUCCESS });
      }
    } catch (error) {
      handleError(error, 'Failed to create user');
      throw error; // Re-throw for form handling
    }
  };

  // Update existing user
  const handleUpdateUser = async () => {
    if (SELF_ONLY_MODE && !isSelfTarget(editingUser?.id)) {
      notifySelfOnlyViolation('Updating users');
      return;
    }

    // Prepare update data with proper typing
    interface UserProfileUpdate {
      username: string;
      role: UserRole;
      status: UserStatus;
      dentist_id: string | null;
      updated_at: string;
    }

    const updateData: UserProfileUpdate = {
      username: formData.username,
      role: formData.role,
      status: formData.status,
      dentist_id: formData.role === UserRole.DOCTOR ? (formData.dentist_id || null) : null,
      updated_at: new Date().toISOString(),
    };

    // Update user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', editingUser!.id);

    if (profileError) {
      if (profileError.code === '23505') {
        throw new Error('Username already exists');
      }
      throw profileError;
    }

    // Admin-side password reset: send secure reset email to target account.
    if (isResettingPassword && formData.newPassword) {
      const targetEmail = (editingUser as any)?.email as string | undefined;
      if (!targetEmail) {
        throw new Error('Cannot reset password: target user has no email.');
      }

      const { error: authError } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${window.location.origin}/`,
      });

      if (authError) throw authError;

      addNotification({
        message: `Password reset email sent to ${targetEmail}`,
        type: NotificationType.SUCCESS,
      });
    }

    addNotification({ message: 'User updated successfully', type: NotificationType.SUCCESS });
  };

  // OAuth unlink - triggers confirmation
  const handleUnlinkOAuthRequest = (userId: string, provider: string) => {
    setOauthUnlinkConfirm({ isOpen: true, userId, provider });
  };

  // Confirm OAuth unlink
  const confirmUnlinkOAuth = async () => {
    const { userId, provider } = oauthUnlinkConfirm;
    if (!userId || !provider) return;
    if (SELF_ONLY_MODE && !isSelfTarget(userId)) {
      notifySelfOnlyViolation('Unlinking OAuth');
      setOauthUnlinkConfirm({ isOpen: false, userId: null, provider: null });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          oauth_provider: null, 
          oauth_id: null, 
          oauth_email: null 
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      addNotification({ message: `${provider} account unlinked successfully`, type: NotificationType.SUCCESS });
      await fetchUsers(currentPage);
    } catch (error) {
      handleError(error, 'Failed to unlink OAuth account');
    } finally {
      setOauthUnlinkConfirm({ isOpen: false, userId: null, provider: null });
    }
  };

  // Edit user
  const handleEdit = (userProfile: UserProfile) => {
    if (SELF_ONLY_MODE && !isSelfTarget(userProfile.id)) {
      notifySelfOnlyViolation('Editing users');
      return;
    }

    setEditingUser(userProfile);
    setFormData({
      username: userProfile.username,
      email: '', // Email is in auth.users, not in profile
      password: '',
      newPassword: '',
      confirmPassword: '',
      role: userProfile.role,
      status: userProfile.status || UserStatus.ACTIVE,
      dentist_id: userProfile.dentist_id || null,
    });
    setIsResettingPassword(false);
    setFormErrors({});
    setShowModal(true);
  };

  // Delete user - triggers confirmation modal
  const handleDeleteRequest = (userId: string) => {
    setDeleteConfirm({ isOpen: true, userId, type: 'single' });
  };

  // Confirm delete user
  const confirmDelete = async () => {
    const userId = deleteConfirm.userId;
    if (!userId) return;
    if (SELF_ONLY_MODE && !isSelfTarget(userId)) {
      notifySelfOnlyViolation('Deleting users');
      setDeleteConfirm({ isOpen: false, userId: null, type: 'single' });
      return;
    }
    
    // Prevent deleting yourself
    if (userId === currentUser?.id) {
      addNotification({ message: 'You cannot delete your own account', type: NotificationType.ERROR });
      setDeleteConfirm({ isOpen: false, userId: null, type: 'single' });
      return;
    }

    try {
      // Soft delete - mark as deleted instead of removing
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          status: UserStatus.SUSPENDED,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      
      addNotification({ message: 'User deleted successfully', type: NotificationType.SUCCESS });
      setSelectedUsers(prev => prev.filter(id => id !== userId));
      await fetchUsers(currentPage);
    } catch (error) {
      handleError(error, 'Failed to delete user');
    } finally {
      setDeleteConfirm({ isOpen: false, userId: null, type: 'single' });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      newPassword: '',
      confirmPassword: '',
      role: UserRole.ASSISTANT,
      status: UserStatus.ACTIVE,
      dentist_id: null,
    });
    setSelectedCreateBranchId('');
    setIsResettingPassword(false);
    setFormErrors({});
  };

  // Open create modal
  const openCreateModal = () => {
    if (SELF_ONLY_MODE) {
      addNotification({
        message: 'Creating additional users is disabled while account isolation is active.',
        type: NotificationType.WARNING,
      });
      return;
    }
    if (clinicOptions.length === 0) {
      addNotification({
        message: 'No clinic found. Please create or assign a clinic first.',
        type: NotificationType.WARNING,
      });
      return;
    }

    setEditingUser(null);
    resetForm();
    setShowModal(true);
  };

  // Memoized filtered users (for client-side when not using server-side)
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const doctorNameById = useMemo(() => {
    const entries = dentists.map(d => [d.id, d.name] as const);
    return new Map(entries);
  }, [dentists]);

  // Pagination - now uses server-side count
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = users; // Already paginated from server

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, selectedClinicId]);

  // Bulk selection handlers
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Select all - selects all CURRENTLY VISIBLE users (paginated)
  const handleSelectAll = () => {
    const allSelected = selectedUsers.length === paginatedUsers.length;
    if (allSelected) {
      // Deselect all visible users
      setSelectedUsers(prev => prev.filter(id => !paginatedUsers.some(u => u.id === id)));
    } else {
      // Select all visible users (union with existing selection)
      const newSelections = paginatedUsers
        .map(user => user.id)
        .filter(id => !selectedUsers.includes(id));
      setSelectedUsers(prev => [...prev, ...newSelections]);
    }
  };

  // Bulk delete request
  const handleBulkDeleteRequest = () => {
    setDeleteConfirm({ isOpen: true, userId: null, type: 'bulk' });
  };

  // Confirm bulk delete
  const confirmBulkDelete = async () => {
    if (SELF_ONLY_MODE) {
      notifySelfOnlyViolation('Bulk delete');
      setDeleteConfirm({ isOpen: false, userId: null, type: 'bulk' });
      return;
    }

    // Prevent deleting yourself
    if (selectedUsers.includes(currentUser?.id || '')) {
      addNotification({ message: 'You cannot delete your own account', type: NotificationType.ERROR });
      setDeleteConfirm({ isOpen: false, userId: null, type: 'bulk' });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ status: UserStatus.SUSPENDED, updated_at: new Date().toISOString() })
        .in('id', selectedUsers);

      if (error) throw error;
      
      addNotification({ 
        message: `${selectedUsers.length} user(s) deleted successfully`, 
        type: NotificationType.SUCCESS 
      });
      setSelectedUsers([]);
      await fetchUsers(currentPage);
    } catch (error) {
      handleError(error, 'Failed to delete users');
    } finally {
      setDeleteConfirm({ isOpen: false, userId: null, type: 'bulk' });
    }
  };

  const handleBulkStatusChange = async (newStatus: UserStatus) => {
    if (SELF_ONLY_MODE) {
      notifySelfOnlyViolation('Bulk status update');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .in('id', selectedUsers);

      if (error) throw error;
      
      addNotification({ 
        message: `${selectedUsers.length} user(s) updated successfully`, 
        type: NotificationType.SUCCESS 
      });
      setSelectedUsers([]);
      await fetchUsers(currentPage);
    } catch (error) {
      handleError(error, 'Failed to update users');
    }
  };

  // Get role badge color - use the map instead of switch
  const getRoleBadgeColor = (role: UserRole): string => {
    return ROLE_BADGE_COLORS[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  // Handle quick role change from dropdown
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (SELF_ONLY_MODE && !isSelfTarget(userId)) {
      notifySelfOnlyViolation('Changing roles');
      return;
    }

    // Prevent changing your own role
    if (userId === currentUser?.id) {
      addNotification({ message: 'You cannot change your own role', type: NotificationType.ERROR });
      return;
    }

    if (!selectedClinicId) {
      addNotification({ message: 'Please select a clinic first', type: NotificationType.ERROR });
      return;
    }

    // Optimistic update
    const oldUsers = [...users];
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    setChangingRoleFor(userId);

    try {
      const currentRow = oldUsers.find(u => u.id === userId);
      const dentistIdForRole = newRole === UserRole.DOCTOR ? (currentRow?.dentist_id || null) : null;

      const { error } = await supabase.rpc('admin_update_user_role_for_scope', {
        p_target_user_id: userId,
        p_new_role: newRole,
        p_clinic_id: selectedClinicId,
        p_branch_id: selectedBranchId,
        p_dentist_id: dentistIdForRole,
      });

      if (error) throw error;
      
      addNotification({ 
        message: `Role updated successfully`, 
        type: NotificationType.SUCCESS 
      });
      
      await fetchUsers(currentPage);
    } catch (error) {
      setUsers(oldUsers); // Rollback on error
      handleError(error, 'Failed to update role');
    } finally {
      setChangingRoleFor(null);
    }
  };


  // Get status badge color - use the map instead of switch
  const getStatusBadgeColor = (status: UserStatus): string => {
    return STATUS_BADGE_COLORS[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  };

  // Handle opening the edit permissions modal
  const handleEditPermissions = (userProfile: UserProfile) => {
    if (SELF_ONLY_MODE && !isSelfTarget(userProfile.id)) {
      notifySelfOnlyViolation('Editing permissions');
      return;
    }

    setEditingPermissionsUser(userProfile);
    // Ensure custom_permissions is always an array
    const perms = userProfile.custom_permissions;
    setCustomPermissions(Array.isArray(perms) ? perms : []);
    setOverridePermissions(Boolean(userProfile.override_permissions));
    setShowEditPermissionsModal(true);
  };

  // Handle toggling a permission
  const handlePermissionToggle = (permission: Permission) => {
    setCustomPermissions(prev => {
      // For all users, allow toggling of all permissions
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      } else {
        return [...prev, permission];
      }
    });
  };

  // Handle automatic permission assignment
  const handleAutoAssignPermissions = (userRole: UserRole) => {
    const autoPermissions = ROLE_PERMISSIONS[userRole];
    setCustomPermissions(autoPermissions);
    addNotification({
      message: `Automatically assigned permissions for ${userRole} role`,
      type: NotificationType.INFO
    });
  };

  // Handle saving custom permissions
  const handleSaveCustomPermissions = async () => {
    if (!editingPermissionsUser) return;
    if (SELF_ONLY_MODE && !isSelfTarget(editingPermissionsUser.id)) {
      notifySelfOnlyViolation('Saving permissions');
      return;
    }
    if (!selectedClinicId) {
      addNotification({ message: 'Please select a clinic first', type: NotificationType.ERROR });
      return;
    }
    
    setIsSavingPermissions(true);
    try {
      const { error } = await supabase.rpc('admin_update_user_permissions_for_scope', {
        p_target_user_id: editingPermissionsUser.id,
        p_custom_permissions: customPermissions,
        p_override_permissions: overridePermissions,
        p_clinic_id: selectedClinicId,
        p_branch_id: selectedBranchId,
      });

      if (error) throw error;
      
      addNotification({ 
        message: `Custom permissions updated for ${editingPermissionsUser.username}`, 
        type: NotificationType.SUCCESS 
      });
      
      setShowEditPermissionsModal(false);
      setEditingPermissionsUser(null);
      await fetchUsers(currentPage);
      await refreshSession();
    } catch (error) {
      handleError(error, 'Failed to save custom permissions');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  // Get auth method badge
  const getAuthMethodBadge = (user: UserProfile) => {

    if (user.oauth_provider) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {user.oauth_provider === 'google' && (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {user.oauth_provider === 'facebook' && (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          )}
          {user.oauth_provider.charAt(0).toUpperCase() + user.oauth_provider.slice(1)}
        </span>
      );
    }
    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
        Email/Password
      </span>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Access denied only when user lacks view permission entirely
  if (!canViewUserManagement) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Access Denied:</strong> You do not have permission to access User Management.
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage clinic users, roles, and permissions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPermissionsModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-sm transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View Permissions
            </button>
            {!SELF_ONLY_MODE && (
              <button
                onClick={openCreateModal}
                disabled={!canManageUsers}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-sm transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!canManageUsers ? 'You do not have permission to create users' : 'Add New User'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New User
              </button>
            )}
          </div>
        </div>

        {SELF_ONLY_MODE && (
          <div className={`${theme === 'dark' ? 'bg-amber-900/20 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'} border rounded-lg p-4 mb-6`}>
            Account isolation is enabled. You can view and manage only your own user profile.
          </div>
        )}

        {!SELF_ONLY_MODE && (
          <div className={`${theme === 'dark' ? 'bg-blue-900/20 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800'} border rounded-lg p-4 mb-6`}>
            New users are created as non-admin and linked to the selected clinic branch.
          </div>
        )}

        {/* Search and Filters */}
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-6 mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {!SELF_ONLY_MODE && (
              <div>
                <label className="block text-sm font-medium mb-2">Clinic Scope</label>
                <select
                  value={selectedClinicId}
                  onChange={(e) => setSelectedClinicId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  {clinicOptions.length === 0 ? (
                    <option value="">No clinics available</option>
                  ) : (
                    clinicOptions.map((clinic) => (
                      <option key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Search Users</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
                <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Role Filter</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              >
                <option value="ALL">All Roles</option>
                <option value={UserRole.ADMIN}>Admin</option>
                <option value={UserRole.DOCTOR}>Doctor</option>
                <option value={UserRole.ASSISTANT}>Assistant</option>
                <option value={UserRole.RECEPTIONIST}>Receptionist</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'ALL')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              >
                <option value="ALL">All Status</option>
                <option value={UserStatus.ACTIVE}>Active</option>
                <option value={UserStatus.INACTIVE}>Inactive</option>
                <option value={UserStatus.SUSPENDED}>Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {!SELF_ONLY_MODE && selectedUsers.length > 0 && (
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm p-4 mb-6`}>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium">{selectedUsers.length} user(s) selected</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkStatusChange(UserStatus.ACTIVE)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkStatusChange(UserStatus.INACTIVE)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkStatusChange(UserStatus.SUSPENDED)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Suspend
                </button>
                <button
                  onClick={handleBulkDeleteRequest}
                  className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                      onChange={handleSelectAll}
                      disabled={SELF_ONLY_MODE}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Auth Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Linked Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} divide-y divide-gray-200 dark:divide-gray-700`}>
                {paginatedUsers.map((userProfile) => (
                  <tr key={userProfile.id} className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(userProfile.id)}
                        onChange={() => handleSelectUser(userProfile.id)}
                        disabled={SELF_ONLY_MODE}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                          userProfile.role === UserRole.ADMIN ? 'bg-purple-500' :
                          userProfile.role === UserRole.DOCTOR ? 'bg-blue-500' :
                          userProfile.role === UserRole.ASSISTANT ? 'bg-green-500' : 'bg-orange-500'
                        }`}>
                          {userProfile.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {userProfile.username}
                          </div>
                          {userProfile.oauth_email && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {userProfile.oauth_email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getAuthMethodBadge(userProfile)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={userProfile.role}
                        onChange={(e) => handleRoleChange(userProfile.id, e.target.value as UserRole)}
                        disabled={userProfile.id === currentUser?.id || changingRoleFor === userProfile.id}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${getRoleBadgeColor(userProfile.role)} ${(userProfile.id === currentUser?.id || changingRoleFor === userProfile.id) ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-80'}`}
                        title={userProfile.id === currentUser?.id ? 'Cannot change your own role' : changingRoleFor === userProfile.id ? 'Updating...' : 'Click to change role'}
                      >
                        <option value={UserRole.ADMIN}>ADMIN</option>
                        <option value={UserRole.DOCTOR}>DOCTOR</option>
                        <option value={UserRole.ASSISTANT}>ASSISTANT</option>
                        <option value={UserRole.RECEPTIONIST}>RECEPTIONIST</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {userProfile.role === UserRole.DOCTOR
                        ? (userProfile.dentist_id ? (doctorNameById.get(userProfile.dentist_id) || 'Unknown Doctor') : 'Not Linked')
                        : '-'}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(userProfile.status)}`}>
                        {userProfile.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {userProfile.last_login ? new Date(userProfile.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(userProfile.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(userProfile)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          title="Edit user"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditPermissions(userProfile)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                          title="Edit permissions"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleDeleteRequest(userProfile.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          title="Delete user"
                          disabled={userProfile.id === currentUser?.id}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {totalUsers > 0 ? ((currentPage - 1) * usersPerPage) + 1 : 0} to {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} users
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Username *
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          formErrors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white'}`}
                        placeholder="Enter username"
                      />
                      {formErrors.username && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.username}</p>
                      )}
                    </div>

                    {editingUser && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                          }`}
                        >
                          <option value={UserStatus.ACTIVE}>Active</option>
                          <option value={UserStatus.INACTIVE}>Inactive</option>
                          <option value={UserStatus.SUSPENDED}>Suspended</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {!editingUser && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          placeholder="Enter email address"
                        />
                        {formErrors.email && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Password *
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            formErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white'}`}
                          placeholder="Enter password"
                        />
                        {formErrors.password && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Clinic *
                        </label>
                        <select
                          value={selectedClinicId}
                          onChange={(e) => setSelectedClinicId(e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            formErrors.clinic_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white'}`}
                        >
                          <option value="">Select clinic</option>
                          {clinicOptions.map((clinic) => (
                            <option key={clinic.id} value={clinic.id}>
                              {clinic.name}
                            </option>
                          ))}
                        </select>
                        {formErrors.clinic_id && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.clinic_id}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Branch *
                        </label>
                        <select
                          value={selectedCreateBranchId}
                          onChange={(e) => setSelectedCreateBranchId(e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            formErrors.branch_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                          } ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white'}`}
                        >
                          <option value="">Select branch</option>
                          {clinicBranchOptions.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                              {branch.name}
                            </option>
                          ))}
                        </select>
                        {formErrors.branch_id && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.branch_id}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => {
                        const newRole = e.target.value as UserRole;
                        setFormData({
                          ...formData,
                          role: newRole,
                          dentist_id: newRole === UserRole.DOCTOR ? formData.dentist_id : null,
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    >
                      {editingUser && <option value={UserRole.ADMIN}>Admin</option>}
                      <option value={UserRole.DOCTOR}>Doctor</option>
                      <option value={UserRole.ASSISTANT}>Assistant</option>
                      <option value={UserRole.RECEPTIONIST}>Receptionist</option>
                    </select>
                    {formErrors.role && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.role}</p>
                    )}
                  </div>

                  {formData.role === UserRole.DOCTOR && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Linked Doctor Profile *
                      </label>
                      <select
                        value={formData.dentist_id || ''}
                        onChange={(e) => setFormData({ ...formData, dentist_id: e.target.value || null })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="">Select doctor profile</option>
                        {dentists.map(doctor => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.name} {doctor.specialty ? `(${doctor.specialty})` : ''}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        This link is required for doctor custom dashboard and doctor-specific data scope.
                      </p>
                      {formErrors.dentist_id && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.dentist_id}</p>
                      )}
                    </div>
                  )}

                  {/* Password Reset Section for Existing Users */}
                  {editingUser && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsResettingPassword(!isResettingPassword);
                          if (!isResettingPassword) {
                            setFormData({ ...formData, newPassword: '', confirmPassword: '' });
                          }
                        }}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm flex items-center gap-2"
                      >
                        <svg className={`w-4 h-4 transition-transform ${isResettingPassword ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {isResettingPassword ? 'Cancel Password Reset' : 'Reset Password'}
                      </button>

                      {isResettingPassword && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              New Password
                            </label>
                            <input
                              type="password"
                              value={formData.newPassword}
                              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                formErrors.newPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                              } ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white'}`}
                              placeholder="Enter new password"
                            />
                            {formErrors.newPassword && (
                              <p className="mt-1 text-sm text-red-600">{formErrors.newPassword}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Confirm Password
                            </label>
                            <input
                              type="password"
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                              } ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white'}`}
                              placeholder="Confirm new password"
                            />
                            {formErrors.confirmPassword && (
                              <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* OAuth Account Linking Section */}
                  {editingUser && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-4">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-4">
                        OAuth Account Linking
                      </h4>
                      
                      {/* Linked OAuth Accounts */}
                      <div className="space-y-3 mb-4">
                        {editingUser.oauth_provider ? (
                          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-3">
                              {editingUser.oauth_provider === 'google' && (
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                              )}
                              {editingUser.oauth_provider === 'facebook' && (
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                  <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {editingUser.oauth_provider.charAt(0).toUpperCase() + editingUser.oauth_provider.slice(1)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {editingUser.oauth_email}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUnlinkOAuthRequest(editingUser.id, editingUser.oauth_provider!)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                            >
                              Unlink
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            No OAuth account linked. Users can link their accounts from their profile settings.
                          </p>
                        )}
                      </div>
                    </div>
                  )}



                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Modal */}
        {showPermissionsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-semibold">Role Permissions</h3>
                  <button
                    onClick={() => setShowPermissionsModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-8">
                  {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]: [string, Permission[]]) => (
                    <div key={category} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                      <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{category}</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Permission
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Admin
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Doctor
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Assistant
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Receptionist
                              </th>
                            </tr>
                          </thead>
                          <tbody className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} divide-y divide-gray-200 dark:divide-gray-700`}>
                            {permissions.map((permission: Permission) => (
                              <tr key={permission} className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                  {getPermissionDisplayName(permission)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30">
                                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {ROLE_PERMISSIONS[UserRole.DOCTOR].includes(permission) ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30">
                                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-900/30">
                                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {ROLE_PERMISSIONS[UserRole.ASSISTANT].includes(permission) ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30">
                                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-900/30">
                                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {ROLE_PERMISSIONS[UserRole.RECEPTIONIST].includes(permission) ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30">
                                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-900/30">
                                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowPermissionsModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Permissions Modal */}
        {showEditPermissionsModal && editingPermissionsUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-semibold">Edit User Permissions</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      User: <span className="font-medium">{editingPermissionsUser.username}</span> | 
                      Role: <span className="font-medium">{editingPermissionsUser.role}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEditPermissionsModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Note:</strong> Custom permissions are added to the user's role-based permissions. 
                    Check the boxes below to grant additional permissions beyond what the role normally allows.
                  </p>
                </div>

                {/* Override Mode Toggle */}
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-300">
                        <input
                          type="checkbox"
                          checked={overridePermissions}
                          onChange={(e) => setOverridePermissions(e.target.checked)}
                          className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        Override Role Permissions
                      </label>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 ml-6">
                        When enabled, the user will only have the permissions you select below, ignoring their role's default permissions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]: [string, Permission[]]) => (
                    <div key={category} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                      <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {permissions.map((permission: Permission) => {
                          const isRolePermission = ROLE_PERMISSIONS[editingPermissionsUser.role]?.includes(permission) && editingPermissionsUser.role !== UserRole.ADMIN;
                          const isCustomPermission = customPermissions.includes(permission);
                          
                          // When override mode is enabled, only check custom permissions
                          // When override mode is disabled, check both role and custom permissions
                          const isChecked = overridePermissions ? isCustomPermission : (isRolePermission || isCustomPermission);
                          
                          // When override mode is enabled, all checkboxes are enabled
                          // When override mode is disabled, role permissions are disabled
                          const isDisabled = !overridePermissions && isRolePermission && !isCustomPermission;
                          
                          return (
                            <div 
                              key={permission} 
                              className={`flex items-center p-3 rounded-lg border ${
                                isRolePermission && !overridePermissions
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                              }`}
                            >
                              <input
                                type="checkbox"
                                id={`permission-${permission}`}
                                checked={isChecked}
                                disabled={isDisabled}
                                onChange={() => handlePermissionToggle(permission)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50"
                              />
                              <label 
                                htmlFor={`permission-${permission}`}
                                className={`ml-3 text-sm font-medium ${
                                  isRolePermission && !overridePermissions
                                    ? 'text-green-800 dark:text-green-300' 
                                    : 'text-gray-900 dark:text-white'
                                }`}
                              >
                                {getPermissionDisplayName(permission)}
                                {isRolePermission && (
                                  <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                    (from role)
                                  </span>
                                )}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditPermissionsModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomPermissions}
                    disabled={isSavingPermissions}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingPermissions ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full p-6`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Confirm Delete
                </h3>
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, userId: null, type: 'single' })}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {deleteConfirm.type === 'bulk' 
                  ? `Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`
                  : 'Are you sure you want to delete this user? This action cannot be undone.'
                }
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, userId: null, type: 'single' })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteConfirm.type === 'bulk' ? confirmBulkDelete : confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OAuth Unlink Confirmation Modal */}
        {oauthUnlinkConfirm.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full p-6`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Confirm Unlink
                </h3>
                <button
                  onClick={() => setOauthUnlinkConfirm({ isOpen: false, userId: null, provider: null })}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to unlink this {oauthUnlinkConfirm.provider} account?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setOauthUnlinkConfirm({ isOpen: false, userId: null, provider: null })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUnlinkOAuth}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Unlink
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastContainer />

      </div>
    </div>
  );
};

export default UserManagement;
