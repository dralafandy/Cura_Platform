import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationType, Permission, UserRole } from '../../types';

type AccessTable = 'user_clinics' | 'user_clinic_access';

interface ClinicRow {
  id: string;
  name: string;
  code?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  created_at?: string | null;
}

interface BranchRow {
  id: string;
  clinic_id: string;
  name: string;
  code?: string | null;
  branch_type?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean | null;
  is_main_branch?: boolean | null;
  created_at?: string | null;
}

interface UserProfileLite {
  id: string;
  username?: string | null;
  email?: string | null;
  role?: string | null;
  status?: string | null;
}

interface AssignmentRow {
  id: string;
  user_id: string;
  clinic_id: string;
  branch_id?: string | null;
  role_at_clinic?: string | null;
  is_default?: boolean | null;
  access_active?: boolean | null;
  is_active?: boolean | null;
  created_at?: string | null;
}

interface AssignmentViewRow {
  id?: string;
  user_id: string;
  clinic_id: string;
  clinic_name?: string | null;
  branch_id?: string | null;
  branch_name?: string | null;
  role_at_clinic?: string | null;
  is_default?: boolean | null;
  access_active?: boolean | null;
}

const clinicDefaultForm = {
  name: '',
  code: '',
  address: '',
  city: '',
  phone: '',
  email: '',
  status: 'ACTIVE',
};

const branchDefaultForm = {
  name: '',
  code: '',
  branch_type: 'BRANCH',
  address: '',
  city: '',
  phone: '',
  email: '',
  is_active: true,
  is_main_branch: false,
};

const assignmentDefaultForm = {
  user_id: '',
  branch_id: '',
  role_at_clinic: UserRole.DOCTOR,
  is_default: false,
};

