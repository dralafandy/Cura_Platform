import React, { useState, useMemo, useEffect } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { Expense, ExpenseCategory, Supplier, SupplierInvoice, SupplierInvoiceStatus, PaymentMethod } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useReportsFilters } from '../../contexts/ReportsFilterContext';
import { usePageView, ViewMode } from '../../contexts/UserPreferencesContext';
import InvoiceAttachmentUploader from './InvoiceAttachmentUploader';

const AddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>;
const ReceiptIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const DollarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>;
const TrendingUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const CountIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const AverageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;

const getCategoryIcon = (category: ExpenseCategory) => {
    switch (category) {
        case ExpenseCategory.RENT: return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
        case ExpenseCategory.SALARIES: return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
        case ExpenseCategory.UTILITIES: return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
        case ExpenseCategory.LAB_FEES: return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
        case ExpenseCategory.SUPPLIES: return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
        default: return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
    }
};

const getPaymentMethodColor = (method?: string) => {
    switch (method) {
        case 'Cash': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
        case 'Instapay': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
        case 'Vodafone Cash': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
        case 'Other': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400';
        default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400';
    }
};

const getCategoryColor = (category: ExpenseCategory) => {
    switch (category) {
        case ExpenseCategory.RENT: return 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400';
        case ExpenseCategory.SALARIES: return 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-400';
        case ExpenseCategory.UTILITIES: return 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400';
        case ExpenseCategory.LAB_FEES: return 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-400';
        case ExpenseCategory.SUPPLIES: return 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-400';
        case ExpenseCategory.MARKETING: return 'bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-700 text-pink-700 dark:text-pink-400';
        case ExpenseCategory.MISC: return 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-400';
        default: return 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-400';
    }
};

