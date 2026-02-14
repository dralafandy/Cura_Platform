import React, { useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { Dentist, DoctorPayment, TreatmentRecord } from '../../types';
import { useI18n } from '../../hooks/useI18n';

// Print styles embedded for doctor statement
const printStyles = `
    @media print {
        @page { size: A4; margin: 1cm; }
        body { font-family: Cairo, sans-serif; font-size: 11px; }
        .break-inside-avoid { page-break-inside: avoid; }
        .w-full { width: 100%; }
        .p-8 { padding: 24px; }
        .p-6 { padding: 16px; }
        .p-4 { padding: 12px; }
        .p-3 { padding: 8px; }
        .mb-4 { margin-bottom: 12px; }
        .mb-6 { margin-bottom: 16px; }
        .mb-8 { margin-bottom: 24px; }
        .mt-4 { margin-top: 12px; }
        .mt-6 { margin-top: 16px; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-sm { font-size: 11px; }
        .text-base { font-size: 12px; }
        .text-lg { font-size: 14px; }
        .text-xl { font-size: 16px; }
        .text-2xl { font-size: 20px; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .font-extrabold { font-weight: 800; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
        .gap-3 { gap: 8px; }
        .gap-4 { gap: 12px; }
        .rounded-lg { border-radius: 8px; }
        .rounded-xl { border-radius: 12px; }
        .bg-white { background: #fff; }
        .bg-slate-50 { background: #f8fafc; }
        .bg-emerald-50 { background: #ecfdf5; }
        .bg-blue-50 { background: #eff6ff; }
        .bg-amber-50 { background: #fffbeb; }
        .bg-violet-50 { background: #f5f3ff; }
        .text-slate-500 { color: #64748b; }
        .text-slate-600 { color: #475569; }
        .text-slate-700 { color: #334155; }
        .text-slate-800 { color: #1e293b; }
        .text-emerald-600 { color: #059669; }
        .text-blue-600 { color: #2563eb; }
        .text-amber-600 { color: #d97706; }
        .text-violet-600 { color: #7c3aed; }
        .shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: right; }
        thead { background: #f1f5f9; }
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .justify-between { justify-content: space-between; }
        .justify-end { justify-content: flex-end; }
        .max-w-sm { max-width: 320px; }
        img { max-width: 100%; height: auto; }
        .w-16 { width: 64px; }
        .h-16 { height: 64px; }
        .object-contain { object-fit: contain; }
        .border { border: 1px solid #e2e8f0; }
        .border-b { border-bottom: 1px solid #e2e8f0; }
    }
`;

interface PrintableDoctorStatementProps {
    dentist: Dentist;
    clinicData: ClinicData;
    startDate?: string;
    endDate?: string;
}

const PrintableDoctorStatement: React.FC<PrintableDoctorStatementProps> = ({ dentist, clinicData, startDate, endDate }) => {
    const { t, locale } = useI18n();
    const { clinicInfo, doctorPayments, treatmentRecords, patients } = clinicData;

    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    const shortDateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    const doctorTreatmentRecords = useMemo(() => {
        let records = treatmentRecords.filter(tr => tr.dentistId === dentist.id);
        if (startDate) {
            records = records.filter(tr => new Date(tr.treatmentDate) >= new Date(startDate));
        }
        if (endDate) {
            records = records.filter(tr => new Date(tr.treatmentDate) <= new Date(endDate));
        }
        return records.sort((a, b) => new Date(b.treatmentDate).getTime() - new Date(a.treatmentDate).getTime());
    }, [treatmentRecords, dentist.id, startDate, endDate]);

    const doctorPaymentsFiltered = useMemo(() => {
        let payments = doctorPayments.filter(dp => dp.dentistId === dentist.id);
        if (startDate) {
            payments = payments.filter(dp => new Date(dp.date) >= new Date(startDate));
        }
        if (endDate) {
            payments = payments.filter(dp => new Date(dp.date) <= new Date(endDate));
        }
        return payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [doctorPayments, dentist.id, startDate, endDate]);

    const financialSummary = useMemo(() => {
        const totalTreatments = doctorTreatmentRecords.length;
        const totalTreatmentCost = doctorTreatmentRecords.reduce((sum, tr) => sum + tr.doctorShare, 0);
        const totalPaid = doctorPaymentsFiltered.reduce((sum, dp) => sum + dp.amount, 0);
        const remainingBalance = totalTreatmentCost - totalPaid;
        return { totalTreatments, totalTreatmentCost, totalPaid, remainingBalance };
    }, [doctorTreatmentRecords, doctorPaymentsFiltered]);

    return (
        <div className="p-8 bg-white text-slate-800" dir={locale === 'ar' ? 'rtl' : 'ltr'} style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontSize: '11px', lineHeight: '1.5' }}>
            <style>{printStyles}</style>
            
            {/* Header */}
            <header className="text-center mb-8 break-inside-avoid">
                <div className="bg-white rounded-xl p-4 mb-4 border border-slate-200">
                    <div className="flex flex-col items-center gap-2 mb-3">
                        {clinicInfo.logo && (
                            <img 
                                src={clinicInfo.logo} 
                                alt="شعار العيادة" 
                                className="w-16 h-16 object-contain"
                            />
                        )}
                        <h1 className="text-lg font-bold text-slate-800">{clinicInfo.name || t('appName')}</h1>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-xs text-slate-600">
                        {clinicInfo.address && (
                            <p className="flex items-center gap-2">
                                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {clinicInfo.address}
                            </p>
                        )}
                        {clinicInfo.phone && (
                            <p className="flex items-center gap-2">
                                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {clinicInfo.phone}
                            </p>
                        )}
                        {clinicInfo.email && (
                            <p className="flex items-center gap-2">
                                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {clinicInfo.email}
                            </p>
                        )}
                    </div>
                </div>

                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-800 px-6 py-2 rounded-full border border-violet-200 mb-3">
                    <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h2 className="text-lg font-bold">{t('doctorStatement.title')}</h2>
                </div>
                <p className="text-xs text-slate-500">{t('patientReport.generatedOn', { date: dateFormatter.format(new Date()) })}</p>
            </header>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-4 gap-3 mb-8 break-inside-avoid">
                <div className="bg-violet-50 rounded-xl p-4 border border-violet-200 text-center">
                    <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{t('doctorStatement.totalTreatments')}</p>
                    <p className="text-base font-bold text-violet-600">{financialSummary.totalTreatments}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{t('doctorStatement.totalEarnings')}</p>
                    <p className="text-base font-bold text-blue-600">{currencyFormatter.format(financialSummary.totalTreatmentCost)}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-center">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{t('doctorStatement.paidAmount')}</p>
                    <p className="text-base font-bold text-emerald-600">{currencyFormatter.format(financialSummary.totalPaid)}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{t('doctorStatement.remainingBalance')}</p>
                    <p className="text-base font-bold text-amber-600">{currencyFormatter.format(financialSummary.remainingBalance)}</p>
                </div>
            </div>

            {/* Doctor Info */}
            <section className="mb-8 p-4 rounded-xl bg-slate-50 border border-slate-200 break-inside-avoid">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h3 className="text-base font-bold text-slate-800">{t('doctorStatement.doctorInfo')}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 w-24">{t('doctors.name')}:</span>
                        <span className="font-medium text-slate-800">{dentist.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 w-24">{t('doctors.specialization')}:</span>
                        <span className="font-medium text-slate-800">{dentist.specialization || '-'}</span>
                    </div>
                </div>
            </section>

            {/* Treatments Table */}
            <section className="mb-8 break-inside-avoid">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-slate-800">{t('doctorStatement.treatments')}</h3>
                </div>
                {doctorTreatmentRecords.length > 0 ? (
                    <table className="w-full text-sm border-collapse rounded-xl overflow-hidden border border-slate-200">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-3 text-right font-semibold border border-slate-200">{t('treatments.date')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-200">{t('treatments.patient')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-200">{t('treatments.treatment')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-200">{t('treatments.doctorShare')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctorTreatmentRecords.map((tr, index) => {
                                const patient = patients.find(p => p.id === tr.patientId);
                                return (
                                    <tr key={tr.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                        <td className="p-3 border border-slate-200">{shortDateFormatter.format(new Date(tr.treatmentDate))}</td>
                                        <td className="p-3 border border-slate-200">{patient?.name || '-'}</td>
                                        <td className="p-3 border border-slate-200">
                                            {clinicData.treatmentDefinitions.find(td => td.id === tr.treatmentDefinitionId)?.name || '-'}
                                        </td>
                                        <td className="p-3 border border-slate-200 text-blue-600 font-medium">{currencyFormatter.format(tr.doctorShare)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-slate-500">{t('doctorStatement.noTreatments')}</p>
                    </div>
                )}
            </section>

            {/* Payments Table */}
            <section className="mb-8 break-inside-avoid">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-slate-800">{t('financials.payments')}</h3>
                </div>
                {doctorPaymentsFiltered.length > 0 ? (
                    <table className="w-full text-sm border-collapse rounded-xl overflow-hidden border border-slate-200">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-3 text-right font-semibold border border-slate-200">{t('expenses.date')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-200">{t('expenses.description')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-200">{t('expenses.amount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctorPaymentsFiltered.map((dp, index) => (
                                <tr key={dp.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                    <td className="p-3 border border-slate-200">{shortDateFormatter.format(new Date(dp.date))}</td>
                                    <td className="p-3 border border-slate-200">{dp.notes || '-'}</td>
                                    <td className="p-3 border border-slate-200 text-emerald-600 font-medium">{currencyFormatter.format(dp.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-slate-500">{t('doctorStatement.noPayments')}</p>
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer className="text-center mt-8 pt-4 border-t border-slate-200 break-inside-avoid">
                <div className="flex justify-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                    <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                    <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                </div>
                <p className="text-xs text-slate-500">{t('patientReport.footer')}</p>
            </footer>
        </div>
    );
};

export default PrintableDoctorStatement;
