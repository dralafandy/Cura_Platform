import React from 'react';
import { useI18n } from '../../hooks/useI18n';

interface SummaryData {
  clinicRevenue: number;
  totalPayments: number;
  operatingExpenses: number;
  doctorPayments: number;
  totalSupplierInvoices: number;
  unpaidInvoices: number;
  netProfit: number;
  cashFlow: number;
}

interface PrintableSummaryData {
  totalRevenue: number;
  totalPayments: number;
  totalExpenses: number;
  totalDoctorPayments: number;
  totalSupplierInvoices: number;
  unpaidInvoices: number;
  netProfit: number;
  cashFlow: number;
}

interface FinancialSummaryProps {
  summaryData: SummaryData;
  currencyFormatter: Intl.NumberFormat;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ summaryData, currencyFormatter }) => {
  const { t } = useI18n();

  const summaryCards = [
    {
      title: t('financialSummary.clinicRevenue'),
      value: summaryData.clinicRevenue,
      icon: '💰',
      color: 'border-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: t('financialSummary.totalPayments'),
      value: summaryData.totalPayments,
      icon: '💳',
      color: 'border-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: t('financialSummary.operatingExpenses'),
      value: summaryData.operatingExpenses,
      icon: '💸',
      color: 'border-red-500',
      bgColor: 'bg-red-50',
    },
    {
      title: t('financialSummary.doctorPayments'),
      value: summaryData.doctorPayments,
      icon: '👨‍⚕️',
      color: 'border-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: t('financialSummary.supplierInvoices'),
      value: summaryData.totalSupplierInvoices,
      icon: '📄',
      color: 'border-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: t('financialSummary.unpaidInvoices'),
      value: summaryData.unpaidInvoices,
      icon: '⏳',
      color: 'border-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      title: t('financialSummary.netProfit'),
      value: summaryData.netProfit,
      icon: summaryData.netProfit >= 0 ? '📈' : '📉',
      color: summaryData.netProfit >= 0 ? 'border-green-500' : 'border-red-500',
      bgColor: summaryData.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50',
    },
    {
      title: t('financialSummary.cashFlow'),
      value: summaryData.cashFlow,
      icon: summaryData.cashFlow >= 0 ? '💹' : '📊',
      color: summaryData.cashFlow >= 0 ? 'border-blue-500' : 'border-red-500',
      bgColor: summaryData.cashFlow >= 0 ? 'bg-blue-50' : 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {summaryCards.map((card, index) => (
        <div
          key={index}
          className={`bg-white p-6 rounded-xl shadow-lg border-l-4 ${card.color} hover:shadow-xl transition-all duration-300`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`${card.bgColor} p-3 rounded-lg`}>
              <div className="text-2xl">{card.icon}</div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{card.title}</p>
            <p className="text-2xl font-bold text-slate-800">
              {currencyFormatter.format(card.value)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FinancialSummary;