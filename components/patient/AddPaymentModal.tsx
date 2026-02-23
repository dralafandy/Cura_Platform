import React, { useState } from 'react';
import { Payment, Permission } from '../../types';
import { ClinicData } from '../../hooks/useClinicData';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types';
import { PaymentMethod } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import InvoiceAttachmentUploader from '../finance/InvoiceAttachmentUploader';

// Icons
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const MoneyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V4m0 8v4m-4.003-4l-2.003 2.003m7.007-1.414L14.003 10m-3.414-1.414L9 5.586m4.003 2.828l3.004 3.004M9.879 16.121A3 3 0 1012.004 15H12v2.003V20m0-8c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TreatmentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
const NotesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const ReceiptIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const CashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const MobileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const WalletIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const AlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

interface AddPaymentModalProps {
    patientId: string;
    clinicData: ClinicData;
    onClose: () => void;
    onAdd: (payment: Omit<Payment, 'id'> & { paymentReceiptImageUrl?: string }) => void;
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ patientId, clinicData, onClose, onAdd }) => {
    const { t } = useI18n();
    const { addNotification } = useNotification();
    const { checkPermission } = useAuth();
    const [formData, setFormData] = useState<Omit<Payment, 'id'> & { paymentReceiptImageUrl?: string }>({
        patientId,
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        method: 'Cash',
        notes: '',
        treatmentRecordId: '',
        clinicShare: 0,
        doctorShare: 0,
        userId: '',
        createdAt: '',
        updatedAt: '',
        paymentReceiptImageUrl: '',
    });

    // Calculate financial summary - matching PatientDetailsPanel calculation
    const patientTreatmentRecords = clinicData.treatmentRecords.filter(tr => tr.patientId === patientId);
    const totalTreatmentCosts = patientTreatmentRecords.reduce((sum, tr) => sum + (tr.doctorShare + tr.clinicShare), 0);
    const totalPayments = clinicData.payments.filter(p => p.patientId === patientId).reduce((sum, p) => sum + p.amount, 0);
    const outstandingBalance = totalTreatmentCosts - totalPayments;
    const financialSummary = { totalTreatmentCosts, totalPayments, outstandingBalance };

    // Simple currency formatter
    const formatCurrency = (amount: number): string => {
        return `${amount.toFixed(2)} ج.م`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) : value }));
    };

    const handleQuickAmount = (amount: number) => {
        setFormData(prev => ({ ...prev, amount }));
    };

    const handlePayFullBalance = () => {
        if (financialSummary.outstandingBalance > 0) {
            setFormData(prev => ({ ...prev, amount: financialSummary.outstandingBalance }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Check permission
        if (!checkPermission(Permission.FINANCE_PAYMENT_ADD)) {
            addNotification(t('errors.noPermission') || 'You do not have permission to add payments', NotificationType.ERROR);
            return;
        }
        
        if (formData.amount <= 0) {
            addNotification(t('addPaymentModal.alertPositiveAmount'), NotificationType.ERROR);
            return;
        }
        if (!formData.treatmentRecordId) {
            addNotification('Please select a treatment record', NotificationType.ERROR);
            return;
        }

        // Calculate outstanding balance for the patient - matching PatientDetailsPanel calculation
        const patientTreatmentRecords = clinicData.treatmentRecords.filter(tr => tr.patientId === patientId);
        const totalTreatmentCosts = patientTreatmentRecords.reduce((sum, tr) => sum + (tr.doctorShare + tr.clinicShare), 0);
        const totalPayments = clinicData.payments.filter(p => p.patientId === patientId).reduce((sum, p) => sum + p.amount, 0);
        const outstandingBalance = totalTreatmentCosts - totalPayments;

        // Validate payment doesn't exceed outstanding balance
        if (outstandingBalance <= 0) {
            addNotification('لا يوجد رصيد مستحق لهذا المريض', NotificationType.ERROR);
            return;
        }
        if (formData.amount > outstandingBalance) {
            addNotification(`المبلغ المدخل يتجاوز الرصيد المستحق: ${outstandingBalance.toFixed(2)}`, NotificationType.ERROR);
            return;
        }

        // Calculate shares based on the selected treatment record
        const treatmentRecord = clinicData.treatmentRecords.find(tr => tr.id === formData.treatmentRecordId);
        if (treatmentRecord) {
            const recordTotal = Number(treatmentRecord.doctorShare) + Number(treatmentRecord.clinicShare);
            if (recordTotal > 0) {
                const doctorRatio = Number(treatmentRecord.doctorShare) / recordTotal;
                const doctorShare = formData.amount * doctorRatio;
                const clinicShare = formData.amount - doctorShare;
                formData.clinicShare = clinicShare;
                formData.doctorShare = doctorShare;
            }
        }

        onAdd(formData);
        onClose();
    };

    // Payment method configurations with icons and colors
    const paymentMethodConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
        'Cash': { icon: <CashIcon />, color: 'bg-emerald-500', label: t('paymentMethod.Cash') },
        'Instapay': { icon: <MobileIcon />, color: 'bg-blue-500', label: t('paymentMethod.Instapay') },
        'Vodafone Cash': { icon: <MobileIcon />, color: 'bg-red-500', label: t('paymentMethod.Vodafone Cash') },
        'Other': { icon: <WalletIcon />, color: 'bg-slate-500', label: t('paymentMethod.Other') },
    };

    const allPaymentMethods: PaymentMethod[] = ['Cash', 'Instapay', 'Vodafone Cash', 'Other', 'Discount'];

    // Quick amount presets
    const quickAmounts = [100, 200, 500, 1000, 2000];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <header className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0 bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            <MoneyIcon />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('addPaymentModal.title')}</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600" 
                        aria-label={t('common.closeForm')}
                    >
                        <CloseIcon />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-800/30">
                    {/* Financial Summary Card */}
                    <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-3">
                            <InfoIcon />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">ملخص الحساب المالي</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white dark:bg-slate-700 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">إجمالي الرسوم</p>
                                <p className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(financialSummary.totalTreatmentCosts)}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-700 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">إجمالي المدفوع</p>
                                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(financialSummary.totalPayments)}</p>
                            </div>
                            <div className={`p-3 rounded-xl shadow-sm border ${financialSummary.outstandingBalance > 0 ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800'}`}>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">المتبقي</p>
                                <p className={`text-lg font-bold ${financialSummary.outstandingBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {formatCurrency(Math.abs(financialSummary.outstandingBalance))}
                                </p>
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-3">
                            <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                                    style={{ width: `${Math.min((financialSummary.totalPayments / (financialSummary.totalTreatmentCosts || 1)) * 100, 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                                {Math.round((financialSummary.totalPayments / (financialSummary.totalTreatmentCosts || 1)) * 100)}% تم الدفع
                            </p>
                        </div>
                    </div>

                    <div className="p-5 space-y-5">
                        {/* Amount Section */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                <MoneyIcon />
                                {t('addPaymentModal.amount')}
                            </label>
                            <div className="relative">
                                <input 
                                    id="amount" 
                                    name="amount" 
                                    type="number" 
                                    step="0.01" 
                                    value={formData.amount} 
                                    onChange={handleChange} 
                                    className="p-3 pl-12 border-2 border-slate-200 dark:border-slate-600 rounded-xl w-full focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-lg font-semibold transition-all" 
                                    required 
                                    min="0.01" 
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">ج.م</span>
                            </div>
                            
                            {/* Quick Amount Buttons */}
                            <div className="flex flex-wrap gap-2">
                                {quickAmounts.map(amount => (
                                    <button
                                        key={amount}
                                        type="button"
                                        onClick={() => handleQuickAmount(amount)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                            formData.amount === amount 
                                                ? 'bg-primary text-white shadow-md' 
                                                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                                        }`}
                                    >
                                        {amount}
                                    </button>
                                ))}
                                {financialSummary.outstandingBalance > 0 && (
                                    <button
                                        type="button"
                                        onClick={handlePayFullBalance}
                                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-all duration-200"
                                    >
                                        دفع المبلغ كاملاً ({formatCurrency(financialSummary.outstandingBalance)})
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Payment Method Cards */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                <WalletIcon />
                                {t('addPaymentModal.paymentMethod')}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {allPaymentMethods.filter(method => method !== 'Discount').map(method => (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, method }))}
                                        className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                                            formData.method === method
                                                ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md'
                                                : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg ${paymentMethodConfig[method]?.color || 'bg-slate-500'} text-white`}>
                                            {paymentMethodConfig[method]?.icon || <WalletIcon />}
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                            {paymentMethodConfig[method]?.label || method}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Two Column Layout for Date and Treatment */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Date */}
                            <div className="space-y-2">
                                <label htmlFor="paymentDate" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    <CalendarIcon />
                                    {t('addPaymentModal.paymentDate')}
                                </label>
                                <input 
                                    id="paymentDate" 
                                    name="date" 
                                    type="date" 
                                    value={formData.date} 
                                    onChange={handleChange} 
                                    className="p-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl w-full focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all" 
                                    required 
                                />
                            </div>

                            {/* Treatment Record */}
                            <div className="space-y-2">
                                <label htmlFor="treatmentRecord" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    <TreatmentIcon />
                                    سجل العلاج
                                </label>
                                <select 
                                    id="treatmentRecord" 
                                    name="treatmentRecordId" 
                                    value={formData.treatmentRecordId} 
                                    onChange={handleChange} 
                                    className="p-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl w-full focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all" 
                                    required
                                >
                                    <option value="">اختر سجل علاج</option>
                                    {clinicData.treatmentRecords.filter(tr => tr.patientId === patientId).map(tr => {
                                        const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
                                        const cost = Number(tr.doctorShare) + Number(tr.clinicShare);
                                        return (
                                            <option key={tr.id} value={tr.id}>
                                                {treatmentDef?.name || 'علاج غير معروف'} - {new Date(tr.treatmentDate).toLocaleDateString('ar-EG')} ({formatCurrency(cost)})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <label htmlFor="notes" className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                <NotesIcon />
                                {t('addPaymentModal.notes')}
                            </label>
                            <textarea 
                                id="notes" 
                                name="notes" 
                                value={formData.notes || ''} 
                                onChange={handleChange} 
                                placeholder={t('addPaymentModal.notesPlaceholder')} 
                                className="p-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl w-full h-24 focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 resize-none transition-all" 
                            />
                        </div>

                        {/* Receipt Upload */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                <ReceiptIcon />
                                إرفاق إيصال الدفع
                            </label>
                            <div className="p-4 bg-white dark:bg-slate-700 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
                                <InvoiceAttachmentUploader
                                    initialUrl={formData.paymentReceiptImageUrl}
                                    onUploadComplete={(url) => setFormData(prev => ({ ...prev, paymentReceiptImageUrl: url }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <footer className="p-5 flex justify-end gap-3 flex-shrink-0 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 text-slate-700 dark:text-slate-200 font-medium transition-all duration-200"
                        >
                            {t('common.cancel')}
                        </button>
                        <button 
                            type="submit" 
                            className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-lg shadow-primary/25 font-medium transition-all duration-200 flex items-center gap-2"
                        >
                            <MoneyIcon />
                            {t('addPaymentModal.savePayment')}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default AddPaymentModal;
