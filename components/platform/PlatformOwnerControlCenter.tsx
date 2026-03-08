import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Permission, UserRole, UserStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../hooks/useI18n';

const OWNER_EMAIL = 'dralafandy@gmail.com';
const PAGE_SIZE = 20;
const SUBSCRIPTION_STATUSES = ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'] as const;
const ALL_PERMISSIONS = Object.values(Permission);
const ALL_USER_ROLES = Object.values(UserRole);
const ALL_USER_STATUSES = Object.values(UserStatus);

type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
type TabId = 'tenants' | 'plans' | 'users';

type PlanRow = {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  max_users: number | null;
  max_patients: number | null;
  max_clinics: number | null;
  max_branches: number | null;
  package_permissions: Permission[];
  is_active: boolean;
  is_trial: boolean;
};

type TenantRow = {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  subscription_status: SubscriptionStatus;
  subscription_plan: string;
  current_users: number;
  current_patients: number;
  current_clinics: number;
  current_branches: number;
  max_users: number | null;
  max_patients: number | null;
  max_clinics: number | null;
  max_branches: number | null;
  total_count: number;
};

type UserRow = {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  tenant_id: string | null;
  tenant_name: string | null;
  custom_permissions: Permission[];
  override_permissions: boolean;
  total_count: number;
};

type PlanDraft = {
  id: string | null;
  slug: string;
  nameAr: string;
  nameEn: string;
  maxUsers: string;
  maxPatients: string;
  maxClinics: string;
  maxBranches: string;
  isActive: boolean;
  isTrial: boolean;
  packagePermissions: Permission[];
};

type UserDraft = {
  id: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  tenantId: string;
  overridePermissions: boolean;
  customPermissions: Permission[];
};

const emptyPlanDraft = (): PlanDraft => ({
  id: null,
  slug: '',
  nameAr: '',
  nameEn: '',
  maxUsers: '',
  maxPatients: '',
  maxClinics: '',
  maxBranches: '',
  isActive: true,
  isTrial: false,
  packagePermissions: [],
});

const toInt = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const toPermissions = (value: unknown): Permission[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is Permission => typeof entry === 'string' && ALL_PERMISSIONS.includes(entry as Permission));
};

