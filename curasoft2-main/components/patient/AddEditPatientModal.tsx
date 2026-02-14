import React, { useState, useEffect } from 'react';
import { Patient } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

// Icons
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);

const EmailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const LocationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const GenderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const MedicalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
);

const HeartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
);

const PillIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
);

const FileTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const ShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const EmergencyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

interface AddEditPatientModalProps {
    patient?: Patient;
    onClose: () => void;
    onSave: (patientData: Omit<Patient, 'id' | 'dentalChart'> | Patient) => void;
}

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
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
    icon?: React.ReactNode;
    className?: string;
    isTextarea?: boolean;
    rows?: number;
    isDark?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
    id, name, label, value, onChange, type = 'text', placeholder, required, icon, className = '', isTextarea, rows = 3, isDark = false
}) => {
    const inputClasses = `
        w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg
        focus:ring-2 focus:ring-primary/20 focus:border-primary
        transition-all duration-200 ease-in-out
        placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-700 dark:text-slate-200
        ${icon ? 'pr-12' : ''}
    `;

    return (
        <div className={`relative ${className}`}>
            <label htmlFor={id} className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                {label}
                {required && <span className="text-red-500 mr-1">*</span>}
            </label>
            <div className="relative">
                {isTextarea ? (
                    <textarea
                        id={id}
                        name={name}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        rows={rows}
                        className={`${inputClasses} resize-none`}
                    />
                ) : (
                    <input
                        id={id}
                        name={name}
                        type={type}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        className={inputClasses}
                        required={required}
                    />
                )}
                {icon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none flex-shrink-0">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};


const AddEditPatientModal: React.FC<AddEditPatientModalProps> = ({ patient, onClose, onSave }) => {
    const { t } = useI18n();
    const { addNotification } = useNotification();
    const { isDark } = useTheme();

    const [formData, setFormData] = useState<Omit<Patient, 'id' | 'dentalChart'> | Patient>(
        patient || {
            name: '',
            dob: '',
            gender: 'Male',
            phone: '',
            email: '',
            address: '',
            medicalHistory: '',
            treatmentNotes: '',
            lastVisit: new Date().toISOString().split('T')[0],
            allergies: '',
            medications: '',
            insuranceProvider: '',
            insurancePolicyNumber: '',
            emergencyContactName: '',
            emergencyContactPhone: '',
            images: [],
        }
    );

    const [activeTab, setActiveTab] = useState<'basic' | 'medical' | 'emergency' | 'images'>('basic');

    useEffect(() => {
        if (patient && !patient.lastVisit) {
            setFormData(prev => ({ ...prev, lastVisit: new Date().toISOString().split('T')[0] }));
        }
    }, [patient]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach((file: File) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (event.target?.result) {
                        setFormData(prev => ({
                            ...prev,
                            images: [...(prev.images || []), event.target!.result as string]
                        }));
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images?.filter((_, i) => i !== index) || []
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.dob || !formData.phone) {
            addNotification(t('addPatientModal.alertFillRequired'), NotificationType.ERROR);
            return;
        }
        onSave(formData);
    };

    const tabs = [
        { id: 'basic' as const, label: 'المعلومات الأساسية', icon: <UserIcon /> },
        { id: 'medical' as const, label: 'المعلومات الطبية', icon: <MedicalIcon /> },
        { id: 'emergency' as const, label: 'الطوارئ والتأمين', icon: <ShieldIcon /> },
        { id: 'images' as const, label: 'الصور والملاحظات', icon: <ImageIcon /> },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <header className={`px-6 py-4 flex justify-between items-center flex-shrink-0 ${isDark ? 'bg-gradient-to-r from-slate-800 to-slate-900' : 'bg-gradient-to-r from-primary to-primary-dark'}`}>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <UserIcon />
                        {patient ? t('addPatientModal.editTitle') : t('addPatientModal.title')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                        aria-label={t('addPatientModal.closeAriaLabel')}
                    >
                        <CloseIcon />
                    </button>
                </header>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200
                                ${activeTab === tab.id
                                    ? `text-primary border-b-2 ${isDark ? 'bg-slate-800 border-primary-400' : 'bg-white border-primary'}`
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }
                            `}
                        >
                            <span className={activeTab === tab.id ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}>
                                {tab.icon}
                            </span>

                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    {/* Basic Info Tab */}
                    {activeTab === 'basic' && (
                        <div className="space-y-5 animate-fadeIn">
                            <FormSection title="المعلومات الشخصية" icon={<UserIcon />} isDark={isDark}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField
                                        id="name"
                                        name="name"
                                        label={t('addPatientModal.fullName')}
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="أدخل الاسم الكامل"
                                        required
                                        icon={<UserIcon />}
                                        isDark={isDark}
                                    />
                                    <InputField
                                        id="dob"
                                        name="dob"
                                        label={t('addPatientModal.dob')}
                                        value={formData.dob}
                                        onChange={handleChange}
                                        type="date"
                                        required
                                        icon={<CalendarIcon />}
                                        isDark={isDark}
                                    />
                                    <div className="relative">
                                        <label htmlFor="gender" className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                                            {t('addPatientModal.gender')}
                                            <span className="text-red-500 mr-1">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                id="gender"
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2.5 pr-12 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-slate-700 dark:text-slate-200 appearance-none"
                                                required
                                            >
                                                <option value="Male">ذكر</option>
                                                <option value="Female">أنثى</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                                                <GenderIcon />
                                            </div>
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>


                                        </div>
                                    </div>
                                    <InputField
                                        id="phone"
                                        name="phone"
                                        label={t('addPatientModal.phone')}
                                        value={formData.phone}
                                        onChange={handleChange}
                                        type="tel"
                                        placeholder="01xxxxxxxxx"
                                        required
                                        icon={<PhoneIcon />}
                                        isDark={isDark}
                                    />
                                </div>
                            </FormSection>

                            <FormSection title="معلومات الاتصال" icon={<EmailIcon />} isDark={isDark}>
                                <div className="grid grid-cols-1 gap-4">
                                    <InputField
                                        id="email"
                                        name="email"
                                        label={t('addPatientModal.email')}
                                        value={formData.email}
                                        onChange={handleChange}
                                        type="email"
                                        placeholder="example@email.com"
                                        icon={<EmailIcon />}
                                        isDark={isDark}
                                    />
                                    <div className="relative">
                                        <label htmlFor="address" className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                                            {t('addPatientModal.address')}
                                        </label>
                                        <div className="relative">
                                            <textarea
                                                id="address"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                placeholder="أدخل العنوان الكامل"
                                                rows={3}
                                                className="w-full px-4 py-2.5 pr-10 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-700 dark:text-slate-200"
                                            />
                                            <div className="absolute right-3 top-3 text-slate-400 dark:text-slate-500 pointer-events-none">
                                                <LocationIcon />
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </FormSection>
                        </div>
                    )}

                    {/* Medical Info Tab */}
                    {activeTab === 'medical' && (
                        <div className="space-y-5 animate-fadeIn">
                            <FormSection title="التاريخ الطبي" icon={<FileTextIcon />} isDark={isDark}>
                                <div className="relative">
                                        <label htmlFor="medicalHistory" className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                                        {t('addPatientModal.medicalHistory')}
                                    </label>
                                    <div className="relative">
                                            <textarea
                                                id="medicalHistory"
                                                name="medicalHistory"
                                                value={formData.medicalHistory}
                                                onChange={handleChange}
                                                placeholder={t('addPatientModal.medicalHistoryPlaceholder')}
                                                rows={4}
                                                className="w-full px-4 py-2.5 pr-10 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-700 dark:text-slate-200"
                                            />
                                        <div className="absolute right-3 top-3 text-slate-400 dark:text-slate-500 pointer-events-none">
                                            <FileTextIcon />
                                        </div>
                                    </div>

                                </div>
                            </FormSection>

                            <FormSection title="الحساسية والأدوية" icon={<HeartIcon />} isDark={isDark}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <label htmlFor="allergies" className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                                            {t('addPatientModal.allergies')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="allergies"
                                                name="allergies"
                                                value={formData.allergies}
                                                onChange={handleChange}
                                                placeholder={t('addPatientModal.allergiesPlaceholder')}
                                                className="w-full px-4 py-2.5 pr-10 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-700 dark:text-slate-200"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                                                <HeartIcon />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <label htmlFor="medications" className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                                            {t('addPatientModal.currentMedications')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="medications"
                                                name="medications"
                                                value={formData.medications}
                                                onChange={handleChange}
                                                placeholder={t('addPatientModal.currentMedicationsPlaceholder')}
                                                className="w-full px-4 py-2.5 pr-10 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-700 dark:text-slate-200"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                                                <PillIcon />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </FormSection>
                        </div>
                    )}

                    {/* Emergency & Insurance Tab */}
                    {activeTab === 'emergency' && (
                        <div className="space-y-5 animate-fadeIn">
                            <FormSection title="جهة الاتصال في حالات الطوارئ" icon={<EmergencyIcon />} isDark={isDark}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField
                                        id="emergencyContactName"
                                        name="emergencyContactName"
                                        label={t('addPatientModal.emergencyContactName')}
                                        value={formData.emergencyContactName}
                                        onChange={handleChange}
                                        placeholder="اسم جهة الاتصال"
                                        icon={<UserIcon />}
                                        isDark={isDark}
                                    />
                                    <InputField
                                        id="emergencyContactPhone"
                                        name="emergencyContactPhone"
                                        label={t('addPatientModal.emergencyContactPhone')}
                                        value={formData.emergencyContactPhone}
                                        onChange={handleChange}
                                        type="tel"
                                        placeholder="01xxxxxxxxx"
                                        icon={<PhoneIcon />}
                                        isDark={isDark}
                                    />
                                </div>
                            </FormSection>

                            <FormSection title="معلومات التأمين" icon={<ShieldIcon />} isDark={isDark}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField
                                        id="insuranceProvider"
                                        name="insuranceProvider"
                                        label={t('addPatientModal.insuranceProvider')}
                                        value={formData.insuranceProvider}
                                        onChange={handleChange}
                                        placeholder="اسم شركة التأمين"
                                        icon={<ShieldIcon />}
                                        isDark={isDark}
                                    />
                                    <InputField
                                        id="insurancePolicyNumber"
                                        name="insurancePolicyNumber"
                                        label={t('addPatientModal.policyNumber')}
                                        value={formData.insurancePolicyNumber}
                                        onChange={handleChange}
                                        placeholder="رقم البوليصة"
                                        icon={<FileTextIcon />}
                                        isDark={isDark}
                                    />
                                </div>
                            </FormSection>
                        </div>
                    )}

                    {/* Images & Notes Tab */}
                    {activeTab === 'images' && (
                        <div className="space-y-5 animate-fadeIn">
                            <FormSection title="صور المريض" icon={<ImageIcon />} isDark={isDark}>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                                            {t('addPatientModal.patientImages')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="images"
                                                name="images"
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="images"
                                                className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/20 group"
                                            >
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <div className="p-3 mb-2 rounded-full bg-slate-100 dark:bg-slate-600 group-hover:bg-primary/10 dark:group-hover:bg-primary/20 transition-colors">
                                                        <UploadIcon />
                                                    </div>

                                                    <p className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">
                                                        اضغط لاختيار الصور أو اسحبها هنا
                                                    </p>
                                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                                        يمكنك رفع عدة صور (PNG, JPG, JPEG)
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {formData.images && formData.images.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">
                                                الصور المرفقة ({formData.images.length})
                                            </p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                {formData.images.map((image, index) => (
                                                    <div key={index} className="relative group">
                                                        <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-600">

                                                            <img
                                                                src={image}
                                                                alt={`صورة المريض ${index + 1}`}
                                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index)}
                                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110"
                                                            title="حذف الصورة"
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                            <span className="text-xs text-white">صورة {index + 1}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </FormSection>

                            <FormSection title="ملاحظات العلاج" icon={<FileTextIcon />} isDark={isDark}>
                                <div className="relative">
                                        <label htmlFor="treatmentNotes" className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                                        {t('addPatientModal.initialTreatmentNotes')}
                                    </label>
                                    <div className="relative">
                                        <textarea
                                            id="treatmentNotes"
                                            name="treatmentNotes"
                                            value={formData.treatmentNotes}
                                            onChange={handleChange}
                                            placeholder={t('addPatientModal.initialTreatmentNotesPlaceholder')}
                                            rows={4}
                                            className="w-full px-4 py-2.5 pr-10 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-700 dark:text-slate-200"
                                        />
                                        <div className="absolute right-3 top-3 text-slate-400 dark:text-slate-500 pointer-events-none">
                                            <FileTextIcon />
                                        </div>
                                    </div>
                                </div>

                            </FormSection>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <footer className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                    <div className="flex gap-2">
                        {tabs.map((tab, index) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    w-2.5 h-2.5 rounded-full transition-all duration-200
                                    ${activeTab === tab.id ? 'bg-primary w-6' : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'}
                                `}
                                title={tab.label}
                            />
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`px-5 py-2.5 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 border flex items-center gap-2 shadow-sm ${isDark ? 'text-white bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500 focus:ring-blue-400/50' : 'text-slate-600 bg-slate-100 border-slate-300 hover:bg-slate-200 focus:ring-slate-300'}`}
                        >
                            <CloseIcon />
                            {t('common.cancel')}
                        </button>

                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className={`px-6 py-2.5 text-white font-medium rounded-lg shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 hover:shadow-xl hover:-translate-y-0.5 ${isDark ? 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/30 focus:ring-primary-400' : 'bg-primary hover:bg-primary-dark shadow-primary/30 focus:ring-primary-light focus:ring-offset-2'}`}
                        >
                            {patient ? 'تحديث البيانات' : t('addPatientModal.savePatient')}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default AddEditPatientModal;
