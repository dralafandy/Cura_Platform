import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { Patient, DentalChartData, Payment, NotificationType, PatientDetailTab, TreatmentRecord, ToothStatus, Prescription, PrescriptionItem, Dentist, PatientAttachment } from '../../types';
import DentalChart from '../DentalChartRedesigned';
import TreatmentRecordList from './TreatmentRecordList';
import AddTreatmentRecordModal from './AddTreatmentRecordModal';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import AddPaymentModal from './AddPaymentModal';
import AddDiscountModal from './AddDiscountModal';
import EditPaymentModal from './EditPaymentModal';
import DeletePaymentConfirmationModal from './DeletePaymentConfirmationModal';
import { openPrintWindow } from '../../utils/print';
import PatientInvoice from './PatientInvoice';
import PatientFullReport from './PatientFullReport';
import PatientAttachments from './PatientAttachments';
import PrescriptionList from './PrescriptionList';
import AddEditPrescriptionModal from './AddEditPrescriptionModal';
import AddEditPatientModal from './AddEditPatientModal';
import ImageViewerModal from './ImageViewerModal';
import { supabase } from '../../supabaseClient';

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
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const DollarSignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 8v4m-4.003-4l-2.003 2.003m7.007-1.414L14.003 10m-3.414-1.414L9 5.586m4.003 2.828l3.004 3.004M9.879 16.121A3 3 0 1012.004 15H12v2.003V20m0-8c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PercentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m-10.5 2.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm10.5 10.5a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>;
const FileInvoiceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const FileReportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

// Tab Icons
const DetailsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const ChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const TreatmentsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const PrescriptionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const FinancialsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 8v4m-4.003-4l-2.003 2.003m7.007-1.414L14.003 10m-3.414-1.414L9 5.586m4.003 2.828l3.004 3.004M9.879 16.121A3 3 0 1012.004 15H12v2.003V20m0-8c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const AttachmentsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;

// Info Card Component
const InfoCard: React.FC<{ icon: React.ReactNode; label: string; value: string; className?: string }> = ({ icon, label, value, className = '' }) => (
    <div className={`bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-100 dark:border-slate-600 transition-all duration-200 hover:shadow-md hover:border-primary/20 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
            <div className="text-primary">{icon}</div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-sm font-medium text-slate-800 dark:text-white">{value || '-'}</p>
    </div>
);

// Section Card Component
const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className = '' }) => (
    <div className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-600 transition-all duration-300 hover:shadow-md ${className}`}>
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
        </div>
        {children}
    </div>
);

