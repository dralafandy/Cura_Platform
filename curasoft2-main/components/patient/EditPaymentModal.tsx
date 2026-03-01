import React, { useState, useEffect } from 'react';
import { Payment } from '../../types';
import { ClinicData } from '../../hooks/useClinicData';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types';
import { PaymentMethod } from '../../types';
import InvoiceAttachmentUploader from '../finance/InvoiceAttachmentUploader';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;

interface EditPaymentModalProps {
    patientId: string;
    payment: Payment;
    clinicData: ClinicData;
    onClose: () => void;
    onUpdate: (payment: Payment & { paymentReceiptImageUrl?: string }) => void;
}

const EditPaymentModal: React.FC<EditPaymentModalProps> = ({ patientId, payment, clinicData, onClose, onUpdate }) => {
    const { t } = useI18n();
    const { addNotification } = useNotification();
    const [formData, setFormData] = useState<Payment & { paymentReceiptImageUrl?: string }>(payment);
    const [originalAmount, setOriginalAmount] = useState(payment.amount);

    useEffect(() => {
        setFormData(payment);
        setOriginalAmount(payment.amount);
    }, [payment]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const newValue = name === 'amount' ? parseFloat(value) : value;
        setFormData(prev => ({ ...prev, [name]: newValue }));

        // Recalculate shares if amount changed
        if (name === 'amount' && parseFloat(newValue as string) !== originalAmount) {
            const treatmentRecord = clinicData.treatmentRecords.find(tr => tr.id === payment.treatmentRecordId);
            if (treatmentRecord) {
                const recordTotal = Number(treatmentRecord.doctorShare) + Number(treatmentRecord.clinicShare);
                if (recordTotal > 0) {
                    const amountValue = parseFloat(newValue as string);
                    const doctorRatio = Number(treatmentRecord.doctorShare) / recordTotal;
                    const doctorShare = amountValue * doctorRatio;
                    const clinicShare = amountValue - doctorShare;
                    setFormData(prev => ({ ...prev, clinicShare, doctorShare }));
                }
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.amount <= 0) {
            addNotification(t('addPaymentModal.alertPositiveAmount'), NotificationType.ERROR);
            return;
        }

        // TODO: Add validation for closed periods - prevent editing if payment date is in closed accounting period
        // TODO: Add validation for dependencies - check if payment is referenced by financial reports

        // Calculate outstanding balance for the patient (excluding current payment)
        const patientTreatmentRecords = clinicData.treatmentRecords.filter(tr => tr.patientId === patientId);
        const totalTreatmentCosts = patientTreatmentRecords.reduce((sum, tr) => sum + (Number(tr.doctorShare) + Number(tr.clinicShare)), 0);
        const totalPayments = clinicData.payments.filter(p => p.patientId === patientId && p.id !== payment.id).reduce((sum, p) => sum + p.amount, 0);
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

        onUpdate(formData);
        onClose();
    };

    // Fix: Create a constant array from the PaymentMethod union type to iterate over its values
    const allPaymentMethods: PaymentMethod[] = ['Cash', 'Instapay', 'Vodafone Cash', 'Other', 'Discount'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700">
                <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0 bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="text-xl font-bold text-slate-700 dark:text-white">{t('paymentEdit.title')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600" aria-label={t('common.closeForm')}>
                        <CloseIcon />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50 dark:bg-slate-800/30">
                    <div>
                        <label htmlFor="paymentDate" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('addPaymentModal.paymentDate')}</label>
                        <input id="paymentDate" name="date" type="date" value={formData.date} onChange={handleChange} className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg w-full focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200" required />
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('addPaymentModal.amount')}</label>
                        <input id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg w-full focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200" required min="0.01" />
                        {formData.amount !== originalAmount && (
                            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">{t('paymentEdit.amountChanged')}</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="treatmentRecord" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Treatment Record</label>
                        <select id="treatmentRecord" name="treatmentRecordId" value={formData.treatmentRecordId} disabled className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg w-full bg-slate-100 dark:bg-slate-700 cursor-not-allowed text-slate-500 dark:text-slate-400">
                            {clinicData.treatmentRecords.filter(tr => tr.patientId === patientId).map(tr => {
                                const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
                                return (
                                    <option key={tr.id} value={tr.id}>
                                        {treatmentDef?.name || 'Unknown Treatment'} - {new Date(tr.treatmentDate).toLocaleDateString()}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('addPaymentModal.paymentMethod')}</label>
                        <select id="paymentMethod" name="method" value={formData.method} onChange={handleChange} className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg w-full focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200" required>
                            {/* Fix: Iterate over the 'allPaymentMethods' array, but allow the current method even if it's 'Discount' */}
                            {allPaymentMethods.filter(method => method !== 'Discount' || method === formData.method).map(method => (
                                <option key={method} value={method}>{t(`paymentMethod.${method}`)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{t('addPaymentModal.notes')}</label>
                        <textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleChange} placeholder={t('addPaymentModal.notesPlaceholder')} className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg w-full h-20 focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">إرفاق إيصال الدفع</label>
                        <InvoiceAttachmentUploader
                            initialUrl={formData.paymentReceiptImageUrl}
                            onUploadComplete={(url) => setFormData(prev => ({ ...prev, paymentReceiptImageUrl: url }))}
                        />
                    </div>
                    <footer className="pt-2 flex justify-end space-x-4 flex-shrink-0 border-t border-slate-200 dark:border-slate-700 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 text-slate-700 dark:text-slate-200">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600 shadow-md">{t('paymentEdit.saveChanges')}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default EditPaymentModal;
