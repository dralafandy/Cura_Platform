import React, { useState, useMemo, useEffect } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { Supplier, SupplierInvoice, SupplierInvoiceStatus } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { useReportsFilters } from '../../contexts/ReportsFilterContext';
import { NotificationType } from '../../types';
import SupplierStatement from './SupplierStatement';
import SupplierDetailedReport from './SupplierDetailedReport';
import LabStatement from './LabStatement';
import InvoiceAttachmentUploader from './InvoiceAttachmentUploader';
import { openPrintWindow } from '../../utils/print';
import { useTheme } from '../../contexts/ThemeContext';

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

const AddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const AttachmentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ReceiptIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 me-1 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const PrintIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m0 0v1a2 2 0 002 2h6a2 2 0 002-2v-1M8 12h8m-8 4h.01M5 12h.01M19 12h.01M5 16h.01M19 16h.01" /></svg>);
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const DollarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>;
const PackageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const LabIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 me-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;

const getSupplierTypeIcon = (type: string) => {
    switch (type) {
        case 'Material Supplier': return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
        case 'Dental Lab': return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
        default: return <UserIcon />;
    }
};

const SupplierFormSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    isDark?: boolean;
}> = ({ title, icon, children, className = '', isDark = false }) => (
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

const SupplierInputField: React.FC<{
    id: string;
    name: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
    icon?: React.ReactNode;
    className?: string;
}> = ({
    id, name, label, value, onChange, type = 'text', placeholder, required, icon, className = ''
}) => {
    const inputClasses = `
        w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg
        focus:ring-2 focus:ring-primary/20 focus:border-primary
        transition-all duration-200 ease-in-out
        placeholder:text-slate-500 dark:placeholder:text-slate-400 text-slate-700 dark:text-slate-200
        ${icon ? 'ps-10' : ''}
    `;

    return (
        <div className={`relative ${className}`}>
            <label htmlFor={id} className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                {label}
                {required && <span className="text-red-500 mr-1">*</span>}
            </label>
            <div className="relative">
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
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};


const AddEditSupplierModal: React.FC<{
    supplier?: Supplier;
    onClose: () => void;
    onSave: (supplier: Omit<Supplier, 'id'> | Supplier) => void;
}> = ({ supplier, onClose, onSave }) => {
    const { t } = useI18n();
    const { isDark } = useTheme();
    const [formData, setFormData] = useState<Omit<Supplier, 'id'> | Supplier>(
        supplier || { name: '', contact_person: '', phone: '', email: '', type: 'Material Supplier' }
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <header className={`px-6 py-4 flex justify-between items-center flex-shrink-0 ${isDark ? 'bg-gradient-to-r from-slate-800 to-slate-900' : 'bg-gradient-to-r from-primary to-primary-dark'}`}>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <PackageIcon />
                        {supplier ? t('suppliers.editSupplier') : t('suppliers.addNewSupplier')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                        aria-label={t('common.closeForm')}
                    >
                        <CloseIcon />
                    </button>
                </header>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-5 animate-fadeIn">
                        <SupplierFormSection title={t('suppliers.basicInfo')} icon={<PackageIcon />} isDark={isDark}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <SupplierInputField
                                    id="supplier-name"
                                    name="name"
                                    label={t('suppliers.supplierName')}
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder={t('suppliers.supplierNamePlaceholder')}
                                    required
                                    icon={<PackageIcon />}
                                />
                                <SupplierInputField
                                    id="contact-person"
                                    name="contact_person"
                                    label={t('suppliers.contactPerson')}
                                    value={formData.contact_person}
                                    onChange={handleChange}
                                    placeholder={t('suppliers.contactPersonPlaceholder')}
                                    icon={<UserIcon />}
                                />
                                <SupplierInputField
                                    id="supplier-phone"
                                    name="phone"
                                    label={t('suppliers.phone')}
                                    value={formData.phone}
                                    onChange={handleChange}
                                    type="tel"
                                    placeholder="01xxxxxxxxx"
                                    icon={<PhoneIcon />}
                                />
                                <SupplierInputField
                                    id="supplier-email"
                                    name="email"
                                    label={t('suppliers.email')}
                                    value={formData.email}
                                    onChange={handleChange}
                                    type="email"
                                    placeholder="example@email.com"
                                    icon={<EmailIcon />}
                                />
                            </div>
                        </SupplierFormSection>

                        <SupplierFormSection title={t('suppliers.supplierTypeLabel')} icon={<LabIcon />} isDark={isDark}>
                            <div className="relative">
                                <label htmlFor="type" className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                                    {t('suppliers.supplierType')}
                                    <span className="text-red-500 mr-1">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="type"
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-slate-700 dark:text-slate-200 appearance-none"
                                        required
                                    >
                                        <option value="Material Supplier">{t('supplierType.materialSupplier')}</option>
                                        <option value="Dental Lab">{t('supplierType.dentalLab')}</option>
                                    </select>
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                                        {getSupplierTypeIcon(formData.type)}
                                    </div>
                                    <div className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </SupplierFormSection>
                    </div>

                    {/* Footer */}
                    <footer className="pt-6 flex justify-end space-x-4 border-t border-slate-200 dark:border-slate-700 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all duration-200 font-medium"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg hover:from-primary-dark hover:to-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                        >
                            {t('common.save')}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

const AddEditInvoiceModal: React.FC<{
    invoice?: SupplierInvoice;
    supplierId: string;
    clinicData: ClinicData;
    onClose: () => void;
    onSave: (invoice: Omit<SupplierInvoice, 'id'> | SupplierInvoice, updateInventory?: boolean) => void;
}> = ({ invoice, supplierId, clinicData, onClose, onSave }) => {
    const { t } = useI18n();
    const { addNotification } = useNotification();
    
    // Get inventory items for this supplier (only for Material Suppliers)
    const supplier = clinicData.suppliers.find(s => s.id === supplierId);
    const supplierInventoryItems = supplier?.type === 'Material Supplier' 
        ? clinicData.inventoryItems.filter(item => item.supplierId === supplierId)
        : [];

    const [showInventorySelector, setShowInventorySelector] = useState(false);
    const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<string>('');
    const [itemQuantity, setItemQuantity] = useState<number>(1);

    const [formData, setFormData] = useState<Omit<SupplierInvoice, 'id'> | SupplierInvoice>(
        invoice || {
            supplierId: supplierId,
            invoiceNumber: '',
            invoiceDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            amount: 0,
            status: SupplierInvoiceStatus.UNPAID,
            items: [{ description: '', amount: 0, inventoryItemId: undefined, quantity: 1 }],
            payments: [],
            labCaseId: undefined,
            invoiceImageUrl: undefined,
        }
    );

    // Get lab cases for the supplier if it's a dental lab
    const labCases = supplier?.type === 'Dental Lab' ? clinicData.labCases.filter(lc => lc.labId === supplierId) : [];

    // Auto-populate invoice data if a lab case is selected
    const selectedLabCase = formData.labCaseId ? labCases.find(lc => lc.id === formData.labCaseId) : null;
    useMemo(() => {
        if (selectedLabCase && !invoice) { // Only auto-populate for new invoices
            setFormData(prev => ({
                ...prev,
                invoiceNumber: `LC-${selectedLabCase.caseType}-${Date.now()}`,
                amount: selectedLabCase.labCost,
                items: [{ description: `Lab case: ${selectedLabCase.caseType}`, amount: selectedLabCase.labCost, inventoryItemId: undefined, quantity: 1 }],
                dueDate: selectedLabCase.dueDate,
            }));
        }
    }, [selectedLabCase, invoice]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: name === 'amount' ? parseFloat(value) : value });
    };

    const handleItemChange = (index: number, field: string, value: string | number) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: field === 'amount' ? parseFloat(value as string) || 0 : field === 'quantity' ? parseInt(value as string) || 1 : value };
        
        // Auto-calculate amount if quantity or inventory item changes
        if (field === 'quantity' || field === 'inventoryItemId') {
            const item = newItems[index];
            if (item.inventoryItemId) {
                const inventoryItem = clinicData.inventoryItems.find(i => i.id === item.inventoryItemId);
                if (inventoryItem) {
                    item.amount = (item.quantity || 1) * inventoryItem.unitCost;
                }
            }
        }
        
        setFormData({ ...formData, items: newItems });
    };

    // Handle adding item from inventory
    const handleAddFromInventory = () => {
        if (!selectedInventoryItemId) return;
        
        const inventoryItem = clinicData.inventoryItems.find(i => i.id === selectedInventoryItemId);
        if (!inventoryItem) return;

        const newItem = {
            description: inventoryItem.name,
            amount: inventoryItem.unitCost * itemQuantity,
            inventoryItemId: inventoryItem.id,
            quantity: itemQuantity
        };

        setFormData({
            ...formData,
            items: [...formData.items, newItem]
        });

        // Reset selector
        setSelectedInventoryItemId('');
        setItemQuantity(1);
        setShowInventorySelector(false);
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { description: '', amount: 0, inventoryItemId: undefined, quantity: 1 }]
        });
    };

    const removeItem = (index: number) => {
        if (formData.items.length > 1) {
            setFormData({
                ...formData,
                items: formData.items.filter((_, i) => i !== index)
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Check if there are items linked to inventory for update
        const hasInventoryItems = formData.items.some(item => item.inventoryItemId);
        
        // Calculate total amount from items
        const totalAmount = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
        const invoiceToSave = { ...formData, amount: totalAmount };
        
        // Save invoice and indicate if inventory should be updated
        onSave(invoiceToSave, hasInventoryItems);
        onClose();
    };

    // Helper to get inventory item details
    const getInventoryItem = (item: { inventoryItemId?: string }) => {
        if (!item.inventoryItemId) return null;
        return clinicData.inventoryItems.find(i => i.id === item.inventoryItemId);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
                <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-cyan-50 to-violet-50 dark:from-cyan-900/30 dark:to-violet-900/20">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-violet-500 bg-clip-text text-transparent">{invoice ? t('invoices.editInvoice') : t('invoices.addInvoice')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-300" aria-label={t('common.closeForm')}><CloseIcon /></button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <input name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} placeholder={t('invoices.invoiceNumber')} className="p-2 border border-cyan-200 dark:border-cyan-600 rounded-lg w-full focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200" />
                    {supplier?.type === 'Dental Lab' && labCases.length > 0 && (
                        <div>
                            <label className="text-sm font-medium text-cyan-700 dark:text-cyan-400 block mb-2">{t('invoices.relatedLabCase')}</label>
                            <select
                                name="labCaseId"
                                value={formData.labCaseId || ''}
                                onChange={handleChange}
                                className="p-2 border border-cyan-200 dark:border-cyan-600 rounded-lg w-full focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200"
                            >
                                <option value="">{t('invoices.selectLabCaseOptional')}</option>
                                {labCases.map(lc => (
                                    <option key={lc.id} value={lc.id}>
                                        {lc.caseType} - {clinicData.patients.find(p => p.id === lc.patientId)?.name || 'Unknown Patient'} ({lc.status})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-cyan-700 dark:text-cyan-400" htmlFor="invoiceDate">{t('invoices.invoiceDate')}</label>
                            <input id="invoiceDate" name="invoiceDate" type="date" value={formData.invoiceDate} onChange={handleChange} className="p-2 border border-cyan-200 dark:border-cyan-600 rounded-lg w-full focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200" required />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-cyan-700 dark:text-cyan-400" htmlFor="dueDate">{t('invoices.dueDate')}</label>
                            <input id="dueDate" name="dueDate" type="date" value={formData.dueDate || ''} onChange={handleChange} className="p-2 border border-cyan-200 dark:border-cyan-600 rounded-lg w-full focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200" />
                        </div>
                    </div>

                    {/* Invoice Items */}
                    <div>
                        <label className="text-sm font-medium text-cyan-700 dark:text-cyan-400 block mb-2">{t('invoices.invoiceItems')}</label>
                        
                        {/* Inventory Selection Panel - Only show for Material Suppliers */}
                        {supplier?.type === 'Material Supplier' && supplierInventoryItems.length > 0 && (
                            <div className="mb-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                                {!showInventorySelector ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowInventorySelector(true)}
                                        className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        {t('invoices.addFromInventory') || 'إضافة من المخزون'}
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                                {t('invoices.selectFromInventory') || 'اختر من المخزون'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setShowInventorySelector(false)}
                                                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                            >
                                                {t('common.cancel')}
                                            </button>
                                        </div>
                                        <select
                                            value={selectedInventoryItemId}
                                            onChange={(e) => setSelectedInventoryItemId(e.target.value)}
                                            className="w-full p-2 text-sm border border-emerald-300 dark:border-emerald-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                                        >
                                            <option value="">{t('invoices.selectItem') || 'اختر عنصر'}</option>
                                            {supplierInventoryItems.map(item => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name} - {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(item.unitCost)} (stock: {item.currentStock})
                                                </option>
                                            ))}
                                        </select>
                                        {selectedInventoryItemId && (
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-emerald-600 dark:text-emerald-400">
                                                    {t('invoices.quantity') || 'الكمية'}:
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={itemQuantity}
                                                    onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                                                    className="w-20 p-1 text-sm border border-emerald-300 dark:border-emerald-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddFromInventory}
                                                    className="flex-1 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors"
                                                >
                                                    {t('common.add') || 'إضافة'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {formData.items.map((item, index) => {
                            const inventoryItem = getInventoryItem(item);
                            return (
                            <div key={index} className="flex gap-2 mb-2 items-start">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder={t('invoices.descriptionLabel')}
                                        value={item.description}
                                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                        className="w-full p-2 border border-cyan-200 dark:border-cyan-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200"
                                    />
                                    {inventoryItem && (
                                        <div className="flex items-center gap-2 mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                            <span>{t('inventory.currentStock') || 'المخزون'}: {inventoryItem.currentStock}</span>
                                            {item.quantity && item.quantity > 1 && (
                                                <span className="text-cyan-600 dark:text-cyan-400">
                                                    (+{item.quantity})
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {item.inventoryItemId && (
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder={t('invoices.quantity') || 'كمية'}
                                        value={item.quantity || 1}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                        className="w-16 p-2 border border-emerald-200 dark:border-emerald-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200 text-sm"
                                        title={t('invoices.quantity') || 'Quantity'}
                                    />
                                )}
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder={t('invoices.amountLabel')}
                                    value={item.amount}
                                    onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                                    className="w-24 p-2 border border-cyan-200 dark:border-cyan-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200"
                                />
                                {formData.items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-lg hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-all duration-200"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                            );
                        })}
                        <button
                            type="button"
                            onClick={addItem}
                            className="text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium"
                        >
                            {t('invoices.addItem')}
                        </button>
                    </div>

                    {/* Total Amount Display */}
                    <div className="bg-gradient-to-br from-cyan-50 to-violet-50 dark:from-cyan-900/30 dark:to-violet-900/20 p-3 rounded-lg border border-cyan-100 dark:border-cyan-700">
                        <p className="text-sm font-medium text-cyan-700 dark:text-cyan-400">
                            {t('invoices.totalAmountLabel')} {new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(formData.items.reduce((sum, item) => sum + (item.amount || 0), 0))}
                        </p>
                    </div>

                            <div>
                                <label className="text-sm font-medium text-cyan-700 dark:text-cyan-400 block mb-2">{t('invoices.attachInvoice')}</label>
                                <InvoiceAttachmentUploader
                                    initialUrl={formData.invoiceImageUrl}
                                    onUploadComplete={(url) => setFormData(prev => ({ ...prev, invoiceImageUrl: url }))}
                                />
                          </div>
                    <footer className="pt-2 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all duration-200">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-lg hover:from-cyan-600 hover:to-violet-600 focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all duration-200">{t('common.save')}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

const SupplierDetailsAndInvoicesModal: React.FC<{
    supplier: Supplier;
    onClose: () => void;
    clinicData: ClinicData;
    onDataRefresh?: () => void;
}> = ({ supplier, onClose, clinicData, onDataRefresh }) => {
    const { t, locale } = useI18n();
    const { supplierInvoices, addSupplierInvoice, updateSupplierInvoice, expenses } = clinicData;
    const { addNotification } = useNotification();
    const [modalState, setModalState] = useState<{ type: 'add_invoice' | 'edit_invoice' | null; data?: any }>({ type: null });
    
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });

    const relatedInvoices = useMemo(() => {
        return supplierInvoices.filter(inv => inv.supplierId === supplier.id)
            .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
    }, [supplierInvoices, supplier.id]);

    // Trigger refresh when parent signals data change
    useEffect(() => {
        if (onDataRefresh) {
            // Force re-render by using a brief timeout
            const timer = setTimeout(() => {
                // Data will be refreshed by the parent's useEffect
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [onDataRefresh]);

    // Get all expenses related to this supplier (both direct expenses and invoice payments)
    const relatedExpenses = useMemo(() => {
        return expenses.filter(exp =>
            exp.supplierId === supplier.id ||
            relatedInvoices.some(inv => inv.payments.some(p => p.expenseId === exp.id))
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, supplier.id, relatedInvoices]);

    const financialSummary = useMemo(() => {
        console.log('Debug: Supplier ID:', supplier.id);
        console.log('Debug: Related Invoices:', relatedInvoices);
        console.log('Debug: Related Expenses:', relatedExpenses);

        const totalBilled = relatedInvoices.reduce((sum, inv) => {
            console.log('Debug: Invoice amount:', inv.amount, 'for invoice:', inv.id);
            return sum + inv.amount;
        }, 0);

        const totalPaid = relatedExpenses.reduce((sum, exp) => {
            console.log('Debug: Expense amount:', exp.amount, 'for expense:', exp.id);
            return sum + exp.amount;
        }, 0);

        const outstandingBalance = totalBilled - totalPaid;

        console.log('Debug: Financial Summary - Total Billed:', totalBilled, 'Total Paid:', totalPaid, 'Outstanding:', outstandingBalance);

        return { totalBilled, totalPaid, outstandingBalance };
    }, [relatedInvoices, relatedExpenses]);

    const handleSaveInvoice = (invoice: Omit<SupplierInvoice, 'id'> | SupplierInvoice, updateInventory?: boolean) => {
        if ('id' in invoice && invoice.id) {
            updateSupplierInvoice(invoice as SupplierInvoice);
            addNotification({
                message: t('notifications.invoiceUpdated'),
                type: NotificationType.SUCCESS
            });
        } else {
            // Add the invoice first to get the ID
            const newInvoice = invoice as Omit<SupplierInvoice, 'id'>;
            addSupplierInvoice(newInvoice);
            
            // Update inventory stock if invoice has linked inventory items
            if (updateInventory && invoice.items) {
                // Get the newly created invoice to link to inventory
                const createdInvoice = clinicData.supplierInvoices.find(inv => 
                    inv.supplierId === invoice.supplierId && 
                    inv.invoiceDate === invoice.invoiceDate &&
                    inv.amount === invoice.amount
                );
                
                invoice.items.forEach(item => {
                    if (item.inventoryItemId && item.quantity) {
                        const inventoryItem = clinicData.inventoryItems.find(i => i.id === item.inventoryItemId);
                        if (inventoryItem) {
                            // Increase stock by quantity and mark source
                            const updatedItem = {
                                ...inventoryItem,
                                currentStock: inventoryItem.currentStock + item.quantity,
                                source: 'supplier_invoice' as const,
                                supplierInvoiceId: createdInvoice?.id
                            };
                            clinicData.updateInventoryItem(updatedItem);
                        }
                    }
                });
                addNotification({
                    message: t('notifications.inventoryUpdated') || 'تم تحديث المخزون',
                    type: NotificationType.SUCCESS
                });
            }
            
            addNotification({
                message: t('notifications.invoiceAdded'),
                type: NotificationType.SUCCESS
            });
        }
        if (onDataRefresh) onDataRefresh();
        setModalState({ type: null });
    };

    const handleDeleteInvoice = (invoice: SupplierInvoice) => {
        if (window.confirm(t('invoices.confirmDelete', { invoiceNumber: invoice.invoiceNumber || invoice.id.slice(-6) }))) {
            clinicData.deleteSupplierInvoice(invoice.id);
            addNotification({
                message: t('notifications.invoiceDeleted'),
                type: NotificationType.SUCCESS
            });
            if (onDataRefresh) onDataRefresh();
        }
    };

    const handlePrintFinancialStatement = () => {
        openPrintWindow(t('supplierStatement.financialTitle'), <SupplierStatement supplier={supplier} clinicData={clinicData} />);
    };
    
    const handlePrintCaseStatement = () => {
        openPrintWindow(t('supplierStatement.caseTitle'), <LabStatement supplier={supplier} clinicData={clinicData} />);
    };

    const [selectedAttachment, setSelectedAttachment] = useState<{ url: string; name: string } | null>(null);


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-cyan-50 to-violet-50 dark:from-cyan-900/30 dark:to-violet-900/20">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-violet-500 bg-clip-text text-transparent">{supplier.name}</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrintFinancialStatement} className="flex items-center px-3 py-1 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-lg hover:from-cyan-600 hover:to-violet-600 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all duration-200">
                           <PrintIcon /> {t('supplierStatement.financialTitle')}
                        </button>
                        {supplier.type === 'Dental Lab' && (
                             <button onClick={handlePrintCaseStatement} className="flex items-center px-3 py-1 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg hover:from-violet-600 hover:to-violet-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-300 transition-all duration-200">
                               <PrintIcon /> {t('supplierStatement.caseTitle')}
                            </button>
                        )}
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-300" aria-label={t('common.closeForm')}><CloseIcon /></button>
                    </div>
                </header>
                <main className="p-6 overflow-y-auto space-y-6 bg-gradient-to-br from-slate-50 to-cyan-50/30 dark:from-slate-900 dark:to-cyan-900/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Supplier Info */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-cyan-100 dark:border-cyan-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-gradient-to-br from-cyan-500 to-violet-500 text-white p-2 rounded-lg">
                                    {getSupplierTypeIcon(supplier.type)}
                                </div>
                                <h3 className="font-semibold text-cyan-700 dark:text-cyan-400">{t('suppliers.contactInfo')}</h3>
                            </div>
                            <p className="dark:text-slate-300"><strong className="text-cyan-600 dark:text-cyan-400">{t('suppliers.contactPersonLabel')}:</strong> {supplier.contact_person || '-'}</p>
                            <p className="dark:text-slate-300"><strong className="text-cyan-600 dark:text-cyan-400">{t('suppliers.phoneLabel')}:</strong> {supplier.phone || '-'}</p>
                            <p className="dark:text-slate-300"><strong className="text-cyan-600 dark:text-cyan-400">{t('suppliers.emailLabel')}:</strong> {supplier.email || '-'}</p>
                        </div>
                        {/* Financial Summary */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-cyan-100 dark:border-cyan-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-2 rounded-lg">
                                    <DollarIcon />
                                </div>
                                <h3 className="font-semibold text-cyan-700 dark:text-cyan-400">{t('suppliers.financialSummary')}</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">{t('suppliers.totalBilled')}:</span>
                                    <span className="font-bold text-cyan-700 dark:text-cyan-400">{currencyFormatter.format(financialSummary.totalBilled)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600 dark:text-slate-400">{t('suppliers.totalPaid')}:</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{currencyFormatter.format(financialSummary.totalPaid)}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">{t('suppliers.outstandingBalanceLabel')}:</span>
                                    <span className={`font-bold ${financialSummary.outstandingBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {currencyFormatter.format(financialSummary.outstandingBalance)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Invoices Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                              <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-violet-500 bg-clip-text text-transparent">{t('suppliers.invoicesLabel')}</h3>
                              <button onClick={() => setModalState({ type: 'add_invoice'})} className="flex items-center bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-3 py-1 rounded-lg hover:from-cyan-600 hover:to-violet-600 text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-300"><AddIcon /> {t('suppliers.addInvoiceButton')}</button>
                         </div>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mb-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2">
                            {t('invoices.payFromExpensesOnlyHint')}
                        </p>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-cyan-100 dark:border-cyan-700 space-y-3">
                            {relatedInvoices.length > 0 ? relatedInvoices.map(inv => {
                                const totalPaid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
                                const balance = inv.amount - totalPaid;
    
                                return (
                                <div key={inv.id} className="border border-cyan-100 dark:border-cyan-700 p-3 rounded-lg hover:shadow-md transition-all duration-200 bg-white dark:bg-slate-800">
                                    <div className="flex flex-wrap justify-between items-start gap-2">
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-200">{t('invoices.invoice')} #{inv.invoiceNumber || inv.id.slice(-6)}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{t('invoices.date')}: {dateFormatter.format(new Date(inv.invoiceDate))}</p>
                                            {inv.dueDate && <p className="text-xs text-slate-500 dark:text-slate-500">{t('invoices.due')}: {dateFormatter.format(new Date(inv.dueDate))}</p>}
                                        </div>
                                        <div className="text-end">
                                            <p className="text-lg font-bold text-cyan-700 dark:text-cyan-400">{currencyFormatter.format(inv.amount)}</p>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${balance <= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'}`}>
                                                {balance <= 0 ? t('invoices.paid') : `${t('invoices.remaining')}: ${currencyFormatter.format(balance)}`}
                                            </span>
                                        </div>
                                    </div>
                                    {inv.items && inv.items.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                            <p className="font-semibold text-xs text-cyan-600 dark:text-cyan-400">{t('suppliers.invoiceDetails')}:</p>
                                            {inv.items.map((item, index) => (
                                                <div key={index} className="flex items-center justify-between ps-2">
                                                    <span>{item.description || t('suppliers.undefinedItem')}</span>
                                                    <span>{currencyFormatter.format(item.amount || 0)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {inv.payments.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                            <p className="font-semibold text-xs text-cyan-600 dark:text-cyan-400">{t('suppliers.paymentsLabel')}:</p>
                                            {inv.payments.map(p => {
                                                const expense = expenses.find(e => e.id === p.expenseId);
                                                return (
                                                    <div key={p.expenseId} className="flex items-center justify-between ps-2">
                                                        <span><ReceiptIcon />{dateFormatter.format(new Date(p.date))} - {expense?.description || t('suppliers.paymentLabel')}</span>
                                                        <span>{currencyFormatter.format(p.amount)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-3">
                                                {(() => {
                                                    const attachments = clinicData.supplierInvoiceAttachments.filter(a => a.supplierInvoiceId === inv.id);
                                                    if (!attachments || attachments.length === 0) return null;
                                                    const att = attachments[0];
                                                    const url = att.fileUrl;
                                                    if (!url) return null;
                                                    if (url.endsWith('.pdf') || url.includes('application/pdf')) {
                                                        return (<a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium"><AttachmentIcon/>{t('invoices.viewAttachment')}</a>);
                                                    }
                                                    return (
                                                        <button onClick={() => setSelectedAttachment({ url, name: inv.invoiceNumber || inv.id.slice(-6) })} className="flex items-center gap-2">
                                                            <img src={url} alt={inv.invoiceNumber} className="max-h-12 rounded-lg border border-slate-200 dark:border-slate-700" />
                                                            <span className="text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium">{t('invoices.viewAttachment')}</span>
                                                        </button>
                                                    );
                                                })()}
                                        {balance > 0 && (
                                            <span className="flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-700">
                                                <CheckCircleIcon />
                                                {t('invoices.payFromExpensesOnly')}
                                            </span>
                                        )}
                                        <button onClick={() => setModalState({ type: 'edit_invoice', data: inv })} className="flex items-center gap-1 text-sm bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-2 py-1 rounded-lg hover:from-cyan-600 hover:to-violet-600 transition-all duration-200 shadow-sm"><EditIcon />{t('common.edit')}</button>
                                        <button onClick={() => handleDeleteInvoice(inv)} className="flex items-center gap-1 text-sm bg-gradient-to-r from-rose-500 to-rose-600 text-white px-2 py-1 rounded-lg hover:from-rose-600 hover:to-rose-700 transition-all duration-200 shadow-sm"><DeleteIcon />{t('common.delete')}</button>
                                    </div>
                                </div>
                            )}) : <p className="text-slate-500 dark:text-slate-400 text-center py-4">{t('suppliers.noInvoicesForSupplier')}</p>}
                         </div>
                     </div>

                      {/* All Expenses Section */}
                      <div>
                           <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-violet-500 bg-clip-text text-transparent mb-2">{t('suppliers.allExpensesAndPayments')}</h3>
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-cyan-100 dark:border-cyan-700 space-y-3">
                              {relatedExpenses.length > 0 ? relatedExpenses.map(exp => {
                                  const isInvoicePayment = relatedInvoices.some(inv =>
                                      inv.payments.some(p => p.expenseId === exp.id)
                                  );
                                  const relatedInvoice = relatedInvoices.find(inv =>
                                      inv.payments.some(p => p.expenseId === exp.id)
                                  );
      
                                   return (
                                       <div key={exp.id} className="border border-cyan-100 dark:border-cyan-700 p-3 rounded-lg hover:shadow-md transition-all duration-200 bg-white dark:bg-slate-800">
                                           <div className="flex flex-wrap justify-between items-start gap-2">
                                               <div>
                                                   <p className="font-bold text-slate-800 dark:text-slate-200">
                                                       {isInvoicePayment ? `${t('suppliers.paymentForInvoice')} ${relatedInvoice?.invoiceNumber || relatedInvoice?.id.slice(-6)}` : exp.description}
                                                   </p>
                                                   <p className="text-sm text-slate-600 dark:text-slate-400">{t('suppliers.dateLabel')}: {dateFormatter.format(new Date(exp.date))}</p>
                                                   <p className="text-xs text-slate-500 dark:text-slate-500">{t('suppliers.categoryLabel')}: {exp.category === 'SUPPLIES' ? t('suppliers.suppliesLabel') : exp.category === 'RENT' ? t('expenseCategory.RENT') : exp.category === 'SALARIES' ? t('expenseCategory.SALARIES') : exp.category === 'UTILITIES' ? t('expenseCategory.UTILITIES') : exp.category === 'MARKETING' ? t('expenseCategory.MARKETING') : exp.category === 'LAB_FEES' ? t('expenseCategory.LAB_FEES') : t('expenseCategory.MISC')}</p>
                                               </div>
                                               <div className="text-end">
                                                   <p className="text-lg font-bold text-rose-600 dark:text-rose-400">-{currencyFormatter.format(exp.amount)}</p>
                                                   {isInvoicePayment && <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full">{t('suppliers.invoicePayment')}</span>}
                                               </div>
                                           </div>
                                       </div>
                                   );
                               }) : <p className="text-slate-500 dark:text-slate-400 text-center py-4">{t('suppliers.noExpensesForSupplier')}</p>}
                          </div>
                      </div>
                </main>
            </div>
            { (modalState.type === 'add_invoice' || modalState.type === 'edit_invoice') && (
                <AddEditInvoiceModal
                    supplierId={supplier.id}
                    invoice={modalState.data}
                    clinicData={clinicData}
                    onClose={() => setModalState({ type: null })}
                    onSave={handleSaveInvoice}
                />
            )}
            {selectedAttachment && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
                    <div className="relative max-w-4xl max-h-full w-full bg-transparent">
                        <button onClick={() => setSelectedAttachment(null)} className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center">×</button>
                        <div className="flex items-center justify-center">
                            {selectedAttachment.url.endsWith('.pdf') || selectedAttachment.url.includes('application/pdf') ? (
                                <iframe src={selectedAttachment.url} title={selectedAttachment.name} className="w-full h-[80vh] rounded-lg" />
                            ) : (
                                <img src={selectedAttachment.url} alt={selectedAttachment.name} className="max-w-full max-h-[80vh] object-contain rounded-lg" />
                            )}
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 text-white text-center bg-black bg-opacity-50 rounded-lg p-2">
                            <p className="text-sm font-medium">{selectedAttachment.name}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export const SuppliersManagement: React.FC<{ clinicData: ClinicData }> = ({ clinicData }) => {
    const { suppliers, addSupplier, updateSupplier, deleteSupplier, supplierInvoices, expenses } = clinicData;
    const { t, locale } = useI18n();
    const { filters: reportsFilters, resetFilters } = useReportsFilters();
    
    const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
    const [viewingSupplier, setViewingSupplier] = useState<Supplier | undefined>(undefined);
    const [viewingSupplierReport, setViewingSupplierReport] = useState<Supplier | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<'ALL' | 'Material Supplier' | 'Dental Lab'>('ALL');
    const [sortBy, setSortBy] = useState<'name' | 'balance' | 'type'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [supplierDataNeedsRefresh, setSupplierDataNeedsRefresh] = useState(false);

    // Effect to refresh supplier data when needed
    useEffect(() => {
        if (supplierDataNeedsRefresh) {
            // The clinicData is already being updated by the add/update functions
            // We just need to trigger a re-render
            setSupplierDataNeedsRefresh(false);
        }
    }, [supplierDataNeedsRefresh]);

    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    const handleSaveSupplier = (supplier: Omit<Supplier, 'id'> | Supplier) => {
        if ('id' in supplier && supplier.id) {
            updateSupplier(supplier as Supplier);
        } else {
            addSupplier(supplier as Omit<Supplier, 'id'>);
        }
        setEditingSupplier(undefined);
    };

    const handleDeleteSupplier = (supplier: Supplier) => {
        if (window.confirm(t('suppliers.confirmDelete', { name: supplier.name }))) {
            deleteSupplier(supplier.id);
        }
    };

    // Calculate stats
    const totalSuppliers = suppliers.length;
    const totalOutstanding = supplierInvoices.reduce((sum, inv) => sum + inv.amount, 0) -
        expenses.filter(exp => exp.supplierId || supplierInvoices.some(inv => inv.payments.some(p => p.expenseId === exp.id))).reduce((sum, exp) => sum + exp.amount, 0);
    const materialSuppliers = suppliers.filter(s => s.type === 'Material Supplier').length;
    const dentalLabs = suppliers.filter(s => s.type === 'Dental Lab').length;

    return (
        <div className="suppliers-page min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Enhanced Header with Cyan + Violet Theme */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-cyan-200 dark:border-cyan-700 shadow-sm mb-6 relative overflow-hidden">
                    {/* Decorative gradient bar at top */}
                    <div className="absolute left-0 top-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-violet-700"></div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-violet-500 bg-clip-text text-transparent mb-2">
                            {t('suppliers.suppliersList')}
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">{t('suppliers.manageSuppliersAndLabs')} <span className="font-semibold text-cyan-600 dark:text-cyan-400">{suppliers.length}</span> {t('suppliers.supplierCount')}</p>
                    </div>
                </div>

                {/* Stats Cards with Glass Morphism */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white p-4 rounded-2xl shadow-sm glass">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-cyan-100 text-sm">{t('suppliers.totalSuppliersLabel')}</p>
                                <p className="text-2xl font-bold">{totalSuppliers}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                                <PackageIcon />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-violet-500 to-violet-600 text-white p-4 rounded-2xl shadow-sm glass">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-violet-100 text-sm">{t('suppliers.totalOutstandingLabel')}</p>
                                <p className="text-2xl font-bold">{currencyFormatter.format(totalOutstanding)}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                                <DollarIcon />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white p-4 rounded-2xl shadow-sm glass">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-rose-100 text-sm">{t('suppliers.suppliersByTypeLabel')}</p>
                                <div className="flex gap-4 mt-1">
                                    <span className="text-sm">{t('suppliers.suppliesLabel')}: {materialSuppliers}</span>
                                    <span className="text-sm">{t('suppliers.labsLabel')}: {dentalLabs}</span>
                                </div>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg">
                                <LabIcon />
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Controls Section */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-cyan-100 dark:border-cyan-700 mb-6">
                    <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center">
                        <div className="flex-1 w-full">
                            <div className="relative">
                                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder={t('suppliers.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full ps-10 pl-4 py-2 border border-cyan-200 dark:border-cyan-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200"
                                />
                            </div>
                        </div>
                        <div className="w-full sm:w-auto">
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value as 'ALL' | 'Material Supplier' | 'Dental Lab')}
                                className="w-full sm:w-auto p-2 border border-cyan-200 dark:border-cyan-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200"
                            >
                                <option value="ALL">{t('suppliers.allTypes')}</option>
                                <option value="Material Supplier">{t('supplierType.materialSupplier')}</option>
                                <option value="Dental Lab">{t('supplierType.dentalLab')}</option>
                            </select>
                        </div>
                        <div className="w-full sm:w-auto">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'name' | 'balance' | 'type')}
                                className="w-full sm:w-auto p-2 border border-cyan-200 dark:border-cyan-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200"
                            >
                                <option value="name">{t('suppliers.sortByName')}</option>
                                <option value="balance">{t('suppliers.sortByBalance')}</option>
                                <option value="type">{t('suppliers.sortByType')}</option>
                            </select>
                        </div>
                        <div className="w-full sm:w-auto">
                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="w-full sm:w-auto p-2 border border-cyan-200 dark:border-cyan-600 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/30 focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200"
                            >
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>
                        <button 
                            onClick={resetFilters}
                            className="w-full sm:w-auto justify-center bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center gap-2 text-sm font-medium transition-all duration-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="hidden sm:inline">{t('financialFilters.clearAll')}</span>
                            <span className="sm:hidden">{locale === 'ar' ? 'مسح' : 'Clear'}</span>
                        </button>
                        <button
                            onClick={() => setIsAddSupplierModalOpen(true)}
                            className="w-full sm:w-auto justify-center bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-violet-600 flex items-center gap-2 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-300"
                        >
                            <AddIcon />
                            <span className="hidden sm:inline">{t('suppliers.addSupplier')}</span>
                            <span className="sm:hidden">{locale === 'ar' ? 'إضافة' : 'Add'}</span>
                        </button>
                    </div>
                </div>
                
                {/* Suppliers Grid */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-cyan-100 dark:border-cyan-700 p-4">
                    {suppliers.length === 0 ? (
                        <div className="text-center py-8 animate-fadeIn">
                            <div className="bg-gradient-to-br from-cyan-100 to-violet-100 dark:from-cyan-800 dark:to-violet-800 p-6 rounded-full inline-block mb-4">
                                <PackageIcon />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('suppliers.noSuppliersTitle')}</h3>
                            <p className="text-slate-700 dark:text-slate-300 mb-4">{t('suppliers.noSuppliersDescription')}</p>
                            <button
                                onClick={() => setIsAddSupplierModalOpen(true)}
                                className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-violet-600 focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all duration-200"
                            >
                                <AddIcon /> {t('suppliers.addFirstSupplier')}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {suppliers
                                .filter(s => {
                                    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                              s.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                              s.phone.includes(searchTerm);
                                    const matchesType = selectedType === 'ALL' || s.type === selectedType;
                                    return matchesSearch && matchesType;
                                })
                                .sort((a, b) => {
                                    if (sortBy === 'name') {
                                        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
                                    } else if (sortBy === 'balance') {
                                        const balanceA = clinicData.supplierInvoices.filter(inv => inv.supplierId === a.id).reduce((sum, inv) => sum + inv.amount, 0) -
                                                        clinicData.expenses.filter(exp => exp.supplierId === a.id ||
                                                            clinicData.supplierInvoices.some(inv => inv.supplierId === a.id && inv.payments.some(p => p.expenseId === exp.id)))
                                                            .reduce((sum, exp) => sum + exp.amount, 0);
                                        const balanceB = clinicData.supplierInvoices.filter(inv => inv.supplierId === b.id).reduce((sum, inv) => sum + inv.amount, 0) -
                                                        clinicData.expenses.filter(exp => exp.supplierId === b.id ||
                                                            clinicData.supplierInvoices.some(inv => inv.supplierId === b.id && inv.payments.some(p => p.expenseId === exp.id)))
                                                            .reduce((sum, exp) => sum + exp.amount, 0);
                                        return sortOrder === 'asc' ? balanceA - balanceB : balanceB - balanceA;
                                    } else {
                                        return sortOrder === 'asc' ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type);
                                    }
                                })
                                .map(s => {
                                    // Calculate outstanding balance for this supplier
                                    const supplierInvoices = clinicData.supplierInvoices.filter(inv => inv.supplierId === s.id);
                                    const totalBilled = supplierInvoices.reduce((sum, inv) => sum + inv.amount, 0);
                                    const totalPaid = clinicData.expenses
                                        .filter(exp => exp.supplierId === s.id ||
                                            supplierInvoices.some(inv => inv.payments.some(p => p.expenseId === exp.id)))
                                        .reduce((sum, exp) => sum + exp.amount, 0);
                                    const outstandingBalance = totalBilled - totalPaid;

                                    return (
                                        <div key={s.id} className="bg-white dark:bg-slate-800 border border-cyan-100 dark:border-cyan-700 p-6 rounded-2xl hover:shadow-md hover:border-cyan-200 dark:hover:border-cyan-600 transition-all duration-300 hover:scale-[1.03] animate-fadeIn cursor-pointer group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-gradient-to-br from-cyan-500 to-violet-500 text-white p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                                        {getSupplierTypeIcon(s.type)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors duration-300">
                                                            {s.name}
                                                        </h4>
                                                        <p className="text-xs text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30 px-3 py-1 rounded-full inline-block mt-1">
                                                            {s.type === 'Material Supplier' ? t('supplierType.materialSupplier') : t('supplierType.dentalLab')}
                                                        </p>
                                                    </div>
                                                </div>
                                                {outstandingBalance > 0 && (
                                                    <div className="bg-gradient-to-r from-rose-500 to-rose-600 text-white text-xs font-semibold px-3 py-1 rounded-full group-hover:scale-105 transition-transform duration-300">
                                                        {currencyFormatter.format(outstandingBalance)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-6">
                                                <p className="dark:text-slate-300 flex items-center gap-2">
                                                    <span className="text-cyan-600 dark:text-cyan-400">👤</span>
                                                    <strong>{t('suppliers.contactPerson')}:</strong> {s.contact_person || '-'}
                                                </p>
                                                <p className="dark:text-slate-300 flex items-center gap-2">
                                                    <span className="text-cyan-600 dark:text-cyan-400">📞</span>
                                                    <strong>{t('suppliers.phone')}:</strong> {s.phone || '-'}
                                                </p>
                                                <p className="dark:text-slate-300 flex items-center gap-2">
                                                    <span className="text-cyan-600 dark:text-cyan-400">📧</span>
                                                    <strong>{t('suppliers.email')}:</strong> {s.email || '-'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 border-t border-cyan-100 dark:border-cyan-700 pt-4">
                                                <button
                                                    onClick={() => setViewingSupplier(s)}
                                                    className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:from-cyan-600 hover:to-violet-600 font-semibold px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all duration-300 flex items-center justify-center group-hover:shadow-md"
                                                >
                                                    <EyeIcon />
                                                    <span className="hidden sm:inline">{t('suppliers.viewDetails')}</span>
                                                    <span className="sm:hidden">{locale === 'ar' ? 'عرض' : 'View'}</span>
                                                </button>
                                                <button
                                                    onClick={() => setViewingSupplierReport(s)}
                                                    className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 p-2 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/30 focus:outline-none focus:ring-2 focus:ring-violet-300 transition-all duration-300 group-hover:scale-110"
                                                    aria-label={t('suppliers.viewSupplierReport')}
                                                >
                                                    <PrintIcon />
                                                </button>
                                                <button
                                                    onClick={() => { setEditingSupplier(s); setIsAddSupplierModalOpen(true); }}
                                                    className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 p-2 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/30 focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all duration-300 group-hover:scale-110"
                                                    aria-label={t('suppliers.editSupplierAriaLabel', {name: s.name})}
                                                >
                                                    <EditIcon />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSupplier(s)}
                                                    className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all duration-300 group-hover:scale-110"
                                                    aria-label={t('suppliers.deleteSupplierAriaLabel', {name: s.name})}
                                                >
                                                    <DeleteIcon />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </div>

            {isAddSupplierModalOpen && (
                <AddEditSupplierModal
                    supplier={editingSupplier}
                    onClose={() => { setIsAddSupplierModalOpen(false); setEditingSupplier(undefined); }}
                    onSave={handleSaveSupplier}
                />
            )}

            {viewingSupplier && (
                <SupplierDetailsAndInvoicesModal
                    supplier={viewingSupplier}
                    onClose={() => setViewingSupplier(undefined)}
                    clinicData={clinicData}
                    onDataRefresh={() => setSupplierDataNeedsRefresh(true)}
                />
            )}

            {viewingSupplierReport && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 flex justify-between items-center flex-shrink-0 bg-gradient-to-r from-amber-500 to-amber-600">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <PrintIcon />
                                {t('suppliers.supplierDetailedReport')}
                            </h2>
                            <button
                                onClick={() => setViewingSupplierReport(undefined)}
                                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                                aria-label={t('common.closeForm')}
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <SupplierDetailedReport
                                supplierId={viewingSupplierReport.id}
                                clinicData={clinicData}
                                onClose={() => setViewingSupplierReport(undefined)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
