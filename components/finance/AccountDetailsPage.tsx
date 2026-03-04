import React, { useState, useEffect } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../contexts/AuthContext';
import { useReportsFilters } from '../../contexts/ReportsFilterContext';
import { Permission } from '../../types';
import FinancialFilters from './FinancialFilters';
import AccountDetailsTab from './AccountDetailsTab';
import PrintableAccountDetails from './PrintableAccountDetails';

const AccountDetailsPage: React.FC = () => {
  const { t, locale } = useI18n();
  const { hasPermission } = useAuth();
  const { filters: reportsFilters, resetFilters } = useReportsFilters();
  
  const [filters, setFilters] = useState({
    startDate: reportsFilters.startDate,
    endDate: reportsFilters.endDate,
  });
  const [isPrinting, setIsPrinting] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  // Sync with reports filters when they change
  useEffect(() => {
    setFilters({
      startDate: reportsFilters.startDate,
      endDate: reportsFilters.endDate,
    });
  }, [reportsFilters.startDate, reportsFilters.endDate]);

  const currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' });

  if (!hasPermission(Permission.FINANCE_ACCOUNTS_VIEW)) {
    return <div className="text-center py-8 text-slate-700 dark:text-slate-300">{t('common.accessDenied')}</div>;
  }

  const handlePrint = (accountData: any, selectedAccountType: string) => {
    setPrintData({ accountData, selectedAccountType });
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
      setPrintData(null);
    }, 100);
  };

  if (isPrinting && printData) {
    return (
      <PrintableAccountDetails
        accountData={printData.accountData}
        currencyFormatter={currencyFormatter}
        selectedAccountType={printData.selectedAccountType}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('financialAccounts.accountDetails.title')}</h2>
        <div className="flex gap-2">
          <button 
            onClick={resetFilters}
            className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('financialFilters.clearAll')}
          </button>
          <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark">
            {t('financialAccounts.export')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <FinancialFilters filters={filters} onFiltersChange={setFilters} />

      {/* Account Details Content */}
      <AccountDetailsTab
        filters={filters}
        currencyFormatter={currencyFormatter}
        onPrint={handlePrint}
      />
    </div>
  );
};

export default AccountDetailsPage;