const PlatformOwnerControlCenter: React.FC = () => {
  const { locale } = useI18n();
  const { user, userProfile } = useAuth();
  const isPlatformOwner = String(userProfile?.email || user?.email || '').trim().toLowerCase() === OWNER_EMAIL;
  const isArabic = locale === 'ar';
  const labels = useMemo(
    () => ({
      loading: isArabic ? 'جار التحميل...' : 'Loading...',
      noData: isArabic ? 'لا توجد بيانات' : 'No data',
      refresh: isArabic ? 'تحديث' : 'Refresh',
      apply: isArabic ? 'تطبيق' : 'Apply',
      save: isArabic ? 'حفظ' : 'Save',
    }),
    [isArabic]
  );

  const [tab, setTab] = useState<TabId>('tenants');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [planDraft, setPlanDraft] = useState<PlanDraft>(emptyPlanDraft());
  const [savingPlan, setSavingPlan] = useState(false);

  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantStatus, setTenantStatus] = useState<'ALL' | SubscriptionStatus>('ALL');
  const [tenantPage, setTenantPage] = useState(1);
  const [tenantTotal, setTenantTotal] = useState(0);
  const [tenantDrafts, setTenantDrafts] = useState<Record<string, { planSlug: string; status: SubscriptionStatus; durationDays: string }>>({});
  const [applyingTenantId, setApplyingTenantId] = useState<string | null>(null);
  const [tenantListRpcState, setTenantListRpcState] = useState<'unknown' | 'available' | 'missing'>('unknown');

  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState<'ALL' | UserRole>('ALL');
  const [userStatus, setUserStatus] = useState<'ALL' | UserStatus>('ALL');
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [userDraft, setUserDraft] = useState<UserDraft | null>(null);
  const [savingUser, setSavingUser] = useState(false);

  const tenantPages = Math.max(1, Math.ceil(tenantTotal / PAGE_SIZE));
  const userPages = Math.max(1, Math.ceil(userTotal / PAGE_SIZE));

  const fail = useCallback((message: string) => {
    setError(message);
    setSuccess(null);
  }, []);

  const ok = useCallback((message: string) => {
    setSuccess(message);
    setError(null);
  }, []);

  const loadPlans = useCallback(async () => {
    if (!supabase || !isPlatformOwner) return;
    const { data, error } = await supabase.rpc('platform_owner_list_subscription_plans');
    if (error) throw error;
    const rows = (Array.isArray(data) ? data : []).map((row: any) => ({
      id: String(row.id),
      slug: String(row.slug || ''),
      name_ar: String(row.name_ar || ''),
      name_en: String(row.name_en || ''),
      max_users: row.max_users == null ? null : Number(row.max_users),
      max_patients: row.max_patients == null ? null : Number(row.max_patients),
      max_clinics: row.max_clinics == null ? null : Number(row.max_clinics),
      max_branches: row.max_branches == null ? null : Number(row.max_branches),
      package_permissions: toPermissions(row.package_permissions),
      is_active: row.is_active !== false,
      is_trial: row.is_trial === true,
    })) as PlanRow[];
    setPlans(rows);
    if (rows.length > 0 && !planDraft.id) {
      const first = rows[0];
      setPlanDraft({
        id: first.id,
        slug: first.slug,
        nameAr: first.name_ar,
        nameEn: first.name_en,
        maxUsers: first.max_users == null ? '' : String(first.max_users),
        maxPatients: first.max_patients == null ? '' : String(first.max_patients),
        maxClinics: first.max_clinics == null ? '' : String(first.max_clinics),
        maxBranches: first.max_branches == null ? '' : String(first.max_branches),
        isActive: first.is_active,
        isTrial: first.is_trial,
        packagePermissions: first.package_permissions,
      });
    }
  }, [isPlatformOwner, planDraft.id]);

  const loadTenants = useCallback(async () => {
    if (!supabase || !isPlatformOwner) return;
    setTenantsLoading(true);
    try {
      if (tenantListRpcState === 'missing') {
        throw new Error('Platform owner subscriptions RPC is missing/outdated. Apply migration 055 and refresh.');
      }

      const { data, error } = await supabase.rpc('platform_owner_list_tenant_subscriptions', {
        p_search: tenantSearch.trim() || null,
        p_status: tenantStatus === 'ALL' ? null : tenantStatus,
        p_offset: (tenantPage - 1) * PAGE_SIZE,
        p_limit: PAGE_SIZE,
      });
      if (error) {
        const message = String(error.message || '').toLowerCase();
        const missingOrOutdated =
          String(error.code || '').toUpperCase() === 'PGRST202' ||
          String(error.code || '').toUpperCase() === '42883' ||
          message.includes('could not find the function') ||
          (message.includes('column') && message.includes('does not exist'));
        if (missingOrOutdated) {
          setTenantListRpcState('missing');
          throw new Error('Platform owner subscriptions RPC is missing/outdated. Apply migration 055 and refresh.');
        }
        throw error;
      }

      setTenantListRpcState('available');
      const rows = (Array.isArray(data) ? data : []).map((row: any) => {
        const status = SUBSCRIPTION_STATUSES.includes(row.subscription_status as SubscriptionStatus)
          ? (row.subscription_status as SubscriptionStatus)
          : 'ACTIVE';
        return {
          tenant_id: String(row.tenant_id || ''),
          tenant_name: String(row.tenant_name || ''),
          tenant_slug: String(row.tenant_slug || ''),
          subscription_status: status,
          subscription_plan: String(row.subscription_plan || 'trial'),
          current_users: Number(row.current_users || 0),
          current_patients: Number(row.current_patients || 0),
          current_clinics: Number(row.current_clinics || 0),
          current_branches: Number(row.current_branches || 0),
          max_users: row.max_users == null ? null : Number(row.max_users),
          max_patients: row.max_patients == null ? null : Number(row.max_patients),
          max_clinics: row.max_clinics == null ? null : Number(row.max_clinics),
          max_branches: row.max_branches == null ? null : Number(row.max_branches),
          total_count: Number(row.total_count || 0),
        };
      }) as TenantRow[];

      setTenantTotal(rows.length ? Number(rows[0].total_count || 0) : 0);

      setTenants(rows);
      setTenantDrafts((prev) => {
        const next = { ...prev };
        rows.forEach((row: any) => {
          if (!next[row.tenant_id]) {
            next[row.tenant_id] = { planSlug: String(row.subscription_plan || ''), status: String(row.subscription_status || 'ACTIVE') as SubscriptionStatus, durationDays: '30' };
          }
        });
        return next;
      });
    } finally {
      setTenantsLoading(false);
    }
  }, [isPlatformOwner, tenantListRpcState, tenantPage, tenantSearch, tenantStatus]);

  const loadUsers = useCallback(async () => {
    if (!supabase || !isPlatformOwner) return;
    setUsersLoading(true);
    try {
      const { data, error } = await supabase.rpc('platform_owner_list_users_with_tenant', {
        p_search: userSearch.trim() || null,
        p_role: userRole === 'ALL' ? null : userRole,
        p_status: userStatus === 'ALL' ? null : userStatus,
        p_tenant_id: null,
        p_offset: (userPage - 1) * PAGE_SIZE,
        p_limit: PAGE_SIZE,
      });
      if (error) throw error;
      const rows = (Array.isArray(data) ? data : []).map((row: any) => ({
        id: String(row.id || ''),
        username: String(row.username || ''),
        email: row.email == null ? null : String(row.email),
        role: ALL_USER_ROLES.includes(row.role as UserRole) ? (row.role as UserRole) : UserRole.ASSISTANT,
        status: ALL_USER_STATUSES.includes(row.status as UserStatus) ? (row.status as UserStatus) : UserStatus.ACTIVE,
        tenant_id: row.tenant_id == null ? null : String(row.tenant_id),
        tenant_name: row.tenant_name == null ? null : String(row.tenant_name),
        custom_permissions: toPermissions(row.custom_permissions),
        override_permissions: row.override_permissions === true,
        total_count: Number(row.total_count || 0),
      })) as UserRow[];
      setUsers(rows);
      setUserTotal(rows.length ? Number(rows[0].total_count || 0) : 0);
    } finally {
      setUsersLoading(false);
    }
  }, [isPlatformOwner, userPage, userRole, userSearch, userStatus]);

  useEffect(() => {
    if (!isPlatformOwner) return;
    (async () => {
      try {
        await Promise.all([loadPlans(), loadTenants(), loadUsers()]);
      } catch (e: any) {
        fail(e?.message || 'Failed to load platform data');
      }
    })();
  }, [fail, isPlatformOwner, loadPlans, loadTenants, loadUsers]);

  useEffect(() => setTenantPage(1), [tenantSearch, tenantStatus]);
  useEffect(() => setUserPage(1), [userSearch, userRole, userStatus]);

  const savePlan = useCallback(async () => {
    if (!supabase) return;
    if (!planDraft.slug.trim() || !planDraft.nameAr.trim() || !planDraft.nameEn.trim()) {
      fail('Plan slug and names are required');
      return;
    }
    setSavingPlan(true);
    try {
      const { error } = await supabase.rpc('platform_owner_upsert_subscription_plan', {
        p_plan_id: planDraft.id,
        p_slug: planDraft.slug.trim().toLowerCase(),
        p_name_ar: planDraft.nameAr.trim(),
        p_name_en: planDraft.nameEn.trim(),
        p_description: null,
        p_price_monthly: 0,
        p_price_yearly: 0,
        p_max_users: toInt(planDraft.maxUsers),
        p_max_patients: toInt(planDraft.maxPatients),
        p_max_clinics: toInt(planDraft.maxClinics),
        p_max_branches: toInt(planDraft.maxBranches),
        p_max_storage_mb: 1000,
        p_package_permissions: planDraft.packagePermissions,
        p_features: [],
        p_is_active: planDraft.isActive,
        p_is_trial: planDraft.isTrial,
        p_trial_days: 14,
        p_sort_order: 0,
      });
      if (error) throw error;
      ok('Plan saved');
      await Promise.all([loadPlans(), loadTenants()]);
    } catch (e: any) {
      fail(e?.message || 'Failed to save plan');
    } finally {
      setSavingPlan(false);
    }
  }, [fail, loadPlans, loadTenants, ok, planDraft]);

  const applyTenantPlan = useCallback(async (tenantId: string) => {
    if (!supabase) return;
    const draft = tenantDrafts[tenantId];
    if (!draft) return;
    setApplyingTenantId(tenantId);
    try {
      const { data, error } = await supabase.rpc('platform_owner_apply_subscription_plan', {
        p_tenant_id: tenantId,
        p_plan_slug: draft.planSlug,
        p_subscription_status: draft.status,
        p_duration_days: toInt(draft.durationDays) ?? 30,
      });
      if (error) throw error;
      if (data !== true) throw new Error('Subscription update failed');
      ok('Tenant subscription updated');
      await loadTenants();
    } catch (e: any) {
      fail(e?.message || 'Failed to update tenant');
    } finally {
      setApplyingTenantId(null);
    }
  }, [fail, loadTenants, ok, tenantDrafts]);

  const saveUser = useCallback(async () => {
    if (!supabase || !userDraft) return;
    setSavingUser(true);
    try {
      const profileResult = await supabase.rpc('platform_owner_update_user_profile', {
        p_target_user_id: userDraft.id,
        p_username: userDraft.username,
        p_role: userDraft.role,
        p_status: userDraft.status,
        p_tenant_id: userDraft.tenantId || null,
      });
      if (profileResult.error) throw profileResult.error;
      const permissionsResult = await supabase.rpc('platform_owner_update_user_permissions', {
        p_target_user_id: userDraft.id,
        p_custom_permissions: userDraft.customPermissions,
        p_override_permissions: userDraft.overridePermissions,
      });
      if (permissionsResult.error) throw permissionsResult.error;
      ok('User updated');
      await loadUsers();
      setUserDraft(null);
    } catch (e: any) {
      fail(e?.message || 'Failed to update user');
    } finally {
      setSavingUser(false);
    }
  }, [fail, loadUsers, ok, userDraft]);

  if (!isPlatformOwner) {
    return <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-700">This page is private for the platform owner only.</div>;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-700 dark:bg-indigo-900/20">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{isArabic ? 'لوحة تحكم مالك المنصة' : 'Platform Owner Console'}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {isArabic ? 'إدارة الاشتراكات والباقات والمستخدمين بصلاحيات كاملة.' : 'Manage subscriptions, plans, and users with full control.'}
        </p>
      </section>

      {error ? <div className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div> : null}
      {success ? <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{success}</div> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap gap-2">
          <button className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === 'tenants' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`} onClick={() => setTab('tenants')}>
            {isArabic ? 'الاشتراكات' : 'Subscriptions'}
          </button>
          <button className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === 'plans' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`} onClick={() => setTab('plans')}>
            {isArabic ? 'الباقات' : 'Plans'}
          </button>
          <button className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === 'users' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`} onClick={() => setTab('users')}>
            {isArabic ? 'المستخدمون' : 'Users'}
          </button>
        </div>
      </section>

      {tab === 'tenants' ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
            <input
              value={tenantSearch}
              onChange={(e) => setTenantSearch(e.target.value)}
              placeholder={isArabic ? 'بحث بالمؤسسة' : 'Search tenant'}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
            <select
              value={tenantStatus}
              onChange={(e) => setTenantStatus(e.target.value as 'ALL' | SubscriptionStatus)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            >
              <option value="ALL">ALL</option>
              {SUBSCRIPTION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <button className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200" onClick={() => void loadTenants()}>
              {labels.refresh}
            </button>
            <div className="flex items-center justify-end text-sm text-slate-500 dark:text-slate-400">
              {tenantPage} / {tenantPages}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Tenant</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Plan</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Users</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Patients</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Clinics</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Branches</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Apply</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tenantsLoading ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-8 text-center text-sm text-slate-500">{labels.loading}</td>
                  </tr>
                ) : tenants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-8 text-center text-sm text-slate-500">{labels.noData}</td>
                  </tr>
                ) : (
                  tenants.map((row) => {
                    const draft = tenantDrafts[row.tenant_id] || {
                      planSlug: row.subscription_plan,
                      status: row.subscription_status,
                      durationDays: '30',
                    };
                    return (
                      <tr key={row.tenant_id}>
                        <td className="px-2 py-2 text-sm">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{row.tenant_name}</p>
                          <p className="text-xs text-slate-500">{row.tenant_slug}</p>
                        </td>
                        <td className="px-2 py-2 text-sm">{row.subscription_plan}</td>
                        <td className="px-2 py-2 text-sm">{row.subscription_status}</td>
                        <td className="px-2 py-2 text-sm">{row.current_users} / {row.max_users ?? 'INF'}</td>
                        <td className="px-2 py-2 text-sm">{row.current_patients} / {row.max_patients ?? 'INF'}</td>
                        <td className="px-2 py-2 text-sm">{row.current_clinics} / {row.max_clinics ?? 'INF'}</td>
                        <td className="px-2 py-2 text-sm">{row.current_branches} / {row.max_branches ?? 'INF'}</td>
                        <td className="px-2 py-2">
                          <div className="grid grid-cols-1 gap-2">
                            <select
                              value={draft.planSlug}
                              onChange={(e) =>
                                setTenantDrafts((prev) => ({
                                  ...prev,
                                  [row.tenant_id]: { ...draft, planSlug: e.target.value },
                                }))
                              }
                              className="rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-950"
                            >
                              {plans.map((plan) => (
                                <option key={plan.id} value={plan.slug}>{isArabic ? plan.name_ar : plan.name_en}</option>
                              ))}
                            </select>
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={draft.status}
                                onChange={(e) =>
                                  setTenantDrafts((prev) => ({
                                    ...prev,
                                    [row.tenant_id]: { ...draft, status: e.target.value as SubscriptionStatus },
                                  }))
                                }
                                className="rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-950"
                              >
                                {SUBSCRIPTION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                              </select>
                              <input
                                type="number"
                                min={1}
                                value={draft.durationDays}
                                onChange={(e) =>
                                  setTenantDrafts((prev) => ({
                                    ...prev,
                                    [row.tenant_id]: { ...draft, durationDays: e.target.value },
                                  }))
                                }
                                className="rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-950"
                              />
                            </div>
                            <button
                              className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                              onClick={() => void applyTenantPlan(row.tenant_id)}
                              disabled={applyingTenantId === row.tenant_id}
                            >
                              {applyingTenantId === row.tenant_id ? '...' : labels.apply}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <button className="rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-40 dark:border-slate-600" onClick={() => setTenantPage((prev) => Math.max(1, prev - 1))} disabled={tenantPage === 1}>
              {'<'}
            </button>
            <span>{tenantPage} / {tenantPages}</span>
            <button className="rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-40 dark:border-slate-600" onClick={() => setTenantPage((prev) => Math.min(tenantPages, prev + 1))} disabled={tenantPage >= tenantPages}>
              {'>'}
            </button>
          </div>
        </section>
      ) : null}

      {tab === 'plans' ? (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[300px,1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <button className="mb-3 w-full rounded-xl border border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-700 dark:border-indigo-700 dark:text-indigo-300" onClick={() => setPlanDraft(emptyPlanDraft())}>
              {isArabic ? 'باقة جديدة' : 'New Plan'}
            </button>
            <div className="space-y-2">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${planDraft.id === plan.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-slate-200 dark:border-slate-700'}`}
                  onClick={() =>
                    setPlanDraft({
                      id: plan.id,
                      slug: plan.slug,
                      nameAr: plan.name_ar,
                      nameEn: plan.name_en,
                      maxUsers: plan.max_users == null ? '' : String(plan.max_users),
                      maxPatients: plan.max_patients == null ? '' : String(plan.max_patients),
                      maxClinics: plan.max_clinics == null ? '' : String(plan.max_clinics),
                      maxBranches: plan.max_branches == null ? '' : String(plan.max_branches),
                      isActive: plan.is_active,
                      isTrial: plan.is_trial,
                      packagePermissions: plan.package_permissions,
                    })
                  }
                >
                  <p className="font-semibold">{isArabic ? plan.name_ar : plan.name_en}</p>
                  <p className="text-xs text-slate-500">{plan.slug}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{isArabic ? 'معرّف الباقة (Slug)' : 'Plan Slug'}</label>
                <input value={planDraft.slug} onChange={(e) => setPlanDraft((p) => ({ ...p, slug: e.target.value }))} placeholder={isArabic ? 'مثال: basic' : 'e.g. basic'} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{isArabic ? 'اسم الباقة (EN)' : 'Plan Name (EN)'}</label>
                <input value={planDraft.nameEn} onChange={(e) => setPlanDraft((p) => ({ ...p, nameEn: e.target.value }))} placeholder="Name (EN)" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{isArabic ? 'اسم الباقة (AR)' : 'Plan Name (AR)'}</label>
                <input value={planDraft.nameAr} onChange={(e) => setPlanDraft((p) => ({ ...p, nameAr: e.target.value }))} placeholder="Name (AR)" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{isArabic ? 'الحد الأقصى للمستخدمين' : 'Max Users'}</label>
                <input value={planDraft.maxUsers} onChange={(e) => setPlanDraft((p) => ({ ...p, maxUsers: e.target.value }))} placeholder={isArabic ? 'عدد المستخدمين' : 'Users count'} type="number" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{isArabic ? 'الحد الأقصى للمرضى' : 'Max Patients'}</label>
                <input value={planDraft.maxPatients} onChange={(e) => setPlanDraft((p) => ({ ...p, maxPatients: e.target.value }))} placeholder={isArabic ? 'عدد المرضى' : 'Patients count'} type="number" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{isArabic ? 'الحد الأقصى للعيادات' : 'Max Clinics'}</label>
                <input value={planDraft.maxClinics} onChange={(e) => setPlanDraft((p) => ({ ...p, maxClinics: e.target.value }))} placeholder={isArabic ? 'عدد العيادات' : 'Clinics count'} type="number" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{isArabic ? 'الحد الأقصى للفروع' : 'Max Branches'}</label>
                <input value={planDraft.maxBranches} onChange={(e) => setPlanDraft((p) => ({ ...p, maxBranches: e.target.value }))} placeholder={isArabic ? 'عدد الفروع' : 'Branches count'} type="number" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
              </div>
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={planDraft.isActive} onChange={(e) => setPlanDraft((p) => ({ ...p, isActive: e.target.checked }))} />{isArabic ? 'مفعلة' : 'Active'}</label>
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={planDraft.isTrial} onChange={(e) => setPlanDraft((p) => ({ ...p, isTrial: e.target.checked }))} />{isArabic ? 'تجريبية' : 'Trial'}</label>
            </div>
            <PermissionChecklist
              selected={planDraft.packagePermissions}
              onToggle={(permission) =>
                setPlanDraft((previous) => {
                  const exists = previous.packagePermissions.includes(permission);
                  return {
                    ...previous,
                    packagePermissions: exists
                      ? previous.packagePermissions.filter((entry) => entry !== permission)
                      : [...previous.packagePermissions, permission],
                  };
                })
              }
            />
            <div className="flex justify-end">
              <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={() => void savePlan()} disabled={savingPlan}>
                {savingPlan ? '...' : labels.save}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'users' ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
            <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder={isArabic ? 'بحث بالمستخدم' : 'Search user'} className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" />
            <select value={userRole} onChange={(e) => setUserRole(e.target.value as 'ALL' | UserRole)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"><option value="ALL">ALL</option>{Object.values(UserRole).map((role) => <option key={role} value={role}>{role}</option>)}</select>
            <select value={userStatus} onChange={(e) => setUserStatus(e.target.value as 'ALL' | UserStatus)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"><option value="ALL">ALL</option>{Object.values(UserStatus).map((status) => <option key={status} value={status}>{status}</option>)}</select>
            <button className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200" onClick={() => void loadUsers()}>{labels.refresh}</button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">User</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Tenant</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Role</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {usersLoading ? (
                  <tr><td colSpan={5} className="px-2 py-8 text-center text-sm text-slate-500">{labels.loading}</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="px-2 py-8 text-center text-sm text-slate-500">{labels.noData}</td></tr>
                ) : (
                  users.map((row) => (
                    <tr key={row.id}>
                      <td className="px-2 py-2 text-sm">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{row.username}</p>
                        <p className="text-xs text-slate-500">{row.email || '-'}</p>
                      </td>
                      <td className="px-2 py-2 text-sm">{row.tenant_name || '-'}</td>
                      <td className="px-2 py-2 text-sm">{row.role}</td>
                      <td className="px-2 py-2 text-sm">{row.status}</td>
                      <td className="px-2 py-2">
                        <button className="rounded-lg border border-indigo-300 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-700 dark:text-indigo-300" onClick={() => setUserDraft({ id: row.id, username: row.username, role: row.role, status: row.status, tenantId: row.tenant_id || '', overridePermissions: row.override_permissions, customPermissions: row.custom_permissions })}>
                          {isArabic ? 'تعديل' : 'Edit'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <button className="rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-40 dark:border-slate-600" onClick={() => setUserPage((prev) => Math.max(1, prev - 1))} disabled={userPage === 1}>{'<'}</button>
            <span>{userPage} / {userPages}</span>
            <button className="rounded-lg border border-slate-300 px-3 py-1 disabled:opacity-40 dark:border-slate-600" onClick={() => setUserPage((prev) => Math.min(userPages, prev + 1))} disabled={userPage >= userPages}>{'>'}</button>
          </div>

          {userDraft ? (
            <div className="space-y-3 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-800 dark:bg-indigo-900/10">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                <input value={userDraft.username} onChange={(e) => setUserDraft((prev) => (prev ? { ...prev, username: e.target.value } : prev))} className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" placeholder="Username" />
                <select value={userDraft.role} onChange={(e) => setUserDraft((prev) => (prev ? { ...prev, role: e.target.value as UserRole } : prev))} className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950">{Object.values(UserRole).map((role) => <option key={role} value={role}>{role}</option>)}</select>
                <select value={userDraft.status} onChange={(e) => setUserDraft((prev) => (prev ? { ...prev, status: e.target.value as UserStatus } : prev))} className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950">{Object.values(UserStatus).map((status) => <option key={status} value={status}>{status}</option>)}</select>
                <input value={userDraft.tenantId} onChange={(e) => setUserDraft((prev) => (prev ? { ...prev, tenantId: e.target.value } : prev))} className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950" placeholder="Tenant UUID" />
              </div>
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={userDraft.overridePermissions} onChange={(e) => setUserDraft((prev) => (prev ? { ...prev, overridePermissions: e.target.checked } : prev))} />Override permissions</label>
              <PermissionChecklist
                selected={userDraft.customPermissions}
                onToggle={(permission) =>
                  setUserDraft((prev) => {
                    if (!prev) return prev;
                    const exists = prev.customPermissions.includes(permission);
                    return {
                      ...prev,
                      customPermissions: exists
                        ? prev.customPermissions.filter((entry) => entry !== permission)
                        : [...prev.customPermissions, permission],
                    };
                  })
                }
              />
              <div className="flex justify-end gap-2">
                <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-600" onClick={() => setUserDraft(null)}>{isArabic ? 'إلغاء' : 'Cancel'}</button>
                <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={() => void saveUser()} disabled={savingUser}>{savingUser ? '...' : labels.save}</button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
};

export default PlatformOwnerControlCenter;

const PermissionChecklist: React.FC<{
  selected: Permission[];
  onToggle: (permission: Permission) => void;
}> = ({ selected, onToggle }) => (
  <div className="max-h-[260px] overflow-y-auto rounded-xl border border-slate-200 p-3 dark:border-slate-700">
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
      {ALL_PERMISSIONS.map((permission) => (
        <label key={permission} className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" checked={selected.includes(permission)} onChange={() => onToggle(permission)} />
          {permission}
        </label>
      ))}
    </div>
  </div>
);
