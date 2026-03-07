import React from 'react';
import { useI18n } from '../../hooks/useI18n';
import type { ClinicInfo } from '../../hooks/useClinicData';

interface MetricCard {
  label: string;
  value: string;
  tone?: 'blue' | 'green' | 'amber' | 'violet' | 'rose' | 'slate' | 'cyan' | 'emerald';
}

interface ValueRow {
  label: string;
  value: number;
}

interface PatientRow {
  name: string;
  phone?: string;
  treatments: number;
  totalSpent: number;
  totalPaid: number;
  remaining: number;
  lastVisit?: string;
  visitsCount: number;
  averagePerVisit: number;
}

interface DoctorRow {
  name: string;
  specialty?: string;
  treatments: number;
  patients: number;
  totalRevenue: number;
  doctorRevenue: number;
  completionRate: number;
  avgTreatmentCost: number;
}

interface SupplierRow {
  name: string;
  type?: string;
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  expensesAmount: number;
  lastInvoiceDate?: string;
}

interface AppointmentSummary {
  total: number;
  completed: number;
  scheduled: number;
  confirmed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
  noShowRate: number;
  avgPerDay: number;
  peakHour: string;
}

interface InventorySummary {
  value: number;
  lowStockCount: number;
  expiringCount: number;
  totalItems: number;
  categoriesCount: number;
}

interface LabSummary {
  total: number;
  sent: number;
  received: number;
  fitted: number;
  pending: number;
  totalCost: number;
  avgCostPerCase: number;
}

interface PrintableReportsSummaryProps {
  title: string;
  clinicInfo: ClinicInfo;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  metrics: MetricCard[];
  paymentMethods: ValueRow[];
  expenseCategories: ValueRow[];
  topPatients: PatientRow[];
  topDoctors: DoctorRow[];
  topSuppliers: SupplierRow[];
  appointments: AppointmentSummary;
  inventory: InventorySummary;
  labCases: LabSummary;
}

