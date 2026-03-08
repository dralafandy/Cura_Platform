import React, { useMemo, useState } from 'react';
import { ClinicData } from '../hooks/useClinicData';
import { AppointmentStatus, LabCaseStatus, View, Dentist, TreatmentRecord, ExpenseCategory, Appointment } from '../types';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../contexts/AuthContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import DoctorDashboard from './DoctorDashboard';

// ==================== ICONS ====================
const Icons = {
    Patients: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    ),
    Calendar: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    Dollar: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    TrendingUp: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
    ),
    TrendingDown: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
    ),
    Activity: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    ),
    Clock: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Alert: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
    ),
    Lab: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
    ),
    Inventory: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
    ),
    UserPlus: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
    ),
    Chart: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    ),
    Check: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    ),
    Wallet: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
    ),
    Doctor: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    Home: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    ),
    ChevronRight: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
    ),
};

// ==================== ANIMATED KPI CARD ====================
interface KPICardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    gradient: string;
    trend?: { value: number; isPositive: boolean };
    subtitle?: string;
    delay?: number;
    onClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({ 
    title, value, icon, color, gradient, trend, subtitle, delay = 0, onClick 
}) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay * 0.1 }}
            className="relative overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <motion.div
                className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer group ${onClick ? 'hover:scale-[1.02]' : ''}`}
                onClick={onClick}
                whileHover={{ y: -4 }}
            >
                <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative p-5 sm:p-6">
                    <div className="flex items-start justify-between">
                        <div className={`p-3 sm:p-4 rounded-2xl ${color} shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                            {icon}
                        </div>
                        {trend && (
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5 + delay * 0.1 }}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                    trend.isPositive 
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}
                            >
                                {trend.isPositive ? <Icons.TrendingUp /> : <Icons.TrendingDown />}
                                {Math.abs(trend.value)}%
                            </motion.div>
                        )}
                    </div>
                    
                    <div className="mt-4 sm:mt-5">
                        <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
                        <motion.p 
                            className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200 mt-1"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            key={String(value)}
                        >
                            {value}
                        </motion.p>
                        {subtitle && (
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">{subtitle}</p>
                        )}
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-700">
                        <motion.div 
                            className={`h-full ${trend?.isPositive ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 1, delay: 0.8 + delay * 0.1 }}
                        />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ==================== CHART CARD ====================
interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    delay?: number;
    action?: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, children, delay = 0, action }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: delay * 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
    >
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{title}</h3>
                    {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
                </div>
                {action}
            </div>
        </div>
        <div className="p-4 sm:p-6">
            {children}
        </div>
    </motion.div>
);

// ==================== PROGRESS RING ====================
interface ProgressRingProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    color: string;
    label: string;
    value: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({ 
    progress, size = 80, strokeWidth = 8, color, label, value 
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    
    return (
        <div className="flex flex-col items-center">
            <div className="relative" style={{ width: size, height: size }}>
                <svg className="transform -rotate-90" width={size} height={size}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="none"
                        className="text-slate-200 dark:text-slate-700"
                    />
                    <motion.circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="none"
                        className={color}
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, delay: 0.5 }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{progress}%</span>
                </div>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">{label}</p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{value}</p>
        </div>
    );
};

// ==================== MAIN DASHBOARD ====================
const Dashboard: React.FC<{ clinicData: ClinicData, setCurrentView: (view: View) => void }> = ({ clinicData, setCurrentView }) => {
    const { t, locale } = useI18n();
    const { isAdmin, userProfile } = useAuth();
    const { preferences } = useUserPreferences();
    const { dashboard } = preferences;
    const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'patients' | 'operations'>('overview');

    const { patients, appointments, treatmentRecords, inventoryItems, labCases, dentists, payments, expenses, supplierInvoices, doctorPayments, prescriptions } = clinicData;

    const linkedDoctorId = useMemo(() => {
        if (userProfile?.dentist_id) return userProfile.dentist_id;
        if (userProfile?.role === 'DOCTOR') {
            const matchedDoctor = dentists.find(d => d.name.trim().toLowerCase() === userProfile.username.trim().toLowerCase());
            return matchedDoctor?.id || null;
        }
        return null;
    }, [userProfile, dentists]);

    if (userProfile?.role === 'DOCTOR') {
        if (!linkedDoctorId) {
            return (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-5">
                    Your account is a doctor account, but it is not linked to a doctor profile yet.
                    Please ask admin to link this user to a doctor from User Management.
                </div>
            );
        }
        return <DoctorDashboard clinicData={clinicData} doctorId={linkedDoctorId} setCurrentView={setCurrentView} />;
    }

    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 });

    // ==================== CALCULATIONS ====================
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysAppointmentsCount = useMemo(() => {
        return appointments.filter(apt => {
            const aptDate = new Date(apt.startTime);
            aptDate.setHours(0, 0, 0, 0);
            return aptDate.getTime() === today.getTime();
        }).length;
    }, [appointments, today]);

    const todaysPayments = useMemo(() => {
        return payments.filter(p => {
            const pDate = new Date(p.date);
            pDate.setHours(0, 0, 0, 0);
            return pDate.getTime() === today.getTime();
        });
    }, [payments, today]);

    const todaysRevenue = useMemo(() => todaysPayments.reduce((sum, p) => sum + p.amount, 0), [todaysPayments]);
    const todaysExpenses = useMemo(() => {
        return expenses.filter(exp => {
            const expDate = new Date(exp.date);
            expDate.setHours(0, 0, 0, 0);
            return expDate.getTime() === today.getTime();
        }).reduce((sum, exp) => sum + exp.amount, 0);
    }, [expenses, today]);

    const doctorsDuesToday = useMemo(() => {
        return todaysPayments.reduce((sum, p) => sum + p.doctorShare, 0);
    }, [todaysPayments]);

    const netToday = useMemo(() => todaysRevenue - todaysExpenses - doctorsDuesToday, [todaysRevenue, todaysExpenses, doctorsDuesToday]);

    const doctorsDues = useMemo(() => {
        const totalDoctorShares = treatmentRecords.reduce((sum, tr) => sum + tr.doctorShare, 0);
        const totalDoctorPayments = doctorPayments.reduce((sum, dp) => sum + dp.amount, 0);
        return totalDoctorShares - totalDoctorPayments;
    }, [treatmentRecords, doctorPayments]);

    const nextAppointment = useMemo(() => {
        const now = new Date();
        const upcomingAppointments = appointments
            .filter(apt => new Date(apt.startTime) > now)
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        return upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;
    }, [appointments]);

    const upcomingAppointmentsList = useMemo(() => {
        const now = new Date();
        return appointments
            .filter(apt => new Date(apt.startTime) > now)
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .slice(0, 8);
    }, [appointments]);

    // This month calculations
    const thisMonthRevenue = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        return payments
            .filter(p => {
                const pDate = new Date(p.date);
                return pDate >= startOfMonth && pDate <= endOfMonth;
            })
            .reduce((sum, p) => sum + p.amount, 0);
    }, [payments]);

    const thisMonthExpenses = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        return expenses
            .filter(exp => {
                const expDate = new Date(exp.date);
                return expDate >= startOfMonth && expDate <= endOfMonth;
            })
            .reduce((sum, exp) => sum + exp.amount, 0);
    }, [expenses]);

    const thisMonthDoctorShares = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        return payments
            .filter(p => {
                const pDate = new Date(p.date);
                return pDate >= startOfMonth && pDate <= endOfMonth;
            })
            .reduce((sum, p) => sum + p.doctorShare, 0);
    }, [payments]);

    const totalExpensesThisMonth = thisMonthExpenses + thisMonthDoctorShares;
    const clinicProfitThisMonth = thisMonthRevenue - totalExpensesThisMonth;

    const pendingPayments = useMemo(() => {
        const totalCharges = treatmentRecords.reduce((sum, tr) => {
            const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
            return sum + (treatmentDef ? treatmentDef.basePrice : 0);
        }, 0);
        const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
        return Math.max(0, totalCharges - totalPayments);
    }, [treatmentRecords, payments, clinicData.treatmentDefinitions]);

    const overdueInvoices = useMemo(() => {
        const todayDate = new Date();
        return supplierInvoices.filter(invoice =>
            invoice.status === 'UNPAID' &&
            invoice.dueDate &&
            new Date(invoice.dueDate) < todayDate
        ).length;
    }, [supplierInvoices]);

    const newPatientsThisMonth = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        return patients.filter(p => {
            const patientRecords = treatmentRecords.filter(tr => tr.patientId === p.id);
            if (patientRecords.length === 0) return false;
            
            const firstTreatment = patientRecords.sort((a,b) => new Date(a.treatmentDate).getTime() - new Date(b.treatmentDate).getTime())[0];
            const firstTreatmentDate = new Date(firstTreatment.treatmentDate);
            return firstTreatmentDate >= startOfMonth && firstTreatmentDate <= endOfMonth;
        }).length;
    }, [patients, treatmentRecords]);

    const pendingLabCases = useMemo(() => {
        return labCases.filter(lc => ![LabCaseStatus.FITTED_TO_PATIENT, LabCaseStatus.CANCELLED].includes(lc.status))
                       .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                       .slice(0, 5);
    }, [labCases]);

    const lowStockItems = useMemo(() => {
        const lowStockThreshold = 10;
        return inventoryItems.filter(item => item.currentStock <= lowStockThreshold)
                             .sort((a,b) => a.currentStock - b.currentStock)
                             .slice(0, 5);
    }, [inventoryItems]);

    // ==================== CHART DATA ====================
    
    // Daily trends (last 7 days)
    const dailyTrendsData = useMemo(() => {
        const days = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            dayEnd.setHours(23, 59, 59, 999);

            const dayRevenue = payments
                .filter(p => {
                    const pDate = new Date(p.date);
                    return pDate >= dayStart && pDate <= dayEnd;
                })
                .reduce((sum, p) => sum + p.amount, 0);

            const dayExpenses = expenses
                .filter(exp => {
                    const expDate = new Date(exp.date);
                    return expDate >= dayStart && expDate <= dayEnd;
                })
                .reduce((sum, exp) => sum + exp.amount, 0);

            days.push({
                day: dayStart.toLocaleDateString(locale, { weekday: 'short' }),
                revenue: dayRevenue,
                expenses: dayExpenses,
                profit: dayRevenue - dayExpenses
            });
        }
        return days;
    }, [payments, expenses, locale]);

    // Monthly trends (last 6 months)
    const monthlyTrendsData = useMemo(() => {
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            const monthRevenue = payments
                .filter(p => {
                    const pDate = new Date(p.date);
                    return pDate >= monthStart && pDate <= monthEnd;
                })
                .reduce((sum, p) => sum + p.amount, 0);

            const monthExpenses = expenses
                .filter(exp => {
                    const expDate = new Date(exp.date);
                    return expDate >= monthStart && expDate <= monthEnd;
                })
                .reduce((sum, exp) => sum + exp.amount, 0);

            months.push({
                month: monthStart.toLocaleDateString(locale, { month: 'short' }),
                revenue: monthRevenue,
                expenses: monthExpenses,
                profit: monthRevenue - monthExpenses
            });
        }
        return months;
    }, [payments, expenses, locale]);

    // Revenue by treatment type
    const revenueByTreatment = useMemo(() => {
        const treatmentRevenue: Record<string, number> = {};
        treatmentRecords.forEach(tr => {
            const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
            if (treatmentDef) {
                treatmentRevenue[treatmentDef.name] = (treatmentRevenue[treatmentDef.name] || 0) + tr.totalTreatmentCost;
            }
        });
        
        const colors = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#6366F1', '#14B8A6'];
        return Object.entries(treatmentRevenue)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, value], index) => ({
                name,
                value,
                color: colors[index % colors.length]
            }));
    }, [treatmentRecords, clinicData.treatmentDefinitions]);

    // Doctor performance - Monthly
    const doctorPerformanceMonthly = useMemo(() => {
        const performance: Record<string, { name: string; patients: number; revenue: number; colorClass: string }> = {};
        
        // Get current month start and end
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        // Filter payments by current month
        const monthlyPayments = payments.filter(p => {
            const paymentDate = new Date(p.date);
            return paymentDate >= monthStart && paymentDate <= monthEnd;
        });
        
        // Get treatments that were paid this month
        monthlyPayments.forEach(payment => {
            const treatmentRecord = treatmentRecords.find(tr => tr.id === payment.treatmentRecordId);
            if (treatmentRecord) {
                const dentist = dentists.find(d => d.id === treatmentRecord.dentistId);
                if (dentist) {
                    if (!performance[dentist.id]) {
                        performance[dentist.id] = { 
                            name: dentist.name, 
                            patients: 0, 
                            revenue: 0,
                            // Use dentist's color class from database like Scheduler does
                            colorClass: dentist.color || 'bg-purple-500'
                        };
                    }
                    performance[dentist.id].patients += 1;
                    performance[dentist.id].revenue += payment.doctorShare;
                }
            }
        });
        
        return Object.values(performance)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
    }, [payments, treatmentRecords, dentists]);

    // Doctor performance - Today's
    const doctorPerformanceToday = useMemo(() => {
        const performance: Record<string, { name: string; patients: number; revenue: number; colorClass: string }> = {};
        
        // Get today's payments linked to treatments
        todaysPayments.forEach(payment => {
            const treatmentRecord = treatmentRecords.find(tr => tr.id === payment.treatmentRecordId);
            if (treatmentRecord) {
                const dentist = dentists.find(d => d.id === treatmentRecord.dentistId);
                if (dentist) {
                    if (!performance[dentist.id]) {
                        performance[dentist.id] = { 
                            name: dentist.name, 
                            patients: 0, 
                            revenue: 0,
                            // Use dentist's color class from database like Scheduler does
                            colorClass: dentist.color || 'bg-purple-500'
                        };
                    }
                    performance[dentist.id].patients += 1;
                    performance[dentist.id].revenue += payment.doctorShare;
                }
            }
        });
        
        return Object.values(performance)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
    }, [todaysPayments, treatmentRecords, dentists]);

    // Doctor performance - Monthly (for reference)
    const doctorPerformance = useMemo(() => {
        const performance: Record<string, { name: string; patients: number; revenue: number; color: string }> = {};
        
        treatmentRecords.forEach(tr => {
            const dentist = dentists.find(d => d.id === tr.dentistId);
            if (dentist) {
                if (!performance[dentist.id]) {
                    performance[dentist.id] = { 
                        name: dentist.name, 
                        patients: 0, 
                        revenue: 0,
                        color: dentist.color || '#6366F1'
                    };
                }
                performance[dentist.id].patients += 1;
                performance[dentist.id].revenue += tr.totalTreatmentCost;
            }
        });
        
        return Object.values(performance)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
    }, [treatmentRecords, dentists]);

    // Appointment status distribution
    const appointmentStatusData = useMemo(() => {
        const statusCount: Record<string, number> = {};
        appointments.forEach(apt => {
            statusCount[apt.status] = (statusCount[apt.status] || 0) + 1;
        });
        
        const statusColors: Record<string, string> = {
            CONFIRMED: '#10B981',
            PENDING: '#F59E0B',
            CANCELLED: '#EF4444',
            COMPLETED: '#3B82F6',
            NO_SHOW: '#6366F1'
        };
        
        return Object.entries(statusCount).map(([status, count]) => ({
            name: status,
            value: count,
            color: statusColors[status] || '#6B7280'
        }));
    }, [appointments]);

    // ==================== TABS ====================
    const tabs = [
        { id: 'overview', label: t('dashboard.overview') || 'Overview', icon: <Icons.Home /> },
        { id: 'financial', label: t('dashboard.financial') || 'Financial', icon: <Icons.Wallet /> },
        { id: 'patients', label: t('dashboard.patientsTab') || 'Patients', icon: <Icons.Patients /> },
        { id: 'operations', label: t('dashboard.operations') || 'Operations', icon: <Icons.Activity /> }
    ];

    // Custom formatter for tooltips
    const formatCurrency = (value: number | string | undefined) => {
        if (value === undefined) return '-';
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return currencyFormatter.format(num || 0);
    };

    // ==================== RENDER ====================
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
                
                {/* ==================== HERO HEADER ==================== */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl sm:rounded-3xl shadow-2xl"
                >
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
                        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-amber-400/20 to-pink-500/20 rounded-full blur-3xl" />
                    </div>
                    
                    <div className="relative z-10 p-5 sm:p-6 md:p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg">
                                    <Icons.Chart />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                                        {t('dashboard.title') || 'Dashboard'}
                                    </h1>
                                    <p className="text-white/80 text-sm sm:text-base mt-1">
                                        {t('dashboard.welcomeMessage') || 'Welcome to your dental clinic management'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-3">
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 min-w-[100px]"
                                >
                                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                                    <span className="text-emerald-600 font-bold text-lg">{patients.length}</span>
                                    <span className="text-emerald-700 text-xs">{t('dashboard.patients') || 'Patients'}</span>
                                </motion.div>
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 min-w-[100px]"
                                >
                                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
                                    <span className="text-blue-600 font-bold text-lg">{todaysAppointmentsCount}</span>
                                    <span className="text-blue-700 text-xs">{t('dashboard.todaysAppts') || "Today's Appts"}</span>
                                </motion.div>
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/30 min-w-[120px]"
                                >
                                    <span className="text-lg">📈</span>
                                    <span className="text-white font-bold text-lg">{currencyFormatter.format(netToday)}</span>
                                    <span className="text-white/70 text-xs">{t('dashboard.today') || 'Today'}</span>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ==================== TABS NAVIGATION ==================== */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex overflow-x-auto pb-2 gap-2"
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                                activeTab === tab.id
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            <span className="w-5 h-5">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </motion.div>

                {/* ==================== OVERVIEW TAB ==================== */}
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* KPI Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                <KPICard
                                    title={t('dashboard.totalPatients') || 'Total Patients'}
                                    value={patients.length}
                                    icon={<Icons.Patients />}
                                    color="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white"
                                    gradient="from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30"
                                    trend={{ value: 12, isPositive: true }}
                                    subtitle={t('dashboard.activePatients') || 'Active patients'}
                                    delay={0}
                                    onClick={() => setCurrentView('patients')}
                                />
                                <KPICard
                                    title={t('dashboard.todaysRevenue') || "Today's Revenue"}
                                    value={currencyFormatter.format(todaysRevenue)}
                                    icon={<Icons.Dollar />}
                                    color="bg-gradient-to-br from-blue-400 to-blue-600 text-white"
                                    gradient="from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30"
                                    trend={{ value: 8, isPositive: true }}
                                    subtitle={t('dashboard.todaysEarnings') || "Today's income"}
                                    delay={1}
                                />
                                <KPICard
                                    title={t('dashboard.appointmentsToday') || "Today's Appointments"}
                                    value={todaysAppointmentsCount}
                                    icon={<Icons.Calendar />}
                                    color="bg-gradient-to-br from-purple-400 to-purple-600 text-white"
                                    gradient="from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30"
                                    subtitle={t('dashboard.scheduledToday') || 'Scheduled today'}
                                    delay={2}
                                    onClick={() => setCurrentView('scheduler')}
                                />
                                <KPICard
                                    title={t('dashboard.monthlyNetProfit') || 'Monthly Profit'}
                                    value={currencyFormatter.format(clinicProfitThisMonth)}
                                    icon={<Icons.TrendingUp />}
                                    color="bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                                    gradient="from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30"
                                    trend={{ value: 15, isPositive: clinicProfitThisMonth >= 0 }}
                                    subtitle={t('dashboard.thisMonth') || 'This month'}
                                    delay={3}
                                />
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Revenue Trend Chart */}
                                <ChartCard 
                                    title={t('dashboard.revenueTrend') || 'Revenue Trend'} 
                                    subtitle={t('dashboard.last7DaysPerformance') || 'Last 7 days performance'}
                                    delay={4}
                                    action={
                                        <button className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                            {t('dashboard.viewAll') || 'View All'}
                                        </button>
                                    }
                                >
                                    <div className="h-64 sm:h-72">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                                            <AreaChart data={dailyTrendsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    formatter={formatCurrency}
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="revenue" 
                                                    stroke="#8B5CF6" 
                                                    strokeWidth={3}
                                                    fill="url(#revenueGradient)" 
                                                    name="Revenue"
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="profit" 
                                                    stroke="#10B981" 
                                                    strokeWidth={2}
                                                    fill="none"
                                                    strokeDasharray="5 5"
                                                    name="Profit"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </ChartCard>

                                {/* Treatment Distribution */}
                                <ChartCard 
                                    title={t('dashboard.revenueByTreatment') || 'Revenue by Treatment'} 
                                    subtitle={t('dashboard.topTreatments') || 'Top performing treatments'}
                                    delay={5}
                                >
                                    <div className="h-64 sm:h-72">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                                            <PieChart>
                                                <Pie
                                                    data={revenueByTreatment}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {revenueByTreatment.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    formatter={formatCurrency}
                                                />
                                                <Legend 
                                                    layout="vertical" 
                                                    verticalAlign="middle" 
                                                    align="right"
                                                    iconType="circle"
                                                    iconSize={8}
                                                    wrapperStyle={{ fontSize: '12px' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </ChartCard>
                            </div>

                            {/* Bottom Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Upcoming Appointments */}
                                <ChartCard title={t('dashboard.upcomingAppointments') || 'Upcoming Appointments'} subtitle={t('dashboard.nextVisits') || 'Next scheduled visits'} delay={6}>
                                    <div className="space-y-3 max-h-72 overflow-y-auto">
                                        {upcomingAppointmentsList.length > 0 ? (
                                            upcomingAppointmentsList.map((apt, idx) => {
                                                const patient = patients.find(p => p.id === apt.patientId);
                                                return (
                                                    <motion.div 
                                                        key={apt.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                                                {patient?.name?.charAt(0) || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{patient?.name}</p>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">{apt.reason}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                                {new Date(apt.startTime).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                                                            </p>
                                                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                                                {new Date(apt.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8">
                                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
                                                    <span className="text-2xl">📅</span>
                                                </div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">{t('dashboard.noUpcomingAppointments') || 'No upcoming appointments'}</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('dashboard.scheduleNew') || 'Schedule a new appointment'}</p>
                                            </div>
                                        )}
                                    </div>
                                </ChartCard>

                                {/* Doctor Performance - Today's */}
                                <ChartCard title={t('dashboard.doctorPerf') || 'Doctor Performance'} subtitle={t('dashboard.today') || "Today's earnings"} delay={7}>
                                    <div className="space-y-4">
                                        {doctorPerformanceToday.length > 0 ? (
                                            doctorPerformanceToday.map((doc, idx) => (
                                                <motion.div 
                                                    key={doc.name}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${doc.colorClass}`}>
                                                                {doc.name.charAt(0)}
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{doc.name}</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{currencyFormatter.format(doc.revenue)}</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            className={`h-full rounded-full ${doc.colorClass}`}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${doctorPerformanceToday.length > 0 ? (doc.revenue / Math.max(...doctorPerformanceToday.map(d => d.revenue))) * 100 : 0}%` }}
                                                            transition={{ duration: 0.8, delay: 0.5 + idx * 0.1 }}
                                                        />
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8">
                                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-3">
                                                    <span className="text-2xl">💰</span>
                                                </div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">{t('dashboard.noEarningsToday') || 'No earnings today'}</p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('dashboard.earningsWillAppear') || 'Earnings will appear after treatments'}</p>
                                            </div>
                                        )}
                                    </div>
                                </ChartCard>

                                {/* Quick Actions & Alerts */}
                                <ChartCard title={t('dashboard.quickAlerts') || 'Quick Actions & Alerts'} subtitle={t('dashboard.actionRequired') || 'Action required'} delay={8}>
                                    <div className="space-y-3">
                                        <button 
                                            onClick={() => setCurrentView('inventory')}
                                            className="w-full flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400">
                                                    <Icons.Inventory />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('dashboard.lowStockItems') || 'Low Stock Items'}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{lowStockItems.length} {t('dashboard.itemsNeedAttention') || 'items need attention'}</p>
                                                </div>
                                            </div>
                                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                        </button>

                                        <button 
                                            onClick={() => setCurrentView('labCases')}
                                            className="w-full flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-600 dark:text-purple-400">
                                                    <Icons.Lab />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('dashboard.pendingLabCases') || 'Pending Lab Cases'}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{pendingLabCases.length} {t('dashboard.casesWaiting') || 'cases waiting'}</p>
                                                </div>
                                            </div>
                                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                                        </button>

                                        <button 
                                            onClick={() => setCurrentView('reports')}
                                            className="w-full flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-red-500/20 rounded-lg text-red-600 dark:text-red-400">
                                                    <Icons.Alert />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('dashboard.overdueInvoices') || 'Overdue Invoices'}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{overdueInvoices} {t('dashboard.unpaidOverdue') || 'unpaid overdue'}</p>
                                                </div>
                                            </div>
                                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                        </button>

                                        <button 
                                            onClick={() => setCurrentView('patients')}
                                            className="w-full flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                                                    <Icons.UserPlus />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('dashboard.newPatientsThisMonth') || 'New Patients'}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{newPatientsThisMonth} {t('dashboard.thisMonth') || 'this month'}</p>
                                                </div>
                                            </div>
                                            <Icons.ChevronRight />
                                        </button>
                                    </div>
                                </ChartCard>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ==================== FINANCIAL TAB ==================== */}
                <AnimatePresence mode="wait">
                    {activeTab === 'financial' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Financial KPIs - Daily */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                <KPICard
                                    title={t('dashboard.todaysRevenue') || "Today's Revenue"}
                                    value={currencyFormatter.format(todaysRevenue)}
                                    icon={<Icons.Dollar />}
                                    color="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white"
                                    gradient="from-emerald-50 to-emerald-100"
                                    trend={{ value: 8, isPositive: true }}
                                    subtitle={t('dashboard.today') || 'Today'}
                                    delay={0}
                                />
                                <KPICard
                                    title={t('dashboard.todaysExpenses') || "Today's Expenses"}
                                    value={currencyFormatter.format(todaysExpenses)}
                                    icon={<Icons.TrendingDown />}
                                    color="bg-gradient-to-br from-red-400 to-red-600 text-white"
                                    gradient="from-red-50 to-red-100"
                                    trend={{ value: 5, isPositive: false }}
                                    subtitle={t('dashboard.today') || 'Today'}
                                    delay={1}
                                />
                                <KPICard
                                    title={t('dashboard.doctorsDuesToday') || "Doctor's Dues Today"}
                                    value={currencyFormatter.format(doctorsDuesToday)}
                                    icon={<Icons.Doctor />}
                                    color="bg-gradient-to-br from-purple-400 to-purple-600 text-white"
                                    gradient="from-purple-50 to-purple-100"
                                    subtitle={t('dashboard.today') || 'Today'}
                                    delay={2}
                                />
                                <KPICard
                                    title={t('dashboard.dailyNetProfit') || "Today's Net Profit"}
                                    value={currencyFormatter.format(netToday)}
                                    icon={<Icons.Wallet />}
                                    color="bg-gradient-to-br from-indigo-400 to-indigo-600 text-white"
                                    gradient="from-indigo-50 to-indigo-100"
                                    trend={{ value: 18, isPositive: netToday >= 0 }}
                                    subtitle={t('dashboard.today') || 'Today'}
                                    delay={3}
                                />
                            </div>

                            {/* Daily Financial Chart */}
                            <ChartCard title={t('dashboard.dailyTrends') || 'Daily Trends'} subtitle={t('dashboard.last7Days') || 'Last 7 days'} delay={4}>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                                        <BarChart data={dailyTrendsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                formatter={formatCurrency}
                                            />
                                            <Legend iconType="circle" />
                                            <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} name={t('dashboard.todaysRevenue') || 'Revenue'} />
                                            <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} name={t('dashboard.todaysExpenses') || 'Expenses'} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </ChartCard>

                            {/* Recent Transactions */}
                            <ChartCard title={t('dashboard.recentTransactions') || 'Recent Transactions'} subtitle={t('dashboard.today') || "Today's payments"} delay={5}>
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {todaysPayments.length > 0 ? (
                                        todaysPayments.slice(0, 10).map((payment, idx) => {
                                            const patient = patients.find(p => p.id === payment.patientId);
                                            return (
                                                <motion.div
                                                    key={payment.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                                            <Icons.Dollar />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{patient?.name || 'Unknown'}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{payment.method} - {new Date(payment.date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{currencyFormatter.format(payment.amount)}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">Doctor: {currencyFormatter.format(payment.doctorShare)}</p>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">{t('dashboard.noEarningsToday') || 'No transactions today'}</p>
                                    )}
                                </div>
                            </ChartCard>

                            {/* Monthly KPIs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                <KPICard
                                    title={t('dashboard.monthlyRevenue') || 'Monthly Revenue'}
                                    value={currencyFormatter.format(thisMonthRevenue)}
                                    icon={<Icons.TrendingUp />}
                                    color="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white"
                                    gradient="from-emerald-50 to-emerald-100"
                                    trend={{ value: 23, isPositive: true }}
                                    subtitle={t('dashboard.thisMonth') || 'This month'}
                                    delay={6}
                                />
                                <KPICard
                                    title={t('dashboard.monthlyExpenses') || 'Monthly Expenses'}
                                    value={currencyFormatter.format(totalExpensesThisMonth)}
                                    icon={<Icons.TrendingDown />}
                                    color="bg-gradient-to-br from-red-400 to-red-600 text-white"
                                    gradient="from-red-50 to-red-100"
                                    trend={{ value: 5, isPositive: false }}
                                    subtitle={t('dashboard.thisMonth') || 'This month'}
                                    delay={7}
                                />
                                <KPICard
                                    title={t('dashboard.netProfit') || 'Net Profit'}
                                    value={currencyFormatter.format(clinicProfitThisMonth)}
                                    icon={<Icons.Wallet />}
                                    color="bg-gradient-to-br from-indigo-400 to-indigo-600 text-white"
                                    gradient="from-indigo-50 to-indigo-100"
                                    trend={{ value: 18, isPositive: clinicProfitThisMonth >= 0 }}
                                    subtitle={t('dashboard.thisMonth') || 'This month'}
                                    delay={8}
                                />
                                <KPICard
                                    title={t('dashboard.outstandingBalance') || 'Outstanding Balance'}
                                    value={currencyFormatter.format(pendingPayments)}
                                    icon={<Icons.Alert />}
                                    color="bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                                    gradient="from-amber-50 to-amber-100"
                                    subtitle={t('dashboard.pendingPayments') || 'Pending payments'}
                                    delay={9}
                                />
                            </div>

                            {/* Monthly Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <ChartCard title={t('dashboard.revenueVsExpenses') || 'Revenue vs Expenses'} subtitle={t('dashboard.last6Months') || 'Last 6 months'} delay={10}>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                                            <BarChart data={monthlyTrendsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    formatter={formatCurrency}
                                                />
                                                <Legend iconType="circle" />
                                                <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} name="Revenue" />
                                                <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expenses" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </ChartCard>

                                <ChartCard title={t('dashboard.profitAnalysis') || 'Profit Trend'} subtitle={t('dashboard.monthlyTrends') || 'Monthly analysis'} delay={11}>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                                            <LineChart data={monthlyTrendsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    formatter={formatCurrency}
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="profit" 
                                                    stroke="#8B5CF6" 
                                                    strokeWidth={3}
                                                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                                                    activeDot={{ r: 8, stroke: '#8B5CF6', strokeWidth: 2 }}
                                                    name="Profit"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </ChartCard>
                            </div>

                            {/* Doctor Revenue Share - Monthly */}
                            <ChartCard title={t('dashboard.doctorDistribution') || 'Doctor Revenue Distribution'} subtitle={t('dashboard.monthlyRevenueShare') || 'Monthly revenue share by doctor'} delay={12}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {doctorPerformanceMonthly.map((doc, idx) => (
                                        <motion.div
                                            key={doc.name}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className={`p-4 rounded-xl border-2 hover:shadow-lg transition-all ${doc.colorClass} bg-opacity-10`}
                                            style={{ borderColor: 'currentColor' }}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${doc.colorClass}`}>
                                                        {doc.name.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{doc.name}</span>
                                                </div>
                                            </div>
                                            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{currencyFormatter.format(doc.revenue)}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{doc.patients} patients</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </ChartCard>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ==================== PATIENTS TAB ==================== */}
                <AnimatePresence mode="wait">
                    {activeTab === 'patients' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Patient KPIs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                <KPICard
                                    title={t('dashboard.totalPatients') || 'Total Patients'}
                                    value={patients.length}
                                    icon={<Icons.Patients />}
                                    color="bg-gradient-to-br from-blue-400 to-blue-600 text-white"
                                    gradient="from-blue-50 to-blue-100"
                                    trend={{ value: 12, isPositive: true }}
                                    subtitle={t('dashboard.registered') || 'Registered'}
                                    delay={0}
                                />
                                <KPICard
                                    title={t('dashboard.newThisMonth') || 'New This Month'}
                                    value={newPatientsThisMonth}
                                    icon={<Icons.UserPlus />}
                                    color="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white"
                                    gradient="from-emerald-50 to-emerald-100"
                                    trend={{ value: 25, isPositive: true }}
                                    subtitle={t('dashboard.newRegistrations') || 'New registrations'}
                                    delay={1}
                                />
                                <KPICard
                                    title={t('dashboard.appointmentsToday') || 'Appointments Today'}
                                    value={todaysAppointmentsCount}
                                    icon={<Icons.Calendar />}
                                    color="bg-gradient-to-br from-purple-400 to-purple-600 text-white"
                                    gradient="from-purple-50 to-purple-100"
                                    subtitle={t('dashboard.scheduled') || 'Scheduled'}
                                    delay={2}
                                />
                                <KPICard
                                    title={t('dashboard.pendingPayments') || 'Pending Payments'}
                                    value={pendingPayments}
                                    icon={<Icons.Alert />}
                                    color="bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                                    gradient="from-amber-50 to-amber-100"
                                    subtitle={t('dashboard.outstanding') || 'Outstanding'}
                                    delay={3}
                                />
                            </div>

                            {/* Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <ChartCard title={t('dashboard.appointmentStatus') || 'Appointment Status'} subtitle={t('dashboard.currentDistribution') || 'Current distribution'} delay={4}>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                                            <PieChart>
                                                <Pie
                                                    data={appointmentStatusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {appointmentStatusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                />
                                                <Legend 
                                                    layout="vertical" 
                                                    verticalAlign="middle" 
                                                    align="right"
                                                    iconType="circle"
                                                    iconSize={8}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </ChartCard>

                                <ChartCard title={t('dashboard.dailyAppointments') || 'Daily Appointments'} subtitle={t('dashboard.last7Days') || 'Last 7 days'} delay={5}>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                                            <BarChart data={dailyTrendsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                />
                                                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Revenue" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </ChartCard>
                            </div>

                            {/* Quick Patient Stats */}
                            <ChartCard title={t('dashboard.patientOverview') || 'Patient Overview'} subtitle={t('dashboard.keyMetrics') || 'Key metrics'} delay={6}>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{patients.length}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('dashboard.totalPatients') || 'Total Patients'}</div>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{newPatientsThisMonth}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('dashboard.newThisMonth') || 'New This Month'}</div>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{treatmentRecords.length}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('dashboard.treatments') || 'Treatments'}</div>
                                    </div>
                                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{prescriptions.length}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('dashboard.prescriptions') || 'Prescriptions'}</div>
                                    </div>
                                </div>
                            </ChartCard>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ==================== OPERATIONS TAB ==================== */}
                <AnimatePresence mode="wait">
                    {activeTab === 'operations' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Operations KPIs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                <KPICard
                                    title={t('dashboard.inventoryItems') || 'Inventory Items'}
                                    value={inventoryItems.length}
                                    icon={<Icons.Inventory />}
                                    color="bg-gradient-to-br from-cyan-400 to-cyan-600 text-white"
                                    gradient="from-cyan-50 to-cyan-100"
                                    subtitle={t('dashboard.inStock') || 'In stock'}
                                    delay={0}
                                />
                                <KPICard
                                    title={t('dashboard.lowStockAlerts') || 'Low Stock Alerts'}
                                    value={lowStockItems.length}
                                    icon={<Icons.Alert />}
                                    color="bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                                    gradient="from-amber-50 to-amber-100"
                                    subtitle={t('dashboard.needReorder') || 'Need reorder'}
                                    delay={1}
                                />
                                <KPICard
                                    title={t('dashboard.pendingLabCases') || 'Pending Lab Cases'}
                                    value={pendingLabCases.length}
                                    icon={<Icons.Lab />}
                                    color="bg-gradient-to-br from-purple-400 to-purple-600 text-white"
                                    gradient="from-purple-50 to-purple-100"
                                    subtitle={t('dashboard.inProgress') || 'In progress'}
                                    delay={2}
                                />
                                <KPICard
                                    title={t('dashboard.dentists') || 'Dentists'}
                                    value={dentists.length}
                                    icon={<Icons.Doctor />}
                                    color="bg-gradient-to-br from-pink-400 to-pink-600 text-white"
                                    gradient="from-pink-50 to-pink-100"
                                    subtitle={t('dashboard.active') || 'Active'}
                                    delay={3}
                                />
                            </div>

                            {/* Operations Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <ChartCard title={t('dashboard.labCasesStatus') || 'Lab Cases Status'} subtitle={t('dashboard.currentOverview') || 'Current overview'} delay={4}>
                                    <div className="space-y-4">
                                        {labCases.slice(0, 5).map((lc, idx) => (
                                            <motion.div
                                                key={lc.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{lc.caseType}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Due: {new Date(lc.dueDate).toLocaleDateString(locale)}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    lc.status === LabCaseStatus.SENT_TO_LAB ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    lc.status === LabCaseStatus.RECEIVED_FROM_LAB ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                    lc.status === LabCaseStatus.DRAFT ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                    'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300'
                                                }`}>
                                                    {lc.status}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </ChartCard>

                                <ChartCard title={t('dashboard.inventoryAlerts') || 'Inventory Alerts'} subtitle={t('dashboard.itemsBelowThreshold') || 'Items below threshold'} delay={5}>
                                    <div className="space-y-3">
                                        {lowStockItems.length > 0 ? (
                                            lowStockItems.map((item, idx) => (
                                                <motion.div
                                                    key={item.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400">
                                                            <Icons.Alert />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.name}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">Min: {item.minStockLevel}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{item.currentStock}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">in stock</p>
                                                    </div>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <Icons.Check />
                                                </div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">All items are well stocked!</p>
                                            </div>
                                        )}
                                    </div>
                                </ChartCard>
                            </div>

                            {/* Clinic Performance Metrics */}
                            <ChartCard title={t('dashboard.clinicPerformanceMetrics') || 'Clinic Performance Metrics'} subtitle={t('dashboard.comprehensiveOverview') || 'Comprehensive overview'} delay={6}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <ProgressRing 
                                        progress={Math.min(100, (todaysAppointmentsCount / 10) * 100)} 
                                        color="text-blue-500"
                                        label={t('dashboard.todaysAppts') || "Today's"}
                                        value={`${todaysAppointmentsCount}/10`}
                                    />
                                    <ProgressRing 
                                        progress={Math.min(100, (patients.length / 100) * 100)} 
                                        color="text-emerald-500"
                                        label={t('dashboard.patients') || 'Patients'}
                                        value={`${patients.length}`}
                                    />
                                    <ProgressRing 
                                        progress={Math.min(100, ((inventoryItems.length - lowStockItems.length) / inventoryItems.length) * 100 || 0)} 
                                        color="text-purple-500"
                                        label={t('dashboard.inventory') || "Inventory"}
                                        value={`${Math.round(((inventoryItems.length - lowStockItems.length) / inventoryItems.length) * 100 || 0)}%`}
                                    />
                                    <ProgressRing 
                                        progress={Math.min(100, ((labCases.length - pendingLabCases.length) / labCases.length) * 100 || 0)} 
                                        color="text-amber-500"
                                        label={t('dashboard.labDone') || "Lab Done"}
                                        value={`${Math.round(((labCases.length - pendingLabCases.length) / labCases.length) * 100 || 0)}%`}
                                    />
                                </div>
                            </ChartCard>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default Dashboard;
