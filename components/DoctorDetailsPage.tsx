/**
 * DoctorDetailsPage Component
 * 
 * Displays detailed information about a doctor including their profile,
 * appointments, treatments, financials, and schedule.
 * 
 * @component
 * @example
 * <DoctorDetailsPage 
 *   clinicData={clinicData} 
 *   doctorId="doctor-123" 
 *   onBack={() => navigate('/doctors')} 
 * />
 */

import React, { useState, useMemo, useCallback } from 'react';
import { ClinicData } from '../hooks/useClinicData';
import { Dentist, DoctorDetailTab, DoctorPayment, Patient, TreatmentRecord, Appointment, TreatmentDefinition, NotificationType, Permission } from '../types';
import { useI18n } from '../hooks/useI18n';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import AddDoctorPaymentModal from './finance/AddDoctorPaymentModal';
import DoctorDetailedReport from './DoctorDetailedReport';

// Import shared icons
import {
  CloseIcon,
  EditIcon,
  DollarSignIcon,
  UserIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChartIcon,
  AddPaymentIcon,
  ClockIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  PaymentIcon,
  TrashIcon,
  ChevronDownIcon,
  LoadingSpinner,
  EmptyStateIcon,
} from './icons';

// ============================================================================
// Constants & Types
// ============================================================================

/** Available color options for doctor avatar */
const AVAILABLE_COLORS = [
  'bg-gradient-to-br from-sky-400 to-sky-600',
  'bg-gradient-to-br from-emerald-400 to-emerald-600',
  'bg-gradient-to-br from-amber-400 to-amber-600',
  'bg-gradient-to-br from-rose-400 to-rose-600',
  'bg-gradient-to-br from-indigo-400 to-indigo-600',
  'bg-gradient-to-br from-teal-400 to-teal-600',
  'bg-gradient-to-br from-orange-400 to-orange-600',
  'bg-gradient-to-br from-purple-400 to-purple-600',
] as const;

/** Tab configuration for navigation */
const TAB_CONFIG = [
  { key: 'details', label: 'doctorDetails.tabDetails', icon: UserIcon },
  { key: 'treatments', label: 'doctorDetails.tabTreatments', icon: ChartIcon },
  { key: 'financials', label: 'doctorDetails.tabFinancials', icon: DollarSignIcon },
  { key: 'schedule', label: 'doctorDetails.tabSchedule', icon: CalendarIcon },
] as const;

/** Treatment filter options */
type TreatmentFilterType = 'all' | 'month' | 'quarter' | 'year';

/** Financial summary data structure */
interface FinancialSummary {
  totalRevenue: number;
  totalEarnings: number;
  totalPaymentsReceived: number;
  netBalance: number;
}

/** Quick stats data structure */
interface QuickStats {
  upcomingAppointments: number;
  thisMonthTreatments: number;
  avgTreatmentValue: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format date and time using locale
 */
const createDateTimeFormatter = (locale: string) => 
  new Intl.DateTimeFormat(locale, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });

/**
 * Format date using locale
 */
const createDateFormatter = (locale: string) => 
  new Intl.DateTimeFormat(locale, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });

/**
 * Format currency using locale
 */
const createCurrencyFormatter = (locale: string) => 
  new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency: 'EGP' 
  });

/**
 * Check if treatment date is within the current month and year
 */
const isThisMonth = (date: Date): boolean => {
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

/**
 * Check if treatment date is within the current quarter and year
 */
const isThisQuarter = (date: Date): boolean => {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const treatmentQuarter = Math.floor(date.getMonth() / 3);
  return treatmentQuarter === quarter && date.getFullYear() === now.getFullYear();
};

/**
 * Check if treatment date is within the current year
 */
const isThisYear = (date: Date): boolean => {
  return date.getFullYear() === new Date().getFullYear();
};

/**
 * Find patient by ID from patients array
 */
const findPatientById = (patients: Patient[], patientId: string): Patient | undefined => 
  patients.find(p => p.id === patientId);

/**
 * Find treatment definition by ID
 */
const findTreatmentById = (treatments: TreatmentDefinition[], treatmentId: string): TreatmentDefinition | undefined =>
  treatments.find(td => td.id === treatmentId);

// ============================================================================
// Reusable Sub-Components
// ============================================================================

/**
 * Status Badge Component
 * Displays appointment status with appropriate styling
 */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusStyles: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    'no-show': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyles[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
};

/**
 * Avatar Component
 * Displays doctor or patient avatar with initials
 */
const Avatar: React.FC<{ 
  name: string; 
  color?: string; 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ name, color = 'bg-gradient-to-br from-purple-400 to-purple-600', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <div className={`${sizeClasses[size]} ${color} flex items-center justify-center text-white font-bold rounded-xl ${className}`}>
      {name?.charAt(0) || '?'}
    </div>
  );
};

