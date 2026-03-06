import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createEphemeralSupabaseClient, supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import ToastContainer from '../ToastContainer';
import { NotificationType, Permission, UserRole, UserStatus } from '../../types';
import { getPermissionDisplayName, PERMISSION_CATEGORIES, ROLE_PERMISSIONS } from '../../utils/permissions';

const USERS_PER_PAGE = 12;
const ALL_BRANCHES = 'ALL';
const PLATFORM_OWNER_EMAIL = 'dralafandy@gmail.com';

type RoleFilter = UserRole | 'ALL';
type StatusFilter = UserStatus | 'ALL';
type BranchFilter = typeof ALL_BRANCHES | string;
type FormMode = 'create' | 'edit';

interface ClinicOption {
  id: string;
  name: string;
}

interface BranchOption {
  id: string;
  name: string;
}

interface DentistOption {
  id: string;
  name: string;
}

interface ManagedUser {
  id: string;
  user_id: string;
  auth_id?: string | null;
  username: string;
  email?: string | null;
  role: UserRole;
  status: UserStatus;
  dentist_id?: string | null;
  created_at: string;
  updated_at: string;
  last_login?: string | null;
  custom_permissions?: Permission[];
  override_permissions?: boolean;
}

interface FormState {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  clinicId: string;
  branchId: string;
  dentistId: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  clinicId?: string;
  branchId?: string;
  dentistId?: string;
}

const ROLE_SET = new Set(Object.values(UserRole));
const STATUS_SET = new Set(Object.values(UserStatus));
const PERMISSION_SET = new Set(Object.values(Permission));

const emptyForm = (): FormState => ({
  username: '',
  email: '',
  password: '',
  role: UserRole.ASSISTANT,
  status: UserStatus.ACTIVE,
  clinicId: '',
  branchId: '',
  dentistId: '',
});

const normalizeRole = (value: unknown): UserRole => {
  const normalized = String(value || '').toUpperCase();
  return (ROLE_SET.has(normalized) ? normalized : UserRole.ASSISTANT) as UserRole;
};

const normalizeStatus = (value: unknown): UserStatus => {
  const normalized = String(value || '').toUpperCase();
  return (STATUS_SET.has(normalized) ? normalized : UserStatus.ACTIVE) as UserStatus;
};

const toPermissions = (value: unknown): Permission[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is Permission => typeof entry === 'string' && PERMISSION_SET.has(entry));
};

const mapUser = (row: any): ManagedUser => ({
  id: String(row?.id || row?.user_id || row?.auth_id || ''),
  user_id: String(row?.user_id || row?.id || ''),
  auth_id: row?.auth_id ? String(row.auth_id) : null,
  username: String(row?.username || ''),
  email: row?.email ? String(row.email) : null,
  role: normalizeRole(row?.role),
  status: normalizeStatus(row?.status),
  dentist_id: row?.dentist_id ? String(row.dentist_id) : null,
  created_at: row?.created_at ? String(row.created_at) : new Date().toISOString(),
  updated_at: row?.updated_at ? String(row.updated_at) : new Date().toISOString(),
  last_login: row?.last_login ? String(row.last_login) : null,
  custom_permissions: toPermissions(row?.custom_permissions),
  override_permissions: Boolean(row?.override_permissions),
});

const errorMessage = (error: unknown, fallback: string): string => {
  const msg = (error as { message?: string })?.message;
  return msg && msg.trim().length > 0 ? msg : fallback;
};

