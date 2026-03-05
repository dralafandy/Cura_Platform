import React from 'react';
import { TreatmentRecord } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useClinicData } from '../../hooks/useClinicData';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;

interface DeleteTreatmentRecordConfirmationModalProps {
    record: TreatmentRecord;
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteTreatmentRecordConfirmationModal: React.FC<DeleteTreatmentRecordConfirmationModalProps> = ({ record, onConfirm, onCancel }) => {
    const { t } = useI18n();
    const { treatmentDefinitions, payments, doctorPayments } = useClinicData();
    
    const treatmentDef = treatmentDefinitions.find(td => td.id === record.treatmentDefinitionId);
    const dateFormatter = new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Find associated payments
    const associatedPayments = payments.filter(p => p.treatmentRecordId === record.id);

    // Find unique doctor payments related to this treatment record
    // Create a map to track unique doctor payments by ID
    const uniqueDoctorPayments = new Map<string, typeof doctorPayments[0]>();
    
    doctorPayments.forEach(dp => {
        // Only include payments for this dentist
        if (dp.dentistId !== record.dentistId) return;
        
        // Skip if already added
        if (uniqueDoctorPayments.has(dp.id)) return;
        
        // Check if this doctor payment matches any of the treatment's payment doctor shares
        const isRelated = associatedPayments.some(p => 
            Math.abs(dp.amount - p.doctorShare) < 0.01
        );
        
        if (isRelated) {
            uniqueDoctorPayments.set(dp.id, dp);
        }
    });
    
    const associatedDoctorPayments = Array.from(uniqueDoctorPayments.values());



    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg">
                <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-100">{t('treatmentDelete.confirmTitle')}</h2>
                    <button onClick={onCancel} className="p-1 rounded-full text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600" aria-label={t('common.closeForm')}>
                        <CloseIcon />
                    </button>
                </header>
                <div className="p-6 space-y-4">
                    <p className="text-slate-700 dark:text-slate-200">{t('treatmentDelete.confirmMessage')}</p>
                    <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-800 dark:text-red-300 font-medium">{treatmentDef?.name || t('common.unknownTreatment')}</p>
                        <p className="text-sm text-red-800 dark:text-red-300">{dateFormatter.format(new Date(record.treatmentDate))}</p>
                        <p className="text-sm text-red-800 dark:text-red-300 font-medium mt-2">{t('treatmentDelete.financialImpact')}</p>
                        <p className="text-sm text-red-800 dark:text-red-300">{t('treatmentDelete.doctorShareImpact').replace('{amount}', record.doctorShare.toFixed(2))}</p>
                        <p className="text-sm text-red-800 dark:text-red-300">{t('treatmentDelete.clinicShareImpact').replace('{amount}', record.clinicShare.toFixed(2))}</p>
                        
                        {associatedPayments.length > 0 && (
                            <div className="mt-3">
                                <p className="text-sm text-red-800 dark:text-red-300 font-medium">{t('treatmentDelete.associatedPayments')} ({associatedPayments.length})</p>
                                {associatedPayments.map(payment => (
                                    <p key={payment.id} className="text-sm text-red-800 dark:text-red-300 ml-2">
                                        {t('treatmentDelete.paymentAmount').replace('{amount}', payment.amount.toFixed(2))} - {t(`paymentMethod.${payment.method}`)}
                                    </p>
                                ))}
                            </div>
                        )}

                        {associatedPayments.length > 0 && (
                            <div className="mt-3">
                                <p className="text-sm text-red-800 dark:text-red-300 font-medium">{t('treatmentDelete.associatedClinicPayments')} ({associatedPayments.length})</p>
                                {associatedPayments.map(payment => (
                                    <p key={payment.id} className="text-sm text-red-800 dark:text-red-300 ml-2">
                                        {t('treatmentDelete.clinicShareAmount').replace('{amount}', payment.clinicShare.toFixed(2))} - {t(`paymentMethod.${payment.method}`)}
                                    </p>
                                ))}
                            </div>
                        )}

                        {associatedDoctorPayments.length > 0 && (
                            <div className="mt-3">
                                <p className="text-sm text-red-800 dark:text-red-300 font-medium">{t('treatmentDelete.associatedDoctorPayments')} ({associatedDoctorPayments.length})</p>
                                {associatedDoctorPayments.map(doctorPayment => (
                                    <p key={doctorPayment.id} className="text-sm text-red-800 dark:text-red-300 ml-2">
                                        {t('treatmentDelete.paymentAmount').replace('{amount}', doctorPayment.amount.toFixed(2))}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600">
                            {t('common.cancel')}
                        </button>
                        <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                            {t('common.delete')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteTreatmentRecordConfirmationModal;
