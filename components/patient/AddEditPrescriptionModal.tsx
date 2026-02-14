import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Prescription, PrescriptionItem, Patient, Dentist } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types';
import { DENTAL_MEDICATIONS, getMedicationsByCategory, searchMedications, MedicationCategory, MEDICATION_CATEGORIES, DentalMedication } from '../../utils/dentalMedications';
import { useTheme } from '../../contexts/ThemeContext';

// Icons
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

interface AddEditPrescriptionModalProps {
    prescription?: Prescription;
    prescriptionItems?: PrescriptionItem[];
    patient: Patient;
    dentists: Dentist[];
    onClose: () => void;
    onSave: (prescriptionData: Omit<Prescription, 'id' | 'patientId' | 'userId' | 'createdAt' | 'updatedAt'>, items: PrescriptionItem[]) => void;
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
    value: string | number | undefined;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
    icon?: React.ReactNode;
    className?: string;
    isTextarea?: boolean;
    rows?: number;
    isDark?: boolean;
    min?: string;
}

const InputField: React.FC<InputFieldProps> = ({
    id, name, label, value, onChange, type = 'text', placeholder, required, icon, className = '', isTextarea, rows = 3, isDark = false, min
}) => {
    const inputClasses = `
        w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg
        focus:ring-2 focus:ring-primary/20 focus:border-primary
        transition-all duration-200 ease-in-out
        placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-700 dark:text-slate-200
        ${icon ? 'pr-10' : ''}
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
                        value={value || ''}
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
                        min={min}
                    />
                )}
                {icon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};

const AddEditPrescriptionModal: React.FC<AddEditPrescriptionModalProps> = ({ prescription, prescriptionItems = [], patient, dentists, onClose, onSave }) => {
    const { t } = useI18n();
    const { addNotification } = useNotification();
    const { isDark } = useTheme();
    const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
    const [isAddingPrescription, setIsAddingPrescription] = useState(false);
    const [isPrescriptionFormVisible, setIsPrescriptionFormVisible] = useState(true);
    const [isPrescriptionFormExpanded, setIsPrescriptionFormExpanded] = useState(true);
    const [isPrescriptionFormCollapsed, setIsPrescriptionFormCollapsed] = useState(false);
    
    const [formData, setFormData] = useState<Omit<Prescription, 'id' | 'patientId' | 'userId' | 'createdAt' | 'updatedAt'>>({
        dentistId: prescription?.dentistId || dentists[0]?.id || '',
        prescriptionDate: prescription?.prescriptionDate || new Date().toISOString().split('T')[0],
        notes: prescription?.notes || '',
    });
    
    const [prescriptionItemsState, setPrescriptionItemsState] = useState<PrescriptionItem[]>(prescriptionItems.length > 0 ? prescriptionItems : []);
    
    // Medication search and filter state
    const [medicationSearch, setMedicationSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<MedicationCategory | ''>('');
    const [showMedicationDropdown, setShowMedicationDropdown] = useState<number | null>(null);

    // Get filtered medications based on search and category
    const filteredMedications = useMemo(() => {
        let meds = DENTAL_MEDICATIONS;
        
        // Filter by category
        if (selectedCategory) {
            meds = meds.filter(m => m.category === selectedCategory);
        }
        
        // Filter by search query
        if (medicationSearch.trim()) {
            const searchAr = medicationSearch.trim();
            meds = meds.filter(m => 
                m.nameAr.toLowerCase().includes(searchAr.toLowerCase()) ||
                m.nameEn.toLowerCase().includes(searchAr.toLowerCase())
            );
        }
        
        return meds;
    }, [medicationSearch, selectedCategory]);

    // Function to apply selected medication to a prescription item
    const applyMedication = (index: number, medication: DentalMedication) => {
        const locale = t('locale') === 'ar' ? 'ar' : 'en';
        updatePrescriptionItem(index, 'medicationName', locale === 'ar' ? medication.nameAr : medication.nameEn);
        updatePrescriptionItem(index, 'dosage', medication.defaultDosage);
        updatePrescriptionItem(index, 'quantity', medication.defaultQuantity);
        updatePrescriptionItem(index, 'instructions', medication.defaultInstructionsAr);
        setShowMedicationDropdown(null);
        setMedicationSearch('');
        setSelectedCategory('');
    };

    // Ref for click outside handling
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowMedicationDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Load existing items if editing
    useEffect(() => {
        if (prescription && prescriptionItems.length === 0) {
            // Mock data for editing - in real implementation, this would be fetched from API
            const mockItems: PrescriptionItem[] = [
                {
                    id: 'mock-1',
                    prescriptionId: prescription.id,
                    medicationName: 'Amoxicillin',
                    dosage: '500mg',
                    quantity: 20,
                    instructions: 'قرص كل 8 ساعات بعد الطعام لمدة 7 أيام',
                    userId: '',
                    createdAt: '',
                    updatedAt: ''
                },
                {
                    id: 'mock-2',
                    prescriptionId: prescription.id,
                    medicationName: 'Ibuprofen',
                    dosage: '200mg',
                    quantity: 30,
                    instructions: 'قرص كل 6 ساعات عند الحاجة للألم بعد الطعام',
                    userId: '',
                    createdAt: '',
                    updatedAt: ''
                }
            ];
            setPrescriptionItemsState(mockItems);
        }
    }, [prescription, prescriptionItems]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addPrescriptionItem = () => {
        const newItem: PrescriptionItem = {
            id: `temp-${Date.now()}`,
            prescriptionId: prescription?.id || '',
            medicationName: '',
            dosage: '',
            quantity: 1,
            instructions: '',
            userId: '',
            createdAt: '',
            updatedAt: ''
        };
        setPrescriptionItemsState(prev => [...prev, newItem]);
    };

    const updatePrescriptionItem = (index: number, field: keyof PrescriptionItem, value: string | number) => {
        setPrescriptionItemsState(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ));
    };

    const removePrescriptionItem = (index: number) => {
        setPrescriptionItemsState(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.dentistId || !formData.prescriptionDate) {
            addNotification(t('prescriptionModal.alertFillRequired'), NotificationType.ERROR);
            return;
        }

        // Validate prescription items
        const validItems = prescriptionItemsState.filter(item =>
            item.medicationName.trim() && item.quantity > 0
        );

        if (validItems.length === 0) {
            addNotification(t('prescriptionModal.alertAtLeastOneItem'), NotificationType.ERROR);
            return;
        }

        // In a real implementation, you'd save both prescription and items
        // Now we save both prescription and items
        onSave(formData, validItems);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header - Mobile Optimized */}
                <header className={`px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center flex-shrink-0 ${isDark ? 'bg-gradient-to-r from-slate-800 to-slate-900' : 'bg-gradient-to-r from-primary to-primary-dark'}`}>
                    <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                        <FileTextIcon />
                        <span className="hidden sm:inline">{prescription ? t('prescriptionModal.editTitle') : t('prescriptionModal.title')}</span>
                        <span className="sm:hidden">{prescription ? t('prescriptionModal.edit') : t('prescriptionModal.add')}</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                        aria-label={t('prescriptionModal.closeAriaLabel')}
                    >
                        <CloseIcon />
                    </button>
                </header>

                {/* Form Content - Mobile Optimized */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 sm:p-6">
                    <div className="space-y-4 sm:space-y-5 animate-fadeIn">
                        {/* Prescription Details Section - Mobile Optimized */}
                        <FormSection title="معلومات الوصفة الطبية" icon={<FileTextIcon />} isDark={isDark}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="relative">
                                    <label htmlFor="dentistId" className="block text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                                        {t('prescriptionModal.dentist')}
                                        <span className="text-red-500 mr-1">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="dentistId"
                                            name="dentistId"
                                            value={formData.dentistId}
                                            onChange={handleChange}
                                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-slate-700 dark:text-slate-200 appearance-none text-sm sm:text-base"
                                            required
                                        >
                                            <option value="">{t('prescriptionModal.selectDentist')}</option>
                                            {dentists.map(dentist => (
                                                <option key={dentist.id} value={dentist.id}>
                                                    {dentist.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                                            <UserIcon />
                                        </div>
                                        <div className="absolute left-10 sm:left-12 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <InputField
                                    id="prescriptionDate"
                                    name="prescriptionDate"
                                    label={t('prescriptionModal.prescriptionDate')}
                                    value={formData.prescriptionDate}
                                    onChange={handleChange}
                                    type="date"
                                    required
                                    icon={<CalendarIcon />}
                                    isDark={isDark}
                                />
                            </div>
                            <div className="mt-3 sm:mt-4">
                                <InputField
                                    id="notes"
                                    name="notes"
                                    label={t('prescriptionModal.notes')}
                                    value={formData.notes}
                                    onChange={handleChange}
                                    placeholder={t('prescriptionModal.notesPlaceholder')}
                                    isTextarea
                                    rows={2}
                                    isDark={isDark}
                                />
                            </div>
                        </FormSection>

                        {/* Medications Section - Mobile Optimized */}
                        <FormSection title="الأدوية" icon={<PillIcon />} isDark={isDark}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                    {t('prescriptionModal.medications')}
                                </p>
                                <button
                                    type="button"
                                    onClick={addPrescriptionItem}
                                    className="w-full sm:w-auto bg-primary text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-dark flex items-center justify-center gap-2 text-xs sm:text-sm transition-all duration-200"
                                >
                                    <PlusIcon />
                                    {t('prescriptionModal.addMedication')}
                                </button>
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                                {prescriptionItemsState.map((item, index) => (
                                    <div key={item.id} className="border border-slate-200 dark:border-slate-600 rounded-lg p-3 sm:p-4 bg-white dark:bg-slate-700/50">
                                        {/* Medication Name with Dropdown - Mobile Optimized */}
                                        <div className="relative mb-3 sm:mb-4">
                                            <label className="block text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                                                {t('prescriptionModal.medicationName')}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={item.medicationName}
                                                    onChange={(e) => {
                                                        updatePrescriptionItem(index, 'medicationName', e.target.value);
                                                        setMedicationSearch(e.target.value);
                                                        setShowMedicationDropdown(index);
                                                    }}
                                                    onFocus={() => setShowMedicationDropdown(index)}
                                                    placeholder={t('prescriptionModal.medicationNamePlaceholder')}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm sm:text-base pr-10"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowMedicationDropdown(showMedicationDropdown === index ? null : index)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 hover:text-slate-600"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Medication Dropdown - Mobile Optimized */}
                                            {showMedicationDropdown === index && (
                                                <div ref={dropdownRef} className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                                                    {/* Category Filter */}
                                                    <div className="p-2 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700">
                                                        <select
                                                            value={selectedCategory}
                                                            onChange={(e) => setSelectedCategory(e.target.value as MedicationCategory | '')}
                                                            className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-700 dark:text-slate-200"
                                                        >
                                                            <option value="">{t('prescriptionModal.allCategories')}</option>
                                                            {Object.entries(MEDICATION_CATEGORIES).map(([key, value]) => (
                                                                <option key={key} value={key}>{value.labelAr}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Search within dropdown */}
                                                    <div className="p-2 border-b border-slate-200 dark:border-slate-600">
                                                        <input
                                                            type="text"
                                                            placeholder={t('prescriptionModal.searchMedication')}
                                                            value={medicationSearch}
                                                            onChange={(e) => setMedicationSearch(e.target.value)}
                                                            className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                                            autoFocus
                                                        />
                                                    </div>

                                                    {/* Medication List */}
                                                    <div className="max-h-48 overflow-y-auto">
                                                        {filteredMedications.length === 0 ? (
                                                            <p className="p-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center">
                                                                {t('prescriptionModal.noMedicationsFound')}
                                                            </p>
                                                        ) : (
                                                            filteredMedications.map((med) => (
                                                                <button
                                                                    key={med.id}
                                                                    type="button"
                                                                    onClick={() => applyMedication(index, med)}
                                                                    className="w-full text-right px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 border-b border-slate-100 dark:border-slate-600 last:border-b-0"
                                                                >
                                                                    <div className="font-medium text-slate-800 dark:text-white text-xs sm:text-sm">
                                                                        {t('locale') === 'ar' ? med.nameAr : med.nameEn}
                                                                    </div>
                                                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                                                        {med.defaultDosage} • {med.defaultQuantity} {t('prescriptionModal.pieces')}
                                                                    </div>
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>

                                                    {/* Custom medication option */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowMedicationDropdown(null);
                                                            setMedicationSearch('');
                                                            setSelectedCategory('');
                                                        }}
                                                        className="w-full p-2 text-xs sm:text-sm text-primary hover:bg-slate-100 dark:hover:bg-slate-600 border-t border-slate-200 dark:border-slate-600"
                                                    >
                                                        {t('prescriptionModal.enterManually')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Dosage and Quantity - Stacked on mobile */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                                            <InputField
                                                id={`dosage-${index}`}
                                                name={`dosage-${index}`}
                                                label={t('prescriptionModal.dosage')}
                                                value={item.dosage || ''}
                                                onChange={(e) => updatePrescriptionItem(index, 'dosage', e.target.value)}
                                                placeholder={t('prescriptionModal.dosagePlaceholder')}
                                                isDark={isDark}
                                            />
                                            <InputField
                                                id={`quantity-${index}`}
                                                name={`quantity-${index}`}
                                                label={t('prescriptionModal.quantity')}
                                                value={item.quantity}
                                                onChange={(e) => updatePrescriptionItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                type="number"
                                                min="1"
                                                isDark={isDark}
                                            />
                                        </div>

                                        {/* Instructions - Full width */}
                                        <div className="mb-3 sm:mb-4">
                                            <InputField
                                                id={`instructions-${index}`}
                                                name={`instructions-${index}`}
                                                label={t('prescriptionModal.instructions')}
                                                value={item.instructions || ''}
                                                onChange={(e) => updatePrescriptionItem(index, 'instructions', e.target.value)}
                                                placeholder={t('prescriptionModal.instructionsPlaceholder')}
                                                isTextarea
                                                rows={2}
                                                isDark={isDark}
                                            />
                                        </div>

                                        {/* Remove Button */}
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => removePrescriptionItem(index)}
                                                className="bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 flex items-center gap-2 text-xs sm:text-sm transition-all duration-200"
                                            >
                                                <TrashIcon />
                                                {t('common.remove')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {prescriptionItemsState.length === 0 && (
                                <div className="text-center py-6 sm:py-8">
                                    <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-100 dark:bg-slate-700 mb-3 sm:mb-4`}>
                                        <PillIcon />
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                        {t('prescriptionModal.noMedications')}
                                    </p>
                                </div>
                            )}
                        </FormSection>
                    </div>
                    
                    {/* Footer - Mobile Optimized */}
                    <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`w-full sm:w-auto px-4 sm:px-5 py-2.5 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 border flex items-center justify-center gap-2 shadow-sm text-sm sm:text-base ${isDark ? 'text-white bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500 focus:ring-blue-400/50' : 'text-slate-600 bg-slate-100 border-slate-300 hover:bg-slate-200 focus:ring-slate-300'}`}
                        >
                            <CloseIcon />
                            {t('common.cancel')}
                        </button>

                        <button
                            type="submit"
                            className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 text-white font-medium rounded-lg shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 hover:shadow-xl hover:-translate-y-0.5 text-sm sm:text-base ${isDark ? 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/30 focus:ring-primary-400' : 'bg-primary hover:bg-primary-dark shadow-primary/30 focus:ring-primary-light focus:ring-offset-2'}`}
                        >
                            {prescription ? t('prescriptionModal.savePrescription') : t('prescriptionModal.createPrescription')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditPrescriptionModal;
