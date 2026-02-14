import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ClinicData } from '../hooks/useClinicData';
import { Appointment, AppointmentStatus, Patient, Dentist } from '../types';
import { useI18n } from '../hooks/useI18n';
import { useNotification } from '../contexts/NotificationContext';
import { NotificationType } from '../types';
import { getSuggestedDuration, getSuggestedTimeSlots, getAppointmentTypeColor } from '../utils/appointmentSuggestions';
import sgMail from '@sendgrid/mail';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;
const UserIcon = ({ className = "h-5 w-5 text-slate-400" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const CalendarIcon = ({ className = "h-5 w-5 text-slate-400" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ClockIcon = ({ className = "h-5 w-5 text-slate-400" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const StethoscopeIcon = ({ className = "h-5 w-5 text-slate-400" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const FileTextIcon = ({ className = "h-5 w-5 text-slate-400" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const BellIcon = ({ className = "h-5 w-5 text-slate-400" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4.868 12.683A17.925 17.925 0 012 21h18M12 2v1m0 18v1m-4-1h8m-8-4h8m-8-4h8" /></svg>;
const CheckCircleIcon = ({ className = "h-5 w-5 text-green-500" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ExclamationCircleIcon = ({ className = "h-5 w-5 text-red-500" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>;
const PrinterIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
);

const PhoneIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);

const CopyIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
);

const TodayIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v3m0 0l-2-2m2 2l2-2" />
    </svg>
);

const WeekendIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);
const WhatsAppIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
);

const DownloadIcon = ({ className = "h-4 w-4" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const QuickIcon = ({ className = "h-4 w-4" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const WaitingIcon = ({ className = "h-4 w-4" }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LoadingSpinner = () => <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const PlusIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>;


const AddAppointmentModal: React.FC<{
    onClose: () => void;
    onSave: (appointment: Omit<Appointment, 'id' | 'reminderSent' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
    clinicData: ClinicData;
    initialDateTime?: Date;
    appointmentToEdit?: Appointment;
}> = ({ onClose, onSave, clinicData, initialDateTime, appointmentToEdit }) => {
    const { t } = useI18n();
    const { addNotification } = useNotification();

    // Enhanced form state management
    const [formData, setFormData] = useState(() => {
        const initial = appointmentToEdit || {
            patientId: '',
            dentistId: '',
            startTime: initialDateTime || new Date(),
            endTime: initialDateTime ? new Date(initialDateTime.getTime() + 60 * 60000) : new Date(Date.now() + 60 * 60000),
            reason: '',
            status: AppointmentStatus.SCHEDULED,
            reminderTime: '1_day_before',
            reminderSent: false,
        };
        const formatForInput = (date: Date) => {
            const tzoffset = (new Date()).getTimezoneOffset() * 60000;
            const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
            return localISOTime;
        }

        return {
            ...initial,
            startTime: formatForInput(new Date(initial.startTime)),
            endTime: formatForInput(new Date(initial.endTime)),
        };
    });

    const [patientSearchTerm, setPatientSearchTerm] = useState(() => {
        if (appointmentToEdit && appointmentToEdit.patientId) {
            const patient = clinicData.patients.find(p => p.id === appointmentToEdit.patientId);
            return patient ? patient.name : '';
        }
        return '';
    });

    const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const firstFieldRef = React.useRef<HTMLInputElement>(null);

    // Calculate duration in minutes
    const durationMinutes = useMemo(() => {
        const start = new Date(formData.startTime);
        const end = new Date(formData.endTime);
        return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60)));
    }, [formData.startTime, formData.endTime]);

    // Real-time validation
    const validateField = useCallback((fieldName: string, value: any) => {
        const errors: Record<string, string> = {};

        switch (fieldName) {
            case 'patientId':
                if (!value) errors.patientId = t('addAppointmentModal.patientRequired');
                break;
            case 'dentistId':
                if (!value) errors.dentistId = t('addAppointmentModal.dentistRequired');
                break;
            case 'startTime':
                if (!value) errors.startTime = t('addAppointmentModal.startTimeRequired');
                break;
            case 'endTime':
                if (!value) errors.endTime = t('addAppointmentModal.endTimeRequired');
                else if (new Date(value) <= new Date(formData.startTime)) {
                    errors.endTime = t('addAppointmentModal.endTimeAfterStart');
                }
                break;
            case 'reason':
                if (!value?.trim()) errors.reason = t('addAppointmentModal.reasonRequired');
                else if (value.trim().length < 3) errors.reason = t('addAppointmentModal.reasonTooShort');
                break;
        }

        return errors;
    }, [formData.startTime, t]);

    // Handle form changes with validation
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setHasUnsavedChanges(true);

        // Mark field as touched
        setTouchedFields(prev => new Set(prev).add(name));

        // Real-time validation
        const fieldErrors = validateField(name, value);
        setValidationErrors(prev => ({ ...prev, [name]: fieldErrors[name] || '' }));
    }, [validateField]);

    // Duration preset handlers
    const setDuration = useCallback((minutes: number) => {
        const start = new Date(formData.startTime);
        const end = new Date(start.getTime() + minutes * 60000);
        const formatForInput = (date: Date) => {
            const tzoffset = (new Date()).getTimezoneOffset() * 60000;
            const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
            return localISOTime;
        };

        setFormData(prev => ({
            ...prev,
            endTime: formatForInput(end)
        }));
        setHasUnsavedChanges(true);
    }, [formData.startTime]);

    const filteredPatients = useMemo(() => {
        const term = patientSearchTerm.toLowerCase().trim();
        if (!term) return clinicData.patients;
        return clinicData.patients.filter(p =>
            p.name.toLowerCase().includes(term)
        );
    }, [clinicData.patients, patientSearchTerm]);

    // Handle clicks outside the dropdown
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsPatientDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Auto-focus first field when modal opens
    React.useEffect(() => {
        if (firstFieldRef.current) {
            firstFieldRef.current.focus();
        }
    }, []);

    const handlePatientSelect = (patientId: string) => {
        setFormData(prev => ({ ...prev, patientId }));
        const patient = clinicData.patients.find(p => p.id === patientId);
        if (patient) {
            setPatientSearchTerm(patient.name);
        }
        setIsPatientDropdownOpen(false);
        setHasUnsavedChanges(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('DEBUG: handleSubmit called with formData:', formData);
        if(!formData.patientId || !formData.dentistId || !formData.startTime || !formData.endTime) {
            console.log('DEBUG: Validation failed - missing required fields');
            addNotification(t('addAppointmentModal.alertFillAllFields'), NotificationType.ERROR);
            return;
        }
        console.log('DEBUG: Validation passed, calling onSave');
        // FIX: Explicitly construct the object to ensure it matches Omit<Appointment, 'id'>
        // This removes the 'id' property when editing and ensures 'reminderSent' is always present.
        onSave({
            patientId: formData.patientId,
            dentistId: formData.dentistId,
            startTime: new Date(formData.startTime),
            endTime: new Date(formData.endTime),
            reason: formData.reason,
            status: formData.status as AppointmentStatus,
            reminderTime: formData.reminderTime as Appointment['reminderTime'],
        });
        console.log('DEBUG: onSave called successfully');
        onClose();
    };

    // Handle close with unsaved changes warning
    const handleClose = () => {
        if (hasUnsavedChanges) {
            const confirmClose = window.confirm(t('addAppointmentModal.unsavedChangesWarning'));
            if (!confirmClose) return;
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col transform transition-all duration-300 ease-out">
                {/* Gradient Header */}
                <header className="p-6 border-b border-purple-200 dark:border-slate-600 flex justify-between items-center bg-gradient-to-r from-purple-100 to-amber-100 dark:from-purple-900 dark:to-purple-800">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg text-white">
                            {appointmentToEdit ? <CalendarIcon className="h-5 w-5 text-white" /> : <PlusIcon className="h-5 w-5 text-white" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">{appointmentToEdit ? t('scheduler.editAppointment') : t('scheduler.newAppointment')}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('addAppointmentModal.fillDetails')}</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-400 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300" aria-label={t('addAppointmentModal.closeAriaLabel')}>
                        <CloseIcon />
                    </button>
                </header>


                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Patient & Dentist Section */}
                        <div className="bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-700 p-6 rounded-xl border border-slate-300 dark:border-slate-600 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 pb-3 border-b border-slate-300 dark:border-slate-600">
                                <div className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 p-2 rounded-lg">
                                    <UserIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">{t('addAppointmentModal.patientDentist')}</h3>
                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Enhanced Patient Search */}
                                <div ref={dropdownRef} className="relative">
                                    <label htmlFor="patientSearch" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                        <UserIcon className="inline w-4 h-4 mr-1" />
                                        {t('addAppointmentModal.patient')} <span className="text-red-500">*</span>
                                    </label>

                                    <div className="relative">
                                        <SearchIcon />
                                    <input
                                        ref={firstFieldRef}
                                        type="text"
                                        id="patientSearch"
                                        placeholder={t('addAppointmentModal.searchPatient')}
                                        value={patientSearchTerm}
                                        onChange={(e) => setPatientSearchTerm(e.target.value)}
                                        onFocus={() => setIsPatientDropdownOpen(true)}
                                        className={`w-full pr-10 pl-10 py-3 border-2 rounded-xl shadow-sm focus:ring-4 focus:ring-purple-500/50 focus:outline-none transition-all duration-300 hover:shadow-md ${
                                            validationErrors.patientId ? 'border-red-500 bg-red-900/30 dark:bg-red-900/40 focus:border-red-500 focus:ring-red-500/50' : 'border-purple-400 dark:border-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:border-purple-500 dark:hover:border-purple-600'
                                        }`}
                                        aria-describedby={validationErrors.patientId ? "patient-error" : undefined}
                                        aria-invalid={!!validationErrors.patientId}
                                    />
                                        <ChevronDownIcon />
                                        {validationErrors.patientId && <ExclamationCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2" />}
                                    </div>
                                    {validationErrors.patientId && (
                                        <p id="patient-error" className="mt-2 text-sm text-red-700 flex items-center gap-2 bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-lg border border-red-300 dark:border-red-700 animate-in slide-in-from-top-1 duration-200">
                                            <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
                                            <span>{validationErrors.patientId}</span>
                                        </p>
                                    )}

                                    {isPatientDropdownOpen && (
                                        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {filteredPatients.length > 0 ? (
                                                <ul className="py-1" role="listbox">
                                                    {filteredPatients.map(patient => (
                                                        <li
                                                            key={patient.id}
                                                            onClick={() => handlePatientSelect(patient.id)}
                                    className={`px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-3 ${
                                                                formData.patientId === patient.id ? 'bg-purple-200 dark:bg-purple-800' : ''
                                                            }`}
                                                            role="option"
                                                            aria-selected={formData.patientId === patient.id}
                                                        >
                                                            <div className="w-8 h-8 bg-primary-200 rounded-full flex items-center justify-center">
                                                                <UserIcon className="w-4 h-4 text-primary-700" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="font-medium text-slate-700">{patient.name}</div>
                                                                <div className="text-sm text-slate-500">{patient.phone || t('common.noPhone')}</div>
                                                            </div>
                                                            {formData.patientId === patient.id && <CheckCircleIcon />}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="px-4 py-3 text-slate-500 text-center">
                                                    <UserIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                                    {t('addAppointmentModal.noPatientsFound')}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <input type="hidden" name="patientId" value={formData.patientId} />
                                </div>

                                {/* Dentist Selection */}
                                <div>
                                    <label htmlFor="dentistId" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                        <StethoscopeIcon className="inline w-4 h-4 mr-1" />
                                        {t('addAppointmentModal.dentist')} <span className="text-red-500">*</span>
                                    </label>

                                    <select
                                        name="dentistId"
                                        id="dentistId"
                                        value={formData.dentistId}
                                        onChange={handleChange}
                                        className={`w-full py-3 px-4 border-2 rounded-xl shadow-sm focus:ring-4 focus:ring-purple-500/50 focus:outline-none transition-all duration-300 hover:shadow-md ${
                                            validationErrors.dentistId ? 'border-red-500 bg-red-900/30 dark:bg-red-900/40 focus:border-red-500 focus:ring-red-500/50' : 'border-purple-400 dark:border-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:border-purple-500 dark:hover:border-purple-600'
                                        }`}
                                        aria-describedby={validationErrors.dentistId ? "dentist-error" : undefined}
                                        aria-invalid={!!validationErrors.dentistId}
                                    >
                                        <option value="">{t('addAppointmentModal.selectDentist')}</option>
                                        {clinicData.dentists.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                    {validationErrors.dentistId && (
                                        <p id="dentist-error" className="mt-2 text-sm text-red-700 flex items-center gap-2 bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-lg border border-red-300 dark:border-red-700 animate-in slide-in-from-top-1 duration-200">
                                            <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
                                            <span>{validationErrors.dentistId}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Date & Time Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-600">
                                <ClockIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">{t('addAppointmentModal.dateTime')}</h3>
                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="startTime" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                        <CalendarIcon className="inline w-4 h-4 mr-1" />
                                        {t('addAppointmentModal.startTime')} <span className="text-red-500">*</span>
                                    </label>

                                    <input
                                        type="datetime-local"
                                        id="startTime"
                                        name="startTime"
                                        value={formData.startTime}
                                        onChange={handleChange}
                                        className={`w-full py-3 px-4 border rounded-lg focus:ring-2 focus:ring-purple-500/40 transition-all ${
                                            validationErrors.startTime ? 'border-red-500 bg-red-900/30 dark:bg-red-900/40' : 'border-purple-400 dark:border-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                                        }`}
                                        aria-describedby={validationErrors.startTime ? "startTime-error" : undefined}
                                        aria-invalid={!!validationErrors.startTime}
                                    />
                                    {validationErrors.startTime && (
                                        <p id="startTime-error" className="mt-2 text-sm text-red-700 flex items-center gap-2 bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-lg border border-red-300 dark:border-red-700 animate-in slide-in-from-top-1 duration-200">
                                            <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
                                            <span>{validationErrors.startTime}</span>
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="endTime" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                                        <ClockIcon className="inline w-4 h-4 mr-1" />
                                        {t('addAppointmentModal.endTime')} <span className="text-red-500">*</span>
                                    </label>

                                    <input
                                        type="datetime-local"
                                        id="endTime"
                                        name="endTime"
                                        value={formData.endTime}
                                        onChange={handleChange}
                                        className={`w-full py-3 px-4 border rounded-lg focus:ring-2 focus:ring-purple-500/40 transition-all ${
                                            validationErrors.endTime ? 'border-red-500 bg-red-900/30 dark:bg-red-900/40' : 'border-purple-400 dark:border-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                                        }`}
                                        aria-describedby={validationErrors.endTime ? "endTime-error" : undefined}
                                        aria-invalid={!!validationErrors.endTime}
                                    />
                                    {validationErrors.endTime && (
                                        <p id="endTime-error" className="mt-2 text-sm text-red-700 flex items-center gap-2 bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-lg border border-red-300 dark:border-red-700 animate-in slide-in-from-top-1 duration-200">
                                            <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
                                            <span>{validationErrors.endTime}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Duration Display and Presets */}
                            <div className="bg-gradient-to-br from-purple-100 to-amber-100 dark:from-slate-800 dark:to-slate-700 p-4 rounded-lg border border-purple-200 dark:border-slate-600">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <ClockIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{t('addAppointmentModal.duration')}</span>
                                        <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                            {durationMinutes} {t('scheduler.minutes')}
                                        </span>
                                    </div>
                                    <span className="text-xs text-purple-600 dark:text-purple-400">{t('addAppointmentModal.quickSet')}</span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {[30, 60, 90, 120].map(minutes => (
                                        <button
                                            key={minutes}
                                            type="button"
                                            onClick={() => setDuration(minutes)}
                                            className="px-3 py-1 bg-white dark:bg-slate-700 border border-purple-300 dark:border-purple-500 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-200 text-sm text-purple-800 dark:text-purple-200"
                                        >
                                            {minutes}m
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-600">
                                <FileTextIcon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">{t('addAppointmentModal.details')}</h3>
                            </div>


                            <div>
                                <label htmlFor="reason" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <FileTextIcon className="inline w-4 h-4 mr-1" />
                                    {t('addAppointmentModal.reasonForVisit')} <span className="text-red-500">*</span>
                                </label>

                                <textarea
                                    name="reason"
                                    id="reason"
                                    value={formData.reason}
                                    onChange={handleChange}
                                    className={`w-full py-3 px-4 border rounded-lg focus:ring-2 focus:ring-purple-500/40 transition-all resize-none ${
                                        validationErrors.reason ? 'border-red-500 bg-red-900/30 dark:bg-red-900/40' : 'border-purple-400 dark:border-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                                    }`}
                                    placeholder={t('addAppointmentModal.reasonPlaceholder')}
                                    rows={3}
                                    aria-describedby={validationErrors.reason ? "reason-error" : undefined}
                                    aria-invalid={!!validationErrors.reason}
                                />
                                {validationErrors.reason && (
                                    <p id="reason-error" className="mt-1 text-sm text-red-700 flex items-center gap-1">
                                        <ExclamationCircleIcon className="w-5 h-5" />
                                        {validationErrors.reason}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        <CheckCircleIcon className="inline w-4 h-4 mr-1" />
                                        {t('scheduler.status')}
                                    </label>

                                    <select
                                        name="status"
                                        id="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full py-3 px-4 border border-purple-400 dark:border-purple-500 rounded-lg focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                                    >
                                        {Object.values(AppointmentStatus).map(s => (
                                            <option key={s} value={s}>{t(`appointmentStatus.${s}`)}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="reminderTime" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        <BellIcon className="inline w-4 h-4 mr-1" />
                                        {t('reminders.reminderTime')}
                                    </label>

                                    <select
                                        name="reminderTime"
                                        id="reminderTime"
                                        value={formData.reminderTime}
                                        onChange={handleChange}
                                        className="w-full py-3 px-4 border border-purple-400 dark:border-purple-500 rounded-lg focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                                    >
                                        <option value="none">{t('reminders.none')}</option>
                                        <option value="1_hour_before">{t('reminders.1_hour_before')}</option>
                                        <option value="2_hours_before">{t('reminders.2_hours_before')}</option>
                                        <option value="1_day_before">{t('reminders.1_day_before')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer with Actions - Gold + Purple Theme */}
                    <footer className="px-6 py-4 bg-gradient-to-r from-purple-100 to-amber-100 dark:from-slate-800 dark:to-slate-700 border-t border-purple-300 dark:border-slate-600 flex justify-between items-center">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            {hasUnsavedChanges && <span className="text-amber-600 dark:text-amber-400">• {t('addAppointmentModal.unsavedChanges')}</span>}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 bg-white dark:bg-slate-700 border border-purple-300 dark:border-slate-600 rounded-lg hover:bg-purple-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 hover:text-purple-800 dark:hover:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200"
                                disabled={isSubmitting}
                            >
                                {t('common.cancel')}
                            </button>

                            <button
                                type="submit"
                                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <LoadingSpinner />
                                        {t('addAppointmentModal.saving')}
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="w-4 h-4" />
                                        {appointmentToEdit ? t('common.save') : t('addAppointmentModal.schedule')}
                                    </>
                                )}
                            </button>
                        </div>
                    </footer>
                </form>
            </div>
        </div>
    );
};

const AppointmentDetailsModal: React.FC<{
    appointment: Appointment;
    patient?: Patient;
    dentist?: Dentist;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ appointment, patient, dentist, onClose, onEdit, onDelete }) => {
    const { t, locale } = useI18n();
    const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'full' });
    const timeFormatter = new Intl.DateTimeFormat(locale, { timeStyle: 'short' });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDelete = () => {
        onDelete();
        onClose();
    };

    const durationMinutes = Math.round((appointment.endTime.getTime() - appointment.startTime.getTime()) / 60000);

    const getStatusColor = (status: AppointmentStatus) => {
        switch (status) {
            case AppointmentStatus.SCHEDULED: return 'bg-amber-100 text-amber-800 border-amber-200';
            case AppointmentStatus.CONFIRMED: return 'bg-blue-100 text-blue-800 border-blue-200';
            case AppointmentStatus.COMPLETED: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case AppointmentStatus.CANCELLED: return 'bg-rose-100 text-rose-800 border-rose-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const getStatusIcon = (status: AppointmentStatus) => {
        switch (status) {
            case AppointmentStatus.SCHEDULED: return '⏳';
            case AppointmentStatus.CONFIRMED: return '✓';
            case AppointmentStatus.COMPLETED: return '✅';
            case AppointmentStatus.CANCELLED: return '❌';
            default: return '•';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">

                {/* Gradient Header */}
                <header className="p-5 border-b border-purple-200 flex justify-between items-center bg-gradient-to-r from-purple-50 via-purple-50 to-amber-50">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-xl text-white shadow-md">
                            <CalendarIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">{t('scheduler.appointmentDetails')}</h2>
                            <p className="text-xs text-slate-500 mt-0.5">{dateFormatter.format(appointment.startTime)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 text-slate-600 hover:text-purple-700 transition-all focus:outline-none focus:ring-2 focus:ring-purple-300" aria-label={t('common.closeForm')}>
                        <CloseIcon />
                    </button>
                </header>

                <main className="p-5 space-y-4 overflow-y-auto flex-1">

                    {/* Patient Info Card */}
                    <div className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-800 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-purple-100 dark:border-purple-800">
                            <UserIcon className="h-4 w-4 text-purple-600" />
                            <h3 className="text-sm font-semibold text-purple-700">{t('scheduler.patientInfo')}</h3>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md">
                                {patient?.name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-lg">{patient?.name || t('common.unknownPatient')}</span>
                                    {/* Patient Number Badge */}
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">
                                        #{patient?.id?.slice(-6) || 'N/A'}
                                    </span>
                                </div>
                                {patient?.phone && (
                                    <a
                                        href={`tel:${patient.phone.replace(/[^0-9+]/g, '')}`}
                                        className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 mt-1 hover:text-purple-600 transition-colors"
                                    >
                                        <PhoneIcon className="h-3.5 w-3.5" />
                                        <span>{patient.phone}</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Appointment Info Card */}
                    <div className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-800 rounded-xl p-4 border border-amber-100 dark:border-amber-800">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-100 dark:border-amber-800">
                            <ClockIcon className="h-4 w-4 text-amber-600" />
                            <h3 className="text-sm font-semibold text-amber-700">{t('scheduler.appointmentInfo')}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">{t('scheduler.dateTime')}</p>
                                <p className="font-semibold text-slate-700 dark:text-slate-300">{timeFormatter.format(appointment.startTime)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">{t('scheduler.duration')}</p>
                                <p className="font-semibold text-slate-700 dark:text-slate-300">{durationMinutes} {t('scheduler.minutes')}</p>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-amber-100 dark:border-amber-800">
                            <p className="text-xs text-slate-500 mb-1">{t('addAppointmentModal.reasonForVisit')}</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 p-2 rounded-lg border border-amber-200 dark:border-slate-600">
                                {appointment.reason}
                            </p>
                        </div>
                    </div>

                    {/* Dentist & Status Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Dentist Info */}
                        <div className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <StethoscopeIcon className="h-4 w-4 text-purple-600" />
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('addAppointmentModal.dentist')}</h3>
                            </div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{dentist?.name || t('common.unknownDentist')}</p>
                            {dentist?.specialty && (
                                <p className="text-xs text-slate-500 mt-1">{dentist.specialty}</p>
                            )}
                        </div>

                        {/* Status Badge */}
                        <div className="bg-white dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircleIcon className="h-4 w-4 text-purple-600" />
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('scheduler.status')}</h3>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(appointment.status)}`}>
                                <span>{getStatusIcon(appointment.status)}</span>
                                {t(`appointmentStatus.${appointment.status}`)}
                            </span>
                        </div>
                    </div>

                    {/* Reminder Info */}
                    {appointment.reminderTime !== 'none' && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                            <BellIcon className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-700 dark:text-blue-300">
                                {t('reminders.reminderTime')}: {t(`reminders.${appointment.reminderTime}`)}
                                {appointment.reminderSent && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t('common.saved')}</span>}
                            </span>
                        </div>
                    )}
                </main>

                {/* Footer Actions */}
                <footer className="px-5 py-4 bg-gradient-to-r from-purple-50 via-purple-50 to-amber-50 border-t border-purple-200 flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 hover:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all duration-200 flex items-center gap-2 shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {t('common.delete')}
                    </button>
                    <div className="flex gap-3">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all duration-200 shadow-sm"
                        >
                            {t('common.close')}
                        </button>
                        <button 
                            type="button" 
                            onClick={onEdit} 
                            className="px-5 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all duration-200 flex items-center gap-2 shadow-md"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            {t('common.edit')}
                        </button>
                    </div>
                </footer>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <header className="p-5 border-b border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100">
                            <div className="flex items-center gap-3">
                                <div className="bg-rose-100 p-2 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <h2 className="text-lg font-bold text-rose-700">{t('scheduler.confirmDeleteTitle')}</h2>
                            </div>
                        </header>
                        <main className="p-5">
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{t('scheduler.deleteConfirmMessage')}</p>
                            <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-100 dark:border-rose-800">
                                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mb-1">{t('addAppointmentModal.patient')}:</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{patient?.name || t('common.unknownPatient')}</p>
                                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-2 mb-1">{t('scheduler.dateTime')}:</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{dateFormatter.format(appointment.startTime)} {timeFormatter.format(appointment.startTime)}</p>
                            </div>
                        </main>
                        <footer className="px-5 py-4 flex justify-end gap-3 bg-gradient-to-r from-rose-50 to-rose-100 border-t border-rose-200">
                            <button 
                                type="button" 
                                onClick={() => setShowDeleteConfirm(false)} 
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all duration-200"
                            >
                                {t('common.cancel')}
                            </button>
                            <button 
                                type="button" 
                                onClick={handleDelete} 
                                className="px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg hover:from-rose-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all duration-200 flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                {t('common.delete')}
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}


const MobileAppointmentList: React.FC<{
    dailyAppointments: Appointment[];
    patients: Patient[];
    dentists: Dentist[];
    onAppointmentClick: (apt: Appointment) => void;
    onAddClick: () => void;
    onSendReminder: (apt: Appointment) => void;
    onStatusClick: (apt: Appointment) => void;
}> = ({ dailyAppointments, patients, dentists, onAppointmentClick, onAddClick, onSendReminder, onStatusClick }) => {
    const { t, locale } = useI18n();
    const timeFormatter = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: true });
    const [searchTerm, setSearchTerm] = useState('');

    // Filter appointments based on search term
    const filteredAppointments = useMemo(() => {
        if (!searchTerm.trim()) return dailyAppointments;
        const term = searchTerm.toLowerCase().trim();
        return dailyAppointments.filter(apt => {
            const patient = patients.find(p => p.id === apt.patientId);
            const dentist = dentists.find(d => d.id === apt.dentistId);
            const matchesPatient = patient?.name.toLowerCase().includes(term);
            const matchesReason = apt.reason.toLowerCase().includes(term);
            const matchesDentist = dentist?.name.toLowerCase().includes(term);
            return matchesPatient || matchesReason || matchesDentist;
        });
    }, [dailyAppointments, patients, dentists, searchTerm]);

    return (
        <div className="p-4 space-y-4">
            <button onClick={onAddClick} className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-md hover:shadow-lg transition-all duration-200">
                {t('scheduler.newAppointment')}
            </button>

            {/* Search input for mobile */}
            <div className="relative">
                <SearchIcon />
                <input
                    type="text"
                    placeholder="ابحث في المواعيد..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-purple-200 dark:border-purple-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-slate-800 dark:text-slate-200"
                />
            </div>

            {filteredAppointments.length === 0 ? (
                <p className="text-center text-slate-500">{t('scheduler.noAppointments')}</p>
            ) : (
                filteredAppointments.map(apt => {
                    const patient = patients.find(p => p.id === apt.patientId);
                    const dentist = dentists.find(d => d.id === apt.dentistId);
                    return (
                        <div
                            key={apt.id}
                            className={`p-3 rounded-lg shadow-md cursor-pointer transition-all hover:shadow-lg ${dentist?.color || 'bg-slate-500'} text-white`}
                            onClick={() => onAppointmentClick(apt)}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-1 flex-wrap">
                                    <span className="font-semibold text-sm truncate">{patient?.name}</span>
                                    <span className="bg-white bg-opacity-20 px-1 py-0.5 rounded text-xs font-medium">{apt.reason}</span>
                                    <span className="bg-yellow-200 text-yellow-800 px-1 py-0.5 rounded text-xs font-medium">{Math.round((apt.endTime.getTime() - apt.startTime.getTime()) / 60000)}m</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded text-xs font-medium">{dentist?.name}</span>
                                    <button
                                        className={`px-2 py-0.5 rounded text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 ${apt.status === 'SCHEDULED' ? 'bg-green-200 text-green-800' : apt.status === 'COMPLETED' ? 'bg-blue-200 text-blue-800' : apt.status === 'CANCELLED' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onStatusClick(apt);
                                        }}
                                        title={t('scheduler.clickToChangeStatus')}
                                    >
                                        {apt.status === 'SCHEDULED' ? '🟢' : apt.status === 'COMPLETED' ? '✅' : apt.status === 'CANCELLED' ? '❌' : '⏳'}
                                        {t(`appointmentStatus.${apt.status}`)}
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-end mb-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSendReminder(apt);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                    title="إرسال تذكير واتساب"
                                >
                                    <WhatsAppIcon className="h-5 w-5" />
                                    إرسال رسالة تذكير
                                </button>
                            </div>
                            <div className="text-right text-xs opacity-75">
                                {timeFormatter.format(apt.startTime)} - {timeFormatter.format(apt.endTime)}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

const MobileTimeSelectorModal: React.FC<{
    onClose: () => void;
    onSelectTime: (hour: number, minute: number) => void;
    selectedDate: Date;
    dailyAppointments: Appointment[];
    patients: Patient[];
    dentists: Dentist[];
    workStartHour: number;
    workEndHour: number;
}> = ({ onClose, onSelectTime, selectedDate, dailyAppointments, patients, dentists, workStartHour, workEndHour }) => {
    const { t, locale } = useI18n();
    const timeFormatter = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: true });

    // Generate 30-minute time slots
    const timeSlots = [];
    for (let hour = workStartHour; hour < workEndHour; hour++) {
        timeSlots.push({ hour, minute: 0 }); // 00 minutes
        timeSlots.push({ hour, minute: 30 }); // 30 minutes
    }

    // Function to check if a time slot is available for a typical appointment duration
    const isSlotAvailable = (slotHour: number, slotMinute: number, durationMinutes: number = 60) => {
        const slotStart = new Date(selectedDate);
        slotStart.setHours(slotHour, slotMinute, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

        // Check if any existing appointment overlaps with this slot
        for (const apt of dailyAppointments) {
            const aptStart = apt.startTime;
            const aptEnd = apt.endTime;
            
            // Check for overlap
            if (slotStart < aptEnd && slotEnd > aptStart) {
                return false;
            }
        }

        return true;
    };

    // Function to get overlapping appointments for a slot
    const getOverlappingAppointments = (slotHour: number, slotMinute: number) => {
        const slotStart = new Date(selectedDate);
        slotStart.setHours(slotHour, slotMinute, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60000); // 1 hour duration

        return dailyAppointments.filter(apt => {
            const aptStart = apt.startTime;
            const aptEnd = apt.endTime;
            return slotStart < aptEnd && slotEnd > aptStart;
        });
    };

    // Status icons
    const AvailableIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
    const OccupiedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
    const BlockedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
                {/* Gradient Header */}
                <header className="p-4 border-b border-purple-200 flex justify-between items-center bg-gradient-to-r from-purple-50 to-amber-50">
                    <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">{t('scheduler.selectTime')}</h2>
                        <p className="text-sm text-slate-500 mt-1">{t('scheduler.selectTimeDescription')}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300" aria-label={t('common.close')}>
                        <CloseIcon />
                    </button>
                </header>
                <div className="p-4 overflow-y-auto space-y-2">
                    {timeSlots.map(slot => {
                        const slotTime = new Date(0, 0, 0, slot.hour, slot.minute);
                        const isAvailable = isSlotAvailable(slot.hour, slot.minute);
                        
                        // Find appointments that start at this exact time
                        const appointmentsAtThisTime = dailyAppointments.filter(apt => {
                            return apt.startTime.getHours() === slot.hour && apt.startTime.getMinutes() === slot.minute;
                        });
                        
                        // Get overlapping appointments for blocked slots
                        const overlappingAppointments = !isAvailable && appointmentsAtThisTime.length === 0
                            ? getOverlappingAppointments(slot.hour, slot.minute)
                            : [];
                        
                        return (
                            <div key={`${slot.hour}-${slot.minute}`}                            className={`border-2 rounded-lg p-3 transition-all ${isAvailable ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-700">{timeFormatter.format(slotTime)}</span>
                                        {isAvailable ? <AvailableIcon /> : appointmentsAtThisTime.length > 0 ? <OccupiedIcon /> : <BlockedIcon />}
                                    </div>
                                    {isAvailable ? (
                                        <button
                                            onClick={() => onSelectTime(slot.hour, slot.minute)}
                                            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-lg hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm flex items-center gap-1 transition-all duration-200"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                            {t('scheduler.addAppointment')}
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <span className="text-slate-500 text-sm font-medium">{t('scheduler.occupied')}</span>
                                            <span className="text-red-500 text-sm font-medium">AT</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </div>
                                    )}
                                </div>
                                {appointmentsAtThisTime.length > 0 && (
                                    <div className="space-y-1">
                                        {appointmentsAtThisTime.map(apt => {
                                            const patient = patients.find(p => p.id === apt.patientId);
                                            const dentist = dentists.find(d => d.id === apt.dentistId);
                                            return (
                                                <div key={apt.id} className={`p-2 rounded text-white text-sm ${dentist?.color || 'bg-slate-500'} flex items-center gap-2`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                                    <div className="flex-1">
                                                        <p className="font-semibold truncate">{patient?.name}</p>
                                                        <p className="truncate text-xs">{apt.reason}</p>
                                                        <p className="text-xs opacity-75 mt-0.5">
                                                            {timeFormatter.format(apt.startTime)} - {timeFormatter.format(apt.endTime)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {overlappingAppointments.length > 0 && (
                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                        <div className="flex items-center gap-1 text-yellow-700 mb-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.493-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                                            <span className="font-medium">{t('scheduler.slotBlockedByOtherAppointment')}</span>
                                        </div>
                                        {overlappingAppointments.map(apt => {
                                            const patient = patients.find(p => p.id === apt.patientId);
                                            const dentist = dentists.find(d => d.id === apt.dentistId);
                                            return (
                                                <div key={apt.id} className={`p-1.5 rounded text-xs ${dentist?.color || 'bg-slate-400'} text-white mt-1 flex items-center gap-1`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                                    <div>
                                                        <p className="font-semibold">{patient?.name}</p>
                                                        <p className="truncate">{apt.reason} ({timeFormatter.format(apt.startTime)} - {timeFormatter.format(apt.endTime)})</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                </div>
            </div>
        );
    };

const AppointmentStatsCard: React.FC<{
    appointmentStats: {
        total: number;
        scheduled: number;
        completed: number;
        cancelled: number;
        totalDuration: number;
        avgDuration: number;
    };
    notes: string;
    setNotes: (notes: string) => void;
}> = ({ appointmentStats, notes, setNotes }) => {
    const { t } = useI18n();
    
    // Calculate completion rate
    const completionRate = appointmentStats.total > 0
        ? Math.round((appointmentStats.completed / appointmentStats.total) * 100)
        : 0;
    
    // Calculate cancellation rate
    const cancellationRate = appointmentStats.total > 0
        ? Math.round((appointmentStats.cancelled / appointmentStats.total) * 100)
        : 0;
    
    return (
        <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-purple-200 dark:border-purple-700">
            <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent mb-4">{t('scheduler.statsTitle')}</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Appointment Counts */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-xl border border-purple-200">
                    <div className="text-2xl font-bold text-purple-700">{appointmentStats.total}</div>
                    <div className="text-sm text-slate-600 mt-1">{t('scheduler.totalAppointments')}</div>
                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> {appointmentStats.scheduled}</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> {appointmentStats.completed}</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> {appointmentStats.cancelled}</span>
                    </div>
                </div>

                {/* Duration Stats */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 rounded-xl border border-amber-200">
                    <div className="text-2xl font-bold text-amber-700">{appointmentStats.totalDuration}</div>
                    <div className="text-sm text-slate-600 mt-1">{t('scheduler.totalDuration')}</div>
                    <div className="text-sm text-slate-500 mt-1">
                        ⏱️ {t('scheduler.averageDuration')}: {appointmentStats.avgDuration} {t('scheduler.minutes')}
                    </div>
                </div>

                {/* Rates */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 rounded-xl border border-emerald-200">
                    <div className="text-2xl font-bold text-emerald-700">{completionRate}%</div>
                    <div className="text-sm text-slate-600 mt-1">{t('reports.appointmentOverview.completionRate')}</div>
                    <div className="text-sm text-slate-500 mt-1">
                        ❌ {cancellationRate}% {t('scheduler.cancelledAppointments')}
                    </div>
                </div>
            </div>

            {/* Notes Section */}
            <div className="mt-4">
                <label htmlFor="notes" className="block text-sm font-medium text-purple-700 mb-2">{t('scheduler.notes')}</label>
                <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 border border-purple-200 dark:border-purple-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-slate-800 dark:text-slate-200"
                    rows={4}
                    placeholder={t('scheduler.noNotes')}
                />
                <div className="text-xs text-slate-400 mt-1">
                    {t('common.saved')} {new Date().toLocaleDateString()} - {t('dashboard.todaysSchedule')}
                </div>
            </div>
        </div>
    );
};

const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const Scheduler: React.FC<{ clinicData: ClinicData }> = ({ clinicData }) => {
    const { appointments, patients, dentists, addAppointment, updateAppointment, deleteAppointment } = clinicData;
    const { t, locale } = useI18n();
    const { addNotification } = useNotification();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [modalState, setModalState] = useState<{ type: 'add' | 'details' | 'edit' | 'time_selector' | null; data?: any }>({ type: null });
    const [workStartHour, setWorkStartHour] = useState(() => parseInt(localStorage.getItem('workStartHour') || '14', 10));
    const [workEndHour, setWorkEndHour] = useState(() => parseInt(localStorage.getItem('workEndHour') || '24', 10));
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [notes, setNotes] = useState(() => {
        const dateStr = toLocalDateString(selectedDate);
        return localStorage.getItem(`scheduler-notes-${dateStr}`) || '';
    });

    // Filter states
    const [dentistFilter, setDentistFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [timeRangeFilter, setTimeRangeFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const dateStr = toLocalDateString(selectedDate);
        localStorage.setItem(`scheduler-notes-${dateStr}`, notes);
    }, [selectedDate, notes]);

    const saveWorkHours = () => {
        localStorage.setItem('workStartHour', workStartHour.toString());
        localStorage.setItem('workEndHour', workEndHour.toString());
        addNotification(t('scheduler.saveSettings') + ' ' + t('common.saved'), NotificationType.SUCCESS);
    };

    const timeFormatter = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: true });
    
    const appointmentsByDay = useMemo(() => {
        const map = new Map<string, Set<string>>();
        appointments.forEach(apt => {
            const dateStr = toLocalDateString(apt.startTime);
            const dentist = dentists.find(d => d.id === apt.dentistId);
            if (dentist) {
                if (!map.has(dateStr)) map.set(dateStr, new Set());
                map.get(dateStr)!.add(dentist.color);
            }
        });
        return map;
    }, [appointments, dentists]);
    const { daysInMonth, firstDayOfMonth } = useMemo(() => {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        return {
            daysInMonth: new Date(year, month + 1, 0).getDate(),
            firstDayOfMonth: new Date(year, month, 1).getDay(),
        };
    }, [calendarDate]);

    const handlePrevMonth = () => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const handleNextMonth = () => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

    const dailyAppointments = useMemo(() => {
        return appointments
            .filter(apt => isSameDay(apt.startTime, selectedDate))
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }, [appointments, selectedDate]);

    // Filtered appointments based on user selections
    const filteredAppointments = useMemo(() => {
        return dailyAppointments.filter(apt => {
            const patient = patients.find(p => p.id === apt.patientId);
            const dentist = dentists.find(d => d.id === apt.dentistId);

            // Dentist filter
            if (dentistFilter !== 'all' && apt.dentistId !== dentistFilter) {
                return false;
            }

            // Status filter
            if (statusFilter !== 'all' && apt.status !== statusFilter) {
                return false;
            }

            // Time range filter
            if (timeRangeFilter !== 'all') {
                const hour = apt.startTime.getHours();
                switch (timeRangeFilter) {
                    case 'morning':
                        if (hour < 6 || hour >= 12) return false;
                        break;
                    case 'afternoon':
                        if (hour < 12 || hour >= 18) return false;
                        break;
                    case 'evening':
                        if (hour < 18) return false;
                        break;
                }
            }

            // Search filter
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase().trim();
                const matchesPatient = patient?.name.toLowerCase().includes(term);
                const matchesReason = apt.reason.toLowerCase().includes(term);
                const matchesDentist = dentist?.name.toLowerCase().includes(term);
                if (!matchesPatient && !matchesReason && !matchesDentist) {
                    return false;
                }
            }

            return true;
        });
    }, [dailyAppointments, patients, dentists, dentistFilter, statusFilter, timeRangeFilter, searchTerm]);
    
        const appointmentStats = useMemo(() => {
            const total = dailyAppointments.length;
            const scheduled = dailyAppointments.filter(a => a.status === 'SCHEDULED').length;
            const completed = dailyAppointments.filter(a => a.status === 'COMPLETED').length;
            const cancelled = dailyAppointments.filter(a => a.status === 'CANCELLED').length;
            const totalDuration = dailyAppointments.reduce((sum, a) => sum + (a.endTime.getTime() - a.startTime.getTime()) / 60000, 0);
            const avgDuration = total > 0 ? totalDuration / total : 0;
            return { total, scheduled, completed, cancelled, totalDuration: Math.round(totalDuration), avgDuration: Math.round(avgDuration) };
        }, [dailyAppointments]);
    
        const timeSlots = useMemo(() => {
        if (workEndHour <= workStartHour) return [];
        return Array.from({ length: workEndHour - workStartHour }, (_, i) => workStartHour + i);
    }, [workStartHour, workEndHour]);

    const handleSaveAppointment = (appointmentData: Omit<Appointment, 'id' | 'reminderSent' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        console.log('DEBUG: handleSaveAppointment called with data:', appointmentData);
        if (modalState.type === 'edit') {
            console.log('DEBUG: Editing existing appointment');
            updateAppointment({ ...modalState.data, ...appointmentData });
        } else {
            console.log('DEBUG: Adding new appointment');
            addAppointment(appointmentData);
        }
        setModalState({ type: null });
    };

    const handleDeleteAppointment = (appointmentId: string) => {
        deleteAppointment(appointmentId);
        setModalState({ type: null });
    };

    const handleSlotClick = (hour: number) => {
        const newDate = new Date(selectedDate);
        newDate.setHours(hour, 0, 0, 0);
        setModalState({ type: 'add', data: { initialDateTime: newDate } });
    };

    const handleStatusClick = (appointment: Appointment) => {
        const statusOrder = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];
        const currentIndex = statusOrder.indexOf(appointment.status);
        const nextIndex = (currentIndex + 1) % statusOrder.length;
        const newStatus = statusOrder[nextIndex] as AppointmentStatus;

        updateAppointment({ ...appointment, status: newStatus });
        addNotification(t('scheduler.statusUpdated'), NotificationType.SUCCESS);
    };

    const handleSendReminder = async (appointment: Appointment, method: 'whatsapp' | 'email' | 'sms' = 'whatsapp') => {
        const patient = patients.find(p => p.id === appointment.patientId);
        const dentist = dentists.find(d => d.id === appointment.dentistId);
        if (!patient) return;

        const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });
        const timeFormatter = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });

        const message = clinicData.reminderMessageTemplate
            .replace(/\{patientName\}/g, patient.name)
            .replace(/\{doctorName\}/g, dentist?.name || '')
            .replace(/\{clinicName\}/g, clinicData.clinicInfo.name || 'عيادة كيوراسوف')
            .replace(/\{appointmentDate\}/g, dateFormatter.format(appointment.startTime))
            .replace(/\{appointmentTime\}/g, timeFormatter.format(appointment.startTime))
            .replace(/\{clinicAddress\}/g, clinicData.clinicInfo.address || '')
            .replace(/\{clinicPhone\}/g, clinicData.clinicInfo.phone || '');

        try {
            if (method === 'whatsapp') {
                let phoneNumber = patient.phone.replace(/[^0-9]/g, '');
                if (phoneNumber.startsWith('0')) {
                    phoneNumber = phoneNumber.substring(1);
                }
                const internationalPhoneNumber = `20${phoneNumber}`;
                const url = `https://wa.me/${internationalPhoneNumber}?text=${encodeURIComponent(message)}`;
                window.open(url, '_blank');
            } else if (method === 'email' && patient.email) {
                // SendGrid integration (API key would be set in environment variables)
                sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
                await sgMail.send({
                    to: patient.email,
                    from: 'noreply@curasof.com',
                    subject: `Appointment Reminder - ${clinicData.clinicInfo.name}`,
                    text: message,
                    html: `<p>${message.replace(/\n/g, '<br>')}</p>`
                });
            } else if (method === 'sms' && patient.phone) {
                // SMS functionality disabled - Twilio removed
                console.log('SMS functionality is currently disabled');
                // Fallback to WhatsApp
                handleSendReminder(appointment, 'whatsapp');
            }

            // Update appointment to mark reminder as sent
            updateAppointment({ ...appointment, reminderSent: true });
            addNotification(t('reminders.reminderSentSuccess'), NotificationType.SUCCESS);
        } catch (error) {
            console.error('Failed to send reminder:', error);
            // Fallback to WhatsApp if other methods fail
            if (method !== 'whatsapp') {
                handleSendReminder(appointment, 'whatsapp');
            }
        }
    };

    const handleSendWhatsApp = (appointment: Appointment) => {
        handleSendReminder(appointment, 'whatsapp');
    };
    
    const dateHeaderFormatter = new Intl.DateTimeFormat(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const monthYearFormatter = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
    const dayOfWeekShortFormatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Modern Header with Gold + Purple Theme */}
                 <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-6 relative overflow-hidden mb-6">
                    {/* Decorative gradient bar at top */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-purple-500 to-purple-700"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-gradient-to-br from-purple-100 to-amber-100 p-2 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 3v4" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v4" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 11h16" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">{dateHeaderFormatter.format(selectedDate)}</h2>
                                        <p className="text-sm text-slate-500 mt-0.5">{t('scheduler.pageDescription')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600 mt-2">
                                    <div className="flex items-center gap-2">
                                        <label htmlFor="start-hour" className="font-medium">{t('scheduler.showFrom')}:</label>
                                        <select id="start-hour" value={workStartHour} onChange={(e) => setWorkStartHour(parseInt(e.target.value, 10))} className="p-1 border border-purple-200 rounded-md bg-white focus:ring-purple-500 focus:border-purple-500">
                                            {Array.from({length: 24}).map((_, i) => <option key={i} value={i}>{timeFormatter.format(new Date(0,0,0,i))}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label htmlFor="end-hour" className="font-medium">{t('scheduler.to')}:</label>
                                        <select id="end-hour" value={workEndHour} onChange={(e) => setWorkEndHour(parseInt(e.target.value, 10))} className="p-1 border border-purple-200 rounded-md bg-white focus:ring-purple-500 focus:border-purple-500">
                                            {Array.from({length: 25}).map((_, i) => i > 0 && <option key={i} value={i}>{timeFormatter.format(new Date(0,0,0,i))}</option>)}
                                        </select>
                                    </div>
                                    <button onClick={saveWorkHours} className="px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all duration-200">{t('scheduler.saveSettings')}</button>
                                </div>
                            </div>
                            {!isMobile && (
                                <div className="flex gap-2 self-start sm:self-center">
                                    <button onClick={() => window.print()} className="bg-gradient-to-r from-amber-400 to-amber-500 text-white px-4 py-2 rounded-lg hover:from-amber-500 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        طباعة الجدول
                                    </button>
                                    <button onClick={() => setModalState({ type: 'add', data: { initialDateTime: selectedDate } })} className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-md hover:shadow-lg transition-all duration-200">{t('scheduler.newAppointment')}</button>
                                </div>
                            )}
                        </div>

                        {/* Stats Cards - Gold + Purple Theme */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-3 sm:p-4 rounded-xl shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs sm:text-sm text-purple-100 font-medium">{t('scheduler.totalAppointments')}</p>
                                        <p className="text-2xl sm:text-3xl font-bold">{appointmentStats.total}</p>
                                    </div>
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-amber-400 to-amber-500 text-white p-3 sm:p-4 rounded-xl shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs sm:text-sm text-amber-100 font-medium">{t('scheduler.scheduledAppointments')}</p>
                                        <p className="text-2xl sm:text-3xl font-bold">{appointmentStats.scheduled}</p>
                                    </div>
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-3 sm:p-4 rounded-xl shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs sm:text-sm text-emerald-100 font-medium">{t('scheduler.completedAppointments')}</p>
                                        <p className="text-2xl sm:text-3xl font-bold">{appointmentStats.completed}</p>
                                    </div>
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white p-3 sm:p-4 rounded-xl shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs sm:text-sm text-rose-100 font-medium">{t('scheduler.cancelledAppointments')}</p>
                                        <p className="text-2xl sm:text-3xl font-bold">{appointmentStats.cancelled}</p>
                                    </div>
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            {/* Quick Filters and Search Bar - Gold + Purple Theme */}
            {!isMobile && (
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-purple-200 dark:border-purple-700 shadow-sm mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label htmlFor="dentist-filter" className="text-sm font-medium text-purple-700">طبيب:</label>
                            <select
                                id="dentist-filter"
                                value={dentistFilter}
                                onChange={(e) => setDentistFilter(e.target.value)}
                                className="px-3 py-2 border border-purple-200 dark:border-purple-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-purple-500 focus:border-purple-500 focus:ring-2 text-sm transition-all duration-200 text-slate-800 dark:text-slate-200"
                            >
                                <option value="all">جميع الأطباء</option>
                                {dentists.map(dentist => (
                                    <option key={dentist.id} value={dentist.id}>{dentist.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label htmlFor="status-filter" className="text-sm font-medium text-purple-700">الحالة:</label>
                            <select
                                id="status-filter"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-purple-200 dark:border-purple-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-purple-500 focus:border-purple-500 focus:ring-2 text-sm transition-all duration-200 text-slate-800 dark:text-slate-200"
                            >
                                <option value="all">جميع الحالات</option>
                                <option value="SCHEDULED">مجدول</option>
                                <option value="COMPLETED">مكتمل</option>
                                <option value="CANCELLED">ملغي</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label htmlFor="time-filter" className="text-sm font-medium text-purple-700">الوقت:</label>
                            <select
                                id="time-filter"
                                value={timeRangeFilter}
                                onChange={(e) => setTimeRangeFilter(e.target.value)}
                                className="px-3 py-2 border border-purple-200 dark:border-purple-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-purple-500 focus:border-purple-500 focus:ring-2 text-sm transition-all duration-200 text-slate-800 dark:text-slate-200"
                            >
                                <option value="all">جميع الأوقات</option>
                                <option value="morning">صباحي (6-12)</option>
                                <option value="afternoon">مسائي (12-18)</option>
                                <option value="evening">مسائي متأخر (18+)</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <label htmlFor="search-input" className="text-sm font-medium text-purple-700">بحث:</label>
                            <div className="relative flex-1 max-w-xs">
                                <SearchIcon />
                                <input
                                    id="search-input"
                                    type="text"
                                    placeholder="ابحث في المواعيد..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 border border-purple-200 dark:border-purple-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-purple-500 focus:border-purple-500 focus:ring-2 text-sm transition-all duration-200 text-slate-800 dark:text-slate-200"
                                />
                            </div>
                        </div>

                        {(dentistFilter !== 'all' || statusFilter !== 'all' || timeRangeFilter !== 'all' || searchTerm.trim()) && (
                            <button
                                onClick={() => {
                                    setDentistFilter('all');
                                    setStatusFilter('all');
                                    setTimeRangeFilter('all');
                                    setSearchTerm('');
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-lg hover:from-slate-600 hover:to-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/50 text-sm transition-all duration-200"
                            >
                                مسح الفلاتر
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                {/* Calendar Section - Gold + Purple Theme */}
                <div className="w-full flex-shrink-0 print:hidden">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-purple-700">{monthYearFormatter.format(calendarDate)}</h3>
                        <div className="flex">
                             <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all duration-200" aria-label={t('scheduler.previousWeek')}><ChevronLeftIcon /></button>
                             <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all duration-200" aria-label={t('scheduler.nextWeek')}><ChevronRightIcon /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-sm">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => <div key={i} className="text-purple-600 font-semibold text-xs">{dayOfWeekShortFormatter.format(new Date(2023, 0, i + 1))}</div>)}
                        {Array.from({length: firstDayOfMonth}).map((_, i) => <div key={`empty-${i}`}></div>)}
                        {Array.from({length: daysInMonth}).map((_, day) => {
                            const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day + 1);
                            const dateStr = toLocalDateString(date);
                            const isSelected = isSameDay(date, selectedDate);
                            const isToday = isSameDay(date, new Date());
                            const dots = appointmentsByDay.get(dateStr);
                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => setSelectedDate(date)}
                                    className={`relative p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all duration-200 ${isSelected ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md' : isToday ? 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 dark:from-amber-500 dark:to-amber-600 dark:text-white dark:font-semibold' : 'hover:bg-purple-50 text-slate-700 dark:text-slate-300'}`}
                                >
                                    {day + 1}
                                    {dots && <div className="absolute bottom-1 right-1 flex gap-0.5">{Array.from(dots).slice(0,3).map(color => <span key={color} className={`block w-1.5 h-1.5 rounded-full ${color} border border-white`}></span>)}</div>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 relative overflow-y-auto border-s border-e border-slate-200 md:border-s md:border-e">
                    {isMobile ? (
                        <MobileAppointmentList
                            dailyAppointments={dailyAppointments}
                            patients={patients}
                            dentists={dentists}
                            onAppointmentClick={(apt) => setModalState({ type: 'details', data: apt })}
                            onAddClick={() => setModalState({ type: 'time_selector' })}
                            onSendReminder={handleSendReminder}
                            onStatusClick={handleStatusClick}
                        />
                    ) : (
                        <div className="grid grid-cols-[auto_1fr] h-full">
                            <div className="w-16 text-end text-sm text-slate-500">
                                {timeSlots.map(hour => (
                                    <div key={hour} className="h-20 relative -top-2 pe-2">{timeFormatter.format(new Date(0,0,0,hour))}</div>
                                ))}
                            </div>
                            <div className="relative overflow-y-auto" style={{ height: `${timeSlots.length * 80}px` }}>
                                {/* Hour slots for click-to-add functionality */}
                                {timeSlots.map(hour => (
                                    <div key={hour} className="h-20 border-t border-slate-200 p-1 relative" onClick={() => handleSlotClick(hour)} role="button">
                                        <div className="absolute top-1/2 left-0 right-0 border-t border-slate-300 pointer-events-none"></div>
                                    </div>
                                ))}

                                {/* Appointments rendered absolutely across the full timeline */}
                                {filteredAppointments.map(apt => {
                                    const patient = patients.find(p => p.id === apt.patientId);
                                    const dentist = dentists.find(d => d.id === apt.dentistId);

                                    // Calculate position and size
                                    const workStartTime = new Date(selectedDate);
                                    workStartTime.setHours(workStartHour, 0, 0, 0);
                                    const minutesFromStart = (apt.startTime.getTime() - workStartTime.getTime()) / (1000 * 60);
                                    const durationMinutes = (apt.endTime.getTime() - apt.startTime.getTime()) / (1000 * 60);

                                    // Find concurrent appointments (overlapping in time)
                                    const concurrentAppointments = dailyAppointments.filter(otherApt => {
                                        const otherStart = otherApt.startTime.getTime();
                                        const otherEnd = otherApt.endTime.getTime();
                                        const aptStart = apt.startTime.getTime();
                                        const aptEnd = apt.endTime.getTime();
                                        return otherApt.id !== apt.id && aptStart < otherEnd && aptEnd > otherStart;
                                    }).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

                                    // Calculate stack position
                                    const stackIndex = concurrentAppointments.filter(otherApt =>
                                        otherApt.startTime.getTime() < apt.startTime.getTime() ||
                                        (otherApt.startTime.getTime() === apt.startTime.getTime() && otherApt.id < apt.id)
                                    ).length;

                                    const totalConcurrent = concurrentAppointments.length + 1;
                                    const widthPercent = 100 / totalConcurrent;
                                    const leftPercent = stackIndex * widthPercent;

                                    const top = (minutesFromStart / 60) * 80; // 80px per hour
                                    const height = Math.max((durationMinutes / 60) * 80, 40); // Minimum 40px height

                                    return (
                                        <div
                                            key={apt.id}
                                            className={`p-0.5 rounded-lg text-white shadow-md overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 border-white/50 ${dentist?.color || 'bg-slate-500'}`}
                                            style={{
                                                position: 'absolute',
                                                left: `${leftPercent}%`,
                                                width: `${widthPercent}%`,
                                                top: `${top}px`,
                                                minHeight: `${Math.max(height - 8, 24)}px`, // Reduce padding impact
                                                zIndex: 10
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setModalState({ type: 'details', data: apt });
                                            }}
                                        >
                                            {durationMinutes <= 30 ? (
                                                // Compact single-line layout for short appointments
                                                <div className="flex items-center justify-between text-xs px-1 py-0.5">
                                                    <div className="flex items-center gap-1 flex-1 min-w-0">
                                                        <span className="font-medium truncate text-xs">{patient?.name}</span>
                                                        <span className="bg-white bg-opacity-20 px-0.5 py-0 rounded text-xs">{apt.reason}</span>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 flex-shrink-0">
                                                        <span className="bg-slate-200 text-slate-800 px-0.5 py-0 rounded text-xs">{dentist?.name}</span>
                                                        <span className="text-xs opacity-90">
                                                            {timeFormatter.format(apt.startTime)}-{timeFormatter.format(apt.endTime)}
                                                        </span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSendWhatsApp(apt);
                                                                }}
                                                                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                                                title="إرسال تذكير واتساب"
                                                            >
                                                                <WhatsAppIcon className="h-5 w-5" />
                                                                إرسال رسالة تذكير
                                                            </button>
                                                    <span
                                                                className={`px-1 py-0 rounded text-xs cursor-pointer hover:opacity-80 flex items-center gap-1 ${apt.status === 'SCHEDULED' ? 'bg-green-200 text-green-800' : apt.status === 'COMPLETED' ? 'bg-blue-200 text-blue-800' : apt.status === 'CANCELLED' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleStatusClick(apt);
                                                                }}
                                                                title={t('scheduler.clickToChangeStatus')}
                                                            >
                                                                {apt.status === 'SCHEDULED' ? '🟢' : apt.status === 'COMPLETED' ? '✅' : apt.status === 'CANCELLED' ? '❌' : '⏳'}
                                                                {t(`appointmentStatus.${apt.status}`)}
                                                            </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                // Multi-line layout for longer appointments
                                                <div className="flex flex-col px-1 py-0.5">
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
                                                            <span className="font-semibold text-xs truncate">{patient?.name}</span>
                                                            <span className="bg-white bg-opacity-20 px-0.5 py-0 rounded text-xs">{apt.reason}</span>
                                                        </div>
                                                        <div className="flex items-center gap-0.5 flex-shrink-0">
                                                            <span className="bg-slate-200 text-slate-800 px-0.5 py-0 rounded text-xs">{dentist?.name}</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSendWhatsApp(apt);
                                                                }}
                                                                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                                                title="إرسال تذكير واتساب"
                                                            >
                                    <WhatsAppIcon className="h-5 w-5" />
                                    إرسال رسالة تذكير
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <div className="text-xs opacity-90">
                                                            {timeFormatter.format(apt.startTime)} - {timeFormatter.format(apt.endTime)}
                                                        </div>
                                                        <div className="flex items-center gap-0.5">
                                                            <span className="bg-yellow-200 text-yellow-800 px-0.5 py-0 rounded text-xs">{Math.round(durationMinutes)}m</span>
                                                            <span className={`px-0.5 py-0 rounded text-xs flex items-center gap-1 ${apt.status === 'SCHEDULED' ? 'bg-green-200 text-green-800' : apt.status === 'COMPLETED' ? 'bg-blue-200 text-blue-800' : apt.status === 'CANCELLED' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'}`}>
                                                                <button
                                                                    className={`cursor-pointer hover:opacity-80 flex items-center gap-1 ${apt.status === 'SCHEDULED' ? 'bg-green-200 text-green-800' : apt.status === 'COMPLETED' ? 'bg-blue-200 text-blue-800' : apt.status === 'CANCELLED' ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'}`}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleStatusClick(apt);
                                                                    }}
                                                                    title={t('scheduler.clickToChangeStatus')}
                                                                >
                                                                    {apt.status === 'SCHEDULED' ? '🟢' : apt.status === 'COMPLETED' ? '✅' : apt.status === 'CANCELLED' ? '❌' : '⏳'}
                                                                    {t(`appointmentStatus.${apt.status}`)}
                                                                </button>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {!isMobile && (
                <div className="mt-6">
                    <AppointmentStatsCard
                        appointmentStats={appointmentStats}
                        notes={notes}
                        setNotes={setNotes}
                    />
                </div>
            )}

            {modalState.type === 'add' && <AddAppointmentModal onClose={() => setModalState({ type: null })} onSave={handleSaveAppointment} clinicData={clinicData} initialDateTime={modalState.data.initialDateTime} />}
            {modalState.type === 'edit' && <AddAppointmentModal onClose={() => setModalState({ type: null })} onSave={handleSaveAppointment} clinicData={clinicData} appointmentToEdit={modalState.data} />}
            {modalState.type === 'details' && (
                <AppointmentDetailsModal
                    appointment={modalState.data}
                    patient={patients.find(p => p.id === modalState.data.patientId)}
                    dentist={dentists.find(d => d.id === modalState.data.dentistId)}
                    onClose={() => setModalState({ type: null })}
                    onEdit={() => setModalState({ type: 'edit', data: modalState.data })}
                    onDelete={() => handleDeleteAppointment(modalState.data.id)}
                />
            )}
            {modalState.type === 'time_selector' && (
                <MobileTimeSelectorModal
                    onClose={() => setModalState({ type: null })}
                    onSelectTime={(hour, minute) => {
                        const newDate = new Date(selectedDate);
                        newDate.setHours(hour, minute, 0, 0);
                        setModalState({ type: 'add', data: { initialDateTime: newDate } });
                    }}
                    selectedDate={selectedDate}
                    dailyAppointments={dailyAppointments}
                    patients={patients}
                    dentists={dentists}
                    workStartHour={workStartHour}
                    workEndHour={workEndHour}
                />
            )}
            </div>
        </div>
    );
};

export default Scheduler;
