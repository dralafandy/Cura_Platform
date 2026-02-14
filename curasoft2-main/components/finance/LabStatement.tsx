import React, { useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { Supplier, LabCase, LabCaseStatus } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { useTheme } from '../../contexts/ThemeContext';

// Print styles embedded for lab statement
const printStyles = `
    @media print {
        @page { size: A4; margin: 1cm; }
        body { font-family: Cairo, sans-serif; font-size: 12px; }
        .break-inside-avoid { page-break-inside: avoid; }
        .w-full { width: 100%; }
        .min-h-screen { min-height: 100vh; }
        .p-8 { padding: 32px; }
        .p-6 { padding: 24px; }
        .p-4 { padding: 16px; }
        .p-3 { padding: 12px; }
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .mb-10 { margin-bottom: 40px; }
        .mt-4 { margin-top: 16px; }
        .mt-6 { margin-top: 24px; }
        .mt-12 { margin-top: 48px; }
        .pt-4 { padding-top: 16px; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-sm { font-size: 14px; }
        .text-lg { font-size: 18px; }
        .text-xl { font-size: 20px; }
        .text-2xl { font-size: 24px; }
        .text-3xl { font-size: 30px; }
        .font-bold { font-weight: 700; }
        .grid { display: grid; }
        .grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
        .gap-2 { gap: 8px; }
        .gap-4 { gap: 16px; }
        .gap-8 { gap: 32px; }
        .gap-x-8 { column-gap: 32px; }
        .border { border: 1px solid #cbd5e1; }
        .border-b { border-bottom: 1px solid #cbd5e1; }
        .border-t { border-top: 1px solid #cbd5e1; }
        .rounded-lg { border-radius: 8px; }
        .bg-white { background: #fff; }
        .bg-slate-50 { background: #f8fafc; }
        .bg-slate-100 { background: #f1f5f9; }
        .text-slate-500 { color: #64748b; }
        .text-slate-600 { color: #475569; }
        .text-slate-700 { color: #334155; }
        .text-slate-800 { color: #1e293b; }
        .text-red-600 { color: #dc2626; }
        .text-primary-dark { color: #0f766e; }
        .shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: right; }
        thead { background: #f1f5f9; }
        img { max-width: 100%; height: auto; }
        .w-20 { width: 80px; }
        .h-20 { height: 80px; }
        .object-contain { object-fit: contain; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .dark { color-scheme: light; }
        .dark\\:bg-slate-800 { background: #fff !important; }
        .dark\\:text-white { color: #1e293b !important; }
        .dark\\:text-slate-200 { color: #475569 !important; }
        .dark\\:text-slate-300 { color: #64748b !important; }
        .dark\\:text-slate-400 { color: #94a3b8 !important; }
        .dark\\:border-slate-700 { border-color: #cbd5e1 !important; }
        .dark\\:bg-slate-700\\/50 { background: #f8fafc !important; }
    }
`;

interface LabStatementProps {
    supplier: Supplier;
    clinicData: ClinicData;
}

const LabStatement: React.FC<LabStatementProps> = ({ supplier, clinicData }) => {
    const { t, locale } = useI18n();
    const { isDark } = useTheme();
    const { clinicInfo, labCases, patients } = clinicData;

    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    const shortDateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    const relatedLabCases = useMemo(() => {
        return labCases.filter(lc => lc.labId === supplier.id)
            .sort((a, b) => new Date(a.sentDate).getTime() - new Date(b.sentDate).getTime());
    }, [labCases, supplier.id]);

    const labCaseSummary = useMemo(() => {
        const totalCases = relatedLabCases.length;
        const totalCost = relatedLabCases.reduce((sum, lc) => sum + lc.labCost, 0);
        return { totalCases, totalCost };
    }, [relatedLabCases]);

    if (supplier.type !== 'Dental Lab') {
        return (
            <div className={`p-8 text-slate-900 text-center ${isDark ? 'dark:bg-slate-800' : 'bg-white'}`} dir={locale === 'ar' ? 'rtl' : 'ltr'} style={{ width: '210mm', margin: '0 auto' }}>
                <style>{printStyles}</style>
                <h1 className="text-3xl font-bold text-red-600 mb-4">{t('supplierStatement.notDentalLab')}</h1>
                <p className="text-md text-slate-700">{t('supplierStatement.selectDentalLab')}</p>
            </div>
        );
    }

    return (
        <div className={`p-8 text-slate-900 ${isDark ? 'dark:bg-slate-800 dark:text-white' : 'bg-white'}`} dir={locale === 'ar' ? 'rtl' : 'ltr'} style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontSize: '12px', lineHeight: '1.4' }}>
            <style>{printStyles}</style>
            
            {/* Gradient Header */}
            <header className="text-center mb-10 break-inside-avoid">
                <div className={`rounded-xl p-6 mb-6 border ${isDark ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700' : 'bg-white border-slate-200'} shadow-lg`}>
                    <div className="flex flex-col items-center gap-4 mb-4">
                        {clinicInfo.logo && (
                            <img 
                                src={clinicInfo.logo} 
                                alt="شعار العيادة" 
                                className="w-24 h-24 object-contain rounded-lg shadow-md"
                            />
                        )}
                        <div className="text-center">
                            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{clinicInfo.name || t('appName')}</h1>
                            <div className={`flex items-center justify-center gap-2 mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                {clinicInfo.address && (
                                    <p className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {clinicInfo.address}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-4 mt-2 text-sm">
                                {clinicInfo.phone && (
                                    <p className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        {clinicInfo.phone}
                                    </p>
                                )}
                                {clinicInfo.email && (
                                    <p className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        {clinicInfo.email}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statement Title */}
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl border shadow-md ${isDark ? 'bg-gradient-to-r from-primary/20 to-primary-dark/20 border-primary/30' : 'bg-gradient-to-r from-violet-100 to-purple-100 border-violet-200'}`}>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-primary/30' : 'bg-violet-200'}`}>
                        <svg className={`w-6 h-6 ${isDark ? 'text-primary-300' : 'text-violet-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div className="text-right">
                        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t('supplierStatement.caseTitle')}</h2>
                        <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('patientReport.generatedOn', { date: dateFormatter.format(new Date()) })}</p>
                    </div>
                </div>
            </header>

            {/* Supplier Info Section */}
            <section className={`mb-8 p-6 rounded-xl border shadow-sm ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-primary/20 text-primary-300' : 'bg-primary/10 text-primary'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{t('supplierStatement.caseDetails')}</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white'}`}>
                        <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('suppliers.supplierName')}</p>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{supplier.name}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white'}`}>
                        <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('suppliers.contactPerson')}</p>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{supplier.contact_person || '-'}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white'}`}>
                        <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('suppliers.phone')}</p>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{supplier.phone || '-'}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white'}`}>
                        <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('suppliers.email')}</p>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{supplier.email || '-'}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-primary/20' : 'bg-violet-50'}`}>
                        <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('supplierStatement.totalCases')}</p>
                        <p className={`text-2xl font-bold ${isDark ? 'text-primary-300' : 'text-violet-700'}`}>{labCaseSummary.totalCases}</p>
                    </div>
                    <div className={`text-center p-4 rounded-lg ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}>
                        <p className={`text-xs mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('supplierStatement.totalCost')}</p>
                        <p className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{currencyFormatter.format(labCaseSummary.totalCost)}</p>
                    </div>
                </div>
            </section>

            {/* Lab Cases Table */}
            <section className="mb-10 break-inside-avoid">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-primary/20 text-primary-300' : 'bg-primary/10 text-primary'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    </div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{t('labCases.labCaseTracker')}</h3>
                </div>
                {relatedLabCases.length > 0 ? (
                    <div className={`rounded-xl overflow-hidden border shadow-sm ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <table className="w-full text-md border-collapse">
                            <thead className={isDark ? 'bg-slate-800' : 'bg-slate-100'}>
                                <tr>
                                    <th className={`p-3 text-right font-semibold border ${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-700'}`}>{t('labCases.patient')}</th>
                                    <th className={`p-3 text-right font-semibold border ${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-700'}`}>{t('labCases.caseType')}</th>
                                    <th className={`p-3 text-right font-semibold border ${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-700'}`}>{t('labCases.sentDate')}</th>
                                    <th className={`p-3 text-right font-semibold border ${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-700'}`}>{t('labCases.dueDate')}</th>
                                    <th className={`p-3 text-right font-semibold border ${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-700'}`}>{t('labCases.status')}</th>
                                    <th className={`p-3 text-right font-semibold border ${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-700'}`}>{t('labCases.cost')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {relatedLabCases.map(lc => {
                                    const patient = patients.find(p => p.id === lc.patientId);
                                    const getStatusColor = (status: string) => {
                                        switch (status) {
                                            case 'DRAFT': return isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700';
                                            case 'SENT_TO_LAB': return isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700';
                                            case 'RECEIVED_FROM_LAB': return isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700';
                                            case 'FITTED_TO_PATIENT': return isDark ? 'bg-emerald-900 text-emerald-200' : 'bg-emerald-100 text-emerald-700';
                                            case 'CANCELLED': return isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700';
                                            default: return isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700';
                                        }
                                    };
                                    return (
                                        <tr key={lc.id} className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                            <td className={`p-3 border ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'}`}>{patient?.name || t('common.unknownPatient')}</td>
                                            <td className={`p-3 border ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'}`}>{lc.caseType}</td>
                                            <td className={`p-3 border ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'}`}>{shortDateFormatter.format(new Date(lc.sentDate))}</td>
                                            <td className={`p-3 border ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'}`}>{shortDateFormatter.format(new Date(lc.dueDate))}</td>
                                            <td className={`p-3 border ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(lc.status)}`}>
                                                    {t(`labCaseStatus.${lc.status}`)}
                                                </span>
                                            </td>
                                            <td className={`p-3 border ${isDark ? 'border-slate-700 text-emerald-400' : 'border-slate-300 text-emerald-600'}`}>{currencyFormatter.format(lc.labCost)}</td>
                                        </tr>
                                    );
                                })}
                                <tr className={isDark ? 'bg-slate-800' : 'bg-slate-50'}>
                                    <td colSpan={5} className={`p-3 text-right font-bold border ${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-800'}`}>{t('supplierStatement.totalCost')}:</td>
                                    <td className={`p-3 text-right font-bold border ${isDark ? 'border-slate-700 text-emerald-400' : 'border-slate-300 text-emerald-600'}`}>{currencyFormatter.format(labCaseSummary.totalCost)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className={`text-center py-8 rounded-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'} mb-4`}>
                            <svg className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('labCases.noCasesRecorded')}</p>
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer className={`text-center mt-12 pt-6 border-t ${isDark ? 'text-slate-500 border-slate-700' : 'text-slate-500 border-slate-200'}`}>
                <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-sm">{t('patientReport.footer')}</p>
                </div>
            </footer>
        </div>
    );
};

export default LabStatement;
