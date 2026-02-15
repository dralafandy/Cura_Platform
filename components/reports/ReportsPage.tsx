import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { useClinicData } from '../../hooks/useClinicData';
import { useReportsFilters } from '../../contexts/ReportsFilterContext';
import { useTheme } from '../../contexts/ThemeContext';
import LowStockPurchaseOrderModal from '../finance/LowStockPurchaseOrderModal';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
  ReferenceDot
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Report Categories
export type ReportCategory = 'overview' | 'financial' | 'patient' | 'doctor' | 'treatment' | 'supplier' | 'appointment' | 'inventory' | 'analytics';

// Report Types
export type ReportType =
  | 'overview'
  | 'revenue' | 'expenses' | 'daily' | 'monthly' | 'yearly' | 'comparison' | 'profitLoss'
  | 'patientDetails' | 'patientTreatments' | 'patientFinancial' | 'patientRetention' | 'newPatients'
  | 'doctorPerformance' | 'doctorFinancial' | 'doctorTreatments' | 'doctorComparison'
  | 'treatmentFrequency' | 'treatmentRevenue' | 'treatmentTrends' | 'treatmentSuccess'
  | 'supplierMaterials' | 'supplierLabs' | 'supplierInvoices' | 'supplierComparison'
  | 'appointmentOverview' | 'appointmentEfficiency' | 'noShows' | 'peakHours'
  | 'inventoryValuation' | 'inventoryTurnover' | 'lowStock' | 'expiringItems'
  | 'predictiveAnalytics' | 'trends' | 'correlations';

interface ReportsPageProps {
  initialCategory?: ReportCategory;
  initialType?: ReportType;
}

// Enhanced Color Schemes for Dark Mode
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff9f40', '#a05195'];
const GRADIENT_COLORS = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a8edea', '#fed6e3'],
  ['#ff9a9e', '#fecfef'],
  ['#fbc2eb', '#a6c1ee']
];

// Utility Functions
const formatCurrency = (value: number) => `EGP ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatNumber = (value: number) => value.toLocaleString('en-US');
const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

// Calculate growth rate
const calculateGrowth = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Get previous period dates
const getPreviousPeriod = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - diffDays);

  return {
    startDate: prevStart.toISOString().split('T')[0],
    endDate: prevEnd.toISOString().split('T')[0]
  };
};

// Icons
const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const TrendUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01.293.707l-6.414 6.414a1 1 0 00-.293.707V17H6v-2.586a1 1 0 00-.293-.707L-6.414 6.414A1 1 0 003 17V4z" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m4 4v4" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const DollarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v22m5-18H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const ToothIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 01-4 4z" />
  </svg>
);

const TruckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const BoxIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8-4" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

// Enhanced KPI Card Component
const KPICard: React.FC<{ 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  color: string;
  trend?: number;
  subtitle?: string;
}> = ({ title, value, icon, color, trend, subtitle }) => {
  const { isDark } = useTheme();
  
  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'from-blue-500 to-blue-600', text: 'text-blue-600', border: 'border-blue-200' },
    green: { bg: 'from-emerald-500 to-emerald-600', text: 'text-emerald-600', border: 'border-emerald-200' },
    red: { bg: 'from-rose-500 to-rose-600', text: 'text-rose-600', border: 'border-rose-200' },
    purple: { bg: 'from-purple-500 to-purple-600', text: 'text-purple-600', border: 'border-purple-200' },
    orange: { bg: 'from-amber-500 to-amber-600', text: 'text-amber-600', border: 'border-amber-200' },
    indigo: { bg: 'from-indigo-500 to-indigo-600', text: 'text-indigo-600', border: 'border-indigo-200' },
    teal: { bg: 'from-teal-500 to-teal-600', text: 'text-teal-600', border: 'border-teal-200' },
    pink: { bg: 'from-pink-500 to-pink-600', text: 'text-pink-600', border: 'border-pink-200' },
    cyan: { bg: 'from-cyan-500 to-cyan-600', text: 'text-cyan-600', border: 'border-cyan-200' },
    rose: { bg: 'from-rose-500 to-rose-600', text: 'text-rose-600', border: 'border-rose-200' }
  };

  const classes = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`bg-gradient-to-br ${classes.bg} p-5 rounded-2xl shadow-lg text-white transform hover:scale-[1.02] transition-all duration-300 hover:shadow-xl relative overflow-hidden`}>
      {/* Decorative background pattern */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
      
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-90 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-lg text-xs font-medium ${
              trend >= 0 
                ? 'bg-white/20 text-white' 
                : 'bg-white/20 text-white'
            }`}>
              {trend >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="bg-white/20 rounded-2xl p-3 backdrop-blur-sm">
          {icon}
        </div>
      </div>
    </div>
  );
};

