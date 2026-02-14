import React, { useState, useMemo, useCallback } from 'react';
import { useI18n } from '../hooks/useI18n';
import { 
    BookingService, 
    TimeSlot, 
    OnlineReservationStatus,
    CreateReservationRequest 
} from '../types';
import { supabase } from '../supabaseClient';

// Icons as components
const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

// Mock services data
const MOCK_SERVICES: BookingService[] = [
    { id: '1', name: 'Consultation', description: 'Initial examination and consultation', duration: 30, price: 100 },
    { id: '2', name: 'Teeth Cleaning', description: 'Professional teeth cleaning', duration: 45, price: 150 },
    { id: '3', name: 'Dental Checkup', description: 'Complete dental examination', duration: 30, price: 120 },
    { id: '4', name: 'Filling', description: 'Tooth filling procedure', duration: 45, price: 200 },
    { id: '5', name: 'Root Canal', description: 'Root canal treatment', duration: 90, price: 500 },
    { id: '6', name: 'Extraction', description: 'Tooth extraction', duration: 45, price: 250 },
    { id: '7', name: 'Orthodontics Consultation', description: 'Braces and aligners consultation', duration: 45, price: 150 },
    { id: '8', name: 'Whitening', description: 'Teeth whitening treatment', duration: 60, price: 400 },
];

// Mock dentists data
interface MockDentist {
    id: string;
    name: string;
    specialty: string;
}

const MOCK_DENTISTS: MockDentist[] = [
    { id: '1', name: 'Dr. Ahmed Hassan', specialty: 'General Dentistry' },
    { id: '2', name: 'Dr. Sara Mohamed', specialty: 'Orthodontics' },
    { id: '3', name: 'Dr. Ali Kamal', specialty: 'Oral Surgery' },
    { id: '4', name: 'Dr. Fatima Hussein', specialty: 'Pediatric Dentistry' },
];

type BookingStep = 'service' | 'dentist' | 'datetime' | 'patient' | 'confirmation';

