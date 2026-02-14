import React, { useState } from 'react';
import { DoctorPayment } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types';
import { useClinicData } from '../../hooks/useClinicData';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;

interface AddDoctorPaymentModalProps {
    dentistId: string;
    onClose: () => void;
    onAdd: (payment: Omit<DoctorPayment, 'id'>) => void;
    doctorPayments: DoctorPayment[];
}

const AddDoctorPaymentModal: React.FC<AddDoctorPaymentModalProps> = ({ dentistId, onClose, onAdd, doctorPayments }) => {
    const { t } = useI18n();
    const { addNotification } = useNotification();
    const { dentists, treatmentRecords } = useClinicData();
    const [formData, setFormData] = useState<Omit<DoctorPayment, 'id'>>({
        dentistId,
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        notes: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.date || !formData.amount) {
            addNotification(t('addDoctorPaymentModal.alertRequiredFields'), NotificationType.ERROR);
            return;
        }

        // Validate positive amount
        if (formData.amount <= 0) {
            addNotification(t('addDoctorPaymentModal.alertPositiveAmount'), NotificationType.ERROR);
            return;
        }

        // Validate date is not empty and not future
        const paymentDate = new Date(formData.date);
        if (isNaN(paymentDate.getTime())) {
            addNotification(t('addDoctorPaymentModal.alertInvalidDate'), NotificationType.ERROR);
            return;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (paymentDate > today) {
            addNotification(t('addDoctorPaymentModal.alertFutureDate'), NotificationType.ERROR);
            return;
        }

        // Validate doctor exists
        const doctor = dentists.find(d => d.id === dentistId);
        if (!doctor) {
            addNotification(t('addDoctorPaymentModal.alertDoctorNotFound'), NotificationType.ERROR);
            return;
        }

        // Calculate outstanding balance for the doctor
        const doctorTreatments = treatmentRecords.filter(tr => tr.dentistId === dentistId);
        const totalEarnings = doctorTreatments.reduce((sum, tr) => sum + tr.doctorShare, 0);
        const totalPayments = doctorPayments.filter(p => p.dentistId === dentistId).reduce((sum, p) => sum + p.amount, 0);
        const outstandingBalance = totalEarnings - totalPayments;

        // Validate payment doesn't exceed outstanding balance
        if (outstandingBalance <= 0) {
            addNotification('لا يوجد رصيد مستحق لهذا الطبيب', NotificationType.ERROR);
            return;
        }
        if (formData.amount > outstandingBalance) {
            addNotification(`المبلغ المدخل يتجاوز الرصيد المستحق: ${outstandingBalance.toFixed(2)}`, NotificationType.ERROR);
            return;
        }

        // Check for duplicate payment
        const isDuplicate = doctorPayments.some(payment =>
            payment.dentistId === dentistId &&
            payment.date === formData.date &&
            payment.amount === formData.amount
        );
        if (isDuplicate) {
            addNotification(t('addDoctorPaymentModal.alertDuplicatePayment'), NotificationType.ERROR);
            return;
        }

        onAdd(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
                <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-700">{t('addDoctorPaymentModal.title')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" aria-label={t('common.closeForm')}>
                        <CloseIcon />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
                    <div>
                        <label htmlFor="paymentDate" className="block text-sm font-medium text-slate-600 mb-1">{t('addDoctorPaymentModal.paymentDate')}</label>
                        <input id="paymentDate" name="date" type="date" value={formData.date} onChange={handleChange} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required />
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-slate-600 mb-1">{t('addDoctorPaymentModal.amount')}</label>
                        <input id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} className="p-2 border border-slate-300 rounded-lg w-full focus:ring-primary focus:border-primary" required min="0.01" />
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-slate-600 mb-1">{t('addDoctorPaymentModal.notes')}</label>
                        <textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleChange} placeholder={t('addDoctorPaymentModal.notesPlaceholder')} className="p-2 border border-slate-300 rounded-lg w-full h-20 focus:ring-primary focus:border-primary" />
                    </div>
                    <footer className="pt-2 flex justify-end space-x-4 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-neutral-dark rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300">{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light">{t('addDoctorPaymentModal.savePayment')}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default AddDoctorPaymentModal;