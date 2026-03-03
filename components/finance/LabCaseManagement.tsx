 import React, { useState, useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { LabCase, LabCaseStatus, NotificationType, Patient, Supplier, SupplierInvoiceStatus } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';

const AddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;

const AddEditLabCaseModal: React.FC<{
    labCase?: LabCase;
    onClose: () => void;
    onSave: (labCase: Omit<LabCase, 'id'> | LabCase) => void;
    clinicData: ClinicData;
}> = ({ labCase, onClose, onSave, clinicData }) => {
    const { t } = useI18n();
    const { addNotification } = useNotification();
    const { isDark } = useTheme();
    const { patients, suppliers } = clinicData;
    const [formData, setFormData] = useState<Omit<LabCase, 'id'> | LabCase>(
        labCase || {
            patientId: '',
            labId: '',
            caseType: '',
            sentDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            returnDate: '',
            status: LabCaseStatus.DRAFT,
            labCost: 0,
            notes: '',
        }
    );

    const dentalLabs = useMemo(() => suppliers.filter(s => s.type === 'Dental Lab'), [suppliers]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: name === 'labCost' ? parseFloat(value) : value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.patientId || !formData.labId || !formData.caseType || !formData.sentDate || !formData.dueDate) {
            addNotification(t('labCases.alertFillAllFields'), NotificationType.ERROR);
            return;
        }

        // If status is being changed to a completed status and there's a lab cost, create supplier invoice
        if (formData.status !== LabCaseStatus.DRAFT && formData.status !== LabCaseStatus.SENT_TO_LAB && formData.labCost > 0) {
            // Create supplier invoice for the lab cost
            const labSupplier = clinicData.suppliers.find(s => s.id === formData.labId);
            if (labSupplier) {
                const invoiceData = {
                    supplierId: formData.labId,
                    invoiceNumber: `LC-${formData.caseType}-${Date.now()}`,
                    invoiceDate: new Date().toISOString().split('T')[0],
                    dueDate: formData.dueDate,
                    amount: formData.labCost,
                    status: SupplierInvoiceStatus.UNPAID,
                    items: [{ description: `Lab case: ${formData.caseType}`, amount: formData.labCost }],
                    payments: [],
                };
                clinicData.addSupplierInvoice(invoiceData);
                addNotification(t('notifications.invoiceAddedForLabCase'), NotificationType.SUCCESS);
            }
        }

        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className={`rounded-xl shadow-2xl w-full max-w-md ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                <header className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>{labCase ? t('labCases.editCase') : t('labCases.addNewCase')}</h2>
                    <button onClick={onClose} className={`p-1 rounded-full transition-colors focus:outline-none focus:ring-2 ${isDark ? 'hover:bg-slate-700 focus:ring-slate-600' : 'hover:bg-slate-200 focus:ring-slate-300'}`} aria-label={t('common.closeForm')}>
                        <CloseIcon />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className={`p-6 space-y-4 max-h-[70vh] overflow-y-auto ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    <div>
                        <label htmlFor="patientId" className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('labCases.patient')}</label>
                        <select id="patientId" name="patientId" value={formData.patientId} onChange={handleChange} className={`p-2 border rounded-lg w-full focus:ring-primary focus:border-primary ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100' : 'border-slate-300 text-slate-700'}`} required>
                            <option value="">{t('labCases.selectPatient')}</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="labId" className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('labCases.dentalLab')}</label>
                        <select id="labId" name="labId" value={formData.labId} onChange={handleChange} className={`p-2 border rounded-lg w-full focus:ring-primary focus:border-primary ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100' : 'border-slate-300 text-slate-700'}`} required>
                            <option value="">{t('labCases.selectDentalLab')}</option>
                            {dentalLabs.map(lab => <option key={lab.id} value={lab.id}>{lab.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="caseType" className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('labCases.caseType')}</label>
                        <input id="caseType" name="caseType" value={formData.caseType} onChange={handleChange} placeholder={t('labCases.caseTypePlaceholder')} className={`p-2 border rounded-lg w-full focus:ring-primary focus:border-primary ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' : 'border-slate-300 text-slate-700'}`} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="sentDate" className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('labCases.sentDate')}</label>
                            <input id="sentDate" name="sentDate" type="date" value={formData.sentDate} onChange={handleChange} className={`p-2 border rounded-lg w-full focus:ring-primary focus:border-primary ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100' : 'border-slate-300 text-slate-700'}`} required />
                        </div>
                        <div>
                            <label htmlFor="dueDate" className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('labCases.dueDate')}</label>
                            <input id="dueDate" name="dueDate" type="date" value={formData.dueDate} onChange={handleChange} className={`p-2 border rounded-lg w-full focus:ring-primary focus:border-primary ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100' : 'border-slate-300 text-slate-700'}`} required />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="returnDate" className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('labCases.returnDate')}</label>
                        <input id="returnDate" name="returnDate" type="date" value={formData.returnDate || ''} onChange={handleChange} className={`p-2 border rounded-lg w-full focus:ring-primary focus:border-primary ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100' : 'border-slate-300 text-slate-700'}`} />
                    </div>
                    <div>
                        <label htmlFor="labCost" className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('labCases.labCost')}</label>
                        <input id="labCost" name="labCost" type="number" step="0.01" value={formData.labCost || ''} onChange={handleChange} className={`p-2 border rounded-lg w-full focus:ring-primary focus:border-primary ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100' : 'border-slate-300 text-slate-700'}`} required />
                    </div>
                    <div>
                        <label htmlFor="status" className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('labCases.status')}</label>
                        <select id="status" name="status" value={formData.status} onChange={handleChange} className={`p-2 border rounded-lg w-full focus:ring-primary focus:border-primary ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100' : 'border-slate-300 text-slate-700'}`} required>
                            {Object.values(LabCaseStatus).map(s => <option key={s} value={s}>{t(`labCaseStatus.${s}`)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="notes" className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('labCases.notes')}</label>
                        <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder={t('labCases.notesPlaceholder')} className={`p-2 border rounded-lg w-full h-20 focus:ring-primary focus:border-primary ${isDark ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' : 'border-slate-300 text-slate-700'}`} />
                    </div>
                    <footer className="pt-2 flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600 focus:ring-slate-500' : 'bg-neutral-dark rounded-lg hover:bg-slate-300 focus:ring-slate-300'}`}>{t('common.cancel')}</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light">{t('common.save')}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

const LabCaseManagement: React.FC<{ clinicData: ClinicData }> = ({ clinicData }) => {
    const { labCases, addLabCase, updateLabCase, patients, suppliers } = clinicData;
    const { t, locale } = useI18n();
    const { addNotification } = useNotification();
    const { isDark } = useTheme();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingCase, setEditingCase] = useState<LabCase | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState<LabCaseStatus | 'ALL'>('ALL');
    const [labFilter, setLabFilter] = useState<string>('ALL');
    const [patientFilter, setPatientFilter] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    const dentalLabs = useMemo(() => suppliers.filter(s => s.type === 'Dental Lab'), [suppliers]);

    const filteredLabCases = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return labCases.filter((lc) => {
            if (statusFilter !== 'ALL' && lc.status !== statusFilter) {
                return false;
            }

            if (labFilter !== 'ALL' && lc.labId !== labFilter) {
                return false;
            }

            if (patientFilter !== 'ALL' && lc.patientId !== patientFilter) {
                return false;
            }

            if (!normalizedSearch) {
                return true;
            }

            const patient = patients.find(p => p.id === lc.patientId);
            const lab = suppliers.find(s => s.id === lc.labId);
            const searchableText = [
                lc.caseType,
                lc.notes,
                patient?.name ?? '',
                lab?.name ?? '',
            ].join(' ').toLowerCase();

            return searchableText.includes(normalizedSearch);
        });
    }, [labCases, statusFilter, labFilter, patientFilter, searchTerm, patients, suppliers]);

    const handleSaveCase = (labCase: Omit<LabCase, 'id'> | LabCase) => {
        if ('id' in labCase && labCase.id) {
            updateLabCase(labCase as LabCase);
            addNotification(t('notifications.labCaseUpdated'), NotificationType.SUCCESS);
        } else {
            addLabCase(labCase as Omit<LabCase, 'id'>);
            addNotification(t('notifications.labCaseAdded'), NotificationType.SUCCESS);
        }
        setEditingCase(undefined);
        setIsAddModalOpen(false);
    };

    const getStatusClass = (status: LabCaseStatus) => {
        switch (status) {
            case LabCaseStatus.DRAFT:
                return isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700';
            case LabCaseStatus.SENT_TO_LAB:
                return isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700';
            case LabCaseStatus.RECEIVED_FROM_LAB:
                return isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700';
            case LabCaseStatus.FITTED_TO_PATIENT:
                return isDark ? 'bg-emerald-900 text-emerald-200' : 'bg-emerald-100 text-emerald-700';
            case LabCaseStatus.CANCELLED:
                return isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700';
            default:
                return isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className={`p-4 md:p-6 rounded-xl shadow-md ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>{t('labCases.labCaseTracker')}</h3>
                <button
                    onClick={() => { setEditingCase(undefined); setIsAddModalOpen(true); }}
                    className="bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary-dark flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
                >
                    <AddIcon /> {t('labCases.addCase')}
                </button>
            </div>
            <div className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-slate-700/70 border border-slate-600' : 'bg-slate-50 border border-slate-200'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <h4 className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{t('common.filters')}</h4>
                    <button
                        type="button"
                        onClick={() => {
                            setStatusFilter('ALL');
                            setLabFilter('ALL');
                            setPatientFilter('ALL');
                            setSearchTerm('');
                        }}
                        className={`text-xs px-2.5 py-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 ${isDark ? 'bg-slate-600 text-slate-100 hover:bg-slate-500 focus:ring-slate-500' : 'bg-white text-slate-700 hover:bg-slate-100 focus:ring-slate-300 border border-slate-300'}`}
                    >
                        {t('common.clearFilters')}
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                        <label htmlFor="lab-case-search" className={`block text-xs mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('common.search')}</label>
                        <input
                            id="lab-case-search"
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('common.search')}
                            className={`w-full p-2 rounded-lg border text-sm focus:ring-primary focus:border-primary ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400' : 'bg-white border-slate-300 text-slate-700'}`}
                        />
                    </div>
                    <div>
                        <label htmlFor="lab-case-status-filter" className={`block text-xs mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('labCases.status')}</label>
                        <select
                            id="lab-case-status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as LabCaseStatus | 'ALL')}
                            className={`w-full p-2 rounded-lg border text-sm focus:ring-primary focus:border-primary ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-700'}`}
                        >
                            <option value="ALL">{t('common.all')}</option>
                            {Object.values(LabCaseStatus).map(status => (
                                <option key={status} value={status}>
                                    {t(`labCaseStatus.${status}`)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="lab-case-lab-filter" className={`block text-xs mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('labCases.dentalLab')}</label>
                        <select
                            id="lab-case-lab-filter"
                            value={labFilter}
                            onChange={(e) => setLabFilter(e.target.value)}
                            className={`w-full p-2 rounded-lg border text-sm focus:ring-primary focus:border-primary ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-700'}`}
                        >
                            <option value="ALL">{t('common.all')}</option>
                            {dentalLabs.map(lab => (
                                <option key={lab.id} value={lab.id}>
                                    {lab.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="lab-case-patient-filter" className={`block text-xs mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('labCases.patient')}</label>
                        <select
                            id="lab-case-patient-filter"
                            value={patientFilter}
                            onChange={(e) => setPatientFilter(e.target.value)}
                            className={`w-full p-2 rounded-lg border text-sm focus:ring-primary focus:border-primary ${isDark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-700'}`}
                        >
                            <option value="ALL">{t('common.all')}</option>
                            {patients.map(patient => (
                                <option key={patient.id} value={patient.id}>
                                    {patient.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            <div className={`p-4 rounded-lg shadow-inner ${isDark ? 'bg-slate-700' : 'bg-neutral'}`}>
                {labCases.length === 0 ? (
                    <p className={`text-center py-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('labCases.noCasesRecorded')}</p>
                ) : filteredLabCases.length === 0 ? (
                    <div className="text-center py-4 space-y-1">
                        <p className={`${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('common.noResults')}</p>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('common.tryDifferentFilters')}</p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {filteredLabCases.map(lc => {
                            const patient = patients.find(p => p.id === lc.patientId);
                            const lab = suppliers.find(s => s.id === lc.labId);
                            const statusClass = getStatusClass(lc.status);
                            return (
                                <li key={lc.id} className={`flex flex-col sm:flex-row justify-between sm:items-center p-3 rounded-md shadow-sm gap-2 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{lc.caseType} - {patient?.name || t('common.unknownPatient')}</p>
                                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                            المعمل: {lab?.name || t('common.na')}
                                            <span className={`ms-2 ps-2 border-s ${isDark ? 'border-slate-600' : 'border-slate-300'}`}>
                                                تاريخ الإرسال: {lc.sentDate ? dateFormatter.format(new Date(lc.sentDate)) : t('common.na')} | تاريخ التسليم: {lc.dueDate ? dateFormatter.format(new Date(lc.dueDate)) : t('common.na')}
                                            </span>
                                            {lc.returnDate && (
                                                <span className={`ms-2 ps-2 border-s ${isDark ? 'border-slate-600' : 'border-slate-300'}`}>
                                                    {t('labCases.returnDate')}: {lc.returnDate ? dateFormatter.format(new Date(lc.returnDate)) : 'Not returned'}
                                                </span>
                                            )}
                                        </p>
                                        {lc.notes && <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{t('labCases.notes')}: {lc.notes}</p>}
                                    </div>
                                    <div className="flex flex-col items-end sm:items-center gap-2 flex-shrink-0">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusClass}`}>{lc.status === 'DRAFT' ? 'مسودة' : t(`labCaseStatus.${lc.status}`)}</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{isNaN(lc.labCost) || lc.labCost === null || lc.labCost === undefined ? t('common.na') : currencyFormatter.format(lc.labCost)} ج.م.</span>
                                            <button
                                                onClick={() => { setEditingCase(lc); setIsAddModalOpen(true); }}
                                                className="text-primary hover:text-primary-dark p-2 rounded-lg hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary-light"
                                                aria-label={t('labCases.editCaseAriaLabel', {caseType: lc.caseType, patientName: patient?.name || t('common.unknownPatient')})}
                                            >
                                                <EditIcon />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {isAddModalOpen && (
                <AddEditLabCaseModal
                    labCase={editingCase}
                    onClose={() => { setIsAddModalOpen(false); setEditingCase(undefined); }}
                    onSave={handleSaveCase}
                    clinicData={clinicData}
                />
            )}
        </div>
    );
};

export default LabCaseManagement;