const PublicBookingPage: React.FC = () => {
    const { t, direction } = useI18n();
    const isRTL = direction === 'rtl';

    const [currentStep, setCurrentStep] = useState<BookingStep>('service');
    const [selectedService, setSelectedService] = useState<BookingService | null>(null);
    const [selectedDentist, setSelectedDentist] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    
    // Patient info form state
    const [patientName, setPatientName] = useState('');
    const [patientPhone, setPatientPhone] = useState('');
    const [patientEmail, setPatientEmail] = useState('');
    const [patientReason, setPatientReason] = useState('');
    
    // Form validation
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reservationId, setReservationId] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Generate next 14 days for date selection
    const availableDates = useMemo(() => {
        const dates: Date[] = [];
        const today = new Date();
        for (let i = 1; i <= 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            // Skip Fridays (day 5) if needed
            if (date.getDay() !== 5) {
                dates.push(date);
            }
        }
        return dates;
    }, []);

    // Generate time slots for selected date
    const generateTimeSlots = useCallback((date: Date): TimeSlot[] => {
        const slots: TimeSlot[] = [];
        const startHour = 9;
        const endHour = 18;
        const interval = 30; // 30 minutes

        // Mock availability - in real app, fetch from API
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += interval) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                // Random availability for demo
                const available = Math.random() > 0.3;
                slots.push({
                    time,
                    available,
                    dentistId: selectedDentist || undefined,
                    dentistName: selectedDentist 
                        ? MOCK_DENTISTS.find(d => d.id === selectedDentist)?.name 
                        : 'Any Dentist',
                });
            }
        }
        return slots;
    }, [selectedDentist]);

    // Fetch available slots when date changes
    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setSelectedTime(null);
        const slots = generateTimeSlots(date);
        setAvailableSlots(slots);
    };

    // Validate patient form
    const validatePatientForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (!patientName.trim()) {
            newErrors.patientName = t('publicBooking.nameRequired') || 'Name is required';
        }
        
        if (!patientPhone.trim()) {
            newErrors.patientPhone = t('publicBooking.phoneRequired') || 'Phone is required';
        } else if (patientPhone.length < 10) {
            newErrors.patientPhone = t('publicBooking.phoneInvalid') || 'Please enter a valid phone number';
        }
        
        // Email validation (optional)
        if (patientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail)) {
            newErrors.patientEmail = t('publicBooking.emailInvalid') || 'Please enter a valid email';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit reservation
    const handleSubmitReservation = async () => {
        if (!validatePatientForm()) return;
        
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const reservation: CreateReservationRequest = {
                patientName: patientName.trim(),
                patientPhone: patientPhone.trim(),
                patientEmail: patientEmail.trim() || undefined,
                preferredDentistId: selectedDentist || undefined,
                serviceId: selectedService?.id,
                requestedDate: selectedDate!.toISOString().split('T')[0],
                requestedTime: selectedTime!,
                durationMinutes: selectedService?.duration || 60,
                reason: patientReason.trim() || undefined,
            };

            // In real app, call API here
            // For demo, simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Mock successful response
            const mockReservationId = `RES-${Date.now().toString(36).toUpperCase()}`;
            setReservationId(mockReservationId);
            setCurrentStep('confirmation');
            
        } catch (error) {
            setSubmitError(t('publicBooking.submitError') || 'Failed to submit reservation. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Step navigation
    const goToNextStep = () => {
        const stepOrder: BookingStep[] = ['service', 'dentist', 'datetime', 'patient', 'confirmation'];
        const currentIndex = stepOrder.indexOf(currentStep);
        if (currentIndex < stepOrder.length - 1) {
            setCurrentStep(stepOrder[currentIndex + 1]);
        }
    };

    const goToPreviousStep = () => {
        const stepOrder: BookingStep[] = ['service', 'dentist', 'datetime', 'patient', 'confirmation'];
        const currentIndex = stepOrder.indexOf(currentStep);
        if (currentIndex > 0) {
            setCurrentStep(stepOrder[currentIndex - 1]);
        }
    };

    // Format date for display
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
    };

    // Get selected dentist name
    const getSelectedDentistName = () => {
        if (!selectedDentist) return t('publicBooking.anyDentist') || 'Any Available Dentist';
        const dentist = MOCK_DENTISTS.find(d => d.id === selectedDentist);
        return dentist?.name || t('publicBooking.anyDentist');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {/* Header */}
            <header className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-6 px-4 shadow-lg">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl font-bold mb-2">
                        {t('publicBooking.title') || 'Book Your Appointment'}
                    </h1>
                    <p className="text-purple-100">
                        {t('publicBooking.subtitle') || 'Schedule your visit online'}
                    </p>
                </div>
            </header>

            {/* Progress Steps */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-8">
                    {['service', 'dentist', 'datetime', 'patient'].map((step, index) => {
                        const stepKeys: BookingStep[] = ['service', 'dentist', 'datetime', 'patient'];
                        const currentIndex = stepKeys.indexOf(currentStep);
                        const isActive = step === currentStep;
                        const isCompleted = stepKeys.indexOf(step as BookingStep) < currentIndex;

                        return (
                            <React.Fragment key={step}>
                                <div className={`flex items-center ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        isCompleted ? 'bg-green-500 text-white' : 
                                        isActive ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-700'
                                    }`}>
                                        {isCompleted ? (
                                            <CheckCircleIcon />
                                        ) : (
                                            <span className="text-sm font-medium">{index + 1}</span>
                                        )}
                                    </div>
                                    <span className="ml-2 text-sm font-medium hidden sm:inline">
                                        {t(`publicBooking.step.${step}`) || step.charAt(0).toUpperCase() + step.slice(1)}
                                    </span>
                                </div>
                                {index < 3 && (
                                    <div className={`flex-1 h-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Step Content */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
                    {/* Step 1: Service Selection */}
                    {currentStep === 'service' && (
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                                {t('publicBooking.selectService') || 'Select a Service'}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {MOCK_SERVICES.map(service => (
                                    <button
                                        key={service.id}
                                        onClick={() => {
                                            setSelectedService(service);
                                            goToNextStep();
                                        }}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                                            selectedService?.id === service.id
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                                                    {service.name}
                                                </h3>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {service.description}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2 text-sm text-slate-600 dark:text-slate-400">
                                                    <ClockIcon />
                                                    <span>{service.duration} min</span>
                                                    {service.price && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="font-medium text-green-600 dark:text-green-400">
                                                                {service.price} EGP
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            {selectedService?.id === service.id && (
                                                <CheckCircleIcon />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Dentist Selection */}
                    {currentStep === 'dentist' && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <button
                                    onClick={goToPreviousStep}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                >
                                    <ChevronLeftIcon />
                                </button>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                                    {t('publicBooking.selectDentist') || 'Select a Dentist (Optional)'}
                                </h2>
                            </div>
                            <p className="text-slate-500 mb-4">
                                {t('publicBooking.dentistOptional') || 'Leave empty to see all available dentists'}
                            </p>
                            
                            {/* Any Dentist Option */}
                            <button
                                onClick={() => {
                                    setSelectedDentist(null);
                                    goToNextStep();
                                }}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all mb-4 ${
                                    selectedDentist === null
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                                            {t('publicBooking.anyDentist') || 'Any Available Dentist'}
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            {t('publicBooking.anyDentistDesc') || 'We will assign the best available dentist'}
                                        </p>
                                    </div>
                                    {selectedDentist === null && <CheckCircleIcon />}
                                </div>
                            </button>

                            {/* Specific Dentists */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {MOCK_DENTISTS.map(dentist => (
                                    <button
                                        key={dentist.id}
                                        onClick={() => {
                                            setSelectedDentist(dentist.id);
                                            goToNextStep();
                                        }}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                                            selectedDentist === dentist.id
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                                                    {dentist.name}
                                                </h3>
                                                <p className="text-sm text-slate-500">
                                                    {dentist.specialty}
                                                </p>
                                            </div>
                                            {selectedDentist === dentist.id && <CheckCircleIcon />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Date & Time Selection */}
                    {currentStep === 'datetime' && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <button
                                    onClick={goToPreviousStep}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                >
                                    <ChevronLeftIcon />
                                </button>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                                    {t('publicBooking.selectDateTime') || 'Select Date & Time'}
                                </h2>
                            </div>

                            {/* Date Selection */}
                            <div className="mb-6">
                                <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-3">
                                    {t('publicBooking.selectDate') || 'Select a Date'}
                                </h3>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {availableDates.map((date, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleDateSelect(date)}
                                            className={`flex-shrink-0 p-3 rounded-xl border-2 text-center transition-all ${
                                                selectedDate?.toDateString() === date.toDateString()
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                                            }`}
                                        >
                                            <div className="text-sm text-slate-500">
                                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </div>
                                            <div className="font-bold text-slate-800 dark:text-slate-200">
                                                {date.getDate()}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                {date.toLocaleDateString('en-US', { month: 'short' })}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Time Selection */}
                            {selectedDate && (
                                <div>
                                    <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-3">
                                        {t('publicBooking.selectTime') || 'Select a Time'}
                                    </h3>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                        {availableSlots.map((slot, index) => (
                                            <button
                                                key={index}
                                                disabled={!slot.available}
                                                onClick={() => {
                                                    setSelectedTime(slot.time);
                                                    goToNextStep();
                                                }}
                                                className={`p-2 rounded-lg text-sm font-medium transition-all ${
                                                    selectedTime === slot.time
                                                        ? 'bg-purple-600 text-white'
                                                        : slot.available
                                                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                                }`}
                                            >
                                                {slot.time}
                                            </button>
                                        ))}
                                    </div>
                                    {!availableSlots.some(s => s.available) && (
                                        <p className="text-center text-slate-500 py-4">
                                            {t('publicBooking.noSlotsAvailable') || 'No slots available for this date'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Patient Information */}
                    {currentStep === 'patient' && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <button
                                    onClick={goToPreviousStep}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                >
                                    <ChevronLeftIcon />
                                </button>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                                    {t('publicBooking.patientInfo') || 'Your Information'}
                                </h2>
                            </div>

                            {/* Booking Summary */}
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6">
                                <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">
                                    {t('publicBooking.bookingSummary') || 'Booking Summary'}
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            {t('publicBooking.service') || 'Service'}:
                                        </span>
                                        <span className="font-medium text-slate-800 dark:text-slate-200">
                                            {selectedService?.name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            {t('publicBooking.dentist') || 'Dentist'}:
                                        </span>
                                        <span className="font-medium text-slate-800 dark:text-slate-200">
                                            {getSelectedDentistName()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            {t('publicBooking.date') || 'Date'}:
                                        </span>
                                        <span className="font-medium text-slate-800 dark:text-slate-200">
                                            {selectedDate && formatDate(selectedDate)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            {t('publicBooking.time') || 'Time'}:
                                        </span>
                                        <span className="font-medium text-slate-800 dark:text-slate-200">
                                            {selectedTime}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Patient Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        {t('publicBooking.name') || 'Full Name'} *
                                    </label>
                                    <input
                                        type="text"
                                        value={patientName}
                                        onChange={(e) => setPatientName(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-lg border ${
                                            errors.patientName 
                                                ? 'border-red-300 focus:border-red-500' 
                                                : 'border-slate-200 dark:border-slate-600 focus:border-purple-500'
                                        } bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500/20`}
                                        placeholder={t('publicBooking.namePlaceholder') || 'Enter your full name'}
                                    />
                                    {errors.patientName && (
                                        <p className="text-red-500 text-sm mt-1">{errors.patientName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        {t('publicBooking.phone') || 'Phone Number'} *
                                    </label>
                                    <input
                                        type="tel"
                                        value={patientPhone}
                                        onChange={(e) => setPatientPhone(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-lg border ${
                                            errors.patientPhone 
                                                ? 'border-red-300 focus:border-red-500' 
                                                : 'border-slate-200 dark:border-slate-600 focus:border-purple-500'
                                        } bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500/20`}
                                        placeholder={t('publicBooking.phonePlaceholder') || 'Enter your phone number'}
                                    />
                                    {errors.patientPhone && (
                                        <p className="text-red-500 text-sm mt-1">{errors.patientPhone}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        {t('publicBooking.email') || 'Email'} ({t('publicBooking.optional') || 'Optional'})
                                    </label>
                                    <input
                                        type="email"
                                        value={patientEmail}
                                        onChange={(e) => setPatientEmail(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-lg border ${
                                            errors.patientEmail 
                                                ? 'border-red-300 focus:border-red-500' 
                                                : 'border-slate-200 dark:border-slate-600 focus:border-purple-500'
                                        } bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500/20`}
                                        placeholder={t('publicBooking.emailPlaceholder') || 'Enter your email (optional)'}
                                    />
                                    {errors.patientEmail && (
                                        <p className="text-red-500 text-sm mt-1">{errors.patientEmail}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        {t('publicBooking.reason') || 'Reason for Visit'} ({t('publicBooking.optional') || 'Optional'})
                                    </label>
                                    <textarea
                                        value={patientReason}
                                        onChange={(e) => setPatientReason(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500/20"
                                        placeholder={t('publicBooking.reasonPlaceholder') || 'Describe your reason for visiting (optional)'}
                                    />
                                </div>

                                {submitError && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <p className="text-red-600 dark:text-red-400">{submitError}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handleSubmitReservation}
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:from-purple-700 hover:to-purple-800 focus:ring-4 focus:ring-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {t('publicBooking.submitting') || 'Submitting...'}
                                        </>
                                    ) : (
                                        <>
                                            <CalendarIcon />
                                            {t('publicBooking.submitRequest') || 'Submit Appointment Request'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Confirmation */}
                    {currentStep === 'confirmation' && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircleIcon />
                            </div>
                            
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                                {t('publicBooking.requestSubmitted') || 'Request Submitted!'}
                            </h2>
                            
                            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                                {t('publicBooking.successMessage') || 'Your appointment request has been received and is pending staff approval. We will contact you shortly.'}
                            </p>

                            {/* Reservation Details */}
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 max-w-md mx-auto mb-6">
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            {t('publicBooking.reservationId') || 'Reservation ID'}:
                                        </span>
                                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                            {reservationId}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            {t('publicBooking.service') || 'Service'}:
                                        </span>
                                        <span className="font-medium text-slate-800 dark:text-slate-200">
                                            {selectedService?.name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            {t('publicBooking.date') || 'Date'}:
                                        </span>
                                        <span className="font-medium text-slate-800 dark:text-slate-200">
                                            {selectedDate && formatDate(selectedDate)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            {t('publicBooking.time') || 'Time'}:
                                        </span>
                                        <span className="font-medium text-slate-800 dark:text-slate-200">
                                            {selectedTime}
                                        </span>
                                    </div>
                                    <div className="border-t border-purple-200 dark:border-purple-800 pt-3 mt-3">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600 dark:text-slate-400">
                                                {t('publicBooking.status') || 'Status'}:
                                            </span>
                                            <span className="font-medium text-amber-600 dark:text-amber-400">
                                                {t('publicBooking.pendingApproval') || 'Pending Approval'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    // Reset form
                                    setCurrentStep('service');
                                    setSelectedService(null);
                                    setSelectedDentist(null);
                                    setSelectedDate(null);
                                    setSelectedTime(null);
                                    setPatientName('');
                                    setPatientPhone('');
                                    setPatientEmail('');
                                    setPatientReason('');
                                    setReservationId(null);
                                }}
                                className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
                            >
                                {t('publicBooking.bookAnother') || 'Book Another Appointment'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="text-center mt-8 text-slate-500 text-sm">
                    <p>{t('publicBooking.needHelp') || 'Need help? Call us at'} <a href="tel:+1234567890" className="text-purple-600 hover:underline">+1234567890</a></p>
                </footer>
            </div>
        </div>
    );
};

export default PublicBookingPage;
