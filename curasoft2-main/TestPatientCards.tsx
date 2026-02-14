import React from 'react';
import PatientListItem from './components/PatientList';

// Sample patient data for testing
const samplePatientWithImage = {
    id: 'test-1',
    name: 'أحمد محمد علي',
    dob: '1985-05-15',
    gender: 'Male' as const,
    phone: '01012345678',
    email: 'ahmed@example.com',
    address: '123 Main St, Cairo',
    medicalHistory: 'No major issues',
    treatmentNotes: '',
    lastVisit: '2023-10-15',
    allergies: 'None',
    medications: 'None',
    insuranceProvider: 'Company Insurance',
    insurancePolicyNumber: 'INS12345',
    emergencyContactName: 'Mohamed Ahmed',
    emergencyContactPhone: '01234567890',
    dentalChart: {},
    images: ['https://via.placeholder.com/150?text=AHMED'], // Sample image URL
    attachments: []
};

const samplePatientWithoutImage = {
    id: 'test-2',
    name: 'فاطمة علي حسن',
    dob: '1990-08-22',
    gender: 'Female' as const,
    phone: '01123456789',
    email: 'fatma@example.com',
    address: '456 Oak St, Giza',
    medicalHistory: 'Allergic to penicillin',
    treatmentNotes: '',
    lastVisit: '2023-11-20',
    allergies: 'Penicillin',
    medications: 'None',
    insuranceProvider: 'National Insurance',
    insurancePolicyNumber: 'INS67890',
    emergencyContactName: 'Ali Hassan',
    emergencyContactPhone: '01098765432',
    dentalChart: {},
    images: [], // No images - should show initials
    attachments: []
};

const sampleClinicData = {
    patients: [samplePatientWithImage, samplePatientWithoutImage],
    dentists: [
        {
            id: 'd1',
            name: 'د. محمد سمير',
            specialty: 'General Dentistry',
            color: '#4F46E5'
        }
    ],
    appointments: [
        {
            id: 'a1',
            patientId: 'test-1',
            dentistId: 'd1',
            startTime: new Date('2023-12-15T10:00:00'),
            endTime: new Date('2023-12-15T11:00:00'),
            reason: 'Regular checkup',
            status: 'SCHEDULED' as const,
            reminderTime: '1_day_before' as const,
            reminderSent: false,
            userId: 'u1',
            createdAt: '2023-12-10',
            updatedAt: '2023-12-10'
        }
    ],
    payments: [
        {
            id: 'p1',
            patientId: 'test-1',
            date: '2023-11-30',
            amount: 1500,
            method: 'Cash' as const,
            notes: 'Payment for cleaning',
            treatmentRecordId: 't1',
            clinicShare: 600,
            doctorShare: 900
        }
    ],
    treatmentRecords: [
        {
            id: 't1',
            patientId: 'test-1',
            dentistId: 'd1',
            treatmentDate: '2023-11-30',
            treatmentDefinitionId: 'td1',
            notes: 'Regular cleaning',
            inventoryItemsUsed: [],
            doctorShare: 900,
            clinicShare: 600,
            totalTreatmentCost: 1500,
            affectedTeeth: []
        }
    ],
    clinicInfo: {
        name: 'عيادة كيوراسوف',
        address: '123 Clinic St, Cairo',
        phone: '02123456789',
        email: 'clinic@example.com'
    },
    addPatient: async () => {},
    updatePatient: async () => {},
    deletePatient: async () => {},
    addDoctor: async () => {},
    updateDoctor: async () => {},
    deleteDoctor: async () => {},
    addAppointment: async () => {},
    updateAppointment: async () => {},
    deleteAppointment: async () => {},
    suppliers: [],
    addSupplier: async () => {},
    updateSupplier: async () => {},
    deleteSupplier: async () => {},
    inventoryItems: [],
    addInventoryItem: async () => {},
    updateInventoryItem: async () => {},
    deleteInventoryItem: async () => {},
    expenses: [],
    addExpense: async () => {},
    updateExpense: async () => {},
    deleteExpense: async () => {},
    treatmentDefinitions: [],
    addTreatmentDefinition: async () => {},
    updateTreatmentDefinition: async () => {},
    deleteTreatmentDefinition: async () => {},
    labCases: [],
    addLabCase: async () => {},
    updateLabCase: async () => {},
    deleteLabCase: async () => {},
    supplierInvoices: [],
    addSupplierInvoice: async () => {},
    updateSupplierInvoice: async () => {},
    deleteSupplierInvoice: async () => {},
    paySupplierInvoice: async () => {},
    doctorPayments: [],
    addDoctorPayment: async () => {},
    updateDoctorPayment: async () => {},
    deleteDoctorPayment: async () => {},
    prescriptions: [],
    addPrescription: async () => {},
    updatePrescription: async () => {},
    deletePrescription: async () => {},
    prescriptionItems: [],
    addPrescriptionItem: async () => {},
    updatePrescriptionItem: async () => {},
    deletePrescriptionItem: async () => {},
    attachments: [],
    addAttachment: async () => {},
    updateAttachment: async () => {},
    deleteAttachment: async () => {},
    supplierInvoiceAttachments: [],
    addSupplierInvoiceAttachment: async () => {},
    updateSupplierInvoiceAttachment: async () => {},
    deleteSupplierInvoiceAttachment: async () => {},
    whatsappMessageTemplate: 'مرحبا {patientName}, هذا تذكير بموعدك في {clinicName}',
    updateWhatsappMessageTemplate: () => {},
    reminderMessageTemplate: 'مرحباً {patientName}، هذا تذكير من عيادة {clinicName} لطب الأسنان بموعدك يوم {appointmentDate} الساعة {appointmentTime}. نتطلع لرؤيتك.{doctorName}',
    updateReminderMessageTemplate: () => {},
    restoreData: async () => {}
};

const TestPatientCards = () => {
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-center mb-8 text-primary">اختبار تصميم بطاقات المرضى الجديدة</h1>
            
            <div className="space-y-8">
                {/* Patient with image */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-green-600">بطاقة مريض مع صورة</h2>
                    <PatientListItem
                        patient={samplePatientWithImage}
                        onSelect={() => alert('Patient selected: ' + samplePatientWithImage.name)}
                        onDelete={() => alert('Delete patient: ' + samplePatientWithImage.name)}
                        clinicData={sampleClinicData}
                    />
                </div>

                {/* Patient without image */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-blue-600">بطاقة مريض بدون صورة (احرف اولية)</h2>
                    <PatientListItem
                        patient={samplePatientWithoutImage}
                        onSelect={() => alert('Patient selected: ' + samplePatientWithoutImage.name)}
                        onDelete={() => alert('Delete patient: ' + samplePatientWithoutImage.name)}
                        clinicData={sampleClinicData}
                    />
                </div>
            </div>
            
            <div className="mt-12 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">ملاحظات الاختبار:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>يجب أن تظهر صورة المريض في بطاقة أحمد محمد علي</li>
                    <li>يجب أن تظهر الأحرف الأولى (ف.ع.ح) في بطاقة فاطمة علي حسن</li>
                    <li>يجب أن تظهر جميع معلومات المريض بشكل صحيح</li>
                    <li>يجب أن تعمل الأزرار (حذف، واتساب، توسيع) بشكل صحيح</li>
                    <li>يجب أن يكون التصميم متجاوب مع مختلف أحجام الشاشات</li>
                    <li>يجب أن يظهر الرصيد المستحق (إذا كان هناك رصيد) بشكل بارز</li>
                </ul>
            </div>
        </div>
    );
};

export default TestPatientCards;