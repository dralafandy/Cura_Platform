import React, { useState, useMemo, useCallback } from 'react';
import { ClinicData } from '../hooks/useClinicData';
import { Dentist, DoctorDetailTab, DoctorPayment } from '../types';
import { useI18n } from '../hooks/useI18n';
import { useNotification } from '../contexts/NotificationContext';
import AddDoctorPaymentModal from './finance/AddDoctorPaymentModal';

// Icons
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const DollarSignIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v22m5-18H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const BriefcaseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const ChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const AddPaymentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ArrowUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const PaymentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);

const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const availableColors = [
    'bg-gradient-to-br from-sky-400 to-sky-600', 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    'bg-gradient-to-br from-amber-400 to-amber-600', 'bg-gradient-to-br from-rose-400 to-rose-600',
    'bg-gradient-to-br from-indigo-400 to-indigo-600', 'bg-gradient-to-br from-teal-400 to-teal-600',
    'bg-gradient-to-br from-orange-400 to-orange-600', 'bg-gradient-to-br from-purple-400 to-purple-600',
];

// Status badge component
const StatusBadge: React.FC<{ status: string; locale: string }> = ({ status, locale }) => {
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

const DoctorDetailsPage: React.FC<{ clinicData: ClinicData; doctorId: string; onBack: () => void }> = ({ clinicData, doctorId, onBack }) => {
    const { t, locale } = useI18n();
    const { addNotification } = useNotification();
    const { appointments, patients, treatmentRecords, treatmentDefinitions, doctorPayments, dentists, updateDoctor } = clinicData;
    
    const doctor = dentists.find(d => d.id === doctorId);
    
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(doctor || { id: '', name: '', specialty: '', color: availableColors[0] });
    const [activeTab, setActiveTab] = useState<DoctorDetailTab>('details');
    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
    const [treatmentFilter, setTreatmentFilter] = useState<'all' | 'month' | 'quarter' | 'year'>('all');
    const [isRecentActivityOpen, setIsRecentActivityOpen] = useState(false);

    if (!doctor) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center py-12">
                        <p className="text-slate-500 dark:text-slate-400">Doctor not found</p>
                        <button onClick={onBack} className="mt-4 text-purple-600 dark:text-purple-400 hover:underline">
                            Back to Doctors List
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const doctorAppointments = useMemo(() => {
        return appointments
            .filter(a => a.dentistId === doctor.id)
            .sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
    }, [appointments, doctor.id]);

    const doctorTreatmentRecords = useMemo(() => {
        return treatmentRecords
            .filter(tr => tr.dentistId === doctor.id)
            .sort((a,b) => new Date(b.treatmentDate).getTime() - new Date(a.treatmentDate).getTime());
    }, [treatmentRecords, doctor.id]);

    const doctorPaymentsList = useMemo(() => (doctorPayments || []).filter(p => p.dentistId === doctor.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [doctorPayments, doctor.id]);

    const financialSummary = useMemo(() => {
        const totalRevenue = doctorTreatmentRecords.reduce((sum, tr) => {
            const treatmentDef = treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
            return sum + (treatmentDef ? treatmentDef.basePrice : 0);
        }, 0);
        const totalEarnings = doctorTreatmentRecords.reduce((sum, tr) => sum + tr.doctorShare, 0);
        const totalPaymentsReceived = doctorPaymentsList.reduce((sum, p) => sum + p.amount, 0);
        const netBalance = totalEarnings - totalPaymentsReceived;
        return { totalRevenue, totalEarnings, totalPaymentsReceived, netBalance };
    }, [doctorTreatmentRecords, doctorPaymentsList, treatmentDefinitions]);

    const quickStats = useMemo(() => {
        const upcomingAppointments = doctorAppointments.filter(a => a.startTime > new Date()).length;
        const thisMonthTreatments = doctorTreatmentRecords.filter(tr => {
            const treatmentDate = new Date(tr.treatmentDate);
            const now = new Date();
            return treatmentDate.getMonth() === now.getMonth() && treatmentDate.getFullYear() === now.getFullYear();
        }).length;
        const avgTreatmentValue = doctorTreatmentRecords.length > 0
            ? financialSummary.totalEarnings / doctorTreatmentRecords.length
            : 0;
        return { upcomingAppointments, thisMonthTreatments, avgTreatmentValue };
    }, [doctorAppointments, doctorTreatmentRecords, financialSummary.totalEarnings]);

    const filteredTreatments = useMemo(() => {
        const now = new Date();
        return doctorTreatmentRecords.filter(tr => {
            const treatmentDate = new Date(tr.treatmentDate);
            switch (treatmentFilter) {
                case 'month':
                    return treatmentDate.getMonth() === now.getMonth() && treatmentDate.getFullYear() === now.getFullYear();
                case 'quarter':
                    const quarter = Math.floor(now.getMonth() / 3);
                    const treatmentQuarter = Math.floor(treatmentDate.getMonth() / 3);
                    return treatmentQuarter === quarter && treatmentDate.getFullYear() === now.getFullYear();
                case 'year':
                    return treatmentDate.getFullYear() === now.getFullYear();
                default:
                    return true;
            }
        });
    }, [doctorTreatmentRecords, treatmentFilter]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const handleColorChange = (color: string) => {
        setFormData(prev => ({ ...prev, color }));
    }

    const handleSave = () => {
        updateDoctor({ ...doctor, ...formData });
        setIsEditing(false);
        addNotification({ message: t('notifications.doctorUpdated'), type: 'success' as any });
    };

    const handleAddPayment = useCallback((payment: Omit<DoctorPayment, 'id'>) => {
        clinicData.addDoctorPayment(payment);
        setIsAddPaymentModalOpen(false);
        addNotification({ message: t('notifications.paymentAdded'), type: 'success' as any });
    }, [clinicData, addNotification, t]);

    const dateTimeFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-amber-50/30 dark:from-slate-900 dark:via-purple-900/10 dark:to-amber-900/10">
            <div className="max-w-7xl mx-auto p-4 md:p-6">
                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 mb-6 transition-colors"
                >
                    <BackIcon />
                    {t('common.back')}
                </button>

                {/* Enhanced Gradient Header with Doctor Avatar */}
                <header className="relative p-8 rounded-2xl border border-purple-200/50 dark:border-purple-700/50 bg-gradient-to-br from-purple-50 via-white to-amber-50 dark:from-purple-900/30 dark:via-slate-800 dark:to-amber-900/20 shadow-xl mb-6">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-200/30 to-amber-200/30 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-200/30 to-purple-200/30 rounded-full blur-3xl"></div>

                    <div className="relative flex items-center gap-6">
                        {/* Doctor Avatar */}
                        <div className={`w-24 h-24 rounded-2xl ${doctor.color} flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-white dark:ring-slate-700`}>
                            {doctor.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold text-slate-800 dark:text-white">{doctor.name}</h1>
                            <p className="text-lg text-purple-600 dark:text-purple-400 flex items-center gap-2 mt-2">
                                <BriefcaseIcon />
                                {doctor.specialty}
                            </p>
                            <div className="flex items-center gap-6 mt-3">
                                <span className="text-base text-slate-500 dark:text-slate-400">
                                    <span className="font-semibold text-purple-600 dark:text-purple-400">{doctorTreatmentRecords.length}</span> {t('doctorDetails.treatments')}
                                </span>
                                <span className="text-base text-slate-500 dark:text-slate-400">
                                    <span className="font-semibold text-blue-600 dark:text-blue-400">{quickStats.upcomingAppointments}</span> {t('doctorDetails.upcomingAppointments')}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 text-base font-semibold shadow-lg shadow-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200"
                                >
                                    <EditIcon />
                                    <span>{t('common.edit')}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {/* Enhanced Tab Navigation */}
                <nav className="border-b border-purple-100 dark:border-purple-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm flex-shrink-0 rounded-2xl mb-6">
                    <ul className="flex gap-1 p-2 overflow-x-auto">
                        {[
                            { key: 'details', label: 'doctorDetails.tabDetails', icon: UserIcon },
                            { key: 'treatments', label: 'doctorDetails.tabTreatments', icon: ChartIcon },
                            { key: 'financials', label: 'doctorDetails.tabFinancials', icon: DollarSignIcon },
                            { key: 'schedule', label: 'doctorDetails.tabSchedule', icon: CalendarIcon }
                        ].map(({ key, label, icon: Icon }) => (
                            <li key={key} className="flex-1 min-w-0">
                                <button
                                    onClick={() => setActiveTab(key as DoctorDetailTab)}
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                                        activeTab === key
                                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400'
                                    }`}
                                >
                                    <Icon />
                                    <span className="hidden sm:inline">{t(label)}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <main className="space-y-6">
                    {/* Recent Activity Section - Collapsible */}
                    {!isEditing && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-700 overflow-hidden">
                            <button
                                onClick={() => setIsRecentActivityOpen(!isRecentActivityOpen)}
                                className="w-full flex items-center justify-between p-6 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <ClockIcon />
                                    <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400">
                                        {t('doctorDetails.recentActivity') || 'Recent Activity'}
                                    </h3>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">({doctorAppointments.length} {t('doctorDetails.appointments')})</span>
                                </div>
                                <div className={`transform transition-transform duration-200 ${isRecentActivityOpen ? 'rotate-180' : ''}`}>
                                    <ChevronDownIcon />
                                </div>
                            </button>
                            {isRecentActivityOpen && (
                                <div className="p-6 pt-0 space-y-3">
                                    {doctorAppointments.slice(0, 5).map(apt => {
                                        const patient = patients.find(p => p.id === apt.patientId);
                                        return (
                                            <div key={apt.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-amber-50 dark:from-purple-900/20 dark:to-amber-900/10 rounded-xl border border-purple-100 dark:border-purple-700 hover:shadow-md transition-shadow">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                    {patient?.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{patient?.name || 'Unknown Patient'}</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">{dateTimeFormatter.format(apt.startTime)}</p>
                                                </div>
                                                <StatusBadge status={apt.status} locale={locale} />
                                            </div>
                                        );
                                    })}
                                    {doctorAppointments.length === 0 && (
                                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                                <CalendarIcon />
                                            </div>
                                            <p>{t('doctorDetails.noRecentActivity') || 'No recent activity'}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab Content */}
                    {activeTab === 'details' && (
                        <div className="space-y-4">
                            {isEditing ? (
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-700 space-y-4">
                                    <div className="space-y-3">
                                        <label htmlFor="edit-doctor-name" className="block text-sm font-medium text-purple-700 dark:text-purple-400">{t('doctorDetails.fullName')}</label>
                                        <input id="edit-doctor-name" name="name" value={formData.name} onChange={handleChange} placeholder={t('doctorDetails.fullName')} className="p-3 border border-purple-200 dark:border-purple-600 rounded-xl w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200" />
                                    </div>
                                    <div className="space-y-3">
                                        <label htmlFor="edit-doctor-specialty" className="block text-sm font-medium text-purple-700 dark:text-purple-400">{t('doctorDetails.specialty')}</label>
                                        <input id="edit-doctor-specialty" name="specialty" value={formData.specialty} onChange={handleChange} placeholder={t('doctorDetails.specialty')} className="p-3 border border-purple-200 dark:border-purple-600 rounded-xl w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-purple-700 dark:text-purple-400">{t('doctorDetails.colorTag')}</label>
                                        <div className="flex flex-wrap gap-3">
                                        {availableColors.map(color => (
                                            <button
                                                type="button"
                                                key={color}
                                                onClick={() => handleColorChange(color)}
                                                className={`w-10 h-10 rounded-xl ${color} ${formData.color === color ? 'ring-2 ring-offset-2 ring-purple-500 dark:ring-purple-400 shadow-lg' : ''} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400 dark:focus:ring-purple-600 transition-all duration-200`}
                                                aria-label={t('doctorDetails.selectColorAriaLabel', {color: color.replace('bg-gradient-to-br from-', '').replace(' to-', '-')})}
                                            ></button>
                                        ))}
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button 
                                            type="button" 
                                            onClick={() => { setIsEditing(false); setFormData(doctor); }} 
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
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-700">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                                <BriefcaseIcon />
                                            </div>
                                            <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400">{t('doctorDetails.specialty')}</h3>
                                        </div>
                                        <p className="text-slate-700 dark:text-slate-300 text-lg">{doctor.specialty}</p>
                                    </div>

                                    {/* Appointments Card */}
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-700">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                                <CalendarIcon />
                                            </div>
                                            <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400">{t('doctorDetails.appointmentSchedule')}</h3>
                                            <span className="ml-auto bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm px-3 py-1 rounded-full">
                                                {doctorAppointments.length} {t('doctorDetails.appointments')}
                                            </span>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto space-y-2">
                                            {doctorAppointments.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {doctorAppointments.slice(0, 10).map(apt => {
                                                        const patient = patients.find(p => p.id === apt.patientId);
                                                        return (
                                                            <li key={apt.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-amber-50 dark:from-purple-900/20 dark:to-amber-900/10 rounded-xl border border-purple-100 dark:border-purple-700">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                                        {patient?.name?.charAt(0) || '?'}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-slate-800 dark:text-slate-200">{patient?.name || 'Unknown Patient'}</p>
                                                                        <p className="text-sm text-slate-500 dark:text-slate-400">{dateTimeFormatter.format(apt.startTime)}</p>
                                                                    </div>
                                                                </div>
                                                                <StatusBadge status={apt.status} locale={locale} />
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                                        <CalendarIcon />
                                                    </div>
                                                    <p className="text-slate-500 dark:text-slate-400">{t('doctorDetails.noAppointmentsFound')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'treatments' && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-700">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                        <ChartIcon />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400">{t('doctorDetails.treatmentsPerformed')}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{filteredTreatments.length} {t('doctorDetails.treatments')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-purple-200 dark:border-purple-600 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        value={treatmentFilter}
                                        onChange={(e) => setTreatmentFilter(e.target.value as any)}
                                    >
                                        <option value="all">{t('common.allTime') || 'All Time'}</option>
                                        <option value="month">{t('common.thisMonth') || 'This Month'}</option>
                                        <option value="quarter">{t('common.thisQuarter') || 'This Quarter'}</option>
                                        <option value="year">{t('common.thisYear') || 'This Year'}</option>
                                    </select>
                                </div>
                            </div>
                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {filteredTreatments.length > 0 ? (
                                    <ul className="space-y-3">
                                        {filteredTreatments.map((tr, index) => {
                                            const patient = patients.find(p => p.id === tr.patientId);
                                            const treatment = treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
                                            const isRecent = index < 3;
                                            return (
                                                <li key={tr.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                                                    isRecent
                                                        ? 'bg-gradient-to-r from-purple-50 to-amber-50 dark:from-purple-900/20 dark:to-amber-900/10 border-purple-100 dark:border-purple-700 hover:shadow-md'
                                                        : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                }`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${
                                                            isRecent
                                                                ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                                                                : 'bg-gradient-to-br from-slate-400 to-slate-600'
                                                        }`}>
                                                            {treatment?.name?.charAt(0) || 'T'}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-800 dark:text-slate-200">{treatment?.name || 'Unknown Treatment'}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                                    {dateFormatter.format(new Date(tr.treatmentDate))}
                                                                </p>
                                                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                                                <p className="text-sm text-slate-500 dark:text-slate-400">{patient?.name || 'Unknown Patient'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`font-bold text-lg ${isRecent ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                                            {currencyFormatter.format(tr.doctorShare)}
                                                        </p>
                                                        <p className="text-xs text-slate-400 dark:text-slate-500">{t('doctorDetails.doctorShare')}</p>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                            <ChartIcon />
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-lg">{t('doctorDetails.noTreatmentsFound')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'financials' && (
                        <div className="space-y-4">
                            {/* Financial Summary Cards */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-700">
                                <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400 mb-4 flex items-center gap-2">
                                    <DollarSignIcon />
                                    {t('doctorDetails.financialSummary')}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-4 rounded-xl border border-purple-200 dark:border-purple-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm text-purple-600 dark:text-purple-400">{t('doctorDetails.totalEarnings')}</p>
                                            <div className="p-1.5 bg-purple-200 dark:bg-purple-700 rounded-lg">
                                                <ArrowUpIcon />
                                            </div>
                                        </div>
                                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{currencyFormatter.format(financialSummary.totalEarnings)}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-700">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm text-emerald-600 dark:text-emerald-400">{t('doctorDetails.totalPaymentsReceived')}</p>
                                            <div className="p-1.5 bg-emerald-200 dark:bg-emerald-700 rounded-lg">
                                                <CheckCircleIcon />
                                            </div>
                                        </div>
                                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{currencyFormatter.format(financialSummary.totalPaymentsReceived)}</p>
                                    </div>
                                    <div className={`col-span-1 sm:col-span-2 p-4 rounded-xl border ${
                                        financialSummary.netBalance >= 0 
                                            ? 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-700' 
                                            : 'bg-gradient-to-r from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/30 border-rose-200 dark:border-rose-700'
                                    }`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t('doctorDetails.netBalance')}</p>
                                            <div className={`p-1.5 rounded-lg ${
                                                financialSummary.netBalance >= 0 
                                                    ? 'bg-amber-200 dark:bg-amber-700' 
                                                    : 'bg-rose-200 dark:bg-rose-700'
                                            }`}>
                                                {financialSummary.netBalance >= 0 ? <ArrowUpIcon /> : <ArrowUpIcon />}
                                            </div>
                                        </div>
                                        <p className={`text-3xl font-bold ${
                                            financialSummary.netBalance >= 0 
                                                ? 'text-amber-600 dark:text-amber-400' 
                                                : 'text-rose-600 dark:text-rose-400'
                                        }`}>{currencyFormatter.format(financialSummary.netBalance)}</p>
                                        <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">
                                            {financialSummary.netBalance >= 0 ? t('financials.amountDue') : t('financials.overpaid')}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Add Payment Button */}
                                {financialSummary.netBalance > 0 && (
                                    <button
                                        onClick={() => setIsAddPaymentModalOpen(true)}
                                        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-200"
                                    >
                                        <AddPaymentIcon />
                                        {t('doctorDetails.addPayment')}
                                    </button>
                                )}
                            </div>

                            {/* Transactions */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-700">
                                <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400 mb-4 flex items-center gap-2">
                                    <PaymentIcon />
                                    {t('doctorDetails.transactions')}
                                </h3>
                                <div className="max-h-80 overflow-y-auto space-y-3">
                                    {doctorPaymentsList.length === 0 && doctorTreatmentRecords.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                                <PaymentIcon />
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400">{t('doctorDetails.noTransactions')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {/* Display payments first */}
                                            {doctorPaymentsList.map(payment => (
                                                <div key={payment.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10 rounded-xl border border-emerald-100 dark:border-emerald-700 hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white">
                                                            <PaymentIcon />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-800 dark:text-slate-200">{t('doctorDetails.payments')}</p>
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
                                                            onClick={() => {
                                                                if (window.confirm(t('common.confirmDelete'))) {
                                                                    clinicData.deleteDoctorPayment(payment.id);
                                                                    addNotification({ message: t('notifications.paymentDeleted'), type: 'success' as any });
                                                                }
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                                            title={t('common.delete')}
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Then display earnings (treatment records) */}
                                            {doctorTreatmentRecords.map(record => {
                                                const patient = patients.find(p => p.id === record.patientId);
                                                const treatment = treatmentDefinitions.find(td => td.id === record.treatmentDefinitionId);
                                                return (
                                                    <div key={record.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-amber-50 dark:from-purple-900/20 dark:to-amber-900/10 rounded-xl border border-purple-100 dark:border-purple-700 hover:shadow-md transition-shadow">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white">
                                                                <ChartIcon />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-800 dark:text-slate-200">{t('doctorDetails.earnings')}</p>
                                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                                    {treatment?.name} • {patient?.name}
                                                                </p>
                                                                <p className="text-xs text-slate-400 dark:text-slate-500">{dateFormatter.format(new Date(record.treatmentDate))}</p>
                                                            </div>
                                                        </div>
                                                        <span className="font-bold text-purple-600 dark:text-purple-400 text-lg">{currencyFormatter.format(record.doctorShare)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-700">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                    <CalendarIcon />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400">{t('doctorDetails.appointmentSchedule')}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{doctorAppointments.length} {t('doctorDetails.appointments')}</p>
                                </div>
                            </div>
                            <div className="max-h-96 overflow-y-auto space-y-3">
                                {doctorAppointments.length > 0 ? (
                                    <ul className="space-y-3">
                                        {doctorAppointments.map(apt => {
                                            const patient = patients.find(p => p.id === apt.patientId);
                                            const isUpcoming = apt.startTime > new Date();
                                            return (
                                                <li key={apt.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                                                    isUpcoming
                                                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/10 border-blue-100 dark:border-blue-700 hover:shadow-md'
                                                        : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                                                }`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${
                                                            isUpcoming
                                                                ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                                                                : 'bg-gradient-to-br from-slate-400 to-slate-600'
                                                        }`}>
                                                            {patient?.name?.charAt(0) || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-800 dark:text-slate-200">{patient?.name || 'Unknown Patient'}</p>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400">{dateTimeFormatter.format(apt.startTime)}</p>
                                                        </div>
                                                    </div>
                                                    <StatusBadge status={apt.status} locale={locale} />
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                            <CalendarIcon />
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-lg">{t('doctorDetails.noAppointmentsFound')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>

                {/* Action Buttons */}
                {!isEditing && (
                    <div className="mt-6 flex justify-center gap-4">
                        <button
                            onClick={() => setIsAddPaymentModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:scale-105"
                        >
                            <AddPaymentIcon />
                            {t('doctorDetails.addPayment')}
                        </button>
                        <button
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-semibold shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-105"
                        >
                            <CalendarIcon />
                            {t('doctorDetails.scheduleAppointment')}
                        </button>
                    </div>
                )}

                {isAddPaymentModalOpen && (
                    <AddDoctorPaymentModal
                        dentistId={doctor.id}
                        onClose={() => setIsAddPaymentModalOpen(false)}
                        onAdd={handleAddPayment}
                        doctorPayments={clinicData.doctorPayments}
                    />
                )}
            </div>
        </div>
    );
};

export default DoctorDetailsPage;