const AddEditExpenseModal: React.FC<{
    expense?: Expense;
    onClose: () => void;
    onSave: (expense: Omit<Expense, 'id'> | Expense) => void;
    clinicData: ClinicData;
}> = ({ expense, onClose, onSave, clinicData }) => {
    const { suppliers, supplierInvoices } = clinicData;
    const { t, locale } = useI18n();
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
    const [formData, setFormData] = useState<Omit<Expense, 'id'> | Expense>(
        expense || { date: new Date().toISOString().split('T')[0], description: '', amount: 0, category: ExpenseCategory.MISC, supplierId: undefined, supplierInvoiceId: undefined }
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'amount') {
            const parsedValue = parseFloat(value);
            setFormData({ ...formData, [name]: isNaN(parsedValue) ? 0 : parsedValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Validate amount
        if (formData.amount <= 0) {
            alert('Amount must be greater than 0');
            return;
        }
        const expenseToSave = { ...formData };
        if (expenseToSave.supplierId === '') {
            delete expenseToSave.supplierId;
        }
        if (expenseToSave.supplierInvoiceId === '') {
            delete expenseToSave.supplierInvoiceId;
        }
        onSave(expenseToSave);
        onClose();
    };

    const unpaidInvoicesForSupplier = useMemo(() => {
        if (!formData.supplierId) return [];
        return supplierInvoices.filter(inv => 
            inv.supplierId === formData.supplierId && inv.status === SupplierInvoiceStatus.UNPAID
        );
    }, [formData.supplierId, supplierInvoices]);

    const getInvoiceBalance = (invoice: SupplierInvoice) => {
        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
        return invoice.amount - totalPaid;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <header className="p-6 bg-gradient-to-r from-purple-600 to-purple-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {expense ? (
                            <><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>{t('expenses.editExpense')}</>
                        ) : (
                            <><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>{t('expenses.addNewExpense')}</>
                        )}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50" aria-label={t('common.closeForm')}>
                        <CloseIcon />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label htmlFor="expense-date" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {t('expenses.date')}
                            </label>
                            <input id="expense-date" name="date" type="date" value={formData.date} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200" required />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="expense-description" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                {t('expenses.description')}
                            </label>
                            <textarea id="expense-description" name="description" value={formData.description} onChange={handleChange} placeholder={t('expenses.descriptionPlaceholder')} className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none h-24" required />
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="expense-amount" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                {t('expenses.amount')}
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-400">EGP</span>
                                <input id="expense-amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200" required />
                            </div>
                        </div>

                        <div className="md:col-span-1">
                            <label htmlFor="expense-category" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                {t('expenses.category')}
                            </label>
                            <select id="expense-category" name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200" required>
                                {Object.values(ExpenseCategory).map(cat => <option key={cat} value={cat}>{t(`expenseCategory.${cat}`)}</option>)}
                            </select>
                        </div>

                        <div className="md:col-span-1">
                            <label htmlFor="expense-method" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                {t('addPaymentModal.paymentMethod')}
                            </label>
                            <select id="expense-method" name="method" value={formData.method || 'Cash'} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200" required>
                                {['Cash', 'Instapay', 'Vodafone Cash', 'Other'].map(method => (
                                    <option key={method} value={method}>{t(`paymentMethod.${method}`)}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="expense-supplier" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {t('expenses.selectSupplier')}
                            </label>
                            <select id="expense-supplier" name="supplierId" value={formData.supplierId || ''} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200">
                                <option value="">{t('expenses.noSupplier')}</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        {formData.supplierId && unpaidInvoicesForSupplier.length > 0 && (
                            <div className="md:col-span-2">
                                <label htmlFor="expense-invoice" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-2">
                                    <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    {t('expenses.applyToInvoice')}
                                </label>
                                <select id="expense-invoice" name="supplierInvoiceId" value={formData.supplierInvoiceId || ''} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200">
                                    <option value="">{t('expenses.paymentOnAccount')}</option>
                                    {unpaidInvoicesForSupplier.map(inv => (
                                        <option key={inv.id} value={inv.id}>
                                            {t('invoices.invoice')} #{inv.invoiceNumber || inv.id.slice(-4)} - {t('invoices.remaining')}: {currencyFormatter.format(getInvoiceBalance(inv))}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="md:col-span-2">
                            <label htmlFor="expense-receipt" className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {t('expenses.attachReceipt')}
                            </label>
                            <InvoiceAttachmentUploader
                                initialUrl={formData.expenseReceiptImageUrl}
                                onUploadComplete={(url) => setFormData(prev => ({ ...prev, expenseReceiptImageUrl: url }))}
                            />
                        </div>
                    </div>

                    <footer className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all duration-200 font-medium">
                            {t('common.cancel')}
                        </button>
                        <button type="submit" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 shadow-md hover:shadow-lg font-medium">
                            {t('common.save')}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

const ExpensesManagement: React.FC<{ clinicData: ClinicData }> = ({ clinicData }) => {
    const { expenses, addExpense, updateExpense, deleteExpense, suppliers, supplierInvoices } = clinicData;
    const { t, locale } = useI18n();
    const { filters: reportsFilters, resetFilters, hasActiveFilters } = useReportsFilters();
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'ALL'>('ALL');
    const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [startDate, setStartDate] = useState(reportsFilters.startDate);
    const [endDate, setEndDate] = useState(reportsFilters.endDate);

    // Sync with reports filters when they change
    useEffect(() => {
        setStartDate(reportsFilters.startDate);
        setEndDate(reportsFilters.endDate);
    }, [reportsFilters.startDate, reportsFilters.endDate]);

    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });

    const handleSaveExpense = (expense: Omit<Expense, 'id'> | Expense) => {
        if ('id' in expense && expense.id) {
            updateExpense(expense as Expense);
        } else {
            addExpense(expense as Omit<Expense, 'id'>);
        }
        setEditingExpense(undefined);
    };

    const handleDeleteExpense = (expense: Expense) => {
        if (window.confirm(t('expenses.confirmDelete', { description: expense.description }))) {
            deleteExpense(expense.id);
        }
    };

    const filteredAndSortedExpenses = useMemo(() => {
        let filtered = expenses.filter(e => {
            const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (e.supplierId && suppliers.find(s => s.id === e.supplierId)?.name.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesCategory = selectedCategory === 'ALL' || e.category === selectedCategory;
            
            // Date filtering
            const expenseDate = new Date(e.date);
            const matchesStartDate = !startDate || expenseDate >= new Date(startDate);
            const matchesEndDate = !endDate || expenseDate <= new Date(endDate);
            
            return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate;
        });

        filtered.sort((a, b) => {
            let aValue: any, bValue: any;
            switch (sortBy) {
                case 'date':
                    aValue = new Date(a.date).getTime();
                    bValue = new Date(b.date).getTime();
                    break;
                case 'amount':
                    aValue = a.amount;
                    bValue = b.amount;
                    break;
                case 'description':
                    aValue = a.description.toLowerCase();
                    bValue = b.description.toLowerCase();
                    break;
                default:
                    return 0;
            }
            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    }, [expenses, searchTerm, selectedCategory, sortBy, sortOrder, startDate, endDate, suppliers]);

    const totalExpenses = filteredAndSortedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const expenseCount = filteredAndSortedExpenses.length;
    const averageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Enhanced Header with Gold + Purple Theme */}
                <div className="relative overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-6 mb-6">
                    {/* Decorative gradient bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-purple-500 to-purple-700"></div>
                    
                    <div className="relative z-10">
                        {/* Header Title & Add Button */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">
                                    {t('expenses.clinicExpenses')}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {filteredAndSortedExpenses.length} {t('expenses.expenses')}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-2.5 rounded-xl hover:from-purple-700 hover:to-purple-800 flex items-center gap-2 font-medium transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <AddIcon />
                                <span className="text-sm">{t('expenses.addExpense')}</span>
                            </button>
                        </div>
                        
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Total Amount */}
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-800/30 p-3 rounded-xl border border-purple-200 dark:border-purple-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">{t('expenses.totalAmount')}</span>
                                    <div className="w-7 h-7 rounded-lg bg-purple-500 flex items-center justify-center text-white">
                                        <TrendingUpIcon />
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-purple-900 dark:text-purple-300">{currencyFormatter.format(totalExpenses)}</p>
                            </div>
                            
                            {/* Expense Count */}
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/30 dark:to-amber-800/30 p-3 rounded-xl border border-amber-200 dark:border-amber-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{t('expenses.expenseCount')}</span>
                                    <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-white">
                                        <CountIcon />
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-amber-900 dark:text-amber-300">{expenseCount}</p>
                            </div>
                            
                            {/* Average Expense */}
                            <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-900/30 dark:to-rose-800/30 p-3 rounded-xl border border-rose-200 dark:border-rose-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-rose-600 dark:text-rose-400">{t('expenses.averageExpense')}</span>
                                    <div className="w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center text-white">
                                        <AverageIcon />
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-rose-900 dark:text-rose-300">{currencyFormatter.format(averageExpense)}</p>
                            </div>
                            
                            {/* Today's Expenses */}
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-800/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{t('financialFilters.today')}</span>
                                    <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-emerald-900 dark:text-emerald-300">
                                    {expenses.filter(e => e.date === new Date().toISOString().split('T')[0]).reduce((sum, e) => sum + e.amount, 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            {/* Controls */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex flex-wrap gap-4 mb-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder={t('expenses.searchExpenses')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full ps-10 pl-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200"
                            />
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="flex items-center gap-2 min-w-[260px]">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200 text-sm"
                        />
                        <span className="text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{t('financialFilters.from')} - {t('financialFilters.to')}</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200 text-sm"
                        />
                    </div>

                    {/* Category Filter */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as ExpenseCategory | 'ALL')}
                        className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200"
                    >
                        <option value="ALL">{t('expenses.allCategories')}</option>
                        {Object.values(ExpenseCategory).map(cat => (
                            <option key={cat} value={cat}>{t(`expenseCategory.${cat}`)}</option>
                        ))}
                    </select>

                    {/* Sort */}
                    <div className="flex gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'description')}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200"
                        >
                            <option value="date">{t('expenses.sortByDate')}</option>
                            <option value="amount">{t('expenses.sortByAmount')}</option>
                            <option value="description">{t('expenses.sortByDescription')}</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-600 focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200"
                            title={sortOrder === 'asc' ? t('common.ascending') : t('common.descending')}
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                        <button
                            onClick={resetFilters}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-600 focus:ring-2 focus:ring-red-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all duration-200"
                            title={t('financialFilters.clearAll')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Expenses Grid */}
                {filteredAndSortedExpenses.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-50 to-amber-50 dark:from-purple-900/20 dark:to-amber-900/20 rounded-full flex items-center justify-center border border-purple-100 dark:border-purple-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200 mb-2">{t('expenses.noExpensesFound')}</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">{t('expenses.noExpensesDescription')}</p>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-purple-800 font-medium transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            {t('expenses.addFirstExpense')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredAndSortedExpenses.map(e => {
                            const supplier = e.supplierId ? suppliers.find(s => s.id === e.supplierId) : null;
                            const invoice = e.supplierInvoiceId ? supplierInvoices.find(i => i.id === e.supplierInvoiceId) : null;
                            return (
                                <div 
                                    key={e.id} 
                                    className={`bg-white dark:bg-slate-800 border border-purple-100 dark:border-purple-700 rounded-lg p-4 hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-600 transition-all duration-300 ${e.expenseReceiptImageUrl ? 'cursor-pointer' : ''}`}
                                    onClick={() => {
                                        if (e.expenseReceiptImageUrl) {
                                            window.open(e.expenseReceiptImageUrl, '_blank');
                                        }
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-3" onClick={(evt) => evt.stopPropagation()}>
                                        <div className="flex items-center gap-2">
                                            <span className={`p-2 rounded-lg ${getCategoryColor(e.category)}`}>
                                                {getCategoryIcon(e.category)}
                                            </span>
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getCategoryColor(e.category)}`}>
                                                {t(`expenseCategory.${e.category}`)}
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => { setEditingExpense(e); setIsAddModalOpen(true); }}
                                                className="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                aria-label={t('expenses.editExpenseAriaLabel', {description: e.description})}
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteExpense(e)}
                                                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
                                                aria-label={t('expenses.deleteExpenseAriaLabel', {description: e.description})}
                                            >
                                                <DeleteIcon />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">{e.description}</h3>

                                    <div className="space-y-2 mb-3">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <CalendarIcon />
                                            <span>{dateFormatter.format(new Date(e.date))}</span>
                                        </div>
                                        {supplier && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span>{supplier.name}</span>
                                                {invoice && <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{t('invoices.invoiceNumber')}: {invoice.invoiceNumber || invoice.id.slice(-4)}</span>}
                                            </div>
                                        )}
                                        {e.method && (
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs px-2 py-1 rounded-full ${getPaymentMethodColor(e.method)}`}>
                                                    {t(`paymentMethod.${e.method}`)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-2">
                                            <DollarIcon />
                                            <span className="text-lg font-bold text-purple-700 dark:text-purple-400">{currencyFormatter.format(e.amount)}</span>
                                        </div>
                                        {e.expenseReceiptImageUrl && (
                                            <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {t('expenses.receiptAttached')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {isAddModalOpen && (
                <AddEditExpenseModal
                    expense={editingExpense}
                    onClose={() => { setIsAddModalOpen(false); setEditingExpense(undefined); }}
                    onSave={handleSaveExpense}
                    clinicData={clinicData}
                />
            )}
            </div>
        </div>
    );
};

export default ExpensesManagement;
