import React from 'react';
import { render } from '@testing-library/react';
import PatientListItem from './components/PatientList';

// Mock data for testing
const mockPatientWithImage = {
    id: '1',
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
    images: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...'], // Sample base64 image
    attachments: []
};

const mockPatientWithoutImage = {
    id: '2',
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
    images: [], // No images
    attachments: []
};

const mockClinicData = {
    patients: [mockPatientWithImage, mockPatientWithoutImage],
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
            patientId: '1',
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
            patientId: '1',
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
            patientId: '1',
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
        whatsappMessageTemplate: 'مرحبا {patientName}, هذا تذكير بموعدك في {clinicName}'
    },
    addPatient: () => {},
    updatePatient: () => {},
    deletePatient: () => {},
    whatsappMessageTemplate: 'مرحبا {patientName}, هذا تذكير بموعدك في {clinicName}'
};

describe('PatientListItem Component', () => {
    it('should render patient with image correctly', () => {
        const { getByText, getByAltText } = render(
            <PatientListItem
                patient={mockPatientWithImage}
                onSelect={() => {}}
                onDelete={() => {}}
                clinicData={mockClinicData}
            />
        );

        // Check if patient name is rendered
        expect(getByText('أحمد محمد علي')).toBeInTheDocument();
        
        // Check if patient image is rendered
        const patientImage = getByAltText('أحمد محمد علي');
        expect(patientImage).toBeInTheDocument();
        expect(patientImage).toHaveAttribute('src', mockPatientWithImage.images[0]);
    });

    it('should render patient without image correctly (fallback to initials)', () => {
        const { getByText, queryByAltText } = render(
            <PatientListItem
                patient={mockPatientWithoutImage}
                onSelect={() => {}}
                onDelete={() => {}}
                clinicData={mockClinicData}
            />
        );

        // Check if patient name is rendered
        expect(getByText('فاطمة علي حسن')).toBeInTheDocument();
        
        // Check if image is not rendered (fallback to initials)
        expect(queryByAltText('فاطمة علي حسن')).not.toBeInTheDocument();
        
        // Check if initials are rendered instead
        expect(getByText('ف.ع.ح')).toBeInTheDocument();
    });

    it('should display patient information boxes correctly', () => {
        const { getByText } = render(
            <PatientListItem
                patient={mockPatientWithImage}
                onSelect={() => {}}
                onDelete={() => {}}
                clinicData={mockClinicData}
            />
        );

        // Check if information boxes are rendered
        expect(getByText('آخر زيارة')).toBeInTheDocument();
        expect(getByText('15‏/10‏/2023')).toBeInTheDocument(); // Formatted date
        expect(getByText('موعد قادم')).toBeInTheDocument();
        expect(getByText('15‏/12‏/2023')).toBeInTheDocument(); // Formatted date
        expect(getByText('آخر دفعة')).toBeInTheDocument();
        expect(getByText('30‏/11‏/2023')).toBeInTheDocument(); // Formatted date
        expect(getByText('جنيه1,500.00')).toBeInTheDocument(); // Formatted currency
        expect(getByText('الطبيب المعالج')).toBeInTheDocument();
        expect(getByText('د. محمد سمير')).toBeInTheDocument();
    });
});