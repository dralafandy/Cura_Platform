import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useI18n } from '../../hooks/useI18n';
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
  const { t, locale } = useI18n();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [profiles, setProfiles] = useState<UserProfileLite[]>([]);
  const [assignments, setAssignments] = useState<AssignmentViewRow[]>([]);
  const [accessTable, setAccessTable] = useState<AccessTable>('user_clinics');
  const [userTenantId, setUserTenantId] = useState<string | null>(null);
  const [clinicSupportsTenantId, setClinicSupportsTenantId] = useState<boolean>(true);

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

  const isUserClinicUserFkError = (message?: string | null) => {
    const m = (message || '').toLowerCase();
    if (m.includes('user_clinics_user_id_fkey')) return true;
    return m.includes('user_clinics') && m.includes('foreign key') && m.includes('user_id');
  };

  const notifyError = (fallback: string, raw?: string | null) => {
    const details = raw ? `${fallback}: ${raw}` : fallback;
    addNotification({ message: details, type: NotificationType.ERROR });
  };

  const detectAccessTable = useCallback(async (): Promise<AccessTable> => {
    if (!supabase) return 'user_clinics';

    // Prefer modern table first when both schemas coexist.
    const modern = await supabase.from('user_clinic_access').select('id').limit(1);
    if (!modern.error) {
      return 'user_clinic_access';
    }

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

  const detectClinicTenantSupport = useCallback(async (): Promise<boolean> => {
    if (!supabase) return false;
    const probe = await supabase.from('clinics').select('tenant_id').limit(1);
    if (!probe.error) return true;

    const message = String(probe.error.message || '').toLowerCase();
    if (
      (message.includes('could not find') && message.includes('tenant_id')) ||
      (message.includes('column') && message.includes('tenant_id'))
    ) {
      return false;
    }

    // Unknown errors should not disable tenant-aware flow.
    return true;
  }, []);

  const resolveAssignmentUserId = useCallback(
    async (table: AccessTable, inputUserId: string): Promise<string> => {
      if (!supabase || !inputUserId) return inputUserId;

      const rpc = await supabase.rpc('resolve_actor_id_for_fk', {
        p_table_name: table,
        p_column_name: 'user_id',
        p_uid: inputUserId,
      });

      if (!rpc.error && typeof rpc.data === 'string' && rpc.data) {
        return rpc.data;
      }

      if (table === 'user_clinic_access') {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .or(`id.eq.${inputUserId},auth_id.eq.${inputUserId}`)
          .maybeSingle();
        if ((profile as { id?: string } | null)?.id) {
          return (profile as { id: string }).id;
        }
      }

      return inputUserId;
    },
    [],
  );

  const ensureUsersRow = useCallback(
    async (inputUserId: string): Promise<string | null> => {
      if (!supabase || !inputUserId) return null;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id,username,email,role,status')
        .or(`id.eq.${inputUserId},auth_id.eq.${inputUserId}`)
        .maybeSingle();

      const resolvedId = ((profile as any)?.id as string | undefined) || inputUserId;

      const existing = await supabase.from('users').select('id').eq('id', resolvedId).maybeSingle();
      if (!existing.error && existing.data?.id) {
        return resolvedId;
      }

      const email = ((profile as any)?.email as string | null | undefined) || user?.email || null;
      const username =
        ((profile as any)?.username as string | null | undefined) ||
        (email ? email.split('@')[0] : `user_${resolvedId.slice(0, 8)}`);
      const role = (((profile as any)?.role as string | null | undefined) || UserRole.DOCTOR).toUpperCase();
      const status = (((profile as any)?.status as string | null | undefined) || 'ACTIVE').toUpperCase();

      const attempts: Record<string, unknown>[] = [
        { id: resolvedId, email },
        { id: resolvedId, username, email },
        { id: resolvedId, username, email, password_hash: 'OAUTH_MANAGED' },
        { id: resolvedId, username, email, password_hash: 'OAUTH_MANAGED', role, status },
        { id: resolvedId },
      ];

      for (const payload of attempts) {
        const { error } = await supabase.from('users').insert(payload);
        if (!error) {
          return resolvedId;
        }
      }

      const finalCheck = await supabase.from('users').select('id').eq('id', resolvedId).maybeSingle();
      if (!finalCheck.error && finalCheck.data?.id) {
        return resolvedId;
      }

      return null;
    },
    [user?.email],
  );

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

    let tenant = (data as { tenant_id?: string | null } | null)?.tenant_id ?? null;

    if (!tenant) {
      const usersRow = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle();
      tenant = (usersRow.data as { tenant_id?: string | null } | null)?.tenant_id ?? null;
    }

    if (!tenant && accessibleClinicIds.length > 0) {
      const clinicRow = await supabase
        .from('clinics')
        .select('tenant_id')
        .in('id', accessibleClinicIds)
        .not('tenant_id', 'is', null)
        .limit(1)
        .maybeSingle();
      tenant = (clinicRow.data as { tenant_id?: string | null } | null)?.tenant_id ?? null;
    }

    setUserTenantId(tenant);
  }, [accessibleClinicIds, user?.id]);

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
      notifyError(t('clinicManagement.feedback.loadClinicsFailed'), error.message);
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
      notifyError(t('clinicManagement.feedback.loadBranchesFailed'), error.message);
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
      notifyError(t('clinicManagement.feedback.loadUsersFailed'), selfScoped.error.message);
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
        notifyError(t('clinicManagement.feedback.loadAssignmentsFailed'), fromView.error.message);
      }

      const raw = await supabase
        .from(table)
        .select('id,user_id,clinic_id,branch_id,role_at_clinic,is_default,access_active,is_active,created_at')
        .eq('clinic_id', selectedClinicId)
        .eq('user_id', user.id);

      if (raw.error) {
        notifyError(t('clinicManagement.feedback.loadAssignmentsFailed'), raw.error.message);
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
      setClinicSupportsTenantId(await detectClinicTenantSupport());
      await fetchCurrentUserTenant();
      await Promise.all([fetchClinics(), fetchBranches(), fetchProfiles()]);
      // Assignments are loaded by the dedicated effect once clinic selection is ready.
    } finally {
      setLoading(false);
    }
  }, [detectAccessTable, detectClinicTenantSupport, fetchBranches, fetchClinics, fetchCurrentUserTenant, fetchProfiles, user?.id]);

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
      addNotification({ message: t('clinicManagement.feedback.clinicNameRequired'), type: NotificationType.WARNING });
      return;
    }
    if (clinicSupportsTenantId && !userTenantId) {
      notifyError(
        t('clinicManagement.feedback.missingTenantTitle'),
        t('clinicManagement.feedback.missingTenantMessage'),
      );
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
    if (clinicSupportsTenantId) {
      basePayload.tenant_id = userTenantId;
    }

    let insert = await supabase.from('clinics').insert(basePayload).select('*').single();

    // Fallback for legacy DBs where created_by/updated_by defaults point to non-matching FK targets.
    if (insert.error && isAuditFkError(insert.error.message, 'clinics')) {
      const auditSafePayload: Record<string, unknown> = {
        ...basePayload,
        created_by: null,
        updated_by: null,
      };
      insert = await supabase.from('clinics').insert(auditSafePayload).select('*').single();
    }

    if (insert.error || !insert.data) {
      if (isRlsError(insert.error?.message)) {
        notifyError(
          t('clinicManagement.feedback.createClinicBlocked'),
          insert.error?.message,
        );
      } else {
        notifyError(t('clinicManagement.feedback.createClinicFailed'), insert.error?.message);
      }
      setSaving(false);
      return;
    }

    const createdClinic = insert.data as ClinicRow;
    let assignmentUserId = await resolveAssignmentUserId(accessTable, user.id);

    const assignmentPayload: Record<string, unknown> = {
      user_id: assignmentUserId,
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

    let assignmentResult = await supabase.from(accessTable).insert(assignmentPayload);

    // Legacy schema fallback: user_clinics may FK to public.users(id) and miss current user row.
    if (assignmentResult.error && accessTable === 'user_clinics' && isUserClinicUserFkError(assignmentResult.error.message)) {
      const ensuredUsersId = await ensureUsersRow(assignmentUserId);
      if (ensuredUsersId) {
        assignmentUserId = await resolveAssignmentUserId(accessTable, ensuredUsersId);
        assignmentPayload.user_id = assignmentUserId;
        assignmentResult = await supabase.from(accessTable).insert(assignmentPayload);
      }
    }

    if (assignmentResult.error && !isRlsError(assignmentResult.error.message)) {
      notifyError(t('clinicManagement.feedback.ownerAssignmentFailed'), assignmentResult.error.message);
    }

    addNotification({ message: t('clinicManagement.feedback.clinicCreated'), type: NotificationType.SUCCESS });
    resetClinicForm();
    await fetchClinics();
    setSelectedClinicId(createdClinic.id);
    await fetchAssignments(accessTable);
    setSaving(false);
  };

  const updateClinic = async () => {
    if (!supabase || !editingClinicId || !user?.id) return;
    if (!clinicForm.name.trim()) {
      addNotification({ message: t('clinicManagement.feedback.clinicNameRequired'), type: NotificationType.WARNING });
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
      notifyError(t('clinicManagement.feedback.updateClinicFailed'), error.message);
      setSaving(false);
      return;
    }

    addNotification({ message: t('clinicManagement.feedback.clinicUpdated'), type: NotificationType.SUCCESS });
    resetClinicForm();
    await fetchClinics();
    setSaving(false);
  };

  const deleteClinic = async (id: string) => {
    if (!supabase) return;
    if (!window.confirm(t('clinicManagement.feedback.confirmDeleteClinic'))) return;

    setSaving(true);
    const { error } = await supabase.from('clinics').delete().eq('id', id);
    if (error) {
      notifyError(t('clinicManagement.feedback.deleteClinicFailed'), error.message);
      setSaving(false);
      return;
    }

    addNotification({ message: t('clinicManagement.feedback.clinicDeleted'), type: NotificationType.SUCCESS });
    await fetchClinics();
    setSaving(false);
  };

  const createBranch = async () => {
    if (!supabase || !user?.id) return;
    if (!selectedClinicId) {
      addNotification({ message: t('clinicManagement.feedback.selectClinicFirst'), type: NotificationType.WARNING });
      return;
    }
    if (!branchForm.name.trim()) {
      addNotification({ message: t('clinicManagement.feedback.branchNameRequired'), type: NotificationType.WARNING });
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
      notifyError(t('clinicManagement.feedback.createBranchFailed'), branchInsert.error.message);
      setSaving(false);
      return;
    }

    addNotification({ message: t('clinicManagement.feedback.branchCreated'), type: NotificationType.SUCCESS });
    resetBranchForm();
    await fetchBranches();
    setSaving(false);
  };

  const updateBranch = async () => {
    if (!supabase || !editingBranchId || !user?.id) return;
    if (!branchForm.name.trim()) {
      addNotification({ message: t('clinicManagement.feedback.branchNameRequired'), type: NotificationType.WARNING });
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
      notifyError(t('clinicManagement.feedback.updateBranchFailed'), error.message);
      setSaving(false);
      return;
    }

    addNotification({ message: t('clinicManagement.feedback.branchUpdated'), type: NotificationType.SUCCESS });
    resetBranchForm();
    await fetchBranches();
    setSaving(false);
  };

  const deleteBranch = async (id: string) => {
    if (!supabase) return;
    if (!window.confirm(t('clinicManagement.feedback.confirmDeleteBranch'))) return;

    setSaving(true);
    const { error } = await supabase.from('clinic_branches').delete().eq('id', id);
    if (error) {
      notifyError(t('clinicManagement.feedback.deleteBranchFailed'), error.message);
      setSaving(false);
      return;
    }

    addNotification({ message: t('clinicManagement.feedback.branchDeleted'), type: NotificationType.SUCCESS });
    await fetchBranches();
    setSaving(false);
  };

  const assignUserToClinic = async () => {
    if (!supabase || !selectedClinicId || !assignmentForm.user_id) {
      addNotification({ message: t('clinicManagement.feedback.selectUserFirst'), type: NotificationType.WARNING });
      return;
    }
    if (!user?.id || assignmentForm.user_id !== user.id) {
      addNotification({
        message: t('clinicManagement.feedback.assignOwnUserOnly'),
        type: NotificationType.ERROR,
      });
      return;
    }

    setSaving(true);
    let assignmentUserId = await resolveAssignmentUserId(accessTable, assignmentForm.user_id);

    const payload: Record<string, unknown> = {
      user_id: assignmentUserId,
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

    let result = await supabase.from(accessTable).insert(payload);

    if (result.error && accessTable === 'user_clinics' && isUserClinicUserFkError(result.error.message)) {
      const ensuredUsersId = await ensureUsersRow(assignmentUserId);
      if (ensuredUsersId) {
        assignmentUserId = await resolveAssignmentUserId(accessTable, ensuredUsersId);
        payload.user_id = assignmentUserId;
        result = await supabase.from(accessTable).insert(payload);
      }
    }

    if (result.error) {
      notifyError(t('clinicManagement.feedback.assignUserFailed'), result.error.message);
      setSaving(false);
      return;
    }

    addNotification({ message: t('clinicManagement.feedback.userAssigned'), type: NotificationType.SUCCESS });
    resetAssignmentForm();
    await fetchAssignments(accessTable);
    setSaving(false);
  };

  const removeAssignment = async (row: AssignmentViewRow) => {
    if (!supabase) return;
    if (!user?.id || row.user_id !== user.id) {
      addNotification({
        message: t('clinicManagement.feedback.removeOwnAssignmentOnly'),
        type: NotificationType.ERROR,
      });
      return;
    }
    if (!window.confirm(t('clinicManagement.feedback.confirmRemoveAssignment'))) return;

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
      notifyError(t('clinicManagement.feedback.removeAssignmentFailed'), error.message);
      setSaving(false);
      return;
    }

    addNotification({ message: t('clinicManagement.feedback.assignmentRemoved'), type: NotificationType.SUCCESS });
    await fetchAssignments(accessTable);
    setSaving(false);
  };

  const selectedClinic = clinics.find((clinic) => clinic.id === selectedClinicId) || null;
  const selectedClinicBranches = branchOptions;
  const selectedClinicAssignments = assignments;
  const activeClinicsCount = clinics.filter((clinic) => (clinic.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
  const activeBranchesCount = branches.filter((branch) => branch.is_active ?? true).length;
  const defaultAssignmentsCount = assignments.filter((assignment) => assignment.is_default).length;

  const formatDate = (value?: string | null) => {
    if (!value) return t('clinicManagement.recentlyUpdated');
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return t('clinicManagement.recentlyUpdated');
    return parsed.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusLabel = (status?: string | null) => t(`clinicManagement.status.${(status || 'ACTIVE').toUpperCase()}`);
  const getBranchTypeLabel = (branchType?: string | null) => t(`clinicManagement.branchType.${(branchType || 'BRANCH').toUpperCase()}`);

  const clinicStatusTone = (status?: string | null) => {
    switch ((status || 'ACTIVE').toUpperCase()) {
      case 'INACTIVE':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200';
      case 'SUSPENDED':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200';
      default:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200';
    }
  };

  const branchTypeTone = (branchType?: string | null) => {
    switch ((branchType || 'BRANCH').toUpperCase()) {
      case 'MAIN':
        return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200';
      case 'VIRTUAL':
        return 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200';
      case 'MOBILE':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200';
      default:
        return 'bg-slate-200 text-slate-700 dark:bg-slate-700/70 dark:text-slate-200';
    }
  };

  const panelClass =
    'relative overflow-hidden rounded-[28px] border border-white/60 bg-white/90 p-5 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/85';
  const softPanelClass =
    'rounded-[24px] border border-slate-200/70 bg-slate-50/90 p-4 dark:border-slate-700/70 dark:bg-slate-800/55';
  const inputClass =
    'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10';
  const labelClass = 'mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400';
  const primaryButtonClass =
    'inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400';
  const secondaryButtonClass =
    'inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700';
  const dangerButtonClass =
    'inline-flex items-center justify-center rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20';

  if (!supabase) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">{t('clinicManagement.supabaseNotConfigured')}</h2>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {t('clinicManagement.supabaseRequired')}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('clinicManagement.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className={`${panelClass} bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.94),rgba(240,249,255,0.92))] dark:bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.2),_transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(17,24,39,0.9))]`}>
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0.12),_transparent_60%)] lg:block dark:bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.12),_transparent_60%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-cyan-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200">
              {t('clinicManagement.badge')}
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {t('clinicManagement.heroTitle')}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t('clinicManagement.heroSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[520px]">
            {[
              { label: t('clinicManagement.summary.clinics'), value: clinics.length, note: `${activeClinicsCount} ${t('clinicManagement.summary.active')}`, tone: 'from-cyan-500/20 to-sky-500/10 text-cyan-900 dark:text-cyan-100' },
              { label: t('clinicManagement.summary.branches'), value: branches.length, note: `${activeBranchesCount} ${t('clinicManagement.summary.active')}`, tone: 'from-emerald-500/20 to-teal-500/10 text-emerald-900 dark:text-emerald-100' },
              { label: t('clinicManagement.summary.assignments'), value: assignments.length, note: `${defaultAssignmentsCount} ${t('clinicManagement.summary.default')}`, tone: 'from-violet-500/20 to-fuchsia-500/10 text-violet-900 dark:text-violet-100' },
              { label: t('clinicManagement.summary.accessMode'), value: accessTable === 'user_clinic_access' ? t('clinicManagement.mode.new') : t('clinicManagement.mode.legacy'), note: accessTable, tone: 'from-slate-900/10 to-slate-700/5 text-slate-900 dark:text-slate-100' },
            ].map((item) => (
              <div key={item.label} className={`rounded-[22px] border border-white/70 bg-gradient-to-br ${item.tone} p-4 shadow-sm dark:border-slate-700/60`}>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="mt-3 text-2xl font-semibold">{item.value}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative mt-6 flex flex-wrap items-center gap-3">
          <button type="button" onClick={refreshAll} disabled={saving} className={primaryButtonClass}>
            {saving ? t('clinicManagement.saving') : t('clinicManagement.refreshWorkspace')}
          </button>
          <div className="rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
            {t('clinicManagement.tenantContext')}: <span className="font-mono text-[11px]">{userTenantId || t('clinicManagement.unavailable')}</span>
          </div>
          <div className="rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
            {t('clinicManagement.clinicSchema')}: {clinicSupportsTenantId ? t('clinicManagement.mode.tenantAware') : t('clinicManagement.mode.legacy')}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className={panelClass}>
          <div className={`${softPanelClass} bg-[linear-gradient(145deg,rgba(8,145,178,0.08),rgba(255,255,255,0.95))] dark:bg-[linear-gradient(145deg,rgba(8,145,178,0.14),rgba(15,23,42,0.78))]`}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-200">{t('clinicManagement.clinics.badge')}</p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{t('clinicManagement.clinics.title')}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t('clinicManagement.clinics.subtitle')}
            </p>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>{t('clinicManagement.form.clinicName')}</label>
              <input value={clinicForm.name} onChange={(e) => setClinicForm((s) => ({ ...s, name: e.target.value }))} placeholder={t('clinicManagement.placeholder.clinicName')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('clinicManagement.form.clinicCode')}</label>
              <input value={clinicForm.code} onChange={(e) => setClinicForm((s) => ({ ...s, code: e.target.value }))} placeholder={t('clinicManagement.placeholder.clinicCode')} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>{t('clinicManagement.form.address')}</label>
              <input value={clinicForm.address} onChange={(e) => setClinicForm((s) => ({ ...s, address: e.target.value }))} placeholder={t('clinicManagement.placeholder.address')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('clinicManagement.form.city')}</label>
              <input value={clinicForm.city} onChange={(e) => setClinicForm((s) => ({ ...s, city: e.target.value }))} placeholder={t('clinicManagement.placeholder.city')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('clinicManagement.form.status')}</label>
              <select value={clinicForm.status} onChange={(e) => setClinicForm((s) => ({ ...s, status: e.target.value }))} className={inputClass}>
                <option value="ACTIVE">{t('clinicManagement.status.ACTIVE')}</option>
                <option value="INACTIVE">{t('clinicManagement.status.INACTIVE')}</option>
                <option value="SUSPENDED">{t('clinicManagement.status.SUSPENDED')}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('clinicManagement.form.phone')}</label>
              <input value={clinicForm.phone} onChange={(e) => setClinicForm((s) => ({ ...s, phone: e.target.value }))} placeholder={t('clinicManagement.placeholder.phone')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('clinicManagement.form.email')}</label>
              <input value={clinicForm.email} onChange={(e) => setClinicForm((s) => ({ ...s, email: e.target.value }))} placeholder={t('clinicManagement.placeholder.email')} className={inputClass} />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" disabled={!canManageClinics || saving} onClick={editingClinicId ? updateClinic : createClinic} className={primaryButtonClass}>
              {editingClinicId ? t('clinicManagement.actions.updateClinic') : t('clinicManagement.actions.createClinic')}
            </button>
            <button type="button" disabled={saving} onClick={resetClinicForm} className={secondaryButtonClass}>
              {t('clinicManagement.actions.clearForm')}
            </button>
          </div>
          <div className="mt-6 space-y-3 max-h-[420px] overflow-auto pr-1">
            {clinics.map((clinic) => {
              const clinicBranches = branches.filter((branch) => branch.clinic_id === clinic.id);
              const isSelected = selectedClinicId === clinic.id;

              return (
                <div
                  key={clinic.id}
                  className={`rounded-[24px] border p-4 transition ${
                    isSelected
                      ? 'border-cyan-300 bg-cyan-50/80 shadow-[0_20px_45px_-30px_rgba(8,145,178,0.7)] dark:border-cyan-500/40 dark:bg-cyan-500/10'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-[0_18px_40px_-32px_rgba(15,23,42,0.55)] dark:border-slate-700 dark:bg-slate-800/55 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <button type="button" className="flex-1 text-left" onClick={() => setSelectedClinicId(clinic.id)}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white dark:bg-cyan-500 dark:text-slate-950">
                          {clinic.name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div>
                          <p className="text-base font-semibold text-slate-900 dark:text-white">{clinic.name}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {clinic.city || t('clinicManagement.cityPending')} {clinic.code ? `- ${clinic.code}` : `- ${t('clinicManagement.noCode')}`}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${clinicStatusTone(clinic.status)}`}>
                          {getStatusLabel(clinic.status)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600 dark:bg-slate-700/70 dark:text-slate-200">
                          {clinicBranches.length} {t('clinicManagement.summary.branches')}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <div className="rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-900/70">
                          <p className="uppercase tracking-[0.22em]">{t('clinicManagement.form.phone')}</p>
                          <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{clinic.phone || t('clinicManagement.notSet')}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-900/70">
                          <p className="uppercase tracking-[0.22em]">{t('clinicManagement.updated')}</p>
                          <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{formatDate(clinic.created_at)}</p>
                        </div>
                      </div>
                    </button>
                    <div className="flex flex-col gap-2">
                      <button type="button" disabled={!canManageClinics || saving} onClick={() => handleEditClinic(clinic)} className={secondaryButtonClass}>
                        {t('common.edit')}
                      </button>
                      <button type="button" disabled={!canManageClinics || saving} onClick={() => deleteClinic(clinic.id)} className={dangerButtonClass}>
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {clinics.length === 0 && (
              <div className={`${softPanelClass} text-sm text-slate-500 dark:text-slate-400`}>
                {t('clinicManagement.empty.clinics')}
              </div>
            )}
          </div>
        </section>

        <section className={panelClass}>
          <div className={`${softPanelClass} bg-[linear-gradient(145deg,rgba(16,185,129,0.08),rgba(255,255,255,0.96))] dark:bg-[linear-gradient(145deg,rgba(16,185,129,0.12),rgba(15,23,42,0.78))]`}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700 dark:text-emerald-200">{t('clinicManagement.branches.badge')}</p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{t('clinicManagement.branches.title')}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {selectedClinic
                ? t('clinicManagement.branches.subtitleSelected', { clinic: selectedClinic.name })
                : t('clinicManagement.branches.subtitleEmpty')}
            </p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[22px] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700/70 dark:bg-slate-800/55">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{t('clinicManagement.selectedClinic')}</p>
              <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{selectedClinic?.name || t('clinicManagement.noneSelected')}</p>
            </div>
            <div className="rounded-[22px] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700/70 dark:bg-slate-800/55">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{t('clinicManagement.branchCount')}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{selectedClinicBranches.length}</p>
            </div>
            <div className="rounded-[22px] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700/70 dark:bg-slate-800/55">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{t('clinicManagement.activeBranches')}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{selectedClinicBranches.filter((branch) => branch.is_active ?? true).length}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>{t('clinicManagement.form.branchName')}</label>
              <input value={branchForm.name} onChange={(e) => setBranchForm((s) => ({ ...s, name: e.target.value }))} placeholder={t('clinicManagement.placeholder.branchName')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('clinicManagement.form.code')}</label>
              <input value={branchForm.code} onChange={(e) => setBranchForm((s) => ({ ...s, code: e.target.value }))} placeholder={t('clinicManagement.placeholder.branchCode')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('clinicManagement.form.branchType')}</label>
              <select value={branchForm.branch_type} onChange={(e) => setBranchForm((s) => ({ ...s, branch_type: e.target.value }))} className={inputClass}>
                <option value="MAIN">{t('clinicManagement.branchType.MAIN')}</option>
                <option value="BRANCH">{t('clinicManagement.branchType.BRANCH')}</option>
                <option value="MOBILE">{t('clinicManagement.branchType.MOBILE')}</option>
                <option value="VIRTUAL">{t('clinicManagement.branchType.VIRTUAL')}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('clinicManagement.form.city')}</label>
              <input value={branchForm.city} onChange={(e) => setBranchForm((s) => ({ ...s, city: e.target.value }))} placeholder={t('clinicManagement.placeholder.city')} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>{t('clinicManagement.form.address')}</label>
              <input value={branchForm.address} onChange={(e) => setBranchForm((s) => ({ ...s, address: e.target.value }))} placeholder={t('clinicManagement.placeholder.branchAddress')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('clinicManagement.form.phone')}</label>
              <input value={branchForm.phone} onChange={(e) => setBranchForm((s) => ({ ...s, phone: e.target.value }))} placeholder={t('clinicManagement.placeholder.phone')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('clinicManagement.form.email')}</label>
              <input value={branchForm.email} onChange={(e) => setBranchForm((s) => ({ ...s, email: e.target.value }))} placeholder={t('clinicManagement.placeholder.branchEmail')} className={inputClass} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-300">
            <label className="inline-flex items-center gap-3">
              <input type="checkbox" checked={branchForm.is_active} onChange={(e) => setBranchForm((s) => ({ ...s, is_active: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
              {t('clinicManagement.actions.activeBranch')}
            </label>
            <label className="inline-flex items-center gap-3">
              <input type="checkbox" checked={branchForm.is_main_branch} onChange={(e) => setBranchForm((s) => ({ ...s, is_main_branch: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
              {t('clinicManagement.actions.mainBranch')}
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" disabled={!canManageBranches || saving || !selectedClinicId} onClick={editingBranchId ? updateBranch : createBranch} className={primaryButtonClass}>
              {editingBranchId ? t('clinicManagement.actions.updateBranch') : t('clinicManagement.actions.createBranch')}
            </button>
            <button type="button" disabled={saving} onClick={resetBranchForm} className={secondaryButtonClass}>
              {t('clinicManagement.actions.clearForm')}
            </button>
          </div>
          <div className="mt-6 space-y-3 max-h-[420px] overflow-auto pr-1">
            {selectedClinicBranches.map((branch) => (
              <div key={branch.id} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-slate-900 dark:text-white">{branch.name}</p>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${branchTypeTone(branch.branch_type)}`}>
                        {getBranchTypeLabel(branch.branch_type)}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${branch.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-700/70 dark:text-slate-200'}`}>
                        {branch.is_active ? t('clinicManagement.status.ACTIVE') : t('clinicManagement.status.INACTIVE')}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {branch.address || t('clinicManagement.addressPending')}{branch.city ? `, ${branch.city}` : ''}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                      {branch.code && <span className="rounded-full bg-slate-100 px-3 py-1 font-mono dark:bg-slate-700/70">{branch.code}</span>}
                      {branch.is_main_branch && <span className="rounded-full bg-cyan-100 px-3 py-1 font-semibold text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200">{t('clinicManagement.actions.mainBranch')}</span>}
                      <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-700/70">{branch.phone || t('clinicManagement.noPhone')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button type="button" disabled={!canManageBranches || saving} onClick={() => handleEditBranch(branch)} className={secondaryButtonClass}>
                      {t('common.edit')}
                    </button>
                    <button type="button" disabled={!canManageBranches || saving} onClick={() => deleteBranch(branch.id)} className={dangerButtonClass}>
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {selectedClinicBranches.length === 0 && (
              <div className={`${softPanelClass} text-sm text-slate-500 dark:text-slate-400`}>
                {t('clinicManagement.empty.branches')}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className={panelClass}>
        <div className={`${softPanelClass} bg-[linear-gradient(145deg,rgba(139,92,246,0.08),rgba(255,255,255,0.96))] dark:bg-[linear-gradient(145deg,rgba(139,92,246,0.14),rgba(15,23,42,0.78))]`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-700 dark:text-violet-200">{t('clinicManagement.assignments.badge')}</p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{t('clinicManagement.assignments.title')}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {t('clinicManagement.assignments.subtitle')}
              </p>
            </div>
            <div className="rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
              {t('clinicManagement.accessTable')}: <span className="font-mono">{accessTable}</span>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-[22px] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700/70 dark:bg-slate-800/55">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{t('clinicManagement.summary.clinics')}</p>
            <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{selectedClinic?.name || t('clinicManagement.noneSelected')}</p>
          </div>
          <div className="rounded-[22px] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700/70 dark:bg-slate-800/55">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{t('clinicManagement.summary.assignments')}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{selectedClinicAssignments.length}</p>
          </div>
          <div className="rounded-[22px] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700/70 dark:bg-slate-800/55">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{t('clinicManagement.defaultAccess')}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{selectedClinicAssignments.filter((assignment) => assignment.is_default).length}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass}>{t('clinicManagement.form.user')}</label>
            <select value={assignmentForm.user_id} onChange={(e) => setAssignmentForm((s) => ({ ...s, user_id: e.target.value }))} className={inputClass}>
              <option value="">{t('clinicManagement.selectUser')}</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.username || p.email || p.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t('clinicManagement.branchScope')}</label>
            <select value={assignmentForm.branch_id} onChange={(e) => setAssignmentForm((s) => ({ ...s, branch_id: e.target.value }))} className={inputClass}>
              <option value="">{t('clinicManagement.allBranches')}</option>
              {selectedClinicBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t('clinicManagement.form.role')}</label>
            <select value={assignmentForm.role_at_clinic} onChange={(e) => setAssignmentForm((s) => ({ ...s, role_at_clinic: e.target.value as UserRole }))} className={inputClass}>
              {Object.values(UserRole).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button type="button" disabled={saving || !selectedClinicId || !assignmentForm.user_id} onClick={assignUserToClinic} className={`${primaryButtonClass} w-full`}>
              {t('clinicManagement.actions.assignUser')}
            </button>
          </div>
        </div>
        <label className="mt-4 inline-flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={assignmentForm.is_default} onChange={(e) => setAssignmentForm((s) => ({ ...s, is_default: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
          {t('clinicManagement.actions.setDefaultClinic')}
        </label>
        <div className="mt-6 space-y-3 max-h-[420px] overflow-auto pr-1">
          {selectedClinicAssignments.map((row) => {
            const profile = profiles.find((p) => p.id === row.user_id);

            return (
              <div key={`${row.user_id}-${row.clinic_id}-${row.branch_id || 'all'}`} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/60">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-slate-900 dark:text-white">{profile?.username || profile?.email || row.user_id}</p>
                      <span className="rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                        {row.role_at_clinic || 'DOCTOR'}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${row.access_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-700/70 dark:text-slate-200'}`}>
                        {row.access_active ? t('clinicManagement.status.ACTIVE') : t('clinicManagement.status.INACTIVE')}
                      </span>
                      {row.is_default && (
                        <span className="rounded-full bg-cyan-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200">
                          {t('clinicManagement.summary.default')}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {t('clinicManagement.branchScope')}: {row.branch_name || t('clinicManagement.allBranches')}
                    </p>
                  </div>
                  <button type="button" disabled={saving} onClick={() => removeAssignment(row)} className={dangerButtonClass}>
                    {t('clinicManagement.actions.remove')}
                  </button>
                </div>
              </div>
            );
          })}
          {selectedClinicAssignments.length === 0 && (
            <div className={`${softPanelClass} text-sm text-slate-500 dark:text-slate-400`}>
              {t('clinicManagement.empty.assignments')}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ClinicManagementPage;