/**
 * Empty State Component
 * Displays when no data is available
 */
const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description?: string;
}> = ({ icon, title, description }) => (
  <div className="text-center py-8">
    <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
      {icon}
    </div>
    <p className="text-slate-500 dark:text-slate-400">{title}</p>
    {description && <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{description}</p>}
  </div>
);

/**
 * Loading State Component
 */
const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <LoadingSpinner className="h-8 w-8 text-purple-600" />
    <p className="mt-4 text-slate-500 dark:text-slate-400">{message}</p>
  </div>
);

/**
 * Appointment Card Component
 * Displays a single appointment in the list
 */
const AppointmentCard: React.FC<{
  appointment: Appointment;
  patient?: Patient;
  dateTimeFormatter: Intl.DateTimeFormat;
  showStatus?: boolean;
}> = ({ appointment, patient, dateTimeFormatter, showStatus = true }) => {
  const isUpcoming = appointment.startTime > new Date();
  
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
      isUpcoming
        ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/10 border-blue-100 dark:border-blue-700 hover:shadow-md'
        : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
    }`}>
      <div className="flex items-center gap-3">
        <Avatar name={patient?.name || ''} size="md" />
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-200">{patient?.name || 'Unknown Patient'}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{dateTimeFormatter.format(appointment.startTime)}</p>
        </div>
      </div>
      {showStatus && <StatusBadge status={appointment.status} />}
    </div>
  );
};

/**
 * Treatment Card Component
 * Displays a single treatment record in the list
 */
const TreatmentCard: React.FC<{
  treatmentRecord: TreatmentRecord;
  patient?: Patient;
  treatment?: TreatmentDefinition;
  dateFormatter: Intl.DateTimeFormat;
  currencyFormatter: Intl.NumberFormat;
  isRecent?: boolean;
}> = ({ treatmentRecord, patient, treatment, dateFormatter, currencyFormatter, isRecent = false }) => {
  return (
    <li className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
      isRecent
        ? 'bg-gradient-to-r from-purple-50 to-amber-50 dark:from-purple-900/20 dark:to-amber-900/10 border-purple-100 dark:border-purple-700 hover:shadow-md'
        : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
    }`}>
      <div className="flex items-center gap-4">
        <Avatar 
          name={treatment?.name || 'T'} 
          size="md" 
          color={isRecent ? 'bg-gradient-to-br from-purple-400 to-purple-600' : 'bg-gradient-to-br from-slate-400 to-slate-600'}
        />
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">{treatment?.name || 'Unknown Treatment'}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {dateFormatter.format(new Date(treatmentRecord.treatmentDate))}
            </p>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <p className="text-sm text-slate-500 dark:text-slate-400">{patient?.name || 'Unknown Patient'}</p>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold text-lg ${isRecent ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400'}`}>
          {currencyFormatter.format(treatmentRecord.doctorShare)}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Doctor's Share</p>
      </div>
    </li>
  );
};

/**
 * Financial Card Component
 * Displays a financial metric with styling
 */
const FinancialCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  subtitle?: string;
}> = ({ title, value, icon, variant = 'default', subtitle }) => {
  const variantStyles = {
    default: 'from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300',
    success: 'from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300',
    warning: 'from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-700',
    danger: 'from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/30 border-rose-200 dark:border-rose-700',
  };

  const iconBgStyles = {
    default: 'bg-purple-200 dark:bg-purple-700',
    success: 'bg-emerald-200 dark:bg-emerald-700',
    warning: 'bg-amber-200 dark:bg-amber-700',
    danger: 'bg-rose-200 dark:bg-rose-700',
  };

  const valueColorStyles = {
    default: 'text-purple-700 dark:text-purple-300',
    success: 'text-emerald-700 dark:text-emerald-300',
    warning: 'text-amber-700 dark:text-amber-300',
    danger: 'text-rose-700 dark:text-rose-300',
  };

  return (
    <div className={`bg-gradient-to-br ${variantStyles[variant]} p-3 md:p-4 rounded-xl border`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs md:text-sm">{title}</p>
        <div className={`p-1.5 rounded-lg ${iconBgStyles[variant]}`}>
          {icon}
        </div>
      </div>
      <p className="text-xl md:text-2xl font-bold ${valueColorStyles[variant]}">{value}</p>
      {subtitle && <p className="text-xs md:text-sm mt-1 text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
  );
};

/**
 * Recent Activity Item Component
 */
const RecentActivityItem: React.FC<{
  appointment: Appointment;
  patient?: Patient;
  dateTimeFormatter: Intl.DateTimeFormat;
}> = ({ appointment, patient, dateTimeFormatter }) => (
  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-amber-50 dark:from-purple-900/20 dark:to-amber-900/10 rounded-xl border border-purple-100 dark:border-purple-700 hover:shadow-md transition-shadow">
    <Avatar name={patient?.name || ''} size="md" />
    <div className="flex-1">
      <p className="font-semibold text-slate-800 dark:text-slate-200">{patient?.name || 'Unknown Patient'}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{dateTimeFormatter.format(appointment.startTime)}</p>
    </div>
    <StatusBadge status={appointment.status} />
  </div>
);

/**
 * Payment Transaction Item Component
 */
const PaymentTransactionItem: React.FC<{
  payment: DoctorPayment;
  dateFormatter: Intl.DateTimeFormat;
  currencyFormatter: Intl.NumberFormat;
  onDelete: (id: string) => void;
  deleteLabel: string;
}> = ({ payment, dateFormatter, currencyFormatter, onDelete, deleteLabel }) => (
  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10 rounded-xl border border-emerald-100 dark:border-emerald-700 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white">
        <PaymentIcon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-slate-800 dark:text-slate-200">Payment</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {dateFormatter.format(new Date(payment.date))}
        </p>
        {payment.notes && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs truncate">{payment.notes}</p>
        )}
      </div>
    </div>
    <div className="flex items-center gap-3">
      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">{currencyFormatter.format(payment.amount)}</span>
      <button
        onClick={() => onDelete(payment.id)}
        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
        aria-label={deleteLabel}
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  </div>
);

/**
 * Earnings Transaction Item Component
 */
const EarningsTransactionItem: React.FC<{
  record: TreatmentRecord;
  patient?: Patient;
  treatment?: TreatmentDefinition;
  dateFormatter: Intl.DateTimeFormat;
  currencyFormatter: Intl.NumberFormat;
}> = ({ record, patient, treatment, dateFormatter, currencyFormatter }) => (
  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-amber-50 dark:from-purple-900/20 dark:to-amber-900/10 rounded-xl border border-purple-100 dark:border-purple-700 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white">
        <ChartIcon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-slate-800 dark:text-slate-200">Earnings</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {treatment?.name} • {patient?.name}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{dateFormatter.format(new Date(record.treatmentDate))}</p>
      </div>
    </div>
    <span className="font-bold text-purple-600 dark:text-purple-400 text-lg">{currencyFormatter.format(record.doctorShare)}</span>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

const DoctorDetailsPage: React.FC<{
  clinicData: ClinicData;
  doctorId: string;
  onBack: () => void;
}> = ({ clinicData, doctorId, onBack }) => {
  const { t, locale } = useI18n();
  const { addNotification } = useNotification();
  const { checkPermission } = useAuth();
  const { appointments, patients, treatmentRecords, treatmentDefinitions, doctorPayments, dentists, updateDoctor } = clinicData;

  // Find the doctor
  const doctor = useMemo(() => 
    dentists.find(d => d.id === doctorId), 
    [dentists, doctorId]
  );

  // Formatters - memoized
  const dateTimeFormatter = useMemo(() => createDateTimeFormatter(locale), [locale]);
  const dateFormatter = useMemo(() => createDateFormatter(locale), [locale]);
  const currencyFormatter = useMemo(() => createCurrencyFormatter(locale), [locale]);

  // Local state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(doctor || { 
    id: '', 
    name: '', 
    specialty: '', 
    color: AVAILABLE_COLORS[0] 
  });
  const [activeTab, setActiveTab] = useState<DoctorDetailTab>('details');
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [treatmentFilter, setTreatmentFilter] = useState<TreatmentFilterType>('all');
  const [isRecentActivityOpen, setIsRecentActivityOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Early return if doctor not found
  if (!doctor) {
    return (
      <div 
        className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6"
        role="alert"
        aria-labelledby="error-title"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <EmptyStateIcon className="h-16 w-16 mx-auto text-slate-400 mb-4" />
            <h2 id="error-title" className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Doctor not found
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              The requested doctor could not be found in the system.
            </p>
            <button 
              onClick={onBack}
              className="text-purple-600 dark:text-purple-400 hover:underline"
            >
              Back to Doctors List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Memoized data computations
  const doctorAppointments = useMemo(() => {
    return appointments
      .filter(a => a.dentistId === doctor.id)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }, [appointments, doctor.id]);

  const doctorTreatmentRecords = useMemo(() => {
    return treatmentRecords
      .filter(tr => tr.dentistId === doctor.id)
      .sort((a, b) => new Date(b.treatmentDate).getTime() - new Date(a.treatmentDate).getTime());
  }, [treatmentRecords, doctor.id]);

  const doctorPaymentsList = useMemo(() => 
    (doctorPayments || [])
      .filter(p => p.dentistId === doctor.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
    [doctorPayments, doctor.id]
  );

  const financialSummary = useMemo((): FinancialSummary => {
    const totalRevenue = doctorTreatmentRecords.reduce((sum, tr) => {
      const treatmentDef = findTreatmentById(treatmentDefinitions, tr.treatmentDefinitionId);
      return sum + (treatmentDef ? treatmentDef.basePrice : 0);
    }, 0);
    const totalEarnings = doctorTreatmentRecords.reduce((sum, tr) => sum + tr.doctorShare, 0);
    const totalPaymentsReceived = doctorPaymentsList.reduce((sum, p) => sum + p.amount, 0);
    const netBalance = totalEarnings - totalPaymentsReceived;
    return { totalRevenue, totalEarnings, totalPaymentsReceived, netBalance };
  }, [doctorTreatmentRecords, doctorPaymentsList, treatmentDefinitions]);

  const quickStats = useMemo((): QuickStats => {
    const upcomingAppointments = doctorAppointments.filter(a => a.startTime > new Date()).length;
    const thisMonthTreatments = doctorTreatmentRecords.filter(tr => 
      isThisMonth(new Date(tr.treatmentDate))
    ).length;
    const avgTreatmentValue = doctorTreatmentRecords.length > 0
      ? financialSummary.totalEarnings / doctorTreatmentRecords.length
      : 0;
    return { upcomingAppointments, thisMonthTreatments, avgTreatmentValue };
  }, [doctorAppointments, doctorTreatmentRecords, financialSummary.totalEarnings]);

  const filteredTreatments = useMemo(() => {
    return doctorTreatmentRecords.filter(tr => {
      const treatmentDate = new Date(tr.treatmentDate);
      switch (treatmentFilter) {
        case 'month':
          return isThisMonth(treatmentDate);
        case 'quarter':
          return isThisQuarter(treatmentDate);
        case 'year':
          return isThisYear(treatmentDate);
        default:
          return true;
      }
    });
  }, [doctorTreatmentRecords, treatmentFilter]);

  // Event handlers
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleColorChange = useCallback((color: string) => {
    setFormData(prev => ({ ...prev, color }));
  }, []);

  const handleSave = useCallback(() => {
    updateDoctor({ ...doctor, ...formData });
    setIsEditing(false);
    addNotification({ 
      message: t('notifications.doctorUpdated'), 
      type: NotificationType.SUCCESS
    });
  }, [doctor, formData, updateDoctor, addNotification, t]);

  const handleAddPayment = useCallback((payment: Omit<DoctorPayment, 'id'>) => {
    clinicData.addDoctorPayment(payment);
    setIsAddPaymentModalOpen(false);
    addNotification({ 
      message: t('notifications.paymentAdded'), 
      type: NotificationType.SUCCESS
    });
  }, [clinicData, addNotification, t]);

  const handleDeletePayment = useCallback((paymentId: string) => {
    if (window.confirm(t('common.confirmDelete'))) {
      if (!checkPermission(Permission.FINANCE_DISCOUNT_DELETE)) {
        return;
      }
      clinicData.deleteDoctorPayment(paymentId);
      addNotification({ 
        message: t('notifications.paymentDeleted'), 
        type: NotificationType.SUCCESS
      });
    }
  }, [clinicData, addNotification, t, checkPermission]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setFormData(doctor);
  }, [doctor]);

  // Helper to find patient by ID
  const getPatientById = useCallback((patientId: string) => 
    findPatientById(patients, patientId), 
    [patients]
  );

  // Helper to find treatment by ID
  const getTreatmentById = useCallback((treatmentId: string) => 
    findTreatmentById(treatmentDefinitions, treatmentId), 
    [treatmentDefinitions]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-amber-50/30 dark:from-slate-900 dark:via-purple-900/10 dark:to-amber-900/10">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 mb-6 transition-colors"
          aria-label={t('common.back')}
        >
          <ChevronDownIcon className="rotate-90" />
          {t('common.back')}
        </button>

        {/* Header Section */}
        <header 
          className="relative p-4 md:p-8 rounded-2xl border border-purple-200/50 dark:border-purple-700/50 bg-gradient-to-br from-purple-50 via-white to-amber-50 dark:from-purple-900/30 dark:via-slate-800 dark:to-amber-900/20 shadow-xl mb-4 md:mb-6"
          role="banner"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-24 md:w-40 h-24 md:h-40 bg-gradient-to-br from-purple-200/30 to-amber-200/30 rounded-full blur-2xl md:blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-20 md:w-32 h-20 md:h-32 bg-gradient-to-tr from-amber-200/30 to-purple-200/30 rounded-full blur-2xl md:blur-3xl" aria-hidden="true" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-6">
            {/* Doctor Avatar */}
            <div 
              className="w-16 h-16 md:w-24 md:h-24 rounded-xl md:rounded-2xl ${doctor.color} flex items-center justify-center text-white text-2xl md:text-4xl font-bold shadow-lg ring-4 ring-white dark:ring-slate-700 flex-shrink-0"
              aria-label={`${doctor.name} avatar`}
            >
              {doctor.name.charAt(0)}
            </div>
            
            {/* Doctor Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-4xl font-bold text-slate-800 dark:text-white">{doctor.name}</h1>
              <p className="text-base md:text-lg text-purple-600 dark:text-purple-400 flex items-center gap-2 mt-1 md:mt-2">
                <BriefcaseIcon className="h-4 w-4 md:h-5 md:w-5" />
                <span className="truncate">{doctor.specialty}</span>
              </p>
              <div className="flex flex-wrap items-center gap-3 md:gap-6 mt-2 md:3">
                <span className="text-sm md:text-base text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">{doctorTreatmentRecords.length}</span> {t('doctorDetails.treatments')}
                </span>
                <span className="text-sm md:text-base text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{quickStats.upcomingAppointments}</span> {t('doctorDetails.upcomingAppointments')}
                </span>
              </div>
            </div>
            
            {/* Edit and Report Buttons */}
            <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
              {!isEditing && (
                <>
                  <button
                    onClick={() => setIsReportOpen(true)}
                    className="flex-1 sm:flex-none items-center justify-center gap-2 px-3 md:px-5 py-2 md:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 text-sm md:text-base font-semibold shadow-lg shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200"
                    aria-label={t('doctorDetails.viewReport') || 'View Detailed Report'}
                  >
                    <ChartIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('doctorDetailedReport.title') || 'Detailed Report'}</span>
                    <span className="sm:hidden">{t('doctorDetailedReport.title') || 'Report'}</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 sm:flex-none items-center justify-center gap-2 px-3 md:px-5 py-2 md:py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 text-sm md:text-base font-semibold shadow-lg shadow-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200"
                    aria-label={t('common.edit')}
                  >
                    <EditIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('common.edit')}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav 
          className="border-b border-purple-100 dark:border-purple-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm flex-shrink-0 rounded-2xl mb-4 md:mb-6"
          role="navigation"
          aria-label="Doctor details tabs"
        >
          <ul className="flex gap-1 p-1.5 md:p-2 overflow-x-auto" role="tablist">
            {TAB_CONFIG.map(({ key, label, icon: Icon }) => (
              <li key={key} className="flex-1 min-w-0">
                <button
                  onClick={() => setActiveTab(key as DoctorDetailTab)}
                  className={`w-full flex items-center justify-center gap-1.5 md:gap-2 px-2 md:px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all duration-300 ${
                    activeTab === key
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400'
                  }`}
                  role="tab"
                  aria-selected={activeTab === key}
                  aria-controls={`panel-${key}`}
                >
                  <Icon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                  <span className="hidden sm:inline truncate">{t(label)}</span>
                  <span className="sm:hidden">{key === 'details' ? 'Info' : key === 'treatments' ? 'Trt' : key === 'financials' ? 'Fin' : 'Sch'}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="space-y-4 md:space-y-6" role="main">
          {/* Recent Activity Section - Collapsible */}
          {!isEditing && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-700 overflow-hidden">
              <button
                onClick={() => setIsRecentActivityOpen(!isRecentActivityOpen)}
                className="w-full flex items-center justify-between p-3 md:p-6 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                aria-expanded={isRecentActivityOpen}
                aria-controls="recent-activity-panel"
              >
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-base md:text-lg font-semibold text-purple-700 dark:text-purple-400">
                    {t('doctorDetails.recentActivity') || 'Recent Activity'}
                  </h3>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    ({doctorAppointments.length} {t('doctorDetails.appointments')})
                  </span>
                </div>
                <div className={`transform transition-transform duration-200 ${isRecentActivityOpen ? 'rotate-180' : ''}`}>
                  <ChevronDownIcon className="h-4 w-4 text-slate-500" />
                </div>
              </button>
              
              {isRecentActivityOpen && (
                <div id="recent-activity-panel" className="p-3 md:p-6 pt-0 space-y-3" role="region" aria-label="Recent appointments">
                  {doctorAppointments.length > 0 ? (
                    doctorAppointments.slice(0, 5).map(apt => (
                      <RecentActivityItem
                        key={apt.id}
                        appointment={apt}
                        patient={getPatientById(apt.patientId)}
                        dateTimeFormatter={dateTimeFormatter}
                      />
                    ))
                  ) : (
                    <EmptyState
                      icon={<CalendarIcon className="h-6 w-6 text-purple-600" />}
                      title={t('doctorDetails.noRecentActivity') || 'No recent activity'}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab Content */}
          <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
            {activeTab === 'details' && (
              <div className="space-y-3 md:space-y-4">
                {isEditing ? (
                  /* Edit Form */
                  <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-700 space-y-4">
                    <div className="space-y-3">
                      <label 
                        htmlFor="edit-doctor-name" 
                        className="block text-sm font-medium text-purple-700 dark:text-purple-400"
                      >
                        {t('doctorDetails.fullName')}
                      </label>
                      <input
                        id="edit-doctor-name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={t('doctorDetails.fullName')}
                        className="p-3 border border-purple-200 dark:border-purple-600 rounded-xl w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200"
                        aria-required="true"
                      />
                    </div>
                    <div className="space-y-3">
                      <label 
                        htmlFor="edit-doctor-specialty" 
                        className="block text-sm font-medium text-purple-700 dark:text-purple-400"
                      >
                        {t('doctorDetails.specialty')}
                      </label>
                      <input
                        id="edit-doctor-specialty"
                        name="specialty"
                        type="text"
                        value={formData.specialty}
                        onChange={handleChange}
                        placeholder={t('doctorDetails.specialty')}
                        className="p-3 border border-purple-200 dark:border-purple-600 rounded-xl w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200"
                        aria-required="true"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-purple-700 dark:text-purple-400">
                        {t('doctorDetails.colorTag')}
                      </label>
                      <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Select color">
                        {AVAILABLE_COLORS.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => handleColorChange(color)}
                            className={`w-10 h-10 rounded-xl ${color} ${
                              formData.color === color 
                                ? 'ring-2 ring-offset-2 ring-purple-500 dark:ring-purple-400 shadow-lg' 
                                : ''
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 dark:focus:ring-purple-600 transition-all duration-200`}
                            role="radio"
                            aria-checked={formData.color === color}
                            aria-label={t('doctorDetails.selectColorAriaLabel', { 
                              color: color.replace('bg-gradient-to-br from-', '').replace(' to-', '-')
                            })}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                      <button 
                        type="button" 
                        onClick={handleCancelEdit}
                        className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 font-medium transition-all duration-200"
                      >
                        {t('common.cancel')}
                      </button>
                      <button 
                        type="button" 
                        onClick={handleSave}
                        className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 font-medium shadow-lg shadow-purple-500/30 transition-all duration-200"
                      >
                        {t('common.saveChanges')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Specialty Card */}
                    <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-700">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                          <BriefcaseIcon className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-base md:text-lg font-semibold text-purple-700 dark:text-purple-400">
                          {t('doctorDetails.specialty')}
                        </h3>
                      </div>
                      <p className="text-base md:text-lg text-slate-700 dark:text-slate-300">{doctor.specialty}</p>
                    </div>

                    {/* Appointments Card */}
                    <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-700">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                            <CalendarIcon className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <h3 className="text-base md:text-lg font-semibold text-purple-700 dark:text-purple-400">
                            {t('doctorDetails.appointmentSchedule')}
                          </h3>
                        </div>
                        <span className="sm:ml-auto bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm px-3 py-1 rounded-full">
                          {doctorAppointments.length} {t('doctorDetails.appointments')}
                        </span>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {doctorAppointments.length > 0 ? (
                          <ul className="space-y-2">
                            {doctorAppointments.slice(0, 10).map(apt => (
                              <li key={apt.id}>
                                <AppointmentCard
                                  appointment={apt}
                                  patient={getPatientById(apt.patientId)}
                                  dateTimeFormatter={dateTimeFormatter}
                                  showStatus
                                />
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <EmptyState
                            icon={<CalendarIcon className="h-6 w-6 text-purple-600" />}
                            title={t('doctorDetails.noAppointmentsFound')}
                          />
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'treatments' && (
              <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                      <ChartIcon className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-semibold text-purple-700 dark:text-purple-400">
                        {t('doctorDetails.treatmentsPerformed')}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {filteredTreatments.length} {t('doctorDetails.treatments')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="treatment-filter" className="sr-only">Filter treatments</label>
                    <select
                      id="treatment-filter"
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-purple-200 dark:border-purple-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      value={treatmentFilter}
                      onChange={(e) => setTreatmentFilter(e.target.value as TreatmentFilterType)}
                      aria-label="Filter treatments by time period"
                    >
                      <option value="all">{t('common.allTime') || 'All Time'}</option>
                      <option value="month">{t('common.thisMonth') || 'This Month'}</option>
                      <option value="quarter">{t('common.thisQuarter') || 'This Quarter'}</option>
                      <option value="year">{t('common.thisYear') || 'This Year'}</option>
                    </select>
                  </div>
                </div>
                <div className="max-h-80 md:max-h-96 overflow-y-auto space-y-2">
                  {filteredTreatments.length > 0 ? (
                    <ul className="space-y-3">
                      {filteredTreatments.map((tr, index) => (
                        <TreatmentCard
                          key={tr.id}
                          treatmentRecord={tr}
                          patient={getPatientById(tr.patientId)}
                          treatment={getTreatmentById(tr.treatmentDefinitionId)}
                          dateFormatter={dateFormatter}
                          currencyFormatter={currencyFormatter}
                          isRecent={index < 3}
                        />
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      icon={<ChartIcon className="h-6 w-6 text-purple-600" />}
                      title={t('doctorDetails.noTreatmentsFound')}
                    />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'financials' && (
              <div className="space-y-3 md:space-y-4">
                {/* Financial Summary Cards */}
                <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-700">
                  <h3 className="text-base md:text-lg font-semibold text-purple-700 dark:text-purple-400 mb-3 md:4 flex items-center gap-2">
                    <DollarSignIcon className="h-4 w-4 md:h-5 md:w-5" />
                    {t('doctorDetails.financialSummary')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <FinancialCard
                      title={t('doctorDetails.totalEarnings')}
                      value={currencyFormatter.format(financialSummary.totalEarnings)}
                      icon={<ArrowUpIcon className="h-4 w-4" />}
                      variant="default"
                    />
                    <FinancialCard
                      title={t('doctorDetails.totalPaymentsReceived')}
                      value={currencyFormatter.format(financialSummary.totalPaymentsReceived)}
                      icon={<CheckCircleIcon className="h-4 w-4" />}
                      variant="success"
                    />
                    <div className="col-span-1 sm:col-span-2">
                      <FinancialCard
                        title={t('doctorDetails.netBalance')}
                        value={currencyFormatter.format(financialSummary.netBalance)}
                        icon={financialSummary.netBalance >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowUpIcon className="h-4 w-4" />}
                        variant={financialSummary.netBalance >= 0 ? 'warning' : 'danger'}
                        subtitle={financialSummary.netBalance >= 0 ? t('financials.amountDue') : t('financials.overpaid')}
                      />
                    </div>
                  </div>
                  
                  {/* Add Payment Button */}
                  {financialSummary.netBalance > 0 && (
                    <button
                      onClick={() => setIsAddPaymentModalOpen(true)}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-200"
                      aria-label={t('doctorDetails.addPayment')}
                    >
                      <AddPaymentIcon className="h-4 w-4" />
                      {t('doctorDetails.addPayment')}
                    </button>
                  )}
                </div>

                {/* Transactions */}
                <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-700">
                  <h3 className="text-base md:text-lg font-semibold text-purple-700 dark:text-purple-400 mb-3 md:4 flex items-center gap-2">
                    <PaymentIcon className="h-4 w-4 md:h-5 md:w-5" />
                    {t('doctorDetails.transactions')}
                  </h3>
                  <div className="max-h-64 md:max-h-80 overflow-y-auto space-y-3">
                    {doctorPaymentsList.length === 0 && doctorTreatmentRecords.length === 0 ? (
                      <EmptyState
                        icon={<PaymentIcon className="h-6 w-6 text-purple-600" />}
                        title={t('doctorDetails.noTransactions')}
                      />
                    ) : (
                      <div className="space-y-3">
                        {/* Display payments first */}
                        {doctorPaymentsList.map(payment => (
                          <PaymentTransactionItem
                            key={payment.id}
                            payment={payment}
                            dateFormatter={dateFormatter}
                            currencyFormatter={currencyFormatter}
                            onDelete={handleDeletePayment}
                            deleteLabel={t('common.delete')}
                          />
                        ))}

                        {/* Then display earnings (treatment records) */}
                        {doctorTreatmentRecords.map(record => (
                          <EarningsTransactionItem
                            key={record.id}
                            record={record}
                            patient={getPatientById(record.patientId)}
                            treatment={getTreatmentById(record.treatmentDefinitionId)}
                            dateFormatter={dateFormatter}
                            currencyFormatter={currencyFormatter}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-700">
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <CalendarIcon className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-purple-700 dark:text-purple-400">
                      {t('doctorDetails.appointmentSchedule')}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {doctorAppointments.length} {t('doctorDetails.appointments')}
                    </p>
                  </div>
                </div>
                <div className="max-h-80 md:max-h-96 overflow-y-auto space-y-3">
                  {doctorAppointments.length > 0 ? (
                    <ul className="space-y-3">
                      {doctorAppointments.map(apt => (
                        <li key={apt.id}>
                          <AppointmentCard
                            appointment={apt}
                            patient={getPatientById(apt.patientId)}
                            dateTimeFormatter={dateTimeFormatter}
                            showStatus
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      icon={<CalendarIcon className="h-6 w-6 text-blue-600" />}
                      title={t('doctorDetails.noAppointmentsFound')}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Action Buttons - Removed per user request */}

        {/* Add Payment Modal */}
        {isAddPaymentModalOpen && (
          <AddDoctorPaymentModal
            dentistId={doctor.id}
            onClose={() => setIsAddPaymentModalOpen(false)}
            onAdd={handleAddPayment}
            doctorPayments={clinicData.doctorPayments}
          />
        )}

        {/* Detailed Report Modal */}
        {isReportOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <DoctorDetailedReport
              clinicData={clinicData}
              doctorId={doctor.id}
              onClose={() => setIsReportOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDetailsPage;