const UserManagementPage: React.FC = () => {
  const { user, userProfile, isAdmin, checkPermission, currentClinic, currentBranch, accessibleClinics, refreshSession } = useAuth();
  const { addNotification } = useNotification();
  const { theme } = useTheme();

  const currentUserId = user?.id || null;
  const isPlatformOwner = String(userProfile?.email || '').trim().toLowerCase() === PLATFORM_OWNER_EMAIL;
  const canView = isAdmin || checkPermission(Permission.USER_MANAGEMENT_VIEW);
  const canManageScoped = isAdmin && !isPlatformOwner;

  const notify = useCallback(
    (type: NotificationType, message: string) => {
      addNotification({ type, title: 'User Management', message });
    },
    [addNotification],
  );

  const clinicOptions = useMemo<ClinicOption[]>(() => {
    const map = new Map<string, string>();
    (accessibleClinics || []).forEach((entry) => {
      if (entry?.clinicId) {
        map.set(entry.clinicId, entry.clinicName || `Clinic ${entry.clinicId.slice(0, 8)}`);
      }
    });
    if (currentClinic?.id) {
      map.set(currentClinic.id, currentClinic.name || `Clinic ${currentClinic.id.slice(0, 8)}`);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [accessibleClinics, currentClinic?.id, currentClinic?.name]);

  const [selectedClinicId, setSelectedClinicId] = useState<string>('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<BranchFilter>(ALL_BRANCHES);
  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);
  const [dentists, setDentists] = useState<DentistOption[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formState, setFormState] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [permissionsUser, setPermissionsUser] = useState<ManagedUser | null>(null);
  const [permissionsDraft, setPermissionsDraft] = useState<Permission[]>([]);
  const [overrideDraft, setOverrideDraft] = useState<boolean>(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState<boolean>(false);

  const [deleteMode, setDeleteMode] = useState<'single' | 'bulk' | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const isCurrentUserManagedUser = useCallback(
    (row: Pick<ManagedUser, 'id' | 'user_id' | 'auth_id'> | null | undefined): boolean => {
      if (!row || !currentUserId) return false;
      return [row.id, row.user_id, row.auth_id].some((value) => value === currentUserId);
    },
    [currentUserId],
  );

  useEffect(() => {
    if (isPlatformOwner) return;
    if (clinicOptions.length === 0) {
      setSelectedClinicId('');
      return;
    }
    setSelectedClinicId((prev) => {
      if (prev && clinicOptions.some((item) => item.id === prev)) return prev;
      if (currentClinic?.id && clinicOptions.some((item) => item.id === currentClinic.id)) return currentClinic.id;
      return clinicOptions[0].id;
    });
  }, [clinicOptions, currentClinic?.id, isPlatformOwner]);

  useEffect(() => {
    if (!supabase || isPlatformOwner || !selectedClinicId) {
      setBranchOptions([]);
      setSelectedBranchFilter(ALL_BRANCHES);
      return;
    }

    let cancelled = false;

    const loadBranches = async (): Promise<void> => {
      const { data, error } = await supabase
        .from('clinic_branches')
        .select('id, name, is_main_branch')
        .eq('clinic_id', selectedClinicId)
        .eq('is_active', true)
        .order('is_main_branch', { ascending: false })
        .order('name', { ascending: true });

      if (cancelled) return;

      if (error) {
        notify(NotificationType.ERROR, errorMessage(error, 'Failed to load branches'));
        setBranchOptions([]);
        setSelectedBranchFilter(ALL_BRANCHES);
        return;
      }

      const mapped = (data || []).map((row: any) => ({
        id: String(row.id),
        name: String(row.name || `Branch ${String(row.id).slice(0, 8)}`),
      }));

      setBranchOptions(mapped);
      setSelectedBranchFilter((prev) => {
        if (prev === ALL_BRANCHES) return prev;
        if (mapped.some((branch) => branch.id === prev)) return prev;
        if (currentBranch?.id && mapped.some((branch) => branch.id === currentBranch.id)) return currentBranch.id;
        return ALL_BRANCHES;
      });
    };

    loadBranches();

    return () => {
      cancelled = true;
    };
  }, [currentBranch?.id, isPlatformOwner, notify, selectedClinicId]);

  useEffect(() => {
    if (!supabase || isPlatformOwner || !selectedClinicId) {
      setDentists([]);
      return;
    }

    let cancelled = false;

    const loadDentists = async (): Promise<void> => {
      const { data, error } = await supabase
        .from('dentists')
        .select('id, name')
        .eq('clinic_id', selectedClinicId)
        .order('name', { ascending: true });

      if (cancelled) return;

      if (error) {
        notify(NotificationType.ERROR, errorMessage(error, 'Failed to load dentists'));
        setDentists([]);
        return;
      }

      const mapped = (data || []).map((row: any) => ({
        id: String(row.id),
        name: String(row.name || 'Doctor'),
      }));
      setDentists(mapped);
    };

    loadDentists();
    return () => {
      cancelled = true;
    };
  }, [isPlatformOwner, notify, selectedClinicId]);

  const fetchUsers = useCallback(
    async (page: number): Promise<void> => {
      if (!supabase) {
        notify(NotificationType.ERROR, 'Supabase client is not initialized');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const from = (page - 1) * USERS_PER_PAGE;

        if (isPlatformOwner) {
          const { data, error } = await supabase.rpc('platform_owner_list_users', {
            p_search: searchTerm.trim() || null,
            p_role: roleFilter === 'ALL' ? null : roleFilter,
            p_status: statusFilter === 'ALL' ? null : statusFilter,
            p_offset: from,
            p_limit: USERS_PER_PAGE,
          });
          if (error) throw error;

          const rows = Array.isArray(data) ? data : [];
          setUsers(rows.map(mapUser));
          setTotalUsers(rows.length > 0 ? Number(rows[0].total_count || 0) : 0);
          return;
        }

        if (canManageScoped) {
          if (!selectedClinicId) {
            setUsers([]);
            setTotalUsers(0);
            return;
          }

          const { data, error } = await supabase.rpc('admin_list_users_for_clinic', {
            p_clinic_id: selectedClinicId,
            p_include_admins: true,
            p_branch_id: selectedBranchFilter === ALL_BRANCHES ? null : selectedBranchFilter,
          });
          if (error) throw error;

          const rows = (Array.isArray(data) ? data : []).map(mapUser);
          const filtered = rows.filter((row) => {
            const normalizedSearch = searchTerm.trim().toLowerCase();
            const matchSearch =
              normalizedSearch.length === 0 ||
              row.username.toLowerCase().includes(normalizedSearch) ||
              String(row.email || '').toLowerCase().includes(normalizedSearch);
            const matchRole = roleFilter === 'ALL' || row.role === roleFilter;
            const matchStatus = statusFilter === 'ALL' || row.status === statusFilter;
            return matchSearch && matchRole && matchStatus;
          });

          setTotalUsers(filtered.length);
          setUsers(filtered.slice(from, from + USERS_PER_PAGE));
          return;
        }

        if (!currentUserId) {
          setUsers([]);
          setTotalUsers(0);
          return;
        }

        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, user_id, auth_id, username, email, role, status, dentist_id, created_at, updated_at, last_login, custom_permissions, override_permissions')
          .or(`id.eq.${currentUserId},auth_id.eq.${currentUserId}`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        const rows = (data || []).map(mapUser);
        setUsers(rows);
        setTotalUsers(rows.length);
      } catch (error) {
        notify(NotificationType.ERROR, errorMessage(error, 'Failed to load users'));
        setUsers([]);
        setTotalUsers(0);
      } finally {
        setIsLoading(false);
      }
    },
    [canManageScoped, currentUserId, isPlatformOwner, notify, roleFilter, searchTerm, selectedBranchFilter, selectedClinicId, statusFilter],
  );

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, fetchUsers]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchTerm, roleFilter, statusFilter, selectedClinicId, selectedBranchFilter]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => users.some((row) => row.id === id)));
  }, [users]);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setFormMode('create');
    setEditingUser(null);
    setFormErrors({});
    setFormState(emptyForm());
  }, []);

  const openCreate = useCallback(() => {
    if (!canManageScoped) {
      notify(NotificationType.WARNING, 'Create user is disabled in platform-owner mode');
      return;
    }
    setFormMode('create');
    setEditingUser(null);
    setFormErrors({});
    setFormState({
      ...emptyForm(),
      clinicId: selectedClinicId,
      branchId:
        selectedBranchFilter !== ALL_BRANCHES && branchOptions.some((item) => item.id === selectedBranchFilter)
          ? selectedBranchFilter
          : branchOptions[0]?.id || '',
    });
    setIsFormOpen(true);
  }, [branchOptions, canManageScoped, notify, selectedBranchFilter, selectedClinicId]);

  const openEdit = useCallback(
    (row: ManagedUser) => {
      if (row.role === UserRole.ADMIN && !isCurrentUserManagedUser(row)) {
        notify(NotificationType.WARNING, 'Scoped edits for other ADMIN accounts are blocked');
        return;
      }
      setFormMode('edit');
      setEditingUser(row);
      setFormErrors({});
      setFormState({
        username: row.username,
        email: row.email || '',
        password: '',
        role: row.role,
        status: row.status,
        clinicId: selectedClinicId,
        branchId: selectedBranchFilter === ALL_BRANCHES ? '' : selectedBranchFilter,
        dentistId: row.dentist_id || '',
      });
      setIsFormOpen(true);
    },
    [isCurrentUserManagedUser, notify, selectedBranchFilter, selectedClinicId],
  );

  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};
    if (!formState.username.trim()) {
      errors.username = 'Username is required';
    } else if (formState.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (formMode === 'create') {
      if (!formState.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
        errors.email = 'Invalid email';
      }
      if (!formState.password) {
        errors.password = 'Password is required';
      } else if (formState.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
      if (!formState.clinicId) errors.clinicId = 'Clinic is required';
      if (!formState.branchId) errors.branchId = 'Branch is required';
    }

    if (formState.role === UserRole.DOCTOR && !formState.dentistId) {
      errors.dentistId = 'Doctor link is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formMode, formState]);

  const syncLocalUserStatus = useCallback((ids: string[], status: UserStatus): void => {
    const updatedAt = new Date().toISOString();
    setUsers((prev) =>
      prev.map((row) => (ids.includes(row.id) ? { ...row, status, updated_at: updatedAt } : row)),
    );
    setEditingUser((prev) => (prev && ids.includes(prev.id) ? { ...prev, status, updated_at: updatedAt } : prev));
  }, []);

  const updateManagedUserStatus = useCallback(
    async (target: ManagedUser, status: UserStatus): Promise<void> => {
      if (!supabase) throw new Error('Supabase client is not initialized');

      if (isCurrentUserManagedUser(target)) {
        if (!currentUserId) throw new Error('Authentication context is missing');

        const { error } = await supabase
          .from('user_profiles')
          .update({ status, updated_at: new Date().toISOString() })
          .or(`id.eq.${currentUserId},auth_id.eq.${currentUserId}`);

        if (error) throw error;
        syncLocalUserStatus([target.id], status);
        return;
      }

      if (!selectedClinicId) throw new Error('Clinic scope is required');

      const { error } = await supabase.rpc('admin_update_user_profile_for_scope', {
        p_target_user_id: target.id,
        p_username: null,
        p_status: status,
        p_role: null,
        p_clinic_id: selectedClinicId,
        p_branch_id: selectedBranchFilter === ALL_BRANCHES ? null : selectedBranchFilter,
      });

      if (error) throw error;
      syncLocalUserStatus([target.id], status);
    },
    [currentUserId, isCurrentUserManagedUser, selectedBranchFilter, selectedClinicId, syncLocalUserStatus],
  );

  const createUser = useCallback(async (): Promise<void> => {
    if (!supabase) throw new Error('Supabase client is not initialized');

    const isolated = createEphemeralSupabaseClient();
    if (!isolated) throw new Error('Failed to initialize isolated auth client');

    const email = formState.email.trim().toLowerCase();
    const { data: signupData, error: signupError } = await isolated.auth.signUp({
      email,
      password: formState.password,
      options: {
        data: {
          username: formState.username.trim(),
        },
      },
    });
    if (signupError) throw signupError;

    const newAuthUserId = signupData.user?.id;
    if (!newAuthUserId) throw new Error('Auth user creation did not return user id');

    const { error: scopedCreateError } = await supabase.rpc('admin_create_user_for_clinic', {
      p_auth_user_id: newAuthUserId,
      p_username: formState.username.trim(),
      p_email: email,
      p_role: formState.role,
      p_status: formState.status,
      p_clinic_id: formState.clinicId,
      p_branch_id: formState.branchId,
      p_dentist_id: formState.role === UserRole.DOCTOR ? formState.dentistId || null : null,
      p_is_default: true,
    });
    if (scopedCreateError) throw scopedCreateError;

    const requiresConfirmation = !signupData.session && !signupData.user?.email_confirmed_at;
    notify(
      requiresConfirmation ? NotificationType.WARNING : NotificationType.SUCCESS,
      requiresConfirmation
        ? 'User created. Email confirmation is required before first login.'
        : 'User created and linked successfully.',
    );
  }, [formState, notify]);

  const updateUser = useCallback(async (): Promise<void> => {
    if (!supabase || !editingUser) throw new Error('Edit context is missing');

    const isSelf = isCurrentUserManagedUser(editingUser);
    if (isSelf) {
      if (editingUser.role === UserRole.ADMIN && formState.role !== editingUser.role) {
        throw new Error('Your ADMIN role cannot be changed from this page');
      }

      if (!currentUserId) throw new Error('Authentication context is missing');

      const { error } = await supabase
        .from('user_profiles')
        .update({
          username: formState.username.trim(),
          status: formState.status,
          dentist_id: formState.role === UserRole.DOCTOR ? formState.dentistId || null : null,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${currentUserId},auth_id.eq.${currentUserId}`);

      if (error) throw error;
      syncLocalUserStatus([editingUser.id], formState.status);
      notify(NotificationType.SUCCESS, 'Profile updated successfully');
      return;
    }

    if (!selectedClinicId) throw new Error('Clinic scope is required');
    if (editingUser.role === UserRole.ADMIN || formState.role === UserRole.ADMIN) {
      throw new Error('Scoped update flow cannot edit ADMIN records');
    }

    const scopedBranchId = selectedBranchFilter === ALL_BRANCHES ? null : selectedBranchFilter;
    const { error: profileError } = await supabase.rpc('admin_update_user_profile_for_scope', {
      p_target_user_id: editingUser.id,
      p_username: formState.username.trim(),
      p_status: formState.status,
      p_role: null,
      p_clinic_id: selectedClinicId,
      p_branch_id: scopedBranchId,
    });
    if (profileError) throw profileError;

    const prevDentist = editingUser.dentist_id || null;
    const nextDentist = formState.role === UserRole.DOCTOR ? formState.dentistId || null : null;
    const roleChanged = formState.role !== editingUser.role;
    const dentistChanged = prevDentist !== nextDentist;

    if (roleChanged || dentistChanged) {
      const { error: roleError } = await supabase.rpc('admin_update_user_role_for_scope', {
        p_target_user_id: editingUser.id,
        p_new_role: formState.role,
        p_clinic_id: selectedClinicId,
        p_branch_id: scopedBranchId,
        p_dentist_id: nextDentist,
      });
      if (roleError) throw roleError;
    }

    syncLocalUserStatus([editingUser.id], formState.status);
    notify(NotificationType.SUCCESS, 'User updated successfully');
  }, [currentUserId, editingUser, formState, isCurrentUserManagedUser, notify, selectedBranchFilter, selectedClinicId, syncLocalUserStatus]);

  const submitForm = useCallback(
    async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      if (!validateForm()) return;

      setIsSubmitting(true);
      try {
        if (formMode === 'create') {
          await createUser();
        } else {
          await updateUser();
        }
        closeForm();
        setCurrentPage(1);
        await fetchUsers(1);
      } catch (error) {
        notify(NotificationType.ERROR, errorMessage(error, 'Failed to save user'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [closeForm, createUser, fetchUsers, formMode, notify, updateUser, validateForm],
  );

  const toggleSelect = useCallback(
    (id: string) => {
      const target = users.find((row) => row.id === id);
      if (target && isCurrentUserManagedUser(target)) return;
      setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    },
    [isCurrentUserManagedUser, users],
  );

  const toggleSelectAll = useCallback(() => {
    const selectableIds = users.filter((item) => !isCurrentUserManagedUser(item)).map((item) => item.id);
    if (selectableIds.length === 0) return;

    const allSelected = selectableIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !selectableIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...selectableIds])));
  }, [isCurrentUserManagedUser, selectedIds, users]);

  const applyStatusToUsers = useCallback(async (ids: string[], status: UserStatus): Promise<void> => {
    if (ids.length === 0) return;
    const targets = users.filter((row) => ids.includes(row.id));
    for (const target of targets) {
      await updateManagedUserStatus(target, status);
    }
  }, [updateManagedUserStatus, users]);

  const runBulkStatus = useCallback(
    async (status: UserStatus): Promise<void> => {
      const ids = selectedIds.filter((id) => !users.some((row) => row.id === id && isCurrentUserManagedUser(row)));
      if (ids.length === 0) {
        notify(NotificationType.WARNING, 'No valid users selected');
        return;
      }
      try {
        await applyStatusToUsers(ids, status);
        notify(NotificationType.SUCCESS, `${ids.length} user(s) updated to ${status}`);
        setSelectedIds([]);
        await fetchUsers(currentPage);
      } catch (error) {
        notify(NotificationType.ERROR, errorMessage(error, 'Failed to update selected users'));
      }
    },
    [applyStatusToUsers, currentPage, fetchUsers, isCurrentUserManagedUser, notify, selectedIds, users],
  );

  const savePermissions = useCallback(async (): Promise<void> => {
    if (!supabase || !permissionsUser || !selectedClinicId) return;
    setIsSavingPermissions(true);
    try {
      const { error } = await supabase.rpc('admin_update_user_permissions_for_scope', {
        p_target_user_id: permissionsUser.id,
        p_custom_permissions: Array.from(new Set(permissionsDraft)),
        p_override_permissions: overrideDraft,
        p_clinic_id: selectedClinicId,
        p_branch_id: selectedBranchFilter === ALL_BRANCHES ? null : selectedBranchFilter,
      });
      if (error) throw error;

      notify(NotificationType.SUCCESS, `Permissions updated for ${permissionsUser.username}`);
      setPermissionsUser(null);
      await fetchUsers(currentPage);
      if (isCurrentUserManagedUser(permissionsUser)) await refreshSession();
    } catch (error) {
      notify(NotificationType.ERROR, errorMessage(error, 'Failed to save permissions'));
    } finally {
      setIsSavingPermissions(false);
    }
  }, [currentPage, fetchUsers, isCurrentUserManagedUser, notify, overrideDraft, permissionsDraft, permissionsUser, refreshSession, selectedBranchFilter, selectedClinicId]);

  const sendResetEmail = useCallback(async () => {
    if (!supabase || !editingUser?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(editingUser.email, {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) throw error;
      notify(NotificationType.SUCCESS, `Reset email sent to ${editingUser.email}`);
    } catch (error) {
      notify(NotificationType.ERROR, errorMessage(error, 'Failed to send reset email'));
    }
  }, [editingUser?.email, notify]);

  const doctorById = useMemo(() => {
    return dentists.reduce<Record<string, string>>((acc, row) => {
      acc[row.id] = row.name;
      return acc;
    }, {});
  }, [dentists]);

  const totalPages = Math.max(1, Math.ceil(totalUsers / USERS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  if (!canView) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-700">
          Access denied: you do not have permission to view user management.
        </div>
      </div>
    );
  }

  const panelClass = theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const textMuted = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
  const inputClass = theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900';

  const nonSelfVisibleIds = users.filter((row) => !isCurrentUserManagedUser(row)).map((row) => row.id);
  const allVisibleSelected = nonSelfVisibleIds.length > 0 && nonSelfVisibleIds.every((id) => selectedIds.includes(id));

  const openPermissions = (row: ManagedUser): void => {
    if (row.role === UserRole.ADMIN) {
      notify(NotificationType.WARNING, 'ADMIN permissions cannot be edited in scoped flow');
      return;
    }
    setPermissionsUser(row);
    setPermissionsDraft(toPermissions(row.custom_permissions));
    setOverrideDraft(Boolean(row.override_permissions));
  };

  const togglePermission = (permission: Permission): void => {
    setPermissionsDraft((prev) => (prev.includes(permission) ? prev.filter((item) => item !== permission) : [...prev, permission]));
  };

  const quickChangeRole = async (row: ManagedUser, role: UserRole): Promise<void> => {
    if (!supabase || !selectedClinicId) return;
    if (isCurrentUserManagedUser(row)) {
      notify(NotificationType.WARNING, 'You cannot change your own role');
      return;
    }
    if (row.role === UserRole.ADMIN || role === UserRole.ADMIN) {
      notify(NotificationType.WARNING, 'ADMIN role changes are blocked in this flow');
      return;
    }
    if (role === UserRole.DOCTOR && !row.dentist_id) {
      notify(NotificationType.WARNING, 'Assign linked doctor from edit form first');
      return;
    }

    try {
      const { error } = await supabase.rpc('admin_update_user_role_for_scope', {
        p_target_user_id: row.id,
        p_new_role: role,
        p_clinic_id: selectedClinicId,
        p_branch_id: selectedBranchFilter === ALL_BRANCHES ? null : selectedBranchFilter,
        p_dentist_id: role === UserRole.DOCTOR ? row.dentist_id || null : null,
      });
      if (error) throw error;
      notify(NotificationType.SUCCESS, 'Role updated successfully');
      await fetchUsers(currentPage);
    } catch (error) {
      notify(NotificationType.ERROR, errorMessage(error, 'Failed to update role'));
    }
  };

  const confirmDelete = async (): Promise<void> => {
    const ids = deleteMode === 'bulk'
      ? selectedIds.filter((id) => !users.some((row) => row.id === id && isCurrentUserManagedUser(row)))
      : deleteTargetId ? [deleteTargetId] : [];
    if (ids.length === 0) {
      setDeleteMode(null);
      setDeleteTargetId(null);
      return;
    }
    try {
      await applyStatusToUsers(ids, UserStatus.SUSPENDED);
      notify(NotificationType.SUCCESS, deleteMode === 'bulk' ? `${ids.length} user(s) suspended` : 'User suspended');
      setDeleteMode(null);
      setDeleteTargetId(null);
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      await fetchUsers(currentPage);
    } catch (error) {
      notify(NotificationType.ERROR, errorMessage(error, 'Failed to suspend users'));
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <section className={`rounded-2xl border p-6 shadow-sm ${panelClass}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${textMuted}`}>Administration</p>
              <h1 className="mt-1 text-3xl font-black">User Management</h1>
              <p className={`mt-2 text-sm ${textMuted}`}>
                Rebuilt from zero using clinic/branch scoped RPCs and tenant linking.
              </p>
            </div>
            {canManageScoped && (
              <button
                type="button"
                onClick={openCreate}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Add User
              </button>
            )}
          </div>
        </section>

        {isPlatformOwner && (
          <section className={`rounded-xl border px-4 py-3 text-sm ${theme === 'dark' ? 'border-blue-700 bg-blue-900/20 text-blue-200' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>
            Platform-owner mode: global read listing is enabled, write actions are disabled.
          </section>
        )}

        {!isPlatformOwner && (
          <section className={`rounded-xl border px-4 py-3 text-sm ${theme === 'dark' ? 'border-emerald-700 bg-emerald-900/20 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            New users are created by `admin_create_user_for_clinic` to preserve tenant/clinic/branch links.
          </section>
        )}

        <section className={`rounded-2xl border p-4 ${panelClass}`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            {!isPlatformOwner && (
              <>
                <div className="md:col-span-3">
                  <label className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Clinic</label>
                  <select
                    value={selectedClinicId}
                    onChange={(event) => setSelectedClinicId(event.target.value)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm ${inputClass}`}
                  >
                    {clinicOptions.length === 0 && <option value="">No clinic</option>}
                    {clinicOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Branch Scope</label>
                  <select
                    value={selectedBranchFilter}
                    onChange={(event) => setSelectedBranchFilter(event.target.value)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm ${inputClass}`}
                  >
                    <option value={ALL_BRANCHES}>All branches</option>
                    {branchOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className={`${isPlatformOwner ? 'md:col-span-6' : 'md:col-span-3'}`}>
              <label className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="username / email"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm ${inputClass}`}
              />
            </div>
            <div className="md:col-span-3">
              <label className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Role</label>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm ${inputClass}`}
              >
                <option value="ALL">All roles</option>
                <option value={UserRole.ADMIN}>ADMIN</option>
                <option value={UserRole.DOCTOR}>DOCTOR</option>
                <option value={UserRole.ASSISTANT}>ASSISTANT</option>
                <option value={UserRole.RECEPTIONIST}>RECEPTIONIST</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Status</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm ${inputClass}`}
              >
                <option value="ALL">All statuses</option>
                <option value={UserStatus.ACTIVE}>ACTIVE</option>
                <option value={UserStatus.INACTIVE}>INACTIVE</option>
                <option value={UserStatus.SUSPENDED}>SUSPENDED</option>
              </select>
            </div>
          </div>
        </section>

        {canManageScoped && selectedIds.length > 0 && (
          <section className={`rounded-xl border p-4 ${theme === 'dark' ? 'border-indigo-700 bg-indigo-900/20 text-indigo-100' : 'border-indigo-200 bg-indigo-50 text-indigo-800'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-semibold">{selectedIds.length} selected</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => runBulkStatus(UserStatus.ACTIVE)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700">Set Active</button>
                <button type="button" onClick={() => runBulkStatus(UserStatus.INACTIVE)} className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700">Set Inactive</button>
                <button type="button" onClick={() => setDeleteMode('bulk')} className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700">Suspend Selected</button>
              </div>
            </div>
          </section>
        )}

        <section className={`overflow-hidden rounded-2xl border shadow-sm ${panelClass}`}>
          <div className="overflow-x-auto">
            <table className="min-w-[1040px] w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className={theme === 'dark' ? 'bg-slate-900/60' : 'bg-slate-100'}>
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} disabled={!canManageScoped} className="h-4 w-4 rounded border-slate-400" />
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textMuted}`}>User</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Role</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Doctor Link</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Status</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Last Login</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Created</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {isLoading ? (
                  <tr><td colSpan={8} className={`px-4 py-8 text-center text-sm ${textMuted}`}>Loading users...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={8} className={`px-4 py-8 text-center text-sm ${textMuted}`}>No users found.</td></tr>
                ) : (
                  users.map((row) => {
                    const isSelf = isCurrentUserManagedUser(row);
                    const protectedAdmin = row.role === UserRole.ADMIN && !isSelf;
                    const canEditRow = canManageScoped && !protectedAdmin;
                    return (
                      <tr key={row.id} className={theme === 'dark' ? 'hover:bg-slate-900/40' : 'hover:bg-slate-50'}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelect(row.id)} disabled={!canManageScoped || isSelf} className="h-4 w-4 rounded border-slate-400" />
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold">{row.username}</p>
                          <p className={`text-xs ${textMuted}`}>{row.email || 'No email'}</p>
                        </td>
                        <td className="px-4 py-3">
                          {canEditRow && row.role !== UserRole.ADMIN ? (
                            <select
                              value={row.role}
                              onChange={(event) => quickChangeRole(row, event.target.value as UserRole)}
                              className={`rounded-lg border px-2 py-1 text-xs font-semibold ${
                                theme === 'dark'
                                  ? 'border-slate-500 bg-slate-800 text-slate-100'
                                  : 'border-slate-300 bg-white text-slate-900'
                              }`}
                            >
                              <option value={UserRole.DOCTOR} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>DOCTOR</option>
                              <option value={UserRole.ASSISTANT} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>ASSISTANT</option>
                              <option value={UserRole.RECEPTIONIST} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>RECEPTIONIST</option>
                            </select>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">{row.role}</span>
                          )}
                        </td>
                        <td className={`px-4 py-3 text-sm ${textMuted}`}>{row.role === UserRole.DOCTOR ? (row.dentist_id ? doctorById[row.dentist_id] || 'Unknown doctor' : 'Not linked') : '-'}</td>
                        <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">{row.status}</span></td>
                        <td className={`px-4 py-3 text-sm ${textMuted}`}>{row.last_login ? new Date(row.last_login).toLocaleDateString() : 'Never'}</td>
                        <td className={`px-4 py-3 text-sm ${textMuted}`}>{new Date(row.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => openEdit(row)} disabled={!canEditRow} className="rounded-lg border border-blue-500 px-2 py-1 text-xs font-semibold text-blue-600 disabled:opacity-40">Edit</button>
                            <button type="button" onClick={() => openPermissions(row)} disabled={!canEditRow || row.role === UserRole.ADMIN} className="rounded-lg border border-emerald-500 px-2 py-1 text-xs font-semibold text-emerald-600 disabled:opacity-40">Permissions</button>
                            <button type="button" onClick={() => { setDeleteMode('single'); setDeleteTargetId(row.id); }} disabled={!canEditRow || isSelf} className="rounded-lg border border-rose-500 px-2 py-1 text-xs font-semibold text-rose-600 disabled:opacity-40">Suspend</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className={`flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
            <span className={`text-sm ${textMuted}`}>Showing {totalUsers === 0 ? 0 : (currentPage - 1) * USERS_PER_PAGE + 1}-{Math.min(currentPage * USERS_PER_PAGE, totalUsers)} of {totalUsers}</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">Previous</button>
              <span className={`text-sm ${textMuted}`}>Page {currentPage}/{totalPages}</span>
              <button type="button" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage >= totalPages} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">Next</button>
            </div>
          </div>
        </section>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-2xl rounded-2xl border p-6 ${panelClass}`}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{formMode === 'create' ? 'Create User' : `Edit ${editingUser?.username || 'User'}`}</h2>
                <p className={`mt-1 text-sm ${textMuted}`}>
                  {formMode === 'create'
                    ? 'Creates auth account then links it to clinic/branch scope with tenant context.'
                    : 'Updates scoped user profile and role data.'}
                </p>
              </div>
              <button type="button" onClick={closeForm} className={`text-sm ${textMuted}`}>
                Close
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Username</label>
                  <input
                    type="text"
                    value={formState.username}
                    onChange={(event) => setFormState((prev) => ({ ...prev, username: event.target.value }))}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm ${inputClass}`}
                  />
                  {formErrors.username && <p className="mt-1 text-xs text-rose-500">{formErrors.username}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Status</label>
                  <select
                    value={formState.status}
                    onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value as UserStatus }))}
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm ${inputClass}`}
                  >
                    <option value={UserStatus.ACTIVE}>ACTIVE</option>
                    <option value={UserStatus.INACTIVE}>INACTIVE</option>
                    <option value={UserStatus.SUSPENDED}>SUSPENDED</option>
                  </select>
                </div>
              </div>

              {formMode === 'create' && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Email</label>
                    <input
                      type="email"
                      value={formState.email}
                      onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm ${inputClass}`}
                    />
                    {formErrors.email && <p className="mt-1 text-xs text-rose-500">{formErrors.email}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Password</label>
                    <input
                      type="password"
                      value={formState.password}
                      onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm ${inputClass}`}
                    />
                    {formErrors.password && <p className="mt-1 text-xs text-rose-500">{formErrors.password}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Clinic</label>
                    <select
                      value={formState.clinicId}
                      onChange={(event) => setFormState((prev) => ({ ...prev, clinicId: event.target.value }))}
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm ${inputClass}`}
                    >
                      <option value="">Select clinic</option>
                      {clinicOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.clinicId && <p className="mt-1 text-xs text-rose-500">{formErrors.clinicId}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Branch</label>
                    <select
                      value={formState.branchId}
                      onChange={(event) => setFormState((prev) => ({ ...prev, branchId: event.target.value }))}
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm ${inputClass}`}
                    >
                      <option value="">Select branch</option>
                      {branchOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.branchId && <p className="mt-1 text-xs text-rose-500">{formErrors.branchId}</p>}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Role</label>
                  <select
                    value={formState.role}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        role: event.target.value as UserRole,
                        dentistId: event.target.value === UserRole.DOCTOR ? prev.dentistId : '',
                      }))
                    }
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm ${inputClass}`}
                    disabled={formMode === 'edit' && editingUser?.role === UserRole.ADMIN}
                  >
                    <option value={UserRole.ADMIN} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>ADMIN</option>
                    <option value={UserRole.DOCTOR} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>DOCTOR</option>
                    <option value={UserRole.ASSISTANT} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>ASSISTANT</option>
                    <option value={UserRole.RECEPTIONIST} style={{ color: '#0f172a', backgroundColor: '#ffffff' }}>RECEPTIONIST</option>
                  </select>
                </div>
                {formState.role === UserRole.DOCTOR && (
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Linked Doctor</label>
                    <select
                      value={formState.dentistId}
                      onChange={(event) => setFormState((prev) => ({ ...prev, dentistId: event.target.value }))}
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm ${inputClass}`}
                    >
                      <option value="">Select doctor profile</option>
                      {dentists.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.dentistId && <p className="mt-1 text-xs text-rose-500">{formErrors.dentistId}</p>}
                  </div>
                )}
              </div>

              {formMode === 'edit' && editingUser?.email && (
                <div className={`rounded-lg border p-3 text-sm ${theme === 'dark' ? 'border-blue-700 bg-blue-900/20 text-blue-200' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>
                  <p>Password reset is sent by email.</p>
                  <button type="button" onClick={sendResetEmail} className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                    Send Reset Email
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t pt-4">
                <button type="button" onClick={closeForm} className="rounded-lg border px-4 py-2 text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  {isSubmitting ? 'Saving...' : formMode === 'create' ? 'Create User' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {permissionsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-4xl rounded-2xl border p-6 ${panelClass}`}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Edit Permissions</h2>
                <p className={`mt-1 text-sm ${textMuted}`}>User: {permissionsUser.username}</p>
              </div>
              <button type="button" onClick={() => setPermissionsUser(null)} className={`text-sm ${textMuted}`}>
                Close
              </button>
            </div>

            <label className="mb-4 inline-flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={overrideDraft} onChange={(event) => setOverrideDraft(event.target.checked)} className="h-4 w-4" />
              Override role permissions
            </label>

            <div className="max-h-[52vh] space-y-4 overflow-y-auto pe-1">
              {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
                <div key={category} className={`rounded-xl border p-4 ${theme === 'dark' ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wider">{category}</h3>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {permissions.map((permission) => {
                      const isRolePerm =
                        permissionsUser.role !== UserRole.ADMIN && (ROLE_PERMISSIONS[permissionsUser.role] || []).includes(permission);
                      const isCustomPerm = permissionsDraft.includes(permission);
                      const checked = overrideDraft ? isCustomPerm : isRolePerm || isCustomPerm;
                      const disabled = !overrideDraft && isRolePerm && !isCustomPerm;
                      return (
                        <label key={permission} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
                          <input type="checkbox" checked={checked} disabled={disabled} onChange={() => togglePermission(permission)} className="h-4 w-4" />
                          <span>
                            {getPermissionDisplayName(permission)}
                            {isRolePerm && !overrideDraft && <span className="ms-1 text-xs text-emerald-600 dark:text-emerald-400">(from role)</span>}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t pt-4">
              <button type="button" onClick={() => setPermissionsUser(null)} className="rounded-lg border px-4 py-2 text-sm font-semibold">
                Cancel
              </button>
              <button type="button" onClick={savePermissions} disabled={isSavingPermissions} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {isSavingPermissions ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 ${panelClass}`}>
            <h2 className="text-lg font-bold">Confirm Suspend</h2>
            <p className={`mt-2 text-sm ${textMuted}`}>
              {deleteMode === 'bulk'
                ? `Suspend ${selectedIds.filter((id) => !users.some((row) => row.id === id && isCurrentUserManagedUser(row))).length} selected user(s)?`
                : 'Suspend this user?'}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => { setDeleteMode(null); setDeleteTargetId(null); }} className="rounded-lg border px-4 py-2 text-sm font-semibold">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default UserManagementPage;
