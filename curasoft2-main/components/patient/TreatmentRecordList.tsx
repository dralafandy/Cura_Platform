import React, { useState } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { Patient, TreatmentRecord } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationType } from '../../types';
import EditTreatmentRecordModal from './EditTreatmentRecordModal';
import DeleteTreatmentRecordConfirmationModal from './DeleteTreatmentRecordConfirmationModal';

// Icon Components
const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const DeleteIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const DentistIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const CalendarIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const TreatmentIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
);

const MaterialsIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);

const TreatmentRecordList: React.FC<{
    patient: Patient;
    clinicData: ClinicData;
    onUpdateTreatmentRecord: (patientId: string, record: TreatmentRecord) => void;
    onDeleteTreatmentRecord: (recordId: string) => void;
}> = ({ patient, clinicData, onUpdateTreatmentRecord, onDeleteTreatmentRecord }) => {
    const { t, locale } = useI18n();
    const { addNotification } = useNotification();
    const { isAdmin } = useAuth();
    const { dentists, treatmentDefinitions, inventoryItems } = clinicData;
    const [editingRecord, setEditingRecord] = useState<TreatmentRecord | null>(null);
    const [deletingRecord, setDeletingRecord] = useState<TreatmentRecord | null>(null);

    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });

    const recordsForPatient = clinicData.treatmentRecords
        .filter(r => r.patientId === patient.id)
        .sort((a, b) => new Date(b.treatmentDate).getTime() - new Date(a.treatmentDate).getTime());

    if (recordsForPatient.length === 0) {
        return <p className="text-center text-slate-500 dark:text-slate-400 py-10">{t('treatmentRecordList.noRecords')}</p>;
    }

    return (
        <>
            <div className="space-y-6">
                {recordsForPatient.map(record => {
                    const dentist = dentists.find(d => d.id === record.dentistId);
                    const treatmentDef = treatmentDefinitions.find(td => td.id === record.treatmentDefinitionId);

                    return (
                        <div key={record.id} className="group bg-gradient-to-br from-white dark:from-slate-800 to-slate-50 dark:to-slate-700/50 p-6 rounded-2xl shadow-lg hover:shadow-xl border border-slate-200/60 dark:border-slate-700/60 transition-all duration-300 hover:scale-[1.02] hover:border-primary/20 dark:hover:border-primary/30">
                            {/* Header Section */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <TreatmentIcon />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-xl mb-1">{treatmentDef?.name || t('common.unknownTreatment')}</h4>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                            <div className="flex items-center gap-1">
                                                <DentistIcon />
                                                <span>{dentist?.name || t('common.unknownDentist')}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <CalendarIcon />
                                                <span>{dateFormatter.format(new Date(record.treatmentDate))}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-primary mb-1">{currencyFormatter.format(record.doctorShare + record.clinicShare)}</div>
                                    <div className="text-xs text-slate-500 font-medium">{t('treatmentRecordList.totalCost')}</div>
                                </div>
                            </div>

                            {/* Notes Section */}
                            {record.notes && (
                                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-l-4 border-primary/30 dark:border-primary/40">
                                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{record.notes}</p>
                                </div>
                            )}

                            {/* Materials Section */}
                            {record.inventoryItemsUsed.length > 0 && (
                                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-200/50 dark:border-blue-800/30">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MaterialsIcon />
                                        <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">{t('treatmentRecordList.materialsUsed')}:</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {record.inventoryItemsUsed.map((item, index) => {
                                            const material = inventoryItems.find(lm => lm.id === item.inventoryItemId);
                                            return (
                                                <div key={index} className="flex justify-between items-center p-2 bg-white/60 dark:bg-slate-700/60 rounded-lg">
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{material?.name || t('common.unknownMaterial')}</span>
                                                    <div className="text-right">
                                                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">x {item.quantity}</div>
                                                        <div className="text-xs text-slate-600 dark:text-slate-400">{currencyFormatter.format(item.cost)}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Actions and Cost Breakdown */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4 border-t border-slate-200/60">
                                {isAdmin && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingRecord(record)}
                                            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                        >
                                            <EditIcon />
                                            <span className="hidden sm:inline">{t('common.edit')}</span>
                                        </button>
                                        <button
                                            onClick={() => setDeletingRecord(record)}
                                            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                        >
                                            <DeleteIcon />
                                            <span className="hidden sm:inline">{t('common.delete')}</span>
                                        </button>
                                    </div>
                                )}
                                <div className="flex flex-col sm:flex-row gap-3 text-sm">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200/50">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                        <span className="text-blue-700 font-medium">{t('addTreatmentRecord.doctorShare')}:</span>
                                        <span className="font-bold text-blue-800">{currencyFormatter.format(record.doctorShare)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200/50">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="text-green-700 font-medium">{t('addTreatmentRecord.clinicShare')}:</span>
                                        <span className="font-bold text-green-800">{currencyFormatter.format(record.clinicShare)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {editingRecord && (
                <EditTreatmentRecordModal
                    record={editingRecord}
                    onClose={() => setEditingRecord(null)}
                    onUpdate={(updatedRecord) => {
                        onUpdateTreatmentRecord(patient.id, updatedRecord);
                        setEditingRecord(null);
                    }}
                    clinicData={clinicData}
                />
            )}
            {deletingRecord && (
                <DeleteTreatmentRecordConfirmationModal
                    record={deletingRecord}
                    onConfirm={() => {
                        onDeleteTreatmentRecord(deletingRecord.id);
                        setDeletingRecord(null);
                        addNotification({ message: t('treatmentDelete.deletedSuccessfully'), type: NotificationType.SUCCESS });
                    }}
                    onCancel={() => setDeletingRecord(null)}
                />
            )}
        </>
    );
};

export default TreatmentRecordList;