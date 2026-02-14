import React from 'react';
import { useI18n } from '../../hooks/useI18n';
import { useClinicData } from '../../hooks/useClinicData';

interface PrintableAccountDetailsProps {
  accountData: {
    entityName: string;
    transactions: Array<{
      id: string;
      date: string;
      description: string;
      debit: number;
      credit: number;
      balance: number;
      type: string;
    }>;
    summary: {
      totalDebit: number;
      totalCredit: number;
      balance: number;
    };
  };
  currencyFormatter: Intl.NumberFormat;
  selectedAccountType: string;
}

const PrintableAccountDetails: React.FC<PrintableAccountDetailsProps> = ({
  accountData,
  currencyFormatter,
  selectedAccountType
}) => {
  const { t, locale } = useI18n();
  const { clinicInfo } = useClinicData();
  const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' });

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
          <h2 className="text-lg font-semibold">{t('financialAccounts.accountDetails.title')}</h2>
        </div>
        
        <div className="bg-slate-100 inline-block px-4 py-2 rounded-lg">
          <p className="text-slate-700 font-medium">{accountData.entityName}</p>
          <p className="text-sm text-slate-500">{t(`financialAccounts.accountDetails.accountTypes.${selectedAccountType}`)}</p>
        </div>
      </header>

      <main>
        {/* Account Summary Cards */}
        <div className="mb-6 break-inside-avoid">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            {t('financialAccounts.accountDetails.accountSummary')}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200 text-center">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <div className="text-xl font-bold text-red-600">{currencyFormatter.format(accountData.summary.totalDebit)}</div>
              <div className="text-sm text-slate-600 mt-1">{t('financialAccounts.accountDetails.totalDebit')}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 text-center">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
              <div className="text-xl font-bold text-green-600">{currencyFormatter.format(accountData.summary.totalCredit)}</div>
              <div className="text-sm text-slate-600 mt-1">{t('financialAccounts.accountDetails.totalCredit')}</div>
            </div>
            <div className={`bg-gradient-to-br ${accountData.summary.balance >= 0 ? 'from-blue-50 to-blue-100' : 'from-amber-50 to-amber-100'} rounded-xl p-4 border ${accountData.summary.balance >= 0 ? 'border-blue-200' : 'border-amber-200'} text-center`}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className={`text-xl font-bold ${accountData.summary.balance >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                {currencyFormatter.format(accountData.summary.balance)}
              </div>
              <div className="text-sm text-slate-600 mt-1">{t('financialAccounts.accountDetails.balance')}</div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="mb-6 break-inside-avoid">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            {t('financialAccounts.accountDetails.transactions')}
          </h3>
          <table className="w-full text-sm border-collapse rounded-xl overflow-hidden shadow-sm">
            <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <tr>
                <th className="p-3 text-right font-semibold">{t('financialAccounts.accountDetails.columns.date')}</th>
                <th className="p-3 text-right font-semibold">{t('financialAccounts.accountDetails.columns.description')}</th>
                <th className="p-3 text-right font-semibold">{t('financialAccounts.accountDetails.columns.debit')}</th>
                <th className="p-3 text-right font-semibold">{t('financialAccounts.accountDetails.columns.credit')}</th>
                <th className="p-3 text-right font-semibold">{t('financialAccounts.accountDetails.columns.balance')}</th>
              </tr>
            </thead>
            <tbody>
              {accountData.transactions.map((transaction, index) => (
                <tr key={transaction.id} className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                  <td className="p-3 border-x border-slate-200">{dateFormatter.format(new Date(transaction.date))}</td>
                  <td className="p-3 border-x border-slate-200">
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${transaction.type === 'debit' ? 'bg-red-400' : 'bg-green-400'}`}></span>
                      {transaction.description}
                    </span>
                  </td>
                  <td className="p-3 border-x border-slate-200 text-red-600">{transaction.debit > 0 ? currencyFormatter.format(transaction.debit) : '-'}</td>
                  <td className="p-3 border-x border-slate-200 text-green-600">{transaction.credit > 0 ? currencyFormatter.format(transaction.credit) : '-'}</td>
                  <td className="p-3 border-x border-slate-200 font-medium">{currencyFormatter.format(transaction.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center mt-6 pt-4 border-t-2 border-slate-100 break-inside-avoid">
        <div className="flex justify-center gap-2 mb-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
        </div>
        <p className="text-xs text-slate-500">{t('reports.generatedOn')} {new Date().toLocaleString()}</p>
      </footer>
    </div>
  );
};

export default PrintableAccountDetails;
