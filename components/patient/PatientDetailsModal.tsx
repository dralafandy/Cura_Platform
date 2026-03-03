import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { Patient, DentalChartData, Payment, NotificationType, PatientDetailTab, TreatmentRecord, ToothStatus, Prescription, PrescriptionItem, Dentist, PatientAttachment, Permission } from '../../types';
import DentalChart from '../DentalChartRedesigned';
import TreatmentRecordList from './TreatmentRecordList';
import AddTreatmentRecordModal from './AddTreatmentRecordModal';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AddPaymentModal from './AddPaymentModal';
import AddDiscountModal from './AddDiscountModal';
import { openPrintWindow } from '../../utils/print';
import PatientInvoice from './PatientInvoice';
import PatientFullReport from './PatientFullReport';
import PatientAttachments from './PatientAttachments';
import PrescriptionList from './PrescriptionList';
import AddEditPrescriptionModal from './AddEditPrescriptionModal';
import ImageViewerModal from './ImageViewerModal';
import { supabase } from '../../supabaseClient';
import { usePermissions } from '../../hooks/usePermissions';

// FormSection component
interface FormSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    isDark?: boolean;
}

const FormSection: React.FC<FormSectionProps> = ({ title, icon, children, className = '', isDark = false }) => (
    <div className={`bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 ${className}`}>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-primary/20 text-primary-300' : 'bg-primary/10 text-primary'}`}>
                {icon}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200">{title}</h3>
        </div>
        {children}
    </div>
);

// Helper function to map treatment names to tooth statuses
const getToothStatusFromTreatment = (treatmentName: string): ToothStatus | null => {
    const lowerName = treatmentName.toLowerCase();
    if (lowerName.includes('filling')) return ToothStatus.FILLING;
    if (lowerName.includes('crown')) return ToothStatus.CROWN;
    if (lowerName.includes('implant')) return ToothStatus.IMPLANT;
    if (lowerName.includes('root canal') || lowerName.includes('endodontic')) return ToothStatus.ROOT_CANAL;
    if (lowerName.includes('extraction') || lowerName.includes('removal')) return ToothStatus.MISSING;
    if (lowerName.includes('cavity')) return ToothStatus.CAVITY;
    return null; // No status change for other treatments
};

// Icons
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const DollarSignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 8v4m-4.003-4l-2.003 2.003m7.007-1.414L14.003 10m-3.414-1.414L9 5.586m4.003 2.828l3.004 3.004M9.879 16.121A3 3 0 1012.004 15H12v2.003V20m0-8c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PercentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m-10.5 2.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm10.5 10.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>;
const FileInvoiceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const FileReportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

// Tab Icons
const DetailsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const TreatmentsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const PrescriptionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const FinancialsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 8v4m-4.003-4l-2.003 2.003m7.007-1.414L14.003 10m-3.414-1.414L9 5.586m4.003 2.828l3.004 3.004M9.879 16.121A3 3 0 1012.004 15H12v2.003V20m0-8c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const AttachmentsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;

