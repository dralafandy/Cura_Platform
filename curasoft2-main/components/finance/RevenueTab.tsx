import React, { useMemo } from 'react';
import { Payment, TreatmentRecord, Patient } from '../../types';
import { useClinicData } from '../../hooks/useClinicData';
import { useI18n } from '../../hooks/useI18n';
import FinancialTable from './FinancialTable';
import FinancialCharts from './FinancialCharts';

interface RevenueTabProps {
  payments: Payment[];
  treatmentRecords: TreatmentRecord[];
  filters: {
    startDate: string;
    endDate: string;
  };
  currencyFormatter: Intl.NumberFormat;
}

const RevenueTab: React.FC<RevenueTabProps> = ({
  payments,
  treatmentRecords,
  filters,
  currencyFormatter,
}) => {
  const { t, locale } = useI18n();
  const { patients, dentists } = useClinicData();

  const filteredData = useMemo(() => {
    let filteredPayments = payments;
    let filteredTreatments = treatmentRecords;

    // Date filtering
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredPayments = filteredPayments.filter(p => new Date(p.date) >= startDate);
      filteredTreatments = filteredTreatments.filter(t => new Date(t.treatmentDate) >= startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filteredPayments = filteredPayments.filter(p => new Date(p.date) <= endDate);
      filteredTreatments = filteredTreatments.filter(t => new Date(t.treatmentDate) <= endDate);
    }


    return { filteredPayments, filteredTreatments };
  }, [payments, treatmentRecords, filters]);

  const revenueData = useMemo(() => {
    const paymentRevenue = filteredData.filteredPayments.map(payment => ({
      id: payment.id,
      date: payment.date,
      description: `Payment from ${patients.find(p => p.id === payment.patientId)?.name || 'Unknown Patient'}`,
      amount: payment.amount,
      type: 'Payment' as const,
      patientId: payment.patientId,
      method: payment.method,
    }));

    return paymentRevenue.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredData, patients]);

  const chartData = useMemo(() => {
    const monthlyData: Record<string, number> = {};
    revenueData.forEach(item => {
      const monthKey = new Date(item.date).toISOString().slice(0, 7); // YYYY-MM
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + item.amount;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => ({
        label: new Date(month + '-01').toLocaleDateString(locale, { month: 'short', year: 'numeric' }),
        value: amount,
      }));
  }, [revenueData, locale]);

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.amount, 0);

  const columns = [
    {
      key: 'date',
      header: t('financialTable.date'),
      render: (item: any) => new Date(item.date).toLocaleDateString(locale),
    },
    {
      key: 'description',
      header: t('financialTable.description'),
      render: (item: any) => item.description,
    },
    {
      key: 'type',
      header: t('financialTable.type'),
      render: (item: any) => item.type,
    },
    {
      key: 'method',
      header: t('financialTable.method'),
      render: (item: any) => item.method,
    },
    {
      key: 'amount',
      header: t('financialTable.amount'),
      render: (item: any) => currencyFormatter.format(item.amount),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{t('revenueTab.totalRevenue')}</p>
              <p className="text-3xl font-bold text-slate-800">{currencyFormatter.format(totalRevenue)}</p>
            </div>
            <div className="text-4xl opacity-20">💰</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{t('revenueTab.paymentRevenue')}</p>
              <p className="text-3xl font-bold text-slate-800">
                {currencyFormatter.format(revenueData.filter(r => r.type === 'Payment').reduce((sum, r) => sum + r.amount, 0))}
              </p>
            </div>
            <div className="text-4xl opacity-20">💳</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <FinancialCharts
        data={chartData}
        title={t('revenueTab.revenueChart')}
        colorClass="bg-green-500"
      />

      {/* Revenue Table */}
      <FinancialTable
        data={revenueData}
        columns={columns}
        title={t('revenueTab.revenueDetails')}
        emptyMessage={t('revenueTab.noRevenueData')}
      />
    </div>
  );
};

export default RevenueTab;