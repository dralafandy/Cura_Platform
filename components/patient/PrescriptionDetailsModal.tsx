import React, { useState, useRef } from 'react';
import { Prescription, PrescriptionItem, Patient, Dentist } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useClinicData } from '../../hooks/useClinicData';
import { openPrintWindow } from '../../utils/print';
import PrintablePrescription from './PrintablePrescription';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 hover:text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 hover:text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const PrintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 hover:text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 hover:text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;

const WhatsAppIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.062 17.498a9.423 9.423 0 0 1-4.71-1.392l-5.13.84 1.09-4.992a9.423 9.423 0 0 1-1.282-5.024C2.03 3.018 6.54-1.5 12 .002c5.46 1.5 8.97 7.018 7.47 12.478a9.423 9.423 0 0 1-7.408 5.02z"/>
    </svg>
);

interface PrescriptionDetailsModalProps {
    prescription: Prescription;
    patient: Patient;
    prescriptions: Prescription[];
    prescriptionItems: PrescriptionItem[];
    dentists: Dentist[];
    clinicInfo: any;
    clinicData?: {
        whatsappPrescriptionTemplate: string;
    };
    onClose: () => void;
    onUpdate?: (prescription: Prescription) => void;
    onDelete?: () => void;
}


const PrescriptionDetailsModal: React.FC<PrescriptionDetailsModalProps> = ({ prescription, patient, prescriptions, prescriptionItems, dentists, clinicInfo, clinicData, onClose, onUpdate, onDelete }) => {
    const { t, locale } = useI18n();
    const contentRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

    // Default template if not provided
    const defaultTemplate = `الروشتة الطبية

المريض: {patientName}
التاريخ: {date}
الدكتور: {dentist}

الأدوية:
{medications}

العيادة: {clinicName}`;
    const template = clinicData?.whatsappPrescriptionTemplate || defaultTemplate;

    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });

    const dentist = dentists.find(d => d.id === prescription.dentistId);
    const items = prescriptionItems.filter(item => item.prescriptionId === prescription.id);

    const handlePrint = () => {
        if (!dentist) return;
        const title = `${t('prescriptionDetails.title')} - ${patient.name}`;
        openPrintWindow(
            title,
            <PrintablePrescription
                prescription={prescription}
                patient={patient}
                prescriptionItems={items}
                dentist={dentist}
                clinicInfo={clinicInfo}
            />
        );
    };

    const handleWhatsAppShare = async () => {
        if (!patient.phone) {
            alert(t('patientList.noPhoneError') || 'No phone number available for this patient');
            return;
        }

        setIsSharing(true);

        try {
            // Format the message using the template
            const medicationsList = items.map(item => 
                `- ${item.medicationName}${item.dosage ? ` (${item.dosage})` : ''} - ${t('prescriptionDetails.quantity')}: ${item.quantity}${item.instructions ? ` - ${item.instructions}` : ''}`
            ).join('\n');

            let message = template
                .replace(/\{patientName\}/g, patient.name)
                .replace(/\{date\}/g, dateFormatter.format(new Date(prescription.prescriptionDate)))
                .replace(/\{dentist\}/g, dentist?.name || '')
                .replace(/\{medications\}/g, medicationsList || t('prescriptionDetails.noMedications'))
                .replace(/\{clinicName\}/g, clinicInfo?.name || '');

            // Clean phone number
            let phoneNumber = patient.phone.replace(/[^0-9]/g, '');
            
            // Add country code if not present (assume Egypt +20)
            if (!phoneNumber.startsWith('20') && phoneNumber.length <= 10) {
                phoneNumber = '20' + phoneNumber;
            }

            // Create WhatsApp URL
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            
            // Open WhatsApp in new tab
            window.open(whatsappUrl, '_blank');

        } catch (error) {
            console.error('Error sharing to WhatsApp:', error);
            alert(t('common.error') || 'Failed to share to WhatsApp');
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
                <header className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-600 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-base sm:text-xl font-bold text-slate-700 dark:text-white truncate">
                        {t('prescriptionDetails.title')} #{prescription.id.slice(-8)}
                    </h2>
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Desktop buttons */}
                        <div className="hidden md:flex items-center gap-2">
                            {onUpdate && (
                                <button
                                    onClick={() => onUpdate(prescription)}
                                    className="flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                                >
                                    <EditIcon /> {t('common.edit')}
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={onDelete}
                                    className="flex items-center px-3 py-1 bg-red-100 dark:bg-red-900/50 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-300"
                                >
                                    <DeleteIcon /> {t('common.delete')}
                                </button>
                            )}
                            <button
                                onClick={handleWhatsAppShare}
                                disabled={isSharing || !patient.phone}
                                className={`flex items-center px-3 py-1 bg-emerald-500 dark:bg-emerald-600 rounded-lg hover:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors ${!patient.phone ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={!patient.phone ? t('patientList.noPhoneError') : t('prescriptionDetails.shareWhatsApp')}
                            >
                                <WhatsAppIcon className="h-4 w-4 me-2" />
                                {isSharing ? t('common.sending') : 'WhatsApp'}
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                            >
                                <PrintIcon /> {t('common.print')}
                            </button>
                        </div>
                        
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                            aria-label="Menu"
                        >
                            <MenuIcon />
                        </button>
                        
                        {/* Close button */}
                        <button 
                            onClick={onClose} 
                            className="p-1 sm:p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300" 
                            aria-label={t('prescriptionDetails.closeAriaLabel')}
                        >
                            <CloseIcon />
                        </button>
                    </div>
                </header>

                {/* Mobile menu dropdown */}
                {showMobileMenu && (
                    <div className="md:hidden border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 p-3">
                        <div className="flex flex-col gap-2">
                            {onUpdate && (
                                <button
                                    onClick={() => {
                                        onUpdate(prescription);
                                        setShowMobileMenu(false);
                                    }}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                                >
                                    <EditIcon /> {t('common.edit')}
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={() => {
                                        onDelete();
                                        setShowMobileMenu(false);
                                    }}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/50 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-300"
                                >
                                    <DeleteIcon /> {t('common.delete')}
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    handleWhatsAppShare();
                                    setShowMobileMenu(false);
                                }}
                                disabled={isSharing || !patient.phone}
                                className={`flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 dark:bg-emerald-600 rounded-lg hover:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors ${!patient.phone ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <WhatsAppIcon className="h-4 w-4" />
                                {isSharing ? t('common.sending') : 'WhatsApp'}
                            </button>
                            <button
                                onClick={() => {
                                    handlePrint();
                                    setShowMobileMenu(false);
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                            >
                                <PrintIcon /> {t('common.print')}
                            </button>
                        </div>
                    </div>
                )}

                <main className="p-3 sm:p-6 overflow-y-auto flex-1 dark:bg-slate-800" ref={contentRef}>
                    {/* Prescription Header */}
                    <div className="bg-slate-50 dark:bg-slate-700 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <h3 className="font-bold text-slate-700 dark:text-white mb-2 text-sm sm:text-base">{t('prescriptionDetails.patientInfo')}</h3>
                                <p className="text-xs sm:text-sm dark:text-slate-300"><strong>{t('prescriptionDetails.patientName')}:</strong> {patient.name}</p>
                                <p className="text-xs sm:text-sm dark:text-slate-300"><strong>{t('prescriptionDetails.patientId')}:</strong> {patient.id.slice(-8)}</p>
                                <p className="text-xs sm:text-sm dark:text-slate-300"><strong>{t('prescriptionDetails.patientPhone')}:</strong> {patient.phone}</p>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-700 dark:text-white mb-2 text-sm sm:text-base">{t('prescriptionDetails.prescriptionInfo')}</h3>
                                <p className="text-xs sm:text-sm dark:text-slate-300"><strong>{t('prescriptionDetails.dentist')}:</strong> {dentist?.name || t('common.unknownDentist')}</p>
                                <p className="text-xs sm:text-sm dark:text-slate-300"><strong>{t('prescriptionDetails.date')}:</strong> {dateFormatter.format(new Date(prescription.prescriptionDate))}</p>
                                <p className="text-xs sm:text-sm dark:text-slate-300"><strong>{t('prescriptionDetails.prescriptionId')}:</strong> {prescription.id.slice(-8)}</p>
                            </div>
                        </div>
                        {prescription.notes && (
                            <div className="mt-3 sm:mt-4">
                                <h3 className="font-bold text-slate-700 dark:text-white mb-2 text-sm sm:text-base">{t('prescriptionDetails.notes')}</h3>
                                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{prescription.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Medications */}
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-700 dark:text-white mb-3 sm:mb-4">{t('prescriptionDetails.medications')}</h3>

                        {items.length === 0 ? (
                            <p className="text-center text-slate-500 dark:text-slate-400 py-6 sm:py-8 text-sm sm:text-base">{t('prescriptionDetails.noMedications')}</p>
                        ) : (
                            <div className="space-y-3 sm:space-y-4">
                                {items.map((item, index) => (
                                    <div key={item.id} className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-3 sm:p-4 shadow-sm">
                                        <div className="flex justify-between items-start mb-2 sm:mb-3">
                                            <h4 className="font-bold text-slate-800 dark:text-white text-base sm:text-lg">{item.medicationName}</h4>
                                            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">#{index + 1}</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                                            {item.dosage && (
                                                <div>
                                                    <strong className="text-slate-600 dark:text-slate-400">{t('prescriptionDetails.dosage')}:</strong>
                                                    <p className="text-slate-800 dark:text-white">{item.dosage}</p>
                                                </div>
                                            )}
                                            <div>
                                                <strong className="text-slate-600 dark:text-slate-400">{t('prescriptionDetails.quantity')}:</strong>
                                                <p className="text-slate-800 dark:text-white">{item.quantity}</p>
                                            </div>
                                            {item.instructions && (
                                                <div className="sm:col-span-3">
                                                    <strong className="text-slate-600 dark:text-slate-400">{t('prescriptionDetails.instructions')}:</strong>
                                                    <p className="text-slate-800 dark:text-white">{item.instructions}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-600 flex justify-end">
                        <button
                            onClick={onClose}
                            className="w-full sm:w-auto px-4 py-2 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm sm:text-base"
                        >
                            {t('common.close')}
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PrescriptionDetailsModal;
