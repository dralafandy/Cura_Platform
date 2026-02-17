import React, { useState } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { TreatmentDefinition } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const AddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const StethoscopeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const DollarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>;
const PercentageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;

const AddEditTreatmentDefinitionModal: React.FC<{
    definition?: TreatmentDefinition;
    onClose: () => void;
    onSave: (definition: Omit<TreatmentDefinition, 'id'> | TreatmentDefinition) => void;
}> = ({ definition, onClose, onSave }) => {
    const { t } = useI18n();
    const { isDark } = useTheme();
    const [formData, setFormData] = useState<Omit<TreatmentDefinition, 'id'> | TreatmentDefinition>(
        definition || { name: '', description: '', basePrice: 0, doctorPercentage: 0.50, clinicPercentage: 0.50 }
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'basePrice') {
            const parsedValue = parseFloat(value);
            setFormData({ ...formData, [name]: isNaN(parsedValue) ? 0 : parsedValue });
        } else if (name === 'doctorPercentage' || name === 'clinicPercentage') {
            const parsedValue = parseFloat(value);
            if (!isNaN(parsedValue) && parsedValue >= 0 && parsedValue <= 1) {
                setFormData(prev => ({ ...prev, [name]: parsedValue }));
                if (name === 'doctorPercentage') {
                    setFormData(prev => ({ ...prev, clinicPercentage: 1 - parsedValue }));
                } else {
                    setFormData(prev => ({ ...prev, doctorPercentage: 1 - parsedValue }));
                }
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Validate base price
        if (formData.basePrice <= 0) {
            alert('Base price must be greater than 0');
            return;
        }
        // Validate percentages
        if (formData.doctorPercentage < 0 || formData.doctorPercentage > 1) {
            alert('Doctor percentage must be between 0 and 1');
            return;
        }
        if (formData.clinicPercentage < 0 || formData.clinicPercentage > 1) {
            alert('Clinic percentage must be between 0 and 1');
            return;
        }
        if (Math.abs(formData.doctorPercentage + formData.clinicPercentage - 1) > 0.01) {
            alert('Doctor and clinic percentages must add up to 100%');
            return;
        }
        onSave(formData);
        onClose();
    };

    const percentageFormatter = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 0 });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl shadow-2xl w-full max-w-md`}>
                <header className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-slate-700 bg-gradient-to-r from-purple-900/30 to-amber-900/20' : 'bg-gradient-to-r from-purple-50 to-amber-50'}`}>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">{definition ? t('treatments.editTreatment') : t('treatments.addNewTreatment')}</h2>
                    <button onClick={onClose} className={`p-1 rounded-full ${isDark ? 'hover:bg-slate-700 focus:ring-slate-600' : 'hover:bg-purple-100 focus:ring-purple-300'} transition-colors focus:outline-none focus:ring-2`} aria-label={t('common.closeForm')}>
                        <CloseIcon />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <label htmlFor="treatment-name" className="sr-only">{t('treatments.treatmentName')}</label>
                    <input id="treatment-name" name="name" value={formData.name} onChange={handleChange} placeholder={t('treatments.treatmentName')} className={`p-2 border ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-purple-500' : 'border-purple-200 focus:border-purple-500'} rounded-lg w-full focus:ring-2 focus:ring-purple-500 transition-all duration-200`} required />
                    
                    <label htmlFor="treatment-description" className="sr-only">{t('treatments.description')}</label>
                    <textarea id="treatment-description" name="description" value={formData.description} onChange={handleChange} placeholder={t('treatments.descriptionPlaceholder')} className={`p-2 border ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-purple-500' : 'border-purple-200 focus:border-purple-500'} rounded-lg w-full h-20 focus:ring-2 focus:ring-purple-500 transition-all duration-200`} />
                    <div>
                        <label htmlFor="basePrice" className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-purple-700'} mb-1`}>{t('treatments.basePrice')}</label>
                        <input id="basePrice" name="basePrice" type="number" step="0.01" value={formData.basePrice} onChange={handleChange} className={`p-2 border ${isDark ? 'border-slate-600 bg-slate-700 text-white focus:border-purple-500' : 'border-purple-200 focus:border-purple-500'} rounded-lg w-full focus:ring-2 focus:ring-purple-500 transition-all duration-200`} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="doctorPercentage" className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-purple-700'} mb-1`}>{t('treatments.doctorPercentage')}</label>
                            <input id="doctorPercentage" name="doctorPercentage" type="number" step="0.01" min="0" max="1" value={formData.doctorPercentage} onChange={handleChange} className={`p-2 border ${isDark ? 'border-slate-600 bg-slate-700 text-white focus:border-purple-500' : 'border-purple-200 focus:border-purple-500'} rounded-lg w-full focus:ring-2 focus:ring-purple-500 transition-all duration-200`} required />
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-purple-600'} mt-1`}>{percentageFormatter.format(formData.doctorPercentage)}</p>
                        </div>
                        <div>
                            <label htmlFor="clinicPercentage" className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-purple-700'} mb-1`}>{t('treatments.clinicPercentage')}</label>
                            <input id="clinicPercentage" name="clinicPercentage" type="number" step="0.01" min="0" max="1" value={formData.clinicPercentage} onChange={handleChange} className={`p-2 border ${isDark ? 'border-slate-600 bg-slate-700 text-white focus:border-purple-500' : 'border-purple-200 focus:border-purple-500'} rounded-lg w-full focus:ring-2 focus:ring-purple-500 transition-all duration-200`} required disabled/>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-purple-600'} mt-1`}>{percentageFormatter.format(formData.clinicPercentage)} ({t('treatments.auto')})</p>
                        </div>
                    </div>
                    <footer className="pt-2 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className={`px-4 py-2 ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 focus:ring-slate-500' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 focus:ring-slate-300'} rounded-lg focus:outline-none focus:ring-2 transition-all duration-200`}>{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all duration-200">{t('common.save')}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