const toneClasses: Record<NonNullable<MetricCard['tone']>, { bg: string; border: string; text: string; gradient: string }> = {
  blue: { bg: 'from-blue-50 to-cyan-50', border: 'border-blue-200', text: 'text-blue-700', gradient: 'from-blue-500 to-cyan-500' },
  green: { bg: 'from-emerald-50 to-green-50', border: 'border-emerald-200', text: 'text-emerald-700', gradient: 'from-emerald-500 to-green-500' },
  amber: { bg: 'from-amber-50 to-orange-50', border: 'border-amber-200', text: 'text-amber-700', gradient: 'from-amber-500 to-orange-500' },
  violet: { bg: 'from-violet-50 to-purple-50', border: 'border-violet-200', text: 'text-violet-700', gradient: 'from-violet-500 to-purple-500' },
  rose: { bg: 'from-rose-50 to-pink-50', border: 'border-rose-200', text: 'text-rose-700', gradient: 'from-rose-500 to-pink-500' },
  slate: { bg: 'from-slate-50 to-slate-100', border: 'border-slate-200', text: 'text-slate-700', gradient: 'from-slate-500 to-slate-600' },
  cyan: { bg: 'from-cyan-50 to-teal-50', border: 'border-cyan-200', text: 'text-cyan-700', gradient: 'from-cyan-500 to-teal-500' },
  emerald: { bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-200', text: 'text-emerald-700', gradient: 'from-emerald-500 to-teal-500' },
};

const headerGradients: Record<string, string> = {
  patients: 'from-violet-500 to-purple-600',
  doctors: 'from-cyan-500 to-blue-600',
  suppliers: 'from-amber-500 to-orange-600',
  appointments: 'from-emerald-500 to-green-600',
  inventory: 'from-blue-500 to-indigo-600',
  lab: 'from-rose-500 to-pink-600',
  payments: 'from-green-500 to-emerald-600',
  expenses: 'from-red-500 to-rose-600',
};

const PrintableReportsSummary: React.FC<PrintableReportsSummaryProps> = ({
  title,
  clinicInfo,
  dateRange,
  metrics,
  paymentMethods,
  expenseCategories,
  topPatients,
  topDoctors,
  topSuppliers,
  appointments,
  inventory,
  labCases,
}) => {
  const { t, locale } = useI18n();
  const isArabic = locale.toLowerCase().startsWith('ar');
  const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
  const numberFormatter = new Intl.NumberFormat(locale);

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed);
  };

  // Enhanced colorful value table with gradient header
  const renderValueTable = (tableTitle: string, rows: ValueRow[], accentColor: string = 'slate') => (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 break-inside-avoid shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className={`h-6 w-1 rounded-full bg-gradient-to-b ${headerGradients[accentColor] || 'from-slate-500 to-slate-600'}`} />
        <h3 className="text-base font-bold text-slate-800">{tableTitle}</h3>
      </div>
      {rows.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className={`bg-gradient-to-r ${headerGradients[accentColor] || 'from-slate-100 to-slate-200'} text-white`}>
              <th className="p-3 text-right font-semibold rounded-l-lg">{t('reports.type')}</th>
              <th className="p-3 text-right font-semibold rounded-r-lg">{t('reports.amount')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.label}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="border-b border-slate-200 p-3 font-medium text-slate-700">{row.label}</td>
                <td className="border-b border-slate-200 p-3 font-bold text-emerald-600">{currencyFormatter.format(row.value)}</td>
              </tr>
            ))}
            <tr className="bg-slate-100 font-bold">
              <td className="p-3 text-slate-800">{t('financialSummary.netProfit')}</td>
              <td className="p-3 text-emerald-700">{currencyFormatter.format(rows.reduce((sum, r) => sum + r.value, 0))}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{t('reports.noDataAvailable')}</p>
      )}
    </section>
  );

  // Enhanced colorful section table with status indicators
  const renderColorfulTable = <T extends Record<string, any>>(
    tableTitle: string,
    headers: { key: string; label: string }[],
    rows: T[],
    accentColor: string,
    renderCell: (row: T, key: string) => React.ReactNode
  ) => (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 break-inside-avoid shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className={`h-6 w-1 rounded-full bg-gradient-to-b ${headerGradients[accentColor]}`} />
        <h3 className="text-base font-bold text-slate-800">{tableTitle}</h3>
        <span className={`ml-auto px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${headerGradients[accentColor]} text-white`}>
          {rows.length}
        </span>
      </div>
      {rows.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className={`bg-gradient-to-r ${headerGradients[accentColor]} text-white`}>
              {headers.map(h => (
                <th key={h.key} className="p-3 text-right font-semibold">{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : `${toneClasses[accentColor as keyof typeof toneClasses]?.bg.split(' ')[0] || 'bg-slate-50'} bg-opacity-30`}>
                {headers.map(h => (
                  <td key={h.key} className="border-b border-slate-200 p-3">{renderCell(row, h.key)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{t('reports.noDataAvailable')}</p>
      )}
    </section>
  );

  // Enhanced summary card with more details
  const renderEnhancedSummaryCard = (title: string, data: Record<string, string | number>, accentColor: string) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className={`h-5 w-1 rounded-full bg-gradient-to-b ${headerGradients[accentColor]}`} />
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      </div>
      <div className="space-y-2 text-sm">
        {Object.entries(data).map(([key, value], index) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-slate-500">{key}</span>
            <span className="font-semibold text-slate-800">{typeof value === 'number' ? (key.includes('Rate') || key.includes('Percentage') ? `${value.toFixed(1)}%` : numberFormatter.format(value)) : value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="bg-white p-6 text-slate-900"
      dir={isArabic ? 'rtl' : 'ltr'}
      style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontSize: '12px', lineHeight: '1.5' }}
    >
      <header className="mb-6 break-inside-avoid rounded-3xl border border-slate-200 bg-gradient-to-r from-cyan-600 to-blue-700 p-6 text-white">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-white/90">
              {t('reports.dateRange')}: {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
            </p>
            <p className="text-xs text-white/80">
              {t('patientReport.generatedOn', { date: dateFormatter.format(new Date()) })}
            </p>
          </div>
          {clinicInfo.logo ? (
            <img src={clinicInfo.logo} alt={clinicInfo.name || 'Clinic logo'} className="h-16 w-16 rounded-xl bg-white p-2 object-contain" />
          ) : null}
        </div>
        <div className="mt-4 border-t border-white/20 pt-4 text-sm text-white/90">
          <div className="font-semibold">{clinicInfo.name || t('appName')}</div>
          <div>{clinicInfo.address || '-'}</div>
          <div>{[clinicInfo.phone, clinicInfo.email].filter(Boolean).join(' | ') || '-'}</div>
        </div>
      </header>

      <section className="mb-6 break-inside-avoid">
        <div className="grid grid-cols-4 gap-4">
          {metrics.map((metric, index) => {
            const tone = metric.tone || 'slate';
            const colors = toneClasses[tone];
            return (
              <div
                key={`${metric.label}-${index}`}
                className={`rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.bg} p-4 shadow-sm`}
              >
                <div className="mb-1 text-xs font-semibold">{metric.label}</div>
                <div className="text-xl font-bold text-slate-900">{metric.value}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-6 grid grid-cols-2 gap-4">
        {renderValueTable(t('reports.paymentMethodDetails'), paymentMethods)}
        {renderValueTable(t('reports.expenseCategories'), expenseCategories)}
      </section>

      <section className="mb-6 break-inside-avoid rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-6 w-1 rounded-full bg-gradient-to-b from-violet-500 to-purple-600" />
          <h3 className="text-base font-bold text-slate-800">{t('reports.topPatients')}</h3>
          <span className="ml-auto px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white">
            {topPatients.length}
          </span>
        </div>
        {topPatients.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-violet-500 to-purple-600 text-white">
                <th className="p-3 text-right font-semibold rounded-l-lg">{t('reports.patientName')}</th>
                <th className="p-3 text-right font-semibold">{t('suppliers.phone')}</th>
                <th className="p-3 text-right font-semibold">{t('reports.treatments')}</th>
                <th className="p-3 text-right font-semibold">{t('reports.visits')}</th>
                <th className="p-3 text-right font-semibold">{t('reports.totalSpent')}</th>
                <th className="p-3 text-right font-semibold">{t('reports.totalPaid')}</th>
                <th className="p-3 text-right font-semibold">{t('reports.remaining')}</th>
                <th className="p-3 text-right font-semibold">{t('reports.avgPerVisit')}</th>
                <th className="p-3 text-right font-semibold rounded-r-lg">{t('reports.patientStats.lastVisit')}</th>
              </tr>
            </thead>
            <tbody>
              {topPatients.map((patient, index) => (
                <tr key={`${patient.name}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-violet-50'}>
                  <td className="border-b border-slate-200 p-3 font-medium text-slate-800">{patient.name}</td>
                  <td className="border-b border-slate-200 p-3 text-slate-600">{patient.phone || '-'}</td>
                  <td className="border-b border-slate-200 p-3 text-center"><span className="px-2 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold">{numberFormatter.format(patient.treatments)}</span></td>
                  <td className="border-b border-slate-200 p-3 text-center"><span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">{patient.visitsCount || 0}</span></td>
                  <td className="border-b border-slate-200 p-3 font-semibold text-slate-700">{currencyFormatter.format(patient.totalSpent)}</td>
                  <td className="border-b border-slate-200 p-3 font-semibold text-emerald-600">{currencyFormatter.format(patient.totalPaid)}</td>
                  <td className="border-b border-slate-200 p-3 font-semibold text-amber-600">{currencyFormatter.format(patient.remaining || (patient.totalSpent - patient.totalPaid))}</td>
                  <td className="border-b border-slate-200 p-3 text-slate-600">{currencyFormatter.format(patient.averagePerVisit || 0)}</td>
                  <td className="border-b border-slate-200 p-3 text-slate-600">{formatDate(patient.lastVisit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{t('reports.noDataAvailable')}</p>
        )}
      </section>

      <section className="mb-6 break-inside-avoid rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-6 w-1 rounded-full bg-gradient-to-b from-cyan-500 to-blue-600" />
          <h3 className="text-base font-bold text-slate-800">{t('reports.doctorPerformance')}</h3>
          <span className="ml-auto px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
            {topDoctors.length}
          </span>
        </div>
        {topDoctors.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                <th className="p-3 text-right font-semibold rounded-l-lg">{t('reports.doctorName')}</th>
                <th className="p-3 text-right font-semibold">{t('reports.specialty')}</th>
                <th className="p-3 text-right font-semibold">{t('reports.treatments')}</th>
                <th className="p-3 text-right font-semibold">{t('reports.patients')}</th>
                <th className="p-3 text-right font-semibold">{t('reports.totalRevenue')}</th>
                <th className="p-3 text-right font-semibold">{t('reports.doctorRevenue')}</th>
                <th className="p-3 text-right font-semibold">{t('reports.completionRate')}</th>
                <th className="p-3 text-right font-semibold rounded-r-lg">{t('reports.avgTreatmentCost')}</th>
              </tr>
            </thead>
            <tbody>
              {topDoctors.map((doctor, index) => (
                <tr key={`${doctor.name}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-cyan-50'}>
                  <td className="border-b border-slate-200 p-3 font-medium text-slate-800">{doctor.name}</td>
                  <td className="border-b border-slate-200 p-3"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{doctor.specialty || '-'}</span></td>
                  <td className="border-b border-slate-200 p-3 text-center"><span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-semibold">{numberFormatter.format(doctor.treatments)}</span></td>
                  <td className="border-b border-slate-200 p-3 text-center"><span className="px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-semibold">{numberFormatter.format(doctor.patients)}</span></td>
                  <td className="border-b border-slate-200 p-3 font-semibold text-slate-700">{currencyFormatter.format(doctor.totalRevenue)}</td>
                  <td className="border-b border-slate-200 p-3 font-semibold text-emerald-600">{currencyFormatter.format(doctor.doctorRevenue)}</td>
                  <td className="border-b border-slate-200 p-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${(doctor.completionRate || 0) >= 80 ? 'bg-green-100 text-green-700' : (doctor.completionRate || 0) >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{(doctor.completionRate || 0).toFixed(1)}%</span></td>
                  <td className="border-b border-slate-200 p-3 text-slate-600">{currencyFormatter.format(doctor.avgTreatmentCost || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{t('reports.noDataAvailable')}</p>
        )}
      </section>

      <section className="mb-6 break-inside-avoid rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-6 w-1 rounded-full bg-gradient-to-b from-amber-500 to-orange-600" />
          <h3 className="text-base font-bold text-slate-800">{t('reports.supplierReports')}</h3>
          <span className="ml-auto px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white">
            {topSuppliers.length}
          </span>
        </div>
        {topSuppliers.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                <th className="p-3 text-right font-semibold rounded-l-lg">{t('reports.supplierName')}</th>
                <th className="p-3 text-right font-semibold">{t('reports.type')}</th>
                <th className="p-3 text-right font-semibold">{t('reports.totalInvoices')}</th>
                <th className="p-3 text-right font-semibold">{t('reports.totalAmount')}</th>
                <th className="p-3 text-right font-semibold">{t('reports.paidAmount')}</th>
                <th className="p-3 text-right font-semibold">{t('reports.unpaidAmount')}</th>
                <th className="p-3 text-right font-semibold">{t('reports.totalExpenses')}</th>
                <th className="p-3 text-right font-semibold rounded-r-lg">{t('reports.lastInvoiceDate')}</th>
              </tr>
            </thead>
            <tbody>
              {topSuppliers.map((supplier, index) => (
                <tr key={`${supplier.name}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-amber-50'}>
                  <td className="border-b border-slate-200 p-3 font-medium text-slate-800">{supplier.name}</td>
                  <td className="border-b border-slate-200 p-3"><span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">{supplier.type || '-'}</span></td>
                  <td className="border-b border-slate-200 p-3 text-center"><span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">{numberFormatter.format(supplier.totalInvoices)}</span></td>
                  <td className="border-b border-slate-200 p-3 font-semibold text-slate-700">{currencyFormatter.format(supplier.totalAmount)}</td>
                  <td className="border-b border-slate-200 p-3 font-semibold text-emerald-600">{currencyFormatter.format(supplier.paidAmount || (supplier.totalAmount - supplier.unpaidAmount))}</td>
                  <td className="border-b border-slate-200 p-3 font-semibold text-amber-600">{currencyFormatter.format(supplier.unpaidAmount)}</td>
                  <td className="border-b border-slate-200 p-3 font-semibold text-red-600">{currencyFormatter.format(supplier.expensesAmount)}</td>
                  <td className="border-b border-slate-200 p-3 text-slate-600">{formatDate(supplier.lastInvoiceDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{t('reports.noDataAvailable')}</p>
        )}
      </section>

      <section className="grid grid-cols-3 gap-4 break-inside-avoid">
        {/* Appointments Summary - Colorful */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-green-600" />
            <h3 className="text-sm font-bold text-slate-800">{t('reports.appointmentReports')}</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-emerald-50 rounded-lg">
              <span className="text-emerald-700">{t('reports.totalAppointments')}</span>
              <span className="font-bold text-emerald-700">{numberFormatter.format(appointments.total)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
              <span className="text-green-700">{t('reports.completed')}</span>
              <span className="font-bold text-green-700">{numberFormatter.format(appointments.completed)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
              <span className="text-blue-700">{t('reports.scheduled')}</span>
              <span className="font-bold text-blue-700">{numberFormatter.format(appointments.scheduled)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-cyan-50 rounded-lg">
              <span className="text-cyan-700">{t('reports.confirmed')}</span>
              <span className="font-bold text-cyan-700">{numberFormatter.format(appointments.confirmed)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
              <span className="text-red-700">{t('reports.cancelled')}</span>
              <span className="font-bold text-red-700">{numberFormatter.format(appointments.cancelled)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-orange-50 rounded-lg">
              <span className="text-orange-700">{t('reports.noShows')}</span>
              <span className="font-bold text-orange-700">{numberFormatter.format(appointments.noShow)}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-600">{t('reports.completionRate')}</span>
                <span className={`font-bold ${appointments.completionRate >= 80 ? 'text-green-600' : appointments.completionRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{appointments.completionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${appointments.completionRate >= 80 ? 'bg-green-500' : appointments.completionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(appointments.completionRate, 100)}%` }}></div>
              </div>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-600">{t('reports.noShowRate')}</span>
              <span className={`font-bold ${appointments.noShowRate <= 10 ? 'text-green-600' : appointments.noShowRate <= 20 ? 'text-amber-600' : 'text-red-600'}`}>{appointments.noShowRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-600">{t('reports.avgPerDay')}</span>
              <span className="font-bold text-slate-700">{numberFormatter.format(appointments.avgPerDay || 0)}</span>
            </div>
          </div>
        </div>

        {/* Inventory Summary - Colorful */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">{t('reports.inventoryReports')}</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
              <span className="text-blue-700">{t('reports.inventoryValue')}</span>
              <span className="font-bold text-blue-700">{currencyFormatter.format(inventory.value)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-indigo-50 rounded-lg">
              <span className="text-indigo-700">{t('reports.totalItems')}</span>
              <span className="font-bold text-indigo-700">{numberFormatter.format(inventory.totalItems || 0)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-100 rounded-lg">
              <span className="text-slate-700">{t('reports.categories')}</span>
              <span className="font-bold text-slate-700">{numberFormatter.format(inventory.categoriesCount || 0)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-amber-50 rounded-lg">
              <span className="text-amber-700">{t('reports.lowStockItems')}</span>
              <span className={`font-bold ${inventory.lowStockCount > 0 ? 'text-amber-700' : 'text-green-700'}`}>{numberFormatter.format(inventory.lowStockCount)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
              <span className="text-red-700">{t('reports.expiringItems')}</span>
              <span className={`font-bold ${inventory.expiringCount > 0 ? 'text-red-700' : 'text-green-700'}`}>{numberFormatter.format(inventory.expiringCount)}</span>
            </div>
            {/* Stock Status Bar */}
            <div className="mt-2 pt-2 border-t border-slate-200">
              <div className="text-xs text-slate-500 mb-1">{t('reports.stockStatus')}</div>
              <div className="flex h-3 rounded-full overflow-hidden">
                <div className="bg-green-500" style={{ width: `${inventory.totalItems ? Math.max((inventory.totalItems - inventory.lowStockCount - inventory.expiringCount) / inventory.totalItems * 100, 0) : 100}%` }}></div>
                <div className="bg-amber-500" style={{ width: `${inventory.totalItems ? (inventory.lowStockCount / inventory.totalItems * 100) : 0}%` }}></div>
                <div className="bg-red-500" style={{ width: `${inventory.totalItems ? (inventory.expiringCount / inventory.totalItems * 100) : 0}%` }}></div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-green-600">{t('reports.inStock')}</span>
                <span className="text-amber-600">{t('reports.lowStock')}</span>
                <span className="text-red-600">{t('reports.expiring')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lab Cases Summary - Colorful */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-rose-500 to-pink-600" />
            <h3 className="text-sm font-bold text-slate-800">{t('reports.labCasesSummary')}</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center p-2 bg-rose-50 rounded-lg">
              <span className="text-rose-700">{t('reports.totalCases')}</span>
              <span className="font-bold text-rose-700">{numberFormatter.format(labCases.total)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-pink-50 rounded-lg">
              <span className="text-pink-700">{t('reports.sent')}</span>
              <span className="font-bold text-pink-700">{numberFormatter.format(labCases.sent)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
              <span className="text-purple-700">{t('reports.received')}</span>
              <span className="font-bold text-purple-700">{numberFormatter.format(labCases.received)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
              <span className="text-green-700">{t('reports.fitted')}</span>
              <span className="font-bold text-green-700">{numberFormatter.format(labCases.fitted)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-amber-50 rounded-lg">
              <span className="text-amber-700">{t('reports.pending')}</span>
              <span className="font-bold text-amber-700">{numberFormatter.format(labCases.pending || 0)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-100 rounded-lg">
              <span className="text-slate-700">{t('reports.totalCost')}</span>
              <span className="font-bold text-slate-700">{currencyFormatter.format(labCases.totalCost)}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
              <span className="text-blue-700">{t('reports.avgCostPerCase')}</span>
              <span className="font-bold text-blue-700">{currencyFormatter.format(labCases.avgCostPerCase || (labCases.total > 0 ? labCases.totalCost / labCases.total : 0))}</span>
            </div>
            {/* Lab Status Progress */}
            {labCases.total > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-200">
                <div className="text-xs text-slate-500 mb-1">{t('reports.labProgress')}</div>
                <div className="flex h-2 rounded-full overflow-hidden bg-slate-200">
                  <div className="bg-green-500" style={{ width: `${(labCases.fitted / labCases.total * 100)}%` }}></div>
                  <div className="bg-purple-500" style={{ width: `${(labCases.received / labCases.total * 100)}%` }}></div>
                  <div className="bg-amber-500" style={{ width: `${(labCases.pending / labCases.total * 100)}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrintableReportsSummary;
