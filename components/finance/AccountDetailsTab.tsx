import React, { useState, useMemo } from 'react';
import { useClinicData } from '../../hooks/useClinicData';
import { useI18n } from '../../hooks/useI18n';
import { Patient, Dentist, Supplier } from '../../types';
import FinancialTable from './FinancialTable';

type AccountType = 'patient' | 'doctor' | 'supplier' | 'clinic';

interface AccountDetailsTabProps {
  filters: {
    startDate: string;
    endDate: string;
  };
  currencyFormatter: Intl.NumberFormat;
  onPrint?: (accountData: any, selectedAccountType: string) => void;
}

const AccountDetailsTab: React.FC<AccountDetailsTabProps> = ({ filters, currencyFormatter, onPrint }) => {
  const { t: translate } = useI18n();
  const { patients, dentists, suppliers, payments, expenses, treatmentRecords, doctorPayments, supplierInvoices } = useClinicData();

  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>(() => {
    return (sessionStorage.getItem('selectedAccountType') as AccountType) || 'patient';
  });
  const [selectedEntityId, setSelectedEntityId] = useState<string>(() => {
    return sessionStorage.getItem('selectedEntityId') || '';
  });

  const accountTypes = [
    { value: 'patient' as AccountType, label: translate('financialAccounts.accountDetails.accountTypes.patient') },
    { value: 'doctor' as AccountType, label: translate('financialAccounts.accountDetails.accountTypes.doctor') },
    { value: 'supplier' as AccountType, label: translate('financialAccounts.accountDetails.accountTypes.supplier') },
    { value: 'clinic' as AccountType, label: translate('financialAccounts.accountDetails.accountTypes.clinic') },
  ];

  const getEntities = () => {
    switch (selectedAccountType) {
      case 'patient':
        return patients;
      case 'doctor':
        return dentists;
      case 'supplier':
        return suppliers;
      case 'clinic':
        return [{ id: 'clinic', name: translate('financialAccounts.accountDetails.clinicAccount') }];
      default:
        return [];
    }
  };

  const entities = getEntities();

  const accountData = useMemo(() => {
    if (!selectedEntityId) return null;

    const filterByDate = (date: string) => {
      if (!filters.startDate && !filters.endDate) return true;
      const itemDate = new Date(date);
      if (filters.startDate && itemDate < new Date(filters.startDate)) return false;
      if (filters.endDate && itemDate > new Date(filters.endDate)) return false;
      return true;
    };

    switch (selectedAccountType) {
      case 'patient': {
        const patientPayments = payments.filter(p => p.patientId === selectedEntityId && filterByDate(p.date));
        const patientTreatments = treatmentRecords.filter(t => t.patientId === selectedEntityId && filterByDate(t.treatmentDate));

        const transactions = [
          ...patientPayments.map(p => ({
            id: `payment-${p.id}`,
            date: p.date,
            description: `${translate('financialAccounts.accountDetails.transactionTypes.payment')} - ${p.method}`,
            debit: 0,
            credit: p.amount,
            balance: 0,
            type: 'payment' as const,
          })),
          ...patientTreatments.map(t => ({
            id: `treatment-${t.id}`,
            date: t.treatmentDate,
            description: `${translate('financialAccounts.accountDetails.transactionTypes.treatment')} - ${t.notes || ''}`,
            debit: t.totalTreatmentCost,
            credit: 0,
            balance: 0,
            type: 'treatment' as const,
          })),
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let runningBalance = 0;
        transactions.forEach(t => {
          runningBalance += t.credit - t.debit;
          t.balance = runningBalance;
        });

        const totalTreatments = patientTreatments.reduce((sum, t) => sum + t.totalTreatmentCost, 0);
        const totalPayments = patientPayments.reduce((sum, p) => sum + p.amount, 0);

        return {
          entityName: patients.find(p => p.id === selectedEntityId)?.name || '',
          transactions,
          summary: {
            totalDebit: totalTreatments,
            totalCredit: totalPayments,
            balance: totalPayments - totalTreatments,
          },
        };
      }

      case 'doctor': {
        const doctorTreatments = treatmentRecords.filter(t => t.dentistId === selectedEntityId && filterByDate(t.treatmentDate));
        const doctorPays = doctorPayments.filter(p => p.dentistId === selectedEntityId && filterByDate(p.date));

        const transactions = [
          ...doctorTreatments.map(t => ({
            id: `treatment-${t.id}`,
            date: t.treatmentDate,
            description: `${translate('financialAccounts.accountDetails.transactionTypes.treatmentRevenue')} - ${t.notes || ''}`,
            debit: 0,
            credit: t.doctorShare,
            balance: 0,
            type: 'revenue' as const,
          })),
          ...doctorPays.map(p => ( {
            id: `payment-${p.id}`,
            date: p.date,
            description: `${translate('financialAccounts.accountDetails.transactionTypes.doctorPayment')} - ${p.notes || ''}`,
            debit: p.amount,
            credit: 0,
            balance: 0,
            type: 'payment' as const,
          })),
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let runningBalance = 0;
        transactions.forEach(t => {
          runningBalance += t.credit - t.debit;
          t.balance = runningBalance;
        });

        const totalRevenue = doctorTreatments.reduce((sum, t) => sum + t.doctorShare, 0);
        const totalPayments = doctorPays.reduce((sum, p) => sum + p.amount, 0);

        return {
          entityName: dentists.find(d => d.id === selectedEntityId)?.name || '',
          transactions,
          summary: {
            totalDebit: totalPayments,
            totalCredit: totalRevenue,
            balance: totalRevenue - totalPayments,
          },
        };
      }

      case 'supplier': {
        const supplierExpenses = expenses.filter(e => e.supplierId === selectedEntityId && filterByDate(e.date));
        const supplierInvs = supplierInvoices.filter(i => i.supplierId === selectedEntityId && filterByDate(i.invoiceDate));

        const transactions = [
          ...supplierInvs.map(i => ({
            id: `invoice-${i.id}`,
            date: i.invoiceDate,
            description: `${translate('financialAccounts.accountDetails.transactionTypes.invoice')} - ${i.invoiceNumber || ''}`,
            debit: i.amount,
            credit: 0,
            balance: 0,
            type: 'invoice' as const,
          })),
          ...supplierExpenses.filter(e => e.supplierInvoiceId).map(e => ({
            id: `payment-${e.id}`,
            date: e.date,
            description: `${translate('financialAccounts.accountDetails.transactionTypes.payment')} - ${e.description}`,
            debit: 0,
            credit: e.amount,
            balance: 0,
            type: 'payment' as const,
          })),
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let runningBalance = 0;
        transactions.forEach(t => {
          runningBalance += t.debit - t.credit;
          t.balance = runningBalance;
        });

        const totalInvoices = supplierInvs.reduce((sum, i) => sum + i.amount, 0);
        const totalPayments = supplierExpenses.filter(e => e.supplierInvoiceId).reduce((sum, e) => sum + e.amount, 0);

        return {
          entityName: suppliers.find(s => s.id === selectedEntityId)?.name || '',
          transactions,
          summary: {
            totalDebit: totalInvoices,
            totalCredit: totalPayments,
            balance: totalInvoices - totalPayments,
          },
        };
      }

      case 'clinic': {
        const clinicRevenues = treatmentRecords.filter(t => filterByDate(t.treatmentDate));
        const clinicExpenses = expenses.filter(e => filterByDate(e.date));

        const transactions = [
          ...clinicRevenues.map(t => ({
            id: `revenue-${t.id}`,
            date: t.treatmentDate,
            description: `${translate('financialAccounts.accountDetails.transactionTypes.clinicRevenue')} - ${t.notes || ''}`,
            debit: 0,
            credit: t.clinicShare,
            balance: 0,
            type: 'revenue' as const,
          })),
          ...clinicExpenses.map(e => ({
            id: `expense-${e.id}`,
            date: e.date,
            description: `${translate('financialAccounts.accountDetails.transactionTypes.expense')} - ${e.description}`,
            debit: e.amount,
            credit: 0,
            balance: 0,
            type: 'expense' as const,
          })),
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let runningBalance = 0;
        transactions.forEach(t => {
          runningBalance += t.credit - t.debit;
          t.balance = runningBalance;
        });

        const totalRevenue = clinicRevenues.reduce((sum, t) => sum + t.clinicShare, 0);
        const totalExpenses = clinicExpenses.reduce((sum, e) => sum + e.amount, 0);

        return {
          entityName: translate('financialAccounts.accountDetails.clinicAccount'),
          transactions,
          summary: {
            totalDebit: totalExpenses,
            totalCredit: totalRevenue,
            balance: totalRevenue - totalExpenses,
          },
        };
      }

      default:
        return null;
    }
  }, [selectedAccountType, selectedEntityId, filters, patients, dentists, suppliers, payments, expenses, treatmentRecords, doctorPayments, supplierInvoices, translate]);

  const columns = [
    { key: 'date', header: translate('financialAccounts.accountDetails.columns.date'), render: (item: any) => new Date(item.date).toLocaleDateString() },
    { key: 'description', header: translate('financialAccounts.accountDetails.columns.description'), render: (item: any) => item.description },
    { key: 'debit', header: translate('financialAccounts.accountDetails.columns.debit'), render: (item: any) => item.debit > 0 ? currencyFormatter.format(item.debit) : '' },
    { key: 'credit', header: translate('financialAccounts.accountDetails.columns.credit'), render: (item: any) => item.credit > 0 ? currencyFormatter.format(item.credit) : '' },
    { key: 'balance', header: translate('financialAccounts.accountDetails.columns.balance'), render: (item: any) => currencyFormatter.format(item.balance) },
  ];

  return (
    <div className="space-y-6">
      {/* Account Selection */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">{translate('financialAccounts.accountDetails.selectAccount')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {translate('financialAccounts.accountDetails.accountType')}
            </label>
            <select
              value={selectedAccountType}
              onChange={(e) => {
                setSelectedAccountType(e.target.value as AccountType);
                setSelectedEntityId('');
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {accountTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {translate('financialAccounts.accountDetails.selectEntity')}
            </label>
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{translate('financialAccounts.accountDetails.selectEntity')}</option>
              {entities.map(entity => (
                <option key={entity.id} value={entity.id}>{entity.name}</option>
              ))}
            </select>
          </div>
       </div>
     </div>

     {/* Account Details */}
     {accountData && (
       <div className="space-y-6">
         {/* Account Summary */}
         <div className="bg-white p-6 rounded-lg shadow">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold">{translate('financialAccounts.accountDetails.accountSummary')}</h3>
             {onPrint && (
               <button
                 onClick={() => onPrint(accountData, selectedAccountType)}
                 className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
               >
                 {translate('financialAccounts.print')}
               </button>
             )}
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="text-center">
               <div className="text-2xl font-bold text-red-600">{currencyFormatter.format(accountData.summary.totalDebit)}</div>
               <div className="text-sm text-slate-600">{translate('financialAccounts.accountDetails.totalDebit')}</div>
             </div>
             <div className="text-center">
               <div className="text-2xl font-bold text-green-600">{currencyFormatter.format(accountData.summary.totalCredit)}</div>
               <div className="text-sm text-slate-600">{translate('financialAccounts.accountDetails.totalCredit')}</div>
             </div>
             <div className="text-center">
               <div className={`text-2xl font-bold ${accountData.summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                 {currencyFormatter.format(accountData.summary.balance)}
               </div>
               <div className="text-sm text-slate-600">{translate('financialAccounts.accountDetails.balance')}</div>
             </div>
           </div>
         </div>

         {/* Transactions Table */}
         <div className="bg-white p-6 rounded-lg shadow">
           <h3 className="text-lg font-semibold mb-4">{translate('financialAccounts.accountDetails.transactions')}</h3>
           {accountData.transactions.length > 0 ? (
             <FinancialTable
               data={accountData.transactions}
               columns={columns}
               title={`${accountData.entityName} - ${translate('financialAccounts.accountDetails.transactions')}`}
               emptyMessage={translate('financialAccounts.accountDetails.noTransactions')}
             />
           ) : (
             <div className="text-center py-8 text-slate-500">
               {translate('financialAccounts.accountDetails.noTransactions')}
             </div>
           )}
         </div>
       </div>
     )}
   </div>
 );
};

export default AccountDetailsTab;