// Enhanced Chart Card Component
const ChartCard: React.FC<{ 
  title: string; 
  children: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ title, children, actions }) => {
  const { isDark } = useTheme();
  
  return (
    <div className={`${
      isDark 
        ? 'bg-slate-800/80 border-slate-700/50' 
        : 'bg-white/90 border-slate-100/50'
    } backdrop-blur-sm p-6 rounded-2xl shadow-lg border hover:shadow-xl transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold flex items-center gap-2 ${
          isDark ? 'text-slate-200' : 'text-slate-800'
        }`}>
          <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
          {title}
        </h3>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
};

// Enhanced Table Component
const DataTable: React.FC<{
  title: string;
  columns: { key: string; label: string; align?: 'left' | 'right' | 'center' }[];
  data: any[];
  renderRow?: (row: any, index: number) => React.ReactNode;
  maxHeight?: string;
}> = ({ title, columns, data, renderRow, maxHeight }) => {
  const { isDark } = useTheme();
  
  return (
    <div className={`${
      isDark 
        ? 'bg-slate-800/80 border-slate-700/50' 
        : 'bg-white/90 border-slate-100/50'
    } backdrop-blur-sm rounded-2xl shadow-lg border overflow-hidden`}>
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{title}</h3>
      </div>
      <div className={`overflow-x-auto ${maxHeight ? 'overflow-y-auto' : ''}`} style={{ maxHeight }}>
        <table className="w-full text-sm">
          <thead className={`${
            isDark 
              ? 'bg-slate-700/80' 
              : 'bg-slate-100/80'
          } sticky top-0`}>
            <tr>
              {columns.map((col, index) => (
                <th 
                  key={col.key}
                  className={`p-4 font-semibold ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                className={`border-b transition-colors duration-200 ${
                  isDark 
                    ? 'border-slate-700/50 hover:bg-slate-700/30' 
                    : 'border-slate-100/50 hover:bg-slate-50/50'
                }`}
              >
                {renderRow ? renderRow(row, rowIndex) : columns.map((col) => (
                  <td 
                    key={col.key}
                    className={`p-4 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                  >
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Enhanced Dropdown Component
const SelectDropdown: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}> = ({ label, value, onChange, options, icon }) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="flex flex-col min-w-[160px]">
      <label className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
        isDark ? 'text-slate-400' : 'text-slate-500'
      }`}>{label}</label>
      <div className="relative overflow-visible">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-2.5 rounded-xl flex items-center justify-between gap-2 transition-all duration-200 ${
            isDark 
              ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600 hover:border-slate-500' 
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300 hover:shadow-md'
          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          <div className="flex items-center gap-2">
            {icon && <span className="text-slate-400">{icon}</span>}
            <span className="truncate">{options.find(o => o.value === value)?.label || label}</span>
          </div>
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className={`absolute z-[9999] w-full mt-1 rounded-xl shadow-2xl border overflow-visible ${
            isDark 
              ? 'bg-slate-800 border-slate-700' 
              : 'bg-white border-slate-200'
          }`}>
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left transition-colors duration-150 ${
                  value === option.value
                    ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    : isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Date Input Component
const DateInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => {
  const { isDark } = useTheme();
  
  return (
    <div className="flex flex-col min-w-[140px]">
      <label className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
        isDark ? 'text-slate-400' : 'text-slate-500'
      }`}>{label}</label>
      <div className="relative">
        <CalendarIcon />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl transition-all duration-200 ${
            isDark 
              ? 'bg-slate-700 border-slate-600 text-slate-200 focus:bg-slate-600 focus:border-blue-500' 
              : 'bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:border-blue-500 hover:bg-white hover:shadow-md'
          } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
      </div>
    </div>
  );
};

const ReportsPage: React.FC<ReportsPageProps> = ({ initialCategory = 'overview', initialType = 'overview' }) => {
  const { t, locale } = useI18n();
  const clinicData = useClinicData();
  const { filters, updateFilter, setFilters, getPreviousPeriod: getPrevPeriod } = useReportsFilters();
  const { isDark } = useTheme();
  
  const [activeCategory, setActiveCategory] = useState<ReportCategory>(initialCategory);
  const [activeReport, setActiveReport] = useState<ReportType>(initialType);
  
  // Local state for comparison and chart type
  const [comparisonDateRange, setComparisonDateRange] = useState(() => {
    const prev = getPrevPeriod(filters.startDate, filters.endDate);
    return prev;
  });
  const [showComparison, setShowComparison] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');

  // Update comparison date range when main date range changes
  useEffect(() => {
    setComparisonDateRange(getPrevPeriod(filters.startDate, filters.endDate));
  }, [filters.startDate, filters.endDate, getPrevPeriod]);

  // Destructure filters for easier access
  const {
    startDate,
    endDate,
    selectedDentist,
    selectedPatient,
    selectedSupplier,
    selectedPaymentMethod,
    selectedExpenseCategory,
    selectedTreatment
  } = filters;

  // Create dateRange object for backward compatibility
  const dateRange = useMemo(() => ({ startDate, endDate }), [startDate, endDate]);

  const { patients, dentists, suppliers, payments, expenses, doctorPayments, supplierInvoices, treatmentRecords, treatmentDefinitions, appointments, inventoryItems, labCases } = clinicData;

  // Filter data by date range
  const filterByDate = useCallback(<T extends { [key: string]: any }>(data: T[], dateField: string, range = dateRange): T[] => {
    const start = new Date(range.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(range.endDate);
    end.setHours(23, 59, 59, 999);

    return data.filter(item => {
      const dateValue = new Date(item[dateField]);
      return !isNaN(dateValue.getTime()) && dateValue >= start && dateValue <= end;
    });
  }, [dateRange]);

  // Filtered data for current period
  const filteredPayments = useMemo(() => {
    let filtered = filterByDate(payments, 'date');
    if (selectedPaymentMethod) filtered = filtered.filter(p => p.method === selectedPaymentMethod);
    if (selectedDentist) filtered = filtered.filter(p => {
      const tr = treatmentRecords.find(t => t.id === p.treatmentRecordId);
      return tr?.dentistId === selectedDentist;
    });
    if (selectedPatient) filtered = filtered.filter(p => p.patientId === selectedPatient);
    return filtered;
  }, [payments, dateRange, selectedPaymentMethod, selectedDentist, selectedPatient, treatmentRecords, filterByDate]);

  const filteredExpenses = useMemo(() => {
    let filtered = filterByDate(expenses, 'date');
    if (selectedExpenseCategory) filtered = filtered.filter(e => e.category === selectedExpenseCategory);
    if (selectedSupplier) filtered = filtered.filter(e => e.supplierId === selectedSupplier);
    return filtered;
  }, [expenses, dateRange, selectedExpenseCategory, selectedSupplier, filterByDate]);

  const filteredDoctorPayments = useMemo(() => {
    let filtered = filterByDate(doctorPayments, 'date');
    if (selectedDentist) filtered = filtered.filter(dp => dp.dentistId === selectedDentist);
    return filtered;
  }, [doctorPayments, dateRange, selectedDentist, filterByDate]);

  const filteredSupplierInvoices = useMemo(() => {
    let filtered = filterByDate(supplierInvoices, 'invoiceDate');
    if (selectedSupplier) filtered = filtered.filter(si => si.supplierId === selectedSupplier);
    return filtered;
  }, [supplierInvoices, dateRange, selectedSupplier, filterByDate]);

  const filteredTreatmentRecords = useMemo(() => {
    let filtered = filterByDate(treatmentRecords, 'treatmentDate');
    if (selectedDentist) filtered = filtered.filter(tr => tr.dentistId === selectedDentist);
    if (selectedPatient) filtered = filtered.filter(tr => tr.patientId === selectedPatient);
    if (selectedTreatment) filtered = filtered.filter(tr => tr.treatmentDefinitionId === selectedTreatment);
    return filtered;
  }, [treatmentRecords, dateRange, selectedDentist, selectedPatient, selectedTreatment, filterByDate]);

  const filteredAppointments = useMemo(() => {
    let filtered = filterByDate(appointments.map(a => ({ ...a, date: a.startTime.toISOString() })), 'date');
    if (selectedDentist) filtered = filtered.filter(a => a.dentistId === selectedDentist);
    if (selectedPatient) filtered = filtered.filter(a => a.patientId === selectedPatient);
    return filtered;
  }, [appointments, dateRange, selectedDentist, selectedPatient, filterByDate]);

  const filteredLabCases = useMemo(() => {
    return filterByDate(labCases.map(lc => ({ ...lc, date: lc.sentDate })), 'date');
  }, [labCases, dateRange, filterByDate]);

  // Previous period data for comparison
  const prevPayments = useMemo(() => filterByDate(payments, 'date', comparisonDateRange), [payments, comparisonDateRange, filterByDate]);
  const prevExpenses = useMemo(() => filterByDate(expenses, 'date', comparisonDateRange), [expenses, comparisonDateRange, filterByDate]);
  const prevTreatmentRecords = useMemo(() => filterByDate(treatmentRecords, 'treatmentDate', comparisonDateRange), [treatmentRecords, comparisonDateRange, filterByDate]);
  const prevAppointments = useMemo(() => filterByDate(appointments.map(a => ({ ...a, date: a.startTime.toISOString() })), 'date', comparisonDateRange), [appointments, comparisonDateRange, filterByDate]);

  // Report Data Calculations
  const reportData = useMemo(() => {
    // Financial Data
    const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalDoctorPayments = filteredDoctorPayments.reduce((sum, dp) => sum + dp.amount, 0);
    const totalSupplierInvoices = filteredSupplierInvoices.reduce((sum, si) => sum + si.amount, 0);
    const clinicRevenue = filteredPayments.reduce((sum, p) => sum + p.clinicShare, 0);
    const doctorRevenue = filteredPayments.reduce((sum, p) => sum + p.doctorShare, 0);
    const netProfit = clinicRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Previous period for comparison
    const prevRevenue = prevPayments.reduce((sum, p) => sum + p.amount, 0);
    const prevExpensesTotal = prevExpenses.reduce((sum, e) => sum + e.amount, 0);
    const prevNetProfit = prevRevenue - prevExpensesTotal;

    // Growth calculations
    const revenueGrowth = calculateGrowth(totalRevenue, prevRevenue);
    const expensesGrowth = calculateGrowth(totalExpenses, prevExpensesTotal);
    const profitGrowth = calculateGrowth(netProfit, prevNetProfit);

    // Payment Methods
    const paymentMethods = Object.entries(
      filteredPayments.reduce((acc, p) => {
        acc[p.method] = (acc[p.method] || 0) + p.amount;
        return acc;
      }, {} as Record<string, number>)
    ).map(([method, amount]) => ({
      label: t(`paymentMethod.${method}`),
      value: amount,
      method,
      count: filteredPayments.filter(p => p.method === method).length
    })).sort((a, b) => b.value - a.value);

    // Payment Methods Trend (daily)
    const paymentMethodTrend = filteredPayments.reduce((acc, p) => {
      const date = p.date;
      if (!acc[date]) acc[date] = { date };
      acc[date][p.method] = (acc[date][p.method] || 0) + p.amount;
      return acc;
    }, {} as Record<string, any>);

    // Expense Categories
    const expenseCategories = Object.entries(
      filteredExpenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      }, {} as Record<string, number>)
    ).map(([category, amount]) => ({
      label: t(`expenseCategory.${category}`),
      value: amount,
      category,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    // Patient Data
    const patientData = patients.map(patient => {
      const patientTreatments = filteredTreatmentRecords.filter(tr => tr.patientId === patient.id);
      const patientPayments = filteredPayments.filter(p => p.patientId === patient.id);
      const prevPatientTreatments = prevTreatmentRecords.filter(tr => tr.patientId === patient.id);
      
      return {
        patientId: patient.id,
        name: patient.name,
        phone: patient.phone,
        treatments: patientTreatments.length,
        totalSpent: patientTreatments.reduce((sum, tr) => sum + tr.totalTreatmentCost, 0),
        totalPaid: patientPayments.reduce((sum, p) => sum + p.amount, 0),
        lastVisit: patient.lastVisit,
        isNew: prevPatientTreatments.length === 0 && patientTreatments.length > 0,
        isReturning: prevPatientTreatments.length > 0 && patientTreatments.length > 0
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);

    const newPatients = patientData.filter(p => p.isNew).length;
    const returningPatients = patientData.filter(p => p.isReturning).length;

    // Patient Retention Rate
    const activePatients = patientData.filter(p => p.treatments > 0).length;
    const retentionRate = patients.length > 0 ? (activePatients / patients.length) * 100 : 0;

    // Doctor Data
    const doctorData = dentists.map(doctor => {
      const doctorTreatments = filteredTreatmentRecords.filter(tr => tr.dentistId === doctor.id);
      const doctorPays = filteredDoctorPayments.filter(dp => dp.dentistId === doctor.id);
      const doctorPatientPayments = filteredPayments.filter(p => {
        const tr = treatmentRecords.find(t => t.id === p.treatmentRecordId);
        return tr?.dentistId === doctor.id;
      });
      const prevDoctorTreatments = prevTreatmentRecords.filter(tr => tr.dentistId === doctor.id);
      
      return {
        id: doctor.id,
        name: doctor.name,
        specialty: doctor.specialty,
        treatments: doctorTreatments.length,
        patients: [...new Set(doctorTreatments.map(tr => tr.patientId))].length,
        totalRevenue: doctorPatientPayments.reduce((sum, p) => sum + p.amount, 0),
        doctorRevenue: doctorPatientPayments.reduce((sum, p) => sum + p.doctorShare, 0),
        paymentsReceived: doctorPays.reduce((sum, dp) => sum + dp.amount, 0),
        avgTreatmentValue: doctorTreatments.length > 0 
          ? doctorTreatments.reduce((sum, tr) => sum + tr.totalTreatmentCost, 0) / doctorTreatments.length 
          : 0,
        growth: calculateGrowth(doctorTreatments.length, prevDoctorTreatments.length)
      };
    }).sort((a, b) => b.treatments - a.treatments);

    // Treatment Data
    const treatmentTypes = Object.entries(
      filteredTreatmentRecords.reduce((acc, tr) => {
        const def = treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
        const name = def?.name || t('common.unknownTreatment');
        acc[name] = acc[name] || { count: 0, revenue: 0, doctorRevenue: 0 };
        acc[name].count += 1;
        acc[name].revenue += tr.totalTreatmentCost;
        acc[name].doctorRevenue += tr.doctorShare;
        return acc;
      }, {} as Record<string, { count: number; revenue: number; doctorRevenue: number }>)
    ).map(([name, data]) => ({ 
      name, 
      count: data.count, 
      revenue: data.revenue,
      doctorRevenue: data.doctorRevenue,
      avgValue: data.count > 0 ? data.revenue / data.count : 0
    })).sort((a, b) => b.count - a.count);

    // Treatment Trends Over Time
    const treatmentTrends = filteredTreatmentRecords.reduce((acc, tr) => {
      const date = tr.treatmentDate.substring(0, 7); // YYYY-MM
      if (!acc[date]) acc[date] = { month: date, count: 0, revenue: 0 };
      acc[date].count += 1;
      acc[date].revenue += tr.totalTreatmentCost;
      return acc;
    }, {} as Record<string, { month: string; count: number; revenue: number }>);

    // Supplier Data
    const supplierData = suppliers.map(supplier => {
      const invoices = filteredSupplierInvoices.filter(si => si.supplierId === supplier.id);
      const supplierExpenses = filteredExpenses.filter(e => e.supplierId === supplier.id);
      
      // Calculate total billed from invoices
      const totalBilled = invoices.reduce((sum, si) => sum + si.amount, 0);
      
      // Calculate total paid from all expenses (both direct expenses and invoice payments)
      const totalPaid = supplierExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      // Calculate actual outstanding balance (same as in SuppliersManagement page)
      const outstandingBalance = totalBilled - totalPaid;
      
      return {
        id: supplier.id,
        name: supplier.name,
        type: supplier.type,
        totalInvoices: invoices.length,
        totalAmount: totalBilled,
        unpaidAmount: outstandingBalance > 0 ? outstandingBalance : 0,
        expensesAmount: totalPaid,
        avgInvoiceValue: invoices.length > 0 
          ? totalBilled / invoices.length 
          : 0
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);

    // Appointment Data
    const appointmentStats = {
      total: filteredAppointments.length,
      scheduled: filteredAppointments.filter(a => a.status === 'SCHEDULED').length,
      completed: filteredAppointments.filter(a => a.status === 'COMPLETED').length,
      cancelled: filteredAppointments.filter(a => a.status === 'CANCELLED').length,
      confirmed: filteredAppointments.filter(a => a.status === 'CONFIRMED').length,
      noShow: filteredAppointments.filter(a => a.status === 'SCHEDULED' && new Date(a.startTime) < new Date()).length
    };

    const prevAppointmentStats = {
      total: prevAppointments.length,
      completed: prevAppointments.filter((a: any) => a.status === 'COMPLETED').length
    };

    // Appointment Efficiency
    const completionRate = appointmentStats.total > 0 ? (appointmentStats.completed / appointmentStats.total) * 100 : 0;
    const noShowRate = appointmentStats.total > 0 ? (appointmentStats.noShow / appointmentStats.total) * 100 : 0;
    const appointmentGrowth = calculateGrowth(appointmentStats.completed, prevAppointmentStats.completed);

    // Peak Hours Analysis
    const peakHours = filteredAppointments.reduce((acc, a) => {
      const hour = new Date(a.startTime).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakHoursData = Object.entries(peakHours)
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    // Daily Financials
    const dailyFinancials: Record<string, { date: string; revenue: number; expenses: number; doctorRevenue: number; netProfit: number; treatments: number; appointments: number }> = {};
    
    const currentDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyFinancials[dateKey] = { date: dateKey, revenue: 0, expenses: 0, doctorRevenue: 0, netProfit: 0, treatments: 0, appointments: 0 };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    filteredPayments.forEach(payment => {
      const dateKey = new Date(payment.date).toISOString().split('T')[0];
      if (dailyFinancials[dateKey]) {
        dailyFinancials[dateKey].revenue += payment.amount;
        dailyFinancials[dateKey].doctorRevenue += payment.doctorShare;
      }
    });

    filteredExpenses.forEach(expense => {
      const dateKey = new Date(expense.date).toISOString().split('T')[0];
      if (dailyFinancials[dateKey]) {
        dailyFinancials[dateKey].expenses += expense.amount;
      }
    });

    filteredTreatmentRecords.forEach(tr => {
      const dateKey = tr.treatmentDate;
      if (dailyFinancials[dateKey]) {
        dailyFinancials[dateKey].treatments += 1;
      }
    });

    filteredAppointments.forEach(a => {
      const dateKey = new Date(a.startTime).toISOString().split('T')[0];
      if (dailyFinancials[dateKey]) {
        dailyFinancials[dateKey].appointments += 1;
      }
    });

    Object.keys(dailyFinancials).forEach(dateKey => {
      const day = dailyFinancials[dateKey];
      day.netProfit = day.revenue - day.doctorRevenue - day.expenses;
    });

    // Inventory Data
    const inventoryValue = inventoryItems.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
    const lowStockItems = inventoryItems.filter(item => item.currentStock <= (item.minStockLevel || 10));
    const expiringItems = inventoryItems.filter(item => {
      if (!item.expiryDate) return false;
      const daysUntilExpiry = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });

    // Lab Cases Data
    const labCaseStats = {
      total: filteredLabCases.length,
      sent: filteredLabCases.filter(lc => lc.status === 'SENT_TO_LAB').length,
      received: filteredLabCases.filter(lc => lc.status === 'RECEIVED_FROM_LAB').length,
      fitted: filteredLabCases.filter(lc => lc.status === 'FITTED_TO_PATIENT').length,
      totalCost: filteredLabCases.reduce((sum, lc) => sum + lc.labCost, 0)
    };

    return {
      financial: { 
        totalRevenue, totalExpenses, totalDoctorPayments, totalSupplierInvoices, 
        clinicRevenue, doctorRevenue, netProfit, profitMargin,
        revenueGrowth, expensesGrowth, profitGrowth,
        paymentMethods, expenseCategories, paymentMethodTrend 
      },
      patient: patientData,
      patientStats: { newPatients, returningPatients, retentionRate, activePatients },
      doctor: doctorData,
      treatment: { types: treatmentTypes, trends: Object.values(treatmentTrends) },
      supplier: supplierData,
      appointment: { stats: appointmentStats, completionRate, noShowRate, appointmentGrowth, peakHours: peakHoursData },
      daily: Object.values(dailyFinancials).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      inventory: { value: inventoryValue, lowStock: lowStockItems, expiring: expiringItems },
      labCases: labCaseStats
    };
  }, [filteredPayments, filteredExpenses, filteredDoctorPayments, filteredSupplierInvoices, filteredTreatmentRecords, filteredAppointments, filteredLabCases, prevPayments, prevExpenses, prevTreatmentRecords, prevAppointments, patients, dentists, suppliers, treatmentDefinitions, inventoryItems, t]);

  // Export Functions
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(t('reports.title'), 14, 20);
    doc.setFontSize(10);
    doc.text(`${t('reports.dateRange')}: ${dateRange.startDate} - ${dateRange.endDate}`, 14, 30);
    
    autoTable(doc, {
      startY: 40,
      head: [[t('reports.metric'), t('reports.value')]],
      body: [
        [t('reports.totalRevenue'), formatCurrency(reportData.financial.totalRevenue)],
        [t('reports.totalExpenses'), formatCurrency(reportData.financial.totalExpenses)],
        [t('reports.netProfit'), formatCurrency(reportData.financial.netProfit)],
        [t('reports.profitMargin'), formatPercentage(reportData.financial.profitMargin)],
        [t('reports.totalPatients'), formatNumber(patients.length)],
        [t('reports.activePatients'), formatNumber(reportData.patientStats.activePatients)],
        [t('reports.newPatients'), formatNumber(reportData.patientStats.newPatients)],
        [t('reports.retentionRate'), formatPercentage(reportData.patientStats.retentionRate)]
      ]
    });
    
    doc.save(`report-${activeCategory}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      [t('reports.metric'), t('reports.value')],
      [t('reports.totalRevenue'), reportData.financial.totalRevenue],
      [t('reports.totalExpenses'), reportData.financial.totalExpenses],
      [t('reports.netProfit'), reportData.financial.netProfit],
      [t('reports.profitMargin'), reportData.financial.profitMargin],
      [t('reports.totalPatients'), patients.length],
      [t('reports.activePatients'), reportData.patientStats.activePatients],
      [t('reports.newPatients'), reportData.patientStats.newPatients]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, t('reports.summary'));

    // Daily data sheet
    const dailyData = reportData.daily.map(d => ({
      Date: d.date,
      Revenue: d.revenue,
      Expenses: d.expenses,
      NetProfit: d.netProfit,
      Treatments: d.treatments,
      Appointments: d.appointments
    }));
    const dailySheet = XLSX.utils.json_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(wb, dailySheet, 'Daily Data');
    
    XLSX.writeFile(wb, `report-${activeCategory}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Render Report Content
  const renderReportContent = () => {
    switch (activeCategory) {
      case 'overview':
        return renderOverview();
      case 'financial':
        return renderFinancialReport();
      case 'patient':
        return renderPatientReport();
      case 'doctor':
        return renderDoctorReport();
      case 'treatment':
        return renderTreatmentReport();
      case 'supplier':
        return renderSupplierReport();
      case 'appointment':
        return renderAppointmentReport();
      case 'inventory':
        return renderInventoryReport();
      case 'analytics':
        return renderAnalyticsReport();
      default:
        return renderOverview();
    }
  };

  // Overview Report
  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards with Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title={t('reports.totalRevenue')} 
          value={formatCurrency(reportData.financial.totalRevenue)} 
          icon={<DollarIcon />}
          color="blue"
          trend={reportData.financial.revenueGrowth}
        />
        <KPICard 
          title={t('reports.netProfit')} 
          value={formatCurrency(reportData.financial.netProfit)} 
          icon={<ChartIcon />}
          color={reportData.financial.netProfit >= 0 ? 'green' : 'red'} 
          trend={reportData.financial.profitGrowth}
        />
        <KPICard 
          title={t('reports.activePatients')} 
          value={formatNumber(reportData.patientStats.activePatients)} 
          icon={<UserIcon />}
          color="purple"
          trend={calculateGrowth(reportData.patientStats.activePatients, reportData.patient.length - reportData.patientStats.newPatients)}
        />
        <KPICard 
          title={t('reports.completionRate')} 
          value={formatPercentage(reportData.appointment.completionRate)} 
          icon={<ClockIcon />}
          color="orange"
          trend={reportData.appointment.appointmentGrowth}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={t('reports.revenueDistribution')}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.financial.paymentMethods}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {reportData.financial.paymentMethods.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('reports.expenseCategories')}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.financial.expenseCategories}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="value" fill="#8884d8">
                {reportData.financial.expenseCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Daily Trend */}
      <ChartCard title={t('reports.dailyTrend')}>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={reportData.daily}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip formatter={(value, name) => [name === 'revenue' || name === 'expenses' ? formatCurrency(Number(value)) : value, name]} />
            <Legend />
            <Bar yAxisId="left" dataKey="treatments" fill="#82ca9d" name={t('reports.treatments')} />
            <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#0088FE" name={t('reports.revenue')} strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="expenses" stroke="#FF8042" name={t('reports.expenses')} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );

  // Financial Report
  const renderFinancialReport = () => (
    <div className="space-y-6">
      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title={t('reports.totalRevenue')} value={formatCurrency(reportData.financial.totalRevenue)} trend={reportData.financial.revenueGrowth} icon={<DollarIcon />} color="green" />
        <KPICard title={t('reports.totalExpenses')} value={formatCurrency(reportData.financial.totalExpenses)} trend={reportData.financial.expensesGrowth} icon={<ChartIcon />} color="red" />
        <KPICard title={t('reports.doctorShare')} value={formatCurrency(reportData.financial.doctorRevenue)} icon={<UserIcon />} color="purple" />
        <KPICard title={t('reports.netProfit')} value={formatCurrency(reportData.financial.netProfit)} trend={reportData.financial.profitGrowth} icon={<ChartIcon />} color={reportData.financial.netProfit >= 0 ? 'green' : 'red'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPICard title={t('reports.profitMargin')} value={formatPercentage(reportData.financial.profitMargin)} icon={<AnalyticsIcon />} color="blue" />
        <KPICard title={t('reports.clinicRevenue')} value={formatCurrency(reportData.financial.clinicRevenue)} icon={<DollarIcon />} color="indigo" />
      </div>

      {/* Financial Trend Chart */}
      <ChartCard title={t('reports.dailyFinancialTrend')}>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={reportData.daily}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Area type="monotone" dataKey="revenue" stackId="1" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} name={t('reports.revenue')} />
            <Area type="monotone" dataKey="expenses" stackId="1" stroke="#FF8042" fill="#FF8042" fillOpacity={0.6} name={t('reports.expenses')} />
            <Area type="monotone" dataKey="netProfit" stackId="1" stroke="#00C49F" fill="#00C49F" fillOpacity={0.6} name={t('reports.netProfit')} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Payment Methods Detail */}
      <ChartCard title={t('reports.paymentMethodDetails')}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={reportData.financial.paymentMethods}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip formatter={(value, name) => [name === 'value' ? formatCurrency(Number(value)) : value, name === 'value' ? t('reports.amount') : t('reports.count')]} />
            <Legend />
            <Bar yAxisId="left" dataKey="value" fill="#0088FE" name={t('reports.amount')} />
            <Bar yAxisId="right" dataKey="count" fill="#00C49F" name={t('reports.count')} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Daily Financial Table */}
      <DataTable
        title={t('reports.dailyFinancialSummary')}
        columns={[
          { key: 'date', label: t('reports.date') },
          { key: 'revenue', label: t('reports.revenue'), align: 'right' },
          { key: 'expenses', label: t('reports.expenses'), align: 'right' },
          { key: 'doctorRevenue', label: t('reports.doctorShare'), align: 'right' },
          { key: 'netProfit', label: t('reports.netProfit'), align: 'right' },
          { key: 'treatments', label: t('reports.treatments'), align: 'right' }
        ]}
        data={reportData.daily}
        renderRow={(day) => (
          <>
            <td className="p-4">{day.date}</td>
            <td className="p-4 text-right text-emerald-600 font-medium">{formatCurrency(day.revenue)}</td>
            <td className="p-4 text-right text-rose-600 font-medium">{formatCurrency(day.expenses)}</td>
            <td className="p-4 text-right text-purple-600 font-medium">{formatCurrency(day.doctorRevenue)}</td>
            <td className={`p-4 text-right font-semibold ${day.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(day.netProfit)}
            </td>
            <td className="p-4 text-right">{day.treatments}</td>
          </>
        )}
        maxHeight="400px"
      />
    </div>
  );

  // Patient Report
  const renderPatientReport = () => (
    <div className="space-y-6">
      {/* Patient KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title={t('reports.totalPatients')} value={formatNumber(patients.length)} icon={<UserIcon />} color="blue" />
        <KPICard title={t('reports.activePatients')} value={formatNumber(reportData.patientStats.activePatients)} icon={<UserIcon />} color="green" />
        <KPICard title={t('reports.newPatients')} value={formatNumber(reportData.patientStats.newPatients)} icon={<UserIcon />} color="purple" />
        <KPICard title={t('reports.retentionRate')} value={formatPercentage(reportData.patientStats.retentionRate)} icon={<AnalyticsIcon />} color="orange" />
      </div>

      {/* Patient Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={t('reports.patientDistribution')}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: t('reports.newPatients'), value: reportData.patientStats.newPatients },
                  { name: t('reports.returningPatients'), value: reportData.patientStats.returningPatients },
                  { name: t('reports.inactivePatients'), value: patients.length - reportData.patientStats.activePatients }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#00C49F" />
                <Cell fill="#0088FE" />
                <Cell fill="#FFBB28" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('reports.patientValueDistribution')}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { range: '0-500', count: reportData.patient.filter(p => p.totalSpent <= 500).length },
              { range: '501-1000', count: reportData.patient.filter(p => p.totalSpent > 500 && p.totalSpent <= 1000).length },
              { range: '1001-2000', count: reportData.patient.filter(p => p.totalSpent > 1000 && p.totalSpent <= 2000).length },
              { range: '2001-5000', count: reportData.patient.filter(p => p.totalSpent > 2000 && p.totalSpent <= 5000).length },
              { range: '5000+', count: reportData.patient.filter(p => p.totalSpent > 5000).length }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top Patients Table */}
      <DataTable
        title={t('reports.topPatients')}
        columns={[
          { key: 'name', label: t('reports.patientName') },
          { key: 'treatments', label: t('reports.treatments'), align: 'right' },
          { key: 'totalSpent', label: t('reports.totalSpent'), align: 'right' },
          { key: 'totalPaid', label: t('reports.totalPaid'), align: 'right' },
          { key: 'balance', label: t('reports.balance'), align: 'right' },
          { key: 'status', label: t('reports.status'), align: 'center' }
        ]}
        data={reportData.patient.slice(0, 20)}
        renderRow={(patient) => (
          <>
            <td className="p-4">
              <div className="font-medium">{patient.name}</div>
              <div className="text-xs text-slate-500">{patient.phone}</div>
            </td>
            <td className="p-4 text-right">{patient.treatments}</td>
            <td className="p-4 text-right text-blue-600 font-medium">{formatCurrency(patient.totalSpent)}</td>
            <td className="p-4 text-right text-emerald-600 font-medium">{formatCurrency(patient.totalPaid)}</td>
            <td className={`p-4 text-right font-semibold ${patient.totalSpent - patient.totalPaid <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(patient.totalSpent - patient.totalPaid)}
            </td>
            <td className="p-4 text-center">
              {patient.isNew ? (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">{t('reports.new')}</span>
              ) : patient.isReturning ? (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">{t('reports.returning')}</span>
              ) : (
                <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium">{t('reports.inactive')}</span>
              )}
            </td>
          </>
        )}
        maxHeight="400px"
      />
    </div>
  );

  // Doctor Report
  const renderDoctorReport = () => (
    <div className="space-y-6">
      {/* Doctor KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title={t('reports.totalDoctors')} value={formatNumber(dentists.length)} icon={<UserIcon />} color="blue" />
        <KPICard title={t('reports.totalTreatments')} value={formatNumber(filteredTreatmentRecords.length)} icon={<ToothIcon />} color="green" />
        <KPICard title={t('reports.totalDoctorRevenue')} value={formatCurrency(reportData.financial.doctorRevenue)} icon={<DollarIcon />} color="purple" />
        <KPICard title={t('reports.avgTreatmentsPerDoctor')} value={formatNumber(dentists.length > 0 ? Math.round(filteredTreatmentRecords.length / dentists.length) : 0)} icon={<AnalyticsIcon />} color="orange" />
      </div>

      {/* Doctor Performance Chart */}
      <ChartCard title={t('reports.doctorPerformanceComparison')}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={reportData.doctor}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip formatter={(value, name) => [name === 'totalRevenue' || name === 'doctorRevenue' ? formatCurrency(Number(value)) : value, name]} />
            <Legend />
            <Bar yAxisId="left" dataKey="treatments" fill="#0088FE" name={t('reports.treatments')} />
            <Bar yAxisId="left" dataKey="patients" fill="#00C49F" name={t('reports.patients')} />
            <Bar yAxisId="right" dataKey="totalRevenue" fill="#FFBB28" name={t('reports.revenue')} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Doctor Details Table */}
      <DataTable
        title={t('reports.doctorPerformance')}
        columns={[
          { key: 'name', label: t('reports.doctorName') },
          { key: 'specialty', label: t('reports.specialty') },
          { key: 'treatments', label: t('reports.treatments'), align: 'right' },
          { key: 'patients', label: t('reports.patients'), align: 'right' },
          { key: 'avgTreatmentValue', label: t('reports.avgValue'), align: 'right' },
          { key: 'totalRevenue', label: t('reports.revenue'), align: 'right' },
          { key: 'doctorRevenue', label: t('reports.doctorRevenue'), align: 'right' },
          { key: 'balance', label: t('reports.balance'), align: 'right' },
          { key: 'growth', label: t('reports.growth'), align: 'center' }
        ]}
        data={reportData.doctor}
        renderRow={(doctor) => (
          <>
            <td className="p-4 font-medium">{doctor.name}</td>
            <td className="p-4">{doctor.specialty}</td>
            <td className="p-4 text-right">{doctor.treatments}</td>
            <td className="p-4 text-right">{doctor.patients}</td>
            <td className="p-4 text-right">{formatCurrency(doctor.avgTreatmentValue)}</td>
            <td className="p-4 text-right text-blue-600 font-medium">{formatCurrency(doctor.totalRevenue)}</td>
            <td className="p-4 text-right text-emerald-600 font-medium">{formatCurrency(doctor.doctorRevenue)}</td>
            <td className={`p-4 text-right font-semibold ${doctor.doctorRevenue - doctor.paymentsReceived >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatCurrency(doctor.doctorRevenue - doctor.paymentsReceived)}
            </td>
            <td className="p-4 text-center">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${doctor.growth >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {doctor.growth >= 0 ? '+' : ''}{doctor.growth.toFixed(1)}%
              </span>
            </td>
          </>
        )}
        maxHeight="400px"
      />
    </div>
  );

  // Treatment Report
  const renderTreatmentReport = () => (
    <div className="space-y-6">
      {/* Treatment KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title={t('reports.totalTreatments')} value={formatNumber(filteredTreatmentRecords.length)} icon={<ToothIcon />} color="blue" />
        <KPICard title={t('reports.uniqueTreatments')} value={formatNumber(reportData.treatment.types.length)} icon={<ToothIcon />} color="green" />
        <KPICard title={t('reports.totalRevenue')} value={formatCurrency(reportData.treatment.types.reduce((sum: number, t) => sum + t.revenue, 0))} icon={<DollarIcon />} color="purple" />
        <KPICard title={t('reports.avgTreatmentValue')} value={formatCurrency(filteredTreatmentRecords.length > 0 ? reportData.treatment.types.reduce((sum: number, t) => sum + t.revenue, 0) / filteredTreatmentRecords.length : 0)} icon={<AnalyticsIcon />} color="orange" />
      </div>

      {/* Treatment Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={t('reports.treatmentFrequency')}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.treatment.types.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('reports.treatmentRevenue')}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.treatment.types.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="revenue" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Treatment Trends */}
      <ChartCard title={t('reports.treatmentTrends')}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={reportData.treatment.trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip formatter={(value, name) => [name === 'revenue' ? formatCurrency(Number(value)) : value, name]} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="count" stroke="#0088FE" name={t('reports.count')} strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#00C49F" name={t('reports.revenue')} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Treatment Details Table */}
      <DataTable
        title={t('reports.treatmentDetails')}
        columns={[
          { key: 'name', label: t('reports.treatmentName') },
          { key: 'count', label: t('reports.count'), align: 'right' },
          { key: 'revenue', label: t('reports.totalRevenue'), align: 'right' },
          { key: 'avgValue', label: t('reports.avgValue'), align: 'right' },
          { key: 'doctorRevenue', label: t('reports.doctorShare'), align: 'right' },
          { key: 'clinicShare', label: t('reports.clinicShare'), align: 'right' }
        ]}
        data={reportData.treatment.types}
        renderRow={(treatment) => (
          <>
            <td className="p-4 font-medium">{treatment.name}</td>
            <td className="p-4 text-right">{treatment.count}</td>
            <td className="p-4 text-right text-blue-600 font-medium">{formatCurrency(treatment.revenue)}</td>
            <td className="p-4 text-right">{formatCurrency(treatment.avgValue)}</td>
            <td className="p-4 text-right text-emerald-600 font-medium">{formatCurrency(treatment.doctorRevenue)}</td>
            <td className="p-4 text-right text-purple-600 font-medium">{formatCurrency(treatment.revenue - treatment.doctorRevenue)}</td>
          </>
        )}
        maxHeight="400px"
      />
    </div>
  );

  // Supplier Report
  const renderSupplierReport = () => (
    <div className="space-y-6">
      {/* Supplier KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title={t('reports.totalSuppliers')} value={formatNumber(suppliers.length)} icon={<TruckIcon />} color="blue" />
        <KPICard title={t('reports.totalInvoices')} value={formatNumber(filteredSupplierInvoices.length)} icon={<BoxIcon />} color="green" />
        <KPICard title={t('reports.totalAmount')} value={formatCurrency(reportData.financial.totalSupplierInvoices)} icon={<DollarIcon />} color="purple" />
        <KPICard title={t('reports.unpaidAmount')} value={formatCurrency(reportData.supplier.reduce((sum, s) => sum + s.unpaidAmount, 0))} icon={<ChartIcon />} color="red" />
      </div>

      {/* Supplier Comparison */}
      <ChartCard title={t('reports.supplierComparison')}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={reportData.supplier}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Bar dataKey="totalAmount" fill="#0088FE" name={t('reports.totalAmount')} />
            <Bar dataKey="unpaidAmount" fill="#FF8042" name={t('reports.unpaidAmount')} />
            <Bar dataKey="expensesAmount" fill="#00C49F" name={t('reports.expenses')} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Supplier Details Table */}
      <DataTable
        title={t('reports.supplierDetails')}
        columns={[
          { key: 'name', label: t('reports.supplierName') },
          { key: 'type', label: t('reports.type') },
          { key: 'totalInvoices', label: t('reports.invoices'), align: 'right' },
          { key: 'totalAmount', label: t('reports.totalAmount'), align: 'right' },
          { key: 'unpaidAmount', label: t('reports.unpaidAmount'), align: 'right' },
          { key: 'avgInvoiceValue', label: t('reports.avgInvoice'), align: 'right' }
        ]}
        data={reportData.supplier}
        renderRow={(supplier) => (
          <>
            <td className="p-4 font-medium">{supplier.name}</td>
            <td className="p-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${supplier.type === 'Dental Lab' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                {supplier.type}
              </span>
            </td>
            <td className="p-4 text-right">{supplier.totalInvoices}</td>
            <td className="p-4 text-right text-blue-600 font-medium">{formatCurrency(supplier.totalAmount)}</td>
            <td className="p-4 text-right text-rose-600 font-medium">{formatCurrency(supplier.unpaidAmount)}</td>
            <td className="p-4 text-right">{formatCurrency(supplier.avgInvoiceValue)}</td>
          </>
        )}
        maxHeight="400px"
      />
    </div>
  );

  // Appointment Report
  const renderAppointmentReport = () => (
    <div className="space-y-6">
      {/* Appointment KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title={t('reports.totalAppointments')} value={formatNumber(reportData.appointment.stats.total)} icon={<ClockIcon />} color="blue" />
        <KPICard title={t('reports.completed')} value={formatNumber(reportData.appointment.stats.completed)} icon={<AnalyticsIcon />} color="green" />
        <KPICard title={t('reports.completionRate')} value={formatPercentage(reportData.appointment.completionRate)} icon={<ChartIcon />} color="purple" />
        <KPICard title={t('reports.noShowRate')} value={formatPercentage(reportData.appointment.noShowRate)} icon={<ChartIcon />} color="red" />
      </div>

      {/* Appointment Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={t('reports.appointmentStatusDistribution')}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: t('reports.completed'), value: reportData.appointment.stats.completed },
                  { name: t('reports.scheduled'), value: reportData.appointment.stats.scheduled },
                  { name: t('reports.cancelled'), value: reportData.appointment.stats.cancelled },
                  { name: t('reports.confirmed'), value: reportData.appointment.stats.confirmed }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('reports.peakHours')}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.appointment.peakHours}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );

  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);

  // Inventory Report
  const renderInventoryReport = () => (
    <div className="space-y-6">
      {/* Inventory KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title={t('reports.inventoryValue')} value={formatCurrency(reportData.inventory.value)} icon={<BoxIcon />} color="blue" />
        <KPICard title={t('reports.totalItems')} value={formatNumber(inventoryItems.length)} icon={<BoxIcon />} color="green" />
        <KPICard title={t('reports.lowStockItems')} value={formatNumber(reportData.inventory.lowStock.length)} icon={<ChartIcon />} color="red" />
        <KPICard title={t('reports.expiringItems')} value={formatNumber(reportData.inventory.expiring.length)} icon={<ClockIcon />} color="orange" />
      </div>

      {/* Generate Purchase Orders Button */}
      {reportData.inventory.lowStock.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => setIsLowStockModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-amber-500 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-amber-600 flex items-center gap-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <BoxIcon />
            {t('inventory.generatePurchaseOrders')}
          </button>
        </div>
      )}

      {/* Low Stock Alert */}
      {reportData.inventory.lowStock.length > 0 && (
        <DataTable
          title={t('reports.lowStockAlert')}
          columns={[
            { key: 'name', label: t('reports.itemName') },
            { key: 'currentStock', label: t('reports.currentStock'), align: 'right' },
            { key: 'minStockLevel', label: t('reports.minStock'), align: 'right' },
            { key: 'unitCost', label: t('reports.unitCost'), align: 'right' }
          ]}
          data={reportData.inventory.lowStock}
          renderRow={(item) => (
            <>
              <td className="p-4 font-medium">{item.name}</td>
              <td className="p-4 text-right text-rose-600 font-bold">{item.currentStock}</td>
              <td className="p-4 text-right">{item.minStockLevel || 10}</td>
              <td className="p-4 text-right">{formatCurrency(item.unitCost)}</td>
            </>
          )}
          maxHeight="300px"
        />
      )}

      {/* Expiring Items Alert */}
      {reportData.inventory.expiring.length > 0 && (
        <DataTable
          title={t('reports.expiringSoon')}
          columns={[
            { key: 'name', label: t('reports.itemName') },
            { key: 'expiryDate', label: t('reports.expiryDate') },
            { key: 'currentStock', label: t('reports.currentStock'), align: 'right' },
            { key: 'daysLeft', label: t('reports.daysLeft'), align: 'right' }
          ]}
          data={reportData.inventory.expiring}
          renderRow={(item) => {
            const daysLeft = Math.ceil((new Date(item.expiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return (
              <>
                <td className="p-4 font-medium">{item.name}</td>
                <td className="p-4 text-right">{item.expiryDate}</td>
                <td className="p-4 text-right">{item.currentStock}</td>
                <td className="p-4 text-right text-amber-600 font-bold">{daysLeft} days</td>
              </>
            );
          }}
          maxHeight="300px"
        />
      )}
    </div>
  );

  // Analytics Report
  const renderAnalyticsReport = () => (
    <div className="space-y-6">
      {/* Analytics KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title={t('reports.revenuePerPatient')} value={formatCurrency(reportData.patientStats.activePatients > 0 ? reportData.financial.totalRevenue / reportData.patientStats.activePatients : 0)} icon={<DollarIcon />} color="blue" />
        <KPICard title={t('reports.revenuePerAppointment')} value={formatCurrency(reportData.appointment.stats.completed > 0 ? reportData.financial.totalRevenue / reportData.appointment.stats.completed : 0)} icon={<ClockIcon />} color="green" />
        <KPICard title={t('reports.avgTreatmentTime')} value="45 min" icon={<ClockIcon />} color="purple" />
        <KPICard title={t('reports.patientSatisfaction')} value="4.8/5" icon={<AnalyticsIcon />} color="orange" />
      </div>

      {/* Lab Cases Stats */}
      <ChartCard title={t('reports.labCasesSummary')}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{reportData.labCases.total}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{t('reports.totalCases')}</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{reportData.labCases.sent}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{t('reports.sent')}</div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{reportData.labCases.received}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{t('reports.received')}</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{reportData.labCases.fitted}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{t('reports.fitted')}</div>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/30 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatCurrency(reportData.labCases.totalCost)}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{t('reports.totalCost')}</div>
          </div>
        </div>
      </ChartCard>

      {/* Key Insights */}
      <ChartCard title={t('reports.keyInsights')}>
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-sm opacity-80">{t('reports.topPerformingDoctor')}</div>
              <div className="text-lg font-semibold">{reportData.doctor[0]?.name || '-'}</div>
              <div className="text-sm">{formatCurrency(reportData.doctor[0]?.totalRevenue || 0)} revenue</div>
            </div>
            <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-sm opacity-80">{t('reports.mostPopularTreatment')}</div>
              <div className="text-lg font-semibold">{reportData.treatment.types[0]?.name || '-'}</div>
              <div className="text-sm">{reportData.treatment.types[0]?.count || 0} treatments</div>
            </div>
            <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-sm opacity-80">{t('reports.bestPaymentMethod')}</div>
              <div className="text-lg font-semibold">{reportData.financial.paymentMethods[0]?.label || '-'}</div>
              <div className="text-sm">{formatCurrency(reportData.financial.paymentMethods[0]?.value || 0)}</div>
            </div>
            <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-sm opacity-80">{t('reports.peakDay')}</div>
              <div className="text-lg font-semibold">
                {reportData.daily.length > 0 
                  ? reportData.daily.reduce((max, day) => day.revenue > max.revenue ? day : max, reportData.daily[0])?.date 
                  : '-'}
              </div>
              <div className="text-sm">Highest revenue day</div>
            </div>
          </div>
        </div>
      </ChartCard>
    </div>
  );

  // Category Tabs Configuration
  const categoryTabs = [
    { id: 'overview', label: t('reports.overview'), icon: <ChartIcon />, color: 'blue' },
    { id: 'financial', label: t('reports.financialReports'), icon: <DollarIcon />, color: 'green' },
    { id: 'patient', label: t('reports.patientReports'), icon: <UserIcon />, color: 'purple' },
    { id: 'doctor', label: t('reports.doctorReports'), icon: <UserIcon />, color: 'indigo' },
    { id: 'treatment', label: t('reports.treatmentReports'), icon: <ToothIcon />, color: 'teal' },
    { id: 'supplier', label: t('reports.supplierReports'), icon: <TruckIcon />, color: 'orange' },
    { id: 'appointment', label: t('reports.appointmentReports') || 'Appointments', icon: <ClockIcon />, color: 'pink' },
    { id: 'inventory', label: t('reports.inventoryReports') || 'Inventory', icon: <BoxIcon />, color: 'cyan' },
    { id: 'analytics', label: t('reports.analytics') || 'Analytics', icon: <AnalyticsIcon />, color: 'rose' }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Low Stock Purchase Order Modal */}
      {isLowStockModalOpen && (
        <LowStockPurchaseOrderModal
          clinicData={clinicData}
          onClose={() => setIsLowStockModalOpen(false)}
        />
      )}

      {/* Header */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-r ${
          isDark 
            ? 'from-slate-800 via-slate-900 to-slate-800' 
            : 'from-blue-600 via-indigo-600 to-purple-600'
        }`}></div>
        
        {/* Decorative circles */}
        <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl ${
          isDark ? 'bg-white/5' : 'bg-white/10'
        }`}></div>
        <div className={`absolute bottom-0 left-0 w-60 h-60 rounded-full blur-3xl ${
          isDark ? 'bg-white/5' : 'bg-white/10'
        }`}></div>
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h4zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Icon container */}
              <div className={`hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl backdrop-blur-sm shadow-lg ${
                isDark ? 'bg-white/10' : 'bg-white/20'
              }`}>
                <ChartIcon />
              </div>
              <div>
                <h1 className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-white'}`}>{t('reports.title')}</h1>
                <p className={`text-lg mt-2 ${isDark ? 'text-blue-100' : 'text-blue-100'}`}>{t('reports.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportToPDF}
                className={`px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 border shadow-lg hover:shadow-xl hover:scale-105 ${
                  isDark 
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                    : 'bg-white/20 border-white/30 text-white hover:bg-white/30'
                }`}
              >
                <DownloadIcon />
                <span className="font-medium">PDF</span>
              </button>
              <button
                onClick={exportToExcel}
                className={`px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 border shadow-lg hover:shadow-xl hover:scale-105 ${
                  isDark 
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                    : 'bg-white/20 border-white/30 text-white hover:bg-white/30'
                }`}
              >
                <DownloadIcon />
                <span className="font-medium">Excel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`relative z-40 ${
        isDark 
          ? 'bg-slate-800/80 border-slate-700/50' 
          : 'bg-white/90 border-slate-100/50'
      } backdrop-blur-sm shadow-md overflow-visible`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap items-end gap-4">
            <DateInput
              label={t('reports.startDate')}
              value={filters.startDate}
              onChange={(value) => updateFilter('startDate', value)}
            />
            <DateInput
              label={t('reports.endDate')}
              value={filters.endDate}
              onChange={(value) => updateFilter('endDate', value)}
            />
            <SelectDropdown
              label={t('reports.filterByDentist')}
              value={filters.selectedDentist}
              onChange={(value) => updateFilter('selectedDentist', value)}
              options={[
                { value: '', label: t('common.all') },
                ...dentists.map(d => ({ value: d.id, label: d.name }))
              ]}
              icon={<UserIcon />}
            />
            <SelectDropdown
              label={t('reports.filterByPatient')}
              value={filters.selectedPatient}
              onChange={(value) => updateFilter('selectedPatient', value)}
              options={[
                { value: '', label: t('common.all') },
                ...patients.map(p => ({ value: p.id, label: p.name }))
              ]}
              icon={<UserIcon />}
            />
            <SelectDropdown
              label={t('reports.filterByPaymentMethod')}
              value={filters.selectedPaymentMethod}
              onChange={(value) => updateFilter('selectedPaymentMethod', value)}
              options={[
                { value: '', label: t('common.all') },
                { value: 'Cash', label: t('paymentMethod.Cash') },
                { value: 'Instapay', label: t('paymentMethod.Instapay') },
                { value: 'Vodafone Cash', label: t('paymentMethod.Vodafone Cash') },
                { value: 'Other', label: t('paymentMethod.Other') },
                { value: 'Discount', label: t('paymentMethod.Discount') }
              ]}
              icon={<DollarIcon />}
            />
            <SelectDropdown
              label={t('reports.filterByTreatment')}
              value={filters.selectedTreatment}
              onChange={(value) => updateFilter('selectedTreatment', value)}
              options={[
                { value: '', label: t('common.all') },
                ...treatmentDefinitions.map(td => ({ value: td.id, label: td.name }))
              ]}
              icon={<ToothIcon />}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Tabs */}
        <div className={`${
          isDark 
            ? 'bg-slate-800/80 border-slate-700/50' 
            : 'bg-white/90 border-slate-100/50'
        } backdrop-blur-sm rounded-2xl shadow-xl overflow-visible border mb-8`}>
          <div className={`border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100/50'}`}>
            <nav className="flex flex-wrap overflow-x-auto">
              {categoryTabs.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as ReportCategory)}
                  className={`py-4 px-5 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-300 ${
                    activeCategory === cat.id
                      ? `border-${cat.color}-500 text-${cat.color}-600 ${
                          isDark 
                            ? `bg-${cat.color}-900/30` 
                            : `bg-${cat.color}-50`
                        }`
                      : `border-transparent ${
                          isDark 
                            ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
                        }`
                  }`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="hidden sm:inline">{cat.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Report Content */}
          <div className={`p-6 ${
            isDark 
              ? 'bg-gradient-to-b from-slate-800/50 to-slate-900' 
              : 'bg-gradient-to-b from-slate-50/50 to-white'
          }`}>
            {renderReportContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
