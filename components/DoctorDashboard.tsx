import React, { useMemo, useState } from 'react';
import { ClinicData } from '../hooks/useClinicData';
import { AppointmentStatus, View } from '../types';
import { useI18n } from '../hooks/useI18n';

interface DoctorDashboardProps {
  clinicData: ClinicData;
  doctorId: string;
  setCurrentView: (view: View) => void;
}

type DateRangeKey = 'today' | '7d' | '30d' | 'all';
type FeedTab = 'appointments' | 'treatments';

const RANGE_OPTIONS: Array<{ key: DateRangeKey }> = [
  { key: 'today' },
  { key: '7d' },
  { key: '30d' },
  { key: 'all' },
];

const STATUS_FILTERS: Array<{ key: 'all' | AppointmentStatus }> = [
  { key: 'all' },
  { key: AppointmentStatus.SCHEDULED },
  { key: AppointmentStatus.CONFIRMED },
  { key: AppointmentStatus.COMPLETED },
  { key: AppointmentStatus.CANCELLED },
];

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ clinicData, doctorId, setCurrentView }) => {
  const { locale, t } = useI18n();
  const [range, setRange] = useState<DateRangeKey>('30d');
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [feedTab, setFeedTab] = useState<FeedTab>('appointments');

  const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });

  const doctor = useMemo(
    () => clinicData.dentists.find(d => d.id === doctorId),
    [clinicData.dentists, doctorId]
  );

  const doctorAppointments = useMemo(
    () => clinicData.appointments.filter(a => a.dentistId === doctorId),
    [clinicData.appointments, doctorId]
  );

  const doctorTreatments = useMemo(
    () => clinicData.treatmentRecords.filter(tr => tr.dentistId === doctorId),
    [clinicData.treatmentRecords, doctorId]
  );

  const doctorPrescriptions = useMemo(
    () => clinicData.prescriptions.filter(p => p.dentistId === doctorId),
    [clinicData.prescriptions, doctorId]
  );

  const doctorPayments = useMemo(
    () => clinicData.doctorPayments.filter(p => p.dentistId === doctorId),
    [clinicData.doctorPayments, doctorId]
  );

  const getRangeStart = (currentRange: DateRangeKey): Date | null => {
    const now = new Date();
    if (currentRange === 'all') return null;
    if (currentRange === 'today') {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    if (currentRange === '7d') {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    }
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
  };

  const rangeStart = useMemo(() => getRangeStart(range), [range]);

  const inRange = (date: Date | string): boolean => {
    const parsed = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(parsed.getTime())) return false;
    if (!rangeStart) return true;
    return parsed >= rangeStart;
  };

  const filteredAppointments = useMemo(() => {
    return doctorAppointments.filter(a => inRange(a.startTime));
  }, [doctorAppointments, rangeStart]);

  const filteredTreatments = useMemo(() => {
    return doctorTreatments.filter(tr => inRange(tr.treatmentDate));
  }, [doctorTreatments, rangeStart]);

  const filteredPrescriptions = useMemo(() => {
    return doctorPrescriptions.filter(p => inRange(p.prescriptionDate));
  }, [doctorPrescriptions, rangeStart]);

  const now = new Date();
  const upcomingAppointments = useMemo(() => {
    return doctorAppointments
      .filter(a => a.startTime > now)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [doctorAppointments, now]);

  const todayAppointments = useMemo(() => {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return doctorAppointments
      .filter(a => a.startTime >= start && a.startTime <= end)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [doctorAppointments, now]);

  const totalEarnings = useMemo(
    () => doctorTreatments.reduce((sum, tr) => sum + (Number(tr.doctorShare) || 0), 0),
    [doctorTreatments]
  );

  const totalPaid = useMemo(
    () => doctorPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [doctorPayments]
  );

  const rangeEarnings = useMemo(
    () => filteredTreatments.reduce((sum, tr) => sum + (Number(tr.doctorShare) || 0), 0),
    [filteredTreatments]
  );

  const rangePaid = useMemo(
    () => doctorPayments.filter(p => inRange(p.date)).reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [doctorPayments, rangeStart]
  );

  const netBalance = totalEarnings - totalPaid;
  const rangeNet = rangeEarnings - rangePaid;

  const rangeTreatedPatientIds = useMemo(
    () => Array.from(new Set(filteredTreatments.map(tr => tr.patientId))),
    [filteredTreatments]
  );

  const statusCounts = useMemo(() => {
    const base = {
      [AppointmentStatus.SCHEDULED]: 0,
      [AppointmentStatus.CONFIRMED]: 0,
      [AppointmentStatus.COMPLETED]: 0,
      [AppointmentStatus.CANCELLED]: 0,
    };
    filteredAppointments.forEach(a => {
      base[a.status] += 1;
    });
    return base;
  }, [filteredAppointments]);

  const completionRate = useMemo(() => {
    const denominator = filteredAppointments.length || 1;
    return Math.round((statusCounts[AppointmentStatus.COMPLETED] / denominator) * 100);
  }, [filteredAppointments.length, statusCounts]);

  const appointmentFeed = useMemo(() => {
    let list = [...filteredAppointments].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    if (statusFilter !== 'all') {
      list = list.filter(a => a.status === statusFilter);
    }
    return list.slice(0, 12);
  }, [filteredAppointments, statusFilter]);

  const treatmentFeed = useMemo(() => {
    return [...filteredTreatments]
      .sort((a, b) => new Date(b.treatmentDate).getTime() - new Date(a.treatmentDate).getTime())
      .slice(0, 12);
  }, [filteredTreatments]);

  const topTreatments = useMemo(() => {
    const countByTreatment: Record<string, number> = {};
    filteredTreatments.forEach(tr => {
      const def = clinicData.treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
      const key = def?.name || (t('common.unknownTreatment') || 'علاج غير معروف');
      countByTreatment[key] = (countByTreatment[key] || 0) + 1;
    });
    return Object.entries(countByTreatment)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredTreatments, clinicData.treatmentDefinitions]);

  const monthlyEarnings = useMemo(() => {
    const nowDate = new Date();
    const buckets: Array<{ month: string; value: number }> = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
      buckets.push({
        month: d.toLocaleDateString(locale, { month: 'short' }),
        value: 0,
      });
    }
    doctorTreatments.forEach(tr => {
      const d = new Date(tr.treatmentDate);
      const idx = buckets.findIndex(
        (_, i) => {
          const monthDate = new Date(nowDate.getFullYear(), nowDate.getMonth() - (5 - i), 1);
          return d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear();
        }
      );
      if (idx !== -1) {
        buckets[idx].value += Number(tr.doctorShare) || 0;
      }
    });
    return buckets;
  }, [doctorTreatments, locale]);

  const monthlyPeak = useMemo(() => {
    return Math.max(1, ...monthlyEarnings.map(m => m.value));
  }, [monthlyEarnings]);

  const recentActivity = useMemo(() => {
    const events: Array<{ id: string; kind: 'appointment' | 'treatment' | 'prescription'; date: Date; label: string }> = [];

    doctorAppointments.forEach(a => {
      if (!inRange(a.startTime)) return;
      const patient = clinicData.patients.find(p => p.id === a.patientId);
      events.push({
        id: `a-${a.id}`,
        kind: 'appointment',
        date: a.startTime,
        label: `${patient?.name || (t('common.unknownPatient') || 'مريض غير معروف')} - ${a.reason}`,
      });
    });

    doctorTreatments.forEach(tr => {
      if (!inRange(tr.treatmentDate)) return;
      const patient = clinicData.patients.find(p => p.id === tr.patientId);
      const def = clinicData.treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
      events.push({
        id: `t-${tr.id}`,
        kind: 'treatment',
        date: new Date(tr.treatmentDate),
        label: `${patient?.name || (t('common.unknownPatient') || 'مريض غير معروف')} - ${def?.name || (t('common.unknownTreatment') || 'علاج')}`,
      });
    });

    doctorPrescriptions.forEach(pr => {
      if (!inRange(pr.prescriptionDate)) return;
      const patient = clinicData.patients.find(p => p.id === pr.patientId);
      events.push({
        id: `p-${pr.id}`,
        kind: 'prescription',
        date: new Date(pr.prescriptionDate),
        label: `${patient?.name || (t('common.unknownPatient') || 'مريض غير معروف')} - ${(t('doctorDashboard.prescription') || 'روشتة')}`,
      });
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  }, [doctorAppointments, doctorTreatments, doctorPrescriptions, clinicData.patients, clinicData.treatmentDefinitions, rangeStart]);

  if (!doctor) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-5">
        {t('doctorDashboard.noLinkedDoctor') || 'لا يوجد ملف طبيب مرتبط بهذا المستخدم.'}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 text-white rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">{doctor.name}</h2>
            <p className="text-white/85">{doctor.specialty}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map(option => (
              <button
                key={option.key}
                onClick={() => setRange(option.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  range === option.key ? 'bg-white text-indigo-700' : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
              >
                {t(`doctorDashboard.range.${option.key}`) || option.key}
              </button>
            ))}
            <button
              onClick={() => setCurrentView('doctor-details')}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-slate-900/25 hover:bg-slate-900/35 transition-colors"
            >
              {t('doctorDashboard.fullDetails') || 'الملف الكامل'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat title={t('doctorDashboard.stats.rangeEarnings') || 'إجمالي أرباح الفترة'} value={currencyFormatter.format(rangeEarnings)} />
        <Stat title={t('doctorDashboard.stats.rangeNet') || 'صافي الفترة'} value={currencyFormatter.format(rangeNet)} />
        <Stat title={t('doctorDashboard.stats.appointments') || 'المواعيد'} value={filteredAppointments.length} />
        <Stat title={t('doctorDashboard.stats.completionRate') || 'معدل الإكمال'} value={`${completionRate}%`} />
        <Stat title={t('doctorDashboard.stats.treatedPatients') || 'المرضى المعالجون'} value={rangeTreatedPatientIds.length} />
        <Stat title={t('doctorDashboard.stats.treatments') || 'العلاجات'} value={filteredTreatments.length} />
        <Stat title={t('doctorDashboard.stats.prescriptions') || 'الروشتات'} value={filteredPrescriptions.length} />
        <Stat title={t('doctorDashboard.stats.totalBalance') || 'الرصيد الإجمالي'} value={currencyFormatter.format(netBalance)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">{t('doctorDashboard.appointmentsPulse') || 'حالة المواعيد'}</h3>
            <div className="flex flex-wrap gap-2">
              <Pill label={`${t('appointmentStatus.SCHEDULED') || 'مجدول'} ${statusCounts[AppointmentStatus.SCHEDULED]}`} />
              <Pill label={`${t('appointmentStatus.CONFIRMED') || 'مؤكد'} ${statusCounts[AppointmentStatus.CONFIRMED]}`} />
              <Pill label={`${t('appointmentStatus.COMPLETED') || 'مكتمل'} ${statusCounts[AppointmentStatus.COMPLETED]}`} />
              <Pill label={`${t('appointmentStatus.CANCELLED') || 'ملغي'} ${statusCounts[AppointmentStatus.CANCELLED]}`} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('doctorDashboard.todayQueue') || 'قائمة اليوم'}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{todayAppointments.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {(t('doctorDashboard.upcomingToday') || 'المتبقي اليوم')}: {todayAppointments.filter(a => a.startTime > now).length}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('doctorDashboard.nextAppointment') || 'الموعد القادم'}</p>
              {upcomingAppointments[0] ? (
                <>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate">
                    {clinicData.patients.find(p => p.id === upcomingAppointments[0].patientId)?.name || (t('common.unknownPatient') || 'مريض غير معروف')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {dateTimeFormatter.format(upcomingAppointments[0].startTime)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('dashboard.noUpcomingAppointments') || 'لا توجد مواعيد قادمة'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">{t('doctorDashboard.topTreatments') || 'أكثر العلاجات تكرارًا'}</h3>
          {topTreatments.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('doctorDashboard.noTreatmentsInRange') || 'لا توجد علاجات ضمن الفترة المحددة.'}</p>
          )}
          <div className="space-y-2">
            {topTreatments.map(item => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">{t('doctorDashboard.earningsTrend6m') || 'اتجاه الأرباح (آخر 6 أشهر)'}</h3>
          <div className="space-y-2">
            {monthlyEarnings.map(m => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="w-10 text-xs text-slate-500 dark:text-slate-400">{m.month}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600"
                    style={{ width: `${Math.max(4, (m.value / monthlyPeak) * 100)}%` }}
                  />
                </div>
                <span className="w-20 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {currencyFormatter.format(m.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900 dark:text-white">{t('doctorDashboard.recentActivity') || 'النشاط الأخير'}</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{recentActivity.length} {t('common.items') || 'عنصر'}</span>
          </div>
          {recentActivity.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('doctorDashboard.noActivityInRange') || 'لا يوجد نشاط ضمن الفترة المحددة.'}</p>
          )}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {recentActivity.map(item => (
              <div key={item.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.label}</p>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="capitalize">{t(`doctorDashboard.kind.${item.kind}`) || item.kind}</span>
                  <span>{dateFormatter.format(item.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setFeedTab('appointments')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                feedTab === 'appointments'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {t('doctorDashboard.appointmentFeed') || 'سجل المواعيد'}
            </button>
            <button
              onClick={() => setFeedTab('treatments')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                feedTab === 'treatments'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              {t('doctorDashboard.treatmentFeed') || 'سجل العلاجات'}
            </button>
          </div>

          {feedTab === 'appointments' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | AppointmentStatus)}
              className="px-3 py-1.5 rounded-lg text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
            >
              {STATUS_FILTERS.map(s => (
                <option key={s.key} value={s.key}>
                  {s.key === 'all' ? (t('common.all') || 'الكل') : (t(`appointmentStatus.${s.key}`) || s.key)}
                </option>
              ))}
            </select>
          )}
        </div>

        {feedTab === 'appointments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {appointmentFeed.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('doctorDashboard.noAppointmentsForFilter') || 'لا توجد مواعيد لهذا الفلتر.'}</p>
            )}
            {appointmentFeed.map(apt => {
              const patient = clinicData.patients.find(p => p.id === apt.patientId);
              return (
                <div key={apt.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/70 dark:border-slate-600/40">
                  <p className="font-semibold text-slate-900 dark:text-white">{patient?.name || (t('common.unknownPatient') || 'مريض غير معروف')}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{dateTimeFormatter.format(apt.startTime)}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 line-clamp-2">{apt.reason}</p>
                  <p className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">{t(`appointmentStatus.${apt.status}`) || apt.status}</p>
                </div>
              );
            })}
          </div>
        )}

        {feedTab === 'treatments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {treatmentFeed.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('doctorDashboard.noTreatmentsForRange') || 'لا توجد علاجات ضمن هذه الفترة.'}</p>
            )}
            {treatmentFeed.map(record => {
              const patient = clinicData.patients.find(p => p.id === record.patientId);
              const treatment = clinicData.treatmentDefinitions.find(td => td.id === record.treatmentDefinitionId);
              return (
                <div key={record.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/70 dark:border-slate-600/40">
                  <p className="font-semibold text-slate-900 dark:text-white">{patient?.name || (t('common.unknownPatient') || 'مريض غير معروف')}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{treatment?.name || (t('common.unknownTreatment') || 'علاج')}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{record.treatmentDate}</p>
                  <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {currencyFormatter.format(record.doctorShare)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionButton label={t('doctorDashboard.openScheduler') || 'فتح الجدول'} onClick={() => setCurrentView('scheduler')} />
        <ActionButton label={t('doctorDashboard.openPatients') || 'فتح المرضى'} onClick={() => setCurrentView('patients')} />
        <ActionButton label={t('doctorDashboard.openDoctorDetails') || 'تفاصيل الطبيب'} onClick={() => setCurrentView('doctor-details')} />
      </div>
    </div>
  );
};

const Stat: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
    <p className="text-xs text-slate-500 dark:text-slate-400">{title}</p>
    <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{value}</p>
  </div>
);

const Pill: React.FC<{ label: string }> = ({ label }) => (
  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold">
    {label}
  </span>
);

const ActionButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700 transition-colors"
  >
    {label}
  </button>
);

export default DoctorDashboard;
