import React, { useState, useMemo, useCallback } from 'react';
import { ClinicData } from '../hooks/useClinicData';
import { Patient, NotificationType, View, Permission } from '../types';
import { useNotification } from '../contexts/NotificationContext';
import AddEditPatientModal from './patient/AddEditPatientModal';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../contexts/AuthContext';

// Modern Icons with Gold + Purple theme
const SearchIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
    </svg>
);

const AddUserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
);

const ChevronDownIcon = ({ className = '', expanded = false }: { className?: string; expanded?: boolean }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-5 w-5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''} ${className}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M6 9l6 6 6-6" />
    </svg>
);

const WhatsAppIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
    </svg>
);

const CalendarIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const PhoneIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

const DeleteIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);

const EditIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const ClockIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

// Utility functions
const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const avatarColors = [
    'bg-gradient-to-br from-purple-400 to-purple-600',
    'bg-gradient-to-br from-amber-400 to-amber-600',
    'bg-gradient-to-br from-emerald-400 to-emerald-600',
    'bg-gradient-to-br from-rose-400 to-rose-600',
    'bg-gradient-to-br from-blue-400 to-blue-600',
    'bg-gradient-to-br from-teal-400 to-teal-600',
    'bg-gradient-to-br from-indigo-400 to-indigo-600',
    'bg-gradient-to-br from-pink-400 to-pink-600'
];

const getAvatarColor = (patientId: string): string => {
    const hash = patientId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return avatarColors[hash % avatarColors.length];
};

// Skeleton loading component with Gold + Purple theme
const PatientCardSkeleton = () => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse">
        <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-amber-100 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                <div className="flex gap-3">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-14"></div>
                </div>
            </div>
        </div>
    </div>
);

