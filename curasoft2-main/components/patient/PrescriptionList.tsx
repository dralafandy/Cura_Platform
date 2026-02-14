import React, { useState, useMemo } from 'react';
import { Patient, Prescription, PrescriptionItem, Dentist } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useClinicData } from '../../hooks/useClinicData';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types';
import PrescriptionDetailsModal from './PrescriptionDetailsModal';
import DeletePrescriptionConfirmationModal from './DeletePrescriptionConfirmationModal';
import PrintablePrescription from './PrintablePrescription';

// Icons
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const FileTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const PrintIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
);

const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);

const StethoscopeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

interface FormSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    isDark?: boolean;
}

const FormSection: React.FC<FormSectionProps> = ({ title, icon, children, className = '', isDark = false }) => (
    <div className={`bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700 ${className}`}>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-primary/20 text-primary-300' : 'bg-primary/10 text-primary'}`}>
                {icon}
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">{title}</h3>
        </div>
        {children}
    </div>
);

interface InputFieldProps {
    id: string;
    name: string;
    label?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
    icon?: React.ReactNode;
    className?: string;
}

const InputField: React.FC<InputFieldProps> = ({
    id, name, label, value, onChange, type = 'text', placeholder, required, icon, className = ''
}) => {
    const isDateInput = type === 'date';
    const inputClasses = `
        w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg
        focus:ring-2 focus:ring-primary/20 focus:border-primary
        transition-all duration-200 ease-in-out
        placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-700 dark:text-slate-200
        ${icon ? 'pr-10' : ''}
        ${isDateInput ? 'min-w-[140px] sm:min-w-[160px] text-xs sm:text-sm' : ''}
    `;

    return (
        <div className={`relative ${className}`}>
            {label && (
                <label htmlFor={id} className="block text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5 sm:mb-2">
                    {label}
                    {required && <span className="text-red-500 mr-1">*</span>}
                </label>
            )}
            <div className="relative overflow-hidden">
                <input
                    id={id}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={inputClasses}
                    required={required}
                    style={{ minWidth: isDateInput ? '140px' : undefined }}
                />
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};

const PrescriptionList: React.FC<{
    patients: Patient[];
    prescriptions: Prescription[];
    prescriptionItems: PrescriptionItem[];
    dentists: Dentist[];
    onUpdatePrescription?: (patientId: string, prescription: Prescription) => void;
    onDeletePrescription?: (prescriptionId: string) => void;
}> = ({ patients, prescriptions, prescriptionItems, dentists, onUpdatePrescription, onDeletePrescription }) => {
    const { t, locale } = useI18n();
    const { isDark } = useTheme();
    const { clinicInfo, whatsappPrescriptionTemplate } = useClinicData();
    const { addNotification } = useNotification();
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
    const [deletingPrescription, setDeletingPrescription] = useState<Prescription | null>(null);
    const [filtersExpanded, setFiltersExpanded] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        dentistId: ''
    });

    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });

    const filteredPrescriptions = useMemo(() => {
        let filtered = prescriptions.filter(p => patients.some(pt => pt.id === p.patientId));

        // Search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(prescription => {
                const patient = patients.find(p => p.id === prescription.patientId);
                const dentist = dentists.find(d => d.id === prescription.dentistId);
                const items = prescriptionItems.filter(item => item.prescriptionId === prescription.id);

                return (
                    patient?.name.toLowerCase().includes(term) ||
                    dentist?.name.toLowerCase().includes(term) ||
                    items.some(item => item.medicationName.toLowerCase().includes(term)) ||
                    prescription.notes?.toLowerCase().includes(term)
                );
            });
        }

        // Date range filter
        if (filters.startDate) {
            filtered = filtered.filter(p => new Date(p.prescriptionDate) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            filtered = filtered.filter(p => new Date(p.prescriptionDate) <= new Date(filters.endDate));
        }

        // Doctor filter
        if (filters.dentistId) {
            filtered = filtered.filter(p => p.dentistId === filters.dentistId);
        }

        return filtered.sort((a, b) => new Date(b.prescriptionDate).getTime() - new Date(a.prescriptionDate).getTime());
    }, [prescriptions, patients, dentists, prescriptionItems, searchTerm, filters]);

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({ startDate: '', endDate: '', dentistId: '' });
        setSearchTerm('');
    };

    const handlePrintPrescription = (prescription: Prescription) => {
        const patient = patients.find(p => p.id === prescription.patientId);
        const dentist = dentists.find(d => d.id === prescription.dentistId);
        const items = prescriptionItems.filter(item => item.prescriptionId === prescription.id);

        if (!patient || !dentist) {
            addNotification({ message: t('prescriptionList.errorLoadingPrescription'), type: NotificationType.ERROR });
            return;
        }

        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            addNotification({ message: t('prescriptionList.errorOpeningPrintWindow'), type: NotificationType.ERROR });
            return;
        }

        // Create the printable content
        const printContent = `
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${t('prescriptionList.title')} - ${patient.name}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 1.5cm;
                    }
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        font-size: 11pt;
                        line-height: 1.5;
                        margin: 0;
                        padding: 0;
                    }
                    .print-container {
                        max-width: 100%;
                        padding: 20px;
                    }
                    .header {
                        margin-bottom: 1rem;
                        border-bottom: 2px solid #1e40af;
                        padding-bottom: 0.75rem;
                    }
                    .clinic-info {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                    }
                    .clinic-logo {
                        width: 60px;
                        height: 60px;
                        object-fit: contain;
                    }
                    .clinic-details h1 {
                        font-size: 14pt;
                        margin: 0;
                        color: #1e40af;
                    }
                    .clinic-details p {
                        font-size: 9pt;
                        margin: 2px 0;
                        color: #4b5563;
                    }
                    .title {
                        font-size: 16pt;
                        font-weight: 700;
                        color: #1e40af;
                        text-align: center;
                        margin-bottom: 0.5rem;
                    }
                    .prescription-number {
                        text-align: center;
                        font-size: 10pt;
                        color: #6b7280;
                        margin-bottom: 1rem;
                    }
                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 1rem;
                        margin-bottom: 1rem;
                    }
                    .info-box {
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        padding: 0.75rem;
                        background-color: #fafafa;
                    }
                    .info-label {
                        font-size: 9pt;
                        color: #6b7280;
                        margin-bottom: 2px;
                    }
                    .info-value {
                        font-weight: 600;
                        color: #111827;
                    }
                    .notes-box {
                        border: 1px solid #f59e0b;
                        background-color: #fffbeb;
                        border-radius: 6px;
                        padding: 0.75rem;
                        margin-bottom: 1rem;
                    }
                    .notes-label {
                        font-weight: 600;
                        color: #92400e;
                        font-size: 9pt;
                        margin-bottom: 4px;
                    }
                    .notes-content {
                        color: #78350f;
                        font-size: 10pt;
                        white-space: pre-wrap;
                    }
                    .medications-section {
                        margin-bottom: 1rem;
                    }
                    .medications-title {
                        font-size: 13pt;
                        font-weight: 600;
                        color: #1f2937;
                        margin-bottom: 0.5rem;
                    }
                    .medications-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 10pt;
                    }
                    .medications-table th {
                        background-color: #1e40af;
                        color: white;
                        padding: 8px 6px;
                        text-align: right;
                        font-weight: 600;
                        border: 1px solid #1e40af;
                    }
                    .medications-table td {
                        padding: 8px 6px;
                        border: 1px solid #d1d5db;
                        vertical-align: top;
                    }
                    .medications-table tr:nth-child(even) {
                        background-color: #f8fafc;
                    }
                    .footer {
                        margin-top: 2rem;
                        padding-top: 1rem;
                        border-top: 1px solid #e5e7eb;
                    }
                    .signature-area {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 2rem;
                        margin-top: 1.5rem;
                    }
                    .signature-box {
                        text-align: center;
                    }
                    .signature-line {
                        border-top: 1px solid #374151;
                        margin-top: 2rem;
                        padding-top: 0.5rem;
                        width: 80%;
                        margin-left: auto;
                        margin-right: auto;
                    }
                    .footer-note {
                        text-align: center;
                        font-size: 9pt;
                        color: #6b7280;
                        margin-bottom: 1rem;
                    }
                    .generated-date {
                        text-align: center;
                        font-size: 8pt;
                        color: #9ca3af;
                        margin-top: 1rem;
                    }
                    
                    /* Close Button Styles */
                    .close-button-container {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        z-index: 9999;
                        background: linear-gradient(to bottom, #f8fafc, #ffffff);
                        border-bottom: 1px solid #e2e8f0;
                        padding: 12px 16px;
                        display: flex;
                        justify-content: flex-start;
                        align-items: center;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }
                    
                    .close-button {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background: #ef4444;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        padding: 10px 16px;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
                    }
                    
                    .close-button:hover {
                        background: #dc2626;
                        transform: translateY(-1px);
                        box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
                    }
                    
                    @media print {
                        .close-button-container {
                            display: none !important;
                        }
                    }
                    
                    @media (max-width: 640px) {
                        .close-button-container {
                            padding: 16px;
                        }
                        .close-button {
                            padding: 12px 20px;
                            font-size: 16px;
                        }
                    }
                </style>
            </head>
            <body style="padding-top: 80px;">
                <!-- Close Button - Visible only on screen, hidden when printing -->
                <div class="close-button-container">
                    <button onclick="window.close()" class="close-button" aria-label="إغلاق التقرير">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        <span>إغلاق</span>
                    </button>
                </div>
                <div class="print-container">

                    <div class="header">
                        <div class="clinic-info">
                            ${clinicInfo.logo ? `<img src="${clinicInfo.logo}" alt="شعار العيادة" class="clinic-logo">` : ''}
                            <div class="clinic-details">
                                <h1>${clinicInfo.name || t('appName')}</h1>
                                ${clinicInfo.address ? `<p>📍 ${clinicInfo.address}</p>` : ''}
                                ${clinicInfo.phone ? `<p>📞 ${clinicInfo.phone}</p>` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="title">${t('prescriptionDetails.title')}</div>
                    <div class="prescription-number">${t('prescriptionDetails.prescriptionId')}: ${prescription.id.slice(-8).toUpperCase()}</div>

                    <div class="info-grid">
                        <div class="info-box">
                            <div class="info-label">${t('prescriptionDetails.patientName')}</div>
                            <div class="info-value">${patient.name}</div>
                            <div style="margin-top: 8px; font-size: 9pt; color: #6b7280;">
                                <span class="info-label">${t('prescriptionDetails.patientPhone')}: </span>
                                ${patient.phone}
                            </div>
                        </div>
                        <div class="info-box">
                            <div class="info-label">${t('prescriptionDetails.dentist')}</div>
                            <div class="info-value">${dentist.name}</div>
                            <div style="margin-top: 8px; font-size: 9pt; color: #6b7280;">
                                <span class="info-label">${t('prescriptionDetails.date')}: </span>
                                ${new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(prescription.prescriptionDate))}
                            </div>
                        </div>
                    </div>

                    ${prescription.notes ? `
                    <div class="notes-box">
                        <div class="notes-label">${t('prescriptionDetails.notes')}</div>
                        <div class="notes-content">${prescription.notes}</div>
                    </div>
                    ` : ''}

                    <div class="medications-section">
                        <div class="medications-title">${t('prescriptionDetails.medications')}</div>
                        ${items.length > 0 ? `
                        <table class="medications-table">
                            <thead>
                                <tr>
                                    <th style="width: 5%">#</th>
                                    <th style="width: 25%">${t('prescriptionPrint.medication') || 'الدواء'}</th>
                                    <th style="width: 20%">${t('prescriptionPrint.dosage') || 'الجرعة'}</th>
                                    <th style="width: 10%">${t('prescriptionPrint.quantity') || 'الكمية'}</th>
                                    <th style="width: 40%">${t('prescriptionPrint.instructions') || 'تعليمات الاستخدام'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map((item, index) => `
                                <tr>
                                    <td style="text-align: center; font-weight: 600;">${index + 1}</td>
                                    <td style="font-weight: 600;">${item.medicationName}</td>
                                    <td>${item.dosage || '-'}</td>
                                    <td style="text-align: center;">${item.quantity}</td>
                                    <td>${item.instructions || '-'}</td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        ` : `<p style="text-align: center; color: #6b7280; padding: 1rem;">${t('prescriptionDetails.noMedications')}</p>`}
                    </div>

                    <div class="footer">
                        <div class="footer-note">${t('prescriptionDetails.footerNote') || 'يرجى اتباع تعليمات الاستخدام بدقة. للاستفسارات، يرجى التواصل مع العيادة.'}</div>
                        <div class="signature-area">
                            <div class="signature-box">
                                <div class="signature-line">${t('prescriptionPrint.doctorSignature') || 'توقيع الطبيب'}</div>
                                <div style="font-size: 9pt; color: #6b7280; margin-top: 4px;">${dentist.name}</div>
                            </div>
                            <div class="signature-box">
                                <div class="signature-line">${t('prescriptionPrint.clinicStamp') || 'ختم العيادة'}</div>
                                <div style="font-size: 9pt; color: #6b7280; margin-top: 4px;">${clinicInfo.name || t('appName')}</div>
                            </div>
                        </div>
                        <div class="generated-date">${t('reports.generatedOn')} ${new Date().toLocaleString(locale)}</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for the content to load, then print
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    if (filteredPrescriptions.length === 0 && prescriptions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-6 mb-4">
                    <FileTextIcon />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-lg">{t('prescriptionList.noPrescriptions')}</p>
            </div>
        );
    }

    return (
        <>
            {/* Main Container with Card Style - Mobile Optimized */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header - Mobile Optimized */}
                <header className={`px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 flex-shrink-0 ${isDark ? 'bg-gradient-to-r from-slate-800 to-slate-900' : 'bg-gradient-to-r from-primary to-primary-dark'} rounded-t-2xl`}>
                    <div className="flex items-center justify-between w-full sm:w-auto">
                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center gap-2">
                            <FileTextIcon />
                            {t('prescriptionList.title')}
                        </h2>
                        <button
                            onClick={() => setFiltersExpanded(!filtersExpanded)}
                            className="sm:hidden bg-white/20 text-white p-2 rounded-lg hover:bg-white/30 transition-all duration-200"
                            aria-label={filtersExpanded ? t('common.hide') : t('common.show')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-200 ${filtersExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="bg-white/20 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                            {filteredPrescriptions.length} {t('prescriptionList.prescriptions')}
                        </span>
                    </div>
                </header>

                {/* Filters Section - Mobile Optimized */}
                <div className={`p-3 sm:p-4 md:p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 transition-all duration-300 ${filtersExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 sm:max-h-[2000px] sm:opacity-100 overflow-hidden'}`}>
                    <FormSection title={t('prescriptionList.searchAndFilters')} icon={<SearchIcon />} isDark={isDark}>
                        {/* Search Input - Full width on mobile */}
                        <div className="mb-3 sm:mb-4">
                            <label htmlFor="search" className="block text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5 sm:mb-2">
                                {t('prescriptionList.search')}
                            </label>
                            <div className="relative overflow-hidden">
                                <input
                                    id="search"
                                    type="text"
                                    placeholder={t('prescriptionList.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-xs sm:text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                                    <SearchIcon />
                                </div>
                            </div>
                        </div>

                        {/* Date Filters - Stacked on mobile */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 overflow-hidden">
                            <InputField
                                id="startDate"
                                name="startDate"
                                label={t('financialFilters.startDate')}
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                type="date"
                                icon={<CalendarIcon />}
                            />
                            <InputField
                                id="endDate"
                                name="endDate"
                                label={t('financialFilters.endDate')}
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                type="date"
                                icon={<CalendarIcon />}
                            />
                        </div>

                        {/* Doctor Filter and Clear Button - Stacked on mobile */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 overflow-hidden">
                            <div className="relative overflow-hidden">
                                <label htmlFor="dentistId" className="block text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5 sm:mb-2">
                                    {t('prescriptionList.doctor')}
                                </label>
                                <div className="relative overflow-hidden">
                                    <select
                                        id="dentistId"
                                        value={filters.dentistId}
                                        onChange={(e) => handleFilterChange('dentistId', e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-xs sm:text-sm text-slate-700 dark:text-slate-200 appearance-none"
                                    >
                                        <option value="">{t('prescriptionList.allDoctors')}</option>
                                        {dentists.map(dentist => (
                                            <option key={dentist.id} value={dentist.id}>{dentist.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                                        <UserIcon />
                                    </div>
                                    <div className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Clear Filters Button */}
                            <div className="flex items-end">
                                <button
                                    onClick={clearFilters}
                                    className="w-full sm:w-auto bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-200 text-xs sm:text-sm font-medium"
                                >
                                    {t('financialFilters.clearAll')}
                                </button>
                            </div>
                        </div>

                        {/* Active Filters Display - Mobile Optimized */}
                        <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
                            {searchTerm && (
                                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs md:text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 max-w-[150px] sm:max-w-full">
                                    <span className="truncate">{t('prescriptionList.search')}: {searchTerm}</span>
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="ml-1 sm:ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 flex-shrink-0"
                                    >
                                        <CloseIcon />
                                    </button>
                                </span>
                            )}
                            {filters.startDate && (
                                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs md:text-sm bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                                    {t('financialFilters.startDate')}: {new Date(filters.startDate).toLocaleDateString()}
                                    <button
                                        onClick={() => handleFilterChange('startDate', '')}
                                        className="ml-1 sm:ml-2 text-green-600 hover:text-green-800 flex-shrink-0"
                                    >
                                        <CloseIcon />
                                    </button>
                                </span>
                            )}
                            {filters.endDate && (
                                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs md:text-sm bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                                    {t('financialFilters.endDate')}: {new Date(filters.endDate).toLocaleDateString()}
                                    <button
                                        onClick={() => handleFilterChange('endDate', '')}
                                        className="ml-1 sm:ml-2 text-green-600 hover:text-green-800 flex-shrink-0"
                                    >
                                        <CloseIcon />
                                    </button>
                                </span>
                            )}
                            {filters.dentistId && (
                                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs md:text-sm bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 max-w-[150px] sm:max-w-full">
                                    <span className="truncate">{t('prescriptionList.doctor')}: {dentists.find(d => d.id === filters.dentistId)?.name}</span>
                                    <button
                                        onClick={() => handleFilterChange('dentistId', '')}
                                        className="ml-1 sm:ml-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 flex-shrink-0"
                                    >
                                        <CloseIcon />
                                    </button>
                                </span>
                            )}
                        </div>
                    </FormSection>
                </div>

                {/* Prescriptions List - Mobile Optimized */}
                <div className="p-2 sm:p-3 md:p-6 space-y-2 sm:space-y-3 md:space-y-4">
                    {filteredPrescriptions.length > 0 ? (
                        filteredPrescriptions.map(prescription => {
                            const patient = patients.find(p => p.id === prescription.patientId);
                            const dentist = dentists.find(d => d.id === prescription.dentistId);
                            const items = prescriptionItems.filter(item => item.prescriptionId === prescription.id);

                            return (
                                <div key={prescription.id} className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm sm:shadow-md border border-slate-200 dark:border-slate-700 p-3 sm:p-4 md:p-5 hover:shadow-lg transition-all duration-200 active:scale-[0.99]">
                                    {/* Prescription Header - Mobile Optimized */}
                                    <div className="flex flex-col gap-2 sm:gap-3 mb-2 sm:mb-3">
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg shrink-0">
                                                <FileTextIcon />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base md:text-lg">
                                                        {t('prescriptionList.prescription')} #{prescription.id.slice(-8)}
                                                    </h4>
                                                    {prescription.notes && (
                                                        <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-100">
                                                            {t('prescriptionList.hasNotes')}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-0.5 sm:mt-1 truncate">
                                                    <span className="font-medium">{t('prescriptionList.patient')}:</span> {patient?.name || t('common.unknownPatient')}
                                                </p>
                                                <p className="text-[11px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 truncate">
                                                    <span className="font-medium">{t('prescriptionList.doctor')}:</span> {dentist?.name || t('common.unknownDentist')}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Date and Items Count - Mobile Optimized */}
                                        <div className="flex flex-col gap-1.5 sm:gap-2 mt-1 sm:mt-2">
                                            <div className="flex flex-row justify-between items-center">
                                                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                                                    <CalendarIcon />
                                                    {dateFormatter.format(new Date(prescription.prescriptionDate))}
                                                </span>
                                                <span className="text-[10px] sm:text-xs md:text-sm font-medium text-primary">
                                                    {items.length} {t('prescriptionList.items')}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                                {patient?.phone && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                                                        <PhoneIcon />
                                                        {patient.phone}
                                                    </span>
                                                )}
                                                {dentist?.specialty && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                                                        <StethoscopeIcon />
                                                        {dentist.specialty}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Notes - Mobile Optimized */}
                                    {prescription.notes && (
                                        <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                            <p className="text-[11px] sm:text-xs md:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap line-clamp-2 sm:line-clamp-3 md:line-clamp-none">{prescription.notes}</p>
                                        </div>
                                    )}

                                    {/* Medications - Mobile Optimized */}
                                    {items.length > 0 && (
                                        <div className="mt-2 sm:mt-3 md:mt-4 p-2 sm:p-3 md:p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                            <p className="font-semibold text-[11px] sm:text-xs md:text-sm text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                                                <span className="bg-primary/20 p-0.5 sm:p-1 rounded">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                                    </svg>
                                                </span>
                                                {t('prescriptionList.medications')}
                                            </p>
                                            <ul className="list-disc list-inside text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400 space-y-0.5 sm:space-y-1">
                                                {items.slice(0, 3).map((item, index) => (
                                                    <li key={index} className="break-words">
                                                        <span className="font-medium text-slate-800 dark:text-slate-200">{item.medicationName}</span>
                                                        {item.dosage && ` - ${item.dosage}`}
                                                        {` (${t('prescriptionList.quantity')}: ${item.quantity})`}
                                                        {item.instructions && <span className="text-slate-500 dark:text-slate-500 block sm:inline"> - {item.instructions}</span>}
                                                    </li>
                                                ))}
                                                {items.length > 3 && (
                                                    <li className="text-slate-500 dark:text-slate-400 italic">
                                                        +{items.length - 3} {t('prescriptionList.moreItems')}
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Action Buttons - Mobile Optimized */}
                                    <div className="flex flex-row justify-end mt-2 sm:mt-3 md:mt-4 pt-2 sm:pt-3 md:pt-4 border-t border-slate-200 dark:border-slate-700 gap-1.5 sm:gap-2">
                                        <button
                                            onClick={() => handlePrintPrescription(prescription)}
                                            className="flex-1 sm:flex-none bg-slate-600 dark:bg-slate-500 text-white px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm font-medium active:scale-95"
                                            title={t('common.print')}
                                        >
                                            <PrintIcon />
                                            <span className="hidden sm:inline">{t('common.print')}</span>
                                        </button>
                                        <button
                                            onClick={() => setSelectedPrescription(prescription)}
                                            className="flex-1 sm:flex-none bg-primary text-white px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-primary-dark transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm font-medium active:scale-95"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            <span className="hidden sm:inline">{t('common.viewDetails')}</span>
                                            <span className="sm:hidden">{t('common.view')}</span>
                                        </button>
                                        {onDeletePrescription && (
                                            <button
                                                onClick={() => setDeletingPrescription(prescription)}
                                                className="flex-1 sm:flex-none bg-red-500 text-white px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm font-medium active:scale-95"
                                            >
                                                <DeleteIcon />
                                                <span className="hidden sm:inline">{t('common.delete')}</span>
                                                <span className="sm:hidden">{t('common.delete')}</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 sm:py-8 md:py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                            <div className="bg-slate-100 dark:bg-slate-700 rounded-full p-3 sm:p-4 md:p-6 mb-3 sm:mb-4">
                                <FileTextIcon />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base md:text-lg font-medium text-center px-3 sm:px-4">
                                {prescriptions.length === 0 ? t('prescriptionList.noPrescriptions') : t('prescriptionList.noPrescriptionsFound')}
                            </p>
                            {prescriptions.length === 0 && (
                                <p className="text-slate-400 dark:text-slate-500 text-[10px] sm:text-xs md:text-sm mt-1.5 sm:mt-2 text-center px-3 sm:px-4">
                                    {t('prescriptionList.addFirstPrescription')}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {selectedPrescription && (() => {
                const patient = patients.find(p => p.id === selectedPrescription.patientId);
                return patient ? (
                    <PrescriptionDetailsModal
                        prescription={selectedPrescription}
                        patient={patient}
                        prescriptions={prescriptions}
                        prescriptionItems={prescriptionItems}
                        dentists={dentists}
                        clinicInfo={clinicInfo}
                        clinicData={{ whatsappPrescriptionTemplate }}
                        onClose={() => setSelectedPrescription(null)}
                        onUpdate={onUpdatePrescription ? (updatedPrescription) => {
                            onUpdatePrescription(selectedPrescription.patientId, updatedPrescription);
                            setSelectedPrescription(null);
                        } : undefined}
                        onDelete={onDeletePrescription ? () => {
                            setDeletingPrescription(selectedPrescription);
                            setSelectedPrescription(null);
                        } : undefined}
                    />
                ) : null;
            })()}

            {deletingPrescription && (() => {
                const patient = patients.find(p => p.id === deletingPrescription.patientId);
                const dentist = dentists.find(d => d.id === deletingPrescription.dentistId);
                return patient ? (
                    <DeletePrescriptionConfirmationModal
                        prescription={deletingPrescription}
                        patient={patient}
                        prescriptionItems={prescriptionItems}
                        dentist={dentist}
                        onConfirm={() => {
                            onDeletePrescription?.(deletingPrescription.id);
                            setDeletingPrescription(null);
                            addNotification({ message: t('prescriptionDelete.deletedSuccessfully'), type: NotificationType.SUCCESS });
                        }}
                        onCancel={() => setDeletingPrescription(null)}

                    />
                ) : null;
            })()}
        </>
    );
};

export default PrescriptionList;
