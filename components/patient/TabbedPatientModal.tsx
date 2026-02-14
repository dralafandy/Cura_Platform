import React, { useState, useEffect } from 'react';
import { Patient } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;

type TabType = 'basic' | 'medical' | 'emergency' | 'images';

interface TabbedPatientModalProps {
    patient?: Patient; // Optional patient object for editing
    onClose: () => void;
    onSave: (patientData: Omit<Patient, 'id' | 'dentalChart'> | Patient) => void;
}

const TabbedPatientModal: React.FC<TabbedPatientModalProps> = ({ patient, onClose, onSave }) => {
    const { t } = useI18n();
    const { addNotification } = useNotification();

    const [activeTab, setActiveTab] = useState<TabType>('basic');
    const [formData, setFormData] = useState<Omit<Patient, 'id' | 'dentalChart'>>(
        patient ? {
            name: patient.name,
            dob: patient.dob,
            gender: patient.gender,
            phone: patient.phone,
            email: patient.email,
            address: patient.address,
            medicalHistory: patient.medicalHistory,
            treatmentNotes: patient.treatmentNotes,
            lastVisit: patient.lastVisit,
            allergies: patient.allergies,
            medications: patient.medications,
            insuranceProvider: patient.insuranceProvider,
            insurancePolicyNumber: patient.insurancePolicyNumber,
            emergencyContactName: patient.emergencyContactName,
            emergencyContactPhone: patient.emergencyContactPhone,
            images: patient.images,
            attachments: patient.attachments,
        } : {
            name: '',
            dob: '',
            gender: 'Male',
            phone: '',
            email: '',
            address: '',
            medicalHistory: '',
            treatmentNotes: '',
            lastVisit: new Date().toISOString().split('T')[0], // Default to today
            allergies: '',
            medications: '',
            insuranceProvider: '',
            insurancePolicyNumber: '',
            emergencyContactName: '',
            emergencyContactPhone: '',
            images: [],
            attachments: [],
        }
    );

    // Update lastVisit if it's not present when editing an existing patient
    useEffect(() => {
        if (patient && !patient.lastVisit) {
            setFormData(prev => ({ ...prev, lastVisit: new Date().toISOString().split('T')[0] }));
        }
    }, [patient]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
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

    const validateTab = (tab: TabType): boolean => {
        const newErrors: Record<string, string> = {};

        switch (tab) {
            case 'basic':
                if (!formData.name?.trim()) newErrors.name = t('validation.required');
                if (!formData.dob) newErrors.dob = t('validation.required');
                if (!formData.phone?.trim()) newErrors.phone = t('validation.required');
                break;
            case 'medical':
                // Medical history is optional but can add validation if needed
                break;
            case 'emergency':
                // Emergency contacts are optional but can add validation if needed
                break;
            case 'images':
                // Images are optional
                break;
        }

        setErrors(prev => ({ ...prev, ...newErrors }));
        return Object.keys(newErrors).length === 0;
    };

    const handleTabChange = (newTab: TabType) => {
        if (validateTab(activeTab)) {
            setActiveTab(newTab);
        } else {
            addNotification(t('validation.fixErrors'), NotificationType.ERROR);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all tabs
        const tabs: TabType[] = ['basic', 'medical', 'emergency', 'images'];
        let hasErrors = false;

        tabs.forEach(tab => {
            if (!validateTab(tab)) {
                hasErrors = true;
            }
        });

        if (hasErrors) {
            addNotification(t('validation.fixAllErrors'), NotificationType.ERROR);
            return;
        }

        onSave(formData);
    };

    const tabs = [
        { key: 'basic', label: t('patientModal.tabs.basicInfo') },
        { key: 'medical', label: t('patientModal.tabs.medicalHistory') },
        { key: 'emergency', label: t('patientModal.tabs.emergencyInsurance') },
        { key: 'images', label: t('patientModal.tabs.imagesNotes') },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
                <header className="p-4 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-700 dark:text-white">{patient ? t('addPatientModal.editTitle') : t('addPatientModal.title')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('addPatientModal.closeAriaLabel')}>
                        <CloseIcon />
                    </button>
                </header>

                <nav className="border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 flex-shrink-0">
                    <ul className="-mb-px flex space-x-4 rtl:space-x-reverse overflow-x-auto text-sm font-medium text-center text-slate-500 dark:text-slate-400">
                        {tabs.map(({ key, label }) => (
                            <li key={key}>
                                <button
                                    onClick={() => handleTabChange(key as TabType)}
                                    className={`inline-block p-4 border-b-2 ${
                                        activeTab === key ? 'border-primary text-primary' : 'border-transparent hover:text-slate-700 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-500'
                                    }`}
                                >
                                    {label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 dark:bg-slate-800 scrollbar-modern">
                    {activeTab === 'basic' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('addPatientModal.fullName')} *</label>
                                    <input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder={t('addPatientModal.fullName')}
                                        className={`p-2 border rounded-lg w-full focus:ring-primary focus:border-primary ${errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white'}`}
                                        required
                                    />
                                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <label htmlFor="dob" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('addPatientModal.dob')} *</label>
                                    <input
                                        id="dob"
                                        name="dob"
                                        type="date"
                                        value={formData.dob}
                                        onChange={handleChange}
                                        className={`p-2 border rounded-lg w-full focus:ring-primary focus:border-primary ${errors.dob ? 'border-red-500' : 'border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white'}`}
                                        required
                                    />
                                    {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob}</p>}
                                </div>
                                <div>
                                    <label htmlFor="gender" className="block text-sm font-medium text-slate-600 mb-1">{t('addPatientModal.gender')}</label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg w-full focus:ring-primary focus:border-primary"
                                        required
                                    >
                                        <option value="Male">{t('common.gender.male')}</option>
                                        <option value="Female">{t('common.gender.female')}</option>
                                        <option value="Other">{t('common.gender.other')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('addPatientModal.phone')} *</label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder={t('addPatientModal.phone')}
                                        className={`p-2 border rounded-lg w-full focus:ring-primary focus:border-primary ${errors.phone ? 'border-red-500' : 'border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white'}`}
                                        required
                                    />
                                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('addPatientModal.email')}</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder={t('addPatientModal.email')}
                                        className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="address" className="block text-sm font-medium text-slate-600 mb-1">{t('addPatientModal.address')}</label>
                                    <textarea
                                        id="address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder={t('addPatientModal.address')}
                                        className="p-2 border border-slate-300 rounded-lg w-full h-20 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'medical' && (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="medicalHistory" className="block text-sm font-medium text-slate-600 mb-1">{t('addPatientModal.medicalHistory')}</label>
                                <textarea
                                    id="medicalHistory"
                                    name="medicalHistory"
                                    value={formData.medicalHistory}
                                    onChange={handleChange}
                                    placeholder={t('addPatientModal.medicalHistoryPlaceholder')}
                                    className="p-2 border border-slate-300 rounded-lg w-full h-24 focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div>
                                <label htmlFor="allergies" className="block text-sm font-medium text-slate-600 mb-1">{t('addPatientModal.allergies')}</label>
                                <input
                                    id="allergies"
                                    name="allergies"
                                    value={formData.allergies}
                                    onChange={handleChange}
                                    placeholder={t('addPatientModal.allergiesPlaceholder')}
                                    className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div>
                                <label htmlFor="medications" className="block text-sm font-medium text-slate-600 mb-1">{t('addPatientModal.currentMedications')}</label>
                                <input
                                    id="medications"
                                    name="medications"
                                    value={formData.medications}
                                    onChange={handleChange}
                                    placeholder={t('addPatientModal.currentMedicationsPlaceholder')}
                                    className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'emergency' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="emergencyContactName" className="block text-sm font-medium text-slate-600 mb-1">{t('addPatientModal.emergencyContactName')}</label>
                                    <input
                                        id="emergencyContactName"
                                        name="emergencyContactName"
                                        value={formData.emergencyContactName}
                                        onChange={handleChange}
                                        placeholder={t('addPatientModal.emergencyContactName')}
                                        className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-slate-600 mb-1">{t('addPatientModal.emergencyContactPhone')}</label>
                                    <input
                                        id="emergencyContactPhone"
                                        name="emergencyContactPhone"
                                        type="tel"
                                        value={formData.emergencyContactPhone}
                                        onChange={handleChange}
                                        placeholder={t('addPatientModal.emergencyContactPhone')}
                                        className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="insuranceProvider" className="block text-sm font-medium text-slate-600 mb-1">{t('addPatientModal.insuranceProvider')}</label>
                                    <input
                                        id="insuranceProvider"
                                        name="insuranceProvider"
                                        value={formData.insuranceProvider}
                                        onChange={handleChange}
                                        placeholder={t('addPatientModal.insuranceProvider')}
                                        className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="insurancePolicyNumber" className="block text-sm font-medium text-slate-600 mb-1">{t('addPatientModal.policyNumber')}</label>
                                    <input
                                        id="insurancePolicyNumber"
                                        name="insurancePolicyNumber"
                                        value={formData.insurancePolicyNumber}
                                        onChange={handleChange}
                                        placeholder={t('addPatientModal.policyNumber')}
                                        className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'images' && (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="treatmentNotes" className="block text-sm font-medium text-slate-600 mb-1">{t('addPatientModal.initialTreatmentNotes')}</label>
                                <textarea
                                    id="treatmentNotes"
                                    name="treatmentNotes"
                                    value={formData.treatmentNotes}
                                    onChange={handleChange}
                                    placeholder={t('addPatientModal.initialTreatmentNotesPlaceholder')}
                                    className="p-2 border border-slate-300 rounded-lg w-full h-24 focus:ring-primary focus:border-primary"
                                />
                            </div>

                            <div>
                                <label htmlFor="images" className="block text-sm font-medium text-slate-600 mb-1">{t('addPatientModal.patientImages')}</label>
                                <input
                                    id="images"
                                    name="images"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary"
                                />
                                {formData.images && formData.images.length > 0 && (
                                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {formData.images.map((image, index) => (
                                            <div key={index} className="relative">
                                                <img src={image} alt={`Patient image ${index + 1}`} className="w-full h-20 object-cover rounded-lg" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <footer className="pt-2 flex justify-end space-x-4 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-dark rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light">{t('addPatientModal.savePatient')}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default TabbedPatientModal;