const PatientListItem: React.FC<{ patient: Patient; onSelect: () => void; onEdit: () => void; onDelete: () => void; clinicData: ClinicData; canEdit?: boolean; canDelete?: boolean }> = ({ patient, onSelect, onEdit, onDelete, clinicData, canEdit = false, canDelete = false }) => {
    const { t } = useI18n();
    const { hasPermission } = useAuth();
    const [expanded, setExpanded] = useState(false);
    const dateFormatter = new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
    const currencyFormatter = new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' });

    const outstandingBalance = useMemo(() => {
        const patientTreatments = clinicData.treatmentRecords.filter(tr => tr.patientId === patient.id);
        const totalTreatmentCost = patientTreatments.reduce((sum, tr) => sum + (tr.doctorShare + tr.clinicShare), 0);
        const totalPayments = clinicData.payments.filter(p => p.patientId === patient.id).reduce((sum, p) => sum + p.amount, 0);
        return totalTreatmentCost - totalPayments;
    }, [patient.id, clinicData.treatmentRecords, clinicData.payments]);

    const handleSendWhatsApp = (e: React.MouseEvent) => {
        e.stopPropagation();
        let phoneNumber = patient.phone.replace(/[^0-9]/g, '');
        if (phoneNumber.startsWith('0')) {
            phoneNumber = phoneNumber.substring(1);
        }
        const internationalPhoneNumber = `20${phoneNumber}`;
        const message = clinicData.whatsappMessageTemplate
            .replace(/\{patientName\}/g, patient.name)
            .replace(/\{clinicName\}/g, clinicData.clinicInfo.name || 'عيادة كيوراسوف')
            .replace(/\{clinicAddress\}/g, clinicData.clinicInfo.address || '')
            .replace(/\{clinicPhone\}/g, clinicData.clinicInfo.phone || '');
        const url = `https://wa.me/${internationalPhoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const getPatientImage = () => {
        if (patient.images && patient.images.length > 0) {
            return patient.images[0];
        }
        return undefined;
    };

    const avatarColor = getAvatarColor(patient.id);

    return (
        <div
            onClick={onSelect}
            dir="rtl"
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-700 transition-all duration-300 cursor-pointer group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelect()}
        >
            {/* Main Card Content */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Avatar Section */}
                <div className="flex-shrink-0">
                    {getPatientImage() ? (
                        <img 
                            src={getPatientImage()} 
                            alt={patient.name}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 dark:border-slate-700 shadow-sm"
                        />
                    ) : (
                        <div className={`w-16 h-16 rounded-2xl ${avatarColor} flex items-center justify-center text-white font-bold text-xl shadow-sm`}>
                            {getInitials(patient.name)}
                        </div>
                    )}
                </div>

                {/* Patient Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                {/* Status Indicator */}
                                {outstandingBalance > 0 ? (
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-rose-400 to-rose-500 ring-2 ring-white dark:ring-slate-800 shadow-sm" title={t('patientList.outstandingBalance')}></div>
                                ) : (
                                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 ring-2 ring-white dark:ring-slate-800 shadow-sm" title={t('patientList.noBalance')}></div>
                                )}
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{patient.name}</h3>
                            </div>
                            
                            {/* Outstanding Balance Badge */}
                            {outstandingBalance > 0 && (
                                <div className="inline-flex items-center gap-1 bg-gradient-to-r from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/30 border border-rose-200 dark:border-rose-700 rounded-lg px-2 py-1 text-sm mb-2">
                                    <span className="font-bold text-rose-600 dark:text-rose-400">
                                        {currencyFormatter.format(outstandingBalance)}
                                    </span>
                                    <span className="text-rose-500 dark:text-rose-400 text-xs">متبقي</span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                            {(canEdit || hasPermission(Permission.PATIENT_EDIT)) && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                    className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                                    aria-label={t('patientList.editPatientAriaLabel', { patientName: patient.name })}
                                >
                                    <EditIcon className="h-4 w-4" />
                                </button>
                            )}
                            <button
                                onClick={handleSendWhatsApp}
                                className="w-8 h-8 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                                aria-label={t('patientList.sendWhatsAppAriaLabel', { patientName: patient.name })}
                            >
                                <WhatsAppIcon className="h-4 w-4" />
                            </button>
                            {(canDelete || hasPermission(Permission.PATIENT_DELETE)) && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                    className="w-8 h-8 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                                    aria-label={t('patientList.deletePatientAriaLabel', { patientName: patient.name })}
                                >
                                    <DeleteIcon className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Patient Details */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-lg">
                            <PhoneIcon className="h-4 w-4 text-purple-500" />
                            {patient.phone || t('common.none')}
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-lg">
                            <CalendarIcon className="h-4 w-4 text-amber-500" />
                            {patient.lastVisit ? dateFormatter.format(new Date(patient.lastVisit)) : t('common.none')}
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-lg">
                            <ClockIcon className="h-4 w-4 text-emerald-500" />
                            {(() => {
                                const nextAppointment = clinicData.appointments
                                    .filter(appt => appt.patientId === patient.id && new Date(appt.startTime) > new Date())
                                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
                                return nextAppointment ? dateFormatter.format(new Date(nextAppointment.startTime)) : t('common.none');
                            })()}
                        </span>
                    </div>
                </div>

                {/* Expand Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-slate-400 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all duration-200 flex items-center justify-center"
                    aria-label={t('patientList.showTimelineAriaLabel')}
                >
                    <ChevronDownIcon className="h-4 w-4" expanded={expanded} />
                </button>
            </div>

            {/* Timeline Section - Expanded Content */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-96 opacity-100 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700' : 'max-h-0 opacity-0'}`}>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-purple-400 to-amber-400 rounded-full"></div>
                    {t('patientList.recentActivity')}
                </h4>
                <div className="space-y-2">
                    {(() => {
                        const events = [];

                        if (patient.lastVisit) {
                            events.push({
                                type: 'visit',
                                date: new Date(patient.lastVisit),
                                label: t('patientList.timelineLastVisit'),
                                color: 'bg-gradient-to-r from-blue-400 to-blue-500'
                            });
                        }

                        const nextAppointment = clinicData.appointments
                            .filter(appt => appt.patientId === patient.id && new Date(appt.startTime) > new Date())
                            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

                        if (nextAppointment) {
                            events.push({
                                type: 'appointment',
                                date: new Date(nextAppointment.startTime),
                                label: t('patientList.timelineNextAppointment'),
                                color: 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                            });
                        }

                        const lastPayment = clinicData.payments
                            .filter(p => p.patientId === patient.id)
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

                        if (lastPayment) {
                            events.push({
                                type: 'payment',
                                date: new Date(lastPayment.date),
                                label: `${t('patientList.timelinePayment')} ${currencyFormatter.format(lastPayment.amount)}`,
                                color: 'bg-gradient-to-r from-purple-400 to-purple-500'
                            });
                        }

                        const recentTreatments = clinicData.treatmentRecords
                            .filter(tr => tr.patientId === patient.id)
                            .sort((a, b) => new Date(b.treatmentDate).getTime() - new Date(a.treatmentDate).getTime())
                            .slice(0, 3);

                        recentTreatments.forEach(treatment => {
                            const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === treatment.treatmentDefinitionId);
                            events.push({
                                type: 'treatment',
                                date: new Date(treatment.treatmentDate),
                                label: `${t('patientList.timelineTreatment')}: ${treatmentDef ? treatmentDef.name : t('common.unknownTreatment')}`,
                                color: 'bg-gradient-to-r from-amber-400 to-amber-500'
                            });
                        });

                        return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
                    })().map((event, index) => (
                        <div key={index} className="flex items-center gap-3 py-1.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${event.color}`}></div>
                            <div className="flex-1">
                                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{event.label}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{dateFormatter.format(event.date)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PatientList: React.FC<{ clinicData: ClinicData; setCurrentView: (view: View) => void; setSelectedPatientId: (id: string | null) => void }> = ({ clinicData, setCurrentView, setSelectedPatientId }) => {
    const { patients, addPatient, updatePatient, deletePatient, payments, treatmentRecords } = clinicData;
    const { addNotification } = useNotification();
    const { t, locale } = useI18n();

    const [searchTerm, setSearchTerm] = useState('');
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [patientToEdit, setPatientToEdit] = useState<Patient | undefined>(undefined);
    const [sortBy, setSortBy] = useState<'name' | 'balance' | 'lastVisit'>('lastVisit');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [timelineModalPatient, setTimelineModalPatient] = useState<Patient | null>(null);
    
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    const handleSavePatient = useCallback((patientData: Omit<Patient, 'id' | 'dentalChart' | 'treatmentRecords'> | Patient) => {
        if ('id' in patientData && patientData.id) {
            updatePatient(patientData as Patient);
            addNotification({ message: t('notifications.patientUpdated'), type: NotificationType.SUCCESS });
        } else {
            addPatient(patientData as Omit<Patient, 'id' | 'dentalChart' | 'treatmentRecords'>);
            addNotification({ message: t('notifications.patientAdded'), type: NotificationType.SUCCESS });
        }
        setIsAddEditModalOpen(false);
        setPatientToEdit(undefined);
    }, [addNotification, updatePatient, addPatient, t]);

    const handleDeletePatient = useCallback((patient: Patient) => {
        if (window.confirm(t('patientList.confirmDelete', { patientName: patient.name }))) {
            deletePatient(patient.id);
            addNotification({ message: t('notifications.patientDeleted'), type: NotificationType.SUCCESS });
        }
    }, [deletePatient, addNotification, t]);

    const filteredPatients = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        let filtered = patients;
        if (term) {
            filtered = patients.filter(p =>
                (p.name && p.name.toLowerCase().includes(term)) ||
                (p.phone && p.phone.includes(term)) ||
                (p.email && p.email.toLowerCase().includes(term))
            );
        }
        
        return filtered.sort((a, b) => {
            if (sortBy === 'name') {
                return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            } else if (sortBy === 'balance') {
                const balanceA = treatmentRecords.filter(tr => tr.patientId === a.id).reduce((sum, tr) => sum + (tr.doctorShare + tr.clinicShare), 0) -
                                payments.filter(p => p.patientId === a.id).reduce((sum, p) => sum + p.amount, 0);
                const balanceB = treatmentRecords.filter(tr => tr.patientId === b.id).reduce((sum, tr) => sum + (tr.doctorShare + tr.clinicShare), 0) -
                                payments.filter(p => p.patientId === b.id).reduce((sum, p) => sum + p.amount, 0);
                return sortOrder === 'asc' ? balanceA - balanceB : balanceB - balanceA;
            } else {
                const aDate = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
                const bDate = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
                return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
            }
        });
    }, [patients, searchTerm, sortBy, sortOrder, treatmentRecords, payments]);

    const totalPatients = patients.length;
    const totalOutstanding = useMemo(() => {
        return treatmentRecords.reduce((sum, tr) => sum + (tr.doctorShare + tr.clinicShare), 0) -
               payments.reduce((sum, p) => sum + p.amount, 0);
    }, [treatmentRecords, payments]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
            {/* Modern Header with Stats - Gold + Purple Theme */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-6 mb-6">
                {/* Decorative gradient bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-purple-500 to-purple-700"></div>
                
                <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                        <div>
                            <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">{t('patientList.patientsList')}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('patientManagement.title')} - {totalPatients} {t('dashboard.patients')}</p>
                        </div>
                        <button
                            onClick={() => { setPatientToEdit(undefined); setIsAddEditModalOpen(true); }}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-2.5 rounded-xl hover:from-purple-700 hover:to-purple-800 flex items-center gap-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                        >
                            <AddUserIcon /> {t('patientList.addPatient')}
                        </button>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-800/30 p-4 rounded-xl border border-purple-200 dark:border-purple-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">{t('patientList.totalPatients')}</p>
                                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">{totalPatients}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-800/30 p-4 rounded-xl border border-amber-200 dark:border-amber-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center text-white shadow-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="1" x2="12" y2="23" />
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{t('patientList.totalOutstanding')}</p>
                                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">{currencyFormatter.format(totalOutstanding)}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-900/30 dark:to-rose-800/30 p-4 rounded-xl border border-rose-200 dark:border-rose-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 flex items-center justify-center text-white shadow-md">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{t('patientList.patientsWithBalance')}</p>
                                    <p className="text-2xl font-bold text-rose-900 dark:text-rose-300">
                                        {patients.filter(p => {
                                            const balance = treatmentRecords.filter(tr => tr.patientId === p.id).reduce((sum, tr) => sum + (tr.doctorShare + tr.clinicShare), 0) -
                                                           payments.filter(pay => pay.patientId === p.id).reduce((sum, pay) => sum + pay.amount, 0);
                                            return balance > 0;
                                        }).length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Controls Section */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full">
                        <div className="relative">
                            <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder={t('patientList.searchPatients')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200"
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-auto">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'name' | 'balance' | 'lastVisit')}
                            className="w-full md:w-48 p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200"
                        >
                            <option value="lastVisit">{t('patientList.sortByLastVisit')}</option>
                            <option value="name">{t('patientList.sortByName')}</option>
                            <option value="balance">{t('patientList.sortByBalance')}</option>
                        </select>
                    </div>
                    <div className="w-full md:w-auto">
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="w-full md:w-auto px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-600 focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200"
                        >
                            {sortOrder === 'asc' ? t('patientList.sortOrderAsc') : t('patientList.sortOrderDesc')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {filteredPatients.length > 0 ? (
                    filteredPatients.map(patient => (
                        <PatientListItem
                            key={patient.id}
                            patient={patient}
                            onSelect={() => {
                                setCurrentView('patient-details');
                                setSelectedPatientId(patient.id);
                                window.scrollTo(0, 0);
                            }}
                            onEdit={() => {
                                setPatientToEdit(patient);
                                setIsAddEditModalOpen(true);
                            }}
                            onDelete={() => handleDeletePatient(patient)}
                            clinicData={clinicData}
                        />
                    ))
                ) : (
                    <div className="text-center py-12">
                        <div className="bg-gradient-to-br from-purple-50 to-amber-50 dark:from-purple-900/20 dark:to-amber-900/20 p-8 rounded-2xl inline-block mb-4 border border-purple-100 dark:border-purple-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-purple-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">{t('patientList.noPatientsTitle')}</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">{t('patientList.noPatientsDescription')}</p>
                        <button
                            onClick={() => { setPatientToEdit(undefined); setIsAddEditModalOpen(true); }}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <AddUserIcon /> {t('patientList.addFirstPatient')}
                        </button>
                    </div>
                )}
            </div>

            {/* Modals */}
            {isAddEditModalOpen && (
                <AddEditPatientModal
                    patient={patientToEdit}
                    onSave={handleSavePatient}
                    onClose={() => {
                        setIsAddEditModalOpen(false);
                        setPatientToEdit(undefined);
                    }}
                />
            )}

            {/* Timeline Modal */}
            {timelineModalPatient && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-purple-50 to-amber-50/30 dark:from-purple-900/30 dark:to-amber-900/20">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{timelineModalPatient.name}</h3>
                            <button
                                onClick={() => setTimelineModalPatient(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-full p-1 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-96">
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                <div className="w-1 h-4 bg-gradient-to-b from-purple-400 to-amber-400 rounded-full"></div>
                                {t('patientList.recentActivity')}
                            </h4>
                            <div className="space-y-3">
                                {(() => {
                                    const dateFormatter = new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
                                    const currencyFormatter = new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' });
                                    const events = [];

                                    if (timelineModalPatient.lastVisit) {
                                        events.push({
                                            type: 'visit',
                                            date: new Date(timelineModalPatient.lastVisit),
                                            label: t('patientList.timelineLastVisit'),
                                            color: 'bg-gradient-to-r from-blue-400 to-blue-500'
                                        });
                                    }

                                    const nextAppointment = clinicData.appointments
                                        .filter(appt => appt.patientId === timelineModalPatient.id && new Date(appt.startTime) > new Date())
                                        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

                                    if (nextAppointment) {
                                        events.push({
                                            type: 'appointment',
                                            date: new Date(nextAppointment.startTime),
                                            label: t('patientList.timelineNextAppointment'),
                                            color: 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                        });
                                    }

                                    const lastPayment = clinicData.payments
                                        .filter(p => p.patientId === timelineModalPatient.id)
                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

                                    if (lastPayment) {
                                        events.push({
                                            type: 'payment',
                                            date: new Date(lastPayment.date),
                                            label: `${t('patientList.timelinePayment')} ${currencyFormatter.format(lastPayment.amount)}`,
                                            color: 'bg-gradient-to-r from-purple-400 to-purple-500'
                                        });
                                    }

                                    const recentTreatments = clinicData.treatmentRecords
                                        .filter(tr => tr.patientId === timelineModalPatient.id)
                                        .sort((a, b) => new Date(b.treatmentDate).getTime() - new Date(a.treatmentDate).getTime())
                                        .slice(0, 5);

                                    recentTreatments.forEach(treatment => {
                                        const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === treatment.treatmentDefinitionId);
                                        events.push({
                                            type: 'treatment',
                                            date: new Date(treatment.treatmentDate),
                                            label: `${t('patientList.timelineTreatment')}: ${treatmentDef ? treatmentDef.name : t('common.unknownTreatment')}`,
                                            color: 'bg-gradient-to-r from-amber-400 to-amber-500'
                                        });
                                    });

                                    return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
                                })().map((event, index) => (
                                    <div key={index} className="flex items-center gap-3 py-1">
                                        <div className={`w-2 h-2 rounded-full ${event.color}`}></div>
                                        <div className="flex-1">
                                            <p className="text-xs md:text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{event.label}</p>
                                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">{new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }).format(event.date)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default PatientList;
