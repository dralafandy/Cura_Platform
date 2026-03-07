import React, { useState, useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { TreatmentRecord, InventoryItem, LabCase, LabCaseStatus, Prescription } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const MinusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;

// Form Section Component
const FormSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className = '' }) => (
    <div className={`bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700 ${className}`}>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">{title}</h3>
        </div>
        {children}
    </div>
);

interface InventoryItemSelection {
    inventoryItemId: string;
    quantity: number;
}

const AddTreatmentRecordModal: React.FC<{
    patientId: string;
    onClose: () => void;
    onAdd: (record: Omit<TreatmentRecord, 'id' | 'patientId'>) => void;
    clinicData: ClinicData;
}> = ({ patientId, onClose, onAdd, clinicData }) => {
    const { t, locale } = useI18n();
    const { addNotification } = useNotification();
    const { dentists, treatmentDefinitions, inventoryItems, updateInventoryItem } = clinicData;

    const [formData, setFormData] = useState({
        dentistId: '',
        treatmentDate: new Date().toISOString().split('T')[0],
        treatmentDefinitionId: '',
        notes: '',
        selectedInventoryItems: [] as InventoryItemSelection[],
        affectedTeeth: [] as string[],
        labId: '', // Add lab selection
    });

    const selectedTreatmentDef = useMemo(() => {
        return treatmentDefinitions.find(td => td.id === formData.treatmentDefinitionId);
    }, [formData.treatmentDefinitionId, treatmentDefinitions]);

    const calculateCosts = useMemo(() => {
        let totalMaterialCost = 0;
        const itemsUsedForRecord: { inventoryItemId: string; quantity: number; cost: number; }[] = [];

        formData.selectedInventoryItems.forEach(sm => {
            const material = inventoryItems.find(lm => lm.id === sm.inventoryItemId);
            if (material && sm.quantity > 0) {
                const costForMaterial = material.unitCost * sm.quantity;
                totalMaterialCost += costForMaterial;
                itemsUsedForRecord.push({
                    inventoryItemId: sm.inventoryItemId,
                    quantity: sm.quantity,
                    cost: costForMaterial,
                });
            }
        });

        const basePrice = selectedTreatmentDef?.basePrice || 0;
        const effectivePercentages = clinicData.getTreatmentPercentages(formData.treatmentDefinitionId, formData.dentistId || null);
        const doctorShare = basePrice * effectivePercentages.doctorPercentage;
        const clinicShare = basePrice * effectivePercentages.clinicPercentage;

        return {
            doctorShare,
            clinicShare,
            totalMaterialCost,
            itemsUsedForRecord,
        };
    }, [formData.selectedInventoryItems, inventoryItems, selectedTreatmentDef, clinicData, formData.treatmentDefinitionId, formData.dentistId]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemSelect = (itemId: string) => {
        setFormData(prev => {
            if (prev.selectedInventoryItems.some(sm => sm.inventoryItemId === itemId)) {
                return prev;
            }
            return {
                ...prev,
                selectedInventoryItems: [...prev.selectedInventoryItems, { inventoryItemId: itemId, quantity: 1 }],
            };
        });
    };


    const handleItemQuantityChange = (itemId: string, quantity: number) => {
        setFormData(prev => ({
            ...prev,
            selectedInventoryItems: prev.selectedInventoryItems.map(sm =>
                sm.inventoryItemId === itemId ? { ...sm, quantity: Math.max(0, quantity) } : sm
            ),
        }));
    };

    const handleRemoveItem = (itemId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedInventoryItems: prev.selectedInventoryItems.filter(sm => sm.inventoryItemId !== itemId),
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.dentistId || !formData.treatmentDefinitionId) {
            addNotification(t('addTreatmentRecord.alertFillFields'), NotificationType.ERROR);
            return;
        }

        formData.selectedInventoryItems.forEach(sm => {
            const item = inventoryItems.find(lm => lm.id === sm.inventoryItemId);
            if (item) {
                updateInventoryItem({ ...item, currentStock: item.currentStock - sm.quantity });
            }
        });

        // Add lab case if labId is selected (when adding treatment record)
        if (formData.labId) {
            const labCaseData: Omit<LabCase, 'id'> = {
                patientId: patientId,
                labId: formData.labId,
                caseType: selectedTreatmentDef?.name || 'Treatment Case',
                sentDate: formData.treatmentDate,
                dueDate: new Date(new Date(formData.treatmentDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days later
                returnDate: '',
                status: LabCaseStatus.DRAFT,
                labCost: 0, // Will be updated later
                notes: formData.notes || '',
            };
            clinicData.addLabCase(labCaseData);
        }

        onAdd({
            dentistId: formData.dentistId,
            treatmentDate: formData.treatmentDate,
            treatmentDefinitionId: formData.treatmentDefinitionId,
            notes: formData.notes,
            inventoryItemsUsed: calculateCosts.itemsUsedForRecord,
            doctorShare: calculateCosts.doctorShare,
            clinicShare: calculateCosts.clinicShare,
            totalTreatmentCost: calculateCosts.doctorShare + calculateCosts.clinicShare,
            affectedTeeth: formData.affectedTeeth,
        });
    };

    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden">
                <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0 bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="text-xl font-bold text-slate-700 dark:text-white">{t('addTreatmentRecord.title')}</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600" aria-label={t('common.closeForm')}>
                        <CloseIcon />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-800/30 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 pb-28">
                    {/* Basic Information Section */}
                    <FormSection
                        title={t('addTreatmentRecord.basicInfo')}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="treatmentDate" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('addTreatmentRecord.date')}</label>
                                <input id="treatmentDate" name="treatmentDate" type="date" value={formData.treatmentDate} onChange={handleChange} className="p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm" required />
                            </div>
                            <div>
                                <label htmlFor="dentistId" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('addTreatmentRecord.dentist')}</label>
                                <select id="dentistId" name="dentistId" value={formData.dentistId} onChange={handleChange} className="p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm" required>
                                    <option value="">{t('addTreatmentRecord.selectDentist')}</option>
                                    {dentists.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label htmlFor="treatmentDefinitionId" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('addTreatmentRecord.treatment')}</label>
                            <select id="treatmentDefinitionId" name="treatmentDefinitionId" value={formData.treatmentDefinitionId} onChange={handleChange} className="p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm" required>
                                <option value="">{t('addTreatmentRecord.selectTreatment')}</option>
                                {treatmentDefinitions.map(td => <option key={td.id} value={td.id}>{td.name} ({currencyFormatter.format(td.basePrice)})</option>)}
                            </select>
                        </div>
                        <div className="mt-4">
                            <label htmlFor="labId" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('labCases.dentalLab')} ({t('common.optional')})</label>
                            <select id="labId" name="labId" value={formData.labId} onChange={handleChange} className="p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm">
                                <option value="">{t('labCases.selectDentalLab')}</option>
                                {clinicData.suppliers.filter(s => s.type === 'Dental Lab').map(lab => <option key={lab.id} value={lab.id}>{lab.name}</option>)}
                            </select>
                        </div>
                        <div className="mt-4">
                            <label htmlFor="notes" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('addTreatmentRecord.notes')}</label>
                            <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder={t('addTreatmentRecord.notesPlaceholder')} className="p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg w-full h-24 focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm resize-none" />
                        </div>
                    </FormSection>

                    {/* Affected Teeth Section */}
                    <FormSection
                        title={t('addTreatmentRecord.affectedTeeth')}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                    >
                        <select
                            id="affectedTeeth"
                            multiple
                            value={formData.affectedTeeth}
                            onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                                setFormData(prev => ({ ...prev, affectedTeeth: selected }));
                            }}
                            className="p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg w-full h-32 focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm"
                        >
                            {[
                                ...Array.from({ length: 8 }, (_, i) => `UR${i + 1}`),
                                ...Array.from({ length: 8 }, (_, i) => `UL${i + 1}`),
                                ...Array.from({ length: 8 }, (_, i) => `LL${i + 1}`),
                                ...Array.from({ length: 8 }, (_, i) => `LR${i + 1}`),
                            ].map(toothId => (
                                <option key={toothId} value={toothId}>{toothId}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{t('addTreatmentRecord.affectedTeethHelp')}</p>
                    </FormSection>

                    {/* Inventory Items Section */}
                    <FormSection
                        title={t('addTreatmentRecord.inventoryItemsUsed')}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                    >
                        <div className="space-y-3 mb-4">
                            {formData.selectedInventoryItems.map(si => {
                                const item = inventoryItems.find(i => i.id === si.inventoryItemId);
                                return item ? (
                                    <div key={si.inventoryItemId} className="flex items-center gap-3 bg-white dark:bg-slate-700 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                                        <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">{item.name}</p>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => handleItemQuantityChange(si.inventoryItemId, si.quantity - 1)} className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500" aria-label={t('addTreatmentRecord.decreaseQuantityAria', {itemName: item.name})}>
                                                <MinusIcon />
                                            </button>
                                            <input
                                                type="number"
                                                min="0"
                                                value={si.quantity}
                                                onChange={(e) => handleItemQuantityChange(si.inventoryItemId, parseFloat(e.target.value))}
                                                className="w-16 text-center border border-slate-300 dark:border-slate-600 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                                                aria-label={t('addTreatmentRecord.quantityAria', {itemName: item.name})}
                                            />
                                            <button type="button" onClick={() => handleItemQuantityChange(si.inventoryItemId, si.quantity + 1)} className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500" aria-label={t('addTreatmentRecord.increaseQuantityAria', {itemName: item.name})}>
                                                <PlusIcon />
                                            </button>
                                        </div>
                                        <button type="button" onClick={() => handleRemoveItem(si.inventoryItemId)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-600" aria-label={t('addTreatmentRecord.removeItemAria', {itemName: item.name})}>
                                            <CloseIcon />
                                        </button>
                                    </div>
                                ) : null;
                            })}
                        </div>
                        <label htmlFor="add-inventory-item" className="sr-only">{t('addTreatmentRecord.addItem')}</label>
                        <select
                            id="add-inventory-item"
                            onChange={(e) => handleItemSelect(e.target.value)}
                            value=""
                            className="p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg w-full text-slate-600 dark:text-slate-400 focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-sm"
                        >
                            <option value="">{t('addTreatmentRecord.addItemPlaceholder')}</option>
                            {inventoryItems.filter(i => !formData.selectedInventoryItems.some(si => si.inventoryItemId === i.id))
                                .map(i => (
                                <option key={i.id} value={i.id}>{i.name} ({t('addTreatmentRecord.stock')}: {i.currentStock})</option>
                            ))}
                        </select>
                    </FormSection>

                    {/* Cost Summary Section */}
                    <FormSection
                        title={t('addTreatmentRecord.costSummary')}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 8v4m-4.003-4l-2.003 2.003m7.007-1.414L14.003 10m-3.414-1.414L9 5.586m4.003 2.828l3.004 3.004M9.879 16.121A3 3 0 1012.004 15H12v2.003V20m0-8c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    >
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                                <span className="text-sm text-slate-600 dark:text-slate-300">{t('addTreatmentRecord.baseTreatmentPrice')}</span>
                                <span className="text-base font-bold text-slate-800 dark:text-white">{currencyFormatter.format(selectedTreatmentDef?.basePrice || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                <span className="text-sm text-blue-700 dark:text-blue-300">{t('addTreatmentRecord.doctorShare')}</span>
                                <span className="text-base font-bold text-blue-700 dark:text-blue-300">{currencyFormatter.format(calculateCosts.doctorShare)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                <span className="text-sm text-emerald-700 dark:text-emerald-300">{t('addTreatmentRecord.clinicShare')}</span>
                                <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">{currencyFormatter.format(calculateCosts.clinicShare)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
                                <span className="text-sm text-orange-700 dark:text-orange-300">{t('addTreatmentRecord.totalMaterialCost')}</span>
                                <span className="text-base font-bold text-orange-700 dark:text-orange-300">{currencyFormatter.format(calculateCosts.totalMaterialCost)}</span>
                            </div>
                        </div>
                    </FormSection>

                    <footer className="pt-2 flex justify-end gap-3 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 text-sm font-medium">{t('common.cancel')}</button>
                        <button type="submit" className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400/50 text-sm font-medium">{t('addTreatmentRecord.saveRecord')}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default AddTreatmentRecordModal;
