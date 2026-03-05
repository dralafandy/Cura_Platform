import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../hooks/useI18n';
import { supabase } from '../supabaseClient';

type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED' | 'UNKNOWN';

type TenantSnapshot = {
  tenantName: string;
  plan: string;
  status: SubscriptionStatus;
  trialStartDate?: string | null;
  trialEndDate?: string | null;
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  maxUsers?: number | null;
  maxPatients?: number | null;
  currentUsers?: number | null;
  currentPatients?: number | null;
  trialDaysRemaining?: number | null;
  isSubscriptionValid?: boolean | null;
};

type PlanOption = {
  slug: string;
  name: string;
  isTrial: boolean;
};

const SubscriptionOverviewPage: React.FC = () => {
  const { locale } = useI18n();
  const { userProfile, currentClinic } = useAuth();
  const isArabic = locale === 'ar';
  const isPlatformOwner = String(userProfile?.email || '').trim().toLowerCase() === 'dralafandy@gmail.com';

  const labels = useMemo(
    () =>
      isArabic
        ? {
            title: 'الاشتراك والباقات',
            subtitle: 'بيانات حقيقية مباشرة من قاعدة البيانات لحالة الاشتراك الحالية.',
            loading: 'جاري تحميل بيانات الاشتراك...',
            failedToLoad: 'تعذر تحميل بيانات الاشتراك الفعلية.',
            noTenant:
              'لا يمكن عرض بيانات الاشتراك لأن الحساب الحالي غير مربوط بـ Tenant. يرجى ربط tenant_id في user_profiles أو clinics.',
            tenant: 'المنشأة',
            plan: 'الباقة',
            status: 'الحالة',
            trialStart: 'بداية التجربة',
            trialEnd: 'نهاية التجربة',
            subscriptionStart: 'بداية الاشتراك',
            subscriptionEnd: 'نهاية الاشتراك',
            daysRemaining: 'المدة المتبقية',
            usersLimit: 'حد المستخدمين',
            patientsLimit: 'حد المرضى',
            usage: 'الاستهلاك الحالي',
            users: 'مستخدمون',
            patients: 'مرضى',
            notAvailable: 'غير متاح',
            unlimited: 'غير محدود',
            day: 'يوم',
            expired: 'منتهي',
            contactTitle: 'الدعم والتجديد',
            contactBody: 'عند قرب انتهاء الاشتراك يمكنك التواصل مع فريق الدعم للتجديد.',
            contactPhone: 'الهاتف: +20 100 000 0000',
            contactEmail: 'البريد: billing@curasoft.app',
            contactAction: 'طلب تواصل (قريبا)',
            statusMap: {
              TRIAL: 'تجريبي',
              ACTIVE: 'نشط',
              SUSPENDED: 'موقوف',
              CANCELLED: 'ملغي',
              EXPIRED: 'منتهي',
              UNKNOWN: 'غير معروف',
            } as Record<SubscriptionStatus, string>,
            planMap: {
              trial: 'تجريبي',
              starter: 'المبتدئة',
              professional: 'الاحترافية',
              enterprise: 'المؤسسية',
            } as Record<string, string>,
          }
        : {
            title: 'Subscription Overview',
            subtitle: 'Live subscription data directly from the database.',
            loading: 'Loading subscription data...',
            failedToLoad: 'Failed to load live subscription data.',
            noTenant:
              'Cannot show subscription details because this account is not linked to a tenant. Please set tenant_id in user_profiles or clinics.',
            tenant: 'Tenant',
            plan: 'Plan',
            status: 'Status',
            trialStart: 'Trial Start',
            trialEnd: 'Trial End',
            subscriptionStart: 'Subscription Start',
            subscriptionEnd: 'Subscription End',
            daysRemaining: 'Days Remaining',
            usersLimit: 'Users Limit',
            patientsLimit: 'Patients Limit',
            usage: 'Current Usage',
            users: 'Users',
            patients: 'Patients',
            notAvailable: 'Not available',
            unlimited: 'Unlimited',
            day: 'day',
            expired: 'Expired',
            contactTitle: 'Support & Renewal',
            contactBody: 'When your subscription is close to ending, contact support for renewal.',
            contactPhone: 'Phone: +20 100 000 0000',
            contactEmail: 'Email: billing@curasoft.app',
            contactAction: 'Request Contact (Soon)',
            statusMap: {
              TRIAL: 'Trial',
              ACTIVE: 'Active',
              SUSPENDED: 'Suspended',
              CANCELLED: 'Cancelled',
              EXPIRED: 'Expired',
              UNKNOWN: 'Unknown',
            } as Record<SubscriptionStatus, string>,
            planMap: {
              trial: 'Trial',
              starter: 'Starter',
              professional: 'Professional',
              enterprise: 'Enterprise',
            } as Record<string, string>,
          },
    [isArabic]
  );

  const planUi = useMemo(
    () =>
      isArabic
        ? {
            title: 'تغيير الخطة',
            hint: 'اختر خطة وطبّقها على Tenant الحالي. يمكنك كتابة بريد مستخدم لاستهداف Tenant الخاص به بدون عرض قائمة المستخدمين.',
            selectPlan: 'الخطة',
            targetEmail: 'بريد مستخدم (اختياري)',
            targetEmailPlaceholder: 'user@example.com',
            apply: 'تطبيق الخطة',
            applying: 'جارٍ التطبيق...',
            noPlan: 'اختر خطة أولًا.',
            noEmailTenant: 'لا يوجد Tenant متاح لهذا البريد.',
            success: 'تم تحديث الخطة بنجاح.',
            failed: 'فشل تحديث الخطة.',
          }
        : {
            title: 'Change Plan',
            hint: 'Select a plan and apply it to the current tenant. You can enter a user email to target that tenant without listing platform users.',
            selectPlan: 'Plan',
            targetEmail: 'User Email (Optional)',
            targetEmailPlaceholder: 'user@example.com',
            apply: 'Apply Plan',
            applying: 'Applying...',
            noPlan: 'Please select a plan first.',
            noEmailTenant: 'No accessible tenant found for this email.',
            success: 'Plan updated successfully.',
            failed: 'Failed to update plan.',
          },
    [isArabic]
  );

  const [snapshot, setSnapshot] = useState<TenantSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resolvedTenantId, setResolvedTenantId] = useState<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<PlanOption[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [targetEmail, setTargetEmail] = useState<string>('');
  const [isApplyingPlan, setIsApplyingPlan] = useState(false);
  const [planActionError, setPlanActionError] = useState<string | null>(null);
  const [planActionSuccess, setPlanActionSuccess] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const extractTenantId = useCallback((payload: unknown): string | null => {
    if (!payload) return null;
    if (typeof payload === 'string') {
      const trimmed = payload.trim();
      return trimmed || null;
    }
    if (Array.isArray(payload)) {
      for (const item of payload) {
        const fromArray = extractTenantId(item);
        if (fromArray) return fromArray;
      }
      return null;
    }
    if (typeof payload === 'object') {
      const obj = payload as Record<string, unknown>;
      for (const key of ['tenant_id', 'current_user_tenant_id', 'clinic_tenant_id']) {
        const value = obj[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
      }
    }
    return null;
  }, []);

  const linkTenantContext = useCallback(
    async (preferredTenantId?: string | null): Promise<string | null> => {
      if (!supabase) return null;
      try {
        const { data, error } = await supabase.rpc('link_current_user_tenant_context', {
          p_preferred_tenant_id: preferredTenantId ?? null,
        });
        if (error) return null;
        return extractTenantId(data);
      } catch {
        return null;
      }
    },
    [extractTenantId]
  );

  const resolveTenantId = useCallback(async (): Promise<string | null> => {
    if (!supabase || !userProfile?.id) return null;

    try {
      const profileById = await supabase
        .from('user_profiles')
        .select('tenant_id, user_id')
        .eq('id', userProfile.id)
        .maybeSingle();

      let tenantId = extractTenantId(profileById.data);
      const profileUserId = (profileById.data as any)?.user_id as string | undefined;

      if (!tenantId && profileUserId) {
        const usersByProfileUserId = await supabase
          .from('users')
          .select('tenant_id')
          .eq('id', profileUserId)
          .maybeSingle();
        tenantId = extractTenantId(usersByProfileUserId.data);
      }

      if (!tenantId && userProfile.auth_id) {
        const profileByAuth = await supabase
          .from('user_profiles')
          .select('tenant_id, user_id')
          .eq('auth_id', userProfile.auth_id)
          .maybeSingle();

        tenantId = extractTenantId(profileByAuth.data);
        const profileAuthUserId = (profileByAuth.data as any)?.user_id as string | undefined;

        if (!tenantId && profileAuthUserId) {
          const usersByAuthUserId = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', profileAuthUserId)
            .maybeSingle();
          tenantId = extractTenantId(usersByAuthUserId.data);
        }
      }

      if (!tenantId) {
        const fromRpc = await supabase.rpc('current_user_tenant_id');
        tenantId = extractTenantId(fromRpc.data);
      }

      if (!tenantId && currentClinic?.id) {
        const fromClinicRpc = await supabase.rpc('clinic_tenant_id', { p_clinic_id: currentClinic.id });
        tenantId = extractTenantId(fromClinicRpc.data);
      }

      if (!tenantId && currentClinic?.id) {
        const fromClinicRow = await supabase.from('clinics').select('tenant_id').eq('id', currentClinic.id).maybeSingle();
        tenantId = extractTenantId(fromClinicRow.data);
      }

      if (tenantId) {
        const linkedTenantId = await linkTenantContext(tenantId);
        return linkedTenantId || tenantId;
      }

      return await linkTenantContext(null);
    } catch {
      return null;
    }
  }, [currentClinic?.id, extractTenantId, linkTenantContext, userProfile?.auth_id, userProfile?.id]);

  const toDaysRemaining = useCallback((dateText?: string | null): number | null => {
    if (!dateText) return null;
    const end = new Date(`${dateText}T00:00:00`);
    if (Number.isNaN(end.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = end.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, []);

  const formatDateValue = useCallback(
    (value?: string | null): string => {
      if (!value) return labels.notAvailable;
      const parsed = new Date(`${value}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) return value;
      return parsed.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    },
    [labels.notAvailable, locale]
  );

  const formatPlanName = useCallback(
    (plan?: string): string => {
      if (!plan) return labels.notAvailable;
      const normalized = plan.trim().toLowerCase();
      if (labels.planMap[normalized]) return labels.planMap[normalized];
      return normalized.replace(/[_-]+/g, ' ');
    },
    [labels.notAvailable, labels.planMap]
  );

  const loadPlans = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('slug, name_en, name_ar, is_trial, is_active, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error || !Array.isArray(data)) return;

    const options = data
      .map((row: any) => ({
        slug: String(row.slug || '').trim().toLowerCase(),
        name: String(row.name_en || row.name_ar || row.slug || '').trim(),
        isTrial: row.is_trial === true,
      }))
      .filter((plan: PlanOption) => plan.slug.length > 0 && !plan.isTrial);

    setAvailablePlans(options);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSubscription = async () => {
      setIsLoading(true);
      setLoadError(null);
      setSnapshot(null);

      if (!supabase || !userProfile?.id) {
        if (isMounted) {
          setLoadError(labels.failedToLoad);
          setIsLoading(false);
          setResolvedTenantId(null);
        }
        return;
      }

      const tenantId = await resolveTenantId();
      if (!tenantId) {
        if (isMounted) {
          setLoadError(labels.noTenant);
          setIsLoading(false);
          setResolvedTenantId(null);
        }
        return;
      }
      if (isMounted) {
        setResolvedTenantId(tenantId);
      }

      try {
        const [tenantResponse, tenantInfoResponse] = await Promise.all([
          supabase
            .from('tenants')
            .select(
              'name, subscription_status, subscription_plan, trial_start_date, trial_end_date, subscription_start_date, subscription_end_date, max_users, max_patients'
            )
            .eq('id', tenantId)
            .maybeSingle(),
          supabase.rpc('get_tenant_info', { p_tenant_id: tenantId }),
        ]);

        if (tenantResponse.error || !tenantResponse.data) {
          if (isMounted) {
            setLoadError(labels.failedToLoad);
            setIsLoading(false);
          }
          return;
        }

        const tenant = tenantResponse.data as any;
        const rpcPayload = Array.isArray(tenantInfoResponse.data)
          ? tenantInfoResponse.data[0]
          : tenantInfoResponse.data;

        const normalizedStatus = String(tenant.subscription_status || 'UNKNOWN').toUpperCase();
        const status: SubscriptionStatus = ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED'].includes(
          normalizedStatus
        )
          ? (normalizedStatus as SubscriptionStatus)
          : 'UNKNOWN';

        const nextSnapshot: TenantSnapshot = {
          tenantName: tenant.name || currentClinic?.name || labels.notAvailable,
          plan: tenant.subscription_plan || 'trial',
          status,
          trialStartDate: tenant.trial_start_date,
          trialEndDate: tenant.trial_end_date,
          subscriptionStartDate: tenant.subscription_start_date,
          subscriptionEndDate: tenant.subscription_end_date,
          maxUsers: tenant.max_users ?? null,
          maxPatients: tenant.max_patients ?? null,
          currentUsers: typeof rpcPayload?.current_users === 'number' ? rpcPayload.current_users : null,
          currentPatients: typeof rpcPayload?.current_patients === 'number' ? rpcPayload.current_patients : null,
          trialDaysRemaining: typeof rpcPayload?.trial_days_remaining === 'number' ? rpcPayload.trial_days_remaining : null,
          isSubscriptionValid: typeof rpcPayload?.is_subscription_valid === 'boolean' ? rpcPayload.is_subscription_valid : null,
        };

        if (isMounted) {
          setSnapshot(nextSnapshot);
        }
      } catch {
        if (isMounted) {
          setLoadError(labels.failedToLoad);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSubscription();
    return () => {
      isMounted = false;
    };
  }, [currentClinic?.name, labels.failedToLoad, labels.noTenant, labels.notAvailable, refreshTick, resolveTenantId, userProfile?.id]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    if (availablePlans.length === 0) {
      setSelectedPlan('');
      return;
    }

    if (selectedPlan && availablePlans.some((plan) => plan.slug === selectedPlan)) {
      return;
    }

    const fromCurrent = snapshot?.plan
      ? availablePlans.find((plan) => plan.slug === String(snapshot.plan).toLowerCase())
      : null;
    setSelectedPlan(fromCurrent?.slug || availablePlans[0].slug);
  }, [availablePlans, selectedPlan, snapshot?.plan]);

  const handleApplyPlan = useCallback(async () => {
    if (!supabase || !resolvedTenantId) return;
    if (!selectedPlan) {
      setPlanActionError(planUi.noPlan);
      setPlanActionSuccess(null);
      return;
    }

    setIsApplyingPlan(true);
    setPlanActionError(null);
    setPlanActionSuccess(null);

    try {
      let targetTenantId = resolvedTenantId;
      const normalizedEmail = targetEmail.trim().toLowerCase();

      if (normalizedEmail) {
        const { data, error } = await supabase.rpc('platform_owner_activate_subscription_by_email', {
          p_user_email: normalizedEmail,
          p_plan_slug: selectedPlan,
        });
        if (error) throw error;
        if (!data) throw new Error(planUi.noEmailTenant);
      } else {
        const { data, error } = await supabase.rpc('activate_subscription', {
          p_tenant_id: targetTenantId,
          p_plan_slug: selectedPlan,
        });
        if (error) throw error;
        if (data !== true) throw new Error(planUi.failed);
      }

      setPlanActionSuccess(planUi.success);
      setRefreshTick((prev) => prev + 1);
    } catch (error: any) {
      setPlanActionError(error?.message || planUi.failed);
      setPlanActionSuccess(null);
    } finally {
      setIsApplyingPlan(false);
    }
  }, [planUi.failed, planUi.noEmailTenant, planUi.noPlan, planUi.success, resolvedTenantId, selectedPlan, targetEmail]);

  const statusTone = useMemo(() => {
    switch (snapshot?.status) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'TRIAL':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
      case 'SUSPENDED':
      case 'CANCELLED':
      case 'EXPIRED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  }, [snapshot?.status]);

  const daysRemaining = useMemo(() => {
    if (!snapshot) return null;
    if (snapshot.status === 'TRIAL') {
      if (typeof snapshot.trialDaysRemaining === 'number') return snapshot.trialDaysRemaining;
      return toDaysRemaining(snapshot.trialEndDate);
    }
    if (snapshot.status === 'ACTIVE') {
      return toDaysRemaining(snapshot.subscriptionEndDate);
    }
    return null;
  }, [snapshot, toDaysRemaining]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
        <p className="text-slate-600 dark:text-slate-300">{labels.loading}</p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
        <p className="text-red-700 dark:text-red-300">{loadError || labels.failedToLoad}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-indigo-200/70 dark:border-indigo-700/60 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{labels.title}</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{labels.subtitle}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}>
            {labels.statusMap[snapshot.status]}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <InfoCard label={labels.tenant} value={snapshot.tenantName || labels.notAvailable} />
          <InfoCard label={labels.plan} value={formatPlanName(snapshot.plan)} />
          <InfoCard
            label={labels.daysRemaining}
            value={
              daysRemaining == null
                ? labels.notAvailable
                : daysRemaining < 0
                ? labels.expired
                : `${daysRemaining} ${labels.day}`
            }
          />
          <InfoCard
            label={labels.status}
            value={
              snapshot.isSubscriptionValid == null
                ? labels.statusMap[snapshot.status]
                : snapshot.isSubscriptionValid
                ? labels.statusMap[snapshot.status]
                : labels.expired
            }
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">{labels.plan}</h2>
          <div className="space-y-3 text-sm">
            <Row label={labels.trialStart} value={formatDateValue(snapshot.trialStartDate)} />
            <Row label={labels.trialEnd} value={formatDateValue(snapshot.trialEndDate)} />
            <Row label={labels.subscriptionStart} value={formatDateValue(snapshot.subscriptionStartDate)} />
            <Row
              label={labels.subscriptionEnd}
              value={snapshot.subscriptionEndDate ? formatDateValue(snapshot.subscriptionEndDate) : labels.unlimited}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">{labels.usage}</h2>
          <div className="space-y-3 text-sm">
            <Row
              label={labels.usersLimit}
              value={snapshot.maxUsers != null ? String(snapshot.maxUsers) : labels.notAvailable}
            />
            <Row
              label={labels.patientsLimit}
              value={snapshot.maxPatients != null ? String(snapshot.maxPatients) : labels.notAvailable}
            />
            <Row
              label={labels.users}
              value={snapshot.currentUsers != null ? String(snapshot.currentUsers) : labels.notAvailable}
            />
            <Row
              label={labels.patients}
              value={snapshot.currentPatients != null ? String(snapshot.currentPatients) : labels.notAvailable}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 p-5">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{labels.contactTitle}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{labels.contactBody}</p>
        <div className="mt-4 space-y-1 text-sm text-slate-700 dark:text-slate-200">
          <p>{labels.contactPhone}</p>
          <p>{labels.contactEmail}</p>
        </div>
        <button
          type="button"
          disabled
          className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300 cursor-not-allowed"
        >
          {labels.contactAction}
        </button>
      </section>

      {isPlatformOwner ? (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{planUi.title}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{planUi.hint}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500 dark:text-slate-400">{planUi.selectPlan}</label>
              <select
                value={selectedPlan}
                onChange={(event) => setSelectedPlan(event.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              >
                <option value="">{planUi.selectPlan}</option>
                {availablePlans.map((plan) => (
                  <option key={plan.slug} value={plan.slug}>
                    {plan.name}
                    {plan.isTrial ? ' (Trial)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-500 dark:text-slate-400">{planUi.targetEmail}</label>
              <input
                type="email"
                value={targetEmail}
                onChange={(event) => setTargetEmail(event.target.value)}
                placeholder={planUi.targetEmailPlaceholder}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {planActionError ? <p className="text-sm text-red-600 dark:text-red-300">{planActionError}</p> : null}
          {planActionSuccess ? <p className="text-sm text-emerald-600 dark:text-emerald-300">{planActionSuccess}</p> : null}

          <button
            type="button"
            onClick={() => void handleApplyPlan()}
            disabled={isApplyingPlan || !resolvedTenantId}
            className="rounded-xl px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isApplyingPlan ? planUi.applying : planUi.apply}
          </button>
        </section>
      ) : null}
    </div>
  );
};

const InfoCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 p-4">
    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
  </div>
);

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-2 last:border-b-0 last:pb-0">
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span className="font-medium text-slate-800 dark:text-slate-100">{value}</span>
  </div>
);

export default SubscriptionOverviewPage;
