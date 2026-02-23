import React, { useState, useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { TreatmentRecord } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { NotificationType } from '../../types';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;

interface EditTreatmentRecordModalProps {
    record: TreatmentRecord;
    onClose: () => void;
    onUpdate: (updatedRecord: TreatmentRecord) => void;
    clinicData: ClinicData;
}

const EditTreatmentRecordModal: React.FC<EditTreatmentRecordModalProps> = ({
    record,
    onClose,
    onUpdate,
    clinicData
}) => {
    const { t, locale } = useI18n();
    const { addNotification } = useNotification();
    const { treatmentDefinitions } = clinicData;

    const [customPrice, setCustomPrice] = useState<number>(record.totalTreatmentCost || 0);

    const treatmentDef = useMemo(() => {
        return treatmentDefinitions.find(td => td.id === record.treatmentDefinitionId);
    }, [record.treatmentDefinitionId, treatmentDefinitions]);

    const calculatedShares = useMemo(() => {
        if (!treatmentDef) return { doctorShare: 0, clinicShare: 0 };

        const basePrice = customPrice;
        const effectivePercentages = clinicData.getTreatmentPercentages(record.treatmentDefinitionId, record.dentistId);
        const doctorShare = basePrice * effectivePercentages.doctorPercentage;
        const clinicShare = basePrice * effectivePercentages.clinicPercentage;

        return { doctorShare, clinicShare };
    }, [customPrice, treatmentDef, clinicData, record.treatmentDefinitionId, record.dentistId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (customPrice <= 0) {
            addNotification(t('editTreatmentRecord.priceMustBePositive'), NotificationType.ERROR);
            return;
        }

        const updatedRecord: TreatmentRecord = {
            ...record,
            doctorShare: calculatedShares.doctorShare,
            clinicShare: calculatedShares.clinicShare,
            totalTreatmentCost: calculatedShares.doctorShare + calculatedShares.clinicShare,
        };

        onUpdate(updatedRecord);
        addNotification(t('editTreatmentRecord.priceUpdated'), NotificationType.SUCCESS);
        onClose();
    };

    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700">
                <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0 bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="text-xl font-bold text-slate-700 dark:text-white">{t('editTreatmentRecord.title')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 text-slate-500 dark:text-slate-300" aria-label={t('common.closeForm')}>
                        <CloseIcon />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 bg-slate-50 dark:bg-slate-800/30">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                            {t('editTreatmentRecord.treatmentName')}
                        </label>
                        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{treatmentDef?.name || t('common.unknownTreatment')}</p>
                    </div>

                    <div>
                        <label htmlFor="customPrice" className="block text-sm font-medium text-slate-600 dark:text-slate-300">
                            {t('editTreatmentRecord.customPrice')}
                        </label>
                        <input
                            id="customPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                            className="mt-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg w-full focus:ring-primary focus:border-primary bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                            required
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {t('editTreatmentRecord.originalPrice')}: {currencyFormatter.format(treatmentDef?.basePrice || 0)}
                        </p>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 p-4 rounded-lg space-y-2">
                        <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200">{t('editTreatmentRecord.updatedShares')}</h3>
                        <p className="text-sm text-slate-700 dark:text-slate-300"><strong>{t('addTreatmentRecord.doctorShare')}:</strong> {currencyFormatter.format(calculatedShares.doctorShare)}</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300"><strong>{t('addTreatmentRecord.clinicShare')}:</strong> {currencyFormatter.format(calculatedShares.clinicShare)}</p>
                    </div>

                    <footer className="flex justify-end space-x-4 flex-shrink-0 border-t border-slate-200 dark:border-slate-700 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 text-slate-700 dark:text-slate-200">
                            {t('common.cancel')}
                        </button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light shadow-md">
                            {t('editTreatmentRecord.saveChanges')}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default EditTreatmentRecordModal;
