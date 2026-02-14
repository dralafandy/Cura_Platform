import React, { useCallback, useState, useEffect } from 'react';
import {
    Patient, Dentist, Appointment, DentalChartData, ToothStatus,
    Supplier, InventoryItem, Expense, TreatmentDefinition, TreatmentRecord,
    LabCase, Payment, SupplierInvoice, ExpenseCategory, NotificationType, DoctorPayment, Prescription, PrescriptionItem, PatientAttachment
} from '../types';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

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
    addAppointment: (appointment: Omit<Appointment, 'id' | 'reminderSent'>) => Promise<void>;
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
    addPrescription: (prescription: Omit<Prescription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updatePrescription: (prescription: Prescription) => Promise<void>;
    deletePrescription: (id: string) => Promise<void>;
    prescriptionItems: PrescriptionItem[];
    addPrescriptionItem: (prescriptionId: string, item: Omit<PrescriptionItem, 'id' | 'prescriptionId' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updatePrescriptionItem: (item: PrescriptionItem) => Promise<void>;
    deletePrescriptionItem: (id: string) => Promise<void>;
    attachments: PatientAttachment[];
    addAttachment: (attachment: Omit<PatientAttachment, 'id' | 'uploadedBy' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateAttachment: (attachment: PatientAttachment) => Promise<void>;
    deleteAttachment: (id: string) => Promise<void>;
    clinicInfo: ClinicInfo;
    updateClinicInfo: (info: ClinicInfo) => void;
    whatsappMessageTemplate: string;
    updateWhatsappMessageTemplate: (template: string) => void;
    reminderMessageTemplate: string;
    updateReminderMessageTemplate: (template: string) => void;
    restoreData: (data: Partial<Omit<ClinicData, 'restoreData'>>) => void; // Kept for local restore, though less relevant now
}

export const useClinicData = (): ClinicData => {
    const { user } = useAuth();
    const { addNotification } = useNotification();
    
    const [patients, setPatients] = useState<Patient[]>([]);
    const [dentists, setDentists] = useState<Dentist[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [treatmentDefinitions, setTreatmentDefinitions] = useState<TreatmentDefinition[]>([]);
    const [treatmentRecords, setTreatmentRecords] = useState<TreatmentRecord[]>([]);
    const [labCases, setLabCases] = useState<LabCase[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([]);
    const [doctorPayments, setDoctorPayments] = useState<DoctorPayment[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
    const [attachments, setAttachments] = useState<PatientAttachment[]>([]);

    // Clinic settings state
    const [clinicInfo, setClinicInfo] = useState<ClinicInfo>({
        name: '',
        address: '',
        phone: '',
        email: ''
    });
    const [whatsappMessageTemplate, setWhatsappMessageTemplate] = useState<string>(
        'مرحباً {patientName}، هذا تذكير من عيادة {clinicName} لطب الأسنان بموعدك يوم {appointmentDate} الساعة {appointmentTime}. نتطلع لرؤيتك.{doctorName}'
    );
    const [reminderMessageTemplate, setReminderMessageTemplate] = useState<string>(
        'مرحباً {patientName}، هذا تذكير من عيادة {clinicName} لطب الأسنان بموعدك يوم {appointmentDate} الساعة {appointmentTime}. نتطلع لرؤيتك.{doctorName}'
    );

    const updateReminderMessageTemplate = (template: string) => {
        setReminderMessageTemplate(template);
        localStorage.setItem('curasoft_reminder_template', template);
        addNotification('Reminder message template updated successfully', NotificationType.SUCCESS);
    };


    const fetchData = useCallback(async () => {
        if (!user || !supabase) return;

        console.log('Fetching data from all tables...');
        const tables = [
            'patients', 'dentists', 'appointments', 'suppliers', 'inventory_items',
            'expenses', 'treatment_definitions', 'treatment_records', 'lab_cases',
            'payments', 'supplier_invoices', 'doctor_payments', 'prescriptions', 'prescription_items', 'patient_attachments'
        ];

    const promises = tables.map((table: string) => {
        return supabase!.from(table).select('*').eq('user_id', user.id);
    });
        const results = await Promise.all(promises);

        const [
            patientsRes, dentistsRes, appointmentsRes, suppliersRes, inventoryItemsRes,
            expensesRes, treatmentDefsRes, treatmentRecordsRes, labCasesRes,
            paymentsRes, supplierInvoicesRes, doctorPaymentsRes, prescriptionsRes, prescriptionItemsRes, attachmentsRes
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
            attachments: attachmentsRes.data?.length || 0
        });

        // Diagnostic logs for appointments table schema
        if (appointmentsRes.data) {
            console.log('Appointments data sample:', appointmentsRes.data.slice(0, 2));
            console.log('Appointments columns check:', Object.keys(appointmentsRes.data[0] || {}));
            if (appointmentsRes.data[0] && !('reminder_sent' in appointmentsRes.data[0])) {
                console.error('CRITICAL: reminder_sent column missing from appointments table response');
            }
        }
        if (appointmentsRes.error) {
            console.error('Appointments fetch error:', appointmentsRes.error);
        }

        if (patientsRes.data) {
            console.log('Setting patients data:', patientsRes.data.length);
            // Convert snake_case from database to camelCase for frontend
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
            // Convert snake_case from database to camelCase for frontend
            const formattedAppointments = appointmentsRes.data.map((a: any) => ({
                id: a.id,
                patientId: a.patient_id, // patient_id -> patientId
                dentistId: a.dentist_id, // dentist_id -> dentistId
                startTime: new Date(a.start_time),
                endTime: new Date(a.end_time),
                reason: a.reason,
                status: a.status,
                reminderTime: a.reminder_time, // reminder_time -> reminderTime
                reminderSent: a.reminder_sent, // reminder_sent -> reminderSent
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
            // Convert snake_case from database to camelCase for frontend
            const formattedInventoryItems = inventoryItemsRes.data.map((item: any) => ({
                id: item.id,
                name: item.name,
                description: item.description,
                supplierId: item.supplier_id, // supplier_id -> supplierId
                currentStock: item.current_stock, // current_stock -> currentStock
                unitCost: item.unit_cost, // unit_cost -> unitCost
                minStockLevel: item.min_stock_level, // min_stock_level -> minStockLevel
                expiryDate: item.expiry_date // expiry_date -> expiryDate
            }));
            setInventoryItems(formattedInventoryItems);
        }
        if (expensesRes.data) {
            console.log('Setting expenses data:', expensesRes.data.length);
            // Convert snake_case from database to camelCase for frontend
            const formattedExpenses = expensesRes.data.map((expense: any) => ({
                id: expense.id,
                date: expense.date,
                description: expense.description,
                amount: expense.amount,
                category: expense.category,
                supplierId: expense.supplier_id, // supplier_id -> supplierId
                supplierInvoiceId: expense.supplier_invoice_id // supplier_invoice_id -> supplierInvoiceId
            }));
            setExpenses(formattedExpenses);
        }
        if (treatmentDefsRes.data) {
            console.log('Setting treatment definitions data:', treatmentDefsRes.data.length);
            // Convert snake_case from database to camelCase for frontend
            const formattedTreatmentDefinitions = treatmentDefsRes.data.map((def: any) => ({
                id: def.id,
                name: def.name,
                description: def.description,
                basePrice: def.base_price != null ? Number(def.base_price) : 0, // base_price -> basePrice, ensure number
                doctorPercentage: def.doctor_percentage != null ? Number(def.doctor_percentage) : 0, // doctor_percentage -> doctorPercentage, ensure number
                clinicPercentage: def.clinic_percentage != null ? Number(def.clinic_percentage) : 0 // clinic_percentage -> clinicPercentage, ensure number
            }));
            setTreatmentDefinitions(formattedTreatmentDefinitions);
        }
        if (treatmentRecordsRes.data) {
            console.log('Setting treatment records data:', treatmentRecordsRes.data.length);
            // Convert snake_case from database to camelCase for frontend
            const formattedTreatmentRecords = treatmentRecordsRes.data.map((record: any) => ({
                id: record.id,
                patientId: record.patient_id, // patient_id -> patientId
                dentistId: record.dentist_id, // dentist_id -> dentistId
                treatmentDate: record.treatment_date, // treatment_date -> treatmentDate
                treatmentDefinitionId: record.treatment_definition_id, // treatment_definition_id -> treatmentDefinitionId
                notes: record.notes,
                inventoryItemsUsed: record.inventory_items_used, // inventory_items_used -> inventoryItemsUsed
                doctorShare: Number(record.doctor_share) || 0, // doctor_share -> doctorShare, ensure number
                clinicShare: Number(record.clinic_share) || 0, // clinic_share -> clinicShare, ensure number
                totalTreatmentCost: (Number(record.doctor_share) || 0) + (Number(record.clinic_share) || 0), // Calculate total cost as number
                affectedTeeth: record.affected_teeth // affected_teeth -> affectedTeeth
            }));
            setTreatmentRecords(formattedTreatmentRecords);
        }
        if (labCasesRes.data) {
            console.log('Setting lab cases data:', labCasesRes.data.length);
            // Convert snake_case from database to camelCase for frontend
            const formattedLabCases = labCasesRes.data.map((labCase: any) => ({
                id: labCase.id,
                patientId: labCase.patient_id, // patient_id -> patientId
                labId: labCase.lab_id, // lab_id -> labId
                caseType: labCase.case_type, // case_type -> caseType
                sentDate: labCase.sent_date, // sent_date -> sentDate
                dueDate: labCase.due_date, // due_date -> dueDate
                returnDate: labCase.return_date, // return_date -> returnDate
                status: labCase.status,
                labCost: labCase.lab_cost, // lab_cost -> labCost
                notes: labCase.notes
            }));
            setLabCases(formattedLabCases);
        }
        if (paymentsRes.data) {
            console.log('Setting payments data:', paymentsRes.data.length);
            // Map snake_case from database to camelCase for frontend
            const formattedPayments = paymentsRes.data.map((p: any) => ({
                id: p.id,
                patientId: p.patient_id,
                date: p.date,
                amount: p.amount,
                method: p.method,
                notes: p.notes,
                treatmentRecordId: p.treatment_record_id,
                clinicShare: p.clinic_share,
                doctorShare: p.doctor_share
            }));
            setPayments(formattedPayments);
        }
        if (supplierInvoicesRes.data) {
            console.log('Setting supplier invoices data:', supplierInvoicesRes.data.length);
            // Convert snake_case from database to camelCase for frontend
            const formattedSupplierInvoices = supplierInvoicesRes.data.map((invoice: any) => ({
                id: invoice.id,
                supplierId: invoice.supplier_id, // supplier_id -> supplierId
                invoiceNumber: invoice.invoice_number, // invoice_number -> invoiceNumber
                invoiceDate: invoice.invoice_date, // invoice_date -> invoiceDate
                dueDate: invoice.due_date, // due_date -> dueDate
                amount: invoice.amount,
                status: invoice.status,
                items: invoice.items,
                invoiceImageUrl: invoice.invoice_image_url, // invoice_image_url -> invoiceImageUrl
                images: invoice.images,
                payments: invoice.payments
            }));
            setSupplierInvoices(formattedSupplierInvoices);
        }
        if (doctorPaymentsRes.data) {
            console.log('Setting doctor payments data:', doctorPaymentsRes.data.length);
            // Convert snake_case from database to camelCase for frontend
            const formattedDoctorPayments = doctorPaymentsRes.data.map((p: any) => ({
                id: p.id,
                dentistId: p.dentist_id, // dentist_id -> dentistId
                amount: p.amount,
                date: p.date,
                notes: p.notes
            }));
            setDoctorPayments(formattedDoctorPayments);
        }
        if (prescriptionsRes.data) {
            console.log('Setting prescriptions data:', prescriptionsRes.data.length);
            // Convert snake_case from database to camelCase for frontend
            const formattedPrescriptions = prescriptionsRes.data.map((p: any) => ({
                id: p.id,
                patientId: p.patient_id, // patient_id -> patientId
                dentistId: p.dentist_id, // dentist_id -> dentistId
                prescriptionDate: p.prescription_date, // prescription_date -> prescriptionDate
                notes: p.notes,
                userId: p.user_id,
                createdAt: p.created_at,
                updatedAt: p.updated_at
            }));
            setPrescriptions(formattedPrescriptions);
        }
        if (prescriptionItemsRes.data) {
            console.log('Setting prescription items data:', prescriptionItemsRes.data.length);
            // Convert snake_case from database to camelCase for frontend
            const formattedPrescriptionItems = prescriptionItemsRes.data.map((item: any) => ({
                id: item.id,
                prescriptionId: item.prescription_id, // prescription_id -> prescriptionId
                medicationName: item.medication_name, // medication_name -> medicationName
                dosage: item.dosage,
                quantity: item.quantity,
                instructions: item.instructions,
                userId: item.user_id,
                createdAt: item.created_at,
                updatedAt: item.updated_at
            }));
            setPrescriptionItems(formattedPrescriptionItems);
        }
        if (attachmentsRes.data) {
            console.log('Setting attachments data:', attachmentsRes.data.length);
            // Convert snake_case from database to camelCase for frontend
            const formattedAttachments = attachmentsRes.data.map((att: any) => ({
                id: att.id,
                patientId: att.patient_id,
                filename: att.filename,
                originalFilename: att.original_filename,
                fileType: att.file_type,
                fileSize: att.file_size,
                fileUrl: att.file_url,
                thumbnailUrl: att.thumbnail_url,
                description: att.description,
                uploadedBy: att.uploaded_by,
                createdAt: att.created_at,
                updatedAt: att.updated_at
            }));
            setAttachments(formattedAttachments);
        }

        const error = results.find(res => res.error);
        if (error) {
            console.error('Error fetching data:', error);
            addNotification(error?.error?.message || 'Unknown error occurred', NotificationType.ERROR);
        } else {
            console.log('All data fetched successfully');
        }
    }, [user, addNotification]);

    useEffect(() => {
        if (supabase) {
            fetchData();
        }
    }, [fetchData]);

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
    }, []);

    // Generic helper for adding data
    const addData = async <T extends { id: string }>(table: string, data: Partial<T>, setState: React.Dispatch<React.SetStateAction<T[]>>): Promise<void> => {
        if (!user || !supabase) return;
        console.log(`Adding data to table: ${table}`, { data, user_id: user.id });
        const { data: newData, error } = await supabase.from(table).insert({ ...data, user_id: user.id }).select();
        if (error) {
            console.error(`Error adding data to ${table}:`, error);
            addNotification(error.message, NotificationType.ERROR);
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
            addNotification(error.message, NotificationType.ERROR);
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
            addNotification(error.message, NotificationType.ERROR);
        } else {
            console.log(`Successfully deleted data from ${table} for id: ${id}`);
            setState((prev: T[]) => prev.filter((item: T) => item.id !== id));
        }
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
        await deleteData('expenses', id, setExpenses);
    };
    const deleteTreatmentDefinition = async (id: string) => {
        await deleteData('treatment_definitions', id, setTreatmentDefinitions);
    };
    const deleteTreatmentRecord = async (id: string) => {
        await deleteData('treatment_records', id, setTreatmentRecords);
    };
    const deleteLabCase = async (id: string) => {
        await deleteData('lab_cases', id, setLabCases);
    };
    const deletePayment = async (id: string) => {
        // Find the payment to check if it has associated doctor payments
        const paymentToDelete = payments.find(p => p.id === id);
        if (paymentToDelete && paymentToDelete.doctorShare > 0 && paymentToDelete.treatmentRecordId) {
            const treatmentRecord = treatmentRecords.find(tr => tr.id === paymentToDelete.treatmentRecordId);
            if (treatmentRecord) {
                // Find associated doctor payment
                const doctorPaymentToDelete = doctorPayments.find(dp =>
                    dp.dentistId === treatmentRecord.dentistId &&
                    dp.date === paymentToDelete.date &&
                    dp.amount === paymentToDelete.doctorShare &&
                    dp.notes && dp.notes.includes(new Date(treatmentRecord.treatmentDate).toLocaleDateString())
                );
                if (doctorPaymentToDelete) {
                    await deleteData('doctor_payments', doctorPaymentToDelete.id, setDoctorPayments);
                }
            }
        }
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

    // Attachment Management
    const addAttachment = async (attachment: Omit<PatientAttachment, 'id' | 'uploadedBy' | 'createdAt' | 'updatedAt'>) => {
        if (!user || !supabase) return;

        // Map PatientAttachment object to snake_case for Supabase
        const attachmentData = {
            patient_id: attachment.patientId,
            filename: attachment.filename,
            original_filename: attachment.originalFilename,
            file_type: attachment.fileType,
            file_size: attachment.fileSize,
            file_url: attachment.fileUrl,
            thumbnail_url: attachment.thumbnailUrl || null,
            description: attachment.description || null,
            uploaded_by: user.id,
            user_id: user.id
        };

        console.log('Adding attachment with data:', attachmentData);
        const { data: newData, error } = await supabase.from('patient_attachments').insert(attachmentData).select();
        if (error) {
            console.error('Error adding attachment:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully added attachment:', newData);
            // Convert snake_case response from Supabase back to PatientAttachment object
            const newAttachments = newData.map((att: any) => ({
                id: att.id,
                patientId: att.patient_id,
                filename: att.filename,
                originalFilename: att.original_filename,
                fileType: att.file_type,
                fileSize: att.file_size,
                fileUrl: att.file_url,
                thumbnailUrl: att.thumbnail_url,
                description: att.description,
                uploadedBy: att.uploaded_by,
                createdAt: att.created_at,
                updatedAt: att.updated_at
            }));
            setAttachments((prev: PatientAttachment[]) => [...prev, ...newAttachments]);
            addNotification('Attachment added successfully', NotificationType.SUCCESS);
        }
    };

    const updateAttachment = async (attachment: PatientAttachment) => {
        if (!supabase) return;

        // Map PatientAttachment object to snake_case for Supabase
        const { id, patientId, filename, originalFilename, fileType, fileSize, fileUrl, thumbnailUrl, description } = attachment;
        const supabaseData = {
            patient_id: patientId,
            filename,
            original_filename: originalFilename,
            file_type: fileType,
            file_size: fileSize,
            file_url: fileUrl,
            thumbnail_url: thumbnailUrl || null,
            description: description || null
        };

        console.log(`Updating attachment data:`, { id, supabaseData });
        const { error } = await supabase.from('patient_attachments').update(supabaseData).eq('id', id);

        if (error) {
            console.error(`Error updating attachment:`, error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else {
            console.log(`Successfully updated attachment for id: ${id}`);
            setAttachments((prev: PatientAttachment[]) => prev.map((item: PatientAttachment) => (item.id === id ? attachment : item)));
            addNotification('Attachment updated successfully', NotificationType.SUCCESS);
        }
    };

    const deleteAttachment = async (id: string) => {
        await deleteData('patient_attachments', id, setAttachments);
    };

    // Doctor Payment Management
    const addDoctorPayment = async (payment: Omit<DoctorPayment, 'id'>) => {
        if (!user || !supabase) return;

        // Map camelCase to snake_case for database
        const paymentData = {
            dentist_id: payment.dentistId, // dentistId -> dentist_id
            amount: payment.amount,
            date: payment.date,
            notes: payment.notes || null
        };

        console.log('Adding doctor payment with data:', paymentData);
        const { data: newData, error } = await supabase.from('doctor_payments').insert(paymentData).select();
        if (error) {
            console.error('Error adding doctor payment:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully added doctor payment:', newData);
            // Convert snake_case response from Supabase back to DoctorPayment object
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

        // Map DoctorPayment object to snake_case for Supabase
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
            dental_chart: createEmptyChart(), // Use snake_case for database column
            images: patient.images || [],
            user_id: user.id
        };

        console.log('User ID:', user.id);
        console.log('Adding patient with data:', JSON.stringify(patientData, null, 2)); // Debug log

        const { data: newData, error } = await supabase.from('patients').insert(patientData).select();

        if (error) {
            console.error('Supabase error:', error); // Debug log
            console.error('Error details:', error.details, error.hint, error.code);
            console.error('Full error object:', JSON.stringify(error, null, 2));
            addNotification(`Failed to add patient: ${error.message}`, NotificationType.ERROR);
        } else if (newData) {
            console.log('Raw response from Supabase:', newData);
            // Convert back to camelCase for frontend
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

        // Map Patient object to snake_case for Supabase
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
            dental_chart: dentalChart, // Keep as is since it's already JSONB
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
            await fetchData(); // Refresh data from database to ensure consistency
        }
    };

    // Doctor Management
    const addDoctor = async (doctor: Omit<Dentist, 'id'>) => {
        if (!user || !supabase) return;
        console.log('Adding doctor with data:', { ...doctor, user_id: user.id });
        const { data: newData, error } = await supabase.from('dentists').insert({ ...doctor, user_id: user.id }).select();
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

    // FIX: Refactor appointment management to handle snake_case/camelCase mapping and state updates correctly, removing incorrect use of generic helpers.
    // Appointment Management
    const _addAppointment = async (appointment: Omit<Appointment, 'id' | 'reminderSent'>) => {
        if (!user || !supabase) return;

        // Map Appointment object to snake_case for Supabase
        const { patientId, dentistId, startTime, endTime, reminderTime, reason, status } = appointment;
        const supabaseData = {
            reason,
            status,
            patient_id: patientId,
            dentist_id: dentistId,
            start_time: startTime,
            end_time: endTime,
            reminder_time: reminderTime,
            user_id: user.id
        };

        console.log('Adding appointment with data:', JSON.stringify(supabaseData, null, 2));
        // Insert directly since reminderSent was already removed during destructuring
        // Use select('*') to avoid schema cache issues with new columns
        const { data: newData, error } = await supabase.from('appointments').insert(supabaseData).select('*');

        // Diagnostic logs for addAppointment
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
            // Map snake_case response from Supabase back to Appointment object
            const newAppointments = newData.map((a: any) => ({
                id: a.id,
                patientId: a.patient_id,
                dentistId: a.dentist_id,
                startTime: new Date(a.start_time),
                endTime: new Date(a.end_time),
                reason: a.reason,
                status: a.status,
                reminderTime: a.reminder_time,
                reminderSent: false, // Set to false since column doesn't exist yet
                userId: a.user_id,
                createdAt: a.created_at,
                updatedAt: a.updated_at
            }));
            setAppointments((prev: Appointment[]) => [...prev, ...newAppointments]);
        }
    };

    const updateAppointment = async (appointment: Appointment) => {
        if (!user || !supabase) return;

        // Map Appointment object to snake_case for Supabase, excluding reminderSent since column doesn't exist
        const { id, patientId, dentistId, startTime, endTime, reminderTime, reminderSent, ...rest } = appointment;
        const supabaseData = {
            ...rest,
            patient_id: patientId,
            dentist_id: dentistId,
            start_time: startTime,
            end_time: endTime,
            reminder_time: reminderTime
            // reminder_sent removed since column doesn't exist in database
        };

        const { error } = await supabase.from('appointments').update(supabaseData).eq('id', id).select('*');

        // Diagnostic logs for updateAppointment
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

        // Map TreatmentRecord object to snake_case for Supabase
        const { dentistId, treatmentDate, treatmentDefinitionId, notes, inventoryItemsUsed, doctorShare, clinicShare, affectedTeeth } = record;
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
            user_id: user.id
        };

        console.log('Adding treatment record with data:', supabaseData);
        const { data: newData, error } = await supabase.from('treatment_records').insert(supabaseData).select();
        if (error) {
            console.error('Error adding treatment record:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully added treatment record:', newData);
            // Convert snake_case response from Supabase back to TreatmentRecord object
            const newTreatmentRecords = newData.map((tr: any) => ({
                id: tr.id,
                patientId: tr.patient_id,
                dentistId: tr.dentist_id,
                treatmentDate: tr.treatment_date,
                treatmentDefinitionId: tr.treatment_definition_id,
                notes: tr.notes,
                inventoryItemsUsed: tr.inventory_items_used,
                doctorShare: tr.doctor_share,
                clinicShare: tr.clinic_share,
                totalTreatmentCost: tr.doctor_share + tr.clinic_share,
                affectedTeeth: tr.affected_teeth
            }));
            setTreatmentRecords((prev: TreatmentRecord[]) => [...prev, ...newTreatmentRecords]);
        }
    };
    const updateTreatmentRecord = async (patientId: string, record: TreatmentRecord) => {
        if (!supabase) return;

        // Map TreatmentRecord object to snake_case for Supabase
        const { id, patientId: pid, dentistId, treatmentDate, treatmentDefinitionId, notes, inventoryItemsUsed, doctorShare, clinicShare, affectedTeeth } = record;
        const supabaseData = {
            patient_id: pid,
            dentist_id: dentistId,
            treatment_date: treatmentDate,
            treatment_definition_id: treatmentDefinitionId,
            notes: notes || null,
            inventory_items_used: inventoryItemsUsed,
            doctor_share: Number(doctorShare) || 0,
            clinic_share: Number(clinicShare) || 0,
            affected_teeth: affectedTeeth || []
        };

        console.log(`Updating treatment record data:`, { id, supabaseData });
        const { error } = await supabase.from('treatment_records').update(supabaseData).eq('id', id);

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

        let clinicShare = 0;
        let doctorShare = 0;

        // Calculate shares based on payment amount if treatment record is provided
        if (payment.treatmentRecordId) {
            const treatmentRecord = treatmentRecords.find(tr => tr.id === payment.treatmentRecordId);
            if (treatmentRecord) {
                const treatmentDefinition = treatmentDefinitions.find(td => td.id === treatmentRecord.treatmentDefinitionId);
                if (treatmentDefinition) {
                    // Calculate doctor's share from revenue, clinic share is revenue minus doctor's share
                    doctorShare = payment.amount * treatmentDefinition.doctorPercentage;
                    clinicShare = payment.amount - doctorShare;
                }
            }
        }

        // Map camelCase to snake_case for database
        const paymentData = {
            patient_id: payment.patientId, // patientId -> patient_id
            date: payment.date,
            amount: payment.amount,
            method: payment.method,
            notes: payment.notes || null,
            treatment_record_id: payment.treatmentRecordId || null,
            clinic_share: clinicShare,
            doctor_share: doctorShare,
            user_id: user.id
        };

        console.log('Adding payment with data:', paymentData);
        const { data: newData, error } = await supabase.from('payments').insert(paymentData).select();
        if (error) {
            console.error('Error adding payment:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully added payment:', newData);
            // Convert snake_case response from Supabase back to Payment object
            const newPayments = newData.map((p: any) => ({
                id: p.id,
                patientId: p.patient_id,
                date: p.date,
                amount: p.amount,
                method: p.method,
                notes: p.notes,
                treatmentRecordId: p.treatment_record_id,
                clinicShare: p.clinic_share,
                doctorShare: p.doctor_share
            } as Payment));
            setPayments((prev: Payment[]) => [...prev, ...newPayments]);

            // If there's a doctor's share, add it to the doctor's account
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

        // Calculate new shares based on updated payment amount
        let newClinicShare = 0;
        let newDoctorShare = 0;

        if (payment.treatmentRecordId) {
            const treatmentRecord = treatmentRecords.find(tr => tr.id === payment.treatmentRecordId);
            if (treatmentRecord) {
                const treatmentDefinition = treatmentDefinitions.find(td => td.id === treatmentRecord.treatmentDefinitionId);
                if (treatmentDefinition) {
                    newDoctorShare = payment.amount * treatmentDefinition.doctorPercentage;
                    newClinicShare = payment.amount - newDoctorShare;
                }
            }
        }

        // Update payment with new shares
        const supabaseData = {
            patient_id: payment.patientId,
            date: payment.date,
            amount: payment.amount,
            method: payment.method,
            notes: payment.notes || null,
            clinic_share: newClinicShare,
            doctor_share: newDoctorShare
        };

        console.log(`Updating payment data:`, { id: payment.id, supabaseData });
        const { error } = await supabase.from('payments').update(supabaseData).eq('id', payment.id);

        if (error) {
            console.error(`Error updating payment:`, error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else {
            console.log(`Successfully updated payment for id: ${payment.id}`);

            // Handle doctor payment recalculation
            if (payment.treatmentRecordId) {
                const treatmentRecord = treatmentRecords.find(tr => tr.id === payment.treatmentRecordId);
                if (treatmentRecord) {
                    // Find existing doctor payment
                    const existingDoctorPayment = doctorPayments.find(dp =>
                        dp.dentistId === treatmentRecord.dentistId &&
                        dp.date === payment.date &&
                        dp.amount === payment.doctorShare &&
                        dp.notes && dp.notes.includes(new Date(treatmentRecord.treatmentDate).toLocaleDateString())
                    );

                    if (newDoctorShare > 0) {
                        if (existingDoctorPayment) {
                            // Update existing doctor payment
                            const updatedDoctorPayment: DoctorPayment = {
                                ...existingDoctorPayment,
                                amount: newDoctorShare,
                                notes: `Payment share from treatment on ${new Date(treatmentRecord.treatmentDate).toLocaleDateString()}`
                            };
                            await updateDoctorPayment(updatedDoctorPayment);
                        } else {
                            // Create new doctor payment
                            const newDoctorPayment: Omit<DoctorPayment, 'id'> = {
                                dentistId: treatmentRecord.dentistId,
                                amount: newDoctorShare,
                                date: payment.date,
                                notes: `Payment share from treatment on ${new Date(treatmentRecord.treatmentDate).toLocaleDateString()}`
                            };
                            await addDoctorPayment(newDoctorPayment);
                        }
                    } else if (existingDoctorPayment) {
                        // Delete doctor payment if share becomes zero
                        await deleteData('doctor_payments', existingDoctorPayment.id, setDoctorPayments);
                    }
                }
            }

            // Update local state
            setPayments((prev: Payment[]) => prev.map((item: Payment) => (item.id === payment.id ? { ...payment, clinicShare: newClinicShare, doctorShare: newDoctorShare } : item)));
        }
    };

    // Financial & Inventory Management
    const addSupplier = async (s: Omit<Supplier, 'id'>) => {
        if (!user || !supabase) return;

        // Map camelCase to snake_case for database
        const supplierData = {
            name: s.name,
            contact_person: s.contact_person || null, // contact_person -> contact_person
            phone: s.phone || null,
            email: s.email || null,
            type: s.type,
            user_id: user.id
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

        // Map camelCase to snake_case for database
        const inventoryData = {
            name: i.name,
            description: i.description || null,
            supplier_id: i.supplierId || null, // supplierId -> supplier_id
            current_stock: Number(i.currentStock) || 0, // currentStock -> current_stock
            unit_cost: Number(i.unitCost) || 0, // unitCost -> unit_cost
            min_stock_level: Number(i.minStockLevel) || 0, // minStockLevel -> min_stock_level
            expiry_date: i.expiryDate || null, // expiryDate -> expiry_date
            user_id: user.id
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
            // Convert snake_case back to camelCase for frontend
            const formattedData = newData.map(item => ({
                id: item.id,
                name: item.name,
                description: item.description,
                supplierId: item.supplier_id, // supplier_id -> supplierId
                currentStock: item.current_stock, // current_stock -> currentStock
                unitCost: item.unit_cost, // unit_cost -> unitCost
                minStockLevel: item.min_stock_level, // min_stock_level -> minStockLevel
                expiryDate: item.expiry_date // expiry_date -> expiryDate
            }));
            setInventoryItems((prev: InventoryItem[]) => [...prev, ...formattedData as InventoryItem[]]);
            addNotification('Inventory item added successfully', NotificationType.SUCCESS);
        }
    };
    const updateInventoryItem = async (i: InventoryItem) => {
        if (!supabase) return;

        // Map InventoryItem object to snake_case for Supabase
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

        // Map camelCase to snake_case for database
        const expenseData = {
            date: e.date,
            description: e.description,
            amount: Number(e.amount) || 0,
            category: e.category,
            supplier_id: e.supplierId || null, // supplierId -> supplier_id
            supplier_invoice_id: e.supplierInvoiceId || null, // supplierInvoiceId -> supplier_invoice_id
            user_id: user.id
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
            setExpenses((prev: Expense[]) => [...prev, ...newData as Expense[]]);
            addNotification('Expense added successfully', NotificationType.SUCCESS);
            if (e.supplierInvoiceId) {
                  const expenseId = newData[0].id;
                  const {data: invoice, error} = await supabase.from('supplier_invoices').select('*').eq('id', e.supplierInvoiceId).single();
                  if (invoice) {
                    const newPayments = [...(invoice.payments || []), { expenseId, amount: e.amount, date: e.date }];
                    await updateData('supplier_invoices', {...invoice, payments: newPayments }, setSupplierInvoices);
                  }
            }
        }
    };
    const updateExpense = async (e: Expense) => {
        await updateData('expenses', e, setExpenses);
    };

    const addTreatmentDefinition = async (d: Omit<TreatmentDefinition, 'id'>) => {
        if (!user || !supabase) return;

        // Map camelCase to snake_case for database
        const treatmentData = {
            name: d.name,
            description: d.description || null,
            base_price: Number(d.basePrice) || 0, // basePrice -> base_price
            doctor_percentage: Number(d.doctorPercentage) || 0, // doctorPercentage -> doctor_percentage
            clinic_percentage: Number(d.clinicPercentage) || 0, // clinicPercentage -> clinic_percentage
            user_id: user.id
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
            // Convert snake_case response from Supabase back to TreatmentDefinition object
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

        // Map TreatmentDefinition object to snake_case for Supabase
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

    const addLabCase = async (lc: Omit<LabCase, 'id'>) => {
        if (!user || !supabase) return;

        // Map camelCase to snake_case for database
        const labCaseData = {
            patient_id: lc.patientId, // patientId -> patient_id
            lab_id: lc.labId, // labId -> lab_id
            case_type: lc.caseType, // caseType -> case_type
            sent_date: lc.sentDate, // sentDate -> sent_date
            due_date: lc.dueDate, // dueDate -> due_date
            return_date: lc.returnDate || null, // returnDate -> return_date
            status: lc.status,
            lab_cost: Number(lc.labCost) || 0, // labCost -> lab_cost
            notes: lc.notes || null,
            user_id: user.id
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
            // Convert snake_case response from Supabase back to LabCase object
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

        // Map LabCase object to snake_case for Supabase
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

        // Map camelCase to snake_case for database
        const invoiceData = {
            supplier_id: i.supplierId, // supplierId -> supplier_id
            invoice_number: i.invoiceNumber || null, // invoiceNumber -> invoice_number
            invoice_date: i.invoiceDate, // invoiceDate -> invoice_date
            due_date: i.dueDate || null, // dueDate -> due_date
            amount: Number(i.amount) || 0,
            status: i.status,
            items: i.items || [],
            invoice_image_url: i.invoiceImageUrl || null, // invoiceImageUrl -> invoice_image_url
            // images: i.images, // Commented out as it's not in the Omit type
            payments: [], // Always start with empty payments array
            user_id: user.id
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
        }
    };
    const updateSupplierInvoice = async (i: SupplierInvoice) => {
        await updateData('supplier_invoices', i, setSupplierInvoices);
    };

    const paySupplierInvoice = async (invoice: SupplierInvoice) => {
        if (!supabase) return;
        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
        const balance = invoice.amount - totalPaid;
        if(balance <= 0) return;

        const newExpense: Omit<Expense, 'id'> = {
            date: new Date().toISOString().split('T')[0],
            description: `Payment for invoice #${invoice.invoiceNumber || invoice.id.slice(-4)}`,
            amount: balance,
            // FIX: Use ExpenseCategory enum instead of string literal to fix type error.
            category: ExpenseCategory.SUPPLIES,
            supplierId: invoice.supplierId,
            supplierInvoiceId: invoice.id,
        };
        await addExpense(newExpense);
    };

    // Prescription Management
    const addPrescription = async (prescription: Omit<Prescription, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (!user || !supabase) return;

        // Map camelCase to snake_case for database
        const prescriptionData = {
            patient_id: prescription.patientId, // patientId -> patient_id
            dentist_id: prescription.dentistId, // dentistId -> dentist_id
            prescription_date: prescription.prescriptionDate, // prescriptionDate -> prescription_date
            notes: prescription.notes || null,
            user_id: user.id
        };

        console.log('Adding prescription with data:', prescriptionData);
        const { data: newData, error } = await supabase.from('prescriptions').insert(prescriptionData).select();
        if (error) {
            console.error('Error adding prescription:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully added prescription:', newData);
            // Convert snake_case response from Supabase back to Prescription object
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
        }
    };
    const updatePrescription = async (prescription: Prescription) => {
        if (!supabase) return;

        // Map Prescription object to snake_case for Supabase
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

        // Map camelCase to snake_case for database
        const itemData = {
            prescription_id: prescriptionId, // prescriptionId -> prescription_id
            medication_name: item.medicationName, // medicationName -> medication_name
            dosage: item.dosage || null,
            quantity: item.quantity,
            instructions: item.instructions || null,
            user_id: user.id
        };

        console.log('Adding prescription item with data:', itemData);
        const { data: newData, error } = await supabase.from('prescription_items').insert(itemData).select();
        if (error) {
            console.error('Error adding prescription item:', error);
            console.error('Error details:', error.details, error.hint, error.code);
            addNotification(error.message, NotificationType.ERROR);
        } else if (newData) {
            console.log('Successfully added prescription item:', newData);
            // Convert snake_case response from Supabase back to PrescriptionItem object
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

        // Map PrescriptionItem object to snake_case for Supabase
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

    // Clinic settings functions
    const updateClinicInfo = (info: ClinicInfo) => {
        setClinicInfo(info);
        localStorage.setItem('curasoft_clinic_info', JSON.stringify(info));
        addNotification('Clinic information updated successfully', NotificationType.SUCCESS);
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

        try {
            // Clear existing data first
            const tables = [
                'patients', 'dentists', 'appointments', 'suppliers', 'inventory_items',
                'expenses', 'treatment_definitions', 'treatment_records', 'lab_cases',
                'payments', 'supplier_invoices'
            ];

            // Delete all existing data
            for (const table of tables) {
                await supabase.from(table).delete().eq('user_id', user.id);
            }

            // Insert restored data with proper UUID generation for sample data
            if (data.patients) {
                for (const patient of data.patients) {
                    const patientData = {
                        ...patient,
                        id: patient.id.startsWith('sample-') ? undefined : patient.id, // Let Supabase generate UUID for sample data
                        user_id: user.id
                    };
                    await supabase.from('patients').insert(patientData);
                }
            }
            if (data.dentists) {
                for (const dentist of data.dentists) {
                    const dentistData = {
                        ...dentist,
                        id: dentist.id.startsWith('sample-') ? undefined : dentist.id, // Let Supabase generate UUID for sample data
                        user_id: user.id
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
                        id: appointment.id.startsWith('sample-') ? undefined : appointment.id, // Let Supabase generate UUID for sample data
                        user_id: user.id
                    };
                    await supabase.from('appointments').insert(appointmentData);
                }
            }
            if (data.suppliers) {
                for (const supplier of data.suppliers) {
                    const supplierData = {
                        ...supplier,
                        id: supplier.id.startsWith('sample-') ? undefined : supplier.id, // Let Supabase generate UUID for sample data
                        user_id: user.id
                    };
                    await supabase.from('suppliers').insert(supplierData);
                }
            }
            if (data.inventoryItems) {
                for (const item of data.inventoryItems) {
                    const itemData = {
                        ...item,
                        id: item.id.startsWith('sample-') ? undefined : item.id, // Let Supabase generate UUID for sample data
                        user_id: user.id
                    };
                    await supabase.from('inventory_items').insert(itemData);
                }
            }
            if (data.expenses) {
                for (const expense of data.expenses) {
                    const expenseData = {
                        ...expense,
                        id: expense.id.startsWith('sample-') ? undefined : expense.id, // Let Supabase generate UUID for sample data
                        user_id: user.id
                    };
                    await supabase.from('expenses').insert(expenseData);
                }
            }
            if (data.treatmentDefinitions) {
                for (const def of data.treatmentDefinitions) {
                    const defData = {
                        ...def,
                        id: def.id.startsWith('sample-') ? undefined : def.id, // Let Supabase generate UUID for sample data
                        user_id: user.id
                    };
                    await supabase.from('treatment_definitions').insert(defData);
                }
            }
            if (data.treatmentRecords) {
                for (const record of data.treatmentRecords) {
                    const recordData = {
                        ...record,
                        id: record.id.startsWith('sample-') ? undefined : record.id, // Let Supabase generate UUID for sample data
                        user_id: user.id
                    };
                    await supabase.from('treatment_records').insert(recordData);
                }
            }
            if (data.labCases) {
                for (const labCase of data.labCases) {
                    const labCaseData = {
                        ...labCase,
                        id: labCase.id.startsWith('sample-') ? undefined : labCase.id, // Let Supabase generate UUID for sample data
                        user_id: user.id
                    };
                    await supabase.from('lab_cases').insert(labCaseData);
                }
            }
            if (data.payments) {
                for (const payment of data.payments) {
                    const paymentData = {
                        ...payment,
                        id: payment.id.startsWith('sample-') ? undefined : payment.id, // Let Supabase generate UUID for sample data
                        user_id: user.id
                    };
                    await supabase.from('payments').insert(paymentData);
                }
            }
            if (data.supplierInvoices) {
                for (const invoice of data.supplierInvoices) {
                    const invoiceData = {
                        ...invoice,
                        id: invoice.id.startsWith('sample-') ? undefined : invoice.id, // Let Supabase generate UUID for sample data
                        user_id: user.id
                    };
                    await supabase.from('supplier_invoices').insert(invoiceData);
                }
            }

            // Refresh local state
            await fetchData();
        } catch (error) {
            console.error("Restore failed:", error);
            addNotification("Failed to restore data", NotificationType.ERROR);
        }
    };
    
    return {
        patients, addPatient, updatePatient, deletePatient,
        dentists, addDoctor, updateDoctor, deleteDoctor,
        appointments, addAppointment: _addAppointment, updateAppointment, deleteAppointment,
        suppliers, addSupplier, updateSupplier, deleteSupplier,
        inventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem,
        expenses, addExpense, updateExpense, deleteExpense,
        treatmentDefinitions, addTreatmentDefinition, updateTreatmentDefinition, deleteTreatmentDefinition,
        treatmentRecords, addTreatmentRecord, updateTreatmentRecord, deleteTreatmentRecord,
        labCases, addLabCase, updateLabCase, deleteLabCase,
        payments, addPayment, updatePayment, deletePayment,
        supplierInvoices, addSupplierInvoice, updateSupplierInvoice, deleteSupplierInvoice, paySupplierInvoice,
        doctorPayments, addDoctorPayment, updateDoctorPayment, deleteDoctorPayment,
        prescriptions, addPrescription, updatePrescription, deletePrescription,
        prescriptionItems, addPrescriptionItem, updatePrescriptionItem, deletePrescriptionItem,
        attachments, addAttachment, updateAttachment, deleteAttachment,
        clinicInfo, updateClinicInfo,
        whatsappMessageTemplate, updateWhatsappMessageTemplate,
        reminderMessageTemplate, updateReminderMessageTemplate,
        restoreData
    };
};
