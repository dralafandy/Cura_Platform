import React, { useMemo } from 'react';
import { SupplierInvoice } from '../../types';
import { useClinicData } from '../../hooks/useClinicData';
import { useI18n } from '../../hooks/useI18n';
import FinancialTable from './FinancialTable';

interface SummaryData {
  clinicRevenue: number;
  totalPayments: number;
  operatingExpenses: number;
  doctorPayments: number;
  totalSupplierInvoices: number;
  unpaidInvoices: number;
  netProfit: number;
  cashFlow: number;
  totalRevenue: number;
  totalExpenses: number;
  totalDoctorPayments: number;
}

interface BalancesTabProps {
  summaryData: SummaryData;
  supplierInvoices: SupplierInvoice[];
  filters: {
    startDate: string;
    endDate: string;
  };
  currencyFormatter: Intl.NumberFormat;
}

const BalancesTab: React.FC<BalancesTabProps> = ({
  summaryData,
  supplierInvoices,
  filters,
  currencyFormatter,
}) => {
  const { t, locale } = useI18n();
  const { suppliers } = useClinicData();

  const filteredInvoices = useMemo(() => {
    let filtered = supplierInvoices;

    // Date filtering
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(i => new Date(i.invoiceDate) >= startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(i => new Date(i.invoiceDate) <= endDate);
    }


    return filtered;
  }, [supplierInvoices, filters]);

  const balanceData = useMemo(() => {
    const unpaidInvoices = filteredInvoices.filter(inv => inv.status === 'UNPAID');
    const paidInvoices = filteredInvoices.filter(inv => inv.status === 'PAID');

    return {
      unpaidInvoices,
      paidInvoices,
      totalUnpaid: unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      totalPaid: paidInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    };
  }, [filteredInvoices]);

  const columns = [
    {
      key: 'invoiceNumber',
      header: t('balancesTab.invoiceNumber'),
      render: (item: any) => item.invoiceNumber || item.id.slice(-8),
    },
    {
      key: 'supplier',
      header: t('balancesTab.supplier'),
      render: (item: any) => suppliers.find(s => s.id === item.supplierId)?.name || t('common.unknown'),
    },
    {
      key: 'invoiceDate',
      header: t('balancesTab.invoiceDate'),
      render: (item: any) => new Date(item.invoiceDate).toLocaleDateString(locale),
    },
    {
      key: 'dueDate',
      header: t('balancesTab.dueDate'),
      render: (item: any) => item.dueDate ? new Date(item.dueDate).toLocaleDateString(locale) : '-',
    },
    {
      key: 'amount',
      header: t('balancesTab.amount'),
      render: (item: any) => currencyFormatter.format(item.amount),
    },
    {
      key: 'status',
      header: t('balancesTab.status'),
      render: (item: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.status === 'PAID'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {t(`supplierInvoiceStatus.${item.status}`)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{t('balancesTab.netProfit')}</p>
              <p className={`text-3xl font-bold ${summaryData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currencyFormatter.format(summaryData.netProfit)}
              </p>
            </div>
            <div className="text-4xl opacity-20">📈</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{t('balancesTab.cashFlow')}</p>
              <p className={`text-3xl font-bold ${summaryData.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currencyFormatter.format(summaryData.cashFlow)}
              </p>
            </div>
            <div className="text-4xl opacity-20">💹</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{t('balancesTab.unpaidInvoices')}</p>
              <p className="text-3xl font-bold text-slate-800">{currencyFormatter.format(balanceData.totalUnpaid)}</p>
            </div>
            <div className="text-4xl opacity-20">⏳</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{t('balancesTab.paidInvoices')}</p>
              <p className="text-3xl font-bold text-slate-800">{currencyFormatter.format(balanceData.totalPaid)}</p>
            </div>
            <div className="text-4xl opacity-20">✅</div>
          </div>
        </div>
      </div>

      {/* Balance Sheet */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-slate-800 mb-6">{t('balancesTab.balanceSheet')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-medium text-slate-700 mb-4">{t('balancesTab.assets')}</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">{t('balancesTab.cashAndEquivalents')}</span>
                <span className="font-semibold text-slate-800">
                  {currencyFormatter.format(summaryData.cashFlow)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">{t('balancesTab.accountsReceivable')}</span>
                <span className="font-semibold text-slate-800">
                  {currencyFormatter.format(summaryData.totalRevenue - summaryData.totalPayments)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 font-bold text-lg border-t border-slate-300 pt-3">
                <span className="text-slate-800">{t('balancesTab.totalAssets')}</span>
                <span className="text-slate-800">
                  {currencyFormatter.format(
                    (summaryData.totalPayments - summaryData.totalExpenses - summaryData.totalDoctorPayments) +
                    (summaryData.totalRevenue - summaryData.totalPayments)
                  )}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-medium text-slate-700 mb-4">{t('balancesTab.liabilities')}</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">{t('balancesTab.accountsPayable')}</span>
                <span className="font-semibold text-slate-800">
                  {currencyFormatter.format(balanceData.totalUnpaid)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">{t('balancesTab.otherLiabilities')}</span>
                <span className="font-semibold text-slate-800">{currencyFormatter.format(0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 font-bold text-lg border-t border-slate-300 pt-3">
                <span className="text-slate-800">{t('balancesTab.totalLiabilities')}</span>
                <span className="text-slate-800">{currencyFormatter.format(balanceData.totalUnpaid)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex justify-between items-center py-3 font-bold text-xl">
            <span className="text-slate-800">{t('balancesTab.equity')}</span>
            <span className={`text-slate-800 ${summaryData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {currencyFormatter.format(summaryData.netProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Supplier Invoices Table */}
      <FinancialTable
        data={filteredInvoices}
        columns={columns}
        title={t('balancesTab.supplierInvoices')}
        emptyMessage={t('balancesTab.noInvoices')}
      />
    </div>
  );
};

export default BalancesTab;