export const PatientDetailsPanel: React.FC<{
    patient: Patient;
    onBack: () => void;
    onEdit: () => void;
    clinicData: ClinicData;
    initialTab?: PatientDetailTab;
}> = ({ patient, onBack, onEdit, clinicData, initialTab = 'details' }) => {
    const { user, currentClinic, accessibleClinics } = useAuth();
    const { t, locale } = useI18n();
    const { addNotification } = useNotification();
    const { updatePatient, addTreatmentRecord, addPayment, updatePayment, deletePayment, payments, treatmentRecords, prescriptions, prescriptionItems, addPrescription, updatePrescription, deletePrescription, addPrescriptionItem, updatePrescriptionItem, deletePrescriptionItem, attachments, addAttachment, updateAttachment, deleteAttachment } = clinicData;

    const [activeTab, setActiveTab] = useState<PatientDetailTab>('details');
    const [isAddTreatmentModalOpen, setIsAddTreatmentModalOpen] = useState(false);
    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
    const [isAddDiscountModalOpen, setIsAddDiscountModalOpen] = useState(false);
    const [isAddPrescriptionModalOpen, setIsAddPrescriptionModalOpen] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
    const [isDeletePaymentModalOpen, setIsDeletePaymentModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [dentists, setDentists] = useState<Dentist[]>([]);
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [insuranceDebtHint, setInsuranceDebtHint] = useState<{ totalAmount: number; count: number; companies: string[] }>({ totalAmount: 0, count: 0, companies: [] });
    const [insuranceDebtLoading, setInsuranceDebtLoading] = useState(false);
    const activeClinicId = useMemo(
        () => currentClinic?.id || accessibleClinics.find((c) => c.isDefault)?.clinicId || accessibleClinics[0]?.clinicId || null,
        [currentClinic, accessibleClinics]
    );
    
    // Patient insurance link state
    const [patientInsuranceLink, setPatientInsuranceLink] = useState<{
        insurance_company_id: string;
        insurance_company_name: string;
        coverage_percentage: number;
        policy_number: string;
        effective_date: string;
        expiry_date: string;
    } | null>(null);

    // Load patient insurance link
    useEffect(() => {
        const loadPatientInsurance = async () => {
            if (!supabase || !patient?.id) return;
            try {
                const { data, error } = await supabase
                    .from('patient_insurance_link')
                    .select('insurance_company_id, coverage_percentage, policy_number, effective_date, expiry_date, insurance_companies(name)')
                    .eq('patient_id', patient.id)
                    .single();
                
                if (data && !error) {
                    setPatientInsuranceLink({
                        insurance_company_id: data.insurance_company_id,
                        insurance_company_name: (data.insurance_companies as any)?.name || '',
                        coverage_percentage: data.coverage_percentage || 0,
                        policy_number: data.policy_number || '',
                        effective_date: data.effective_date || '',
                        expiry_date: data.expiry_date || ''
                    });
                }
            } catch (err) {
                console.error('Failed to load patient insurance:', err);
            }
        };
        void loadPatientInsurance();
    }, [patient?.id]);

    const loadInsuranceDebtHint = useCallback(async () => {
        if (!supabase || !patient?.id) return;
        try {
            setInsuranceDebtLoading(true);
            let query = supabase
                .from('treatment_insurance_link')
                .select('claim_amount, insurance_companies(name)')
                .eq('patient_id', patient.id)
                .eq('is_patient_debt', true)
                .in('claim_status', ['PENDING', 'APPROVED']);

            if (activeClinicId) {
                query = query.eq('clinic_id', activeClinicId);
            }

            const { data, error } = await query;
            if (error) throw error;

            const totalAmount = (data || []).reduce((sum: number, row: any) => sum + Number(row.claim_amount || 0), 0);
            const companies = Array.from(
                new Set((data || []).map((row: any) => (row.insurance_companies as any)?.name).filter(Boolean))
            ) as string[];

            setInsuranceDebtHint({
                totalAmount,
                count: (data || []).length,
                companies
            });
        } catch (err) {
            console.error('Failed to load insurance debt hint:', err);
            setInsuranceDebtHint({ totalAmount: 0, count: 0, companies: [] });
        } finally {
            setInsuranceDebtLoading(false);
        }
    }, [patient?.id, activeClinicId]);

    useEffect(() => {
        void loadInsuranceDebtHint();
    }, [loadInsuranceDebtHint]);

    useEffect(() => {
        if (!isAddPaymentModalOpen) {
            void loadInsuranceDebtHint();
        }
    }, [isAddPaymentModalOpen, loadInsuranceDebtHint]);

    useEffect(() => {
        setDentists(clinicData.dentists);
    }, [clinicData.dentists]);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

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
    const insuranceDebtDisplayAmount = Math.max(0, financialSummary.outstandingBalance);

    const handleUpdateDentalChart = useCallback((newChart: DentalChartData) => {
        console.log('PatientDetailsPanel: handleUpdateDentalChart called with:', newChart);
        console.log('PatientDetailsPanel: current patient dentalChart:', patient.dentalChart);
        const updatedPatient = { ...patient, dentalChart: newChart };
        updatePatient(updatedPatient);
        addNotification({ message: t('notifications.patientUpdated'), type: NotificationType.SUCCESS });
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
        addNotification({ message: t('notifications.treatmentAdded'), type: NotificationType.SUCCESS });

    }, [addTreatmentRecord, patient, updatePatient, addNotification, t, clinicData.treatmentDefinitions]);

    const handleAddPayment = useCallback((payment: Omit<Payment, 'id'>) => {
        addPayment(payment);
        setIsAddPaymentModalOpen(false);
        addNotification({ message: t('notifications.paymentAdded'), type: NotificationType.SUCCESS });

    }, [addPayment, addNotification, t]);

    const handleEditPayment = useCallback((payment: Payment) => {
        setSelectedPayment(payment);
        setIsEditPaymentModalOpen(true);
    }, []);

    const handleUpdatePayment = useCallback((payment: Payment) => {
        updatePayment(payment);
        setIsEditPaymentModalOpen(false);
        setSelectedPayment(null);
        addNotification({ message: t('notifications.paymentUpdated'), type: NotificationType.SUCCESS });

    }, [updatePayment, addNotification, t]);

    const handleDeletePayment = useCallback((payment: Payment) => {
        setSelectedPayment(payment);
        setIsDeletePaymentModalOpen(true);
    }, []);

    const handleConfirmDeletePayment = useCallback(() => {
            if (selectedPayment) {
                deletePayment(selectedPayment.id);
                setIsDeletePaymentModalOpen(false);
                setSelectedPayment(null);
        addNotification({ message: t('notifications.paymentDeleted'), type: NotificationType.SUCCESS });

            }
        }, [selectedPayment, deletePayment, addNotification, t]);
    
        const handleDeleteTreatmentRecord = useCallback((recordId: string) => {
            clinicData.deleteTreatmentRecord(recordId);
        addNotification({ message: t('treatmentDelete.deletedSuccessfully'), type: NotificationType.SUCCESS });

        }, [clinicData, addNotification, t]);

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
                const { id, prescriptionId, userId, createdAt, updatedAt, ...itemData } = item;
                await addPrescriptionItem(newPrescription.id, itemData);
            }
        }

        setIsAddPrescriptionModalOpen(false);
        addNotification({ message: t('notifications.prescriptionAdded'), type: NotificationType.SUCCESS });

    }, [patient.id, addPrescription, addPrescriptionItem, addNotification, t]);

    // Load attachments for this patient
    const patientAttachments = useMemo(() => {
        return attachments.filter(att => att.patientId === patient.id);
    }, [attachments, patient.id]);

    // Real attachment functions
    const handleUploadAttachments = async (files: File[], descriptions: string[]) => {
        console.log('Uploading attachments:', files, descriptions);

        if (!supabase) {
        addNotification({ message: 'Supabase client not initialized', type: NotificationType.ERROR });

            return;
        }

        // Check if user is authenticated
        if (!user) {
        addNotification({ message: 'User not authenticated', type: NotificationType.ERROR });

            return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
        addNotification({ message: 'Upload requires an active Supabase session. Please sign in again.', type: NotificationType.ERROR });

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
                    addNotification({ message: `Failed to upload ${file.name}: ${uploadError.message}`, type: NotificationType.ERROR });

                    continue;
                }

                const now = new Date().toISOString();
                const attachmentData = {
                    patientId: patient.id,
                    filename: fileName,
                    originalFilename: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    // Store object path; signed URL is resolved at read-time.
                    fileUrl: filePath,
                    description: description,
                    uploadedBy: user.id, // Use the authenticated user's ID
                    createdAt: now,
                    updatedAt: now
                };

                await addAttachment(attachmentData);
                addNotification({ message: `${file.name} uploaded successfully`, type: NotificationType.SUCCESS });

            } catch (error) {
                console.error('Error processing file:', error);
            addNotification({ message: `Failed to upload ${file.name}`, type: NotificationType.ERROR });

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

    const handleSavePatient = useCallback((patientData: Patient | Omit<Patient, 'id' | 'dentalChart'>) => {
        updatePatient(patientData as Patient);
        setShowEditModal(false);
        addNotification({ message: t('notifications.patientUpdated'), type: NotificationType.SUCCESS });
    }, [updatePatient, addNotification, t]);


    const { isReceptionist } = usePermissions();
    
    const tabs = [
        { key: 'details', label: 'patientDetails.tabDetails', icon: DetailsIcon },
        ...(!isReceptionist ? [{ key: 'chart', label: 'patientDetails.tabDentalChart', icon: ChartIcon }] : []),
        { key: 'treatments', label: 'patientDetails.tabTreatmentRecords', icon: TreatmentsIcon },
        { key: 'prescriptions', label: 'patientDetails.tabPrescriptions', icon: PrescriptionsIcon },
        { key: 'financials', label: 'patientDetails.tabFinancials', icon: FinancialsIcon },
        { key: 'attachments', label: 'patientDetails.tabAttachments', icon: AttachmentsIcon }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 overflow-x-hidden">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 min-w-0 gap-2">
                        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                            <button 
                                onClick={onBack} 
                                className="flex items-center gap-2 px-2.5 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300 shrink-0"
                            >
                                <BackIcon />
                                <span className="hidden sm:inline">{t('common.back')}</span>
                            </button>
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-primary-600 rounded-xl flex items-center justify-center shadow-md shrink-0">
                                    <span className="text-white font-bold text-lg">
                                        {patient.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-base sm:text-xl font-bold text-slate-800 dark:text-white truncate">{patient.name}</h1>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="flex items-center gap-2 px-2.5 sm:px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-600 text-sm font-medium transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <EditIcon />
                                <span className="hidden sm:inline">{t('common.edit')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-16 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <ul className="flex flex-nowrap gap-1 sm:gap-2 overflow-x-auto scrollbar-minimal">
                        {tabs.map(({ key, label, icon: Icon }) => (
                            <li key={key}>
                                <button
                                    onClick={() => setActiveTab(key as PatientDetailTab)}
                                    className={`inline-flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                                        activeTab === key
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-500'
                                    }`}
                                >
                                    <Icon />
                                    {t(label)}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                <div className="animate-fade-in">
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            {/* Personal Information Card */}
                            <SectionCard 
                                title={t('patientDetails.personalInformation')} 
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <InfoCard 
                                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                                        label={t('patientDetails.dob')}
                                        value={patient.dob ? dateFormatter.format(new Date(patient.dob)) : t('common.noDate')}
                                    />
                                    <InfoCard 
                                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                                        label={t('patientDetails.gender')}
                                        value={t(patient.gender.toLowerCase() as 'male' | 'female' | 'other')}
                                    />
                                    <InfoCard 
                                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                                        label={t('patientDetails.phone')}
                                        value={patient.phone}
                                    />
                                    <InfoCard 
                                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                                        label={t('patientDetails.email')}
                                        value={patient.email || '-'}
                                    />
                                    <InfoCard 
                                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                                        label={t('patientDetails.address')}
                                        value={patient.address || '-'}
                                        className="md:col-span-2"
                                    />
                                </div>
                            </SectionCard>

                            {/* Medical Information Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <SectionCard 
                                    title={t('patientDetails.medicalHistory')}
                                    icon={<svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
                                >
                                    <div className="bg-red-50/50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                                        <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{patient.medicalHistory || t('common.na')}</p>
                                    </div>
                                </SectionCard>

                                <SectionCard 
                                    title={t('patientDetails.allergies')}
                                    icon={<svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>}
                                >
                                    <div className="bg-orange-50/50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30">
                                        <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{patient.allergies || t('common.na')}</p>
                                    </div>
                                </SectionCard>

                                <SectionCard 
                                    title={t('patientDetails.currentMedications')}
                                    icon={<svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                                >
                                    <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                        <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{patient.medications || t('common.na')}</p>
                                    </div>
                                </SectionCard>

                                <SectionCard 
                                    title={t('patientDetails.emergencyContact')}
                                    icon={<svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('patientDetails.emergencyContactName')}</p>
                                                <p className="text-sm font-medium text-slate-800 dark:text-white">{patient.emergencyContactName || '-'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('patientDetails.emergencyContactPhone')}</p>
                                                <p className="text-sm font-medium text-slate-800 dark:text-white">{patient.emergencyContactPhone || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </SectionCard>
                            </div>

                            {/* Insurance Card */}
                            <SectionCard 
                                title={t('patientDetails.insurance')}
                                icon={<svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                            >
                                {patientInsuranceLink ? (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <InfoCard 
                                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                                                label={t('patientDetails.insuranceProvider')}
                                                value={patientInsuranceLink.insurance_company_name}
                                            />
                                            <InfoCard 
                                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
                                                label={t('patientDetails.policyNumber')}
                                                value={patientInsuranceLink.policy_number || '-'}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <InfoCard 
                                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>}
                                                label="نسبة التغطية"
                                                value={`${patientInsuranceLink.coverage_percentage}%`}
                                            />
                                            <InfoCard 
                                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                                                label="تاريخ الانتهاء"
                                                value={patientInsuranceLink.expiry_date ? new Date(patientInsuranceLink.expiry_date).toLocaleDateString('ar-EG') : '-'}
                                            />
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <button
                                                onClick={() => window.location.href = `/insurance/patient-links?patientId=${patient.id}`}
                                                className="text-sm text-primary hover:text-primary-600 dark:hover:text-primary-400 font-medium flex items-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                                تعديل التأمين
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">{t('common.na')}</p>
                                        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">لم يتم ربط المريض بشركة تأمين</p>
                                    </div>
                                )}
                            </SectionCard>

                            {/* Notes Card */}
                            <SectionCard 
                                title={t('patientDetails.unstructuredNotes')}
                                icon={<svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                            >
                                {patient.treatmentNotes ? (
                                    <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-5 rounded-xl border-l-4 border-primary shadow-sm">
                                        <p className="text-slate-800 dark:text-white text-base whitespace-pre-wrap leading-relaxed font-medium">{patient.treatmentNotes}</p>
                                    </div>
                                ) : (
                                    <p className="text-slate-500 dark:text-slate-400 text-sm italic bg-slate-50 dark:bg-slate-700 p-4 rounded-xl">{t('common.na')}</p>
                                )}
                            </SectionCard>

                            {/* Images Card */}
                            {patient.images && patient.images.length > 0 && (
                                <SectionCard 
                                    title={t('patientDetails.patientImages')}
                                    icon={<svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {patient.images.map((image, index) => (
                                            <div key={index} className="relative group">
                                                <img src={image} alt={`${t('patientDetails.patientImage')} ${index + 1}`} className="w-full h-32 object-cover rounded-xl shadow-sm transition-all duration-300 group-hover:shadow-lg group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl" />
                                            </div>
                                        ))}
                                    </div>
                                </SectionCard>
                            )}

                            {/* Print Report Button */}
                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handlePrintFullReport}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                                >
                                    <FileReportIcon />
                                    {t('common.print')} {t('patientReport.title')}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'chart' && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <DentalChart chartData={patient.dentalChart} onUpdate={handleUpdateDentalChart} />
                        </div>
                    )}

                    {activeTab === 'treatments' && (
                        <div className="space-y-6">
                            {/* Treatment Records Section */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">{t('patientDetails.tabTreatmentRecords')}</h3>
                                    </div>
                                    <button
                                        onClick={() => setIsAddTreatmentModalOpen(true)}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-600 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium w-full sm:w-auto"
                                    >
                                        <PlusIcon /> {t('patientDetails.addTreatmentRecord')}
                                    </button>
                                </div>
                                <div className="bg-white dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                                    <TreatmentRecordList
                                        patient={patient}
                                        clinicData={clinicData}
                                        onUpdateTreatmentRecord={async (patientId, record) => {
                                            await clinicData.updateTreatmentRecord(patientId, record);
                                        }}
                                        onDeleteTreatmentRecord={handleDeleteTreatmentRecord}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'prescriptions' && (
                        <div className="space-y-6">
                            {/* Prescriptions Section */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">{t('patientDetails.tabPrescriptions')}</h3>
                                    </div>
                                    <button
                                        onClick={() => setIsAddPrescriptionModalOpen(true)}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-600 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium w-full sm:w-auto"
                                    >
                                        <PlusIcon /> {t('patientDetails.addPrescription')}
                                    </button>
                                </div>
                                <div className="bg-white dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
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
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'financials' && (
                        <div className="space-y-6">
                            {/* Financial Summary Section */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 8v4m-4.003-4l-2.003 2.003m7.007-1.414L14.003 10m-3.414-1.414L9 5.586m4.003 2.828l3.004 3.004M9.879 16.121A3 3 0 1012.004 15H12v2.003V20m0-8c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">{t('financials.summary')}</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-300">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 8v4m-4.003-4l-2.003 2.003m7.007-1.414L14.003 10m-3.414-1.414L9 5.586m4.003 2.828l3.004 3.004M9.879 16.121A3 3 0 1012.004 15H12v2.003V20m0-8c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('financials.totalCharges')}</span>
                                        </div>
                                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{currencyFormatter.format(financialSummary.totalCharges)}</p>
                                    </div>

                                    <div className="bg-white dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-300">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('financials.totalPaid')}</span>
                                        </div>
                                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{currencyFormatter.format(financialSummary.totalPaid)}</p>
                                    </div>

                                    <div className={`bg-white dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`p-2 rounded-lg ${
                                                financialSummary.outstandingBalance > 0
                                                    ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300'
                                                    : financialSummary.outstandingBalance < 0
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300'
                                                    : 'bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                                            }`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                            </div>
                                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('financials.outstandingBalance')}</span>
                                        </div>
                                        <p className={`text-2xl font-bold ${
                                            financialSummary.outstandingBalance > 0
                                                ? 'text-red-600 dark:text-red-400'
                                                : financialSummary.outstandingBalance < 0
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-slate-800 dark:text-white'
                                        }`}>{currencyFormatter.format(financialSummary.outstandingBalance)}</p>
                                        <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">
                                            {financialSummary.outstandingBalance > 0 ? t('financials.amountDue') :
                                             financialSummary.outstandingBalance < 0 ? t('financials.overpaid') : t('financials.paidInFull')}
                                        </p>
                                    </div>
                                </div>

                                {insuranceDebtHint.count > 0 && insuranceDebtDisplayAmount > 0 && (
                                    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                                                    تنبيه تأمين
                                                </p>
                                                <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                                                    المبلغ المتبقي يشمل مبلغًا يخص شركة التأمين
                                                    {insuranceDebtHint.companies.length > 0 ? ` (${insuranceDebtHint.companies.join('، ')})` : ''}:
                                                    {' '}
                                                    <span className="font-bold">{currencyFormatter.format(insuranceDebtDisplayAmount)}</span>
                                                </p>
                                                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                                                    سيتم تسوية هذا المبلغ تلقائيًا عند تحويل المطالبة إلى حالة مدفوعة.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => void loadInsuranceDebtHint()}
                                                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors disabled:opacity-60"
                                                disabled={insuranceDebtLoading}
                                            >
                                                {insuranceDebtLoading ? 'جاري التحديث...' : 'تحديث'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons Section */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">{t('financials.actions')}</h3>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => setIsAddPaymentModalOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-medium"
                                    >
                                        <DollarSignIcon /> {t('financials.addPayment')}
                                    </button>
                                    <button
                                        onClick={() => setIsAddDiscountModalOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-medium"
                                    >
                                        <PercentIcon /> {t('financials.addDiscount')}
                                    </button>
                                    <button
                                        onClick={handlePrintInvoice}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm font-medium"
                                    >
                                        <FileInvoiceIcon /> {t('patientInvoice.title')}
                                    </button>
                                </div>
                            </div>

                            {/* Transactions List Section */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">{t('financials.transactions')}</h3>
                                </div>
                                <div className="bg-white dark:bg-slate-700 p-4 rounded-xl max-h-96 overflow-y-auto scrollbar-modern border border-slate-200 dark:border-slate-600">
                                    {patientPayments.length === 0 && patientTreatmentRecords.length === 0 ? (
                                        <div className="text-center py-8">
                                            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                            <p className="text-slate-500 dark:text-slate-400">{t('financials.noTransactions')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {/* Display payments first */}
                                            {patientPayments.map(payment => (
                                                <div key={payment.id} className="bg-slate-50 dark:bg-slate-600 p-4 rounded-xl border border-slate-200 dark:border-slate-500 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 transition-all duration-200 hover:shadow-sm">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-lg">{t('financials.payment')}</span>
                                                            <span className="text-sm text-slate-500 dark:text-slate-400 truncate">{t(`paymentMethod.${payment.method}`)}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-300">
                                                            {dateFormatter.format(new Date(payment.date))}
                                                            {payment.notes && <span className="ml-2 pl-2 border-l border-slate-300 dark:border-slate-500 text-slate-500 dark:text-slate-400">{payment.notes}</span>}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3 self-end sm:self-auto">
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">{currencyFormatter.format(payment.amount)}</span>
                                                        <button
                                                            onClick={() => handleEditPayment(payment)}
                                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200"
                                                            title={t('common.edit')}
                                                        >
                                                            <EditIcon />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePayment(payment)}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                                                            title={t('common.delete')}
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Then display charges (treatment records) */}
                                            {patientTreatmentRecords.map(record => {
                                                const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === record.treatmentDefinitionId);
                                                return (
                                                    <div key={record.id} className="bg-slate-50 dark:bg-slate-600 p-4 rounded-xl border border-slate-200 dark:border-slate-500 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 transition-all duration-200 hover:shadow-sm">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-lg">{t('financials.charge')}</span>
                                                                <span className="font-medium text-slate-800 dark:text-white truncate">{treatmentDef?.name || t('common.unknownTreatment')}</span>
                                                            </div>
                                                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                                                {dateFormatter.format(new Date(record.treatmentDate))}
                                                                {record.notes && <span className="ml-2 pl-2 border-l border-slate-300 dark:border-slate-500 text-slate-500 dark:text-slate-400">{record.notes.slice(0, 50)}{t('common.ellipsis')}</span>}
                                                            </p>
                                                        </div>
                                                        <span className="font-bold text-blue-600 dark:text-blue-400 text-lg self-end sm:self-auto">{currencyFormatter.format(record.doctorShare + record.clinicShare)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
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
                </div>
            </main>

            {/* Modals */}
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
                    onAdd={handleAddPayment}
                    onUpdateTreatmentRecord={clinicData.updateTreatmentRecord}
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

            {showEditModal && (
                <AddEditPatientModal
                    patient={patient}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleSavePatient}
                />
            )}

            {isEditPaymentModalOpen && selectedPayment && (
                <EditPaymentModal
                    patientId={patient.id}
                    payment={selectedPayment}
                    clinicData={clinicData}
                    onClose={() => {
                        setIsEditPaymentModalOpen(false);
                        setSelectedPayment(null);
                    }}
                    onUpdate={handleUpdatePayment}
                />
            )}

            {isDeletePaymentModalOpen && selectedPayment && (
                <DeletePaymentConfirmationModal
                    payment={selectedPayment}
                    onConfirm={handleConfirmDeletePayment}
                    onCancel={() => {
                        setIsDeletePaymentModalOpen(false);
                        setSelectedPayment(null);
                    }}
                />
            )}
        </div>
    );
};
