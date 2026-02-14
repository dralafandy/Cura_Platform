import React, { useMemo } from 'react';
import { ClinicData } from '../../hooks/useClinicData';
import { Supplier, SupplierInvoice, PaymentMethod } from '../../types';
import { useI18n } from '../../hooks/useI18n';

// Print styles embedded for supplier statement
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
        .mb-10 { margin-bottom: 32px; }
        .mt-4 { margin-top: 12px; }
        .mt-6 { margin-top: 16px; }
        .mt-8 { margin-top: 24px; }
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
        .gap-6 { gap: 16px; }
        .border { border: 1px solid #e2e8f0; }
        .border-b { border-bottom: 1px solid #e2e8f0; }
        .rounded-lg { border-radius: 8px; }
        .rounded-xl { border-radius: 12px; }
        .bg-white { background: #fff; }
        .bg-slate-50 { background: #f8fafc; }
        .bg-slate-100 { background: #f1f5f9; }
        .bg-emerald-50 { background: #ecfdf5; }
        .bg-blue-50 { background: #eff6ff; }
        .bg-amber-50 { background: #fffbeb; }
        .text-slate-500 { color: #64748b; }
        .text-slate-600 { color: #475569; }
        .text-slate-700 { color: #334155; }
        .text-slate-800 { color: #1e293b; }
        .text-emerald-600 { color: #059669; }
        .text-blue-600 { color: #2563eb; }
        .text-amber-600 { color: #d97706; }
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
        .w-20 { width: 80px; }
        .h-20 { height: 80px; }
        .object-contain { object-fit: contain; }
        .border-emerald-200 { border-color: #a7f3d0; }
        .border-blue-200 { border-color: #bfdbfe; }
    }
`;

interface SupplierStatementProps {
    supplier: Supplier;
    clinicData: ClinicData;
}

const SupplierStatement: React.FC<SupplierStatementProps> = ({ supplier, clinicData }) => {
    const { t, locale } = useI18n();
    const { clinicInfo, supplierInvoices, expenses } = clinicData;

    const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    const shortDateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

    const relatedInvoices = useMemo(() => {
        return supplierInvoices.filter(inv => inv.supplierId === supplier.id)
            .sort((a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime());
    }, [supplierInvoices, supplier.id]);

    const allPaymentsToSupplier = useMemo(() => {
        return expenses.filter(exp => exp.supplierId === supplier.id)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [expenses, supplier.id]);

    const financialSummary = useMemo(() => {
        const totalBilled = relatedInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        const totalPaid = allPaymentsToSupplier.reduce((sum, exp) => sum + exp.amount, 0);
        const outstandingBalance = totalBilled - totalPaid;
        return { totalBilled, totalPaid, outstandingBalance };
    }, [relatedInvoices, allPaymentsToSupplier]);

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

                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 px-6 py-2 rounded-full border border-emerald-200 mb-3">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h2 className="text-lg font-bold">{t('supplierStatement.financialTitle')}</h2>
                </div>
                <p className="text-xs text-slate-500">{t('patientReport.generatedOn', { date: dateFormatter.format(new Date()) })}</p>
            </header>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-4 gap-3 mb-8 break-inside-avoid">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{t('invoices.billed')}</p>
                    <p className="text-base font-bold text-blue-600">{currencyFormatter.format(financialSummary.totalBilled)}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-center">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{t('invoices.paidAmount')}</p>
                    <p className="text-base font-bold text-emerald-600">{currencyFormatter.format(financialSummary.totalPaid)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{t('invoices.remaining')}</p>
                    <p className="text-base font-bold text-amber-600">{currencyFormatter.format(financialSummary.outstandingBalance)}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{t('invoices.totalInvoices')}</p>
                    <p className="text-base font-bold text-blue-600">{relatedInvoices.length}</p>
                </div>
            </div>

            {/* Supplier Info */}
            <section className="mb-8 p-4 rounded-xl bg-slate-50 border border-slate-200 break-inside-avoid">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h3 className="text-base font-bold text-slate-800">{t('supplierStatement.statementDetails')}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 w-24">{t('suppliers.supplierName')}:</span>
                        <span className="font-medium text-slate-800">{supplier.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 w-24">{t('suppliers.contactPerson')}:</span>
                        <span className="font-medium text-slate-800">{supplier.contact_person || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 w-24">{t('suppliers.phone')}:</span>
                        <span className="font-medium text-slate-800">{supplier.phone || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 w-24">{t('suppliers.email')}:</span>
                        <span className="font-medium text-slate-800">{supplier.email || '-'}</span>
                    </div>
                </div>
            </section>

            {/* Invoices Table */}
            <section className="mb-8 break-inside-avoid">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-slate-800">{t('invoices.title')}</h3>
                </div>
                {relatedInvoices.length > 0 ? (
                    <table className="w-full text-sm border-collapse rounded-xl overflow-hidden border border-slate-200">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-3 text-right font-semibold border border-slate-200">{t('invoices.date')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-200">{t('invoices.invoiceNumber')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-200">{t('invoices.billed')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-200">{t('invoices.paidAmount')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-200">{t('invoices.remaining')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {relatedInvoices.map((inv, index) => {
                                const totalPaidForInvoice = inv.payments.reduce((sum, p) => sum + p.amount, 0);
                                const balance = inv.amount - totalPaidForInvoice;
                                return (
                                    <tr key={inv.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                        <td className="p-3 border border-slate-200">{shortDateFormatter.format(new Date(inv.invoiceDate))}</td>
                                        <td className="p-3 border border-slate-200">{inv.invoiceNumber || inv.id.slice(-6)}</td>
                                        <td className="p-3 border border-slate-200 text-blue-600 font-medium">{currencyFormatter.format(inv.amount)}</td>
                                        <td className="p-3 border border-slate-200 text-emerald-600">{currencyFormatter.format(totalPaidForInvoice)}</td>
                                        <td className="p-3 border border-slate-200 text-amber-600 font-medium">{currencyFormatter.format(balance)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-slate-500">{t('invoices.noInvoices')}</p>
                    </div>
                )}
            </section>

            {/* Payments Table */}
            <section className="mb-8 break-inside-avoid">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-slate-800">{t('financials.payments')}</h3>
                </div>
                {allPaymentsToSupplier.length > 0 ? (
                    <table className="w-full text-sm border-collapse rounded-xl overflow-hidden border border-slate-200">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-3 text-right font-semibold border border-slate-200">{t('expenses.date')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-200">{t('expenses.description')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-200">{t('expenses.category')}</th>
                                <th className="p-3 text-right font-semibold border border-slate-200">{t('expenses.amount')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allPaymentsToSupplier.map((exp, index) => (
                                <tr key={exp.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                    <td className="p-3 border border-slate-200">{shortDateFormatter.format(new Date(exp.date))}</td>
                                    <td className="p-3 border border-slate-200">{exp.description}</td>
                                    <td className="p-3 border border-slate-200">{t(`expenseCategory.${exp.category}`)}</td>
                                    <td className="p-3 border border-slate-200 text-emerald-600 font-medium">{currencyFormatter.format(exp.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-slate-500">{t('supplierStatement.noPaymentsRecorded')}</p>
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

export default SupplierStatement;
