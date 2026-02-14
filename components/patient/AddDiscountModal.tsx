import React, { useState, useEffect } from 'react';
import { Payment, TreatmentRecord } from '../../types';
import { ClinicData } from '../../hooks/useClinicData';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types';


// Icons as simple SVG components
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const DiscountIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
);

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const CalculatorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

interface AddDiscountModalProps {
    patientId: string;
    clinicData: ClinicData;
    onClose: () => void;
    onAdd?: (payment: Omit<Payment, 'id'>) => void;
    onUpdateTreatmentRecord?: (patientId: string, record: TreatmentRecord) => Promise<void>;
}


const AddDiscountModal: React.FC<AddDiscountModalProps> = ({ patientId, clinicData, onClose, onAdd, onUpdateTreatmentRecord }) => {

    const { t, locale } = useI18n();

    const { addNotification } = useNotification();
    const [isAnimating, setIsAnimating] = useState(false);
    const [formData, setFormData] = useState({
        notes: '',
    });
    const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
    const [percentage, setPercentage] = useState<number>(0);
    const [fixedAmount, setFixedAmount] = useState<number>(0);
    const [selectedTreatmentRecordId, setSelectedTreatmentRecordId] = useState<string>('');
    const [approvalPassword, setApprovalPassword] = useState('');
    const [calculatedAmount, setCalculatedAmount] = useState<number>(0);

    const isRTL = locale === 'ar';


    // Animation on mount
    useEffect(() => {
        setIsAnimating(true);
    }, []);

    // Calculate estimated discount amount
    useEffect(() => {
        if (!selectedTreatmentRecordId) {
            setCalculatedAmount(0);
            return;
        }
        const selectedTreatment = clinicData.treatmentRecords.find(tr => tr.id === selectedTreatmentRecordId);
        if (!selectedTreatment) {
            setCalculatedAmount(0);
            return;
        }
        
        const treatmentCost = selectedTreatment.doctorShare + selectedTreatment.clinicShare;
        
        if (discountType === 'fixed') {
            setCalculatedAmount(fixedAmount);
        } else {
            setCalculatedAmount(treatmentCost * (percentage / 100));
        }
    }, [selectedTreatmentRecordId, discountType, fixedAmount, percentage, clinicData.treatmentRecords]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'amount') {
            setFixedAmount(parseFloat(value) || 0);
        } else if (name === 'percentage') {
            setPercentage(parseFloat(value) || 0);
        } else if (name === 'approvalPassword') {
            setApprovalPassword(value);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleClose = () => {
        setIsAnimating(false);
        setTimeout(onClose, 200);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Get the selected treatment
        const selectedTreatment = clinicData.treatmentRecords.find(tr => tr.id === selectedTreatmentRecordId);
        if (!selectedTreatment) {
            addNotification({ message: 'Treatment not found', type: NotificationType.ERROR });
            return;
        }

        // Calculate discount amount based on type
        const treatmentCost = selectedTreatment.doctorShare + selectedTreatment.clinicShare;
        let discountAmount = 0;
        if (discountType === 'fixed') {
            discountAmount = fixedAmount;
        } else {
            discountAmount = treatmentCost * (percentage / 100);
        }

        if (discountAmount <= 0) {
            addNotification({ message: t('addPaymentModal.alertPositiveAmount'), type: NotificationType.WARNING });
            return;
        }

        if (discountAmount > treatmentCost) {
            addNotification({ message: `مبلغ الخصم يتجاوز سعر العلاج: ${treatmentCost.toFixed(2)}`, type: NotificationType.ERROR });
            return;
        }

        // Simple hardcoded password for discount approval
        if (approvalPassword !== '123') {
            addNotification({ message: t('addDiscountModal.passwordIncorrect'), type: NotificationType.ERROR });
            return;
        }

        // Distribute discount proportionally based on shares
        const treatmentTotal = selectedTreatment.doctorShare + selectedTreatment.clinicShare;
        const doctorDiscount = discountAmount * (selectedTreatment.doctorShare / treatmentTotal);
        const clinicDiscount = discountAmount - doctorDiscount;

        // Update the treatment record with new shares
        const newDoctorShare = selectedTreatment.doctorShare - doctorDiscount;
        const newClinicShare = selectedTreatment.clinicShare - clinicDiscount;
        const newTotalCost = newDoctorShare + newClinicShare;

        const updatedTreatmentRecord: TreatmentRecord = {
            ...selectedTreatment,
            doctorShare: newDoctorShare,
            clinicShare: newClinicShare,
            totalTreatmentCost: newTotalCost,
            notes: formData.notes ? `${selectedTreatment.notes}\nخصم: ${discountAmount.toFixed(2)} ج.م - ${formData.notes}`.trim() : `خصم: ${discountAmount.toFixed(2)} ج.م`,
        };

        // Update treatment record if callback is provided
        if (onUpdateTreatmentRecord) {
            await onUpdateTreatmentRecord(patientId, updatedTreatmentRecord);
        }

        // Add notification instead of creating a payment
        addNotification({ message: `تم تطبيق خصم بقيمة ${discountAmount.toFixed(2)} ج.م بنجاح`, type: NotificationType.SUCCESS });
        
        handleClose();
    };


    // Get patient treatment records for the dropdown
    const patientTreatments = clinicData.treatmentRecords.filter(tr => tr.patientId === patientId);

    return (
        <div 
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
            aria-modal="true" 
            role="dialog"
            onClick={handleClose}
        >
            <div 
                className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col transform transition-all duration-200 ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <header className={`flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-xl">
                            <DiscountIcon />
                        </div>
                        <div className="text-center">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('addDiscountModal.title')}</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">تعديل سعر العلاج فقط</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleClose} 
                        className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-500 dark:text-slate-400"
                        aria-label={t('common.closeForm')}
                    >
                        <CloseIcon />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className={`p-5 overflow-y-auto flex-1 space-y-5 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {/* Treatment Selection */}
                    <div className="space-y-2">
                        <label htmlFor="treatmentRecord" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                            {t('addDiscountModal.selectTreatment')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                id="treatmentRecord"
                                value={selectedTreatmentRecordId}
                                onChange={(e) => setSelectedTreatmentRecordId(e.target.value)}
                                className={`w-full p-3 ${isRTL ? 'pr-4 pl-10' : 'pl-4 pr-10'} bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary dark:focus:border-primary text-slate-800 dark:text-white transition-all duration-200 appearance-none cursor-pointer`}
                                required
                            >
                                <option value="" className="text-slate-500">{t('addDiscountModal.selectTreatmentPlaceholder')}</option>
                                {patientTreatments.map(tr => {
                                    const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId);
                                    const dentist = clinicData.dentists.find(d => d.id === tr.dentistId);
                                    const currentCost = tr.doctorShare + tr.clinicShare;
                                    return (
                                        <option key={tr.id} value={tr.id} className="text-slate-800">
                                            {treatmentDef?.name || 'Unknown Treatment'} - {currentCost.toFixed(2)} ج.م ({dentist?.name || 'Unknown Doctor'})
                                        </option>
                                    );
                                })}
                            </select>
                            <div className={`absolute inset-y-0 ${isRTL ? 'left-0' : 'right-0'} flex items-center ${isRTL ? 'pl-3 pr-3' : 'pr-3'} pointer-events-none text-slate-400 dark:text-slate-500`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRTL ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Discount Type Selection */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                            {t('addDiscountModal.discountType')} <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className={`relative flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                discountType === 'fixed' 
                                    ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary' 
                                    : 'border-slate-200 dark:border-slate-600 hover:border-primary/50 dark:hover:border-primary/50 text-slate-600 dark:text-slate-300'
                            }`}>
                                <input
                                    type="radio"
                                    name="discountType"
                                    value="fixed"
                                    checked={discountType === 'fixed'}
                                    onChange={() => setDiscountType('fixed')}
                                    className="sr-only"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium text-sm">{t('addDiscountModal.fixedAmount')}</span>
                                {discountType === 'fixed' && (
                                    <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} w-5 h-5 bg-primary rounded-full flex items-center justify-center`}>
                                        <CheckIcon />
                                    </div>
                                )}
                            </label>
                            <label className={`relative flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                discountType === 'percentage' 
                                    ? 'border-primary bg-primary/5 dark:bg-primary/10 text-primary' 
                                    : 'border-slate-200 dark:border-slate-600 hover:border-primary/50 dark:hover:border-primary/50 text-slate-600 dark:text-slate-300'
                            }`}>
                                <input
                                    type="radio"
                                    name="discountType"
                                    value="percentage"
                                    checked={discountType === 'percentage'}
                                    onChange={() => setDiscountType('percentage')}
                                    className="sr-only"
                                />
                                <CalculatorIcon />
                                <span className="font-medium text-sm">{t('addDiscountModal.percentage')}</span>
                                {discountType === 'percentage' && (
                                    <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} w-5 h-5 bg-primary rounded-full flex items-center justify-center`}>
                                        <CheckIcon />
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Amount Input */}
                    {discountType === 'fixed' ? (
                        <div className="space-y-2">
                            <label htmlFor="discountAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                {t('addDiscountModal.amount')} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} text-slate-500 dark:text-slate-400 font-medium`}>ج.م</span>
                                <input 
                                    id="discountAmount" 
                                    name="amount" 
                                    type="number" 
                                    step="0.01" 
                                    value={fixedAmount} 
                                    onChange={handleChange} 
                                    className={`w-full p-3 ${isRTL ? 'pr-16 pl-4' : 'pl-16 pr-4'} bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary dark:focus:border-primary text-slate-800 dark:text-white text-lg font-semibold transition-all duration-200 placeholder-slate-400`}
                                    placeholder="0.00"
                                    required 
                                    min="0.01" 
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label htmlFor="discountPercentage" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                {t('addDiscountModal.percentage')} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input 
                                    id="discountPercentage" 
                                    name="percentage" 
                                    type="number" 
                                    step="0.01" 
                                    value={percentage} 
                                    onChange={handleChange} 
                                    className={`w-full p-3 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-10'} bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary dark:focus:border-primary text-slate-800 dark:text-white text-lg font-semibold transition-all duration-200 placeholder-slate-400`}
                                    placeholder="0"
                                    required 
                                    min="0.01" 
                                    max="100" 
                                />
                                <span className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-4' : 'right-4'} text-slate-500 dark:text-slate-400 font-bold text-lg`}>%</span>
                            </div>
                        </div>
                    )}

                    {/* Calculated Amount Display */}
                    {selectedTreatmentRecordId && calculatedAmount > 0 && (
                        <div className={`flex items-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                            calculatedAmount > 0 
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                                : 'bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600'
                        }`}>
                            <div className={`flex items-center gap-2 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <CalculatorIcon />
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                    قيمة الخصم:
                                </span>
                            </div>
                            <span className={`font-bold ${calculatedAmount > 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                {calculatedAmount.toFixed(2)} ج.م
                            </span>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                        <label htmlFor="discountNotes" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                            سبب الخصم (ملاحظة)
                        </label>
                            <textarea 
                            id="notes" 
                            name="notes" 
                            value={formData.notes || ''} 
                            onChange={handleChange} 
                            placeholder="اكتب سبب الخصم..."
                            className={`w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary dark:focus:border-primary text-slate-800 dark:text-white transition-all duration-200 placeholder-slate-400 resize-none h-24`}
                        />
                    </div>

                    {/* Approval Password */}
                    <div className="space-y-2">
                        <label htmlFor="approvalPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <LockIcon />
                                {t('addDiscountModal.password')} <span className="text-red-500">*</span>
                            </div>
                        </label>
                        <input 
                            id="approvalPassword" 
                            name="approvalPassword" 
                            type="password" 
                            value={approvalPassword} 
                            onChange={handleChange} 
                            placeholder={t('addDiscountModal.passwordPlaceholder')}
                            className="w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary dark:focus:border-primary text-slate-800 dark:text-white transition-all duration-200 placeholder-slate-400"
                            required 
                        />
                    </div>

                    {/* Footer */}
                    <footer className={`flex gap-3 pt-2 flex-shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <button 
                            type="button" 
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-500 transition-all duration-200"
                        >
                            {t('common.cancel')}
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 px-4 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 shadow-lg shadow-primary/25"
                        >
                            {t('addDiscountModal.saveDiscount')}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default AddDiscountModal;
