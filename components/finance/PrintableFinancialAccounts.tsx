import React, { useMemo } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { ClinicData, useClinicData } from '../../hooks/useClinicData';
import { Payment, Expense, TreatmentRecord, DoctorPayment, SupplierInvoice } from '../../types';

interface PrintableFinancialAccountsProps {
  clinicData: ClinicData;
  activeTab: 'revenue' | 'expenses' | 'balances';
  filters: {
    startDate: string;
    endDate: string;
    dentistId?: string;
    supplierId?: string;
    category?: string;
  };
  summaryData: {
    totalRevenue: number;
    totalPayments: number;
    totalExpenses: number;
    totalDoctorPayments: number;
    totalSupplierInvoices: number;
    unpaidInvoices: number;
    netProfit: number;
    cashFlow: number;
  };
}

const PrintTable: React.FC<{title: string, headers: string[], data: (string|number)[][], accentColor?: string}> = ({ title, headers, data, accentColor = 'blue' }) => {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-green-500 to-emerald-600',
    red: 'from-red-500 to-rose-600',
    purple: 'from-purple-500 to-violet-600',
    amber: 'from-amber-500 to-orange-600',
    teal: 'from-teal-500 to-cyan-600',
  };

  return (
    <div className="mb-6 break-inside-avoid">
      <h4 className="text-md font-bold text-slate-800 mb-3 flex items-center gap-2">
        <div className={`w-6 h-6 bg-gradient-to-br ${colorClasses[accentColor] || colorClasses.blue} rounded-lg flex items-center justify-center`}>
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        {title}
      </h4>
      <table className="w-full text-sm border-collapse rounded-xl overflow-hidden shadow-sm">
        <thead className={`bg-gradient-to-r ${colorClasses[accentColor] || colorClasses.blue} text-white`}>
          <tr>
            {headers.map(h => <th key={h} className="p-3 text-right font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
              {row.map((cell, j) => <td key={j} className="p-3 border-x border-slate-200">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const PrintableFinancialAccounts: React.FC<PrintableFinancialAccountsProps> = ({
  clinicData,
  activeTab,
  filters,
  summaryData
}) => {
  const { t, locale } = useI18n();
  const { clinicInfo } = useClinicData();
  const { payments, expenses, treatmentRecords, doctorPayments, supplierInvoices, patients, dentists, suppliers } = clinicData;

  const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });
  const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });

  const filterDataByDate = <T extends Record<F, string | Date>, F extends keyof T>(data: T[], dateField: F): T[] => {
    if (!filters.startDate || !filters.endDate) return data;
    const start = new Date(filters.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);

    return data.filter(item => {
      const dateValue: string | Date = item[dateField];
      const itemDate = new Date(dateValue);
      return !isNaN(itemDate.getTime()) && itemDate >= start && itemDate <= end;
    });
  };

  const filteredPayments = useMemo(() => {
    let filtered = filterDataByDate(payments, 'date');
    if (filters.dentistId) {
      filtered = filtered.filter(p => {
        const treatment = treatmentRecords.find(tr => tr.patientId === p.patientId);
        return treatment?.dentistId === filters.dentistId;
      });
    }
    return filtered;
  }, [payments, filters, treatmentRecords]);

  const filteredExpenses = useMemo(() => {
    let filtered = filterDataByDate(expenses, 'date');
    if (filters.category) {
      filtered = filtered.filter(e => e.category === filters.category);
    }
    return filtered;
  }, [expenses, filters]);

  const filteredDoctorPayments = useMemo(() => {
    let filtered = filterDataByDate(doctorPayments, 'date');
    if (filters.dentistId) {
      filtered = filtered.filter(dp => dp.dentistId === filters.dentistId);
    }
    return filtered;
  }, [doctorPayments, filters]);

  const filteredSupplierInvoices = useMemo(() => {
    let filtered = filterDataByDate(supplierInvoices, 'invoiceDate');
    if (filters.supplierId) {
      filtered = filtered.filter(si => si.supplierId === filters.supplierId);
    }
    return filtered;
  }, [supplierInvoices, filters]);

  const filteredTreatmentRecords = useMemo(() => {
    let filtered = filterDataByDate(treatmentRecords, 'treatmentDate');
    if (filters.dentistId) {
      filtered = filtered.filter(tr => tr.dentistId === filters.dentistId);
    }
    return filtered;
  }, [treatmentRecords, filters]);

  const tabTitles = {
    revenue: t('financialAccounts.tabs.revenue'),
    expenses: t('financialAccounts.tabs.expenses'),
    balances: t('financialAccounts.tabs.balances'),
  };

  const tabColors = {
    revenue: 'green',
    expenses: 'red',
    balances: 'blue',
  };

  return (
    <div className="p-4 bg-white text-slate-900" dir="rtl" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontSize: '12px', lineHeight: '1.4' }}>
      {/* Header */}
      <header className="text-center mb-6 break-inside-avoid">
        <div className="bg-white rounded-xl p-4 mb-4 border border-slate-200">
          <div className="flex flex-col items-center gap-3 mb-2">
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

        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-900 px-6 py-2 rounded-full border border-blue-200 mb-3">
          <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-lg font-semibold">{t('financialAccounts.title')} - {tabTitles[activeTab]}</h2>
        </div>
        
        <p className="text-sm text-slate-600 bg-slate-100 inline-block px-4 py-2 rounded-full">
          {t('reports.dateRange')}: {filters.startDate ? dateFormatter.format(new Date(filters.startDate)) : t('common.na')} - {filters.endDate ? dateFormatter.format(new Date(filters.endDate)) : t('common.na')}
        </p>
      </header>

      <main>
        {/* Financial Summary Cards */}
        <div className="mb-6 break-inside-avoid">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            {t('financialSummary.title')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-700">{t('financialSummary.totalRevenue')}</p>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-xl font-bold text-green-600 mt-1">{currencyFormatter.format(summaryData.totalRevenue)}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-700">{t('financialSummary.totalPayments')}</p>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-xl font-bold text-blue-600 mt-1">{currencyFormatter.format(summaryData.totalPayments)}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-700">{t('financialSummary.totalExpenses')}</p>
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>
              <p className="text-xl font-bold text-red-600 mt-1">{currencyFormatter.format(summaryData.totalExpenses)}</p>
            </div>
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-violet-700">{t('financialSummary.netProfit')}</p>
                <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <p className="text-xl font-bold text-violet-600 mt-1">{currencyFormatter.format(summaryData.netProfit)}</p>
            </div>
          </div>
        </div>

        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <PrintTable
              title={t('revenueTab.payments')}
              headers={[t('revenueTab.patient'), t('revenueTab.amount'), t('revenueTab.date'), t('revenueTab.method')]}
              data={filteredPayments.map(payment => {
                const patient = patients.find(p => p.id === payment.patientId);
                return [
                  patient?.name || t('common.unknownPatient'),
                  currencyFormatter.format(payment.amount),
                  dateFormatter.format(new Date(payment.date)),
                  t(`paymentMethod.${payment.method}`)
                ];
              })}
              accentColor="green"
            />

            <PrintTable
              title={t('revenueTab.treatmentRecords')}
              headers={[t('revenueTab.patient'), t('revenueTab.treatment'), t('revenueTab.cost'), t('revenueTab.date'), t('revenueTab.dentist')]}
              data={filteredTreatmentRecords.map(record => {
                const patient = patients.find(p => p.id === record.patientId);
                const dentist = dentists.find(d => d.id === record.dentistId);
                const treatmentDef = clinicData.treatmentDefinitions.find(td => td.id === record.treatmentDefinitionId);
                return [
                  patient?.name || t('common.unknownPatient'),
                  treatmentDef?.name || t('common.unknownTreatment'),
                  currencyFormatter.format(record.totalTreatmentCost),
                  dateFormatter.format(new Date(record.treatmentDate)),
                  dentist?.name || t('common.unknownDentist')
                ];
              })}
              accentColor="blue"
            )}
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <PrintTable
              title={t('expensesTab.expenses')}
              headers={[t('expensesTab.description'), t('expensesTab.amount'), t('expensesTab.category'), t('expensesTab.date')]}
              data={filteredExpenses.map(expense => [
                expense.description,
                currencyFormatter.format(expense.amount),
                t(`expenseCategory.${expense.category}`),
                dateFormatter.format(new Date(expense.date))
              ])}
              accentColor="red"
            />

            <PrintTable
              title={t('expensesTab.doctorPayments')}
              headers={[t('expensesTab.dentist'), t('expensesTab.amount'), t('expensesTab.date'), t('expensesTab.notes')]}
              data={filteredDoctorPayments.map(payment => {
                const dentist = dentists.find(d => d.id === payment.dentistId);
                return [
                  dentist?.name || t('common.unknownDentist'),
                  currencyFormatter.format(payment.amount),
                  dateFormatter.format(new Date(payment.date)),
                  payment.notes || '-'
                ];
              })}
              accentColor="purple"
            />

            <PrintTable
              title={t('expensesTab.supplierInvoices')}
              headers={[t('expensesTab.supplier'), t('expensesTab.invoiceNumber'), t('expensesTab.amount'), t('expensesTab.date'), t('expensesTab.status')]}
              data={filteredSupplierInvoices.map(invoice => {
                const supplier = suppliers.find(s => s.id === invoice.supplierId);
                return [
                  supplier?.name || t('common.unknownSupplier'),
                  invoice.invoiceNumber || '-',
                  currencyFormatter.format(invoice.amount),
                  dateFormatter.format(new Date(invoice.invoiceDate)),
                  t(`supplierInvoiceStatus.${invoice.status}`)
                ];
              })}
              accentColor="amber"
            )}
          </div>
        )}

        {activeTab === 'balances' && (
          <div className="space-y-6">
            <PrintTable
              title={t('balancesTab.outstandingInvoices')}
              headers={[t('balancesTab.supplier'), t('balancesTab.invoiceNumber'), t('balancesTab.amount'), t('balancesTab.dueDate')]}
              data={filteredSupplierInvoices.filter(inv => inv.status === 'UNPAID').map(invoice => {
                const supplier = suppliers.find(s => s.id === invoice.supplierId);
                return [
                  supplier?.name || t('common.unknownSupplier'),
                  invoice.invoiceNumber || '-',
                  currencyFormatter.format(invoice.amount),
                  invoice.dueDate ? dateFormatter.format(new Date(invoice.dueDate)) : '-'
                ];
              })}
              accentColor="red"
            )}

            <div className="mb-6 break-inside-avoid">
              <h4 className="text-md font-bold text-slate-800 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                {t('balancesTab.cashFlowSummary')}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm text-blue-700">{t('balancesTab.totalCashFlow')}</p>
                  <p className="text-xl font-bold text-blue-600 mt-1">{currencyFormatter.format(summaryData.cashFlow)}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                  <p className="text-sm text-amber-700">{t('balancesTab.unpaidInvoices')}</p>
                  <p className="text-xl font-bold text-amber-600 mt-1">{currencyFormatter.format(summaryData.unpaidInvoices)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center mt-6 pt-4 border-t-2 border-slate-100 break-inside-avoid">
        <div className="flex justify-center gap-2 mb-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
        </div>
        <p className="text-xs text-slate-500">{t('reports.generatedOn')} {new Date().toLocaleString()}</p>
      </footer>
    </div>
  );
};

export default PrintableFinancialAccounts;
