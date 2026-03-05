import React, { useCallback, useState, useEffect } from 'react';
import {
    Patient, Dentist, Appointment, DentalChartData, ToothStatus,
    Supplier, InventoryItem, Expense, TreatmentDefinition, TreatmentRecord,
    LabCase, Payment, SupplierInvoice, SupplierInvoiceStatus, ExpenseCategory, NotificationType, NotificationPriority, DoctorPayment, Prescription, PrescriptionItem, PatientAttachment, SupplierInvoiceAttachment, PaymentMethod, Clinic, TreatmentDoctorPercentage
} from '../types';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { applyBranchSession } from '../services/branchSessionService';

const createEmptyChart = (): DentalChartData => {
    const chart: DentalChartData = {};
    const quadrants = ['UR', 'UL', 'LL', 'LR'];
    quadrants.forEach(q => {
        for (let i = 1; i <= 8; i++) {
            chart[`${q}${i}`] = { status: ToothStatus.HEALTHY, notes: '' };
        }
    });
    return chart;
};

export interface ClinicInfo {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string; // Base64 encoded logo image for local storage
}

export interface ClinicData {
    patients: Patient[];
    addPatient: (patient: Omit<Patient, 'id' | 'dentalChart'>) => Promise<void>;
    updatePatient: (patient: Patient) => Promise<void>;
    deletePatient: (id: string) => Promise<void>;
    dentists: Dentist[];
    addDoctor: (doctor: Omit<Dentist, 'id'>) => Promise<void>;
    updateDoctor: (doctor: Dentist) => Promise<void>;
    deleteDoctor: (id: string) => Promise<void>;
    appointments: Appointment[];
    addAppointment: (appointment: Omit<Appointment, 'id' | 'reminderSent' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateAppointment: (appointment: Appointment) => Promise<void>;
    deleteAppointment: (id: string) => Promise<void>;
    suppliers: Supplier[];
    addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
    updateSupplier: (supplier: Supplier) => Promise<void>;
    deleteSupplier: (id: string) => Promise<void>;
    inventoryItems: InventoryItem[];
    addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
    updateInventoryItem: (item: InventoryItem) => Promise<void>;
    deleteInventoryItem: (id: string) => Promise<void>;
    expenses: Expense[];
    addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
    updateExpense: (expense: Expense) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
    treatmentDefinitions: TreatmentDefinition[];
    treatmentDoctorPercentages: TreatmentDoctorPercentage[];
    getTreatmentPercentages: (treatmentDefinitionId: string, dentistId?: string | null) => { doctorPercentage: number; clinicPercentage: number; isCustom: boolean };
    upsertTreatmentDoctorPercentage: (data: Omit<TreatmentDoctorPercentage, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    deleteTreatmentDoctorPercentage: (id: string) => Promise<void>;
    addTreatmentDefinition: (def: Omit<TreatmentDefinition, 'id'>) => Promise<void>;
    updateTreatmentDefinition: (def: TreatmentDefinition) => Promise<void>;
    deleteTreatmentDefinition: (id: string) => Promise<void>;
    treatmentRecords: TreatmentRecord[];
    addTreatmentRecord: (patientId: string, record: Omit<TreatmentRecord, 'id' | 'patientId'>) => Promise<void>;
    updateTreatmentRecord: (patientId: string, record: TreatmentRecord) => Promise<void>;
    deleteTreatmentRecord: (id: string) => Promise<void>;
    labCases: LabCase[];
    addLabCase: (labCase: Omit<LabCase, 'id'>) => Promise<void>;
    updateLabCase: (labCase: LabCase) => Promise<void>;
    deleteLabCase: (id: string) => Promise<void>;
    payments: Payment[];
    addPayment: (payment: Omit<Payment, 'id'>) => Promise<void>;
    updatePayment: (payment: Payment) => Promise<void>;
    deletePayment: (id: string) => Promise<void>;
    supplierInvoices: SupplierInvoice[];
    addSupplierInvoice: (invoice: Omit<SupplierInvoice, 'id' | 'payments'>) => Promise<void>;
    updateSupplierInvoice: (invoice: SupplierInvoice) => Promise<void>;
    deleteSupplierInvoice: (id: string) => Promise<void>;
    paySupplierInvoice: (invoice: SupplierInvoice) => Promise<void>;
    doctorPayments: DoctorPayment[];
    addDoctorPayment: (payment: Omit<DoctorPayment, 'id'>) => Promise<void>;
    updateDoctorPayment: (payment: DoctorPayment) => Promise<void>;
    deleteDoctorPayment: (id: string) => Promise<void>;
    prescriptions: Prescription[];
    addPrescription: (prescription: Omit<Prescription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<Prescription | undefined>;
    updatePrescription: (prescription: Prescription) => Promise<void>;
    deletePrescription: (id: string) => Promise<void>;
    prescriptionItems: PrescriptionItem[];
    addPrescriptionItem: (prescriptionId: string, item: Omit<PrescriptionItem, 'id' | 'prescriptionId' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updatePrescriptionItem: (item: PrescriptionItem) => Promise<void>;
    deletePrescriptionItem: (id: string) => Promise<void>;
    attachments: PatientAttachment[];
    addAttachment: (attachment: Omit<PatientAttachment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateAttachment: (attachment: PatientAttachment) => Promise<void>;
    deleteAttachment: (id: string) => Promise<void>;
    supplierInvoiceAttachments: SupplierInvoiceAttachment[];
    addSupplierInvoiceAttachment: (attachment: Omit<SupplierInvoiceAttachment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateSupplierInvoiceAttachment: (attachment: SupplierInvoiceAttachment) => Promise<void>;
    deleteSupplierInvoiceAttachment: (id: string) => Promise<void>;
    clinicInfo: ClinicInfo;
    updateClinicInfo: (info: ClinicInfo) => void;
    whatsappMessageTemplate: string;
    updateWhatsappMessageTemplate: (template: string) => void;
    reminderMessageTemplate: string;
    updateReminderMessageTemplate: (template: string) => void;
    whatsappPrescriptionTemplate: string;
    updateWhatsappPrescriptionTemplate: (template: string) => void;
    restoreData: (data: Partial<Omit<ClinicData, 'restoreData'>>) => void; // Kept for local restore, though less relevant now
    isLoading: boolean;
}

export const useClinicData = (): ClinicData => {
    const { user, isAdmin, currentClinic, currentBranch, accessibleClinics } = useAuth();
    const { addNotification } = useNotification();
    
    const [patients, setPatients] = useState<Patient[]>([]);
    const [dentists, setDentists] = useState<Dentist[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [treatmentDefinitions, setTreatmentDefinitions] = useState<TreatmentDefinition[]>([]);
    const [treatmentDoctorPercentages, setTreatmentDoctorPercentages] = useState<TreatmentDoctorPercentage[]>([]);
    const [treatmentRecords, setTreatmentRecords] = useState<TreatmentRecord[]>([]);
    const [labCases, setLabCases] = useState<LabCase[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([]);
    const [doctorPayments, setDoctorPayments] = useState<DoctorPayment[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
    const [attachments, setAttachments] = useState<PatientAttachment[]>([]);
    const [supplierInvoiceAttachments, setSupplierInvoiceAttachments] = useState<SupplierInvoiceAttachment[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Clinic settings state
    const [clinicInfo, setClinicInfo] = useState<ClinicInfo>({
        name: '',
        address: '',
        phone: '',
        email: ''
    });
    const [clinics, setClinics] = useState<Clinic[]>([]);

    console.log('useClinicData - user:', user);
    console.log('useClinicData - currentClinicId:', currentClinic?.id || null);
    const [whatsappMessageTemplate, setWhatsappMessageTemplate] = useState<string>(
        'مرحباً {patientName}، هذا تذكير من عيادة {clinicName} لطب الأسنان بموعدك يوم {appointmentDate} الساعة {appointmentTime}. نتطلع لرؤيتك.{doctorName}'
    );
    const [reminderMessageTemplate, setReminderMessageTemplate] = useState<string>(
        'مرحباً {patientName}، هذا تذكير من عيادة {clinicName} لطب الأسنان بموعدك يوم {appointmentDate} الساعة {appointmentTime}. مع الدكتور {doctorName} نتطلع لرؤيتك. {clinicAddress} للحجز و الإستعلام : {clinicPhone} شكراً لثقتك في {clinicName}'
    );
    const [whatsappPrescriptionTemplate, setWhatsappPrescriptionTemplate] = useState<string>(
        'الروشتة الطبية\n\nالمريض: {patientName}\nالتاريخ: {date}\nالدكتور: {dentist}\n\nالأدوية:\n{medications}\n\nالعيادة: {clinicName}'
    );

    const getTreatmentPercentages = useCallback((treatmentDefinitionId: string, dentistId?: string | null) => {
        const treatmentDef = treatmentDefinitions.find(td => td.id === treatmentDefinitionId);
        const fallbackDoctor = treatmentDef?.doctorPercentage || 0;
        const fallbackClinic = treatmentDef?.clinicPercentage || (1 - fallbackDoctor);

        if (!dentistId) {
            return {
                doctorPercentage: fallbackDoctor,
                clinicPercentage: fallbackClinic,
                isCustom: false
            };
        }

        const customRatio = treatmentDoctorPercentages.find(item =>
            item.treatmentDefinitionId === treatmentDefinitionId &&
            item.dentistId === dentistId
        );

        if (customRatio) {
            return {
                doctorPercentage: customRatio.doctorPercentage,
                clinicPercentage: customRatio.clinicPercentage,
                isCustom: true
            };
        }

        return {
            doctorPercentage: fallbackDoctor,
            clinicPercentage: fallbackClinic,
            isCustom: false
        };
    }, [treatmentDefinitions, treatmentDoctorPercentages]);

    const updateReminderMessageTemplate = (template: string) => {
        setReminderMessageTemplate(template);
        localStorage.setItem('curasoft_reminder_template', template);
        addNotification({
        message: 'Reminder message template updated successfully',
        type: NotificationType.SUCCESS,
        priority: NotificationPriority.LOW,
        title: 'Template Updated',
        read: false
    });
    };

    const updateWhatsappPrescriptionTemplate = (template: string) => {
        setWhatsappPrescriptionTemplate(template);
        localStorage.setItem('curasoft_prescription_template', template);
        addNotification({
            message: 'Prescription message template updated successfully',
            type: NotificationType.SUCCESS,
            priority: NotificationPriority.LOW,
            title: 'Template Updated',
            read: false
        });
    };


    // Get user's accessible clinic IDs
    const getUserClinicIds = useCallback(async (): Promise<string[]> => {
        if (!user || !supabase) return [];
        
        try {
            // Get user's clinics from user_clinics view
            const { data, error } = await supabase
                .from('user_clinics_view')
                .select('clinic_id')
                .eq('user_id', user.id)
                .eq('access_active', true);
            
            if (error) {
                console.warn('Error fetching user clinics:', error);
                // Fallback: if no clinics assigned, try to get from user_profiles
                return [];
            }
            
            return data?.map(row => row.clinic_id).filter(Boolean) || [];
        } catch (err) {
            console.warn('Error getting user clinic IDs:', err);
            return [];
        }
    }, [user, supabase]);

    const getActiveClinicContext = useCallback(async (): Promise<{ clinicId: string | null; branchId: string | null }> => {
        if (currentClinic?.id) {
            return { clinicId: currentClinic.id, branchId: currentBranch?.id || null };
        }

        const defaultAccess = accessibleClinics.find(c => c.isDefault) || accessibleClinics[0];
        if (defaultAccess?.clinicId) {
            return { clinicId: defaultAccess.clinicId, branchId: defaultAccess.branchId || null };
        }

        const userClinicIds = await getUserClinicIds();
        return { clinicId: userClinicIds[0] || null, branchId: null };
    }, [currentClinic, currentBranch, accessibleClinics, getUserClinicIds]);

    const requireActiveClinic = useCallback(async (resourceLabel: string): Promise<{ clinicId: string; branchId: string } | null> => {
        const context = await getActiveClinicContext();
        if (!context.clinicId) {
            addNotification(`Cannot add ${resourceLabel}: no active clinic is assigned to your account`, NotificationType.ERROR);
            return null;
        }
        let resolvedBranchId = context.branchId || null;
        if (!resolvedBranchId) {
            const defaultBranchAccess = accessibleClinics.find(c => c.clinicId === context.clinicId && c.isDefault && c.branchId);
            const firstBranchAccess = accessibleClinics.find(c => c.clinicId === context.clinicId && c.branchId);
            resolvedBranchId = defaultBranchAccess?.branchId || firstBranchAccess?.branchId || null;
        }
        if (!resolvedBranchId) {
            addNotification(`Cannot add ${resourceLabel}: select a branch first`, NotificationType.ERROR);
            return null;
        }
        await applyBranchSession(resolvedBranchId);
        return { clinicId: context.clinicId, branchId: resolvedBranchId };
    }, [getActiveClinicContext, addNotification, accessibleClinics]);

    const normalizePatientAttachmentPath = useCallback((rawUrl?: string | null): string => {
        if (!rawUrl) return '';
        const value = String(rawUrl).trim();
        if (!value) return '';

        const publicMarker = '/storage/v1/object/public/patient-attachments/';
        const signedMarker = '/storage/v1/object/sign/patient-attachments/';

        if (/^https?:\/\//i.test(value)) {
            const publicIdx = value.indexOf(publicMarker);
            const signedIdx = value.indexOf(signedMarker);
            if (publicIdx >= 0) {
                return decodeURIComponent(value.substring(publicIdx + publicMarker.length).split('?')[0]).replace(/^\/+/, '');
            }
            if (signedIdx >= 0) {
                return decodeURIComponent(value.substring(signedIdx + signedMarker.length).split('?')[0]).replace(/^\/+/, '');
            }
            // External URL (keep as-is for backward compatibility).
            return value;
        }

        return value.replace(/^\/+/, '');
    }, []);

    const resolvePatientAttachmentUrl = useCallback(async (rawUrl?: string | null): Promise<string> => {
        if (!supabase || !rawUrl) return rawUrl || '';
        const objectPath = normalizePatientAttachmentPath(rawUrl);
        if (!objectPath) return rawUrl || '';
        if (/^https?:\/\//i.test(objectPath)) return objectPath;

        const { data, error } = await supabase.storage
            .from('patient-attachments')
            .createSignedUrl(objectPath, 60 * 60);

        if (!error && data?.signedUrl) {
            return data.signedUrl;
        }

        return rawUrl;
    }, [supabase, normalizePatientAttachmentPath]);

    const fetchData = useCallback(async () => {
        if (!user || !supabase) {
            console.log('Cannot fetch data - user or supabase not available:', { user, supabase });
            setIsLoading(false);
            return;
        }

        console.log('Fetching data from all tables...');
        setIsLoading(true);
        await applyBranchSession(currentBranch?.id || null);

        // Get user's accessible clinic IDs for filtering
        const userClinicIds = await getUserClinicIds();
        console.log('User accessible clinic IDs:', userClinicIds);

        const activeClinicAccess = (accessibleClinics || []).filter((entry: any) =>
            Boolean(entry?.isActive && currentClinic?.id && entry.clinicId === currentClinic.id)
        );
        const hasClinicWideAccess = activeClinicAccess.some((entry: any) => !entry?.branchId);
        const accessibleBranchIds = Array.from(
            new Set(
                activeClinicAccess
                    .map((entry: any) => entry?.branchId)
                    .filter((id: any): id is string => Boolean(id))
            )
        );

        const tables = [
            'patients', 'dentists', 'appointments', 'suppliers', 'inventory_items',
            'expenses', 'treatment_definitions', 'treatment_records', 'lab_cases',
            'payments', 'supplier_invoices', 'doctor_payments', 'prescriptions', 'prescription_items',
            'patient_attachments', 'clinics', 'treatment_doctor_percentages'
        ];

        const clinicScopedTables = new Set<string>([
            'patients',
            'appointments',
            'treatment_definitions',
            'treatment_records',
            'treatment_doctor_percentages',
            'payments',
            'expenses',
            'suppliers',
            'inventory_items',
            'dentists',
        ]);
        const branchScopedTables = new Set<string>([
            'patients',
            'appointments',
            'treatment_definitions',
            'treatment_records',
            'treatment_doctor_percentages',
            'payments',
            'expenses',
            'suppliers',
            'inventory_items',
            'dentists',
        ]);

        // Build queries with clinic filtering where applicable
        const queries = tables.map((table: string) => {
            let query = supabase!.from(table).select('*');
            
            // Filter by clinic_id: use currentClinic for active clinic isolation
            if (currentClinic?.id && clinicScopedTables.has(table)) {
                // For active clinic, filter by current clinic only
                query = query.eq('clinic_id', currentClinic.id);
                if (currentBranch?.id && branchScopedTables.has(table)) {
                    query = query.eq('branch_id', currentBranch.id);
                } else if (!currentBranch?.id && branchScopedTables.has(table) && !hasClinicWideAccess) {
                    if (accessibleBranchIds.length > 0) {
                        query = query.in('branch_id', accessibleBranchIds);
                    } else {
                        query = query.limit(0);
                    }
                }
            } else if (userClinicIds.length > 0 && clinicScopedTables.has(table)) {
                // Fallback: if no currentClinic, use accessible clinics
                query = query.in('clinic_id', userClinicIds);
            } else if (userClinicIds.length > 0 && table === 'clinics') {
                // Clinics table uses its own PK id instead of clinic_id
                query = query.in('id', userClinicIds);
            } else if (userClinicIds.length > 0 && table === 'patient_attachments') {
                // For patient_attachments, we need to join with patients to filter by clinic
                // This will be handled separately after fetching
            } else if (userClinicIds.length === 0 && table === 'clinics') {
                // Do not expose all clinics when user has no clinic assignment.
                query = query.limit(0);
            }
            
            return query;
        });
        
        const results = await Promise.all(queries);

        const [
            patientsRes, dentistsRes, appointmentsRes, suppliersRes, inventoryItemsRes,
            expensesRes, treatmentDefsRes, treatmentRecordsRes, labCasesRes,
            paymentsRes, supplierInvoicesRes, doctorPaymentsRes, prescriptionsRes, prescriptionItemsRes, patientAttachmentsRes,
            clinicsRes, treatmentDoctorPercentagesRes
        ] = results;

        console.log('Data fetch results:', {
            patients: patientsRes.data?.length || 0,
            dentists: dentistsRes.data?.length || 0,
            appointments: appointmentsRes.data?.length || 0,
            suppliers: suppliersRes.data?.length || 0,
            inventoryItems: inventoryItemsRes.data?.length || 0,
            expenses: expensesRes.data?.length || 0,
            treatmentDefinitions: treatmentDefsRes.data?.length || 0,
            treatmentRecords: treatmentRecordsRes.data?.length || 0,
            labCases: labCasesRes.data?.length || 0,
            payments: paymentsRes.data?.length || 0,
            supplierInvoices: supplierInvoicesRes.data?.length || 0,
            doctorPayments: doctorPaymentsRes.data?.length || 0,
            prescriptions: prescriptionsRes.data?.length || 0,
            prescriptionItems: prescriptionItemsRes.data?.length || 0,
            patientAttachments: patientAttachmentsRes.data?.length || 0,
            clinics: clinicsRes.data?.length || 0,
            treatmentDoctorPercentages: treatmentDoctorPercentagesRes.data?.length || 0
        });

        if (patientsRes.data) {
            console.log('Setting patients data:', patientsRes.data.length);
            const formattedPatients = patientsRes.data.map((p: any) => ({
                id: p.id,
                name: p.name,
                dob: p.dob,
                gender: p.gender,
                phone: p.phone,
                email: p.email,
                address: p.address,
                medicalHistory: p.medical_history,
                treatmentNotes: p.treatment_notes,
                lastVisit: p.last_visit,
                allergies: p.allergies,
                medications: p.medications,
                insuranceProvider: p.insurance_provider,
                insurancePolicyNumber: p.insurance_policy_number,
                emergencyContactName: p.emergency_contact_name,
                emergencyContactPhone: p.emergency_contact_phone,
                dentalChart: p.dental_chart,
                images: p.images,
                attachments: p.attachments || []
            }));
            setPatients(formattedPatients);
        }
        if (dentistsRes.data) {
            console.log('Setting dentists data:', dentistsRes.data.length);
            setDentists(dentistsRes.data);
        }
        if (appointmentsRes.data) {
            console.log('Setting appointments data:', appointmentsRes.data.length);
            const formattedAppointments = appointmentsRes.data.map((a: any) => ({
                id: a.id,
                patientId: a.patient_id,
                dentistId: a.dentist_id,
                startTime: new Date(a.start_time),
                endTime: new Date(a.end_time),
                reason: a.reason,
                status: a.status,
                reminderTime: a.reminder_time,
                reminderSent: a.reminder_sent,
                userId: a.user_id,
                createdAt: a.created_at,
                updatedAt: a.updated_at
            }));
            setAppointments(formattedAppointments);
        }
        if (suppliersRes.data) {
            console.log('Setting suppliers data:', suppliersRes.data.length);
            setSuppliers(suppliersRes.data);
        }
        if (inventoryItemsRes.data) {
            console.log('Setting inventory items data:', inventoryItemsRes.data.length);
            const formattedInventoryItems = inventoryItemsRes.data.map((item: any) => ({
                id: item.id,
                name: item.name,
                description: item.description,
                supplierId: item.supplier_id,
                currentStock: item.current_stock,
                unitCost: item.unit_cost,
                minStockLevel: item.min_stock_level,
                expiryDate: item.expiry_date
            }));
            setInventoryItems(formattedInventoryItems);
        }
        let formattedExpenses: Expense[] = [];
        if (expensesRes.data) {
            console.log('Setting expenses data:', expensesRes.data.length);
            formattedExpenses = expensesRes.data.map((expense: any) => ({
                id: expense.id,
                date: expense.date,
                description: expense.description,
                amount: Number(expense.amount) || 0,
                category: expense.category,
                supplierId: expense.supplier_id,
                supplierInvoiceId: expense.supplier_invoice_id,
                method: expense.method,
                expenseReceiptImageUrl: expense.expense_receipt_image_url
            }));
            setExpenses(formattedExpenses);
        }
        if (treatmentDefsRes.data) {
            console.log('Setting treatment definitions data:', treatmentDefsRes.data.length);
            const formattedTreatmentDefinitions = treatmentDefsRes.data.map((def: any) => ({
                id: def.id,
                name: def.name,
                description: def.description,
                basePrice: Number(def.base_price) || 0,
                doctorPercentage: Number(def.doctor_percentage) || 0,
                clinicPercentage: Number(def.clinic_percentage) || 0
            }));
            setTreatmentDefinitions(formattedTreatmentDefinitions);
        }
        if (treatmentDoctorPercentagesRes.data) {
            console.log('Setting treatment doctor percentages data:', treatmentDoctorPercentagesRes.data.length);
            const formattedCustomPercentages = treatmentDoctorPercentagesRes.data.map((item: any) => ({
                id: item.id,
                treatmentDefinitionId: item.treatment_definition_id,
                dentistId: item.dentist_id,
                doctorPercentage: Number(item.doctor_percentage) || 0,
                clinicPercentage: Number(item.clinic_percentage) || 0,
                userId: item.user_id,
                createdAt: item.created_at,
                updatedAt: item.updated_at
            }));
            setTreatmentDoctorPercentages(formattedCustomPercentages);
        }
        if (treatmentRecordsRes.data) {
            console.log('Setting treatment records data:', treatmentRecordsRes.data.length);
            const formattedTreatmentRecords = treatmentRecordsRes.data.map((record: any) => {
                console.log('Raw treatment record:', record);
                let totalCost = Number(record.total_treatment_cost) || 0;
                if (totalCost === 0) {
                    const doctorShare = Number(record.doctor_share) || 0;
                    const clinicShare = Number(record.clinic_share) || 0;
                    totalCost = doctorShare + clinicShare;
                    console.log('Calculated total cost from shares:', totalCost, 'doctorShare:', doctorShare, 'clinicShare:', clinicShare);
                } else {
                    console.log('Using total treatment cost from database:', totalCost);
                }
                return {
                    id: record.id,
                    patientId: record.patient_id,
                    dentistId: record.dentist_id,
                    treatmentDate: record.treatment_date,
                    treatmentDefinitionId: record.treatment_definition_id,
                    notes: record.notes,
                    inventoryItemsUsed: record.inventory_items_used,
                    doctorShare: Number(record.doctor_share) || 0,
                    clinicShare: Number(record.clinic_share) || 0,
                    affectedTeeth: record.affected_teeth,
                    totalTreatmentCost: totalCost,
                    userId: record.user_id,
                    createdAt: record.created_at,
                    updatedAt: record.updated_at
                };
            });
            console.log('Formatted treatment records:', formattedTreatmentRecords);
            setTreatmentRecords(formattedTreatmentRecords);
        }
        if (labCasesRes.data) {
            console.log('Setting lab cases data:', labCasesRes.data.length);
            const formattedLabCases = labCasesRes.data.map((labCase: any) => ({
                id: labCase.id,
                patientId: labCase.patient_id,
                labId: labCase.lab_id,
                caseType: labCase.case_type,
                sentDate: labCase.sent_date,
                dueDate: labCase.due_date,
                returnDate: labCase.return_date,
                status: labCase.status,
                labCost: labCase.lab_cost,
                notes: labCase.notes
            }));
            setLabCases(formattedLabCases);
        }
        if (paymentsRes.data) {
            console.log('Setting payments data:', paymentsRes.data.length);
            const formattedPayments = paymentsRes.data.map((p: any) => ({
                id: p.id,
                patientId: p.patient_id,
                date: p.date,
                amount: Number(p.amount) || 0,
                method: p.method as PaymentMethod,
                notes: p.notes,
                treatmentRecordId: p.treatment_record_id,
                clinicShare: Number(p.clinic_share) || 0,
                doctorShare: Number(p.doctor_share) || 0,
                paymentReceiptImageUrl: p.payment_receipt_image_url,
                userId: p.user_id,
                createdAt: p.created_at,
                updatedAt: p.updated_at
            }));
            setPayments(formattedPayments);
        }
        if (supplierInvoicesRes.data) {
            console.log('Setting supplier invoices data:', supplierInvoicesRes.data.length);
            const hasExpenseRows = Array.isArray(expensesRes.data);
            const paymentsByInvoiceId = new Map<string, { expenseId: string; amount: number; date: string; }[]>();

            if (hasExpenseRows) {
                formattedExpenses.forEach((expense) => {
                    if (!expense.supplierInvoiceId) return;
                    const existing = paymentsByInvoiceId.get(expense.supplierInvoiceId) || [];
                    existing.push({
                        expenseId: expense.id,
                        amount: Number(expense.amount) || 0,
                        date: expense.date,
                    });
                    paymentsByInvoiceId.set(expense.supplierInvoiceId, existing);
                });
            }

            const formattedSupplierInvoices = supplierInvoicesRes.data.map((invoice: any) => {
                const derivedPayments = paymentsByInvoiceId.get(invoice.id) || [];
                const normalizedPayments = hasExpenseRows ? derivedPayments : (invoice.payments || []);
                const totalPaid = normalizedPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
                const invoiceAmount = Number(invoice.amount) || 0;
                const normalizedStatus = totalPaid + 0.01 >= invoiceAmount
                    ? SupplierInvoiceStatus.PAID
                    : SupplierInvoiceStatus.UNPAID;

                return {
                    id: invoice.id,
                    supplierId: invoice.supplier_id,
                    invoiceNumber: invoice.invoice_number,
                    invoiceDate: invoice.invoice_date,
                    dueDate: invoice.due_date,
                    amount: invoiceAmount,
                    status: normalizedStatus,
                    items: invoice.items || [],
                    payments: normalizedPayments
                };
            });
            setSupplierInvoices(formattedSupplierInvoices);

            const formattedSupplierInvoiceAttachments = supplierInvoicesRes.data
                .filter((inv: any) => inv.invoice_image_url || inv.invoiceImageUrl)
                .map((inv: any) => {
                    const fileUrl = inv.invoice_image_url || inv.invoiceImageUrl;
                    const filename = (() => {
                        try { return new URL(fileUrl).pathname.split('/').pop() || `invoice_${Date.now()}`; } catch { return `invoice_${Date.now()}`; }
                    })();
                    return {
                        id: inv.id,
                        supplierInvoiceId: inv.id,
                        filename,
                        originalFilename: filename,
                        fileType: fileUrl.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
                        fileSize: 0,
                        fileUrl,
                        thumbnailUrl: undefined,
                        description: 'Invoice image stored on supplier_invoices.invoice_image_url',
                        uploadedBy: inv.user_id || null,
                        createdAt: inv.created_at,
                        updatedAt: inv.updated_at
                    };
                });
            setSupplierInvoiceAttachments(formattedSupplierInvoiceAttachments);
        }
        if (doctorPaymentsRes.data) {
            console.log('Setting doctor payments data:', doctorPaymentsRes.data.length);
            const formattedDoctorPayments = doctorPaymentsRes.data.map((p: any) => ({
                id: p.id,
                dentistId: p.dentist_id,
                amount: p.amount,
                date: p.date,
                notes: p.notes
            }));
            setDoctorPayments(formattedDoctorPayments);
        }
        if (prescriptionsRes.data) {
            console.log('Setting prescriptions data:', prescriptionsRes.data.length);
            const formattedPrescriptions = prescriptionsRes.data.map((p: any) => ({
                id: p.id,
                patientId: p.patient_id,
                dentistId: p.dentist_id,
                prescriptionDate: p.prescription_date,
                notes: p.notes,
                userId: p.user_id,
                createdAt: p.created_at,
                updatedAt: p.updated_at
            }));
            setPrescriptions(formattedPrescriptions);
        }
        if (prescriptionItemsRes.data) {
            console.log('Setting prescription items data:', prescriptionItemsRes.data.length);
            const formattedPrescriptionItems = prescriptionItemsRes.data.map((item: any) => ({
                id: item.id,
                prescriptionId: item.prescription_id,
                medicationName: item.medication_name,
                dosage: item.dosage,
                quantity: item.quantity,
                instructions: item.instructions,
                userId: item.user_id,
                createdAt: item.created_at,
                updatedAt: item.updated_at
            }));
            setPrescriptionItems(formattedPrescriptionItems);
        }
        if (patientAttachmentsRes.data) {
            console.log('Setting attachments data:', patientAttachmentsRes.data.length);
            const formattedAttachments = await Promise.all(
                patientAttachmentsRes.data.map(async (attachment: any) => {
                    const fileUrl = await resolvePatientAttachmentUrl(attachment.file_url);
                    const thumbnailUrl = attachment.thumbnail_url
                        ? await resolvePatientAttachmentUrl(attachment.thumbnail_url)
                        : attachment.thumbnail_url;

                    return {
                        id: attachment.id,
                        patientId: attachment.patient_id,
                        filename: attachment.filename,
                        originalFilename: attachment.original_filename,
                        fileType: attachment.file_type,
                        fileSize: attachment.file_size,
                        fileUrl,
                        thumbnailUrl,
                        description: attachment.description,
                        uploadedBy: attachment.uploaded_by,
                        createdAt: attachment.created_at,
                        updatedAt: attachment.updated_at
                    };
                })
            );
            setAttachments(formattedAttachments);
        }
        
        if (clinicsRes.data && clinicsRes.data.length > 0) {
            const clinic = clinicsRes.data[0];
            setClinicInfo({
                name: clinic.name || '',
                address: clinic.address || '',
                phone: clinic.phone || '',
                email: clinic.email || '',
                logo: clinic.logo || ''
            });
        }

        const error = results.find(res => res.error);
        if (error) {
            console.error('Error fetching data:', error);
            addNotification({
        message: error?.error?.message || 'Unknown error occurred',
        type: NotificationType.ERROR,
        priority: NotificationPriority.CRITICAL,
        title: 'Data Fetch Error',
        read: false,
        actions: [],
        metadata: { source: 'data_fetch' }
    });
        } else {
            console.log('All data fetched successfully');
        }
        setIsLoading(false);
    }, [user, addNotification, getUserClinicIds, resolvePatientAttachmentUrl, currentClinic, currentBranch, accessibleClinics]);

    useEffect(() => {
        if (!supabase || !user) {
            setIsLoading(false);
            return;
        }

        fetchData().catch((error) => {
            console.error('Failed to fetch clinic data:', error);
            setIsLoading(false);
        });
    }, [fetchData, user]);

    // Load clinic settings from localStorage
    useEffect(() => {
        const savedClinicInfo = localStorage.getItem('curasoft_clinic_info');
        if (savedClinicInfo) {
            try {
                const parsed = JSON.parse(savedClinicInfo);
                setClinicInfo(parsed);
            } catch (error) {
                console.error('Failed to parse clinic info from localStorage:', error);
            }
        }

        const savedWhatsappTemplate = localStorage.getItem('curasoft_whatsapp_template');
        if (savedWhatsappTemplate) {
            console.log('Loading WhatsApp template from localStorage:', savedWhatsappTemplate);
            setWhatsappMessageTemplate(savedWhatsappTemplate);
        } else {
            console.log('No saved WhatsApp template found, using default');
        }

        const savedReminderTemplate = localStorage.getItem('curasoft_reminder_template');
        if (savedReminderTemplate) {
            console.log('Loading reminder template from localStorage:', savedReminderTemplate);
            setReminderMessageTemplate(savedReminderTemplate);
        } else {
            console.log('No saved reminder template found, using default');
        }

        const savedPrescriptionTemplate = localStorage.getItem('curasoft_prescription_template');
        if (savedPrescriptionTemplate) {
            console.log('Loading prescription template from localStorage:', savedPrescriptionTemplate);
            setWhatsappPrescriptionTemplate(savedPrescriptionTemplate);
        } else {
            console.log('No saved prescription template found, using default');
        }
    }, []);

    // Generic helper for adding data
    const addData = async <T extends { id: string }>(table: string, data: Partial<T>, setState: React.Dispatch<React.SetStateAction<T[]>>): Promise<void> => {
        if (!user || !supabase) return;
        const activeClinic = await getActiveClinicContext();
        await applyBranchSession(activeClinic.branchId || null);
        const insertPayload: Record<string, unknown> = { ...data, user_id: user.id };
        if (activeClinic.clinicId) {
            insertPayload.clinic_id = activeClinic.clinicId;
        }
        if (activeClinic.branchId && ['patients', 'appointments', 'treatment_records', 'payments', 'expenses', 'suppliers', 'inventory_items', 'dentists'].includes(table)) {
            insertPayload.branch_id = activeClinic.branchId;
        }
        console.log(`Adding data to table: ${table}`, insertPayload);
        const { data: newData, error } = await supabase.from(table).insert(insertPayload).select();
        if (error) {
            console.error(`Error adding data to ${table}:`, error);
            addNotification({
                message: error.message,
                type: NotificationType.ERROR,
                priority: NotificationPriority.CRITICAL,
                title: 'Data Addition Failed',
                read: false,
                actions: [],
                metadata: { source: 'data_add' }
            });
        } else if (newData) {
            console.log(`Successfully added data to ${table}:`, newData);
            setState((prev: T[]) => [...prev, ...newData as T[]]);
            await fetchData();
        }
    };

    // Generic helper for updating data
    const updateData = async <T extends { id: string }>(table: string, data: T, setState: React.Dispatch<React.SetStateAction<T[]>>): Promise<void> => {
        if (!supabase) return;
        const { id, ...updateData } = data;
        console.log(`Updating data in table: ${table}`, { id, updateData });
        const { error } = await supabase.from(table).update(updateData).eq('id', id);
        if (error) {
            console.error(`Error updating data in ${table}:`, error);
            addNotification({ message: error.message, type: NotificationType.ERROR });
        } else {
            console.log(`Successfully updated data in ${table} for id: ${id}`);
            setState((prev: T[]) => prev.map((item: T) => (item.id === id ? data : item)));
            await fetchData();
        }
    };

    // Generic helper for deleting data
    const deleteData = async <T extends { id: string }>(table: string, id: string, setState: React.Dispatch<React.SetStateAction<T[]>>): Promise<void> => {
        if (!supabase) return;
        console.log(`Deleting data from table: ${table}`, { id });
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) {
            console.error(`Error deleting data from ${table}:`, error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification({ message: error.message, type: NotificationType.ERROR });
        } else {
            console.log(`Successfully deleted data from ${table} for id: ${id}`);
            setState((prev: T[]) => prev.filter((item: T) => item.id !== id));
        }
    };

    const getSupplierExpenseCategory = (supplierType?: Supplier['type']): ExpenseCategory | null => {
        if (supplierType === 'Dental Lab') return ExpenseCategory.LAB_FEES;
        if (supplierType === 'Material Supplier') return ExpenseCategory.SUPPLIES;
        return null;
    };

    const normalizeExpenseForLinkedInvoice = async (
        expense: Pick<Expense, 'supplierId' | 'supplierInvoiceId' | 'category'>
    ): Promise<Pick<Expense, 'supplierId' | 'supplierInvoiceId' | 'category'> | null> => {
        if (!supabase) return null;
        if (!expense.supplierInvoiceId) {
            return {
                supplierId: expense.supplierId,
                supplierInvoiceId: expense.supplierInvoiceId,
                category: expense.category
            };
        }

        let linkedInvoice = supplierInvoices.find(inv => inv.id === expense.supplierInvoiceId);
        if (!linkedInvoice) {
            const { data: invoiceRow, error: invoiceError } = await supabase
                .from('supplier_invoices')
                .select('id, supplier_id, amount')
                .eq('id', expense.supplierInvoiceId)
                .single();

            if (invoiceError || !invoiceRow) {
                console.error('Unable to load linked supplier invoice:', invoiceError);
                addNotification('Selected supplier invoice was not found.', NotificationType.ERROR);
                return null;
            }

            linkedInvoice = {
                id: invoiceRow.id,
                supplierId: invoiceRow.supplier_id,
                amount: Number(invoiceRow.amount) || 0,
                invoiceDate: '',
                status: SupplierInvoiceStatus.UNPAID,
                items: [],
                payments: []
            };
        }

        let linkedSupplier = suppliers.find(supplier => supplier.id === linkedInvoice.supplierId);
        if (!linkedSupplier) {
            const { data: supplierRow, error: supplierError } = await supabase
                .from('suppliers')
                .select('id, type')
                .eq('id', linkedInvoice.supplierId)
                .single();

            if (supplierError || !supplierRow) {
                console.error('Unable to load supplier for linked invoice:', supplierError);
                addNotification('Supplier for selected invoice was not found.', NotificationType.ERROR);
                return null;
            }

            linkedSupplier = {
                id: supplierRow.id,
                type: supplierRow.type as Supplier['type'],
                name: '',
                contact_person: '',
                phone: '',
                email: ''
            };
        }

        const forcedCategory = getSupplierExpenseCategory(linkedSupplier.type);
        if (!forcedCategory) {
            addNotification('Invoice-linked payments are allowed only for material suppliers or dental labs.', NotificationType.ERROR);
            return null;
        }

        return {
            supplierId: linkedInvoice.supplierId,
            supplierInvoiceId: linkedInvoice.id,
            category: forcedCategory
        };
    };

    const syncSupplierInvoicePayments = async (invoiceId: string): Promise<void> => {
        if (!supabase || !invoiceId) return;

        const { data: invoiceRow, error: invoiceError } = await supabase
            .from('supplier_invoices')
            .select('id, amount')
            .eq('id', invoiceId)
            .single();

        if (invoiceError || !invoiceRow) {
            console.error('Unable to load invoice for payment sync:', invoiceError);
            return;
        }

        const { data: linkedExpenses, error: expensesError } = await supabase
            .from('expenses')
            .select('id, amount, date')
            .eq('supplier_invoice_id', invoiceId)
            .order('date', { ascending: true });

        if (expensesError) {
            console.error('Unable to load linked expenses for invoice payment sync:', expensesError);
            return;
        }

        const normalizedPayments = (linkedExpenses || []).map((linkedExpense: any) => ({
            expenseId: linkedExpense.id,
            amount: Number(linkedExpense.amount) || 0,
            date: linkedExpense.date
        }));

        const totalPaid = normalizedPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const invoiceAmount = Number(invoiceRow.amount) || 0;
        const normalizedStatus = totalPaid + 0.01 >= invoiceAmount
            ? SupplierInvoiceStatus.PAID
            : SupplierInvoiceStatus.UNPAID;

        const { error: updateError } = await supabase
            .from('supplier_invoices')
            .update({
                payments: normalizedPayments,
                status: normalizedStatus
            })
            .eq('id', invoiceId);

        if (updateError) {
            console.error('Unable to update supplier invoice payments:', updateError);
            addNotification(updateError.message, NotificationType.ERROR);
            return;
        }

        setSupplierInvoices((prev: SupplierInvoice[]) =>
            prev.map((invoice: SupplierInvoice) =>
                invoice.id === invoiceId
                    ? { ...invoice, payments: normalizedPayments, status: normalizedStatus }
                    : invoice
            )
        );
    };

    // Delete functions
    const deletePatient = async (id: string) => {
        await deleteData('patients', id, setPatients);
    };
    const deleteDoctor = async (id: string) => {
        await deleteData('dentists', id, setDentists);
    };
    const deleteAppointment = async (id: string) => {
        await deleteData('appointments', id, setAppointments);
    };
    const deleteSupplier = async (id: string) => {
        await deleteData('suppliers', id, setSuppliers);
    };
    const deleteInventoryItem = async (id: string) => {
        await deleteData('inventory_items', id, setInventoryItems);
    };
    const deleteExpense = async (id: string) => {
        if (!supabase) return;
        const expenseToDelete = expenses.find(expense => expense.id === id);

        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) {
            console.error(`Error deleting expense:`, error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
            return;
        }

        setExpenses((prev: Expense[]) => prev.filter((item: Expense) => item.id !== id));

        if (expenseToDelete?.supplierInvoiceId) {
            await syncSupplierInvoicePayments(expenseToDelete.supplierInvoiceId);
        }

        await fetchData();
    };
    const deleteTreatmentDefinition = async (id: string) => {
        await deleteData('treatment_definitions', id, setTreatmentDefinitions);
    };
    const deleteTreatmentRecord = async (id: string) => {
        // Find the treatment record to be deleted and its associated payments
        const treatmentRecordToDelete = treatmentRecords.find(tr => tr.id === id);
        if (treatmentRecordToDelete) {
            const associatedPayments = payments.filter(p => p.treatmentRecordId === id);
            
            // Delete associated payments and their corresponding doctor payments
            for (const payment of associatedPayments) {
                if (payment.doctorShare > 0) {
                    // Find and delete corresponding doctor payment
                    const doctorPaymentToDelete = doctorPayments.find(dp => 
                        dp.dentistId === treatmentRecordToDelete.dentistId && 
                        Math.abs(dp.amount - payment.doctorShare) < 0.01
                    );
                    if (doctorPaymentToDelete) {
                        console.log('Deleting associated doctor payment:', doctorPaymentToDelete);
                        await deleteData('doctor_payments', doctorPaymentToDelete.id, setDoctorPayments);
                    }
                }
                // Delete the payment
                console.log('Deleting associated payment:', payment);
                await deleteData('payments', payment.id, setPayments);
            }
        }
        
        // Delete the treatment record
        await deleteData('treatment_records', id, setTreatmentRecords);
    };
    const deleteLabCase = async (id: string) => {
        await deleteData('lab_cases', id, setLabCases);
    };
    const deletePayment = async (id: string) => {
        // Find the payment to be deleted to get its doctor share and treatment record info
        const paymentToDelete = payments.find(p => p.id === id);
        if (paymentToDelete && paymentToDelete.doctorShare > 0 && paymentToDelete.treatmentRecordId) {
            // Find and delete the corresponding doctor payment
            const treatmentRecord = treatmentRecords.find(tr => tr.id === paymentToDelete.treatmentRecordId);
            if (treatmentRecord) {
                // Find doctor payments that match the criteria (more robust search)
                const doctorPaymentToDelete = doctorPayments.find(dp => 
                    dp.dentistId === treatmentRecord.dentistId && 
                    Math.abs(dp.amount - paymentToDelete.doctorShare) < 0.01 // Allow for floating point precision
                );
                
                if (doctorPaymentToDelete) {
                    console.log('Found matching doctor payment to delete:', doctorPaymentToDelete);
                    await deleteData('doctor_payments', doctorPaymentToDelete.id, setDoctorPayments);
                } else {
                    console.warn('No matching doctor payment found for deletion. Payment details:', paymentToDelete);
                    console.warn('Available doctor payments:', doctorPayments);
                }
            }
        }
        // Delete the payment
        await deleteData('payments', id, setPayments);
    };
    const deleteSupplierInvoice = async (id: string) => {
        await deleteData('supplier_invoices', id, setSupplierInvoices);
    };
    const deleteDoctorPayment = async (id: string) => {
        await deleteData('doctor_payments', id, setDoctorPayments);
    };
    const deletePrescription = async (id: string) => {
        await deleteData('prescriptions', id, setPrescriptions);
    };
    const deletePrescriptionItem = async (id: string) => {
        await deleteData('prescription_items', id, setPrescriptionItems);
    };
    const deleteAttachment = async (id: string) => {
        if (!supabase) return;
        console.log(`Deleting attachment from table: patient_attachments`, { id });
        const { error } = await supabase.from('patient_attachments').delete().eq('id', id);
        if (error) {
            console.error(`Error deleting attachment:`, error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else {
            console.log(`Successfully deleted attachment for id: ${id}`);
            setAttachments((prev: PatientAttachment[]) => prev.filter((item: PatientAttachment) => item.id !== id));
        }
    };
    const deleteSupplierInvoiceAttachment = async (id: string) => {
        if (!supabase) return;
        console.log(`Clearing invoice_image_url on supplier_invoices for id:`, id);
        const { error } = await supabase.from('supplier_invoices').update({ invoice_image_url: null, updated_at: new Date().toISOString() }).eq('id', id);
        if (error) {
            console.error(`Error clearing invoice image URL on supplier_invoices:`, error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else {
            console.log(`Successfully cleared invoice_image_url for invoice id: ${id}`);
            setSupplierInvoiceAttachments((prev: SupplierInvoiceAttachment[]) => prev.filter((item: SupplierInvoiceAttachment) => item.supplierInvoiceId !== id));
            addNotification('Supplier invoice attachment removed from invoice record', NotificationType.SUCCESS);
        }
    };

    // Doctor Payment Management
    const addDoctorPayment = async (payment: Omit<DoctorPayment, 'id'>) => {
        if (!user || !supabase) return;
        const activeClinic = await requireActiveClinic('doctor payment');
        if (!activeClinic) return;

        const paymentData = {
            dentist_id: payment.dentistId,
            amount: payment.amount,
            date: payment.date,
            notes: payment.notes || null,
            clinic_id: activeClinic.clinicId
        };

        console.log('Adding doctor payment with data:', paymentData);
        const { data: newData, error } = await supabase.from('doctor_payments').insert(paymentData).select();
        if (error) {
            console.error('Error adding doctor payment:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully added doctor payment:', newData);
            const newPayments = newData.map((p: any) => ({
                id: p.id,
                dentistId: p.dentist_id,
                amount: p.amount,
                date: p.date,
                notes: p.notes
            }));
            setDoctorPayments((prev: DoctorPayment[]) => [...prev, ...newPayments]);
        }
    };
    const updateDoctorPayment = async (payment: DoctorPayment) => {
        if (!supabase) return;

        const { id, dentistId, amount, date, notes } = payment;
        const supabaseData = {
            dentist_id: dentistId,
            amount,
            date,
            notes: notes || null
        };

        console.log(`Updating doctor payment data:`, { id, supabaseData });
        const { error } = await supabase.from('doctor_payments').update(supabaseData).eq('id', id);

        if (error) {
            console.error(`Error updating doctor payment:`, error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else {
            console.log(`Successfully updated doctor payment for id: ${id}`);
            setDoctorPayments((prev: DoctorPayment[]) => prev.map((item: DoctorPayment) => (item.id === id ? payment : item)));
        }
    };

    // Patient Management
    const addPatient = async (patient: Omit<Patient, 'id' | 'dentalChart'>) => {
        if (!user || !supabase) {
            console.error('User not authenticated or Supabase not configured');
            addNotification('User not authenticated', NotificationType.ERROR);
            return;
        }
        const activeClinic = await requireActiveClinic('patient');
        if (!activeClinic) return;

        const patientData = {
            name: patient.name,
            dob: patient.dob,
            gender: patient.gender,
            phone: patient.phone,
            email: patient.email || null,
            address: patient.address || null,
            medical_history: patient.medicalHistory || null,
            treatment_notes: patient.treatmentNotes || null,
            last_visit: patient.lastVisit || null,
            allergies: patient.allergies || null,
            medications: patient.medications || null,
            insurance_provider: patient.insuranceProvider || null,
            insurance_policy_number: patient.insurancePolicyNumber || null,
            emergency_contact_name: patient.emergencyContactName || null,
            emergency_contact_phone: patient.emergencyContactPhone || null,
            dental_chart: createEmptyChart(),
            images: patient.images || [],
            user_id: user.id,
            clinic_id: activeClinic.clinicId,
            branch_id: activeClinic.branchId
        };

        console.log('User ID:', user.id);
        console.log('Adding patient with data:', JSON.stringify(patientData, null, 2));

        const { data: newData, error } = await supabase.from('patients').insert(patientData).select();

        if (error) {
            console.error('Supabase error:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            console.error('Full error object:', JSON.stringify(error, null, 2));
            addNotification(`Failed to add patient: ${error.message}`, NotificationType.ERROR);
        } else if (newData) {
            console.log('Raw response from Supabase:', newData);
            const formattedData = newData.map(p => ({
                id: p.id,
                name: p.name,
                dob: p.dob,
                gender: p.gender,
                phone: p.phone,
                email: p.email,
                address: p.address,
                medicalHistory: p.medical_history,
                treatmentNotes: p.treatment_notes,
                lastVisit: p.last_visit,
                allergies: p.allergies,
                medications: p.medications,
                insuranceProvider: p.insurance_provider,
                insurancePolicyNumber: p.insurance_policy_number,
                emergencyContactName: p.emergency_contact_name,
                emergencyContactPhone: p.emergency_contact_phone,
                dentalChart: p.dental_chart,
                images: p.images
            }));
            setPatients((prev: Patient[]) => [...prev, ...formattedData as Patient[]]);
            addNotification('Patient added successfully', NotificationType.SUCCESS);
        }
    };
    const updatePatient = async (patient: Patient) => {
        if (!supabase) return;

        const { id, name, dob, gender, phone, email, address, medicalHistory, treatmentNotes, lastVisit, allergies, medications, insuranceProvider, insurancePolicyNumber, emergencyContactName, emergencyContactPhone, dentalChart, images } = patient;
        const supabaseData = {
            name,
            dob,
            gender,
            phone,
            email: email || null,
            address: address || null,
            medical_history: medicalHistory || null,
            treatment_notes: treatmentNotes || null,
            last_visit: lastVisit || null,
            allergies: allergies || null,
            medications: medications || null,
            insurance_provider: insuranceProvider || null,
            insurance_policy_number: insurancePolicyNumber || null,
            emergency_contact_name: emergencyContactName || null,
            emergency_contact_phone: emergencyContactPhone || null,
            dental_chart: dentalChart,
            images: images || []
        };

        console.log(`useClinicData: updatePatient called with patient:`, patient);
        console.log(`useClinicData: dentalChart data:`, dentalChart);
        console.log(`useClinicData: supabaseData:`, supabaseData);
        const { error } = await supabase.from('patients').update(supabaseData).eq('id', id);

        if (error) {
            console.error(`Error updating patient:`, error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else {
            console.log(`Successfully updated patient for id: ${id}`);
            setPatients((prev: Patient[]) => prev.map((item: Patient) => (item.id === id ? patient : item)));
            await fetchData();
        }
    };

    // Doctor Management
    const addDoctor = async (doctor: Omit<Dentist, 'id'>) => {
        if (!user || !supabase) return;

        const activeClinic = await requireActiveClinic('doctor');
        if (!activeClinic) return;

        const payload = { ...doctor, user_id: user.id, clinic_id: activeClinic.clinicId, branch_id: activeClinic.branchId };
        console.log('Adding doctor with data:', payload);
        const { data: newData, error } = await supabase.from('dentists').insert(payload).select();
        if (error) {
            console.error('Error adding doctor:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully added doctor:', newData);
            setDentists((prev: Dentist[]) => [...prev, ...newData as Dentist[]]);
        }
    };
    const updateDoctor = async (doctor: Dentist) => {
        await updateData('dentists', doctor, setDentists);
    };

    // Appointment Management
    const addAppointment = async (appointment: Omit<Appointment, 'id' | 'reminderSent' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (!user || !supabase) return;
        const activeClinic = await requireActiveClinic('appointment');
        if (!activeClinic) return;

        const { patientId, dentistId, startTime, endTime, reminderTime, reason, status } = appointment;
        const supabaseData = {
            reason,
            status,
            patient_id: patientId,
            dentist_id: dentistId,
            start_time: startTime,
            end_time: endTime,
            reminder_time: reminderTime,
            user_id: user.id,
            clinic_id: activeClinic.clinicId,
            branch_id: activeClinic.branchId
        };

        console.log('Adding appointment with data:', JSON.stringify(supabaseData, null, 2));
        const { data: newData, error } = await supabase.from('appointments').insert(supabaseData).select('*');

        if (error) {
            console.error('Add appointment error details:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
        } else if (newData) {
            console.log('Add appointment success - returned columns:', Object.keys(newData[0] || {}));
        }

        if (error) {
            console.error('Error adding appointment:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully added appointment:', newData);
            const newAppointments = newData.map((a: any) => ({
                id: a.id,
                patientId: a.patient_id,
                dentistId: a.dentist_id,
                startTime: new Date(a.start_time),
                endTime: new Date(a.end_time),
                reason: a.reason,
                status: a.status,
                reminderTime: a.reminder_time,
                reminderSent: false,
                userId: a.user_id,
                createdAt: a.created_at,
                updatedAt: a.updated_at
            }));
            setAppointments((prev: Appointment[]) => [...prev, ...newAppointments]);
        }
    };

    const updateAppointment = async (appointment: Appointment) => {
        if (!user || !supabase) return;

        const { id, patientId, dentistId, startTime, endTime, reminderTime, status, reason } = appointment;
        const supabaseData = {
            reason,
            status,
            patient_id: patientId,
            dentist_id: dentistId,
            start_time: startTime,
            end_time: endTime,
            reminder_time: reminderTime
        };

        const { error } = await supabase.from('appointments').update(supabaseData).eq('id', id);

        if (error) {
            console.error('Update appointment error details:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
        } else {
            console.log('Update appointment success');
        }

        if (error) {
            addNotification(error.message, NotificationType.ERROR);
        } else {
            setAppointments((prev: Appointment[]) => prev.map((item: Appointment) => (item.id === id ? appointment : item)));
        }
    };

    // Treatment Record Management
    const addTreatmentRecord = async (patientId: string, record: Omit<TreatmentRecord, 'id' | 'patientId'>) => {
        if (!user || !supabase) return;
        const activeClinic = await requireActiveClinic('treatment record');
        if (!activeClinic) return;

        const { dentistId, treatmentDate, treatmentDefinitionId, notes, inventoryItemsUsed, affectedTeeth } = record;
        const treatmentDef = treatmentDefinitions.find(td => td.id === treatmentDefinitionId);
        const basePrice = treatmentDef?.basePrice || 0;
        const effectivePercentages = getTreatmentPercentages(treatmentDefinitionId, dentistId);
        const doctorShare = basePrice * effectivePercentages.doctorPercentage;
        const clinicShare = basePrice * effectivePercentages.clinicPercentage;
        const totalTreatmentCost = Number(doctorShare) + Number(clinicShare);
        const supabaseData = {
            patient_id: patientId,
            dentist_id: dentistId,
            treatment_date: treatmentDate,
            treatment_definition_id: treatmentDefinitionId,
            notes: notes || null,
            inventory_items_used: inventoryItemsUsed,
            doctor_share: Number(doctorShare) || 0,
            clinic_share: Number(clinicShare) || 0,
            affected_teeth: affectedTeeth || [],
            total_treatment_cost: totalTreatmentCost,
            user_id: user.id,
            clinic_id: activeClinic.clinicId,
            branch_id: activeClinic.branchId
        };

        console.log('Adding treatment record with data:', supabaseData);
        const { data: newData, error } = await supabase.from('treatment_records').insert(supabaseData).select();
        if (error) {
            console.error('Error adding treatment record:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully added treatment record:', newData);
            const newTreatmentRecords = newData.map((tr: any) => ({
                id: tr.id,
                patientId: tr.patient_id,
                dentistId: tr.dentist_id,
                treatmentDate: tr.treatment_date,
                treatmentDefinitionId: tr.treatment_definition_id,
                notes: tr.notes,
                inventoryItemsUsed: tr.inventory_items_used,
                doctorShare: Number(tr.doctor_share) || 0,
                clinicShare: Number(tr.clinic_share) || 0,
                affectedTeeth: tr.affected_teeth,
                totalTreatmentCost: Number(tr.total_treatment_cost) || 0,
                userId: tr.user_id,
                createdAt: tr.created_at,
                updatedAt: tr.updated_at
            }));
            setTreatmentRecords((prev: TreatmentRecord[]) => [...prev, ...newTreatmentRecords]);
        }
    };
    const updateTreatmentRecord = async (patientId: string, record: TreatmentRecord) => {
        if (!supabase) return;
        const activeClinic = await requireActiveClinic('treatment record');
        if (!activeClinic) return;

        const { id, patientId: pid, dentistId, treatmentDate, treatmentDefinitionId, notes, inventoryItemsUsed, affectedTeeth } = record;
        const totalTreatmentCost = Number(record.totalTreatmentCost) || (Number(record.doctorShare) + Number(record.clinicShare));
        const effectivePercentages = getTreatmentPercentages(treatmentDefinitionId, dentistId);
        const doctorShare = totalTreatmentCost * effectivePercentages.doctorPercentage;
        const clinicShare = totalTreatmentCost * effectivePercentages.clinicPercentage;
        const supabaseData = {
            patient_id: pid,
            dentist_id: dentistId,
            treatment_date: treatmentDate,
            treatment_definition_id: treatmentDefinitionId,
            notes: notes || null,
            inventory_items_used: inventoryItemsUsed,
            doctor_share: Number(doctorShare) || 0,
            clinic_share: Number(clinicShare) || 0,
            affected_teeth: affectedTeeth || [],
            total_treatment_cost: totalTreatmentCost
        };

        console.log(`Updating treatment record data:`, { id, supabaseData });
        const { error } = await supabase
            .from('treatment_records')
            .update(supabaseData)
            .eq('id', id)
            .eq('clinic_id', activeClinic.clinicId)
            .eq('branch_id', activeClinic.branchId);

        if (error) {
            console.error(`Error updating treatment record:`, error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else {
            console.log(`Successfully updated treatment record for id: ${id}`);
            setTreatmentRecords((prev: TreatmentRecord[]) => prev.map((item: TreatmentRecord) => (item.id === id ? record : item)));
        }
    };

    // Payment Management
    const addPayment = async (payment: Omit<Payment, 'id'>) => {
        if (!user || !supabase) return;
        const activeClinic = await requireActiveClinic('payment');
        if (!activeClinic) return;

        // Debug logging to identify the issue
        console.log('addPayment called with method:', payment.method);
        console.log('Payment method type:', typeof payment.method);
        console.log('Payment method value:', JSON.stringify(payment.method));

        const validMethods: PaymentMethod[] = ['Cash', 'Instapay', 'Vodafone Cash', 'Other', 'Discount'];
        
        // Normalize the method to handle any whitespace or case issues
        const normalizedMethod = payment.method?.trim();
        
        if (!validMethods.includes(normalizedMethod as PaymentMethod)) {
            console.error('Invalid payment method detected:', normalizedMethod);
            console.error('Valid methods are:', validMethods);
            addNotification(`طريقة الدفع غير صحيحة: ${normalizedMethod}`, NotificationType.ERROR);
            return;
        }

        let clinicShare = 0;
        let doctorShare = 0;

        if (payment.treatmentRecordId) {
            const treatmentRecord = treatmentRecords.find(tr => tr.id === payment.treatmentRecordId);
            if (treatmentRecord) {
                const recordTotal = Number(treatmentRecord.doctorShare) + Number(treatmentRecord.clinicShare);
                if (recordTotal > 0) {
                    const doctorRatio = Number(treatmentRecord.doctorShare) / recordTotal;
                    doctorShare = payment.amount * doctorRatio;
                    clinicShare = payment.amount - doctorShare;
                } else {
                    const effectivePercentages = getTreatmentPercentages(treatmentRecord.treatmentDefinitionId, treatmentRecord.dentistId);
                    doctorShare = payment.amount * effectivePercentages.doctorPercentage;
                    clinicShare = payment.amount - doctorShare;
                }
            }
        }

        const paymentData = {
            patient_id: payment.patientId,
            date: payment.date,
            amount: payment.amount,
            method: normalizedMethod, // Use normalized method
            notes: payment.notes || null,
            treatment_record_id: payment.treatmentRecordId || null,
            clinic_share: clinicShare,
            doctor_share: doctorShare,
            payment_receipt_image_url: payment.paymentReceiptImageUrl || null,
            user_id: user.id,
            clinic_id: activeClinic.clinicId,
            branch_id: activeClinic.branchId
        };



        console.log('Adding payment with data:', paymentData);
        const { data: newData, error } = await supabase.from('payments').insert(paymentData).select();
        if (error) {
            console.error('Error adding payment:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully added payment:', newData);
            const newPayments = newData.map((p: any) => ({
                id: p.id,
                patientId: p.patient_id,
                date: p.date,
                amount: p.amount,
                method: p.method,
                notes: p.notes,
                treatmentRecordId: p.treatment_record_id,
                clinicShare: p.clinic_share,
                doctorShare: p.doctor_share,
                paymentReceiptImageUrl: p.payment_receipt_image_url
            } as Payment));
            setPayments((prev: Payment[]) => [...prev, ...newPayments]);

            if (doctorShare > 0 && payment.treatmentRecordId) {
                const treatmentRecord = treatmentRecords.find(tr => tr.id === payment.treatmentRecordId);
                if (treatmentRecord) {
                    const doctorPayment: Omit<DoctorPayment, 'id'> = {
                        dentistId: treatmentRecord.dentistId,
                        amount: doctorShare,
                        date: payment.date,
                        notes: `Payment share from treatment on ${new Date(treatmentRecord.treatmentDate).toLocaleDateString()}`
                    };
                    await addDoctorPayment(doctorPayment);
                }
            }
        }
    };
    const updatePayment = async (payment: Payment) => {
        if (!supabase) return;

        const validMethods: PaymentMethod[] = ['Cash', 'Instapay', 'Vodafone Cash', 'Other', 'Discount'];
        if (!validMethods.includes(payment.method as PaymentMethod)) {
            addNotification(`طريقة الدفع غير صحيحة: ${payment.method}`, NotificationType.ERROR);
            return;
        }

        const { id, patientId, date, amount, method, notes, treatmentRecordId, clinicShare, doctorShare, paymentReceiptImageUrl } = payment;
        const supabaseData = {
            patient_id: patientId,
            date,
            amount,
            method,
            notes: notes || null,
            treatment_record_id: treatmentRecordId,
            clinic_share: clinicShare,
            doctor_share: doctorShare,
            payment_receipt_image_url: paymentReceiptImageUrl || null
        };

        console.log(`Updating payment data:`, { id, supabaseData });
        const { error } = await supabase.from('payments').update(supabaseData).eq('id', id);

        if (error) {
            console.error(`Error updating payment:`, error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else {
            console.log(`Successfully updated payment for id: ${id}`);
            setPayments((prev: Payment[]) => prev.map((item: Payment) => (item.id === id ? payment : item)));
        }
    };

    // Financial & Inventory Management
    const addSupplier = async (s: Omit<Supplier, 'id'>) => {
        if (!user || !supabase) return;
        const activeClinic = await requireActiveClinic('supplier');
        if (!activeClinic) return;

        const supplierData = {
            name: s.name,
            contact_person: s.contact_person || null,
            phone: s.phone || null,
            email: s.email || null,
            type: s.type,
            user_id: user.id,
            clinic_id: activeClinic.clinicId,
            branch_id: activeClinic.branchId
        };

        console.log('Adding supplier with data:', supplierData);
        const { data: newData, error } = await supabase.from('suppliers').insert(supplierData).select();
        if (error) {
            console.error('Error adding supplier:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            console.error('Full error object:', JSON.stringify(error, null, 2));
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully added supplier:', newData);
            setSuppliers((prev: Supplier[]) => [...prev, ...newData as Supplier[]]);
            addNotification('Supplier added successfully', NotificationType.SUCCESS);
        }
    };
    const updateSupplier = async (s: Supplier) => {
        await updateData('suppliers', s, setSuppliers);
    };
    const addInventoryItem = async (i: Omit<InventoryItem, 'id'>) => {
        if (!user || !supabase) return;
        const activeClinic = await requireActiveClinic('inventory item');
        if (!activeClinic) return;

        const inventoryData = {
            name: i.name,
            description: i.description || null,
            supplier_id: i.supplierId || null,
            current_stock: Number(i.currentStock) || 0,
            unit_cost: Number(i.unitCost) || 0,
            min_stock_level: Number(i.minStockLevel) || 0,
            expiry_date: i.expiryDate || null,
            user_id: user.id,
            clinic_id: activeClinic.clinicId,
            branch_id: activeClinic.branchId
        };

        console.log('Adding inventory item with data:', JSON.stringify(inventoryData, null, 2));
        const { data: newData, error } = await supabase.from('inventory_items').insert(inventoryData).select();
        if (error) {
            console.error('Error adding inventory item:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            console.error('Full error object:', JSON.stringify(error, null, 2));
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully added inventory item:', newData);
            const formattedData = newData.map(item => ({
                id: item.id,
                name: item.name,
                description: item.description,
                supplierId: item.supplier_id,
                currentStock: item.current_stock,
                unitCost: item.unit_cost,
                minStockLevel: item.min_stock_level,
                expiryDate: item.expiry_date
            }));
            setInventoryItems((prev: InventoryItem[]) => [...prev, ...formattedData as InventoryItem[]]);
            addNotification('Inventory item added successfully', NotificationType.SUCCESS);
        }
    };
    const updateInventoryItem = async (i: InventoryItem) => {
        if (!supabase) return;

        const { id, name, description, supplierId, currentStock, unitCost, minStockLevel, expiryDate } = i;
        const supabaseData = {
            name,
            description: description || null,
            supplier_id: supplierId || null,
            current_stock: Number(currentStock) || 0,
            unit_cost: Number(unitCost) || 0,
            min_stock_level: Number(minStockLevel) || 0,
            expiry_date: expiryDate || null
        };

        console.log(`Updating inventory item data:`, { id, supabaseData });
        const { error } = await supabase.from('inventory_items').update(supabaseData).eq('id', id);

        if (error) {
            console.error(`Error updating inventory item:`, error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else {
            console.log(`Successfully updated inventory item for id: ${id}`);
            setInventoryItems((prev: InventoryItem[]) => prev.map((item: InventoryItem) => (item.id === id ? i : item)));
        }
    };

    const addExpense = async (e: Omit<Expense, 'id'>) => {
        if (!user || !supabase) return;
        const activeClinic = await requireActiveClinic('expense');
        if (!activeClinic) return;

        const normalizedLinkData = await normalizeExpenseForLinkedInvoice({
            supplierId: e.supplierId,
            supplierInvoiceId: e.supplierInvoiceId,
            category: e.category
        });
        if (!normalizedLinkData) return;

        const normalizedExpense: Omit<Expense, 'id'> = {
            ...e,
            supplierId: normalizedLinkData.supplierId,
            supplierInvoiceId: normalizedLinkData.supplierInvoiceId,
            category: normalizedLinkData.category
        };

        const expenseData = {
            date: normalizedExpense.date,
            description: normalizedExpense.description,
            amount: Number(normalizedExpense.amount) || 0,
            category: normalizedExpense.category,
            supplier_id: normalizedExpense.supplierId || null,
            supplier_invoice_id: normalizedExpense.supplierInvoiceId || null,
            method: normalizedExpense.method || null,
            expense_receipt_image_url: normalizedExpense.expenseReceiptImageUrl || null,
            user_id: user.id,
            clinic_id: activeClinic.clinicId,
            branch_id: activeClinic.branchId
        };

        console.log('Adding expense with data:', expenseData);
        const { data: newData, error } = await supabase.from('expenses').insert(expenseData).select();
        if (error) {
            console.error('Error adding expense:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            console.error('Full error object:', JSON.stringify(error, null, 2));
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully added expense:', newData);
            const formattedExpenses = newData.map((expense: any) => ({
                id: expense.id,
                date: expense.date,
                description: expense.description,
                amount: Number(expense.amount) || 0,
                category: expense.category,
                supplierId: expense.supplier_id,
                supplierInvoiceId: expense.supplier_invoice_id,
                method: expense.method,
                expenseReceiptImageUrl: expense.expense_receipt_image_url
            }));
            setExpenses((prev: Expense[]) => [...prev, ...formattedExpenses]);

            if (normalizedExpense.supplierInvoiceId) {
                await syncSupplierInvoicePayments(normalizedExpense.supplierInvoiceId);
            }

            await fetchData();
            addNotification('Expense added successfully', NotificationType.SUCCESS);
        }
    };
    const updateExpense = async (e: Expense) => {
        if (!supabase) return;

        const existingExpense = expenses.find(expense => expense.id === e.id);
        const normalizedLinkData = await normalizeExpenseForLinkedInvoice({
            supplierId: e.supplierId,
            supplierInvoiceId: e.supplierInvoiceId,
            category: e.category
        });
        if (!normalizedLinkData) return;

        const normalizedExpense: Expense = {
            ...e,
            supplierId: normalizedLinkData.supplierId,
            supplierInvoiceId: normalizedLinkData.supplierInvoiceId,
            category: normalizedLinkData.category
        };

        const { id, supplierId, supplierInvoiceId, method, expenseReceiptImageUrl, ...rest } = normalizedExpense;
        const supabaseData = {
            ...rest,
            supplier_id: supplierId || null,
            supplier_invoice_id: supplierInvoiceId || null,
            method: method || null,
            expense_receipt_image_url: expenseReceiptImageUrl || null
        };

        console.log(`Updating expense data:`, { id, supabaseData });
        const { error } = await supabase.from('expenses').update(supabaseData).eq('id', id);

        if (error) {
            console.error(`Error updating expense:`, error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else {
            console.log(`Successfully updated expense for id: ${id}`);
            setExpenses((prev: Expense[]) => prev.map((item: Expense) => (item.id === id ? normalizedExpense : item)));

            const invoiceIdsToSync = Array.from(new Set([
                existingExpense?.supplierInvoiceId,
                normalizedExpense.supplierInvoiceId
            ].filter(Boolean))) as string[];

            for (const invoiceId of invoiceIdsToSync) {
                await syncSupplierInvoicePayments(invoiceId);
            }

            await fetchData();
        }
    };

    const addTreatmentDefinition = async (d: Omit<TreatmentDefinition, 'id'>) => {
        if (!user || !supabase) return;
        const activeClinic = await requireActiveClinic('treatment definition');
        if (!activeClinic) return;

        const treatmentData = {
            name: d.name,
            description: d.description || null,
            base_price: Number(d.basePrice) || 0,
            doctor_percentage: Number(d.doctorPercentage) || 0,
            clinic_percentage: Number(d.clinicPercentage) || 0,
            user_id: user.id,
            clinic_id: activeClinic.clinicId,
            branch_id: activeClinic.branchId
        };

        console.log('Adding treatment definition with data:', treatmentData);
        const { data: newData, error } = await supabase.from('treatment_definitions').insert(treatmentData).select();
        if (error) {
            console.error('Error adding treatment definition:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            console.error('Full error object:', JSON.stringify(error, null, 2));
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully added treatment definition:', newData);
            const newTreatmentDefinitions = newData.map((def: any) => ({
                id: def.id,
                name: def.name,
                description: def.description,
                basePrice: Number(def.base_price) || 0,
                doctorPercentage: Number(def.doctor_percentage) || 0,
                clinicPercentage: Number(def.clinic_percentage) || 0
            }));
            setTreatmentDefinitions((prev: TreatmentDefinition[]) => [...prev, ...newTreatmentDefinitions]);
            addNotification('Treatment definition added successfully', NotificationType.SUCCESS);
        }
    };
    const updateTreatmentDefinition = async (d: TreatmentDefinition) => {
        if (!supabase) return;

        const { id, name, description, basePrice, doctorPercentage, clinicPercentage } = d;
        const supabaseData = {
            name,
            description: description || null,
            base_price: Number(basePrice) || 0,
            doctor_percentage: Number(doctorPercentage) || 0,
            clinic_percentage: Number(clinicPercentage) || 0
        };

        console.log(`Updating treatment definition data:`, { id, supabaseData });
        const { error } = await supabase.from('treatment_definitions').update(supabaseData).eq('id', id);

        if (error) {
            console.error(`Error updating treatment definition:`, error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else {
            console.log(`Successfully updated treatment definition for id: ${id}`);
            setTreatmentDefinitions((prev: TreatmentDefinition[]) => prev.map((item: TreatmentDefinition) => (item.id === id ? d : item)));
        }
    };

    const upsertTreatmentDoctorPercentage = async (data: Omit<TreatmentDoctorPercentage, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (!user || !supabase) return;
        if (!isAdmin) {
            addNotification('Only admin can update custom doctor percentages', NotificationType.ERROR);
            return;
        }
        const activeClinic = await requireActiveClinic('custom treatment percentage');
        if (!activeClinic) return;

        const doctorPercentage = Number(data.doctorPercentage) || 0;
        const clinicPercentage = Number(data.clinicPercentage) || 0;
        if (doctorPercentage < 0 || doctorPercentage > 1 || clinicPercentage < 0 || clinicPercentage > 1) {
            addNotification('Percentages must be between 0 and 1', NotificationType.ERROR);
            return;
        }
        if (Math.abs((doctorPercentage + clinicPercentage) - 1) > 0.0001) {
            addNotification('Doctor and clinic percentages must add up to 100%', NotificationType.ERROR);
            return;
        }

        const payload = {
            treatment_definition_id: data.treatmentDefinitionId,
            dentist_id: data.dentistId,
            doctor_percentage: doctorPercentage,
            clinic_percentage: clinicPercentage,
            user_id: user.id,
            clinic_id: activeClinic.clinicId
        };

        const { data: upserted, error } = await supabase
            .from('treatment_doctor_percentages')
            .upsert(payload, { onConflict: 'treatment_definition_id,dentist_id,user_id' })
            .select();

        if (error) {
            console.error('Error upserting treatment_doctor_percentages:', error);
            addNotification(error.message, NotificationType.ERROR);
            return;
        }

        if (upserted && upserted.length > 0) {
            const mapped = upserted.map((item: any) => ({
                id: item.id,
                treatmentDefinitionId: item.treatment_definition_id,
                dentistId: item.dentist_id,
                doctorPercentage: Number(item.doctor_percentage) || 0,
                clinicPercentage: Number(item.clinic_percentage) || 0,
                userId: item.user_id,
                createdAt: item.created_at,
                updatedAt: item.updated_at
            }));

            setTreatmentDoctorPercentages((prev: TreatmentDoctorPercentage[]) => {
                const next = [...prev];
                mapped.forEach((entry: TreatmentDoctorPercentage) => {
                    const existingIndex = next.findIndex(
                        item =>
                            item.treatmentDefinitionId === entry.treatmentDefinitionId &&
                            item.dentistId === entry.dentistId
                    );
                    if (existingIndex >= 0) {
                        next[existingIndex] = entry;
                    } else {
                        next.push(entry);
                    }
                });
                return next;
            });
            addNotification('Custom doctor percentage saved', NotificationType.SUCCESS);
        }
    };

    const deleteTreatmentDoctorPercentage = async (id: string) => {
        if (!supabase) return;
        if (!isAdmin) {
            addNotification('Only admin can delete custom doctor percentages', NotificationType.ERROR);
            return;
        }

        const { error } = await supabase.from('treatment_doctor_percentages').delete().eq('id', id);
        if (error) {
            console.error('Error deleting treatment_doctor_percentages:', error);
            addNotification(error.message, NotificationType.ERROR);
            return;
        }

        setTreatmentDoctorPercentages((prev: TreatmentDoctorPercentage[]) => prev.filter(item => item.id !== id));
        addNotification('Custom doctor percentage deleted', NotificationType.SUCCESS);
    };

    const addLabCase = async (lc: Omit<LabCase, 'id'>) => {
        if (!user || !supabase) return;
        const activeClinic = await requireActiveClinic('lab case');
        if (!activeClinic) return;

        const labCaseData = {
            patient_id: lc.patientId,
            lab_id: lc.labId,
            case_type: lc.caseType,
            sent_date: lc.sentDate,
            due_date: lc.dueDate,
            return_date: lc.returnDate || null,
            status: lc.status,
            lab_cost: Number(lc.labCost) || 0,
            notes: lc.notes || null,
            user_id: user.id,
            clinic_id: activeClinic.clinicId,
            branch_id: activeClinic.branchId
        };

        console.log('Adding lab case with data:', labCaseData);
        const { data: newData, error } = await supabase.from('lab_cases').insert(labCaseData).select();
        if (error) {
            console.error('Error adding lab case:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            console.error('Full error object:', JSON.stringify(error, null, 2));
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully added lab case:', newData);
            const newLabCases = newData.map((labCase: any) => ({
                id: labCase.id,
                patientId: labCase.patient_id,
                labId: labCase.lab_id,
                caseType: labCase.case_type,
                sentDate: labCase.sent_date,
                dueDate: labCase.due_date,
                returnDate: labCase.return_date,
                status: labCase.status,
                labCost: labCase.lab_cost,
                notes: labCase.notes
            }));
            setLabCases((prev: LabCase[]) => [...prev, ...newLabCases]);
            addNotification('Lab case added successfully', NotificationType.SUCCESS);
        }
    };
    const updateLabCase = async (lc: LabCase) => {
        if (!supabase) return;

        const { id, patientId, labId, caseType, sentDate, dueDate, returnDate, status, labCost, notes } = lc;
        const supabaseData = {
            patient_id: patientId,
            lab_id: labId,
            case_type: caseType,
            sent_date: sentDate,
            due_date: dueDate,
            return_date: returnDate || null,
            status: status,
            lab_cost: Number(labCost) || 0,
            notes: notes || null
        };

        console.log(`Updating lab case data:`, { id, supabaseData });
        const { error } = await supabase.from('lab_cases').update(supabaseData).eq('id', id);

        if (error) {
            console.error(`Error updating lab case:`, error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else {
            console.log(`Successfully updated lab case for id: ${id}`);
            setLabCases((prev: LabCase[]) => prev.map((item: LabCase) => (item.id === id ? lc : item)));
        }
    };

    const addSupplierInvoice = async (i: Omit<SupplierInvoice, 'id' | 'payments'>) => {
        if (!user || !supabase) return;
        const activeClinic = await requireActiveClinic('supplier invoice');
        if (!activeClinic) return;

        const invoiceData = {
            supplier_id: i.supplierId,
            invoice_number: i.invoiceNumber || null,
            invoice_date: i.invoiceDate,
            due_date: i.dueDate || null,
            amount: Number(i.amount) || 0,
            status: i.status,
            items: i.items || [],
            payments: [],
            user_id: user.id,
            clinic_id: activeClinic.clinicId,
            branch_id: activeClinic.branchId
        };

        console.log('Adding supplier invoice with data:', invoiceData);
        const { data: newData, error } = await supabase.from('supplier_invoices').insert(invoiceData).select();
        if (error) {
            console.error('Error adding supplier invoice:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            console.error('Full error object:', JSON.stringify(error, null, 2));
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully added supplier invoice:', newData);
            setSupplierInvoices((prev: SupplierInvoice[]) => [...prev, ...newData as SupplierInvoice[]]);
            addNotification('Supplier invoice added successfully', NotificationType.SUCCESS);
            await fetchData();
            try {
                const possibleUrl = (i as any).invoiceImageUrl;
                if (possibleUrl) {
                    const deriveName = (url: string) => {
                        try {
                            const u = new URL(url);
                            return (u.pathname.split('/').pop() || `invoice_${Date.now()}`).replace(/[^a-zA-Z0-9_.-]/g, '_');
                        } catch {
                            return `invoice_${Date.now()}`;
                        }
                    };
                    const filename = deriveName(possibleUrl);
                    await addSupplierInvoiceAttachment({
                        supplierInvoiceId: newData[0].id,
                        filename,
                        originalFilename: filename,
                        fileType: possibleUrl.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
                        fileSize: 0,
                        fileUrl: possibleUrl,
                        thumbnailUrl: undefined,
                        description: 'Imported invoice image',
                        uploadedBy: user.id
                    });
                }
            } catch (attachErr) {
                console.warn('Failed to create supplier invoice attachment for imported URL:', attachErr);
            }
        }
    };
    const updateSupplierInvoice = async (i: SupplierInvoice) => {
        if (!supabase) return;

        const { id, supplierId, invoiceNumber, invoiceDate, dueDate, amount, status, items, payments } = i;
        const supabaseData: any = {
            supplier_id: supplierId,
            invoice_number: invoiceNumber || null,
            invoice_date: invoiceDate,
            due_date: dueDate || null,
            amount: Number(amount) || 0,
            status,
            items: items || [],
            payments: payments || []
        };

        console.log(`Updating supplier invoice data:`, { id, supabaseData });
        const { error } = await supabase.from('supplier_invoices').update(supabaseData).eq('id', id).select();

        if (error) {
            console.error(`Error updating supplier invoice:`, error);
            addNotification(error.message, NotificationType.ERROR);
            return;
        }

        const possibleUrl = (i as any).invoiceImageUrl;
        if (possibleUrl) {
            try {
                const { data: updated, error: imgErr } = await supabase.from('supplier_invoices').update({ invoice_image_url: possibleUrl, updated_at: new Date().toISOString() }).eq('id', id).select();
                if (imgErr) {
                    console.error('Error saving invoice image URL on supplier_invoices:', imgErr);
                    console.error('Error details:', imgErr.details, imgErr.hint, imgErr.code);
                    addNotification(imgErr.message, NotificationType.ERROR);
                } else {
                    console.log('Saved invoice image URL on supplier_invoices:', updated);
                }
            } catch (err) {
                console.warn('Failed to save invoice image URL during invoice update:', err);
            }
        }

        await fetchData();
    };

    const paySupplierInvoice = async (invoice: SupplierInvoice) => {
        console.warn('Direct invoice payment from suppliers screen is disabled. Use expenses screen instead.', invoice.id);
        addNotification({
            message: 'Invoice payments are now recorded from the Expenses screen only.',
            type: NotificationType.WARNING
        });
    };

    // Prescription Management
    const addPrescription = async (prescription: Omit<Prescription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (!user || !supabase) return;
        const activeClinic = await requireActiveClinic('prescription');
        if (!activeClinic) return;

        const prescriptionData = {
            patient_id: prescription.patientId,
            dentist_id: prescription.dentistId,
            prescription_date: prescription.prescriptionDate,
            notes: prescription.notes || null,
            user_id: user.id,
            clinic_id: activeClinic.clinicId,
            branch_id: activeClinic.branchId
        };

        console.log('Adding prescription with data:', prescriptionData);
        const { data: newData, error } = await supabase.from('prescriptions').insert(prescriptionData).select();
        if (error) {
            console.error('Error adding prescription:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully added prescription:', newData);
            const newPrescriptions = newData.map((p: any) => ({
                id: p.id,
                patientId: p.patient_id,
                dentistId: p.dentist_id,
                prescriptionDate: p.prescription_date,
                notes: p.notes,
                userId: p.user_id,
                createdAt: p.created_at,
                updatedAt: p.updated_at
            }));
            setPrescriptions((prev: Prescription[]) => [...prev, ...newPrescriptions]);
            addNotification('Prescription added successfully', NotificationType.SUCCESS);
            return newPrescriptions[0];
        }
        return undefined;
    };
    const updatePrescription = async (prescription: Prescription) => {
        if (!supabase) return;

        const { id, patientId, dentistId, prescriptionDate, notes } = prescription;
        const supabaseData = {
            patient_id: patientId,
            dentist_id: dentistId,
            prescription_date: prescriptionDate,
            notes: notes || null
        };

        console.log(`Updating prescription data:`, { id, supabaseData });
        const { error } = await supabase.from('prescriptions').update(supabaseData).eq('id', id);

        if (error) {
            console.error(`Error updating prescription:`, error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else {
            console.log(`Successfully updated prescription for id: ${id}`);
            setPrescriptions((prev: Prescription[]) => prev.map((item: Prescription) => (item.id === id ? prescription : item)));
            addNotification('Prescription updated successfully', NotificationType.SUCCESS);
        }
    };

    // Prescription Item Management
    const addPrescriptionItem = async (prescriptionId: string, item: Omit<PrescriptionItem, 'id' | 'prescriptionId' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (!user || !supabase) return;
        const activeClinic = await requireActiveClinic('prescription item');
        if (!activeClinic) return;

        const itemData = {
            prescription_id: prescriptionId,
            medication_name: item.medicationName,
            dosage: item.dosage || null,
            quantity: item.quantity,
            instructions: item.instructions || null,
            user_id: user.id,
            clinic_id: activeClinic.clinicId
        };

        console.log('Adding prescription item with data:', itemData);
        const { data: newData, error } = await supabase.from('prescription_items').insert(itemData).select();
        if (error) {
            console.error('Error adding prescription item:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully added prescription item:', newData);
            const newItems = newData.map((i: any) => ({
                id: i.id,
                prescriptionId: i.prescription_id,
                medicationName: i.medication_name,
                dosage: i.dosage,
                quantity: i.quantity,
                instructions: i.instructions,
                userId: i.user_id,
                createdAt: i.created_at,
                updatedAt: i.updated_at
            }));
            setPrescriptionItems((prev: PrescriptionItem[]) => [...prev, ...newItems]);
            addNotification('Prescription item added successfully', NotificationType.SUCCESS);
        }
    };
    const updatePrescriptionItem = async (item: PrescriptionItem) => {
        if (!supabase) return;

        const { id, prescriptionId, medicationName, dosage, quantity, instructions } = item;
        const supabaseData = {
            prescription_id: prescriptionId,
            medication_name: medicationName,
            dosage: dosage || null,
            quantity,
            instructions: instructions || null
        };

        console.log(`Updating prescription item data:`, { id, supabaseData });
        const { error } = await supabase.from('prescription_items').update(supabaseData).eq('id', id);

        if (error) {
            console.error(`Error updating prescription item:`, error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else {
            console.log(`Successfully updated prescription item for id: ${id}`);
            setPrescriptionItems((prev: PrescriptionItem[]) => prev.map((i: PrescriptionItem) => (i.id === id ? item : i)));
            addNotification('Prescription item updated successfully', NotificationType.SUCCESS);
        }
    };

    // Attachment Management
    const addAttachment = async (attachment: Omit<PatientAttachment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (!user || !supabase) return;
        const activeClinic = await requireActiveClinic('patient attachment');
        if (!activeClinic) return;

        const systemUserId = '00000000-0000-0000-0000-000000000001';
        let validUserId = user.id;
        
        try {
            const { data: userExists } = await supabase
                .from('users')
                .select('id')
                .eq('id', user.id)
                .single();
            
            if (!userExists) {
                console.warn('User not found in auth.users table, using system user for attachment');
                validUserId = systemUserId;
            }
        } catch (error) {
            console.warn('Error checking user existence, using system user for attachment:', error);
            validUserId = systemUserId;
        }

        const attachmentData = {
            patient_id: attachment.patientId,
            filename: attachment.filename,
            original_filename: attachment.originalFilename,
            file_type: attachment.fileType,
            file_size: attachment.fileSize,
            file_url: normalizePatientAttachmentPath(attachment.fileUrl),
            thumbnail_url: normalizePatientAttachmentPath(attachment.thumbnailUrl) || null,
            description: attachment.description || null,
            uploaded_by: validUserId,
            user_id: validUserId,
            clinic_id: activeClinic.clinicId
        };

        console.log('Adding attachment with data:', attachmentData);
        const { data: newData, error } = await supabase.from('patient_attachments').insert(attachmentData).select();
        if (error) {
            console.error('Error adding attachment:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully added attachment:', newData);
            const newAttachments = await Promise.all(newData.map(async (a: any) => ({
                id: a.id,
                patientId: a.patient_id,
                filename: a.filename,
                originalFilename: a.original_filename,
                fileType: a.file_type,
                fileSize: a.file_size,
                fileUrl: await resolvePatientAttachmentUrl(a.file_url),
                thumbnailUrl: a.thumbnail_url ? await resolvePatientAttachmentUrl(a.thumbnail_url) : a.thumbnail_url,
                description: a.description,
                uploadedBy: a.uploaded_by,
                createdAt: a.created_at,
                updatedAt: a.updated_at
            })));
            setAttachments((prev: PatientAttachment[]) => [...prev, ...newAttachments]);
            addNotification('Attachment added successfully', NotificationType.SUCCESS);
        }
    };
    const updateAttachment = async (attachment: PatientAttachment) => {
        if (!supabase) return;

        const systemUserId = '00000000-0000-0000-0000-000000000001';
        let validUserId = attachment.uploadedBy;
        
        try {
            const { data: userExists } = await supabase
                .from('users')
                .select('id')
                .eq('id', attachment.uploadedBy)
                .single();
            
            if (!userExists) {
                console.warn('User not found in auth.users table, using system user for attachment update');
                validUserId = systemUserId;
            }
        } catch (error) {
            console.warn('Error checking user existence, using system user for attachment update:', error);
            validUserId = systemUserId;
        }

        const { id, patientId, filename, originalFilename, fileType, fileSize, fileUrl, thumbnailUrl, description } = attachment;
        const supabaseData = {
            patient_id: patientId,
            filename,
            original_filename: originalFilename,
            file_type: fileType,
            file_size: fileSize,
            file_url: normalizePatientAttachmentPath(fileUrl),
            thumbnail_url: normalizePatientAttachmentPath(thumbnailUrl) || null,
            description: description || null,
            uploaded_by: validUserId
        };

        console.log(`Updating attachment data:`, { id, supabaseData });
        const { error } = await supabase.from('patient_attachments').update(supabaseData).eq('id', id);

        if (error) {
            console.error(`Error updating attachment:`, error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else {
            console.log(`Successfully updated attachment for id: ${id}`);
            const updatedAttachment: PatientAttachment = {
                ...attachment,
                fileUrl: await resolvePatientAttachmentUrl(supabaseData.file_url),
                thumbnailUrl: supabaseData.thumbnail_url
                    ? await resolvePatientAttachmentUrl(supabaseData.thumbnail_url)
                    : attachment.thumbnailUrl,
                uploadedBy: validUserId
            };
            setAttachments((prev: PatientAttachment[]) => prev.map((item: PatientAttachment) => (item.id === id ? updatedAttachment : item)));
            addNotification('Attachment updated successfully', NotificationType.SUCCESS);
        }
    };

    // Supplier Invoice Attachment Management
    const addSupplierInvoiceAttachment = async (attachment: Omit<SupplierInvoiceAttachment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (!user || !supabase) return;

        const systemUserId = '00000000-0000-0000-0000-000000000001';
        let validUserId = user.id;

        try {
            const { data: userExists } = await supabase
                .from('users')
                .select('id')
                .eq('id', user.id)
                .single();

            if (!userExists) {
                console.warn('User not found in auth.users table, using system user for supplier invoice attachment');
                validUserId = systemUserId;
            }
        } catch (error) {
            console.warn('Error checking user existence, using system user for supplier invoice attachment:', error);
            validUserId = systemUserId;
        }

        const attachmentData = {
            supplier_invoice_id: attachment.supplierInvoiceId,
            filename: attachment.filename,
            original_filename: attachment.originalFilename,
            file_type: attachment.fileType,
            file_size: attachment.fileSize,
            file_url: attachment.fileUrl,
            thumbnail_url: attachment.thumbnailUrl,
            description: attachment.description || null,
            uploaded_by: validUserId,
            user_id: validUserId
        };

        console.log('Saving supplier invoice image URL to supplier_invoices:', attachmentData);
        const updateData = {
            invoice_image_url: attachment.fileUrl,
            updated_at: new Date().toISOString()
        };
        const { data: newData, error } = await supabase.from('supplier_invoices').update(updateData).eq('id', attachment.supplierInvoiceId).select();
        if (error) {
            console.error('Error saving invoice image URL to supplier_invoices:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully saved invoice image URL on supplier_invoices:', newData);
            const inv = newData[0];
            const filename = (() => { try { return new URL(inv.invoice_image_url).pathname.split('/').pop() || `invoice_${Date.now()}`; } catch { return `invoice_${Date.now()}`; } })();
            const newAttachment = {
                id: inv.id,
                supplierInvoiceId: inv.id,
                filename,
                originalFilename: filename,
                fileType: inv.invoice_image_url?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
                fileSize: 0,
                fileUrl: inv.invoice_image_url,
                thumbnailUrl: undefined,
                description: 'Invoice image stored on supplier_invoices.invoice_image_url',
                uploadedBy: inv.user_id || null,
                createdAt: inv.created_at,
                updatedAt: inv.updated_at
            };
            setSupplierInvoiceAttachments((prev: SupplierInvoiceAttachment[]) => [...prev, newAttachment]);
            addNotification('Supplier invoice attachment saved to invoice record', NotificationType.SUCCESS);
        }
    };
    const updateSupplierInvoiceAttachment = async (attachment: SupplierInvoiceAttachment) => {
        if (!supabase) return;

        const systemUserId = '00000000-0000-0000-0000-000000000001';
        let validUserId = attachment.uploadedBy;

        try {
            const { data: userExists } = await supabase
                .from('users')
                .select('id')
                .eq('id', attachment.uploadedBy)
                .single();

            if (!userExists) {
                console.warn('User not found in auth.users table, using system user for supplier invoice attachment update');
                validUserId = systemUserId;
            }
        } catch (error) {
            console.warn('Error checking user existence, using system user for supplier invoice attachment update:', error);
            validUserId = systemUserId;
        }

        const { id, supplierInvoiceId, filename, originalFilename, fileType, fileSize, fileUrl, thumbnailUrl, description } = attachment;
        const supabaseData = {
            supplier_invoice_id: supplierInvoiceId,
            filename,
            original_filename: originalFilename,
            file_type: fileType,
            file_size: fileSize,
            file_url: fileUrl,
            thumbnail_url: thumbnailUrl,
            description: description || null,
            uploaded_by: validUserId
        };

        console.log(`Updating supplier invoice image URL on supplier_invoices:`, { supplierInvoiceId, fileUrl: fileUrl });
        const updateData = {
            invoice_image_url: fileUrl,
            updated_at: new Date().toISOString()
        };
        const { data: updated, error } = await supabase.from('supplier_invoices').update(updateData).eq('id', supplierInvoiceId).select();
        if (error) {
            console.error(`Error updating supplier invoice image URL:`, error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else if (updated) {
            console.log(`Successfully updated supplier invoice image URL for invoice: ${supplierInvoiceId}`);
            setSupplierInvoiceAttachments((prev: SupplierInvoiceAttachment[]) => prev.map((item: SupplierInvoiceAttachment) => (item.supplierInvoiceId === supplierInvoiceId ? { ...item, fileUrl, filename } : item)));
            addNotification('Supplier invoice attachment updated on invoice record', NotificationType.SUCCESS);
        }
    };

    // Clinic settings functions
    const updateClinicInfo = async (info: ClinicInfo) => {
        if (!user || !supabase) return;

        try {
            // Upsert clinic data (one clinic per user)
            const clinicData = {
                name: info.name,
                address: info.address,
                phone: info.phone,
                email: info.email,
                logo: info.logo,
                user_id: user.id
            };

            // First, try to update existing clinic for this user
            const { data: existingData, error: fetchError } = await supabase
                .from('clinics')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            let newData, error;

            if (fetchError && fetchError.code !== 'PGRST116') {
                // PGRST116 is "not found", which is expected
                console.error('Error fetching existing clinic:', fetchError);
                addNotification(fetchError.message, NotificationType.ERROR);
                return;
            }

            if (existingData) {
                // Update existing clinic
                const result = await supabase
                    .from('clinics')
                    .update(clinicData)
                    .eq('id', existingData.id)
                    .select();
                newData = result.data;
                error = result.error;
            } else {
                // Insert new clinic
                const result = await supabase
                    .from('clinics')
                    .insert(clinicData)
                    .select();
                newData = result.data;
                error = result.error;
            }

            if (error) {
                console.error('Error updating clinic info:', error);
                addNotification(error.message, NotificationType.ERROR);
                return;
            }

            console.log('Successfully updated clinic info:', newData);
            setClinicInfo(info);
            localStorage.setItem('curasoft_clinic_info', JSON.stringify(info));
            addNotification('Clinic information updated successfully', NotificationType.SUCCESS);
        } catch (error) {
            console.error('Error updating clinic info:', error);
            addNotification('Failed to update clinic information', NotificationType.ERROR);
        }
    };

    const updateWhatsappMessageTemplate = (template: string) => {
        setWhatsappMessageTemplate(template);
        localStorage.setItem('curasoft_whatsapp_template', template);
        addNotification('WhatsApp message template updated successfully', NotificationType.SUCCESS);
    };

    // Data persistence (local restore - less used now)
    const restoreData = async (data: Partial<Omit<ClinicData, 'restoreData'>>) => {
        console.warn("Restoring from local file will not sync to the cloud.");
        if (!user || !supabase) return;
        const activeClinic = await requireActiveClinic('restored records');
        if (!activeClinic) return;

        try {
            const tables = [
                'patients', 'dentists', 'appointments', 'suppliers', 'inventory_items',
                'expenses', 'treatment_definitions', 'treatment_records', 'lab_cases',
                'payments', 'supplier_invoices'
            ];

            for (const table of tables) {
                let purgeQuery = supabase.from(table).delete().eq('clinic_id', activeClinic.clinicId);
                if (activeClinic.branchId) {
                    purgeQuery = purgeQuery.eq('branch_id', activeClinic.branchId);
                }
                await purgeQuery;
            }

            if (data.patients) {
                for (const patient of data.patients) {
                    const patientData = {
                        ...patient,
                        id: patient.id.startsWith('sample-') ? undefined : patient.id,
                        user_id: user.id,
                        clinic_id: activeClinic.clinicId
                    };
                    await supabase.from('patients').insert(patientData);
                }
            }
            if (data.dentists) {
                for (const dentist of data.dentists) {
                    const dentistData = {
                        ...dentist,
                        id: dentist.id.startsWith('sample-') ? undefined : dentist.id,
                        user_id: user.id,
                        clinic_id: activeClinic.clinicId
                    };
                    await supabase.from('dentists').insert(dentistData);
                }
            }
            if (data.appointments) {
                for (const appointment of data.appointments) {
                    const { patientId, dentistId, startTime, endTime, reminderTime, reminderSent, ...rest } = appointment;
                    const appointmentData = {
                        ...rest,
                        patient_id: patientId,
                        dentist_id: dentistId,
                        start_time: startTime,
                        end_time: endTime,
                        reminder_time: reminderTime,
                        reminder_sent: reminderSent || false,
                        id: appointment.id.startsWith('sample-') ? undefined : appointment.id,
                        user_id: user.id,
                        clinic_id: activeClinic.clinicId
                    };
                    await supabase.from('appointments').insert(appointmentData);
                }
            }
            if (data.suppliers) {
                for (const supplier of data.suppliers) {
                    const supplierData = {
                        ...supplier,
                        id: supplier.id.startsWith('sample-') ? undefined : supplier.id,
                        user_id: user.id,
                        clinic_id: activeClinic.clinicId
                    };
                    await supabase.from('suppliers').insert(supplierData);
                }
            }
            if (data.inventoryItems) {
                for (const item of data.inventoryItems) {
                    const itemData = {
                        ...item,
                        id: item.id.startsWith('sample-') ? undefined : item.id,
                        user_id: user.id,
                        clinic_id: activeClinic.clinicId
                    };
                    await supabase.from('inventory_items').insert(itemData);
                }
            }
            if (data.expenses) {
                for (const expense of data.expenses) {
                    const expenseData = {
                        ...expense,
                        id: expense.id.startsWith('sample-') ? undefined : expense.id,
                        user_id: user.id,
                        clinic_id: activeClinic.clinicId
                    };
                    await supabase.from('expenses').insert(expenseData);
                }
            }
            if (data.treatmentDefinitions) {
                for (const def of data.treatmentDefinitions) {
                    const defData = {
                        ...def,
                        id: def.id.startsWith('sample-') ? undefined : def.id,
                        user_id: user.id,
                        clinic_id: activeClinic.clinicId,
                        branch_id: activeClinic.branchId
                    };
                    await supabase.from('treatment_definitions').insert(defData);
                }
            }
            if (data.treatmentRecords) {
                for (const record of data.treatmentRecords) {
                    const recordData = {
                        ...record,
                        id: record.id.startsWith('sample-') ? undefined : record.id,
                        user_id: user.id,
                        clinic_id: activeClinic.clinicId,
                        branch_id: activeClinic.branchId
                    };
                    await supabase.from('treatment_records').insert(recordData);
                }
            }
            if (data.labCases) {
                for (const labCase of data.labCases) {
                    const labCaseData = {
                        ...labCase,
                        id: labCase.id.startsWith('sample-') ? undefined : labCase.id,
                        user_id: user.id,
                        clinic_id: activeClinic.clinicId
                    };
                    await supabase.from('lab_cases').insert(labCaseData);
                }
            }
            if (data.payments) {
                for (const payment of data.payments) {
                    const paymentData = {
                        ...payment,
                        id: payment.id.startsWith('sample-') ? undefined : payment.id,
                        user_id: user.id,
                        clinic_id: activeClinic.clinicId
                    };
                    await supabase.from('payments').insert(paymentData);
                }
            }
            if (data.supplierInvoices) {
                for (const invoice of data.supplierInvoices) {
                    const { invoiceImageUrl, ...invoiceRest } = invoice as any;
                    const invoiceData = {
                        ...invoiceRest,
                        id: invoice.id.startsWith('sample-') ? undefined : invoice.id,
                        user_id: user.id,
                        clinic_id: activeClinic.clinicId
                    };
                    await supabase.from('supplier_invoices').insert(invoiceData);
                }
            }

            await fetchData();
        } catch (error) {
            console.error("Restore failed:", error);
            addNotification("Failed to restore data", NotificationType.ERROR);
        }
    };
    
    return {
        patients, addPatient, updatePatient, deletePatient,
        dentists, addDoctor, updateDoctor, deleteDoctor,
        appointments, addAppointment, updateAppointment, deleteAppointment,
        suppliers, addSupplier, updateSupplier, deleteSupplier,
        inventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem,
        expenses, addExpense, updateExpense, deleteExpense,
        treatmentDoctorPercentages, getTreatmentPercentages, upsertTreatmentDoctorPercentage, deleteTreatmentDoctorPercentage,
        treatmentDefinitions, addTreatmentDefinition, updateTreatmentDefinition, deleteTreatmentDefinition,
        treatmentRecords, addTreatmentRecord, updateTreatmentRecord, deleteTreatmentRecord,
        labCases, addLabCase, updateLabCase, deleteLabCase,
        payments, addPayment, updatePayment, deletePayment,
        supplierInvoices, addSupplierInvoice, updateSupplierInvoice, deleteSupplierInvoice, paySupplierInvoice,
        doctorPayments, addDoctorPayment, updateDoctorPayment, deleteDoctorPayment,
        prescriptions, addPrescription: async (prescription: Omit<Prescription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
            const result = await addPrescription(prescription);
            return result || {
                id: '',
                patientId: '',
                dentistId: '',
                prescriptionDate: '',
                notes: '',
                userId: '',
                createdAt: '',
                updatedAt: ''
            };
        }, updatePrescription, deletePrescription,
        prescriptionItems, addPrescriptionItem, updatePrescriptionItem, deletePrescriptionItem,
        attachments, addAttachment, updateAttachment, deleteAttachment,
        supplierInvoiceAttachments, addSupplierInvoiceAttachment, updateSupplierInvoiceAttachment, deleteSupplierInvoiceAttachment,
        clinicInfo, updateClinicInfo,
        whatsappMessageTemplate, updateWhatsappMessageTemplate,
        reminderMessageTemplate, updateReminderMessageTemplate,
        restoreData,
        isLoading
    };
};

