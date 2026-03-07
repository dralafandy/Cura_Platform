import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { useClinicData } from '../../hooks/useClinicData';
import { useReportsFilters } from '../../contexts/ReportsFilterContext';
import { useTheme } from '../../contexts/ThemeContext';
import LowStockPurchaseOrderModal from '../finance/LowStockPurchaseOrderModal';
import { openPrintWindow } from '../../utils/print';
import ComprehensiveClinicReportPage from './ComprehensiveClinicReportPage';
import { motion } from 'framer-motion';
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
  Treemap
} from 'recharts';
import * as XLSX from 'xlsx';

// Report Categories
export type ReportCategory = 'overview' | 'financial' | 'patient' | 'doctor' | 'treatment' | 'supplier' | 'appointment' | 'inventory' | 'analytics';

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

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const formatCurrency = (value: number) => `EGP ${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const formatNumber = (value: number) => value.toLocaleString('en-US');
const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

const calculateGrowth = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

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
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const TrendUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
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

const ExpandIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
  </svg>
);

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

// ============================================
// NEW MODERN KPI COMPONENTS
// ============================================

// Modern Gauge KPI Card
interface GaugeKPICardProps {
  title: string;
  value: number;
  maxValue: number;
  icon: React.ReactNode;
  color: string;
  unit?: string;
}

const GaugeKPICard: React.FC<GaugeKPICardProps> = ({ title, value, maxValue, icon, color, unit = '%' }) => {
  const { isDark } = useTheme();
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  const colorMap: Record<string, string> = {
    blue: '#06b6d4',
    green: '#10b981',
    purple: '#8b5cf6',
    orange: '#f59e0b',
    red: '#ef4444',
    pink: '#ec4899'
  };
  
  const strokeColor = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden rounded-3xl p-6 ${isDark ? 'bg-slate-800/90' : 'bg-white/90'} backdrop-blur-xl shadow-xl border ${isDark ? 'border-slate-700/50' : 'border-slate-100/50'}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{title}</h3>
        <div className={`p-2 rounded-xl bg-gradient-to-br from-${color}-500 to-${color}-600 text-white`}>
          {icon}
        </div>
      </div>
      
      <div className="relative flex items-center justify-center">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke={isDark ? '#334155' : '#e2e8f0'}
            strokeWidth="12"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke={strokeColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 56}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - percentage / 100) }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              filter: `drop-shadow(0 0 8px ${strokeColor}40)`
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold"
            style={{ color: strokeColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {value.toFixed(1)}{unit}
          </motion.span>
          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>of {maxValue}{unit}</span>
        </div>
      </div>
    </motion.div>
  );
};

// Modern Stat KPI Card with Trend
interface StatKPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  subtitle?: string;
  sparklineData?: number[];
}

const StatKPICard: React.FC<StatKPICardProps> = ({ title, value, icon, color, trend, subtitle, sparklineData }) => {
  const { isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  
  const colorMap: Record<string, { bg: string; text: string; glow: string }> = {
    blue: { bg: 'from-cyan-500 to-blue-600', text: 'text-cyan-500', glow: 'shadow-cyan-500/20' },
    green: { bg: 'from-emerald-500 to-green-600', text: 'text-emerald-500', glow: 'shadow-emerald-500/20' },
    purple: { bg: 'from-violet-500 to-purple-600', text: 'text-violet-500', glow: 'shadow-violet-500/20' },
    orange: { bg: 'from-amber-500 to-orange-600', text: 'text-amber-500', glow: 'shadow-amber-500/20' },
    red: { bg: 'from-rose-500 to-red-600', text: 'text-rose-500', glow: 'shadow-rose-500/20' },
    pink: { bg: 'from-pink-500 to-rose-600', text: 'text-pink-500', glow: 'shadow-pink-500/20' },
    indigo: { bg: 'from-indigo-500 to-blue-600', text: 'text-indigo-500', glow: 'shadow-indigo-500/20' }
  };
  
  const classes = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${classes.bg} text-white shadow-xl ${classes.glow}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl transform translate-x-8 -translate-y-8"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl transform -translate-x-4 translate-y-4"></div>
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white/80">{title}</span>
          <motion.div
            animate={{ scale: isHovered ? 1.1 : 1, rotate: isHovered ? 5 : 0 }}
            className="p-2 bg-white/20 rounded-xl backdrop-blur-sm"
          >
            {icon}
          </motion.div>
        </div>
        
        <div className="text-3xl font-bold mb-1">{value}</div>
        
        {subtitle && (
          <div className="text-xs text-white/70 mb-2">{subtitle}</div>
        )}
        
        {trend !== undefined && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
              trend >= 0 ? 'bg-white/20 text-white' : 'bg-white/10 text-white/80'
            }`}
          >
            {trend >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </motion.div>
        )}
        
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-4 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData.map((v, i) => ({ value: v, index: i }))}>
                <defs>
                  <linearGradient id={`sparkGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="white" stopOpacity={0.4}/>
                    <stop offset="100%" stopColor="white" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="white"
                  strokeWidth={2}
                  fill={`url(#sparkGrad-${color})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// NEW CHART COMPONENTS
// ============================================

// Heatmap Chart Component
interface HeatmapData {
  day: string;
  hour: number;
  value: number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({ data }) => {
  const { isDark } = useTheme();
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);
  
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  const getColor = (value: number) => {
    const intensity = value / maxValue;
    if (intensity === 0) return isDark ? '#1e293b' : '#f1f5f9';
    if (intensity < 0.25) return '#ccfbf1';
    if (intensity < 0.5) return '#5eead4';
    if (intensity < 0.75) return '#14b8a6';
    return '#0f766e';
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[400px]">
        <div className="flex gap-1 mb-2 ml-12">
          {hours.map(h => (
            <div key={h} className={`text-xs flex-1 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {h}:00
            </div>
          ))}
        </div>
        {days.map((day, dayIndex) => (
          <div key={day} className="flex items-center gap-1 mb-1">
            <div className={`text-xs w-10 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{day}</div>
            {hours.map(hour => {
              const cellData = data.find(d => d.day === day && d.hour === hour);
              const value = cellData?.value || 0;
              return (
                <motion.div
                  key={`${day}-${hour}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: (dayIndex * 12 + hour) * 0.01 }}
                  className="flex-1 h-8 rounded-md cursor-pointer transition-all hover:scale-110"
                  style={{ backgroundColor: getColor(value) }}
                  title={`${day} ${hour}:00 - ${value} appointments`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// Radar Chart for Doctor Comparison
interface RadarChartData {
  subject: string;
  A: number;
  B?: number;
  fullMark?: number;
}

interface CustomRadarChartProps {
  data: RadarChartData[];
}

const CustomRadarChart: React.FC<CustomRadarChartProps> = ({ data }) => {
  const { isDark } = useTheme();
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke={isDark ? '#334155' : '#e2e8f0'} />
        <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: isDark ? '#64748b' : '#94a3b8' }} />
        <Radar
          name="Current"
          dataKey="A"
          stroke="#06b6d4"
          fill="#06b6d4"
          fillOpacity={0.3}
          strokeWidth={2}
        />
        {data[0]?.B !== undefined && (
          <Radar
            name="Previous"
            dataKey="B"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        )}
        <Legend />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? '#1e293b' : '#fff',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            borderRadius: '12px'
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

// Treemap Chart Component
interface TreemapData {
  name: string;
  size: number;
  fill?: string;
}

interface TreemapChartProps {
  data: TreemapData[];
}

const CustomTreemap: React.FC<TreemapChartProps> = ({ data }) => {
  const { isDark } = useTheme();
  
  const coloredData = data.map((item, index) => ({
    ...item,
    fill: item.fill || COLORS[index % COLORS.length]
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <Treemap
        data={coloredData}
        dataKey="size"
        aspectRatio={4 / 3}
        stroke={isDark ? '#1e293b' : '#fff'}
        fill="#06b6d4"
        content={<CustomTreemapContent isDark={isDark} />}
      />
    </ResponsiveContainer>
  );
};

const CustomTreemapContent = (props: any) => {
  const { isDark } = useTheme();
  const { x, y, width, height, name, fill } = props;
  
  if (width < 50 || height < 30) return null;
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: fill,
          stroke: '#fff',
          strokeWidth: 2,
          strokeDasharray: '4 4'
        }}
        rx={4}
      />
      {width > 60 && height > 40 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize={12}
          fontWeight={600}
        >
          {name?.length > 10 ? name.substring(0, 10) + '...' : name}
        </text>
      )}
    </g>
  );
};

// Modern Chart Card
const ModernChartCard: React.FC<{
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  onExpand?: () => void;
  className?: string;
}> = ({ title, children, actions, onExpand, className = '' }) => {
  const { isDark } = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl p-6 ${isDark ? 'bg-slate-800/90' : 'bg-white/90'} backdrop-blur-xl shadow-xl border ${isDark ? 'border-slate-700/50' : 'border-slate-100/50'} ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {actions}
          {onExpand && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onExpand}
              className={`p-2 rounded-xl ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <ExpandIcon />
            </motion.button>
          )}
        </div>
      </div>
      <div className="relative">
        {children}
      </div>
    </motion.div>
  );
};

// Custom Tooltip
const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any, name: string) => any;
  isDark?: boolean;
}> = ({ active, payload, label, formatter, isDark }) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`px-4 py-3 rounded-2xl shadow-2xl border ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}
      >
        <p className={`text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
          {label}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              {entry.name}:
            </span>
            <span className="font-semibold" style={{ color: entry.color }}>
              {formatter
                ? formatter(entry.value, entry.name)[0]
                : typeof entry.value === 'number'
                  ? entry.value.toLocaleString()
                  : entry.value}
            </span>
          </div>
        ))}
      </motion.div>
    );
  }
  return null;
};

// Enhanced Data Table
const ModernDataTable: React.FC<{
  title: string;
  columns: { key: string; label: string; align?: 'left' | 'right' | 'center' }[];
  data: any[];
  renderRow?: (row: any, index: number) => React.ReactNode;
  maxHeight?: string;
  onRowClick?: (row: any) => void;
}> = ({ title, columns, data, renderRow, maxHeight, onRowClick }) => {
  const { isDark } = useTheme();
  
  return (
    <div className={`relative overflow-hidden rounded-3xl ${isDark ? 'bg-slate-800/90' : 'bg-white/90'} backdrop-blur-xl shadow-xl border ${isDark ? 'border-slate-700/50' : 'border-slate-100/50'}`}>
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
      </div>
      <div className={`overflow-x-auto ${maxHeight ? 'overflow-y-auto' : ''}`} style={{ maxHeight }}>
        <table className="w-full text-sm">
          <thead className={isDark ? 'bg-slate-700/50' : 'bg-slate-50/80'}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 font-semibold text-left text-xs uppercase tracking-wider ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-100'}`}>
            {data.map((row, rowIndex) => (
              <motion.tr
                key={rowIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: rowIndex * 0.02 }}
                onClick={() => onRowClick?.(row)}
                className={`transition-colors duration-200 ${
                  onRowClick ? 'cursor-pointer' : ''
                } ${
                  isDark
                    ? 'hover:bg-slate-700/30'
                    : 'hover:bg-slate-50/50'
                }`}
              >
                {renderRow ? renderRow(row, rowIndex) : columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-6 py-4 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                  >
                    {row[col.key]}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Enhanced Dropdown
const ModernSelect: React.FC<{
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
          className={`w-full px-4 py-3 rounded-2xl flex items-center justify-between gap-2 transition-all duration-200 ${
            isDark 
              ? 'bg-slate-700/80 border-slate-600 text-slate-200 hover:bg-slate-600 hover:border-slate-500' 
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-lg'
          } border backdrop-blur-sm`}
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
          <div className={`absolute z-[9999] w-full mt-2 rounded-2xl shadow-2xl border overflow-hidden ${
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
                className={`w-full px-4 py-3 text-left transition-colors duration-150 ${
                  value === option.value
                    ? isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-500 text-white'
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

// Enhanced Date Input
const ModernDateInput: React.FC<{
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
        <div className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 ${
          isDark ? 'text-slate-400' : 'text-slate-400'
        }`}>
          <CalendarIcon />
        </div>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-10 pr-4 py-3 rounded-2xl transition-all duration-200 ${
            isDark 
              ? 'bg-slate-700/80 border-slate-600 text-slate-200 focus:bg-slate-600 focus:border-cyan-500' 
              : 'bg-white border-slate-200 text-slate-700 focus:bg-white focus:border-cyan-500 hover:shadow-lg'
          } border focus:outline-none focus:ring-2 focus:ring-cyan-500/50`}
        />
      </div>
    </div>
  );
};

// Quick Date Filter Buttons
const QuickDateFilter: React.FC<{
  onSelect: (days: number) => void;
  currentDays: number;
}> = ({ onSelect, currentDays }) => {
  const { isDark } = useTheme();
  
  const periods = [
    { label: '7D', days: 7 },
    { label: '30D', days: 30 },
    { label: '90D', days: 90 },
    { label: '1Y', days: 365 }
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
      {periods.map((p) => (
        <button
          key={p.days}
          onClick={() => onSelect(p.days)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            currentDays === p.days
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
              : isDark 
                ? 'text-slate-400 hover:text-white hover:bg-slate-700' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-white'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};

// ============================================
// MAIN REPORTS PAGE COMPONENT
// ============================================

const ReportsPage: React.FC<ReportsPageProps> = ({ initialCategory = 'overview', initialType = 'overview' }) => {
  const { t } = useI18n();
  const clinicData = useClinicData();
  const { filters, updateFilter, getPreviousPeriod: getPrevPeriod } = useReportsFilters();
  const { isDark } = useTheme();
  
  const [activeCategory, setActiveCategory] = useState<ReportCategory>(initialCategory);
  const [activeReport, setActiveReport] = useState<ReportType>(initialType);
  const [comparisonDateRange, setComparisonDateRange] = useState(() => {
    const prev = getPrevPeriod(filters.startDate, filters.endDate);
    return prev;
  });
  const [showComparison, setShowComparison] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  useEffect(() => {
    setComparisonDateRange(getPrevPeriod(filters.startDate, filters.endDate));
  }, [filters.startDate, filters.endDate, getPrevPeriod]);

  const handlePeriodChange = (days: number) => {
    setSelectedPeriod(days);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    updateFilter('startDate', start.toISOString().split('T')[0]);
    updateFilter('endDate', end.toISOString().split('T')[0]);
  };

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

  const dateRange = useMemo(() => ({ startDate, endDate }), [startDate, endDate]);

  const { patients, dentists, suppliers, payments, expenses, doctorPayments, supplierInvoices, treatmentRecords, treatmentDefinitions, appointments, inventoryItems, labCases } = clinicData;

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

  const prevPayments = useMemo(() => filterByDate(payments, 'date', comparisonDateRange), [payments, comparisonDateRange, filterByDate]);
  const prevExpenses = useMemo(() => filterByDate(expenses, 'date', comparisonDateRange), [expenses, comparisonDateRange, filterByDate]);
  const prevTreatmentRecords = useMemo(() => filterByDate(treatmentRecords, 'treatmentDate', comparisonDateRange), [treatmentRecords, comparisonDateRange, filterByDate]);
  const prevAppointments = useMemo(() => filterByDate(appointments.map(a => ({ ...a, date: a.startTime.toISOString() })), 'date', comparisonDateRange), [appointments, comparisonDateRange, filterByDate]);

  // Report Data Calculations
  const reportData = useMemo(() => {
    const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalDoctorPayments = filteredDoctorPayments.reduce((sum, dp) => sum + dp.amount, 0);
    const totalSupplierInvoices = filteredSupplierInvoices.reduce((sum, si) => sum + si.amount, 0);
    const clinicRevenue = filteredPayments.reduce((sum, p) => sum + p.clinicShare, 0);
    const doctorRevenue = filteredPayments.reduce((sum, p) => sum + p.doctorShare, 0);
    const netProfit = clinicRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const prevRevenue = prevPayments.reduce((sum, p) => sum + p.amount, 0);
    const prevExpensesTotal = prevExpenses.reduce((sum, e) => sum + e.amount, 0);
    const prevNetProfit = prevRevenue - prevExpensesTotal;

    const revenueGrowth = calculateGrowth(totalRevenue, prevRevenue);
    const expensesGrowth = calculateGrowth(totalExpenses, prevExpensesTotal);
    const profitGrowth = calculateGrowth(netProfit, prevNetProfit);

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
    const activePatients = patientData.filter(p => p.treatments > 0).length;
    const retentionRate = patients.length > 0 ? (activePatients / patients.length) * 100 : 0;

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

    const treatmentTrends = filteredTreatmentRecords.reduce((acc, tr) => {
      const date = tr.treatmentDate.substring(0, 7);
      if (!acc[date]) acc[date] = { month: date, count: 0, revenue: 0 };
      acc[date].count += 1;
      acc[date].revenue += tr.totalTreatmentCost;
      return acc;
    }, {} as Record<string, { month: string; count: number; revenue: number }>);

    const supplierData = suppliers.map(supplier => {
      const invoices = filteredSupplierInvoices.filter(si => si.supplierId === supplier.id);
      const supplierExpenses = filteredExpenses.filter(e => e.supplierId === supplier.id);
      const totalBilled = invoices.reduce((sum, si) => sum + si.amount, 0);
      const totalPaid = supplierExpenses.reduce((sum, e) => sum + e.amount, 0);
      const outstandingBalance = totalBilled - totalPaid;
      
      return {
        id: supplier.id,
        name: supplier.name,
        type: supplier.type,
        totalInvoices: invoices.length,
        totalAmount: totalBilled,
        unpaidAmount: outstandingBalance > 0 ? outstandingBalance : 0,
        expensesAmount: totalPaid,
        avgInvoiceValue: invoices.length > 0 ? totalBilled / invoices.length : 0
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);

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

    const completionRate = appointmentStats.total > 0 ? (appointmentStats.completed / appointmentStats.total) * 100 : 0;
    const noShowRate = appointmentStats.total > 0 ? (appointmentStats.noShow / appointmentStats.total) * 100 : 0;
    const appointmentGrowth = calculateGrowth(appointmentStats.completed, prevAppointmentStats.completed);

    // Heatmap data for appointments
    const heatmapData: { day: string; hour: number; value: number }[] = [];
    const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    filteredAppointments.forEach(a => {
      const date = new Date(a.startTime);
      const day = dayMap[date.getDay()];
      const hour = date.getHours();
      if (hour >= 8 && hour <= 19) {
        heatmapData.push({ day, hour, value: 1 });
      }
    });
    
    const heatmapAggregated: { day: string; hour: number; value: number }[] = [];
    const heatmapMap = new Map<string, number>();
    heatmapData.forEach(h => {
      const key = `${h.day}-${h.hour}`;
      heatmapMap.set(key, (heatmapMap.get(key) || 0) + h.value);
    });
    heatmapMap.forEach((value, key) => {
      const [day, hour] = key.split('-');
      heatmapAggregated.push({ day, hour: parseInt(hour), value });
    });

    const peakHours = filteredAppointments.reduce((acc, a) => {
      const hour = new Date(a.startTime).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakHoursData = Object.entries(peakHours)
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    const dailyFinancials: Record<string, { date: string; revenue: number; expenses: number; doctorRevenue: number; netProfit: number; treatments: number; appointments: number }> = {};
    
    const currentDate = new Date(dateRange.startDate);
    const endDateObj = new Date(dateRange.endDate);
    while (currentDate <= endDateObj) {
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

    const inventoryValue = inventoryItems.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
    const lowStockItems = inventoryItems.filter(item => item.currentStock <= (item.minStockLevel || 10));
    const expiringItems = inventoryItems.filter(item => {
      if (!item.expiryDate) return false;
      const daysUntilExpiry = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    });

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
        paymentMethods, expenseCategories
      },
      patient: patientData,
      patientStats: { newPatients, returningPatients, retentionRate, activePatients },
      doctor: doctorData,
      treatment: { types: treatmentTypes, trends: Object.values(treatmentTrends) },
      supplier: supplierData,
      appointment: { stats: appointmentStats, completionRate, noShowRate, appointmentGrowth, peakHours: peakHoursData, heatmap: heatmapAggregated },
      daily: Object.values(dailyFinancials).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      inventory: { value: inventoryValue, lowStock: lowStockItems, expiring: expiringItems },
      labCases: labCaseStats
    };
  }, [filteredPayments, filteredExpenses, filteredDoctorPayments, filteredSupplierInvoices, filteredTreatmentRecords, filteredAppointments, filteredLabCases, prevPayments, prevExpenses, prevTreatmentRecords, prevAppointments, patients, dentists, suppliers, treatmentDefinitions, inventoryItems, t]);

  // Export Functions
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Revenue', reportData.financial.totalRevenue],
      ['Total Expenses', reportData.financial.totalExpenses],
      ['Net Profit', reportData.financial.netProfit],
      ['Profit Margin', reportData.financial.profitMargin],
      ['Total Patients', patients.length],
      ['Active Patients', reportData.patientStats.activePatients],
      ['New Patients', reportData.patientStats.newPatients]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

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

  // Print Report
  const printDetailedReport = () => {
    openPrintWindow(
      'التقرير الشامل للعيادة',
      <ComprehensiveClinicReportPage
        isPrintWindow={true}
        initialDateRange={dateRange}
      />,
      {
        pageSize: 'A4 landscape',
        mode: 'minimal',
        width: 1440,
        height: 1020,
      }
    );
  };

  // Render Overview Dashboard
  const renderOverview = () => (
    <div className="space-y-8">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatKPICard
          title={t('reports.totalRevenue')}
          value={formatCurrency(reportData.financial.totalRevenue)}
          icon={<DollarIcon />}
          color="blue"
          trend={reportData.financial.revenueGrowth}
          subtitle="vs previous period"
          sparklineData={reportData.daily.slice(-7).map(d => d.revenue)}
        />
        <StatKPICard
          title={t('reports.netProfit')}
          value={formatCurrency(reportData.financial.netProfit)}
          icon={<ChartIcon />}
          color={reportData.financial.netProfit >= 0 ? 'green' : 'red'}
          trend={reportData.financial.profitGrowth}
          subtitle="vs previous period"
          sparklineData={reportData.daily.slice(-7).map(d => d.netProfit)}
        />
        <StatKPICard
          title={t('reports.activePatients')}
          value={formatNumber(reportData.patientStats.activePatients)}
          icon={<UserIcon />}
          color="purple"
          subtitle={`of ${formatNumber(patients.length)} total`}
          sparklineData={reportData.daily.slice(-7).map(d => d.treatments)}
        />
        <StatKPICard
          title={t('reports.completionRate')}
          value={formatPercentage(reportData.appointment.completionRate)}
          icon={<ClockIcon />}
          color="indigo"
          trend={reportData.appointment.appointmentGrowth}
          subtitle="appointments completed"
        />
      </div>

      {/* Gauge KPIs Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <GaugeKPICard
          title="Revenue Target"
          value={Math.min((reportData.financial.totalRevenue / 500000) * 100, 100)}
          maxValue={100}
          icon={<DollarIcon />}
          color="blue"
        />
        <GaugeKPICard
          title="Profit Margin"
          value={reportData.financial.profitMargin}
          maxValue={100}
          icon={<ChartIcon />}
          color="green"
        />
        <GaugeKPICard
          title="Patient Retention"
          value={reportData.patientStats.retentionRate}
          maxValue={100}
          icon={<UserIcon />}
          color="purple"
        />
        <GaugeKPICard
          title="Appointment Rate"
          value={reportData.appointment.completionRate}
          maxValue={100}
          icon={<ClockIcon />}
          color="orange"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModernChartCard
          title={t('reports.revenueDistribution')}
        >
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
              <Tooltip content={<CustomTooltip isDark={isDark} formatter={formatCurrency} />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ModernChartCard>

        <ModernChartCard
          title={t('reports.expenseCategories')}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.financial.expenseCategories} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis type="number" stroke={isDark ? '#64748b' : '#94a3b8'} />
              <YAxis dataKey="label" type="category" width={100} stroke={isDark ? '#64748b' : '#94a3b8'} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {reportData.financial.expenseCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ModernChartCard>
      </div>

      {/* Daily Trend Chart */}
      <ModernChartCard
        title={t('reports.dailyTrend')}
      >
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={reportData.daily}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
            <XAxis dataKey="date" stroke={isDark ? '#64748b' : '#94a3b8'} />
            <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} />
            <Tooltip content={<CustomTooltip isDark={isDark} formatter={formatCurrency} />} />
            <Legend />
            <Area type="monotone" dataKey="revenue" stroke="#06b6d4" fill="url(#revenueGradient)" name={t('reports.revenue')} strokeWidth={2} />
            <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expenseGradient)" name={t('reports.expenses')} strokeWidth={2} />
            <Area type="monotone" dataKey="netProfit" stroke="#10b981" fill="none" name={t('reports.netProfit')} strokeWidth={2} strokeDasharray="5 5" />
          </AreaChart>
        </ResponsiveContainer>
      </ModernChartCard>

      {/* Heatmap Chart */}
      <ModernChartCard
        title="Appointment Heatmap"
      >
        <HeatmapChart data={reportData.appointment.heatmap} />
      </ModernChartCard>
    </div>
  );

  // Render Financial Report
  const renderFinancialReport = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatKPICard
          title={t('reports.totalRevenue')}
          value={formatCurrency(reportData.financial.totalRevenue)}
          icon={<DollarIcon />}
          color="blue"
          trend={reportData.financial.revenueGrowth}
        />
        <StatKPICard
          title={t('reports.totalExpenses')}
          value={formatCurrency(reportData.financial.totalExpenses)}
          icon={<ChartIcon />}
          color="red"
          trend={reportData.financial.expensesGrowth}
        />
        <StatKPICard
          title={t('reports.netProfit')}
          value={formatCurrency(reportData.financial.netProfit)}
          icon={<ChartIcon />}
          color={reportData.financial.netProfit >= 0 ? 'green' : 'red'}
          trend={reportData.financial.profitGrowth}
        />
        <StatKPICard
          title={t('reports.profitMargin')}
          value={formatPercentage(reportData.financial.profitMargin)}
          icon={<AnalyticsIcon />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModernChartCard title="Revenue by Category">
          <CustomTreemap
            data={reportData.financial.paymentMethods.map((pm, i) => ({
              name: pm.label,
              size: pm.value
            }))}
          />
        </ModernChartCard>

        <ModernChartCard title="Expense Distribution">
          <CustomTreemap
            data={reportData.financial.expenseCategories.map((ec, i) => ({
              name: ec.label,
              size: ec.value
            }))}
          />
        </ModernChartCard>
      </div>

      <ModernChartCard title={t('reports.dailyFinancialTrend')}>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={reportData.daily}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
            <XAxis dataKey="date" stroke={isDark ? '#64748b' : '#94a3b8'} />
            <YAxis yAxisId="left" stroke={isDark ? '#64748b' : '#94a3b8'} />
            <YAxis yAxisId="right" orientation="right" stroke={isDark ? '#64748b' : '#94a3b8'} />
            <Tooltip content={<CustomTooltip isDark={isDark} formatter={formatCurrency} />} />
            <Legend />
            <Bar yAxisId="left" dataKey="treatments" fill="#10b981" name={t('reports.treatments')} radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#06b6d4" name={t('reports.revenue')} strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="expenses" stroke="#ef4444" name={t('reports.expenses')} strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </ModernChartCard>

      <ModernDataTable
        title={t('reports.dailyFinancialSummary')}
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'revenue', label: 'Revenue', align: 'right' },
          { key: 'expenses', label: 'Expenses', align: 'right' },
          { key: 'netProfit', label: 'Net Profit', align: 'right' },
          { key: 'treatments', label: 'Treatments', align: 'right' }
        ]}
        data={reportData.daily}
        renderRow={(day) => (
          <>
            <td className="px-6 py-4 font-medium">{day.date}</td>
            <td className="px-6 py-4 text-right text-cyan-600 font-semibold">{formatCurrency(day.revenue)}</td>
            <td className="px-6 py-4 text-right text-rose-600 font-semibold">{formatCurrency(day.expenses)}</td>
            <td className={`px-6 py-4 text-right font-bold ${day.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(day.netProfit)}
            </td>
            <td className="px-6 py-4 text-right">{day.treatments}</td>
          </>
        )}
        maxHeight="400px"
      />
    </div>
  );

  // Render Patient Report
  const renderPatientReport = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatKPICard
          title={t('reports.totalPatients')}
          value={formatNumber(patients.length)}
          icon={<UserIcon />}
          color="blue"
        />
        <StatKPICard
          title={t('reports.activePatients')}
          value={formatNumber(reportData.patientStats.activePatients)}
          icon={<UserIcon />}
          color="green"
        />
        <StatKPICard
          title={t('reports.newPatients')}
          value={formatNumber(reportData.patientStats.newPatients)}
          icon={<UserIcon />}
          color="purple"
        />
        <StatKPICard
          title={t('reports.retentionRate')}
          value={formatPercentage(reportData.patientStats.retentionRate)}
          icon={<AnalyticsIcon />}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModernChartCard title={t('reports.patientDistribution')}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: t('reports.newPatients'), value: reportData.patientStats.newPatients },
                  { name: t('reports.returningPatients'), value: reportData.patientStats.returningPatients },
                  { name: 'Inactive', value: patients.length - reportData.patientStats.activePatients }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#06b6d4" />
                <Cell fill="#f59e0b" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ModernChartCard>

        <ModernChartCard title={t('reports.patientValueDistribution')}>
          <CustomTreemap
            data={[
              { name: '0-500', size: reportData.patient.filter(p => p.totalSpent <= 500).length },
              { name: '501-1000', size: reportData.patient.filter(p => p.totalSpent > 500 && p.totalSpent <= 1000).length },
              { name: '1001-2000', size: reportData.patient.filter(p => p.totalSpent > 1000 && p.totalSpent <= 2000).length },
              { name: '2001-5000', size: reportData.patient.filter(p => p.totalSpent > 2000 && p.totalSpent <= 5000).length },
              { name: '5000+', size: reportData.patient.filter(p => p.totalSpent > 5000).length }
            ]}
          />
        </ModernChartCard>
      </div>

      <ModernDataTable
        title={t('reports.topPatients')}
        columns={[
          { key: 'name', label: 'Patient Name' },
          { key: 'treatments', label: 'Treatments', align: 'right' },
          { key: 'totalSpent', label: 'Total Spent', align: 'right' },
          { key: 'totalPaid', label: 'Total Paid', align: 'right' },
          { key: 'status', label: 'Status', align: 'center' }
        ]}
        data={reportData.patient.slice(0, 20)}
        renderRow={(patient) => (
          <>
            <td className="px-6 py-4">
              <div className="font-semibold">{patient.name}</div>
              <div className="text-xs opacity-60">{patient.phone}</div>
            </td>
            <td className="px-6 py-4 text-right">{patient.treatments}</td>
            <td className="px-6 py-4 text-right text-cyan-600 font-medium">{formatCurrency(patient.totalSpent)}</td>
            <td className="px-6 py-4 text-right text-emerald-600 font-medium">{formatCurrency(patient.totalPaid)}</td>
            <td className="px-6 py-4 text-center">
              {patient.isNew ? (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">New</span>
              ) : patient.isReturning ? (
                <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-medium">Returning</span>
              ) : (
                <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium">Inactive</span>
              )}
            </td>
          </>
        )}
        maxHeight="400px"
      />
    </div>
  );

  // Render Doctor Report
  const renderDoctorReport = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatKPICard
          title={t('reports.totalDoctors')}
          value={formatNumber(dentists.length)}
          icon={<UserIcon />}
          color="blue"
        />
        <StatKPICard
          title={t('reports.totalTreatments')}
          value={formatNumber(filteredTreatmentRecords.length)}
          icon={<ToothIcon />}
          color="green"
        />
        <StatKPICard
          title={t('reports.totalDoctorRevenue')}
          value={formatCurrency(reportData.financial.doctorRevenue)}
          icon={<DollarIcon />}
          color="purple"
        />
        <StatKPICard
          title={t('reports.avgTreatmentsPerDoctor')}
          value={formatNumber(dentists.length > 0 ? Math.round(filteredTreatmentRecords.length / dentists.length) : 0)}
          icon={<AnalyticsIcon />}
          color="orange"
        />
      </div>

      <ModernChartCard title={t('reports.doctorPerformanceComparison')}>
        <CustomRadarChart
          data={reportData.doctor.slice(0, 5).map(d => ({
            subject: d.name?.substring(0, 8) || 'Doctor',
            A: (d.treatments / Math.max(...reportData.doctor.map(doc => doc.treatments), 1)) * 100,
            B: reportData.doctor.length > 1 ? (d.patients / Math.max(...reportData.doctor.map(doc => doc.patients), 1)) * 100 : undefined,
            fullMark: 100
          }))}
        />
      </ModernChartCard>

      <ModernChartCard title={t('reports.doctorPerformanceComparison')}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={reportData.doctor}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
            <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#94a3b8'} />
            <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} />
            <Tooltip content={<CustomTooltip isDark={isDark} formatter={formatCurrency} />} />
            <Legend />
            <Bar dataKey="treatments" fill="#06b6d4" name={t('reports.treatments')} />
            <Bar dataKey="patients" fill="#8b5cf6" name={t('reports.patients')} />
            <Bar dataKey="totalRevenue" fill="#10b981" name={t('reports.revenue')} />
          </BarChart>
        </ResponsiveContainer>
      </ModernChartCard>

      <ModernDataTable
        title={t('reports.doctorPerformance')}
        columns={[
          { key: 'name', label: 'Doctor Name' },
          { key: 'specialty', label: 'Specialty' },
          { key: 'treatments', label: 'Treatments', align: 'right' },
          { key: 'patients', label: 'Patients', align: 'right' },
          { key: 'totalRevenue', label: 'Revenue', align: 'right' },
          { key: 'doctorRevenue', label: 'Doctor Share', align: 'right' },
          { key: 'growth', label: 'Growth', align: 'center' }
        ]}
        data={reportData.doctor}
        renderRow={(doctor) => (
          <>
            <td className="px-6 py-4 font-semibold">{doctor.name}</td>
            <td className="px-6 py-4">{doctor.specialty}</td>
            <td className="px-6 py-4 text-right">{doctor.treatments}</td>
            <td className="px-6 py-4 text-right">{doctor.patients}</td>
            <td className="px-6 py-4 text-right text-cyan-600 font-medium">{formatCurrency(doctor.totalRevenue)}</td>
            <td className="px-6 py-4 text-right text-emerald-600 font-medium">{formatCurrency(doctor.doctorRevenue)}</td>
            <td className="px-6 py-4 text-center">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                doctor.growth >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {doctor.growth >= 0 ? '+' : ''}{doctor.growth.toFixed(1)}%
              </span>
            </td>
          </>
        )}
        maxHeight="400px"
      />
    </div>
  );

  // Render Treatment Report
  const renderTreatmentReport = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatKPICard
          title={t('reports.totalTreatments')}
          value={formatNumber(filteredTreatmentRecords.length)}
          icon={<ToothIcon />}
          color="blue"
        />
        <StatKPICard
          title={t('reports.uniqueTreatments')}
          value={formatNumber(reportData.treatment.types.length)}
          icon={<ToothIcon />}
          color="green"
        />
        <StatKPICard
          title={t('reports.totalRevenue')}
          value={formatCurrency(reportData.treatment.types.reduce((sum: number, t) => sum + t.revenue, 0))}
          icon={<DollarIcon />}
          color="purple"
        />
        <StatKPICard
          title={t('reports.avgTreatmentValue')}
          value={formatCurrency(filteredTreatmentRecords.length > 0 ? reportData.treatment.types.reduce((sum: number, t) => sum + t.revenue, 0) / filteredTreatmentRecords.length : 0)}
          icon={<AnalyticsIcon />}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModernChartCard title={t('reports.treatmentFrequency')}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.treatment.types.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} stroke={isDark ? '#64748b' : '#94a3b8'} />
              <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} />
              <Tooltip />
              <Bar dataKey="count" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </ModernChartCard>

        <ModernChartCard title={t('reports.treatmentRevenue')}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.treatment.types.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} stroke={isDark ? '#64748b' : '#94a3b8'} />
              <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="revenue" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </ModernChartCard>
      </div>

      <ModernChartCard title={t('reports.treatmentTrends')}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={reportData.treatment.trends}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
            <XAxis dataKey="month" stroke={isDark ? '#64748b' : '#94a3b8'} />
            <YAxis yAxisId="left" stroke={isDark ? '#64748b' : '#94a3b8'} />
            <YAxis yAxisId="right" orientation="right" stroke={isDark ? '#64748b' : '#94a3b8'} />
            <Tooltip formatter={(value, name) => [name === 'revenue' ? formatCurrency(Number(value)) : value, name]} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="count" stroke="#06b6d4" name={t('reports.count')} strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" name={t('reports.revenue')} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ModernChartCard>
    </div>
  );

  // Render Supplier Report
  const renderSupplierReport = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatKPICard
          title={t('reports.totalSuppliers')}
          value={formatNumber(suppliers.length)}
          icon={<TruckIcon />}
          color="blue"
        />
        <StatKPICard
          title={t('reports.totalInvoices')}
          value={formatNumber(filteredSupplierInvoices.length)}
          icon={<BoxIcon />}
          color="green"
        />
        <StatKPICard
          title={t('reports.totalAmount')}
          value={formatCurrency(reportData.financial.totalSupplierInvoices)}
          icon={<DollarIcon />}
          color="purple"
        />
        <StatKPICard
          title={t('reports.unpaidAmount')}
          value={formatCurrency(reportData.supplier.reduce((sum, s) => sum + s.unpaidAmount, 0))}
          icon={<ChartIcon />}
          color="red"
        />
      </div>

      <ModernChartCard title={t('reports.supplierComparison')}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={reportData.supplier}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
            <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#94a3b8'} />
            <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Bar dataKey="totalAmount" fill="#06b6d4" name={t('reports.totalAmount')} />
            <Bar dataKey="unpaidAmount" fill="#ef4444" name={t('reports.unpaidAmount')} />
            <Bar dataKey="expensesAmount" fill="#10b981" name={t('reports.expenses')} />
          </BarChart>
        </ResponsiveContainer>
      </ModernChartCard>
    </div>
  );

  // Render Appointment Report
  const renderAppointmentReport = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatKPICard
          title={t('reports.totalAppointments')}
          value={formatNumber(reportData.appointment.stats.total)}
          icon={<ClockIcon />}
          color="blue"
        />
        <StatKPICard
          title={t('reports.completed')}
          value={formatNumber(reportData.appointment.stats.completed)}
          icon={<AnalyticsIcon />}
          color="green"
        />
        <StatKPICard
          title={t('reports.completionRate')}
          value={formatPercentage(reportData.appointment.completionRate)}
          icon={<ChartIcon />}
          color="purple"
        />
        <StatKPICard
          title={t('reports.noShowRate')}
          value={formatPercentage(reportData.appointment.noShowRate)}
          icon={<ChartIcon />}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModernChartCard title={t('reports.appointmentStatusDistribution')}>
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
        </ModernChartCard>

        <ModernChartCard title={t('reports.peakHours')}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.appointment.peakHours}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="hour" stroke={isDark ? '#64748b' : '#94a3b8'} />
              <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </ModernChartCard>
      </div>

      <ModernChartCard title="Appointment Heatmap">
        <HeatmapChart data={reportData.appointment.heatmap} />
      </ModernChartCard>
    </div>
  );

  // Render Inventory Report
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false);

  const renderInventoryReport = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatKPICard
          title={t('reports.inventoryValue')}
          value={formatCurrency(reportData.inventory.value)}
          icon={<BoxIcon />}
          color="blue"
        />
        <StatKPICard
          title={t('reports.totalItems')}
          value={formatNumber(inventoryItems.length)}
          icon={<BoxIcon />}
          color="green"
        />
        <StatKPICard
          title={t('reports.lowStockItems')}
          value={formatNumber(reportData.inventory.lowStock.length)}
          icon={<ChartIcon />}
          color="red"
        />
        <StatKPICard
          title={t('reports.expiringItems')}
          value={formatNumber(reportData.inventory.expiring.length)}
          icon={<ClockIcon />}
          color="orange"
        />
      </div>

      {reportData.inventory.lowStock.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => setIsLowStockModalOpen(true)}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-cyan-600 hover:to-purple-600 flex items-center gap-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <BoxIcon />
            {t('inventory.generatePurchaseOrders')}
          </button>
        </div>
      )}

      {reportData.inventory.lowStock.length > 0 && (
        <ModernDataTable
          title={t('reports.lowStockAlert')}
          columns={[
            { key: 'name', label: 'Item Name' },
            { key: 'currentStock', label: 'Current Stock', align: 'right' },
            { key: 'minStockLevel', label: 'Min Stock', align: 'right' },
            { key: 'unitCost', label: 'Unit Cost', align: 'right' }
          ]}
          data={reportData.inventory.lowStock}
          renderRow={(item) => (
            <>
              <td className="px-6 py-4 font-medium">{item.name}</td>
              <td className="px-6 py-4 text-right text-rose-600 font-bold">{item.currentStock}</td>
              <td className="px-6 py-4 text-right">{item.minStockLevel || 10}</td>
              <td className="px-6 py-4 text-right">{formatCurrency(item.unitCost)}</td>
            </>
          )}
          maxHeight="300px"
        />
      )}

      {reportData.inventory.expiring.length > 0 && (
        <ModernDataTable
          title={t('reports.expiringSoon')}
          columns={[
            { key: 'name', label: 'Item Name' },
            { key: 'expiryDate', label: 'Expiry Date' },
            { key: 'currentStock', label: 'Current Stock', align: 'right' },
            { key: 'daysLeft', label: 'Days Left', align: 'right' }
          ]}
          data={reportData.inventory.expiring}
          renderRow={(item) => {
            const daysLeft = Math.ceil((new Date(item.expiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return (
              <>
                <td className="px-6 py-4 font-medium">{item.name}</td>
                <td className="px-6 py-4 text-right">{item.expiryDate}</td>
                <td className="px-6 py-4 text-right">{item.currentStock}</td>
                <td className="px-6 py-4 text-right text-amber-600 font-bold">{daysLeft} days</td>
              </>
            );
          }}
          maxHeight="300px"
        />
      )}
    </div>
  );

  // Render Analytics Report
  const renderAnalyticsReport = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatKPICard
          title={t('reports.revenuePerPatient')}
          value={formatCurrency(reportData.patientStats.activePatients > 0 ? reportData.financial.totalRevenue / reportData.patientStats.activePatients : 0)}
          icon={<DollarIcon />}
          color="blue"
        />
        <StatKPICard
          title={t('reports.revenuePerAppointment')}
          value={formatCurrency(reportData.appointment.stats.completed > 0 ? reportData.financial.totalRevenue / reportData.appointment.stats.completed : 0)}
          icon={<ClockIcon />}
          color="green"
        />
        <StatKPICard
          title={t('reports.avgTreatmentTime')}
          value={t('reports.avgTreatmentTimeValue')}
          icon={<ClockIcon />}
          color="purple"
        />
        <StatKPICard
          title={t('reports.patientSatisfaction')}
          value="4.8/5"
          icon={<AnalyticsIcon />}
          color="orange"
        />
      </div>

      <ModernChartCard title={t('reports.labCasesSummary')}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-cyan-50 dark:bg-cyan-900/30 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{reportData.labCases.total}</div>
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
      </ModernChartCard>

      <ModernChartCard title={t('reports.keyInsights')}>
        <div className="bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl p-6 text-white">
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
      </ModernChartCard>
    </div>
  );

  // Category Tabs
  const categoryTabs = [
    { id: 'overview', label: t('reports.overview'), icon: <ChartIcon />, color: 'blue' },
    { id: 'financial', label: t('reports.financialReports'), icon: <DollarIcon />, color: 'green' },
    { id: 'patient', label: t('reports.patientReports'), icon: <UserIcon />, color: 'purple' },
    { id: 'doctor', label: t('reports.doctorReports'), icon: <UserIcon />, color: 'indigo' },
    { id: 'treatment', label: t('reports.treatmentReports'), icon: <ToothIcon />, color: 'teal' },
    { id: 'supplier', label: t('reports.supplierReports'), icon: <TruckIcon />, color: 'orange' },
    { id: 'appointment', label: t('reports.appointmentReports'), icon: <ClockIcon />, color: 'pink' },
    { id: 'inventory', label: t('reports.inventoryReports'), icon: <BoxIcon />, color: 'cyan' },
    { id: 'analytics', label: 'Analytics', icon: <AnalyticsIcon />, color: 'rose' }
  ];

  const renderReportContent = () => {
    switch (activeCategory) {
      case 'overview': return renderOverview();
      case 'financial': return renderFinancialReport();
      case 'patient': return renderPatientReport();
      case 'doctor': return renderDoctorReport();
      case 'treatment': return renderTreatmentReport();
      case 'supplier': return renderSupplierReport();
      case 'appointment': return renderAppointmentReport();
      case 'inventory': return renderInventoryReport();
      case 'analytics': return renderAnalyticsReport();
      default: return renderOverview();
    }
  };


  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {isLowStockModalOpen && (
        <LowStockPurchaseOrderModal
          clinicData={clinicData}
          onClose={() => setIsLowStockModalOpen(false)}
        />
      )}

      {/* Header */}
      <div className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-r ${
          isDark 
            ? 'from-slate-800 via-slate-900 to-slate-800' 
            : 'from-cyan-600 via-blue-600 to-purple-600'
        }`}></div>
        
        {/* Animated background elements */}
        <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse duration-[3000ms] ${
          isDark ? 'bg-cyan-500' : 'bg-white'
        }`}></div>
        <div className={`absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl opacity-30 animate-pulse duration-[4000ms] ${
          isDark ? 'bg-purple-500' : 'bg-white'
        }`}></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h4zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-5">
              {/* Animated Icon Container */}
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`hidden sm:flex items-center justify-center w-20 h-20 rounded-3xl backdrop-blur-md shadow-2xl ${
                  isDark ? 'bg-white/10 border border-white/20' : 'bg-white/30 border border-white/40'
                }`}
              >
                <div className="text-white">
                  <ChartIcon />
                </div>
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-5xl font-bold text-white tracking-tight"
                >
                  {t('reports.title')}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg mt-3 text-white/80 font-medium"
                >
                  {t('reports.subtitle')}
                </motion.p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={printDetailedReport}
                className="group relative px-6 py-3 rounded-2xl font-semibold text-white overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/25"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                <span className="relative flex items-center gap-2">
                  <DownloadIcon />
                  <span>{t('common.print')}</span>
                </span>
              </button>
              <button
                onClick={exportToExcel}
                className="group relative px-6 py-3 rounded-2xl font-semibold text-white overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/25"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                <span className="relative flex items-center gap-2">
                  <DownloadIcon />
                  <span>Excel</span>
                </span>
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`relative z-40 ${
        isDark 
          ? 'bg-slate-800/95 border-slate-700/50' 
          : 'bg-white/95 border-slate-200/50'
      } backdrop-blur-xl shadow-2xl`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Filter Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'}`}>
              <FilterIcon />
            </div>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {t('reports.filtersAndControls')}
            </h3>
          </div>
          
          <div className="flex flex-col xl:flex-row items-end gap-5">
            {/* Date Range Section */}
            <div className="flex flex-wrap gap-4 flex-1">
              <div className="flex flex-col gap-2">
                <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Date Range
                </span>
                <div className="flex items-center gap-2">
                  <ModernDateInput
                    label=""
                    value={filters.startDate}
                    onChange={(value) => updateFilter('startDate', value)}
                  />
                  <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'}`}>→</span>
                  <ModernDateInput
                    label=""
                    value={filters.endDate}
                    onChange={(value) => updateFilter('endDate', value)}
                  />
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <QuickDateFilter onSelect={handlePeriodChange} currentDays={selectedPeriod} />
              </div>
            </div>
            
            {/* Dropdowns */}
            <div className="flex flex-wrap gap-4">
              <ModernSelect
                label="Dentist"
                value={filters.selectedDentist}
                onChange={(value) => updateFilter('selectedDentist', value)}
                options={[
                  { value: '', label: t('common.all') },
                  ...dentists.map(d => ({ value: d.id, label: d.name }))
                ]}
                icon={<UserIcon />}
              />
              <ModernSelect
                label="Payment Method"
                value={filters.selectedPaymentMethod}
                onChange={(value) => updateFilter('selectedPaymentMethod', value)}
                options={[
                  { value: '', label: t('common.all') },
                  { value: 'Cash', label: t('paymentMethod.Cash') },
                  { value: 'Instapay', label: t('paymentMethod.Instapay') },
                  { value: 'Vodafone Cash', label: t('paymentMethod.Vodafone Cash') },
                  { value: 'Other', label: t('paymentMethod.Other') }
                ]}
                icon={<DollarIcon />}
              />
            </div>
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
            <nav className="flex flex-wrap overflow-x-auto px-2">
              {categoryTabs.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as ReportCategory)}
                  className={`py-4 px-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-300 whitespace-nowrap ${
                    activeCategory === cat.id
                      ? `border-${cat.color}-500 text-${cat.color}-600 ${
                          isDark 
                            ? `bg-${cat.color}-900/20` 
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
