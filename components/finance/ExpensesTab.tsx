import React, { useMemo } from 'react';
import { Expense, DoctorPayment, SupplierInvoice, ExpenseCategory } from '../../types';
import { useClinicData } from '../../hooks/useClinicData';
import { useI18n } from '../../hooks/useI18n';
import FinancialTable from './FinancialTable';
import FinancialCharts from './FinancialCharts';

interface ExpensesTabProps {
  expenses: Expense[];
  doctorPayments: DoctorPayment[];
  supplierInvoices: SupplierInvoice[];
  filters: {
    startDate: string;
    endDate: string;
  };
  currencyFormatter: Intl.NumberFormat;
}

const ExpensesTab: React.FC<ExpensesTabProps> = ({
  expenses,
  doctorPayments,
  supplierInvoices,
  filters,
  currencyFormatter,
}) => {
  const { t, locale } = useI18n();
  const { suppliers, dentists } = useClinicData();

  const filteredData = useMemo(() => {
    let filteredExpenses = expenses;
    let filteredDoctorPayments = doctorPayments;
    let filteredSupplierInvoices = supplierInvoices;

    // Date filtering
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredExpenses = filteredExpenses.filter(e => new Date(e.date) >= startDate);
      filteredDoctorPayments = filteredDoctorPayments.filter(p => new Date(p.date) >= startDate);
      filteredSupplierInvoices = filteredSupplierInvoices.filter(i => new Date(i.invoiceDate) >= startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filteredExpenses = filteredExpenses.filter(e => new Date(e.date) <= endDate);
      filteredDoctorPayments = filteredDoctorPayments.filter(p => new Date(p.date) <= endDate);
      filteredSupplierInvoices = filteredSupplierInvoices.filter(i => new Date(i.invoiceDate) <= endDate);
    }


    return { filteredExpenses, filteredDoctorPayments, filteredSupplierInvoices };
  }, [expenses, doctorPayments, supplierInvoices, filters]);

  const expensesData = useMemo(() => {
    const expenseItems = filteredData.filteredExpenses.map(expense => ({
      id: expense.id,
      date: expense.date,
      description: expense.description,
      amount: expense.amount,
      type: 'Expense' as const,
      category: expense.category,
      supplierId: expense.supplierId,
    }));

    const doctorPaymentItems = filteredData.filteredDoctorPayments.map(payment => ({
      id: payment.id,
      date: payment.date,
      description: `Doctor payment to ${dentists.find(d => d.id === payment.dentistId)?.name || 'Unknown Doctor'}`,
      amount: payment.amount,
      type: 'Doctor Payment' as const,
      dentistId: payment.dentistId,
      notes: payment.notes,
    }));

    const supplierInvoiceItems = filteredData.filteredSupplierInvoices.map(invoice => ({
      id: invoice.id,
      date: invoice.invoiceDate,
      description: `Invoice from ${suppliers.find(s => s.id === invoice.supplierId)?.name || 'Unknown Supplier'}`,
      amount: invoice.amount,
      type: 'Supplier Invoice' as const,
      supplierId: invoice.supplierId,
      status: invoice.status,
    }));

    return [...expenseItems, ...doctorPaymentItems, ...supplierInvoiceItems].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredData, suppliers, dentists]);

  const chartData = useMemo(() => {
    const categoryData: Record<string, number> = {};
    expensesData.forEach(item => {
      const category = 'category' in item ? item.category : item.type;
      categoryData[category] = (categoryData[category] || 0) + item.amount;
    });

    return Object.entries(categoryData)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([category, amount]) => ({
        label: category,
        value: amount,
      }));
  }, [expensesData]);

  const totalExpenses = expensesData.reduce((sum, item) => sum + item.amount, 0);

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
      key: 'category',
      header: t('financialTable.category'),
      render: (item: any) => item.category ? t(`expenseCategory.${item.category}`) : '-',
    },
    {
      key: 'amount',
      header: t('financialTable.amount'),
      render: (item: any) => currencyFormatter.format(item.amount),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-amber-600 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">المصروفات</h2>
        <p className="text-blue-100">إدارة ومراقبة المصروفات والنفقات المالية</p>
      </div>

      {/* Expenses Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t('expensesTab.totalExpenses')}</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{currencyFormatter.format(totalExpenses)}</p>
            </div>
            <div className="text-4xl opacity-20">💸</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t('expensesTab.operatingExpenses')}</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                {currencyFormatter.format(expensesData.filter(e => e.type === 'Expense').reduce((sum, e) => sum + e.amount, 0))}
              </p>
            </div>
            <div className="text-4xl opacity-20">🏢</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t('expensesTab.doctorPayments')}</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                {currencyFormatter.format(expensesData.filter(e => e.type === 'Doctor Payment').reduce((sum, e) => sum + e.amount, 0))}
              </p>
            </div>
            <div className="text-4xl opacity-20">👨‍⚕️</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t('expensesTab.supplierInvoices')}</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                {currencyFormatter.format(expensesData.filter(e => e.type === 'Supplier Invoice').reduce((sum, e) => sum + e.amount, 0))}
              </p>
            </div>
            <div className="text-4xl opacity-20">📄</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <FinancialCharts
        data={chartData}
        title={t('expensesTab.expensesByCategory')}
        colorClass="bg-red-500"
      />

      {/* Expenses Table */}
      <FinancialTable
        data={expensesData}
        columns={columns}
        title={t('expensesTab.expensesDetails')}
        emptyMessage={t('expensesTab.noExpensesData')}
      />
    </div>
  );
};

export default ExpensesTab;
