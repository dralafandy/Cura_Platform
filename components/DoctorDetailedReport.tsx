/**
 * DoctorDetailedReport Component
 * 
 * Comprehensive report page displaying all doctor data including:
 * - Profile information
 * - Treatment records
 * - Financial accounts
 * - Appointments schedule
 * 
 * Enhanced with:
 * - Loading states
 * - Date range filtering
 * - Search functionality
 * - Pagination
 * - Print/Export
 * - Trend indicators
 * 
 * @component
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ClinicData } from '../hooks/useClinicData';
import { Dentist, DoctorPayment } from '../types';
import { useI18n } from '../hooks/useI18n';
import {
  CloseIcon,
  UserIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChartIcon,
  PaymentIcon,
  DollarSignIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  SearchIcon,
  FilterIcon,
  PrintIcon,
  ChevronDownIcon,
} from './icons';

// ============================================================================
// Types
// ============================================================================

interface ExpandedItem {
  type: 'treatment' | 'payment' | 'appointment';
  id: string;
}

interface FinancialSummary {
  totalRevenue: number;
  totalEarnings: number;
  totalPaymentsReceived: number;
  netBalance: number;
  avgTreatmentValue: number;
}

interface MonthlyStat {
  month: string;
  treatments: number;
  earnings: number;
}

type DateRange = 'week' | 'month' | 'quarter' | 'year' | 'all';

interface PaginationState {
  page: number;
  itemsPerPage: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

const createDateTimeFormatter = (locale: string) => 
  new Intl.DateTimeFormat(locale, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });

const createDateFormatter = (locale: string) => 
  new Intl.DateTimeFormat(locale, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });

const createCurrencyFormatter = (locale: string) => 
  new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency: 'EGP' 
  });

const getDateRangeStart = (range: DateRange): Date => {
  const now = new Date();
  switch (range) {
    case 'week':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    case 'month':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case 'quarter':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case 'year':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    case 'all':
    default:
      return new Date(0);
  }
};

const getTrendPercentage = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// ============================================================================
// Skeleton Components
// ============================================================================

const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-2xl ${className}`} />
);

const SkeletonListItem: React.FC = () => (
  <div className="py-4 border-b border-slate-100 dark:border-slate-700">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      <div className="flex-1">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
      <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Stats Skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i} className="h-28" />
      ))}
    </div>
    
    {/* Profile Skeleton */}
    <SkeletonCard className="h-48" />
    
    {/* Financial Skeleton */}
    <SkeletonCard className="h-64" />
    
    {/* Lists Skeleton */}
    <SkeletonCard className="h-96" />
  </div>
);

