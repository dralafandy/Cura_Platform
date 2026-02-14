import React, { useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { Patient, ToothStatus, TreatmentRecord, Payment } from '../../types';
import { useI18n } from '../../hooks/useI18n';

const printStyles = `
@media print {
  @page {
    size: A4;
    margin: 1cm;
  }
  body {
    font-size: 12pt;
    line-height: 1.4;
  }
  .text-4xl { font-size: 24pt; }
  .text-3xl { font-size: 20pt; }
  .text-2xl { font-size: 16pt; }
  .text-xl { font-size: 14pt; }
  .text-md { font-size: 12pt; }
  .text-sm { font-size: 10pt; }
  .p-8 { padding: 20pt; }
  .p-6 { padding: 15pt; }
  .p-4 { padding: 10pt; }
  .p-3 { padding: 8pt; }
  .p-2 { padding: 5pt; }
  .mb-10 { margin-bottom: 25pt; }
  .mb-4 { margin-bottom: 10pt; }
  .mb-2 { margin-bottom: 5pt; }
  .mt-12 { margin-top: 30pt; }
  .mt-6 { margin-top: 15pt; }
  .mt-4 { margin-top: 10pt; }
  .mt-2 { margin-top: 5pt; }
  .border { border-width: 1pt; }
  .border-b { border-bottom-width: 1pt; }
  .border-collapse { border-collapse: collapse; }
  .break-inside-avoid { break-inside: avoid; }
}
`;

interface PatientFullReportProps {
    patient: Patient;
    clinicData: ClinicData;
}

const PatientFullReport: React.FC<PatientFullReportProps> = ({ patient, clinicData }) => {
    const { t, locale } = useI18n();
    const { treatmentRecords, payments, treatmentDefinitions, dentists, clinicInfo } = clinicData;

    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    const patientTreatmentRecords = useMemo(() => treatmentRecords.filter(tr => tr.patientId === patient.id).sort((a, b) => new Date(a.treatmentDate).getTime() - new Date(b.treatmentDate).getTime()), [treatmentRecords, patient.id]);
    const patientPayments = useMemo(() => payments.filter(p => p.patientId === patient.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [payments, patient.id]);

    const financialSummary = useMemo(() => {
        const totalCharges = patientTreatmentRecords.reduce((sum, tr) => sum + (tr.doctorShare + tr.clinicShare), 0);
        const totalPaid = patientPayments.reduce((sum, p) => sum + p.amount, 0);
        const outstandingBalance = totalCharges - totalPaid;
        return { totalCharges, totalPaid, outstandingBalance };
    }, [patientTreatmentRecords, patientPayments]);

    // Summarize dental chart status
    const toothStatusCounts: Record<ToothStatus, number> = {
        [ToothStatus.HEALTHY]: 0,
        [ToothStatus.FILLING]: 0,
        [ToothStatus.CROWN]: 0,
        [ToothStatus.MISSING]: 0,
        [ToothStatus.IMPLANT]: 0,
        [ToothStatus.ROOT_CANAL]: 0,
        [ToothStatus.CAVITY]: 0,
    };

    for (const toothId in patient.dentalChart) {
        const status = patient.dentalChart[toothId].status;
        if (toothStatusCounts.hasOwnProperty(status)) {
            toothStatusCounts[status]++;
        }
    }

    const dentalChartSummary = useMemo(() => {
        const entries: string[] = [];
        const significantStatuses = Object.entries(toothStatusCounts).filter(([, count]) => count > 0);

        if (significantStatuses.length > 0) {
            significantStatuses.forEach(([status, count]) => {
                if (count > 0) {
                    entries.push(`${t(`toothStatus.${status}`)}: ${count}`);
                }
            });
        } else {
            entries.push(t('patientReport.dentalChart.allHealthy'));
        }
        return entries;
    }, [toothStatusCounts, t]);

    return (
        <div className="p-8 bg-white text-slate-900 min-h-screen" dir="rtl">
            <style>{printStyles}</style>
            
            {/* Header with gradient */}
            <header className="text-center mb-10 break-inside-avoid">
                <div className="bg-white rounded-xl p-6 mb-4 border border-slate-200">
                    <div className="flex flex-col items-center gap-3 mb-3">
                        {clinicInfo.logo && (
                            <img 
                                src={clinicInfo.logo} 
                                alt="شعار العيادة" 
                                className="w-20 h-20 object-contain"
                            />
                        )}
                        <h1 className="text-xl font-bold text-slate-800">{clinicInfo.name || t('appName')}</h1>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-sm text-slate-600">
                        {clinicInfo.address && (
                            <p className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {clinicInfo.address}
                            </p>
                        )}
                        {clinicInfo.phone && (
                            <p className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {clinicInfo.phone}
                            </p>
                        )}
                        {clinicInfo.email && (
                            <p className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {clinicInfo.email}
                            </p>
                        )}
                    </div>
                </div>

                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-900 px-6 py-2 rounded-full border border-emerald-200 mb-3">
                    <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h2 className="text-xl font-bold">{t('patientReport.title')}</h2>
                </div>
                <p className="text-sm text-slate-600">{t('patientReport.generatedOn', { date: dateFormatter.format(new Date()) })}</p>
            </header>

            {/* Demographics Section */}
            <section className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                    <h3 className="text-2xl font-bold text-slate-800">{t('patientReport.demographics.title')}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-md bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span><strong>{t('patientReport.demographics.name')}:</strong> {patient.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        <span><strong>{t('patientReport.demographics.phone')}:</strong> {patient.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                        <span><strong>{t('patientReport.demographics.dob')}:</strong> {dateFormatter.format(new Date(patient.dob))}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
                        <span><strong>{t('patientReport.demographics.email')}:</strong> {patient.email || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                        <span><strong>{t('patientReport.demographics.gender')}:</strong> {t(patient.gender.toLowerCase() as 'male' | 'female' | 'other')}</span>
                    </div>
                    <div className="flex items-center gap-2 md:col-span-2">
                        <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                        <span><strong>{t('patientReport.demographics.address')}:</strong> {patient.address || '-'}</span>
                    </div>
                </div>
            </section>

            {/* Emergency & Insurance Section */}
            <section className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full"></div>
                    <h3 className="text-2xl font-bold text-slate-800">{t('patientReport.emergencyAndInsurance.title')}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-md bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                        <span><strong>{t('patientReport.emergencyContactName')}:</strong> {patient.emergencyContactName || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        <span><strong>{t('patientReport.emergencyContactPhone')}:</strong> {patient.emergencyContactPhone || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span><strong>{t('patientReport.emergencyAndInsurance.insuranceProvider')}:</strong> {patient.insuranceProvider || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                        <span><strong>{t('patientReport.emergencyAndInsurance.policyNumber')}:</strong> {patient.insurancePolicyNumber || '-'}</span>
                    </div>
                </div>
            </section>

            {/* Medical Info Section */}
            <section className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 bg-gradient-to-b from-rose-500 to-pink-600 rounded-full"></div>
                    <h3 className="text-2xl font-bold text-slate-800">{t('patientReport.medicalInfo.title')}</h3>
                </div>
                <div className="space-y-3 text-md bg-gradient-to-br from-rose-50 to-pink-50 p-4 rounded-xl border border-rose-200">
                    <div className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-rose-500 rounded-full mt-2"></span>
                        <span className="flex-1"><strong>{t('patientReport.medicalInfo.allergies')}:</strong> <span className="whitespace-pre-wrap">{patient.allergies || t('common.na')}</span></span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-pink-500 rounded-full mt-2"></span>
                        <span className="flex-1"><strong>{t('patientReport.medicalInfo.medications')}:</strong> <span className="whitespace-pre-wrap">{patient.medications || t('common.na')}</span></span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-violet-500 rounded-full mt-2"></span>
                        <span className="flex-1"><strong>{t('patientReport.medicalInfo.medicalHistory')}:</strong> <span className="whitespace-pre-wrap">{patient.medicalHistory || t('common.na')}</span></span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></span>
                        <span className="flex-1"><strong>{t('patientDetails.unstructuredNotes')}:</strong> <span className="whitespace-pre-wrap">{patient.treatmentNotes || t('common.na')}</span></span>
                    </div>
                </div>
            </section>

            {/* Dental Chart Section */}
            <section className="mb-10 break-inside-avoid">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 bg-gradient-to-b from-teal-500 to-cyan-600 rounded-full"></div>
                    <h3 className="text-2xl font-bold text-slate-800">{t('patientReport.dentalChart.title')}</h3>
                </div>
                <div className="space-y-2 text-md">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {dentalChartSummary.map((summary, index) => (
                            <span key={index} className="px-3 py-1 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 rounded-full text-sm font-medium border border-teal-200">
                                {summary}
                            </span>
                        ))}
                    </div>
                    <table className="w-full text-sm border-collapse rounded-xl overflow-hidden shadow-sm">
                        <thead className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
                            <tr>
                                <th className="p-3 text-right font-semibold">{t('patientReport.dentalChart.tooth')}</th>
                                <th className="p-3 text-right font-semibold">{t('patientReport.dentalChart.status')}</th>
                                <th className="p-3 text-right font-semibold">{t('patientReport.dentalChart.notes')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(patient.dentalChart).filter(([, tooth]) => tooth.status !== ToothStatus.HEALTHY || tooth.notes).map(([toothId, tooth]) => (
                                <tr key={toothId} className="border-b border-slate-200 bg-white">
                                    <td className="p-3 border-x border-slate-200 font-medium">{toothId}</td>
                                    <td className="p-3 border-x border-slate-200">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            tooth.status === ToothStatus.FILLING ? 'bg-blue-100 text-blue-700' :
                                            tooth.status === ToothStatus.CROWN ? 'bg-purple-100 text-purple-700' :
                                            tooth.status === ToothStatus.MISSING ? 'bg-red-100 text-red-700' :
                                            tooth.status === ToothStatus.IMPLANT ? 'bg-green-100 text-green-700' :
                                            tooth.status === ToothStatus.ROOT_CANAL ? 'bg-amber-100 text-amber-700' :
                                            tooth.status === ToothStatus.CAVITY ? 'bg-orange-100 text-orange-700' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {t(`toothStatus.${tooth.status}`)}
                                        </span>
                                    </td>
                                    <td className="p-3 border-x border-slate-200">{tooth.notes || '-'}</td>
                                </tr>
                            ))}
                            {Object.entries(patient.dentalChart).filter(([, tooth]) => tooth.status === ToothStatus.HEALTHY && !tooth.notes).length === Object.keys(patient.dentalChart).length && (
                                <tr>
                                    <td colSpan={3} className="p-4 text-center text-slate-500 border border-slate-200">{t('patientReport.dentalChart.allHealthy')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Treatment History Section */}
            <section className="mb-10 break-inside-avoid">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                    <h3 className="text-2xl font-bold text-slate-800">{t('patientReport.treatmentHistory.title')}</h3>
                </div>
                {patientTreatmentRecords.length > 0 ? (
                    <table className="w-full text-md border-collapse rounded-xl overflow-hidden shadow-sm">
                        <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                            <tr>
                                <th className="p-3 text-right font-semibold">{t('patientReport.treatmentHistory.date')}</th>
                                <th className="p-3 text-right font-semibold">{t('patientReport.treatmentHistory.treatment')}</th>
                                <th className="p-3 text-right font-semibold">{t('patientReport.treatmentHistory.dentist')}</th>
                                <th className="p-3 text-right font-semibold">{t('patientReport.treatmentHistory.cost')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patientTreatmentRecords.map((record, index) => {
                                const treatmentDef = treatmentDefinitions.find(td => td.id === record.treatmentDefinitionId);
                                const dentist = dentists.find(d => d.id === record.dentistId);
                                return (
                                    <tr key={record.id} className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                                        <td className="p-3 border-x border-slate-200">{dateFormatter.format(new Date(record.treatmentDate))}</td>
                                        <td className="p-3 border-x border-slate-200">{treatmentDef?.name || t('common.unknownTreatment')}</td>
                                        <td className="p-3 border-x border-slate-200">{dentist?.name || t('common.unknownDentist')}</td>
                                        <td className="p-3 border-x border-slate-200 font-medium text-blue-600">{currencyFormatter.format(record.doctorShare + record.clinicShare)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-slate-500 py-4 bg-slate-50 rounded-xl">{t('patientReport.treatmentHistory.noRecords')}</p>
                )}
            </section>

            {/* Financials Section */}
            <section className="mb-10 break-inside-avoid">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                    <h3 className="text-2xl font-bold text-slate-800">{t('patientReport.financials.title')}</h3>
                </div>
                {patientPayments.length > 0 ? (
                    <table className="w-full text-md border-collapse rounded-xl overflow-hidden shadow-sm">
                        <thead className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                            <tr>
                                <th className="p-3 text-right font-semibold">{t('patientReport.financials.paymentDate')}</th>
                                <th className="p-3 text-right font-semibold">{t('patientReport.financials.paymentMethod')}</th>
                                <th className="p-3 text-right font-semibold">{t('patientReport.financials.notes')}</th>
                                <th className="p-3 text-right font-semibold">{t('patientReport.financials.amount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patientPayments.map((payment, index) => (
                                <tr key={payment.id} className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                                    <td className="p-3 border-x border-slate-200">{dateFormatter.format(new Date(payment.date))}</td>
                                    <td className="p-3 border-x border-slate-200">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            payment.method === 'cash' ? 'bg-green-100 text-green-700' :
                                            payment.method === 'card' ? 'bg-blue-100 text-blue-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {t(`paymentMethod.${payment.method}`)}
                                        </span>
                                    </td>
                                    <td className="p-3 border-x border-slate-200">{payment.notes || '-'}</td>
                                    <td className="p-3 border-x border-slate-200 font-medium text-emerald-600">{currencyFormatter.format(payment.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-slate-500 py-4 bg-slate-50 rounded-xl">{t('patientReport.financials.noPayments')}</p>
                )}
                
                {/* Financial Summary Card */}
                <div className="flex justify-end mt-4">
                    <div className="w-full max-w-sm p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-700"><strong>{t('financials.totalCharges')}:</strong></span>
                            <span className="font-medium text-slate-700">{currencyFormatter.format(financialSummary.totalCharges)}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-700"><strong>{t('financials.totalPaid')}:</strong></span>
                            <span className="font-medium text-emerald-600">{currencyFormatter.format(financialSummary.totalPaid)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                            <span className="text-lg font-bold text-slate-800"><strong>{t('financials.outstandingBalance')}:</strong></span>
                            <span className="text-lg font-bold text-rose-600">{currencyFormatter.format(financialSummary.outstandingBalance)}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="text-center mt-12 pt-6 border-t-2 border-slate-100">
                <div className="flex justify-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                </div>
                <p className="text-sm text-slate-600">{t('patientReport.footer')}</p>
                <p className="text-xs text-slate-400 mt-1">{t('reports.generatedOn')} {new Date().toLocaleString()}</p>
            </footer>
        </div>
    );
};

export default PatientFullReport;