const ClinicManagementPage: React.FC = () => {
  const { user, isAdmin, hasPermission, accessibleClinics } = useAuth();
  const { addNotification } = useNotification();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [profiles, setProfiles] = useState<UserProfileLite[]>([]);
  const [assignments, setAssignments] = useState<AssignmentViewRow[]>([]);
  const [accessTable, setAccessTable] = useState<AccessTable>('user_clinics');
  const [userTenantId, setUserTenantId] = useState<string | null>(null);

  const [selectedClinicId, setSelectedClinicId] = useState<string>('');

  const [editingClinicId, setEditingClinicId] = useState<string | null>(null);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);

  const [clinicForm, setClinicForm] = useState(clinicDefaultForm);
  const [branchForm, setBranchForm] = useState(branchDefaultForm);
  const [assignmentForm, setAssignmentForm] = useState(assignmentDefaultForm);

  const canManageClinics = isAdmin || hasPermission(Permission.SETTINGS_EDIT);
  const canManageBranches =
    isAdmin ||
    hasPermission(Permission.CLINIC_BRANCH_CREATE) ||
    hasPermission(Permission.CLINIC_BRANCH_EDIT) ||
    hasPermission(Permission.CLINIC_BRANCH_DELETE);

  const accessibleClinicIds = useMemo<string[]>(
    () =>
      Array.from(
        new Set(
          (accessibleClinics || [])
            .map((c) => c.clinicId)
            .filter((id): id is string => Boolean(id)),
        ),
      ),
    [accessibleClinics],
  );

  const branchOptions = useMemo(
    () => branches.filter((b) => b.clinic_id === selectedClinicId),
    [branches, selectedClinicId],
  );

  const isTableMissingError = (message?: string | null) => {
    const m = (message || '').toLowerCase();
    return m.includes('does not exist') || m.includes('relation') || m.includes('42p01');
  };

  const isRlsError = (message?: string | null) => {
    const m = (message || '').toLowerCase();
    return m.includes('row-level security') || m.includes('policy') || m.includes('42501');
  };

  const isAuditFkError = (message?: string | null, tableName?: 'clinics' | 'clinic_branches') => {
    const m = (message || '').toLowerCase();
    const isFkError = m.includes('foreign key') || m.includes('violates foreign key constraint');
    if (!isFkError) return false;

    if (m.includes('created_by') || m.includes('updated_by')) return true;
    if (tableName && m.includes(`${tableName}_created_by_fkey`)) return true;
    if (tableName && m.includes(`${tableName}_updated_by_fkey`)) return true;
    return false;
  };

  const notifyError = (fallback: string, raw?: string | null) => {
    const details = raw ? `${fallback}: ${raw}` : fallback;
    addNotification({ message: details, type: NotificationType.ERROR });
  };

  const detectAccessTable = useCallback(async (): Promise<AccessTable> => {
    if (!supabase) return 'user_clinics';

    const primary = await supabase.from('user_clinics').select('id').limit(1);
    if (!primary.error) {
      return 'user_clinics';
    }

    const fallback = await supabase.from('user_clinic_access').select('id').limit(1);
    if (!fallback.error) {
      return 'user_clinic_access';
    }

    return 'user_clinics';
  }, []);

  const fetchCurrentUserTenant = useCallback(async () => {
    if (!supabase || !user?.id) {
      setUserTenantId(null);
      return;
    }

    let { data } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!data) {
      const fallback = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('auth_id', user.id)
        .maybeSingle();
      data = fallback.data || null;
    }

    const tenant = (data as { tenant_id?: string | null } | null)?.tenant_id ?? null;
    setUserTenantId(tenant);
  }, [user?.id]);

  const fetchClinics = useCallback(async () => {
    if (!supabase) return;
    if (!user?.id) {
      setClinics([]);
      setSelectedClinicId('');
      return;
    }
    if (accessibleClinicIds.length === 0) {
      setClinics([]);
      setSelectedClinicId('');
      return;
    }

    const { data, error } = await supabase
      .from('clinics')
      .select('id,name,code,address,city,phone,email,status,created_at')
      .in('id', accessibleClinicIds)
      .order('created_at', { ascending: false });

    if (error) {
      notifyError('Failed to load clinics', error.message);
      return;
    }

    const rows = (data || []) as ClinicRow[];
    setClinics(rows);
    setSelectedClinicId((prev) => {
      if (rows.length === 0) return '';
      if (!prev) return rows[0].id;
      if (!rows.some((c) => c.id === prev)) return rows[0].id;
      return prev;
    });
  }, [accessibleClinicIds, user?.id]);

  const fetchBranches = useCallback(async () => {
    if (!supabase) return;
    if (accessibleClinicIds.length === 0) {
      setBranches([]);
      return;
    }

    const { data, error } = await supabase
      .from('clinic_branches')
      .select('id,clinic_id,name,code,branch_type,address,city,phone,email,is_active,is_main_branch,created_at')
      .in('clinic_id', accessibleClinicIds)
      .order('created_at', { ascending: false });

    if (error) {
      notifyError('Failed to load branches', error.message);
      return;
    }

    setBranches((data || []) as BranchRow[]);
  }, [accessibleClinicIds]);

  const fetchProfiles = useCallback(async () => {
    if (!supabase || !user?.id) return;

    const baseSelect = 'id,auth_id,username,email,role,status';

    // Self-only scope: do not expose other users even to tenant admins.
    const selfScoped = await supabase
      .from('user_profiles')
      .select(baseSelect)
      .or(`id.eq.${user.id},auth_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (selfScoped.error) {
      notifyError('Failed to load users', selfScoped.error.message);
      return;
    }

    const scopedProfiles = (selfScoped.data || []) as UserProfileLite[];
    setProfiles(scopedProfiles);
    setAssignmentForm((prev) => ({
      ...prev,
      user_id: user.id,
    }));
  }, [user?.id]);

  const fetchAssignments = useCallback(
    async (table: AccessTable) => {
      if (!supabase || !selectedClinicId || !user?.id) {
        setAssignments([]);
        return;
      }

      const fromView = await supabase
        .from('user_clinics_view')
        .select('id,user_id,clinic_id,clinic_name,branch_id,branch_name,role_at_clinic,is_default,access_active')
        .eq('clinic_id', selectedClinicId)
        .eq('user_id', user.id);

      if (!fromView.error) {
        setAssignments((fromView.data || []) as AssignmentViewRow[]);
        return;
      }

      if (!isTableMissingError(fromView.error.message)) {
        notifyError('Failed to load user assignments', fromView.error.message);
      }

      const raw = await supabase
        .from(table)
        .select('id,user_id,clinic_id,branch_id,role_at_clinic,is_default,access_active,is_active,created_at')
        .eq('clinic_id', selectedClinicId)
        .eq('user_id', user.id);

      if (raw.error) {
        notifyError('Failed to load user assignments', raw.error.message);
        return;
      }

      const mapped = ((raw.data || []) as AssignmentRow[]).map((r) => {
        const branchName = branches.find((b) => b.id === r.branch_id)?.name || null;
        return {
          id: r.id,
          user_id: r.user_id,
          clinic_id: r.clinic_id,
          clinic_name: clinics.find((c) => c.id === r.clinic_id)?.name || null,
          branch_id: r.branch_id ?? null,
          branch_name: branchName,
          role_at_clinic: r.role_at_clinic || 'DOCTOR',
          is_default: r.is_default ?? false,
          access_active: (r.access_active ?? r.is_active) ?? true,
        } as AssignmentViewRow;
      });

      setAssignments(mapped);
    },
    [branches, clinics, selectedClinicId, user?.id],
  );

  const refreshAll = useCallback(async () => {
    if (!supabase || !user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const table = await detectAccessTable();
      setAccessTable(table);
      await fetchCurrentUserTenant();
      await Promise.all([fetchClinics(), fetchBranches(), fetchProfiles()]);
      // Assignments are loaded by the dedicated effect once clinic selection is ready.
    } finally {
      setLoading(false);
    }
  }, [detectAccessTable, fetchBranches, fetchClinics, fetchCurrentUserTenant, fetchProfiles, user?.id]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!selectedClinicId) {
      setAssignments([]);
      return;
    }
    fetchAssignments(accessTable);
  }, [accessTable, fetchAssignments, selectedClinicId]);

  const resetClinicForm = () => {
    setClinicForm(clinicDefaultForm);
    setEditingClinicId(null);
  };

  const resetBranchForm = () => {
    setBranchForm(branchDefaultForm);
    setEditingBranchId(null);
  };

  const resetAssignmentForm = () => {
    setAssignmentForm(assignmentDefaultForm);
  };

  const handleEditClinic = (clinic: ClinicRow) => {
    setEditingClinicId(clinic.id);
    setClinicForm({
      name: clinic.name || '',
      code: clinic.code || '',
      address: clinic.address || '',
      city: clinic.city || '',
      phone: clinic.phone || '',
      email: clinic.email || '',
      status: (clinic.status || 'ACTIVE').toUpperCase(),
    });
  };

  const handleEditBranch = (branch: BranchRow) => {
    setEditingBranchId(branch.id);
    setBranchForm({
      name: branch.name || '',
      code: branch.code || '',
      branch_type: (branch.branch_type || 'BRANCH').toUpperCase(),
      address: branch.address || '',
      city: branch.city || '',
      phone: branch.phone || '',
      email: branch.email || '',
      is_active: branch.is_active ?? true,
      is_main_branch: branch.is_main_branch ?? false,
    });
  };

  const createClinic = async () => {
    if (!supabase || !user?.id) return;
    if (!clinicForm.name.trim()) {
      addNotification({ message: 'Clinic name is required', type: NotificationType.WARNING });
      return;
    }

    setSaving(true);

    const basePayload: Record<string, unknown> = {
      name: clinicForm.name.trim(),
      code: clinicForm.code.trim() || null,
      address: clinicForm.address.trim() || null,
      city: clinicForm.city.trim() || null,
      phone: clinicForm.phone.trim() || null,
      email: clinicForm.email.trim() || null,
      status: (clinicForm.status || 'ACTIVE').toUpperCase(),
    };

    let insert = await supabase.from('clinics').insert(basePayload).select('*').single();
    if (insert.error && userTenantId) {
      const message = insert.error.message || '';
      if (message.toLowerCase().includes('tenant')) {
        insert = await supabase
          .from('clinics')
          .insert({ ...basePayload, tenant_id: userTenantId })
          .select('*')
          .single();
      }
    }

    // Fallback for legacy DBs where created_by/updated_by defaults point to non-matching FK targets.
    if (insert.error && isAuditFkError(insert.error.message, 'clinics')) {
      const auditSafePayload: Record<string, unknown> = {
        ...basePayload,
        created_by: null,
        updated_by: null,
      };
      if (userTenantId) {
        auditSafePayload.tenant_id = userTenantId;
      }
      insert = await supabase.from('clinics').insert(auditSafePayload).select('*').single();
    }

    if (insert.error || !insert.data) {
      if (isRlsError(insert.error?.message)) {
        notifyError(
          'Clinic creation blocked by database policy. Create a secure RPC for clinic bootstrap/ownership first',
          insert.error?.message,
        );
      } else {
        notifyError('Failed to create clinic', insert.error?.message);
      }
      setSaving(false);
      return;
    }

    const createdClinic = insert.data as ClinicRow;
    const assignmentPayload: Record<string, unknown> = {
      user_id: user.id,
      clinic_id: createdClinic.id,
      role_at_clinic: 'ADMIN',
    };

    if (accessTable === 'user_clinics') {
      assignmentPayload.access_active = true;
      assignmentPayload.is_default = true;
    } else {
      assignmentPayload.is_active = true;
      assignmentPayload.is_default = true;
    }

    const assignmentResult = await supabase.from(accessTable).insert(assignmentPayload);
    if (assignmentResult.error && !isRlsError(assignmentResult.error.message)) {
      notifyError('Clinic created but owner assignment failed', assignmentResult.error.message);
    }

    addNotification({ message: 'Clinic created successfully', type: NotificationType.SUCCESS });
    resetClinicForm();
    await fetchClinics();
    setSelectedClinicId(createdClinic.id);
    await fetchAssignments(accessTable);
    setSaving(false);
  };

  const updateClinic = async () => {
    if (!supabase || !editingClinicId || !user?.id) return;
    if (!clinicForm.name.trim()) {
      addNotification({ message: 'Clinic name is required', type: NotificationType.WARNING });
      return;
    }

    setSaving(true);
    const clinicPatch: Record<string, unknown> = {
      name: clinicForm.name.trim(),
      code: clinicForm.code.trim() || null,
      address: clinicForm.address.trim() || null,
      city: clinicForm.city.trim() || null,
      phone: clinicForm.phone.trim() || null,
      email: clinicForm.email.trim() || null,
      status: (clinicForm.status || 'ACTIVE').toUpperCase(),
    };
    const { error } = await supabase
      .from('clinics')
      .update(clinicPatch)
      .eq('id', editingClinicId);

    if (error) {
      notifyError('Failed to update clinic', error.message);
      setSaving(false);
      return;
    }

    addNotification({ message: 'Clinic updated successfully', type: NotificationType.SUCCESS });
    resetClinicForm();
    await fetchClinics();
    setSaving(false);
  };

  const deleteClinic = async (id: string) => {
    if (!supabase) return;
    if (!window.confirm('Delete this clinic? This may fail if related records exist.')) return;

    setSaving(true);
    const { error } = await supabase.from('clinics').delete().eq('id', id);
    if (error) {
      notifyError('Failed to delete clinic', error.message);
      setSaving(false);
      return;
    }

    addNotification({ message: 'Clinic deleted successfully', type: NotificationType.SUCCESS });
    await fetchClinics();
    setSaving(false);
  };

  const createBranch = async () => {
    if (!supabase || !user?.id) return;
    if (!selectedClinicId) {
      addNotification({ message: 'Select a clinic first', type: NotificationType.WARNING });
      return;
    }
    if (!branchForm.name.trim()) {
      addNotification({ message: 'Branch name is required', type: NotificationType.WARNING });
      return;
    }

    setSaving(true);
    const branchPayload: Record<string, unknown> = {
      clinic_id: selectedClinicId,
      name: branchForm.name.trim(),
      code: branchForm.code.trim() || null,
      branch_type: branchForm.branch_type || 'BRANCH',
      address: branchForm.address.trim() || null,
      city: branchForm.city.trim() || null,
      phone: branchForm.phone.trim() || null,
      email: branchForm.email.trim() || null,
      is_active: branchForm.is_active,
      is_main_branch: branchForm.is_main_branch,
    };
    let branchInsert = await supabase.from('clinic_branches').insert(branchPayload);

    if (branchInsert.error && isAuditFkError(branchInsert.error.message, 'clinic_branches')) {
      branchInsert = await supabase.from('clinic_branches').insert({
        ...branchPayload,
        created_by: null,
        updated_by: null,
      });
    }

    if (branchInsert.error) {
      notifyError('Failed to create branch', branchInsert.error.message);
      setSaving(false);
      return;
    }

    addNotification({ message: 'Branch created successfully', type: NotificationType.SUCCESS });
    resetBranchForm();
    await fetchBranches();
    setSaving(false);
  };

  const updateBranch = async () => {
    if (!supabase || !editingBranchId || !user?.id) return;
    if (!branchForm.name.trim()) {
      addNotification({ message: 'Branch name is required', type: NotificationType.WARNING });
      return;
    }

    setSaving(true);
    const branchPatch: Record<string, unknown> = {
      name: branchForm.name.trim(),
      code: branchForm.code.trim() || null,
      branch_type: branchForm.branch_type || 'BRANCH',
      address: branchForm.address.trim() || null,
      city: branchForm.city.trim() || null,
      phone: branchForm.phone.trim() || null,
      email: branchForm.email.trim() || null,
      is_active: branchForm.is_active,
      is_main_branch: branchForm.is_main_branch,
    };
    const { error } = await supabase
      .from('clinic_branches')
      .update(branchPatch)
      .eq('id', editingBranchId);

    if (error) {
      notifyError('Failed to update branch', error.message);
      setSaving(false);
      return;
    }

    addNotification({ message: 'Branch updated successfully', type: NotificationType.SUCCESS });
    resetBranchForm();
    await fetchBranches();
    setSaving(false);
  };

  const deleteBranch = async (id: string) => {
    if (!supabase) return;
    if (!window.confirm('Delete this branch?')) return;

    setSaving(true);
    const { error } = await supabase.from('clinic_branches').delete().eq('id', id);
    if (error) {
      notifyError('Failed to delete branch', error.message);
      setSaving(false);
      return;
    }

    addNotification({ message: 'Branch deleted successfully', type: NotificationType.SUCCESS });
    await fetchBranches();
    setSaving(false);
  };

  const assignUserToClinic = async () => {
    if (!supabase || !selectedClinicId || !assignmentForm.user_id) {
      addNotification({ message: 'Select a user first', type: NotificationType.WARNING });
      return;
    }
    if (!user?.id || assignmentForm.user_id !== user.id) {
      addNotification({
        message: 'Account isolation is enabled. You can assign only your own user.',
        type: NotificationType.ERROR,
      });
      return;
    }

    setSaving(true);
    const payload: Record<string, unknown> = {
      user_id: assignmentForm.user_id,
      clinic_id: selectedClinicId,
      branch_id: assignmentForm.branch_id || null,
      role_at_clinic: assignmentForm.role_at_clinic,
      is_default: assignmentForm.is_default,
    };

    if (accessTable === 'user_clinics') {
      payload.access_active = true;
      payload.custom_permissions = [];
    } else {
      payload.is_active = true;
      payload.custom_permissions = [];
    }

    const { error } = await supabase.from(accessTable).insert(payload);
    if (error) {
      notifyError('Failed to assign user', error.message);
      setSaving(false);
      return;
    }

    addNotification({ message: 'User assigned successfully', type: NotificationType.SUCCESS });
    resetAssignmentForm();
    await fetchAssignments(accessTable);
    setSaving(false);
  };

  const removeAssignment = async (row: AssignmentViewRow) => {
    if (!supabase) return;
    if (!user?.id || row.user_id !== user.id) {
      addNotification({
        message: 'Account isolation is enabled. You can remove only your own assignment.',
        type: NotificationType.ERROR,
      });
      return;
    }
    if (!window.confirm('Remove this user assignment?')) return;

    setSaving(true);

    let query = supabase
      .from(accessTable)
      .delete()
      .eq('user_id', row.user_id)
      .eq('clinic_id', row.clinic_id);

    if (row.branch_id) {
      query = query.eq('branch_id', row.branch_id);
    } else {
      query = query.is('branch_id', null);
    }

    const { error } = await query;
    if (error) {
      notifyError('Failed to remove assignment', error.message);
      setSaving(false);
      return;
    }

    addNotification({ message: 'Assignment removed successfully', type: NotificationType.SUCCESS });
    await fetchAssignments(accessTable);
    setSaving(false);
  };

  if (!supabase) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">Supabase Not Configured</h2>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          Clinic Management requires an active Supabase connection.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
        <p className="text-sm text-slate-600 dark:text-slate-300">Loading clinic management...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Clinic Management</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Rebuilt module: clinics, branches, and user assignments.
            </p>
          </div>
          <button
            type="button"
            onClick={refreshAll}
            disabled={saving}
            className="px-3 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 disabled:opacity-60"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Clinics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={clinicForm.name}
              onChange={(e) => setClinicForm((s) => ({ ...s, name: e.target.value }))}
              placeholder="Clinic Name"
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              value={clinicForm.code}
              onChange={(e) => setClinicForm((s) => ({ ...s, code: e.target.value }))}
              placeholder="Code"
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              value={clinicForm.address}
              onChange={(e) => setClinicForm((s) => ({ ...s, address: e.target.value }))}
              placeholder="Address"
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              value={clinicForm.city}
              onChange={(e) => setClinicForm((s) => ({ ...s, city: e.target.value }))}
              placeholder="City"
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              value={clinicForm.phone}
              onChange={(e) => setClinicForm((s) => ({ ...s, phone: e.target.value }))}
              placeholder="Phone"
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              value={clinicForm.email}
              onChange={(e) => setClinicForm((s) => ({ ...s, email: e.target.value }))}
              placeholder="Email"
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div className="mt-3">
            <select
              value={clinicForm.status}
              onChange={(e) => setClinicForm((s) => ({ ...s, status: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={!canManageClinics || saving}
              onClick={editingClinicId ? updateClinic : createClinic}
              className="px-4 py-2 rounded-lg text-sm bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-60"
            >
              {editingClinicId ? 'Update Clinic' : 'Create Clinic'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={resetClinicForm}
              className="px-4 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 disabled:opacity-60"
            >
              Clear
            </button>
          </div>
          <div className="mt-4 space-y-2 max-h-72 overflow-auto">
            {clinics.map((clinic) => (
              <div
                key={clinic.id}
                className={`p-3 rounded-lg border ${
                  selectedClinicId === clinic.id
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => setSelectedClinicId(clinic.id)}
                  >
                    <p className="font-medium text-slate-800 dark:text-slate-100">{clinic.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {clinic.code || 'No code'} | {clinic.status || 'ACTIVE'}
                    </p>
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!canManageClinics || saving}
                      onClick={() => handleEditClinic(clinic)}
                      className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={!canManageClinics || saving}
                      onClick={() => deleteClinic(clinic.id)}
                      className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {clinics.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No clinics found.</p>
            )}
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Branches</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Selected clinic: {clinics.find((c) => c.id === selectedClinicId)?.name || 'None'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={branchForm.name}
              onChange={(e) => setBranchForm((s) => ({ ...s, name: e.target.value }))}
              placeholder="Branch Name"
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              value={branchForm.code}
              onChange={(e) => setBranchForm((s) => ({ ...s, code: e.target.value }))}
              placeholder="Code"
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <select
              value={branchForm.branch_type}
              onChange={(e) => setBranchForm((s) => ({ ...s, branch_type: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="MAIN">MAIN</option>
              <option value="BRANCH">BRANCH</option>
              <option value="MOBILE">MOBILE</option>
              <option value="VIRTUAL">VIRTUAL</option>
            </select>
            <input
              value={branchForm.city}
              onChange={(e) => setBranchForm((s) => ({ ...s, city: e.target.value }))}
              placeholder="City"
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              value={branchForm.address}
              onChange={(e) => setBranchForm((s) => ({ ...s, address: e.target.value }))}
              placeholder="Address"
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              value={branchForm.phone}
              onChange={(e) => setBranchForm((s) => ({ ...s, phone: e.target.value }))}
              placeholder="Phone"
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              value={branchForm.email}
              onChange={(e) => setBranchForm((s) => ({ ...s, email: e.target.value }))}
              placeholder="Email"
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
          <div className="mt-3 flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={branchForm.is_active}
                onChange={(e) => setBranchForm((s) => ({ ...s, is_active: e.target.checked }))}
              />
              Active
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={branchForm.is_main_branch}
                onChange={(e) => setBranchForm((s) => ({ ...s, is_main_branch: e.target.checked }))}
              />
              Main Branch
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={!canManageBranches || saving || !selectedClinicId}
              onClick={editingBranchId ? updateBranch : createBranch}
              className="px-4 py-2 rounded-lg text-sm bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-60"
            >
              {editingBranchId ? 'Update Branch' : 'Create Branch'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={resetBranchForm}
              className="px-4 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 disabled:opacity-60"
            >
              Clear
            </button>
          </div>
          <div className="mt-4 space-y-2 max-h-72 overflow-auto">
            {branchOptions.map((branch) => (
              <div key={branch.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">{branch.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {(branch.branch_type || 'BRANCH').toUpperCase()} | {branch.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!canManageBranches || saving}
                      onClick={() => handleEditBranch(branch)}
                      className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={!canManageBranches || saving}
                      onClick={() => deleteBranch(branch.id)}
                      className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {branchOptions.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No branches for selected clinic.</p>
            )}
          </div>
        </section>
      </div>

      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">User Assignments</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Access table: <span className="font-mono">{accessTable}</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={assignmentForm.user_id}
            onChange={(e) => setAssignmentForm((s) => ({ ...s, user_id: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <option value="">Select User</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.username || p.email || p.id}
              </option>
            ))}
          </select>
          <select
            value={assignmentForm.branch_id}
            onChange={(e) => setAssignmentForm((s) => ({ ...s, branch_id: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            <option value="">All Branches</option>
            {branchOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            value={assignmentForm.role_at_clinic}
            onChange={(e) =>
              setAssignmentForm((s) => ({ ...s, role_at_clinic: e.target.value as UserRole }))
            }
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            {Object.values(UserRole).map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={saving || !selectedClinicId || !assignmentForm.user_id}
            onClick={assignUserToClinic}
            className="px-4 py-2 rounded-lg text-sm bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-60"
          >
            Assign User
          </button>
        </div>
        <label className="mt-3 inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={assignmentForm.is_default}
            onChange={(e) => setAssignmentForm((s) => ({ ...s, is_default: e.target.checked }))}
          />
          Set as default clinic for user
        </label>
        <div className="mt-4 space-y-2 max-h-80 overflow-auto">
          {assignments.map((row) => {
            const profile = profiles.find((p) => p.id === row.user_id);
            return (
              <div key={`${row.user_id}-${row.clinic_id}-${row.branch_id || 'all'}`} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      {profile?.username || profile?.email || row.user_id}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Role: {(row.role_at_clinic || 'DOCTOR').toUpperCase()} | Branch:{' '}
                      {row.branch_name || 'All'} | {row.access_active ? 'ACTIVE' : 'INACTIVE'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => removeAssignment(row)}
                    className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
          {assignments.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No user assignments for selected clinic.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default ClinicManagementPage;