export const PatientDetailsModal: React.FC<{
    patient: Patient;
    onEdit: () => void;
    onClose: () => void;
    clinicData: ClinicData;
}> = ({ patient, onEdit, onClose, clinicData }) => {
    const { t, locale } = useI18n();
    const { addNotification } = useNotification();
    const { checkPermission, checkCustomPermission } = useAuth();
    const { updatePatient, addTreatmentRecord, addPayment, payments, treatmentRecords, prescriptions, prescriptionItems, addPrescription, updatePrescription, deletePrescription, addPrescriptionItem, updatePrescriptionItem, deletePrescriptionItem, attachments, addAttachment, updateAttachment, deleteAttachment } = clinicData;

    const [activeTab, setActiveTab] = useState<PatientDetailTab>('details');
    const [activeFinancialTab, setActiveFinancialTab] = useState<'summary' | 'payments' | 'charges'>('summary');
    const [isAddTreatmentModalOpen, setIsAddTreatmentModalOpen] = useState(false);
    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
    const [isAddDiscountModalOpen, setIsAddDiscountModalOpen] = useState(false);
    const [isAddPrescriptionModalOpen, setIsAddPrescriptionModalOpen] = useState(false);
    const [dentists, setDentists] = useState<Dentist[]>([]);
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        setDentists(clinicData.dentists);
    }, [clinicData.dentists]);

    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    const patientPayments = useMemo(() => payments.filter(p => p.patientId === patient.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [payments, patient.id]);
    const patientTreatmentRecords = useMemo(() => treatmentRecords.filter(tr => tr.patientId === patient.id).sort((a,b) => new Date(b.treatmentDate).getTime() - new Date(a.treatmentDate).getTime()), [treatmentRecords, patient.id]);

    const financialSummary = useMemo(() => {
        const totalCharges = patientTreatmentRecords.reduce((sum, tr) => sum + (tr.doctorShare + tr.clinicShare), 0);
        const totalPaid = patientPayments.reduce((sum, p) => sum + p.amount, 0);
        const outstandingBalance = totalCharges - totalPaid;
        return { totalCharges, totalPaid, outstandingBalance };
    }, [patientTreatmentRecords, patientPayments]);

    const handleUpdateDentalChart = useCallback((newChart: DentalChartData) => {
        console.log('PatientDetailsModal: handleUpdateDentalChart called with:', newChart);
        console.log('PatientDetailsModal: current patient dentalChart:', patient.dentalChart);
        const updatedPatient = { ...patient, dentalChart: newChart };
        updatePatient(updatedPatient);
        addNotification(t('notifications.patientUpdated'), NotificationType.SUCCESS);
    }, [patient, updatePatient, addNotification, t]);

    const handleAddTreatmentRecord = useCallback((record: Omit<TreatmentRecord, 'id' | 'patientId'>) => {
        // Add the treatment record
        addTreatmentRecord(patient.id, record);

        // Automatically update dental chart based on affected teeth and treatment type
        if (record.affectedTeeth && record.affectedTeeth.length > 0) {
            const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === record.treatmentDefinitionId);
            if (treatmentDef) {
                const newStatus = getToothStatusFromTreatment(treatmentDef.name);
                if (newStatus) {
                    const updatedChart = { ...patient.dentalChart };
                    record.affectedTeeth.forEach(toothId => {
                        if (updatedChart[toothId]) {
                            updatedChart[toothId] = { ...updatedChart[toothId], status: newStatus };
                        }
                    });
                    updatePatient({ ...patient, dentalChart: updatedChart });
                }
            }
        }

        updatePatient({...patient, lastVisit: record.treatmentDate});
        setIsAddTreatmentModalOpen(false);
        addNotification(t('notifications.treatmentAdded'), NotificationType.SUCCESS);
    }, [addTreatmentRecord, patient, updatePatient, addNotification, t, clinicData.treatmentDefinitions]);

    const handleAddPayment = useCallback((payment: Omit<Payment, 'id'>) => {
        addPayment(payment);
        setIsAddPaymentModalOpen(false);
        addNotification(t('notifications.paymentAdded'), NotificationType.SUCCESS);
    }, [addPayment, addNotification, t]);

    const handlePrintInvoice = () => {
        openPrintWindow(t('patientInvoice.title'), <PatientInvoice patient={patient} clinicData={clinicData} />);
    };

    const handlePrintFullReport = () => {
        openPrintWindow(t('patientReport.title'), <PatientFullReport patient={patient} clinicData={clinicData} />);
    };

    const handleAddPrescription = useCallback(async (prescriptionData: Omit<Prescription, 'id' | 'patientId' | 'userId' | 'createdAt' | 'updatedAt'>, items: PrescriptionItem[]) => {
        // Add the prescription
        const newPrescription = await addPrescription({
            ...prescriptionData,
            patientId: patient.id
        });

        // Add the prescription items
        if (newPrescription) {
            for (const item of items) {
                await addPrescriptionItem(newPrescription.id, item);
            }
        }

        setIsAddPrescriptionModalOpen(false);
        addNotification({
            message: 'تم إضافة الوصفة الطبية بنجاح',
            type: NotificationType.SUCCESS
        });
    }, [patient.id, addPrescription, addPrescriptionItem, addNotification]);

    // Load attachments for this patient
    const patientAttachments = useMemo(() => {
        return attachments.filter(att => att.patientId === patient.id);
    }, [attachments, patient.id]);

    // Real attachment functions
    const handleUploadAttachments = async (files: File[], descriptions: string[]) => {
        console.log('Uploading attachments:', files, descriptions);

        if (!supabase) {
            addNotification('Supabase client not initialized', NotificationType.ERROR);
            return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            addNotification('Upload requires an active Supabase session. Please sign in again.', NotificationType.ERROR);
            return;
        }

        // Process each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const description = descriptions[i] || '';

            try {
                // Upload to Supabase Storage
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${patient.id}/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabase!.storage
                    .from('patient-attachments')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error('Error uploading file:', uploadError);
                    addNotification(`Failed to upload ${file.name}: ${uploadError.message}`, NotificationType.ERROR);
                    continue;
                }

                const attachmentData = {
                    patientId: patient.id,
                    filename: fileName,
                    originalFilename: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    // Store object path; signed URL is resolved at read-time.
                    fileUrl: filePath,
                    description: description
                };

                await addAttachment(attachmentData);
                addNotification(`${file.name} uploaded successfully`, NotificationType.SUCCESS);
            } catch (error) {
                console.error('Error processing file:', error);
                addNotification(`Failed to upload ${file.name}`, NotificationType.ERROR);
            }
        }
    };

    const handleDeleteAttachment = async (attachmentId: string) => {
        await deleteAttachment(attachmentId);
    };

    const handleViewAttachment = (attachment: PatientAttachment) => {
        if (attachment.fileType.startsWith('image/')) {
            const imageAttachments = patientAttachments.filter(att => att.fileType.startsWith('image/'));
            const index = imageAttachments.findIndex(att => att.id === attachment.id);
            setCurrentImageIndex(index);
            setImageViewerOpen(true);
        }
    };

    const handleImageViewerNavigate = (index: number) => {
        setCurrentImageIndex(index);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-40 p-3 sm:p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
                <header className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 flex justify-between items-center flex-shrink-0 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-primary dark:text-primary-light font-bold text-lg">
                                {patient.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white truncate">{patient.name}</h2>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{t('patientDetails.patientId')}: {patient.id.slice(-8)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <button
                            onClick={onEdit}
                            className="flex items-center px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                        >
                            <EditIcon />
                            <span className="hidden sm:inline">{t('common.edit')}</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                            aria-label={t('common.close')}
                        >
                            <CloseIcon />
                        </button>
                    </div>
                </header>

                <nav className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0 shadow-sm">
                    <ul className="-mb-px flex space-x-1 rtl:space-x-reverse overflow-x-auto px-2 sm:px-4 scrollbar-minimal">
                        {(() => {
                            const { isReceptionist } = usePermissions();
                            const allTabs = [
                                { key: 'details', label: 'patientDetails.tabDetails', icon: DetailsIcon },
                                { key: 'chart', label: 'patientDetails.tabDentalChart', icon: ChartIcon },
                                { key: 'treatments', label: 'patientDetails.tabTreatmentRecords', icon: TreatmentsIcon },
                                { key: 'prescriptions', label: 'patientDetails.tabPrescriptions', icon: PrescriptionsIcon },
                                { key: 'financials', label: 'patientDetails.tabFinancials', icon: FinancialsIcon },
                                { key: 'attachments', label: 'patientDetails.tabAttachments', icon: AttachmentsIcon }
                            ];
                            return allTabs.filter(tab => !isReceptionist || tab.key !== 'chart');
                        })().map(({ key, label, icon: Icon }) => (
                            <li key={key}>
                                <button
                                    onClick={() => setActiveTab(key as PatientDetailTab)}
                                    className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium rounded-t-lg transition-all duration-200 ${
                                        activeTab === key
                                            ? 'bg-primary text-white shadow-md'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    } focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-800`}
                                >
                                    <Icon />
                                    <span className="hidden sm:inline">{t(label)}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <main className="p-4 sm:p-6 overflow-y-auto flex-1 bg-neutral dark:bg-slate-900 scrollbar-modern">
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            {/* Personal Information Card */}
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {t('patientDetails.personalInformation')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">{t('patientDetails.dob')}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-800 dark:text-white">{patient.dob ? dateFormatter.format(new Date(patient.dob)) : t('common.noDate')}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">{t('patientDetails.gender')}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-800 dark:text-white">{t(patient.gender.toLowerCase() as 'male' | 'female' | 'other')}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">{t('patientDetails.phone')}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-800 dark:text-white">{patient.phone}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">{t('patientDetails.email')}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-800 dark:text-white">{patient.email || '-'}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg md:col-span-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">{t('patientDetails.address')}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-800 dark:text-white">{patient.address || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Medical Information Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                        {t('patientDetails.medicalHistory')}
                                    </h3>
                                    <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">{patient.medicalHistory || t('common.na')}</p>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        {t('patientDetails.allergies')}
                                    </h3>
                                    <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">{patient.allergies || t('common.na')}</p>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                        </svg>
                                        {t('patientDetails.currentMedications')}
                                    </h3>
                                    <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">{patient.medications || t('common.na')}</p>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {t('patientDetails.emergencyContact')}
                                    </h3>
                                    <div className="space-y-2">
                                        <p className="text-sm"><span className="font-medium text-slate-600">{t('patientDetails.emergencyContactName')}:</span> {patient.emergencyContactName || '-'}</p>
                                        <p className="text-sm"><span className="font-medium text-slate-600">{t('patientDetails.emergencyContactPhone')}:</span> {patient.emergencyContactPhone || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Insurance Card */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    {t('patientDetails.insurance')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('patientDetails.insuranceProvider')}</span>
                                        <p className="text-sm font-medium text-slate-800 mt-1">{patient.insuranceProvider || '-'}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('patientDetails.policyNumber')}</span>
                                        <p className="text-sm font-medium text-slate-800 mt-1">{patient.insurancePolicyNumber || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Notes Card */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    {t('patientDetails.unstructuredNotes')}
                                </h3>
                                {patient.treatmentNotes ? (
                                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-primary shadow-sm">
                                        <p className="text-slate-800 text-base whitespace-pre-wrap leading-relaxed font-medium">{patient.treatmentNotes}</p>
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-sm italic">{t('common.na')}</p>
                                )}
                            </div>

                            {/* Images Card */}
                            {patient.images && patient.images.length > 0 && (
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {t('patientDetails.patientImages')}
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {patient.images.map((image, index) => (
                                            <div key={index} className="relative group">
                                                <img src={image} alt={`${t('patientDetails.patientImage')} ${index + 1}`} className="w-full h-32 object-cover rounded-lg shadow-sm transition-transform duration-200 group-hover:scale-105" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Print Report Button */}
                            <div className="flex justify-end">
                                <button
                                    onClick={handlePrintFullReport}
                                    className="bg-slate-600 text-white px-6 py-3 rounded-lg hover:bg-slate-700 flex items-center gap-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 shadow-sm"
                                >
                                    <FileReportIcon />
                                    {t('common.print')} {t('patientReport.title')}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'chart' && (
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <DentalChart chartData={patient.dentalChart} onUpdate={handleUpdateDentalChart} />
                        </div>
                    )}

                    {activeTab === 'treatments' && (
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={() => setIsAddTreatmentModalOpen(true)}
                                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-light"
                                >
                                    <PlusIcon /> {t('patientDetails.addTreatmentRecord')}
                                </button>
                            </div>
                            <TreatmentRecordList patient={patient} clinicData={clinicData} onUpdateTreatmentRecord={async (patientId, record) => {
                                await clinicData.updateTreatmentRecord(patientId, record);
                            }} />
                        </div>
                    )}

                    {activeTab === 'prescriptions' && (
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={() => setIsAddPrescriptionModalOpen(true)}
                                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-light"
                                >
                                    <PlusIcon /> {t('patientDetails.addPrescription')}
                                </button>
                            </div>
                            <PrescriptionList
                                patients={[patient]}
                                prescriptions={prescriptions}
                                prescriptionItems={prescriptionItems}
                                dentists={dentists}
                                onUpdatePrescription={async (_patientId: string, prescription: import('../../types').Prescription) => {
                                    await updatePrescription(prescription);
                                }}
                                onDeletePrescription={async (prescriptionId: string) => {
                                    await deletePrescription(prescriptionId);
                                }}
                            />
                        </div>
                    )}
                    
                    {activeTab === 'financials' && (
                        <div className="space-y-6">
                            {/* Financial Sub-tabs */}
                            <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0 overflow-x-auto scrollbar-minimal">
                                {[
                                    { key: 'summary' as const, label: 'الملخص المالي', icon: DollarSignIcon },
                                    { key: 'payments' as const, label: 'سجل المدفوعات', icon: DollarSignIcon },
                                    { key: 'charges' as const, label: 'سجل الرسوم', icon: FileInvoiceIcon }
                                ].map(({ key, label, icon: Icon }) => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveFinancialTab(key)}
                                        className={`
                                            flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200
                                            ${activeFinancialTab === key
                                                ? 'text-primary border-b-2 border-primary bg-primary/5 dark:bg-slate-800'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                                            }
                                        `}
                                    >
                                        <span className={activeFinancialTab === key ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}>
                                            <Icon />
                                        </span>
                                        {label}
                                    </button>
                                ))}
                            </div>


                            {/* Financial Summary Tab */}
                            {activeFinancialTab === 'summary' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <FormSection title="نظرة عامة على الحساب" icon={<DollarSignIcon />} isDark={false}>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Total Charges Card */}
                                            <div className="bg-white dark:bg-slate-700 p-5 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 8v4m-4.003-4l-2.003 2.003m7.007-1.414L14.003 10m-3.414-1.414L9 5.586m4.003 2.828l3.004 3.004M9.879 16.121A3 3 0 1012.004 15H12v2.003V20m0-8c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('financials.totalCharges')}</p>
                                                        <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{currencyFormatter.format(financialSummary.totalCharges)}</p>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-600 rounded-full h-2">
                                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                                                </div>
                                            </div>

                                            {/* Total Paid Card */}
                                            <div className="bg-white dark:bg-slate-700 p-5 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('financials.totalPaid')}</p>
                                                        <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{currencyFormatter.format(financialSummary.totalPaid)}</p>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-600 rounded-full h-2">
                                                    <div 
                                                        className="bg-green-500 h-2 rounded-full" 
                                                        style={{ width: `${financialSummary.totalCharges > 0 ? (financialSummary.totalPaid / financialSummary.totalCharges) * 100 : 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Outstanding Balance Card */}
                                            <div className={`p-5 rounded-xl border shadow-sm ${
                                                financialSummary.outstandingBalance > 0
                                                    ? 'bg-white dark:bg-slate-700 border-red-200 dark:border-red-800'
                                                    : financialSummary.outstandingBalance < 0
                                                    ? 'bg-white dark:bg-slate-700 border-emerald-200 dark:border-emerald-800'
                                                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                                            }`}>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                        financialSummary.outstandingBalance > 0
                                                            ? 'bg-red-100 dark:bg-red-900/30'
                                                            : financialSummary.outstandingBalance < 0
                                                            ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                                            : 'bg-slate-100 dark:bg-slate-600'
                                                    }`}>
                                                        <svg className={`w-5 h-5 ${
                                                            financialSummary.outstandingBalance > 0
                                                                ? 'text-red-600 dark:text-red-400'
                                                                : financialSummary.outstandingBalance < 0
                                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                                : 'text-slate-600 dark:text-slate-400'
                                                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('financials.outstandingBalance')}</p>
                                                        <p className={`text-xl font-bold ${
                                                            financialSummary.outstandingBalance > 0
                                                                ? 'text-red-600 dark:text-red-400'
                                                                : financialSummary.outstandingBalance < 0
                                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                                : 'text-slate-800 dark:text-slate-200'
                                                        }`}>{currencyFormatter.format(financialSummary.outstandingBalance)}</p>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-600 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full ${
                                                            financialSummary.outstandingBalance > 0
                                                                ? 'bg-red-500'
                                                                : financialSummary.outstandingBalance < 0
                                                                ? 'bg-emerald-500'
                                                                : 'bg-slate-500'
                                                        }`}
                                                        style={{ width: `${financialSummary.totalCharges > 0 ? Math.min((Math.abs(financialSummary.outstandingBalance) / financialSummary.totalCharges) * 100, 100) : 0}%` }}
                                                    ></div>
                                                </div>
                                                <p className={`text-xs mt-2 font-medium ${
                                                    financialSummary.outstandingBalance > 0
                                                        ? 'text-red-600 dark:text-red-400'
                                                        : financialSummary.outstandingBalance < 0
                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                        : 'text-slate-500 dark:text-slate-400'
                                                }`}>
                                                    {financialSummary.outstandingBalance > 0 ? t('financials.amountDue') :
                                                     financialSummary.outstandingBalance < 0 ? t('financials.overpaid') : t('financials.paidInFull')}
                                                </p>
                                            </div>
                                        </div>
                                    </FormSection>

                                    <FormSection title="الإجراءات السريعة" icon={<PlusIcon />} isDark={false}>
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                onClick={() => setIsAddPaymentModalOpen(true)}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm hover:shadow-md"
                                            >
                                                <DollarSignIcon />
                                                {t('financials.addPayment')}
                                            </button>
                                            {checkCustomPermission(Permission.FINANCE_DISCOUNT_ADD) && (
                                                <button
                                                    onClick={() => setIsAddDiscountModalOpen(true)}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-sm hover:shadow-md"
                                                >
                                                    <PercentIcon />
                                                    {t('financials.addDiscount')}
                                                </button>
                                            )}
                                            <button
                                                onClick={handlePrintInvoice}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500/50 shadow-sm hover:shadow-md"
                                            >
                                                <FileInvoiceIcon />
                                                {t('patientInvoice.title')}
                                            </button>
                                        </div>
                                    </FormSection>
                                </div>
                            )}


                            {/* Payments Tab */}
                            {activeFinancialTab === 'payments' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <FormSection title="سجل المدفوعات" icon={<DollarSignIcon />} isDark={false}>
                                        {patientPayments.length === 0 ? (
                                            <div className="text-center py-12 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <DollarSignIcon />
                                                </div>
                                                <p className="text-slate-500 dark:text-slate-400 font-medium">{t('financials.noPayments')}</p>
                                                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">لم يتم تسجيل أي مدفوعات لهذا المريض</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-modern">
                                                {patientPayments.map(payment => (
                                                    <div key={payment.id} className="bg-white dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow duration-200">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                                                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 8v4m-4.003-4l-2.003 2.003m7.007-1.414L14.003 10m-3.414-1.414L9 5.586m4.003 2.828l3.004 3.004M9.879 16.121A3 3 0 1012.004 15H12v2.003V20m0-8c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-slate-800 dark:text-slate-200">{t(`paymentMethod.${payment.method}`)}</p>
                                                                        <p className="text-sm text-slate-500 dark:text-slate-400">{dateFormatter.format(new Date(payment.date))}</p>
                                                                    </div>
                                                                </div>
                                                                {payment.notes && (
                                                                    <div className="mt-2 bg-slate-50 dark:bg-slate-600/50 p-3 rounded-lg">
                                                                        <p className="text-sm text-slate-600 dark:text-slate-300">{payment.notes}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-bold">
                                                                    +{currencyFormatter.format(payment.amount)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </FormSection>
                                </div>
                            )}


                            {/* Charges Tab */}
                            {activeFinancialTab === 'charges' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <FormSection title="سجل الرسوم والعلاجات" icon={<FileInvoiceIcon />} isDark={false}>
                                        {patientTreatmentRecords.length === 0 ? (
                                            <div className="text-center py-12 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <FileInvoiceIcon />
                                                </div>
                                                <p className="text-slate-500 dark:text-slate-400 font-medium">{t('financials.noCharges')}</p>
                                                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">لم يتم تسجيل أي علاجات لهذا المريض</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-modern">
                                                {patientTreatmentRecords.map(record => {
                                                    const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === record.treatmentDefinitionId);
                                                    const totalCost = record.doctorShare + record.clinicShare;
                                                    return (
                                                        <div key={record.id} className="bg-white dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow duration-200">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6 4h8a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                            </svg>
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-slate-800 dark:text-slate-200">{treatmentDef?.name || t('common.unknownTreatment')}</p>
                                                                            <p className="text-sm text-slate-500 dark:text-slate-400">{dateFormatter.format(new Date(record.treatmentDate))}</p>
                                                                        </div>
                                                                    </div>
                                                                    {record.affectedTeeth && record.affectedTeeth.length > 0 && (
                                                                        <div className="flex items-center gap-2 mt-2 mb-2">
                                                                            <span className="text-xs text-slate-500 dark:text-slate-400">الأسنان المعالجة:</span>
                                                                            <div className="flex gap-1">
                                                                                {record.affectedTeeth.map(tooth => (
                                                                                    <span key={tooth} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded text-xs">
                                                                                        {tooth}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {record.notes && (
                                                                        <div className="mt-2 bg-slate-50 dark:bg-slate-600/50 p-3 rounded-lg">
                                                                            <p className="text-sm text-slate-600 dark:text-slate-300">{record.notes.slice(0, 150)}{record.notes.length > 150 ? '...' : ''}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-bold">
                                                                        {currencyFormatter.format(totalCost)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </FormSection>
                                </div>
                            )}

                        </div>
                    )}
                    
                    {activeTab === 'attachments' && (
                        <PatientAttachments
                            patient={patient}
                            attachments={patientAttachments}
                            onUpload={handleUploadAttachments}
                            onDelete={handleDeleteAttachment}
                            onView={handleViewAttachment}
                        />
                    )}
                </main>
            </div>

            {isAddTreatmentModalOpen && (
                <AddTreatmentRecordModal
                    patientId={patient.id}
                    onClose={() => setIsAddTreatmentModalOpen(false)}
                    onAdd={handleAddTreatmentRecord}
                    clinicData={clinicData}
                />
            )}
            {isAddPaymentModalOpen && (
                <AddPaymentModal
                    patientId={patient.id}
                    clinicData={clinicData}
                    onClose={() => setIsAddPaymentModalOpen(false)}
                    onAdd={handleAddPayment}
                />
            )}
            {isAddDiscountModalOpen && (
                <AddDiscountModal
                    patientId={patient.id}
                    clinicData={clinicData}
                    onClose={() => setIsAddDiscountModalOpen(false)}
                    onAdd={handleAddPayment} // Discount is added as a payment with method 'Discount'
                />
            )}
            {isAddPrescriptionModalOpen && (
                <AddEditPrescriptionModal
                    patient={patient}
                    dentists={dentists}
                    onClose={() => setIsAddPrescriptionModalOpen(false)}
                    onSave={handleAddPrescription}
                />
            )}
            
            {/* Image Viewer Modal */}
            <ImageViewerModal
                attachments={patientAttachments.filter(att => att.fileType.startsWith('image/'))}
                currentIndex={currentImageIndex}
                isOpen={imageViewerOpen}
                onClose={() => setImageViewerOpen(false)}
                onNavigate={handleImageViewerNavigate}
            />
        </div>
    );
};
