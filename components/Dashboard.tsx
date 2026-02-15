import React, { useMemo, useState } from 'react';
import { ClinicData } from '../hooks/useClinicData';
import { AppointmentStatus, LabCaseStatus, View, Dentist, TreatmentRecord, ExpenseCategory, Appointment } from '../types';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../contexts/AuthContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import NotificationBell from './NotificationBell';


interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: { value: number; isPositive: boolean };
    subtitle?: string;
    onClick?: () => void;
    className?: string;
    shape?: 'card' | 'circle';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend, subtitle, onClick, className, shape = 'card' }) => {
    if (shape === 'circle') {
        return (
            <div
                className={`w-28 h-28 sm:w-32 sm:h-32 bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 hover:-translate-y-1 border border-slate-200 dark:border-slate-700 cursor-pointer group active:scale-95 ${onClick ? 'hover:border-blue-300 dark:hover:border-blue-500' : ''} ${className || ''}`}
                onClick={onClick}
                role={onClick ? 'button' : undefined}
                tabIndex={onClick ? 0 : undefined}
                onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
                aria-label={onClick ? `${title}: ${value}` : undefined}
            >
                <div className={`p-2 sm:p-3 rounded-full ${color} shadow-sm mb-1 sm:mb-2 group-hover:shadow-md transition-shadow`}>
                    {icon}
                </div>
                <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 font-medium text-center px-1 leading-tight">{title}</p>
                <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">{value}</p>
                {subtitle && <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 text-center px-1">{subtitle}</p>}
            </div>
        );
    }

    return (
        <div
            className={`bg-white dark:bg-slate-800 p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 border border-slate-200 dark:border-slate-700 cursor-pointer group active:scale-[0.98] ${onClick ? 'hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-lg' : ''} ${className || ''}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
            aria-label={onClick ? `${title}: ${value}` : undefined}
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 sm:p-3 rounded-lg ${color} shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0`}>
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium truncate">{title}</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">{value}</p>
                    {subtitle && <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 mt-0.5 truncate">{subtitle}</p>}
                    {trend && (
                        <div className={`flex items-center mt-1 sm:mt-2 text-xs font-semibold ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            <svg className={`w-3 h-3 mr-1 ${trend.isPositive ? '' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            {Math.abs(trend.value)}%
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC<{ clinicData: ClinicData, setCurrentView: (view: View) => void }> = ({ clinicData, setCurrentView }) => {
    const { t, locale } = useI18n();
    const { isAdmin } = useAuth();
    const { preferences } = useUserPreferences();
    const { dashboard } = preferences;
    console.log('Dashboard component rendered with clinicData:', {
        patientsCount: clinicData.patients?.length || 0,
        appointmentsCount: clinicData.appointments?.length || 0,
        treatmentRecordsCount: clinicData.treatmentRecords?.length || 0,
        inventoryItemsCount: clinicData.inventoryItems?.length || 0,
        labCasesCount: clinicData.labCases?.length || 0,
        dentistsCount: clinicData.dentists?.length || 0,
        paymentsCount: clinicData.payments?.length || 0,
        expensesCount: clinicData.expenses?.length || 0,
        supplierInvoicesCount: clinicData.supplierInvoices?.length || 0,
        doctorPaymentsCount: clinicData.doctorPayments?.length || 0,
        prescriptionsCount: clinicData.prescriptions?.length || 0,
        prescriptionItemsCount: clinicData.prescriptionItems?.length || 0,
        isLoading: clinicData.isLoading
    });

    const { patients, appointments, treatmentRecords, inventoryItems, labCases, dentists, payments, expenses, supplierInvoices, doctorPayments, prescriptions, prescriptionItems } = clinicData;
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
    const fullCurrencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
    const dateFormatter = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' });

    // --- CALCULATIONS ---

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysAppointmentsCount = appointments.filter(apt => {
        const aptDate = new Date(apt.startTime);
        aptDate.setHours(0,0,0,0);
        return aptDate.getTime() === today.getTime();
    }).length;

    const todaysPayments = useMemo(() => {
        return payments.filter(p => {
            const pDate = new Date(p.date);
            pDate.setHours(0, 0, 0, 0);
            return pDate.getTime() === today.getTime();
        });
    }, [payments, today]);

    const todaysRevenue = useMemo(() => {
        return todaysPayments.reduce((sum, p) => sum + p.amount, 0);
    }, [todaysPayments]);

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
        .slice(0, 10);
    }, [appointments]);

    // Additional financial metrics
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

    const totalOutstandingBalance = useMemo(() => {
        const totalCharges = treatmentRecords.reduce((sum, tr) => {
            const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
            return sum + (treatmentDef ? treatmentDef.basePrice : 0);
        }, 0);
        const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
        return totalCharges - totalPayments;
    }, [treatmentRecords, payments, clinicData.treatmentDefinitions]);

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

    const totalExpensesThisMonth = useMemo(() => {
        return thisMonthExpenses + thisMonthDoctorShares;
    }, [thisMonthExpenses, thisMonthDoctorShares]);

    const clinicProfitThisMonth = useMemo(() => {
        return thisMonthRevenue - totalExpensesThisMonth;
    }, [thisMonthRevenue, totalExpensesThisMonth]);

    const pendingPayments = useMemo(() => {
        const totalCharges = treatmentRecords.reduce((sum, tr) => {
            const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
            return sum + (treatmentDef ? treatmentDef.basePrice : 0);
        }, 0);
        const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
        return Math.max(0, totalCharges - totalPayments);
    }, [treatmentRecords, payments, clinicData.treatmentDefinitions]);

    const overdueInvoices = useMemo(() => {
        const today = new Date();
        return supplierInvoices.filter(invoice =>
            invoice.status === 'UNPAID' &&
            invoice.dueDate &&
            new Date(invoice.dueDate) < today
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


    const doctorPerformanceToday = useMemo(() => {
        const dailyEarnings: Record<string, { name: string, earnings: number, color: string }> = {};

        // Calculate earnings from today's payments linked to treatments by the dentist
        todaysPayments.forEach(payment => {
            const treatmentRecord = treatmentRecords.find(tr => tr.id === payment.treatmentRecordId);
            if (treatmentRecord) {
                const dentist = dentists.find(d => d.id === treatmentRecord.dentistId);
                if (dentist) {
                    if (!dailyEarnings[dentist.id]) {
                        dailyEarnings[dentist.id] = { name: dentist.name, earnings: 0, color: dentist.color };
                    }
                    dailyEarnings[dentist.id].earnings += payment.doctorShare;
                }
            }
        });

        const totalEarnings = Object.values(dailyEarnings).reduce((sum, d) => sum + d.earnings, 0);

        return Object.values(dailyEarnings).map(d => ({
            ...d,
            percentage: totalEarnings > 0 ? (d.earnings / totalEarnings) * 100 : 0,
        })).sort((a, b) => b.earnings - a.earnings);

    }, [todaysPayments, treatmentRecords, dentists]);

    // Chart data for today's financials
    const todaysFinancialData = useMemo(() => [
        { name: t('dashboard.todaysRevenue'), value: todaysRevenue, color: '#10b981' },
        { name: t('dashboard.todaysExpenses') || "المصروف اليومي", value: todaysExpenses, color: '#ef4444' },
        { name: t('dashboard.doctorsDuesToday') || "حصة الأطباء اليوم", value: doctorsDuesToday, color: '#f59e0b' },
    ], [todaysRevenue, todaysExpenses, doctorsDuesToday, t]);

    // Daily trends data (last 7 days)
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

    // Monthly trends data (last 6 months)
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

    // Timeline data for appointments and treatments
    const timelineData = useMemo(() => {
        const events: Array<{
            id: string;
            type: 'appointment' | 'treatment' | 'payment';
            date: Date;
            title: string;
            color: string;
        }> = [];

        // Add appointments - use last modification date (updatedAt) instead of appointment date
        appointments.forEach(apt => {
            const patient = patients.find(p => p.id === apt.patientId);
            // Use updatedAt if available (last modification), otherwise fall back to createdAt
            const lastModificationDate = apt.updatedAt ? new Date(apt.updatedAt) : new Date(apt.createdAt);
            // Only add valid dates
            if (!isNaN(lastModificationDate.getTime())) {
                events.push({
                    id: `apt-${apt.id}`,
                    type: 'appointment',
                    date: lastModificationDate,
                    title: `${patient?.name} - ${apt.reason}`,
                    color: '#0ea5e9'
                });
            }
        });

        // Add treatments - process all treatments, not just first 20
        treatmentRecords.forEach(tr => {
            const patient = patients.find(p => p.id === tr.patientId);
            const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
            // Use last modification date (updatedAt) if available, otherwise use treatment date
            const lastModificationDate = tr.updatedAt ? new Date(tr.updatedAt) : new Date(tr.treatmentDate);
            // Only add valid dates
            if (!isNaN(lastModificationDate.getTime())) {
                events.push({
                    id: `tr-${tr.id}`,
                    type: 'treatment',
                    date: lastModificationDate,
                    title: `${patient?.name} - ${treatmentDef?.name || 'Treatment'}`,
                    color: '#8b5cf6'
                });
            }
        });

        // Add payments - process all payments, not just first 20
        payments.forEach(payment => {
            const patient = patients.find(p => p.id === payment.patientId);
            // Use last modification date (updatedAt) if available, otherwise use payment date
            const lastModificationDate = payment.updatedAt ? new Date(payment.updatedAt) : new Date(payment.date);
            // Only add valid dates
            if (!isNaN(lastModificationDate.getTime())) {
                events.push({
                    id: `pay-${payment.id}`,
                    type: 'payment',
                    date: lastModificationDate,
                    title: `${patient?.name} - Payment: ${currencyFormatter.format(payment.amount)}`,
                    color: '#10b981'
                });
            }
        });

        // Sort all events by date in descending order (newest first)
        return events
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 50); // Limit to 50 most recent events for performance
    }, [appointments, treatmentRecords, payments, patients, clinicData.treatmentDefinitions, currencyFormatter]);

    // --- ICONS ---
    const PatientsIcon = (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.282-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.282.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>);
    const CalendarIcon = (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
    const DollarIcon = (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /> </svg>);
    const UserPlusIcon = (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>);
    const TrendingUpIcon = (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>);
    const TrendingDownIcon = (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>);
    const AlertIcon = (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>);
    const ClockIcon = (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-2 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                {/* Page Header - Enhanced Gold + Purple Design */}
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 via-purple-500 to-purple-700 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl p-4 sm:p-6 md:p-8 text-white">
                    {/* Decorative background elements */}
                    <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-amber-300/20 to-transparent rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-purple-400/15 to-transparent rounded-full blur-2xl"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-amber-400/5 to-purple-600/5 rounded-full blur-2xl"></div>
                    
                    {/* Animated border glow */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-white/20"></div>
                    
                    <div className="relative z-10">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
                            {/* Left side - Title and welcome message */}
                            <div className="flex-1 space-y-2 sm:space-y-3">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-300 to-amber-400 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
                                            <polyline points="9 22 9 12 15 12 15 22" />
                                        </svg>
                                    </div>
                                    <h1 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                                        {t('dashboard.title')}
                                    </h1>
                                </div>
                                <p className="text-white/90 text-sm sm:text-base md:text-lg leading-relaxed font-medium">
                                    {t('dashboard.welcomeMessage') || 'نظرة شاملة على أداء العيادة، المواعيد، الإيرادات، والإحصائيات الرئيسية'}
                                </p>
                            </div>
                            
                            {/* Right side - Quick stats badges */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4">
                                <div className="group flex items-center gap-2 sm:gap-2.5 bg-white/15 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-white/20 hover:bg-white/25 hover:border-white/30 transition-all duration-300 hover:scale-105 cursor-default">
                                    <div className="relative flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-amber-300 group-hover:text-amber-200 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-400 rounded-full animate-pulse"></div>
                                    </div>
                                    <span className="font-semibold text-xs sm:text-sm">{patients.length} <span className="text-white/80 font-normal">{t('dashboard.patients') || 'مرضى'}</span></span>
                                </div>
                                <div className="group flex items-center gap-2 sm:gap-2.5 bg-white/15 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-white/20 hover:bg-white/25 hover:border-white/30 transition-all duration-300 hover:scale-105 cursor-default">
                                    <div className="relative flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-purple-300 group-hover:text-purple-200 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-pulse"></div>
                                    </div>
                                    <span className="font-semibold text-xs sm:text-sm">{upcomingAppointmentsList.length} <span className="text-white/80 font-normal">{t('dashboard.upcomingAppointments') || 'مواعيد قادمة'}</span></span>
                                </div>
                                {isAdmin && (
                                    <div className="group flex items-center gap-2 sm:gap-2.5 bg-gradient-to-r from-amber-500/20 to-purple-600/20 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-white/30 hover:from-amber-500/30 hover:to-purple-600/30 transition-all duration-300 hover:scale-105 cursor-default">
                                        <div className="relative flex-shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-amber-200 group-hover:text-amber-100 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                            <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full animate-pulse"></div>
                                        </div>
                                        <span className="font-semibold text-xs sm:text-sm">{currencyFormatter.format(clinicProfitThisMonth)} <span className="text-white/80 font-normal">{t('dashboard.monthlyNetProfit') || 'صافي الربح الشهري'}</span></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>


                {/* 1. Data Visualization Dashboard - Only for Admin */}
                {isAdmin && dashboard.showQuickStats && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Today's Financial Overview */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
                                        <div className="w-1 h-5 sm:h-6 bg-gradient-to-b from-purple-300 to-purple-400 rounded-full mr-2 sm:mr-3"></div>
                                        {t('dashboard.todaysFinancials')}
                                    </h2>
                                    <button
                                        onClick={() => setCurrentView('reports')}
                                        className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors px-2 sm:px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                    >
                                        {t('dashboard.viewDetails')}
                                    </button>
                                </div>
                            </div>
                            <div className="p-3 sm:p-6">
                                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                    <StatCard
                                        title={t('dashboard.todaysRevenue') || "إيرادات اليوم"}
                                        value={currencyFormatter.format(todaysRevenue)}
                                        icon={TrendingUpIcon}
                                        color="bg-emerald-50 border border-emerald-200"
                                        subtitle={t('dashboard.today') || "اليوم"}
                                    />
                                    <StatCard
                                        title={t('dashboard.todaysExpenses') || "المصروفات اليوم"}
                                        value={currencyFormatter.format(todaysExpenses)}
                                        icon={TrendingDownIcon}
                                        color="bg-red-50 border border-red-200"
                                        subtitle={t('dashboard.today') || "اليوم"}
                                    />
                                    <StatCard
                                        title={t('dashboard.doctorsDuesToday') || "حصة الأطباء اليوم"}
                                        value={currencyFormatter.format(doctorsDuesToday)}
                                        icon={AlertIcon}
                                        color="bg-orange-50 border border-orange-200"
                                        subtitle={t('dashboard.today') || "اليوم"}
                                    />
                                </div>
                                <div className="mt-4 sm:mt-6 text-center">
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                        {t('dashboard.netToday')}: <span className={`font-bold ${netToday >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {currencyFormatter.format(netToday)}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Daily Trends - Show when showRevenueChart is enabled */}
                        {dashboard.showRevenueChart && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
                                        <div className="w-1 h-5 sm:h-6 bg-gradient-to-b from-purple-300 to-purple-400 rounded-full mr-2 sm:mr-3"></div>
                                        {t('dashboard.dailyTrends') || 'Daily Trends'}
                                    </h2>
                                    <button
                                        onClick={() => setCurrentView('reports')}
                                        className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors px-2 sm:px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                    >
                                        {t('dashboard.viewDetails')}
                                    </button>
                                </div>
                            </div>
                            <div className="p-3 sm:p-6">
                                <div className="h-56 sm:h-64 md:h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={dailyTrendsData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                                            <YAxis tickFormatter={(value) => currencyFormatter.format(value)} stroke="#6b7280" fontSize={12} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                                labelStyle={{ color: '#111827', fontWeight: 'bold' }}
                                                formatter={(value) => [currencyFormatter.format(value as number), '']}
                                            />
                                            <Legend
                                                wrapperStyle={{ paddingTop: '10px' }}
                                                iconSize={12}
                                                iconType="circle"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                                                name={t('dashboard.dailyRevenue') || 'Revenue'}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="expenses"
                                                stroke="#ef4444"
                                                strokeWidth={2}
                                                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                                                activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                                                name={t('dashboard.dailyExpenses') || 'Expenses'}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                        )}
                    </div>
                )}

                {/* 2. Upcoming Appointments Section - Show when showAppointmentsToday is enabled */}
                {dashboard.showAppointmentsToday && (
                <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
                                <div className="w-1 h-5 sm:h-6 bg-gradient-to-b from-purple-300 to-purple-400 rounded-full mr-2 sm:mr-3"></div>
                                {t('dashboard.upcomingAppointments')}
                            </h2>
                            <button
                                onClick={() => setCurrentView('scheduler')}
                                className="text-xs sm:text-sm text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 font-medium transition-colors px-2 sm:px-3 py-1 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/30"
                            >
                                {t('dashboard.viewAll')}
                            </button>
                        </div>
                    </div>
                    <div className="p-3 sm:p-6">
                        <div className="space-y-2 sm:space-y-3 max-h-64 overflow-y-auto scrollbar-modern">
                            {upcomingAppointmentsList.length > 0 ? (
                                upcomingAppointmentsList.map(apt => (
                                    <div key={apt.id} className="flex justify-between items-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg sm:rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:bg-slate-200 dark:active:bg-slate-600">
                                        <div className="min-w-0 flex-1 mr-2">
                                            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm sm:text-base truncate">{patients.find(p => p.id === apt.patientId)?.name}</p>
                                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">{apt.reason}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">{new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(apt.startTime))}</p>
                                            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500">{new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(apt.startTime))}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 p-4 text-center">{t('dashboard.noUpcomingAppointments')}</p>
                            )}
                        </div>
                    </div>
                </div>
                )}

                {/* 2.3. Monthly Trends (moved below) - Only for Admin */}
                {isAdmin && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
                                    <div className="w-1 h-5 sm:h-6 bg-gradient-to-b from-purple-300 to-purple-400 rounded-full mr-2 sm:mr-3"></div>
                                    {t('dashboard.monthlyTrends') || 'Monthly Trends'}
                                </h2>
                                <button
                                    onClick={() => setCurrentView('reports')}
                                    className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium transition-colors px-2 sm:px-3 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                >
                                    {t('dashboard.viewDetails')}
                                </button>
                            </div>
                        </div>
                        <div className="p-3 sm:p-6">
                            <div className="h-56 sm:h-64 md:h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyTrendsData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                                        <YAxis tickFormatter={(value) => currencyFormatter.format(value)} stroke="#6b7280" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                            labelStyle={{ color: '#111827', fontWeight: 'bold' }}
                                            formatter={(value) => [currencyFormatter.format(value as number), '']}
                                        />
                                        <Legend
                                            wrapperStyle={{ paddingTop: '10px' }}
                                            iconSize={12}
                                            iconType="circle"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#10b981"
                                        strokeWidth={2}
                                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                                        name={t('dashboard.monthlyRevenue') || 'Revenue'}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="expenses"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                                        name={t('dashboard.monthlyExpenses') || 'Expenses'}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                )}

                {/* 2.5. Activity Timeline - Only for Admin */}
                {isAdmin && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
                                    <div className="w-1 h-5 sm:h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full mr-2 sm:mr-3"></div>
                                    {t('dashboard.activityTimeline') || 'Activity Timeline'}
                                </h2>
                                <button
                                    onClick={() => setCurrentView('reports')}
                                    className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium transition-colors px-2 sm:px-3 py-1 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30"
                                >
                                    {t('dashboard.viewAll')}
                                </button>
                            </div>
                        </div>
                        <div className="p-3 sm:p-6">
                            <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto scrollbar-modern">
                                {timelineData.length > 0 ? (
                                    timelineData.map(event => (
                                        <div key={event.id} className="flex items-start space-x-3 sm:space-x-4">
                                            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mt-1.5 sm:mt-2 flex-shrink-0`} style={{ backgroundColor: event.color }}></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{event.title}</p>
                                                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 flex-shrink-0">
                                                    {new Intl.DateTimeFormat(locale, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }).format(event.date)}
                                                </p>
                                            </div>
                                            <div className="flex items-center mt-1">
                                                <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium capitalize ${
                                                  event.type === 'appointment' ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300' :
                                                  event.type === 'treatment' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' :
                                                  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                                                }`}>
                                                  {t(`dashboard.eventType.${event.type}`)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                             ) : (
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 p-4 text-center">{t('dashboard.noRecentActivity') || 'No recent activity'}</p>
                            )}
                        </div>
                    </div>
                </div>
                )}

                {/* 3. Alerts and Quick Actions Section (Quick View + Doctor Performance) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Alerts Section */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
                                    <div className="w-1 h-5 sm:h-6 bg-gradient-to-b from-purple-300 to-purple-400 rounded-full mr-2 sm:mr-3"></div>
                                    {t('dashboard.atAGlance')}
                                </h2>
                                {overdueInvoices > 0 && (
                                    <div className="flex items-center text-orange-600 dark:text-orange-400 text-xs sm:text-sm font-medium bg-orange-50 dark:bg-orange-900/30 px-2 sm:px-3 py-1 rounded-full">
                                        {AlertIcon}
                                        <span className="ml-1">{overdueInvoices} {t('dashboard.overdue')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-3 sm:p-6">
                            <div className="grid grid-cols-1 gap-4 sm:gap-6">
                                <div>
                                    <h3 className="font-semibold text-slate-600 dark:text-slate-400 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                                        {t('dashboard.pendingLabCases')}
                                    </h3>
                                    <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-minimal">
                                        {pendingLabCases.length > 0 ? (
                                            pendingLabCases.map(lc => (
                                                <button key={lc.id} onClick={() => setCurrentView('labCases')} className="w-full text-start p-2.5 sm:p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 active:bg-slate-100 dark:active:bg-slate-600">
                                                    <div className="flex justify-between items-center text-xs sm:text-sm">
                                                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mr-2">{patients.find(p => p.id === lc.patientId)?.name}</p>
                                                        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 flex-shrink-0">{t('labCases.due')}: {lc.dueDate ? dateFormatter.format(new Date(lc.dueDate)) : 'No due date'}</p>
                                                    </div>
                                                    <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">{lc.caseType}</p>
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 p-3 text-center bg-slate-50 dark:bg-slate-700/50 rounded-lg">{t('dashboard.noPendingLabCases')}</p>
                                        )}
                                    </div>
                                </div>

                                {dashboard.showLowStockAlerts && (
                                <div>
                                    <div className="flex items-center mb-2 sm:mb-3">
                                        <div className="flex-shrink-0">{AlertIcon}</div>
                                        <h3 className="font-semibold text-slate-600 dark:text-slate-400 ml-2 flex items-center text-sm sm:text-base">
                                            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                            {t('dashboard.lowStockItems')}
                                        </h3>
                                    </div>
                                    <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-minimal">
                                        {lowStockItems.length > 0 ? (
                                            lowStockItems.map(item => (
                                                <button key={item.id} onClick={() => setCurrentView('inventory')} className="w-full text-start p-2.5 sm:p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 active:bg-slate-100 dark:active:bg-slate-600">
                                                    <div className="flex justify-between items-center text-xs sm:text-sm">
                                                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate mr-2">{item.name}</p>
                                                        <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded flex-shrink-0">{t('inventory.stock')}: {item.currentStock}</p>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 p-3 text-center bg-slate-50 dark:bg-slate-700/50 rounded-lg">{t('dashboard.noLowStockItems')}</p>
                                        )}
                                    </div>
                                </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Section */}
                    <div className="space-y-4 sm:space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-700">
                                <h2 className="text-sm sm:text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center">
                                    <div className="w-1 h-4 sm:h-5 bg-gradient-to-b from-purple-300 to-purple-400 rounded-full mr-2 sm:mr-3"></div>
                                    {t('dashboard.quickActions')}
                                </h2>
                            </div>
                            <div className="p-3 sm:p-6">
                                <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3">
                                    <button
                                        onClick={() => setCurrentView('patients')}
                                        className="flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg sm:rounded-xl transition-colors border border-slate-200 dark:border-slate-600 hover:border-emerald-200 dark:hover:border-emerald-700 group active:scale-95"
                                    >
                                        <div className="text-emerald-600 group-hover:text-emerald-700 scale-90 sm:scale-100">
                                            {PatientsIcon}
                                        </div>
                                        <span className="mt-1 sm:mt-2 text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{t('dashboard.addPatient')}</span>
                                    </button>
                                    <button
                                        onClick={() => setCurrentView('scheduler')}
                                        className="flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-lg sm:rounded-xl transition-colors border border-slate-200 dark:border-slate-600 hover:border-sky-200 dark:hover:border-sky-700 group active:scale-95"
                                    >
                                        <div className="text-sky-600 group-hover:text-sky-700 scale-90 sm:scale-100">
                                            {CalendarIcon}
                                        </div>
                                        <span className="mt-1 sm:mt-2 text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-sky-700 dark:group-hover:text-sky-400">{t('dashboard.schedule')}</span>
                                    </button>
                                     {isAdmin && (
                                        <button
                                            onClick={() => setCurrentView('accountSelection')}
                                            className="flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg sm:rounded-xl transition-colors border border-slate-200 dark:border-slate-600 hover:border-green-200 dark:hover:border-green-700 group active:scale-95"
                                        >
                                            <div className="text-emerald-600 group-hover:text-emerald-700 scale-90 sm:scale-100">
                                                {DollarIcon}
                                            </div>
                                            <span className="mt-1 sm:mt-2 text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{t('dashboard.finance')}</span>
                                        </button>
                                    )}
                                    {isAdmin && (
                                        <button
                                            onClick={() => setCurrentView('reports')}
                                            className="flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg sm:rounded-xl transition-colors border border-slate-200 dark:border-slate-600 hover:border-indigo-200 dark:hover:border-indigo-700 group active:scale-95"
                                        >
                                            <div className="text-indigo-600 group-hover:text-indigo-700 scale-90 sm:scale-100">
                                                {TrendingUpIcon}
                                            </div>
                                            <span className="mt-1 sm:mt-2 text-[10px] sm:text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400">{t('dashboard.reports')}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Doctor Performance Section */}
                        {isAdmin && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-sm sm:text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center">
                                            <div className="w-1 h-4 sm:h-5 bg-gradient-to-b from-purple-300 to-purple-400 rounded-full mr-2 sm:mr-3"></div>
                                            {t('dashboard.doctorDailyPerformance')}
                                        </h2>
                                        <button
                                            onClick={() => setCurrentView('doctors')}
                                            className="text-xs sm:text-sm text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 font-medium transition-colors px-2 py-1 rounded hover:bg-teal-50 dark:hover:bg-teal-900/30"
                                        >
                                            {t('dashboard.viewDetails')}
                                        </button>
                                    </div>
                                </div>
                                <div className="p-3 sm:p-6">
                                    <div className="space-y-3 sm:space-y-4 max-h-40 sm:max-h-48 overflow-y-auto scrollbar-minimal">
                                        {doctorPerformanceToday.length > 0 ? doctorPerformanceToday.map(doc => (
                                            <div key={doc.name} className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                                <div className="flex justify-between items-center text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
                                                    <span className="text-slate-700 dark:text-slate-300 truncate mr-2">{doc.name}</span>
                                                    <span className="text-slate-600 dark:text-slate-400 flex-shrink-0">{fullCurrencyFormatter.format(doc.earnings)}</span>
                                                </div>
                                                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 sm:h-2">
                                                    <div className={`${doc.color} h-1.5 sm:h-2 rounded-full transition-all duration-300`} style={{ width: `${doc.percentage}%` }}></div>
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center py-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">{t('dashboard.noEarningsToday')}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Monthly Metrics and Operational Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Monthly Metrics Section */}
                    {isAdmin && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-700">
                                <h2 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
                                    <div className="w-1 h-5 sm:h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full mr-2 sm:mr-3"></div>
                                    {t('dashboard.monthlyMetrics')}
                                </h2>
                            </div>
                            <div className="p-3 sm:p-6">
                                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                    <StatCard
                                        title={t('dashboard.monthlyRevenue') || "إيرادات الشهر"}
                                        value={currencyFormatter.format(thisMonthRevenue)}
                                        icon={TrendingUpIcon}
                                        color="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                                        subtitle={t('dashboard.thisMonth') || "هذا الشهر"}
                                    />
                                    <StatCard
                                        title={t('dashboard.monthlyExpenses') || "مصروفات الشهر"}
                                        value={currencyFormatter.format(thisMonthExpenses)}
                                        icon={TrendingDownIcon}
                                        color="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
                                        subtitle={t('dashboard.thisMonth') || "هذا الشهر"}
                                    />
                                    <StatCard
                                        title={t('dashboard.monthlyDoctorShares')}
                                        value={currencyFormatter.format(thisMonthDoctorShares)}
                                        icon={DollarIcon}
                                        color="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800"
                                        subtitle={t('dashboard.thisMonth') || "هذا الشهر"}
                                        onClick={() => setCurrentView('doctors')}
                                    />
                                    <StatCard
                                        title={t('dashboard.monthlyNetProfit') || "صافي الشهر"}
                                        value={currencyFormatter.format(clinicProfitThisMonth)}
                                        icon={clinicProfitThisMonth >= 0 ? TrendingUpIcon : TrendingDownIcon}
                                        color={clinicProfitThisMonth >= 0 ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800"}
                                        subtitle={t('dashboard.thisMonth') || "هذا الشهر"}
                                        onClick={() => setCurrentView('reports')}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Operational Metrics Section */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-700">
                            <h2 className="text-base sm:text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
                                <div className="w-1 h-5 sm:h-6 bg-gradient-to-b from-purple-300 to-purple-400 rounded-full mr-2 sm:mr-3"></div>
                                {t('dashboard.operationalMetrics')}
                            </h2>
                        </div>
                        <div className="p-3 sm:p-6">
                            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                <StatCard
                                    title={t('dashboard.totalPatients')}
                                    value={patients.length}
                                    icon={PatientsIcon}
                                    color="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800"
                                    subtitle={t('dashboard.activePatients')}
                                />
                                <StatCard
                                    title={t('dashboard.newPatientsThisMonth')}
                                    value={newPatientsThisMonth}
                                    icon={UserPlusIcon}
                                    color="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800"
                                    subtitle="This month"
                                />
                                <StatCard
                                    title={t('dashboard.appointmentsToday')}
                                    value={todaysAppointmentsCount}
                                    icon={CalendarIcon}
                                    color="bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800"
                                    subtitle={t('dashboard.scheduledToday')}
                                />
                                <StatCard
                                    title={t('dashboard.nextAppointment')}
                                    value={nextAppointment ? new Intl.DateTimeFormat(locale, {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }).format(new Date(nextAppointment.startTime)) : t('dashboard.noUpcomingAppointments')}
                                    icon={ClockIcon}
                                    color="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800"
                                    subtitle={nextAppointment ? patients.find(p => p.id === nextAppointment.patientId)?.name : ''}
                                    onClick={() => setCurrentView('scheduler')}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
