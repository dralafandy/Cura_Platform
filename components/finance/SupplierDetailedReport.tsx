/**
 * SupplierDetailedReport Component
 * 
 * Comprehensive report page displaying all supplier data including:
 * - Profile information with avatar
 * - Supplier invoices
 * - Payments/Expenses
 * - Financial summary with charts
 * 
 * Enhanced with:
 * - Loading states
 * - Date range filtering
 * - Search functionality
 * - Pagination
 * - Print/Export
 * - Expandable details
 * - Monthly statistics chart
 * - Trend indicators
 * 
 * @component
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { Supplier, SupplierInvoice, Expense } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import {
  CloseIcon,
  UserIcon,
  SearchIcon,
  PrintIcon,
  ChevronDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  ChartIcon,
  PaymentIcon,
  DollarSignIcon,
} from '../icons';

// ============================================================================
// Types
// ============================================================================

interface ExpandedItem {
  type: 'invoice' | 'payment';
  id: string;
}

interface FinancialSummary {
  totalBilled: number;
  totalPaid: number;
  outstandingBalance: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  unpaidInvoiceCount: number;
  avgInvoiceValue: number;
}

interface MonthlyStat {
  month: string;
  invoices: number;
  amount: number;
  payments: number;
  paidAmount: number;
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
    <div className="bg-white dark:bg-slate-800 p-3 md:p-5 rounded-xl md:rounded-2xl shadow-md md:shadow-lg border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300">
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
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div 
        className="flex items-center justify-between p-3 md:p-5 border-b border-slate-100 dark:border-slate-700 cursor-pointer md:cursor-default"
        onClick={() => setMobileCollapsed(!mobileCollapsed)}
      >
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg md:rounded-xl text-white shadow-md">
            {icon}
          </div>
          <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {action}
          <button 
            className="md:hidden p-1 text-slate-400"
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
    className={`py-2 md:py-3 border-b border-slate-100 dark:border-slate-700 last:border-0 ${className} ${onClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors' : ''}`}
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
  <div className="relative w-full">
    <SearchIcon className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg md:rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all touch-manipulation"
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
  labels: { value: DateRange; label: string }[];
}> = ({ value, onChange, labels }) => {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl overflow-x-auto">
      {labels.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`px-2.5 md:px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-all whitespace-nowrap touch-manipulation ${
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

interface SupplierDetailedReportProps {
  supplierId: string;
  clinicData: ClinicData;
  onClose?: () => void;
}

const SupplierDetailedReport: React.FC<SupplierDetailedReportProps> = ({ 
  supplierId, 
  clinicData, 
  onClose 
}) => {
  const { t, locale } = useI18n();
  const { suppliers, supplierInvoices, expenses } = clinicData;

  // Find the supplier from clinicData
  const supplier = useMemo(() => 
    suppliers.find(s => s.id === supplierId),
    [suppliers, supplierId]
  );

  // Loading state - check if suppliers are loaded
  const isLoading = useMemo(() => 
    suppliers.length === 0,
    [suppliers]
  );
  
  const dateFormatter = createDateFormatter(locale);
  const dateTimeFormatter = createDateTimeFormatter(locale);
  const currencyFormatter = createCurrencyFormatter(locale);

  // State
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItem, setExpandedItem] = useState<ExpandedItem | null>(null);
  const [invoicePagination, setInvoicePagination] = useState<PaginationState>({ page: 1, itemsPerPage: 10 });
  const [paymentPagination, setPaymentPagination] = useState<PaginationState>({ page: 1, itemsPerPage: 10 });
  
  const reportRef = useRef<HTMLDivElement>(null);

  // Date range labels
  const dateRangeLabels: { value: DateRange; label: string }[] = [
    { value: 'week', label: t('dateRange.week') || 'Week' },
    { value: 'month', label: t('dateRange.month') || 'Month' },
    { value: 'quarter', label: t('dateRange.quarter') || 'Quarter' },
    { value: 'year', label: t('dateRange.year') || 'Year' },
    { value: 'all', label: t('dateRange.all') || 'All' },
  ];

  // Filter and calculate data
  const dateFilteredData = useMemo(() => {
    const startDate = getDateRangeStart(dateRange);
    
    // Filter invoices
    const filteredInvoices = supplierInvoices
      .filter(inv => inv.supplierId === supplier.id)
      .filter(inv => new Date(inv.invoiceDate) >= startDate);
    
    // Filter expenses (payments to supplier)
    const filteredExpenses = expenses
      .filter(exp => exp.supplierId === supplier.id)
      .filter(exp => new Date(exp.date) >= startDate);

    return { filteredInvoices, filteredExpenses };
  }, [supplierInvoices, expenses, supplier.id, dateRange]);

  // Financial summary
  const financialSummary = useMemo((): FinancialSummary => {
    const { filteredInvoices, filteredExpenses } = dateFilteredData;
    
    const totalBilled = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const outstandingBalance = totalBilled - totalPaid;
    
    const invoiceCount = filteredInvoices.length;
    const paidInvoiceCount = filteredInvoices.filter(inv => inv.status === 'PAID').length;
    const unpaidInvoiceCount = filteredInvoices.filter(inv => inv.status === 'UNPAID').length;
    const avgInvoiceValue = invoiceCount > 0 ? totalBilled / invoiceCount : 0;

    return { totalBilled, totalPaid, outstandingBalance, invoiceCount, paidInvoiceCount, unpaidInvoiceCount, avgInvoiceValue };
  }, [dateFilteredData]);

  // Search filtering
  const { filteredInvoices, filteredExpenses } = useMemo(() => {
    const { filteredInvoices: inv, filteredExpenses: exp } = dateFilteredData;
    
    const searchLower = searchQuery.toLowerCase();
    
    const searchedInvoices = searchQuery 
      ? inv.filter(inv => 
          inv.invoiceNumber?.toLowerCase().includes(searchLower) ||
          inv.status.toLowerCase().includes(searchLower)
        )
      : inv;
    
    const searchedExpenses = searchQuery
      ? exp.filter(exp =>
          exp.description.toLowerCase().includes(searchLower) ||
          exp.category.toLowerCase().includes(searchLower)
        )
      : exp;

    return { 
      filteredInvoices: searchedInvoices.sort((a, b) => 
        new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
      ), 
      filteredExpenses: searchedExpenses.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    };
  }, [dateFilteredData, searchQuery]);

  // Pagination
  const paginatedInvoices = useMemo(() => {
    const start = (invoicePagination.page - 1) * invoicePagination.itemsPerPage;
    return filteredInvoices.slice(start, start + invoicePagination.itemsPerPage);
  }, [filteredInvoices, invoicePagination]);

  const paginatedPayments = useMemo(() => {
    const start = (paymentPagination.page - 1) * paymentPagination.itemsPerPage;
    return filteredExpenses.slice(start, start + paymentPagination.itemsPerPage);
  }, [filteredExpenses, paymentPagination]);

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Handle expand/collapse
  const toggleExpand = (type: 'invoice' | 'payment', id: string) => {
    if (expandedItem?.type === type && expandedItem?.id === id) {
      setExpandedItem(null);
    } else {
      setExpandedItem({ type, id });
    }
  };

  // Calculate trends (compare current period with previous)
  const trends = useMemo((): { billed: number; paid: number } => {
    const now = new Date();
    let previousStart: Date;
    let currentStart: Date;
    
    switch (dateRange) {
      case 'week':
        currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        break;
      case 'month':
        currentStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        previousStart = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
        break;
      case 'quarter':
        currentStart = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        previousStart = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case 'year':
        currentStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        previousStart = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
        break;
      default:
        return { billed: 0, paid: 0 };
    }

    const currentInvoices = supplierInvoices.filter(
      inv => inv.supplierId === supplier.id && 
             new Date(inv.invoiceDate) >= currentStart
    );
    const previousInvoices = supplierInvoices.filter(
      inv => inv.supplierId === supplier.id && 
             new Date(inv.invoiceDate) >= previousStart && 
             new Date(inv.invoiceDate) < currentStart
    );

    const currentPayments = expenses.filter(
      exp => exp.supplierId === supplier.id && 
             new Date(exp.date) >= currentStart
    );
    const previousPayments = expenses.filter(
      exp => exp.supplierId === supplier.id && 
             new Date(exp.date) >= previousStart && 
             new Date(exp.date) < currentStart
    );

    const currentBilled = currentInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const previousBilled = previousInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    
    const currentPaid = currentPayments.reduce((sum, exp) => sum + exp.amount, 0);
    const previousPaid = previousPayments.reduce((sum, exp) => sum + exp.amount, 0);

    return {
      billed: getTrendPercentage(currentBilled, previousBilled),
      paid: getTrendPercentage(currentPaid, previousPaid)
    };
  }, [supplierInvoices, expenses, supplier.id, dateRange]);

  // Monthly statistics for chart
  const monthlyStats = useMemo((): MonthlyStat[] => {
    const stats: Map<string, MonthlyStat> = new Map();
    const now = new Date();
    
    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleString(locale, { year: 'numeric', month: 'short' });
      stats.set(monthKey, { month: monthKey, invoices: 0, amount: 0, payments: 0, paidAmount: 0 });
    }

    // Get all invoices for this supplier (not filtered by date range)
    const allInvoices = supplierInvoices.filter(inv => inv.supplierId === supplier.id);
    const allExpenses = expenses.filter(exp => exp.supplierId === supplier.id);

    allInvoices.forEach(inv => {
      const date = new Date(inv.invoiceDate);
      const monthKey = date.toLocaleString(locale, { year: 'numeric', month: 'short' });
      const existing = stats.get(monthKey);
      if (existing) {
        existing.invoices += 1;
        existing.amount += inv.amount;
      }
    });

    allExpenses.forEach(exp => {
      const date = new Date(exp.date);
      const monthKey = date.toLocaleString(locale, { year: 'numeric', month: 'short' });
      const existing = stats.get(monthKey);
      if (existing) {
        existing.payments += 1;
        existing.paidAmount += exp.amount;
      }
    });

    return Array.from(stats.values());
  }, [supplierInvoices, expenses, supplier.id, locale]);

  const maxAmount = Math.max(...monthlyStats.map(s => Math.max(s.amount, s.paidAmount)), 1);

  // Get supplier type display
  const getSupplierTypeDisplay = () => {
    if (supplier.type === 'Dental Lab') {
      return t('supplierDetailedReport.dentalLab') || 'Dental Lab';
    }
    return t('supplierDetailedReport.materialSupplier') || 'Material Supplier';
  };

  // Get supplier avatar color based on type
  const getSupplierAvatarColor = () => {
    if (supplier.type === 'Dental Lab') {
      return 'bg-gradient-to-br from-cyan-500 to-blue-600';
    }
    return 'bg-gradient-to-br from-purple-500 to-indigo-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 md:p-6">
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" ref={reportRef}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white print:bg-white print:text-black sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 py-3 md:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2.5 hover:bg-white/20 rounded-xl transition-colors flex-shrink-0"
                  aria-label="Close report"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              )}
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold truncate">{t('supplierDetailedReport.title') || 'Supplier Report'}</h1>
                <p className="text-indigo-200 text-sm truncate">{supplier.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors print:hidden"
                aria-label="Print report"
              >
                <PrintIcon className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">{t('common.print') || 'Print'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 md:px-4 lg:px-6 space-y-3 md:space-y-6 py-4">
        {/* Date Range Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
          <h2 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white">
            {t('supplierDetailedReport.overview') || 'Overview'}
          </h2>
          <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            <DateRangeFilter 
              value={dateRange} 
              onChange={(range) => {
                setDateRange(range);
                setInvoicePagination(prev => ({ ...prev, page: 1 }));
                setPaymentPagination(prev => ({ ...prev, page: 1 }));
              }}
              labels={dateRangeLabels}
            />
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <StatCard
            title={t('supplierDetailedReport.totalBilled') || 'Total Billed'}
            value={currencyFormatter.format(financialSummary.totalBilled)}
            subtitle={`${financialSummary.invoiceCount} ${t('supplierDetailedReport.invoices') || 'invoices'}`}
            icon={<ChartIcon className="h-4 w-4 md:h-5 md:w-5" />}
            trend={trends.billed > 0 ? 'up' : trends.billed < 0 ? 'down' : 'neutral'}
            trendValue={`${Math.abs(trends.billed).toFixed(1)}%`}
            color="blue"
          />
          <StatCard
            title={t('supplierDetailedReport.totalPaid') || 'Total Paid'}
            value={currencyFormatter.format(financialSummary.totalPaid)}
            subtitle={`${financialSummary.paidInvoiceCount} ${t('supplierDetailedReport.paidInvoices') || 'paid'}`}
            icon={<ArrowUpIcon className="h-4 w-4 md:h-5 md:w-5" />}
            trend={trends.paid > 0 ? 'up' : trends.paid < 0 ? 'down' : 'neutral'}
            trendValue={`${Math.abs(trends.paid).toFixed(1)}%`}
            color="green"
          />
          <StatCard
            title={t('supplierDetailedReport.outstanding') || 'Outstanding'}
            value={currencyFormatter.format(financialSummary.outstandingBalance)}
            subtitle={`${financialSummary.unpaidInvoiceCount} ${t('supplierDetailedReport.unpaidInvoices') || 'unpaid'}`}
            icon={<DollarSignIcon className="h-4 w-4 md:h-5 md:w-5" />}
            color="amber"
          />
          <StatCard
            title={t('supplierDetailedReport.netBalance') || 'Net Balance'}
            value={currencyFormatter.format(financialSummary.outstandingBalance)}
            subtitle={financialSummary.outstandingBalance >= 0 
              ? t('supplierDetailedReport.toPay') || 'To Pay'
              : t('supplierDetailedReport.overpaid') || 'Overpaid'
            }
            icon={<PaymentIcon className="h-4 w-4 md:h-5 md:w-5" />}
            color={financialSummary.outstandingBalance > 0 ? 'rose' : 'green'}
          />
        </div>

        {/* Supplier Profile */}
        <SectionCard
          title={t('supplierDetailedReport.profile') || 'Supplier Profile'}
          icon={<UserIcon className="h-5 w-5" />}
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className={`w-24 h-24 rounded-2xl ${getSupplierAvatarColor()} flex items-center justify-center text-white text-4xl font-bold shadow-lg`}>
              {supplier.name.charAt(0)}
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('supplierDetailedReport.supplierName') || 'Name'}</p>
                <p className="font-semibold text-slate-800 dark:text-white">{supplier.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('supplierDetailedReport.type') || 'Type'}</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  supplier.type === 'Dental Lab' 
                    ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                }`}>
                  {getSupplierTypeDisplay()}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('supplierDetailedReport.contactPerson') || 'Contact Person'}</p>
                <p className="font-semibold text-slate-800 dark:text-white">{supplier.contact_person || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('supplierDetailedReport.phone') || 'Phone'}</p>
                <p className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {supplier.phone || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('supplierDetailedReport.email') || 'Email'}</p>
                <p className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {supplier.email || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('supplierDetailedReport.status') || 'Status'}</p>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  {t('supplierDetailedReport.active') || 'Active'}
                </span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Financial Summary */}
        <SectionCard
          title={t('supplierDetailedReport.financialSummary') || 'Financial Summary'}
          icon={<PaymentIcon className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-1">
                <ChartIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {t('supplierDetailedReport.totalBilled') || 'Total Billed'}
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {currencyFormatter.format(financialSummary.totalBilled)}
              </p>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                {financialSummary.invoiceCount} {t('supplierDetailedReport.invoices') || 'invoices'}
              </p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {t('supplierDetailedReport.totalPaid') || 'Total Paid'}
                </p>
              </div>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {currencyFormatter.format(financialSummary.totalPaid)}
              </p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                {filteredExpenses.length} {t('supplierDetailedReport.payments') || 'payments'}
              </p>
            </div>
            <div className="sm:col-span-2">
              <div className={`p-4 rounded-xl border-2 ${
                financialSummary.outstandingBalance >= 0
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
                  : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm ${
                        financialSummary.outstandingBalance >= 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {t('supplierDetailedReport.outstandingBalance') || 'Outstanding Balance'}
                      </p>
                    </div>
                    <p className={`text-3xl font-bold ${
                      financialSummary.outstandingBalance >= 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {currencyFormatter.format(financialSummary.outstandingBalance)}
                    </p>
                    <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">
                      {financialSummary.outstandingBalance >= 0 
                        ? t('supplierDetailedReport.amountOwed') || 'Amount owed to supplier'
                        : t('supplierDetailedReport.overpaid') || 'Overpaid'
                      }
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${
                    financialSummary.outstandingBalance >= 0
                      ? 'bg-amber-200 dark:bg-amber-700'
                      : 'bg-rose-200 dark:bg-rose-700'
                  }`}>
                    <DollarSignIcon className={`h-6 w-6 ${
                      financialSummary.outstandingBalance >= 0
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-rose-700 dark:text-rose-300'
                    }`} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Average Invoice Value */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('supplierDetailedReport.avgInvoiceValue') || 'Average Invoice Value'}
                </p>
                <p className="text-xl font-bold text-slate-700 dark:text-slate-200">
                  {currencyFormatter.format(financialSummary.avgInvoiceValue)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {financialSummary.invoiceCount}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('supplierDetailedReport.invoices') || 'Invoices'}
                </p>
              </div>
            </div>
          </div>

          {/* Monthly Chart */}
          <div>
            <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">
              {t('supplierDetailedReport.monthlyActivity') || 'Monthly Activity (Last 6 Months)'}
            </h4>
            <div className="space-y-3">
              {/* Legend */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gradient-to-t from-blue-600 to-blue-400"></div>
                  <span className="text-slate-500 dark:text-slate-400">{t('supplierDetailedReport.billed') || 'Billed'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gradient-to-t from-emerald-600 to-emerald-400"></div>
                  <span className="text-slate-500 dark:text-slate-400">{t('supplierDetailedReport.paid') || 'Paid'}</span>
                </div>
              </div>
              {/* Chart */}
              <div className="flex items-end gap-2 h-32">
                {monthlyStats.map((stat, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-0.5 h-24 items-end">
                      <div 
                        className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all duration-500"
                        style={{ 
                          height: `${(stat.amount / maxAmount) * 100}%`,
                          minHeight: stat.amount > 0 ? '4px' : '2px'
                        }}
                        title={`${stat.month}: ${currencyFormatter.format(stat.amount)} billed`}
                      />
                      <div 
                        className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all duration-500"
                        style={{ 
                          height: `${(stat.paidAmount / maxAmount) * 100}%`,
                          minHeight: stat.paidAmount > 0 ? '4px' : '2px'
                        }}
                        title={`${stat.month}: ${currencyFormatter.format(stat.paidAmount)} paid`}
                      />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate w-full text-center">
                      {stat.month.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Invoices Section */}
        <SectionCard
          title={t('supplierDetailedReport.invoices') || 'Invoices'}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          action={
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                {filteredInvoices.length} {t('supplierDetailedReport.invoices') || 'invoices'}
              </span>
              <div className="w-48 md:w-64 print:hidden">
                <SearchInput
                  value={searchQuery}
                  onChange={(value) => {
                    setSearchQuery(value);
                    setInvoicePagination(prev => ({ ...prev, page: 1 }));
                    setPaymentPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  placeholder={t('supplierDetailedReport.searchPlaceholder') || 'Search...'}
                />
              </div>
            </div>
          }
        >
          {filteredInvoices.length > 0 ? (
            <>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {paginatedInvoices.map((invoice) => {
                  const isExpanded = expandedItem?.type === 'invoice' && expandedItem?.id === invoice.id;
                  const totalPaidForInvoice = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                  const balance = invoice.amount - totalPaidForInvoice;

                  return (
                    <ListItem 
                      key={invoice.id} 
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      onClick={() => toggleExpand('invoice', invoice.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md ${
                            invoice.status === 'PAID' 
                              ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                              : 'bg-gradient-to-br from-amber-400 to-amber-600'
                          }`}>
                            <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-medium text-slate-800 dark:text-white text-sm md:text-base truncate">
                                {invoice.invoiceNumber || `#${invoice.id.slice(-6)}`}
                              </p>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                invoice.status === 'PAID' 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>
                                {invoice.status === 'PAID' ? t('supplierDetailedReport.paid') : t('supplierDetailedReport.unpaid')}
                              </span>
                            </div>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 truncate">
                              {dateFormatter.format(new Date(invoice.invoiceDate))}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <p className="font-bold text-slate-800 dark:text-white text-sm md:text-base">
                              {currencyFormatter.format(invoice.amount)}
                            </p>
                            <p className={`text-xs ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {balance > 0 
                                ? `${t('supplierDetailedReport.remaining') || 'Rem'}: ${currencyFormatter.format(balance)}`
                                : t('supplierDetailedReport.settled') || 'Settled'
                              }
                            </p>
                          </div>
                          <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''} flex-shrink-0`} />
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-60 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">{t('supplierDetailedReport.invoiceNumber') || 'Invoice #'}</p>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{invoice.invoiceNumber || '-'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">{t('supplierDetailedReport.invoiceDate') || 'Date'}</p>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{dateFormatter.format(new Date(invoice.invoiceDate))}</p>
                          </div>
                          {invoice.dueDate && (
                            <div>
                              <p className="text-slate-500 dark:text-slate-400 text-xs">{t('supplierDetailedReport.dueDate') || 'Due Date'}</p>
                              <p className="font-medium text-slate-700 dark:text-slate-200">{dateFormatter.format(new Date(invoice.dueDate))}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">{t('supplierDetailedReport.totalPaid') || 'Total Paid'}</p>
                            <p className="font-medium text-emerald-600">{currencyFormatter.format(totalPaidForInvoice)}</p>
                          </div>
                          
                          {invoice.items && invoice.items.length > 0 && (
                            <div className="col-span-2 mt-2">
                              <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">{t('supplierDetailedReport.items') || 'Items'}</p>
                              <div className="space-y-1 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
                                {invoice.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-slate-700 dark:text-slate-300">{item.description}</span>
                                    <span className="font-medium text-slate-800 dark:text-white">{currencyFormatter.format(item.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {invoice.payments && invoice.payments.length > 0 && (
                            <div className="col-span-2 mt-2">
                              <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">{t('supplierDetailedReport.payments') || 'Payments'}</p>
                              <div className="space-y-1 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                                {invoice.payments.map((payment, idx) => (
                                  <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-slate-700 dark:text-slate-300">{dateFormatter.format(new Date(payment.date))}</span>
                                    <span className="font-medium text-emerald-600">{currencyFormatter.format(payment.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </ListItem>
                  );
                })}
              </div>
              
              <Pagination
                pagination={invoicePagination}
                totalItems={filteredInvoices.length}
                onPageChange={(page) => setInvoicePagination(prev => ({ ...prev, page }))}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">{t('supplierDetailedReport.noInvoices') || 'No invoices found'}</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{t('supplierDetailedReport.noInvoicesDesc') || 'Try adjusting your search or date range'}</p>
            </div>
          )}
        </SectionCard>

        {/* Payments Section */}
        <SectionCard
          title={t('supplierDetailedReport.payments') || 'Payments'}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          action={
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {filteredExpenses.length} {t('supplierDetailedReport.payments') || 'payments'}
            </span>
          }
        >
          {filteredExpenses.length > 0 ? (
            <>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {paginatedPayments.map((expense) => {
                  const isExpanded = expandedItem?.type === 'payment' && expandedItem?.id === expense.id;

                  return (
                    <ListItem 
                      key={expense.id}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      onClick={() => toggleExpand('payment', expense.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                            <CheckCircleIcon className="h-4 w-4 md:h-5 md:w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-800 dark:text-white text-sm md:text-base truncate">{expense.description}</p>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 truncate">
                              {dateFormatter.format(new Date(expense.date))} • {t(`expenseCategory.${expense.category}`) || expense.category}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <p className="font-bold text-emerald-600 text-sm md:text-base">
                              {currencyFormatter.format(expense.amount)}
                            </p>
                          </div>
                          <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''} flex-shrink-0`} />
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-40 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">{t('supplierDetailedReport.date') || 'Date'}</p>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{dateFormatter.format(new Date(expense.date))}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">{t('supplierDetailedReport.category') || 'Category'}</p>
                            <p className="font-medium text-slate-700 dark:text-slate-200">{t(`expenseCategory.${expense.category}`) || expense.category}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">{t('supplierDetailedReport.amount') || 'Amount'}</p>
                            <p className="font-bold text-emerald-600">{currencyFormatter.format(expense.amount)}</p>
                          </div>
                          {expense.method && (
                            <div>
                              <p className="text-slate-500 dark:text-slate-400 text-xs">{t('supplierDetailedReport.paymentMethod') || 'Method'}</p>
                              <p className="font-medium text-slate-700 dark:text-slate-200">{expense.method}</p>
                            </div>
                          )}
                          {expense.description && (
                            <div className="col-span-2">
                              <p className="text-slate-500 dark:text-slate-400 text-xs">{t('supplierDetailedReport.description') || 'Description'}</p>
                              <p className="font-medium text-slate-700 dark:text-slate-200">{expense.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </ListItem>
                  );
                })}
              </div>
              
              <Pagination
                pagination={paymentPagination}
                totalItems={filteredExpenses.length}
                onPageChange={(page) => setPaymentPagination(prev => ({ ...prev, page }))}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">{t('supplierDetailedReport.noPayments') || 'No payments found'}</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{t('supplierDetailedReport.noPaymentsDesc') || 'Try adjusting your search or date range'}</p>
            </div>
          )}
        </SectionCard>

        {/* Print Styles */}
        <style>{`
          @media print {
            @page { size: A4; margin: 1cm; }
            body { font-family: Cairo, sans-serif; }
            .no-print { display: none !important; }
            .bg-slate-50 { background: #f8fafc !important; }
            .dark .bg-slate-50 { background: #f1f5f9 !important; }
            .shadow-lg { box-shadow: none !important; }
            .border { border: 1px solid #e2e8f0 !important; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default SupplierDetailedReport;