const TreatmentDefinitionManagement: React.FC<{ clinicData: ClinicData }> = ({ clinicData }) => {
    const { treatmentDefinitions, addTreatmentDefinition, updateTreatmentDefinition, deleteTreatmentDefinition } = clinicData;
    const { t, locale } = useI18n();
    const { isDark } = useTheme();
    const { isAdmin } = useAuth();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingDefinition, setEditingDefinition] = useState<TreatmentDefinition | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');

    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
    const percentageFormatter = new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const handleSaveDefinition = (definition: Omit<TreatmentDefinition, 'id'> | TreatmentDefinition) => {
        if ('id' in definition && definition.id) {
            updateTreatmentDefinition(definition as TreatmentDefinition);
        } else {
            addTreatmentDefinition(definition as Omit<TreatmentDefinition, 'id'>);
        }
        setEditingDefinition(undefined);
    };

    const handleDeleteDefinition = (definition: TreatmentDefinition) => {
        if (window.confirm(t('treatments.confirmDelete', { name: definition.name }))) {
            deleteTreatmentDefinition(definition.id);
        }
    };

    const filteredTreatmentDefinitions = treatmentDefinitions.filter(td =>
        td.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate stats
    const totalTreatments = treatmentDefinitions.length;
    const avgPrice = totalTreatments > 0 
        ? treatmentDefinitions.reduce((sum, td) => sum + td.basePrice, 0) / totalTreatments 
        : 0;
    const avgDoctorPercentage = totalTreatments > 0
        ? treatmentDefinitions.reduce((sum, td) => sum + td.doctorPercentage, 0) / totalTreatments
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Enhanced Header with Gold + Purple Theme */}
                <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-purple-200'} p-6 rounded-xl shadow-lg mb-6 relative overflow-hidden`}>
                    {/* Decorative gradient bar at top */}
                    <div className="absolute left-0 top-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-purple-500 to-purple-700"></div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent mb-2">
                            {t('treatmentDefinitionsManagement.title')}
                        </h2>
                        <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('treatmentDefinitionsManagement.description')}</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm">{t('treatments.totalTreatments')}</p>
                                <p className="text-2xl font-bold">{totalTreatments}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                                <StethoscopeIcon />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-400 to-amber-500 text-white p-4 rounded-xl shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-amber-100 text-sm">{t('treatments.averagePrice')}</p>
                                <p className="text-2xl font-bold">{currencyFormatter.format(avgPrice)}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                                <DollarIcon />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white p-4 rounded-xl shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-rose-100 text-sm">{t('treatments.averageDoctorPercentage')}</p>
                                <p className="text-2xl font-bold">{percentageFormatter.format(avgDoctorPercentage)}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                                <PercentageIcon />
                            </div>
                        </div>
                    </div>
                </div>

            {/* Controls Section */}
            <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-purple-100'} p-4 rounded-xl shadow-lg mb-6`}>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full">
                        <div className="relative">
                            <svg className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder={t('treatments.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full ps-10 pl-4 py-2 border ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:border-purple-500' : 'border-purple-200 focus:border-purple-500'} rounded-lg focus:ring-2 focus:ring-purple-500 transition-all duration-200`}
                            />
                        </div>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 flex items-center gap-2 text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                        >
                            <AddIcon /> {t('treatments.addTreatment')}
                        </button>
                    )}
                </div>
            </div>

            {/* Treatment Definitions Grid */}
            <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-purple-100'} rounded-xl shadow-lg p-4`}>
                {treatmentDefinitions.length === 0 ? (
                    <div className="text-center py-8">
                        <div className={`bg-gradient-to-br ${isDark ? 'from-purple-800 to-purple-900' : 'from-purple-100 to-purple-200'} p-6 rounded-full inline-block mb-4`}>
                            <StethoscopeIcon />
                        </div>
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>{t('treatments.noTreatmentsRegistered')}</h3>
                        <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} mb-4`}>{t('treatments.noTreatmentsAdded')}</p>
                        {isAdmin && (
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all duration-200"
                            >
                                <AddIcon /> {t('treatments.addNewTreatmentButton')}
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Mobile View - Cards */}
                        <div className="block md:hidden space-y-4">
                            {filteredTreatmentDefinitions.map(td => (
                                <div key={td.id} className={`${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-purple-100'} p-4 rounded-xl hover:shadow-lg hover:border-purple-200 transition-all duration-200`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'} text-lg`}>{td.name}</h4>
                                        {isAdmin && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => { setEditingDefinition(td); setIsAddModalOpen(true); }}
                                                    className={`text-purple-600 hover:text-purple-700 p-2 rounded-lg ${isDark ? 'hover:bg-purple-900/30' : 'hover:bg-purple-100'} focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all duration-200`}
                                                    aria-label={t('treatments.editTreatmentAriaLabel', {name: td.name})}
                                                >
                                                    <EditIcon />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDefinition(td)}
                                                    className={`text-rose-600 hover:text-rose-700 p-2 rounded-lg ${isDark ? 'hover:bg-rose-900/30' : 'hover:bg-rose-50'} focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all duration-200`}
                                                    aria-label={t('treatments.deleteTreatmentAriaLabel', {name: td.name})}
                                                >
                                                    <DeleteIcon />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('treatments.basePriceLabel')}:</span>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm">
                                                {isNaN(td.basePrice) ? t('treatments.undefined') : currencyFormatter.format(td.basePrice)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('treatments.doctorPercentageLabel')}:</span>
                                            <span className={`text-sm font-medium ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>{isNaN(td.doctorPercentage) ? t('treatments.undefined') : percentageFormatter.format(td.doctorPercentage)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('treatments.clinicPercentageLabel')}:</span>
                                            <span className={`text-sm font-medium ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>{isNaN(td.clinicPercentage) ? t('treatments.undefined') : percentageFormatter.format(td.clinicPercentage)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop View - Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className={`min-w-full divide-y ${isDark ? 'divide-slate-700 bg-slate-800' : 'divide-purple-200 bg-white'} rounded-lg shadow-sm`}>
                                <thead className={`bg-gradient-to-r ${isDark ? 'from-purple-900/30 to-amber-900/20' : 'from-purple-50 to-amber-50'}`}>
                                    <tr>
                                        <th className={`px-6 py-3 text-right text-xs font-medium ${isDark ? 'text-purple-400' : 'text-purple-700'} uppercase tracking-wider`}>{t('treatments.treatmentName')}</th>
                                        <th className={`px-6 py-3 text-right text-xs font-medium ${isDark ? 'text-purple-400' : 'text-purple-700'} uppercase tracking-wider`}>{t('treatments.basePriceLabel')}</th>
                                        <th className={`px-6 py-3 text-right text-xs font-medium ${isDark ? 'text-purple-400' : 'text-purple-700'} uppercase tracking-wider`}>{t('treatments.doctorPercentageLabel')}</th>
                                        <th className={`px-6 py-3 text-right text-xs font-medium ${isDark ? 'text-purple-400' : 'text-purple-700'} uppercase tracking-wider`}>{t('treatments.clinicPercentageLabel')}</th>
                                        <th className={`px-6 py-3 text-center text-xs font-medium ${isDark ? 'text-purple-400' : 'text-purple-700'} uppercase tracking-wider`}>{t('treatments.actionsLabel')}</th>
                                    </tr>
                                </thead>
                                <tbody className={`${isDark ? 'bg-slate-800 divide-y divide-slate-700' : 'bg-white divide-y divide-purple-100'}`}>
                                    {filteredTreatmentDefinitions.map(td => (
                                        <tr key={td.id} className={`${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-purple-50/50'} transition-colors duration-200`}>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{td.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm">
                                                    {isNaN(td.basePrice) ? t('treatments.undefined') : currencyFormatter.format(td.basePrice)}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-purple-400' : 'text-purple-700'} font-medium`}>{isNaN(td.doctorPercentage) ? t('treatments.undefined') : percentageFormatter.format(td.doctorPercentage)}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-purple-400' : 'text-purple-700'} font-medium`}>{isNaN(td.clinicPercentage) ? t('treatments.undefined') : percentageFormatter.format(td.clinicPercentage)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                                {isAdmin ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => { setEditingDefinition(td); setIsAddModalOpen(true); }}
                                                            className={`text-purple-600 hover:text-purple-700 p-2 rounded-lg ${isDark ? 'hover:bg-purple-900/30' : 'hover:bg-purple-100'} focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all duration-200`}
                                                            aria-label={t('treatments.editTreatmentAriaLabel', {name: td.name})}
                                                        >
                                                            <EditIcon />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteDefinition(td)}
                                                            className={`text-rose-600 hover:text-rose-700 p-2 rounded-lg ${isDark ? 'hover:bg-rose-900/30' : 'hover:bg-rose-50'} focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all duration-200`}
                                                            aria-label={t('treatments.deleteTreatmentAriaLabel', {name: td.name})}
                                                        >
                                                            <DeleteIcon />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('treatments.notAvailable')}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {isAddModalOpen && (
                <AddEditTreatmentDefinitionModal
                    definition={editingDefinition}
                    onClose={() => { setIsAddModalOpen(false); setEditingDefinition(undefined); }}
                    onSave={handleSaveDefinition}
                />
            )}
            </div>
        </div>
    );
};

export default TreatmentDefinitionManagement;