// ============================================================================
// Sub-Components
// ============================================================================

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'purple' | 'blue' | 'green' | 'amber' | 'rose';
}> = ({ title, value, subtitle, icon, trend, trendValue, color = 'purple' }) => {
  const colorClasses = {
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
  };

  const trendColors = {
    up: 'text-emerald-500',
    down: 'text-rose-500',
    neutral: 'text-slate-400',
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-3 md:p-5 rounded-xl md:rounded-2xl shadow-md md:shadow-lg border border-slate-100 dark:border-slate-700">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-0.5 md:mb-1 truncate">{title}</p>
          <div className="flex items-baseline gap-1 md:gap-2">
            <p className="text-lg md:text-2xl font-bold text-slate-800 dark:text-white truncate">{value}</p>
            {trend && trendValue && (
              <span className={`flex items-center text-xs font-medium ${trendColors[trend]} flex-shrink-0`}>
                {trend === 'up' ? <ArrowUpIcon className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5" /> : 
                 trend === 'down' ? <ArrowDownIcon className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5" /> : null}
                <span className="hidden sm:inline">{trendValue}</span>
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 md:mt-1 truncate">{subtitle}</p>}
        </div>
        <div className={`p-1.5 md:p-3 rounded-lg md:rounded-xl ${colorClasses[color]} flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const SectionCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
  defaultCollapsed?: boolean;
}> = ({ title, icon, children, action, defaultCollapsed = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [mobileCollapsed, setMobileCollapsed] = useState(isMobile);

  const isActuallyCollapsed = typeof window !== 'undefined' ? mobileCollapsed : isCollapsed;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 md:p-5 border-b border-slate-100 dark:border-slate-700 cursor-pointer md:cursor-default"
        onClick={() => setMobileCollapsed(!mobileCollapsed)}
      >
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg md:rounded-xl text-purple-600 dark:text-purple-400">
            {icon}
          </div>
          <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white">{title}</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {action}
          <button 
            className="md:hidden p-1 text-slate-400 self-center"
            onClick={(e) => {
              e.stopPropagation();
              setMobileCollapsed(!mobileCollapsed);
            }}
          >
            <svg 
              className={`h-5 w-5 transition-transform ${mobileCollapsed ? '' : 'rotate-180'}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      <div className={`${mobileCollapsed ? 'hidden md:block' : 'block'} p-3 md:p-5`}>
        {children}
      </div>
    </div>
  );
};

const ListItem: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => (
  <div 
    className={`py-2 md:py-3 border-b border-slate-100 dark:border-slate-700 last:border-0 ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

const SearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = 'Search...' }) => (
  <div className="relative w-full max-w-xs">
    <SearchIcon className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg md:rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 touch-manipulation"
    />
  </div>
);

const Pagination: React.FC<{
  pagination: PaginationState;
  totalItems: number;
  onPageChange: (page: number) => void;
}> = ({ pagination, totalItems, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
  
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3">
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 order-2 sm:order-1">
        {((pagination.page - 1) * pagination.itemsPerPage) + 1}-{Math.min(pagination.page * pagination.itemsPerPage, totalItems)} / {totalItems}
      </p>
      <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          className="min-w-[44px] h-10 sm:h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors touch-manipulation"
          aria-label="Previous page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="px-2 py-1 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
          {pagination.page}/{totalPages}
        </span>
        <button
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={pagination.page === totalPages}
          className="min-w-[44px] h-10 sm:h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors touch-manipulation"
          aria-label="Next page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const DateRangeFilter: React.FC<{
  value: DateRange;
  onChange: (value: DateRange) => void;
}> = ({ value, onChange }) => {
  const ranges: { value: DateRange; label: string }[] = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'year', label: 'Year' },
    { value: 'all', label: 'All' },
  ];
  
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl overflow-x-auto">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`px-2.5 md:px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-colors whitespace-nowrap touch-manipulation ${
            value === range.value
              ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const DoctorDetailedReport: React.FC<{
  clinicData: ClinicData;
  doctorId: string;
  onClose: () => void;
}> = ({ clinicData, doctorId, onClose }) => {
  const { t, locale } = useI18n();
  const { appointments, patients, treatmentRecords, treatmentDefinitions, doctorPayments, dentists } = clinicData;
  const reportRef = useRef<HTMLDivElement>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(!dentists.length);
  
  // Filter states
  const [dateRange, setDateRange] = useState<DateRange>('month');
  
  // Search states
  const [treatmentSearch, setTreatmentSearch] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [appointmentSearch, setAppointmentSearch] = useState('');
  
  // Pagination states
  const [treatmentPagination, setTreatmentPagination] = useState<PaginationState>({ page: 1, itemsPerPage: 10 });
  const [paymentPagination, setPaymentPagination] = useState<PaginationState>({ page: 1, itemsPerPage: 10 });
  const [appointmentPagination, setAppointmentPagination] = useState<PaginationState>({ page: 1, itemsPerPage: 10 });

  // Expanded item state for interactive details
  const [expandedItem, setExpandedItem] = useState<ExpandedItem | null>(null);
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);

  // Toggle expanded item
  const toggleExpanded = (type: 'treatment' | 'payment' | 'appointment', id: string) => {
    setExpandedItem(prev => 
      prev?.id === id && prev?.type === type ? null : { type, id }
    );
  };

  // Update loading state when data arrives
  React.useEffect(() => {
    if (dentists.length > 0) {
      setIsLoading(false);
    }
  }, [dentists]);

  const dateTimeFormatter = useMemo(() => createDateTimeFormatter(locale), [locale]);
  const dateFormatter = useMemo(() => createDateFormatter(locale), [locale]);
  const currencyFormatter = useMemo(() => createCurrencyFormatter(locale), [locale]);

  // Find doctor
  const doctor = useMemo(() => 
    dentists.find(d => d.id === doctorId),
    [dentists, doctorId]
  );

  // Date range filter function
  const filterByDateRange = <T extends { treatmentDate?: string; date?: string; startTime?: Date }>(
    items: T[],
    dateField: 'treatmentDate' | 'date' | 'startTime'
  ): T[] => {
    if (dateRange === 'all') return items;
    
    const startDate = getDateRangeStart(dateRange);
    return items.filter(item => {
      const itemDate = item[dateField];
      if (!itemDate) return false;
      const date = typeof itemDate === 'string' ? new Date(itemDate) : itemDate;
      return date >= startDate;
    });
  };

  // Computed data with date filtering
  const doctorAppointments = useMemo(() => 
    appointments
      .filter(a => a.dentistId === doctor?.id)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()),
    [appointments, doctor?.id]
  );

  const filteredAppointments = useMemo(() => 
    filterByDateRange(doctorAppointments, 'startTime'),
    [doctorAppointments, dateRange]
  );

  const doctorTreatmentRecords = useMemo(() => 
    treatmentRecords
      .filter(tr => tr.dentistId === doctor?.id)
      .sort((a, b) => new Date(b.treatmentDate).getTime() - new Date(a.treatmentDate).getTime()),
    [treatmentRecords, doctor?.id]
  );

  const filteredTreatmentRecords = useMemo(() => 
    filterByDateRange(doctorTreatmentRecords, 'treatmentDate'),
    [doctorTreatmentRecords, dateRange]
  );

  const doctorPaymentsList = useMemo(() => 
    (doctorPayments || [])
      .filter(p => p.dentistId === doctor?.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [doctorPayments, doctor?.id]
  );

  const filteredPayments = useMemo(() => 
    filterByDateRange(doctorPaymentsList, 'date'),
    [doctorPaymentsList, dateRange]
  );

  // Search filtered data
  const searchedTreatments = useMemo(() => {
    if (!treatmentSearch) return filteredTreatmentRecords;
    const search = treatmentSearch.toLowerCase();
    return filteredTreatmentRecords.filter(tr => {
      const patient = patients.find(p => p.id === tr.patientId);
      const treatment = treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
      return (
        patient?.name.toLowerCase().includes(search) ||
        treatment?.name.toLowerCase().includes(search)
      );
    });
  }, [filteredTreatmentRecords, treatmentSearch, patients, treatmentDefinitions]);

  const searchedPayments = useMemo(() => {
    if (!paymentSearch) return filteredPayments;
    const search = paymentSearch.toLowerCase();
    return filteredPayments.filter(p => 
      p.notes?.toLowerCase().includes(search) ||
      p.amount.toString().includes(search)
    );
  }, [filteredPayments, paymentSearch]);

  const searchedAppointments = useMemo(() => {
    if (!appointmentSearch) return filteredAppointments;
    const search = appointmentSearch.toLowerCase();
    return filteredAppointments.filter(apt => {
      const patient = patients.find(p => p.id === apt.patientId);
      return patient?.name.toLowerCase().includes(search);
    });
  }, [filteredAppointments, appointmentSearch, patients]);

  // Paginated data
  const paginatedTreatments = useMemo(() => {
    const start = (treatmentPagination.page - 1) * treatmentPagination.itemsPerPage;
    return searchedTreatments.slice(start, start + treatmentPagination.itemsPerPage);
  }, [searchedTreatments, treatmentPagination]);

  const paginatedPayments = useMemo(() => {
    const start = (paymentPagination.page - 1) * paymentPagination.itemsPerPage;
    return searchedPayments.slice(start, start + paymentPagination.itemsPerPage);
  }, [searchedPayments, paymentPagination]);

  const paginatedAppointments = useMemo(() => {
    const start = (appointmentPagination.page - 1) * appointmentPagination.itemsPerPage;
    return searchedAppointments.slice(start, start + appointmentPagination.itemsPerPage);
  }, [searchedAppointments, appointmentPagination]);

  // Reset pagination when search changes
  React.useEffect(() => {
    setTreatmentPagination(prev => ({ ...prev, page: 1 }));
  }, [treatmentSearch]);

  React.useEffect(() => {
    setPaymentPagination(prev => ({ ...prev, page: 1 }));
  }, [paymentSearch]);

  React.useEffect(() => {
    setAppointmentPagination(prev => ({ ...prev, page: 1 }));
  }, [appointmentSearch]);

  // Financial calculations - use filtered data (date range only, not search)
  const financialSummary = useMemo((): FinancialSummary => {
    const totalRevenue = filteredTreatmentRecords.reduce((sum, tr) => {
      const treatmentDef = treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
      return sum + (treatmentDef ? treatmentDef.basePrice : 0);
    }, 0);
    const totalEarnings = filteredTreatmentRecords.reduce((sum, tr) => sum + tr.doctorShare, 0);
    const totalPaymentsReceived = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const netBalance = totalEarnings - totalPaymentsReceived;
    const avgTreatmentValue = filteredTreatmentRecords.length > 0 ? totalEarnings / filteredTreatmentRecords.length : 0;
    return { totalRevenue, totalEarnings, totalPaymentsReceived, netBalance, avgTreatmentValue };
  }, [filteredTreatmentRecords, filteredPayments, treatmentDefinitions]);

  // Compare with previous period for trends - use original data for accurate comparison
  const previousPeriodStats = useMemo(() => {
    const now = new Date();
    let prevStart: Date;
    let prevEnd: Date;
    
    switch (dateRange) {
      case 'week':
        prevEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        break;
      case 'month':
        prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        prevStart = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
        break;
      case 'quarter':
        prevEnd = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        prevStart = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case 'year':
        prevEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        prevStart = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
        break;
      default:
        prevEnd = new Date(0);
        prevStart = new Date(0);
    }
    
    const prevTreatments = doctorTreatmentRecords.filter(tr => {
      const date = new Date(tr.treatmentDate);
      return date >= prevStart && date <= prevEnd;
    });
    
    const prevEarnings = prevTreatments.reduce((sum, tr) => sum + tr.doctorShare, 0);
    const prevTreatmentsCount = prevTreatments.length;
    
    return { prevEarnings, prevTreatmentsCount };
  }, [doctorTreatmentRecords, dateRange]);

  const earningsTrend = useMemo(() => {
    if (previousPeriodStats.prevEarnings === 0) {
      return financialSummary.totalEarnings > 0 ? 'up' : 'neutral';
    }
    return financialSummary.totalEarnings >= previousPeriodStats.prevEarnings ? 'up' : 'down';
  }, [financialSummary.totalEarnings, previousPeriodStats.prevEarnings]);

  const earningsTrendValue = useMemo(() => {
    const percent = getTrendPercentage(financialSummary.totalEarnings, previousPeriodStats.prevEarnings);
    return `${Math.abs(percent).toFixed(1)}%`;
  }, [financialSummary.totalEarnings, previousPeriodStats.prevEarnings]);

  const treatmentsTrend = useMemo(() => {
    if (previousPeriodStats.prevTreatmentsCount === 0) {
      return filteredTreatmentRecords.length > 0 ? 'up' : 'neutral';
    }
    return filteredTreatmentRecords.length >= previousPeriodStats.prevTreatmentsCount ? 'up' : 'down';
  }, [filteredTreatmentRecords.length, previousPeriodStats.prevTreatmentsCount]);

  const treatmentsTrendValue = useMemo(() => {
    const percent = getTrendPercentage(filteredTreatmentRecords.length, previousPeriodStats.prevTreatmentsCount);
    return `${Math.abs(percent).toFixed(1)}%`;
  }, [filteredTreatmentRecords.length, previousPeriodStats.prevTreatmentsCount]);

  const upcomingAppointments = useMemo(() => 
    filteredAppointments.filter(a => a.startTime > new Date()).length,
    [filteredAppointments]
  );

  const completedAppointments = useMemo(() => 
    filteredAppointments.filter(a => (a.status as string) === 'completed').length,
    [filteredAppointments]
  );

  const thisMonthEarnings = useMemo(() => {
    const now = new Date();
    return doctorTreatmentRecords
      .filter(tr => {
        const date = new Date(tr.treatmentDate);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, tr) => sum + tr.doctorShare, 0);
  }, [doctorTreatmentRecords]);

  // Monthly statistics for chart
  const monthlyStats = useMemo((): MonthlyStat[] => {
    const stats: Map<string, MonthlyStat> = new Map();
    const now = new Date();
    
    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleString(locale, { year: 'numeric', month: 'short' });
      stats.set(monthKey, { month: monthKey, treatments: 0, earnings: 0 });
    }

    filteredTreatmentRecords.forEach(tr => {
      const date = new Date(tr.treatmentDate);
      const monthKey = date.toLocaleString(locale, { year: 'numeric', month: 'short' });
      const existing = stats.get(monthKey);
      if (existing) {
        existing.treatments += 1;
        existing.earnings += tr.doctorShare;
      }
    });

    return Array.from(stats.values());
  }, [filteredTreatmentRecords, locale]);

  const maxEarnings = Math.max(...monthlyStats.map(s => s.earnings), 1);

  // Get unique patients count
  const uniquePatients = useMemo(() => {
    const patientIds = new Set(filteredTreatmentRecords.map(tr => tr.patientId));
    return patientIds.size;
  }, [filteredTreatmentRecords]);

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-full bg-slate-50 dark:bg-slate-900">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="h-8 w-8 bg-white/20 rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-full bg-slate-50 dark:bg-slate-900 p-4 md:p-6">
        <div className="max-w-7xl mx-auto text-center py-12">
          <p className="text-slate-500">Doctor not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-900" ref={reportRef}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white print:bg-white print:text-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 py-3 md:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-white/20 rounded-xl transition-colors flex-shrink-0"
                aria-label="Close report"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold truncate">{t('doctorDetailedReport.title') || 'Doctor Report'}</h1>
                <p className="text-purple-200 text-sm truncate">{doctor.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors print:hidden"
                aria-label="Print report"
              >
                <PrintIcon className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">{t('doctorDetailedReport.print') || 'Print'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 md:px-4 lg:px-6 py-3 md:py-6 space-y-3 md:space-y-6">
        {/* Date Range Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
          <h2 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white">
            {t('doctorDetailedReport.overview') || 'Overview'}
          </h2>
          <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <StatCard
            title={t('doctorDetailedReport.treatments') || 'Treatments'}
            value={filteredTreatmentRecords.length}
            subtitle={`${uniquePatients} ${t('doctorDetailedReport.patients') || 'pts'}`}
            icon={<ChartIcon className="h-4 w-4 md:h-5 md:w-5" />}
            trend={treatmentsTrend}
            trendValue={treatmentsTrendValue}
            color="purple"
          />
          <StatCard
            title={t('doctorDetailedReport.earnings') || 'Earnings'}
            value={currencyFormatter.format(financialSummary.totalEarnings)}
            subtitle={`${filteredTreatmentRecords.length} ${t('doctorDetailedReport.treatments') || 'trt'}`}
            icon={<DollarSignIcon className="h-4 w-4 md:h-5 md:w-5" />}
            trend={earningsTrend}
            trendValue={earningsTrendValue}
            color="green"
          />
          <StatCard
            title={t('doctorDetailedReport.appointments') || 'Appts'}
            value={filteredAppointments.length}
            subtitle={`${upcomingAppointments} ${t('doctorDetailedReport.upcoming') || 'upcoming'}`}
            icon={<CalendarIcon className="h-4 w-4 md:h-5 md:w-5" />}
            color="blue"
          />
          <StatCard
            title={t('doctorDetailedReport.balance') || 'Balance'}
            value={currencyFormatter.format(financialSummary.netBalance)}
            subtitle={financialSummary.netBalance >= 0 
              ? t('doctorDetailedReport.due') || 'Due'
              : t('doctorDetailedReport.overpaid') || 'Overpaid'
            }
            icon={financialSummary.netBalance >= 0 
              ? <ArrowUpIcon className="h-4 w-4 md:h-5 md:w-5" />
              : <ArrowUpIcon className="h-4 w-4 md:h-5 md:w-5" />
            }
            color={financialSummary.netBalance >= 0 ? 'amber' : 'rose'}
          />
        </div>

        {/* Doctor Profile */}
        <SectionCard
          title={t('doctorDetailedReport.profile') || 'Doctor Profile'}
          icon={<UserIcon className="h-5 w-5" />}
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className={`w-24 h-24 rounded-2xl ${doctor.color} flex items-center justify-center text-white text-4xl font-bold shadow-lg`}>
              {doctor.name.charAt(0)}
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('doctorDetailedReport.name') || 'Name'}</p>
                <p className="font-semibold text-slate-800 dark:text-white">{doctor.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('doctorDetailedReport.specialty') || 'Specialty'}</p>
                <p className="font-semibold text-slate-800 dark:text-white">{doctor.specialty}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('doctorDetailedReport.id') || 'Doctor ID'}</p>
                <p className="font-semibold text-slate-800 dark:text-white font-mono text-sm">{doctor.id}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('doctorDetailedReport.status') || 'Status'}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Active
                </span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Financial Summary */}
        <SectionCard
          title={t('doctorDetailedReport.financialSummary') || 'Financial Summary'}
          icon={<PaymentIcon className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <ChartIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  {t('doctorDetailedReport.totalEarnings') || 'Total Earnings'}
                </p>
              </div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {currencyFormatter.format(financialSummary.totalEarnings)}
              </p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {t('doctorDetailedReport.paymentsReceived') || 'Payments Received'}
                </p>
              </div>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {currencyFormatter.format(financialSummary.totalPaymentsReceived)}
              </p>
            </div>
            <div className="sm:col-span-2">
              <div className={`p-4 rounded-xl border-2 ${
                financialSummary.netBalance >= 0
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
                  : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm ${
                        financialSummary.netBalance >= 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {t('doctorDetailedReport.netBalance') || 'Net Balance'}
                      </p>
                    </div>
                    <p className={`text-3xl font-bold ${
                      financialSummary.netBalance >= 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {currencyFormatter.format(financialSummary.netBalance)}
                    </p>
                    <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">
                      {financialSummary.netBalance >= 0 
                        ? t('doctorDetailedReport.amountDue') || 'Amount due to doctor'
                        : t('doctorDetailedReport.overpaid') || 'Overpaid'
                      }
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${
                    financialSummary.netBalance >= 0
                      ? 'bg-amber-200 dark:bg-amber-700'
                      : 'bg-rose-200 dark:bg-rose-700'
                  }`}>
                    <ArrowUpIcon className={`h-6 w-6 ${
                      financialSummary.netBalance >= 0
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-rose-700 dark:text-rose-300'
                    }`} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Average Treatment Value */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('doctorDetailedReport.avgEarningsPerTreatment') || 'Average Earnings per Treatment'}
                </p>
                <p className="text-xl font-bold text-slate-700 dark:text-slate-200">
                  {currencyFormatter.format(financialSummary.avgTreatmentValue)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {filteredTreatmentRecords.length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('doctorDetailedReport.treatments') || 'Treatments'}
                </p>
              </div>
            </div>
          </div>

          {/* Monthly Earnings Chart */}
          <div>
            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">
              {t('doctorDetailedReport.monthlyEarnings') || 'Monthly Earnings (Last 6 Months)'}
            </h4>
            <div className="flex items-end gap-2 h-32">
              {monthlyStats.map((stat, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-500"
                    style={{ 
                      height: `${(stat.earnings / maxEarnings) * 100}%`,
                      minHeight: stat.earnings > 0 ? '8px' : '2px'
                    }}
                    title={`${stat.month}: ${currencyFormatter.format(stat.earnings)}`}
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate w-full text-center">
                    {stat.month.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Treatment Records */}
        <SectionCard
          title={t('doctorDetailedReport.treatmentRecords') || 'Treatment Records'}
          icon={<ChartIcon className="h-5 w-5" />}
          action={
            <div className="w-full sm:max-w-64 print:hidden">
              <SearchInput
                value={treatmentSearch}
                onChange={setTreatmentSearch}
                placeholder={t('doctorDetailedReport.searchTreatments') || 'Search treatments...'}
              />
            </div>
          }
        >
          {searchedTreatments.length > 0 ? (
            <>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {paginatedTreatments.map(tr => {
                  const patient = patients.find(p => p.id === tr.patientId);
                  const treatment = treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
                  const isExpanded = expandedItem?.type === 'treatment' && expandedItem?.id === tr.id;
                  return (
                    <ListItem key={tr.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" onClick={() => toggleExpanded('treatment', tr.id)}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {treatment?.name?.charAt(0) || 'T'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-800 dark:text-white text-sm md:text-base truncate">
                              {treatment?.name || 'Unknown Treatment'}
                            </p>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 truncate">
                              {patient?.name || 'Unknown Patient'} • {dateFormatter.format(new Date(tr.treatmentDate))}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <p className="font-bold text-purple-600 dark:text-purple-400 text-sm md:text-base">
                              {currencyFormatter.format(tr.doctorShare)}
                            </p>
                            <p className="text-xs text-slate-400 hidden sm:block">{t('doctorDetailedReport.doctorShare') || 'Share'}</p>
                          </div>
                          <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''} flex-shrink-0`} />
                        </div>
                      </div>
                      {/* Expanded Details */}
                      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-40 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">{t('treatments.totalCost') || 'Total Cost'}</p>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{currencyFormatter.format(tr.totalTreatmentCost)}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">{t('doctorDetailedReport.clinicShare') || 'Clinic Share'}</p>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{currencyFormatter.format(tr.clinicShare)}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-slate-500 dark:text-slate-400 text-xs">{t('treatments.date') || 'Date'}</p>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{dateTimeFormatter.format(new Date(tr.treatmentDate))}</p>
                          </div>
                        </div>
                      </div>
                    </ListItem>
                  );
                })}
              </div>
              <Pagination
                pagination={treatmentPagination}
                totalItems={searchedTreatments.length}
                onPageChange={(page) => setTreatmentPagination(prev => ({ ...prev, page }))}
              />
            </>
          ) : (
            <p className="text-center text-slate-500 py-8">
              {t('doctorDetailedReport.noTreatments') || 'No treatment records found'}
            </p>
          )}
        </SectionCard>

        {/* Payment History */}
        <SectionCard
          title={t('doctorDetailedReport.paymentHistory') || 'Payment History'}
          icon={<DollarSignIcon className="h-5 w-5" />}
          action={
            <div className="w-full sm:max-w-64 print:hidden">
              <SearchInput
                value={paymentSearch}
                onChange={setPaymentSearch}
                placeholder={t('doctorDetailedReport.searchPayments') || 'Search payments...'}
              />
            </div>
          }
        >
          {searchedPayments.length > 0 ? (
            <>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {paginatedPayments.map(payment => (
                  <ListItem key={payment.id} className="touch-manipulation">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800 dark:text-white text-sm md:text-base">
                          {currencyFormatter.format(payment.amount)}
                        </p>
                        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 truncate">
                          {dateFormatter.format(new Date(payment.date))}
                          {payment.notes && ` • ${payment.notes}`}
                        </p>
                      </div>
                      <CheckCircleIcon className="h-4 w-4 md:h-5 md:w-5 text-emerald-500 flex-shrink-0" />
                    </div>
                  </ListItem>
                ))}
              </div>
              <Pagination
                pagination={paymentPagination}
                totalItems={searchedPayments.length}
                onPageChange={(page) => setPaymentPagination(prev => ({ ...prev, page }))}
              />
            </>
          ) : (
            <p className="text-center text-slate-500 py-8">
              {t('doctorDetailedReport.noPayments') || 'No payments recorded'}
            </p>
          )}
        </SectionCard>

        {/* Appointments */}
        <SectionCard
          title={t('doctorDetailedReport.appointments') || 'Appointments'}
          icon={<CalendarIcon className="h-5 w-5" />}
          action={
            <div className="w-full sm:max-w-64 print:hidden">
              <SearchInput
                value={appointmentSearch}
                onChange={setAppointmentSearch}
                placeholder={t('doctorDetailedReport.searchAppointments') || 'Search appointments...'}
              />
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 md:p-4 rounded-xl text-center">
              <p className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{upcomingAppointments}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">{t('doctorDetailedReport.upcoming') || 'Upcoming'}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 md:p-4 rounded-xl text-center">
              <p className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{completedAppointments}</p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">{t('doctorDetailedReport.completed') || 'Completed'}</p>
            </div>
          </div>
          
          {searchedAppointments.length > 0 ? (
            <>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {paginatedAppointments.map(apt => {
                  const patient = patients.find(p => p.id === apt.patientId);
                  const isUpcoming = apt.startTime > new Date();
                  return (
                    <ListItem key={apt.id}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 md:gap-4 min-w-0">
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 ${
                            isUpcoming 
                              ? 'bg-gradient-to-br from-blue-400 to-blue-600' 
                              : 'bg-gradient-to-br from-slate-400 to-slate-600'
                          }`}>
                            {patient?.name?.charAt(0) || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 dark:text-white text-sm md:text-base truncate">
                              {patient?.name || 'Unknown Patient'}
                            </p>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 truncate">
                              {dateTimeFormatter.format(apt.startTime)}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                          (apt.status as string) === 'confirmed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          (apt.status as string) === 'scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          (apt.status as string) === 'completed' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                          (apt.status as string) === 'cancelled' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                    </ListItem>
                  );
                })}
              </div>
              <Pagination
                pagination={appointmentPagination}
                totalItems={searchedAppointments.length}
                onPageChange={(page) => setAppointmentPagination(prev => ({ ...prev, page }))}
              />
            </>
          ) : (
            <p className="text-center text-slate-500 py-8">
              {t('doctorDetailedReport.noAppointments') || 'No appointments found'}
            </p>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default DoctorDetailedReport;
