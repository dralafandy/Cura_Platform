import React, { useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { Patient, TreatmentRecord, Payment } from '../../types';
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

interface PatientInvoiceProps {
    patient: Patient;
    clinicData: ClinicData;
}

const PatientInvoice: React.FC<PatientInvoiceProps> = ({ patient, clinicData }) => {
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

    return (
        <div className="p-8 bg-white text-slate-900 min-h-screen" dir="rtl">
            <style>{printStyles}</style>
            
            {/* Header with professional clinic info */}
            <header className="flex justify-between items-start mb-10">
                <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                        {clinicInfo.logo ? (
                            <img 
                                src={clinicInfo.logo} 
                                alt="شعار العيادة" 
                                className="w-20 h-20 object-contain bg-white rounded-lg p-1 shadow-sm border border-slate-200"
                            />
                        ) : null}
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-slate-800 mb-2">{clinicInfo.name || t('appName')}</h1>
                            <div className="space-y-1">
                                {clinicInfo.address && (
                                    <p className="text-sm text-slate-600 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {clinicInfo.address}
                                    </p>
                                )}
                                {clinicInfo.phone && (
                                    <p className="text-sm text-slate-600 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        {clinicInfo.phone}
                                    </p>
                                )}
                                {clinicInfo.email && (
                                    <p className="text-sm text-slate-600 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        {clinicInfo.email}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="text-left">
                    <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl p-6 text-emerald-900 shadow-lg border border-emerald-200">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <svg className="w-6 h-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h2 className="text-xl font-bold">{t('patientInvoice.title')}</h2>
                        </div>
                        <p className="text-sm"><strong>{t('patientInvoice.invoiceNumber')}:</strong> {patient.id}-INV-{new Date().getFullYear()}</p>
                        <p className="text-sm"><strong>{t('patientInvoice.date')}:</strong> {dateFormatter.format(new Date())}</p>
                    </div>
                </div>
            </header>

            {/* Patient Info Card */}
            <section className="mb-10 p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">{t('patientInvoice.billTo')}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-md text-slate-700">
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
                        <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                        <span><strong>{t('patientReport.demographics.email')}:</strong> {patient.email || '-'}</span>
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                        <span><strong>{t('patientReport.demographics.address')}:</strong> {patient.address || '-'}</span>
                    </div>
                </div>
            </section>

            {/* Treatment Details */}
            <section className="mb-10 break-inside-avoid">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                    <h3 className="text-2xl font-bold text-slate-800">{t('patientInvoice.treatmentDetails')}</h3>
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
                            <tr className="bg-gradient-to-r from-emerald-50 to-teal-50 font-bold">
                                <td colSpan={3} className="p-3 text-right border border-slate-200">{t('financials.totalCharges')}:</td>
                                <td className="p-3 border border-slate-200 text-emerald-600">{currencyFormatter.format(financialSummary.totalCharges)}</td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-slate-500 py-4 bg-slate-50 rounded-xl">{t('patientReport.treatmentHistory.noRecords')}</p>
                )}
            </section>

            {/* Payment Details */}
            <section className="mb-10 break-inside-avoid">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                    <h3 className="text-2xl font-bold text-slate-800">{t('patientInvoice.paymentDetails')}</h3>
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
                            <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 font-bold">
                                <td colSpan={3} className="p-3 text-right border border-slate-200">{t('financials.totalPaid')}:</td>
                                <td className="p-3 border border-slate-200 text-blue-600">{currencyFormatter.format(financialSummary.totalPaid)}</td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center text-slate-500 py-4 bg-slate-50 rounded-xl">{t('patientReport.financials.noPayments')}</p>
                )}
            </section>

            {/* Balance Due */}
            <section className="flex justify-end mt-12 mb-10">
                <div className="w-full max-w-sm p-6 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-lg shadow-rose-200 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold">{t('patientInvoice.balanceDue')}</h3>
                        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-4xl font-extrabold">{currencyFormatter.format(financialSummary.outstandingBalance)}</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="text-center mt-12 pt-6 border-t border-slate-200">
                <div className="flex justify-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                </div>
                <p className="text-sm text-slate-600 mb-1">{t('patientInvoice.thankYou')}</p>
                <p className="text-xs text-slate-400">{t('patientReport.footer')}</p>
            </footer>
        </div>
    );
};

export default PatientInvoice;
