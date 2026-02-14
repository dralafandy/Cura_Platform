import React from 'react';
import { Prescription, PrescriptionItem, Patient, Dentist } from '../../types';
import { useI18n } from '../../hooks/useI18n';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

interface DeletePrescriptionConfirmationModalProps {
    prescription: Prescription;
    patient: Patient;
    prescriptionItems: PrescriptionItem[];
    dentist?: Dentist;
    onConfirm: () => void;
    onCancel: () => void;
}

const DeletePrescriptionConfirmationModal: React.FC<DeletePrescriptionConfirmationModalProps> = ({ 
    prescription, 
    patient, 
    prescriptionItems, 
    dentist, 
    onConfirm, 
    onCancel 
}) => {
    const { t, locale } = useI18n();
    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    
    const items = prescriptionItems.filter(item => item.prescriptionId === prescription.id);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/60 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg">
                <header className="p-4 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-700 dark:text-white">{t('prescriptionDelete.confirmTitle')}</h2>
                    <button 
                        onClick={onCancel} 
                        className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                        aria-label={t('common.closeForm')}
                    >
                        <CloseIcon />
                    </button>
                </header>
                <div className="p-6 space-y-4">
                    <p className="text-slate-700 dark:text-slate-300">{t('prescriptionDelete.confirmMessage')}</p>
                    <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-2">
                            {t('prescriptionDelete.prescriptionInfo')}
                        </p>
                        <p className="text-sm text-red-800 dark:text-red-300">
                            <strong>{t('prescriptionList.patient')}:</strong> {patient.name}
                        </p>
                        <p className="text-sm text-red-800 dark:text-red-300">
                            <strong>{t('prescriptionList.doctor')}:</strong> {dentist?.name || t('common.unknownDentist')}
                        </p>
                        <p className="text-sm text-red-800 dark:text-red-300">
                            <strong>{t('prescriptionDetails.date')}:</strong> {dateFormatter.format(new Date(prescription.prescriptionDate))}
                        </p>
                        <p className="text-sm text-red-800 dark:text-red-300">
                            <strong>{t('prescriptionList.items')}:</strong> {items.length}
                        </p>
                        
                        {items.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-2">
                                    {t('prescriptionDelete.medicationsToDelete')}:
                                </p>
                                <ul className="list-disc list-inside text-sm text-red-800 dark:text-red-300 space-y-1">
                                    {items.map((item, index) => (
                                        <li key={item.id}>{item.medicationName}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end space-x-4 gap-3">
                        <button 
                            onClick={onCancel} 
                            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button 
                            onClick={onConfirm} 
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                        >
                            {t('common.delete')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeletePrescriptionConfirmationModal;
