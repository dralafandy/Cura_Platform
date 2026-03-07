import React, { useEffect } from 'react';

interface InsuranceCompany {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface InsuranceAccount {
  id: string;
  insurance_company_id: string;
  account_name: string;
  balance: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

interface InsuranceTransaction {
  id: string;
  insurance_account_id: string;
  transaction_type: 'CREDIT' | 'DEBIT';
  amount: number;
  transaction_date: string;
  description?: string;
  reference_number?: string;
}

interface PatientInsuranceLink {
  id: string;
  patient_id: string;
  insurance_company_id: string;
  policy_number?: string;
  coverage_percentage: number;
  effective_date?: string;
  expiry_date?: string;
  patient_name?: string;
  insurance_company_name?: string;
}

interface TreatmentInsuranceLink {
  id: string;
  treatment_record_id: string;
  insurance_company_id: string;
  claim_amount: number;
  claim_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  claim_date?: string;
  payment_date?: string;
  treatment_name?: string;
  patient_name?: string;
  insurance_company_name?: string;
}

interface PrintableInsuranceReportProps {
  reportType: 'summary' | 'claims' | 'patients' | 'transactions' | 'account-statement';
  companies: InsuranceCompany[];
  accounts: InsuranceAccount[];
  transactions: InsuranceTransaction[];
  patientLinks: PatientInsuranceLink[];
  treatmentLinks: TreatmentInsuranceLink[];
  selectedCompanyId?: string;
  selectedAccountId?: string;
  dateFrom?: string;
  dateTo?: string;
  clinicName?: string;
  isPrintWindow?: boolean;
}

const PrintableInsuranceReport: React.FC<PrintableInsuranceReportProps> = ({
  reportType,
  companies,
  accounts,
  transactions,
  patientLinks,
  treatmentLinks,
  selectedCompanyId,
  selectedAccountId,
  dateFrom,
  dateTo,
  clinicName = 'CuraSoft Insurance System',
  isPrintWindow = false
}) => {
  // Auto-print when opened in print window
  useEffect(() => {
    if (isPrintWindow) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPrintWindow]);
  const companyName = selectedCompanyId 
    ? companies.find(c => c.id === selectedCompanyId)?.name || 'جميع الشركات'
    : 'جميع الشركات';

  const accountName = selectedAccountId
    ? accounts.find(a => a.id === selectedAccountId)?.account_name || 'جميع الحسابات'
    : 'جميع الحسابات';

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} ج.م`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('ar-EG');
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'APPROVED':
      case 'PAID':
        return '#10B981';
      case 'PENDING':
        return '#F59E0B';
      case 'REJECTED':
      case 'SUSPENDED':
        return '#EF4444';
      case 'INACTIVE':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'APPROVED':
      case 'PAID':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
      case 'PENDING':
        return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' };
      case 'REJECTED':
      case 'SUSPENDED':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
      case 'INACTIVE':
        return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
    }
  };

  const getTransactionTypeColor = (type: string) => {
    return type === 'CREDIT' ? '#10B981' : '#EF4444';
  };

  const filteredTransactions = transactions.filter(t => {
    if (selectedAccountId && t.insurance_account_id !== selectedAccountId) return false;
    if (dateFrom && t.transaction_date < dateFrom) return false;
    if (dateTo && t.transaction_date > dateTo) return false;
    return true;
  });

  const filteredPatientLinks = patientLinks.filter(p => {
    if (selectedCompanyId && p.insurance_company_id !== selectedCompanyId) return false;
    return true;
  });

  const filteredTreatmentLinks = treatmentLinks.filter(t => {
    if (selectedCompanyId && t.insurance_company_id !== selectedCompanyId) return false;
    return true;
  });

  const totalCredits = filteredTransactions
    .filter(t => t.transaction_type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = filteredTransactions
    .filter(t => t.transaction_type === 'DEBIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalClaims = filteredTreatmentLinks.reduce((sum, t) => sum + t.claim_amount, 0);
  const pendingClaims = filteredTreatmentLinks.filter(t => t.claim_status === 'PENDING');
  const approvedClaims = filteredTreatmentLinks.filter(t => t.claim_status === 'APPROVED');
  const paidClaims = filteredTreatmentLinks.filter(t => t.claim_status === 'PAID');

  const printStyles = `
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
      .no-page-break { page-break-inside: avoid; }
    }
    @page { size: A4 portrait; margin: 1cm; }
    
    /* Print-optimized styles */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; line-height: 1.4; color: #333; }
    .print-header { text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 15px; margin-bottom: 20px; }
    .print-header h1 { font-size: 20pt; color: #1e3a5f; margin-bottom: 5px; }
    .print-header h2 { font-size: 14pt; color: #4a5568; }
    .print-meta { display: flex; justify-content: space-between; padding: 10px; background: #f7fafc; border-radius: 4px; margin-bottom: 15px; font-size: 10pt; }
    .print-card { padding: 10px; border-radius: 4px; text-align: center; border: 1px solid #e2e8f0; }
    .print-card-title { font-size: 9pt; margin-bottom: 3px; }
    .print-card-value { font-size: 14pt; font-weight: bold; }
    .print-section-title { font-size: 12pt; color: #1e3a5f; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin: 15px 0 10px 0; }
    .print-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    .print-table th { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; padding: 8px 6px; text-align: right; border-radius: 4px 4px 0 0; }
    .print-table td { padding: 6px 5px; border-bottom: 1px solid #e2e8f0; }
    .print-table tr:nth-child(even) { background: #f0f9ff; }
    .print-table tr:hover { background: #e0f2fe; }
    .print-footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 8pt; color: #718096; }
    
    /* Colorful status badges */
    .status-active, .status-approved, .status-paid { background-color: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 8pt; }
    .status-pending { background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 8pt; }
    .status-rejected, .status-suspended { background-color: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 8pt; }
    .status-inactive { background-color: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 8pt; }
    
    /* Colorful summary cards */
    .summary-card-blue { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 1px solid #93c5fd; }
    .summary-card-green { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 1px solid #6ee7b7; }
    .summary-card-purple { background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border: 1px solid #c4b5fd; }
    .summary-card-amber { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #fcd34d; }
    .summary-card-red { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 1px solid #fca5a5; }
  `;

  const renderSummaryReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 text-center shadow-sm">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-sm text-blue-600 mb-1 font-semibold">شركات التأمين</p>
          <p className="text-2xl font-bold text-blue-800">{companies.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 text-center shadow-sm">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-green-600 mb-1 font-semibold">الحسابات النشطة</p>
          <p className="text-2xl font-bold text-green-800">{accounts.filter(a => a.status === 'ACTIVE').length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4 text-center shadow-sm">
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-sm text-purple-600 mb-1 font-semibold">المرضى المؤمن لهم</p>
          <p className="text-2xl font-bold text-purple-800">{patientLinks.length}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 text-center shadow-sm">
          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-amber-600 mb-1 font-semibold">إجمالي المطالبات</p>
          <p className="text-2xl font-bold text-amber-800">{formatCurrency(totalClaims)}</p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
          <h3 className="font-bold text-slate-700">الملخص المالي</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">إجمالي الإيداعات</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(totalCredits)}</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">إجمالي السحبات</p>
              <p className="text-xl font-bold text-red-700">{formatCurrency(totalDebits)}</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">صافي الرصيد</p>
              <p className="text-xl font-bold text-blue-700">{formatCurrency(totalCredits - totalDebits)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Claims Status Summary */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
          <h3 className="font-bold text-slate-700">حالة المطالبات</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-600">قيد الانتظار</p>
              <p className="text-xl font-bold text-amber-700">{pendingClaims.length}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">معتمدة</p>
              <p className="text-xl font-bold text-green-700">{approvedClaims.length}</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">مدفوعة</p>
              <p className="text-xl font-bold text-blue-700">{paidClaims.length}</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">مرفوضة</p>
              <p className="text-xl font-bold text-red-700">{filteredTreatmentLinks.filter(t => t.claim_status === 'REJECTED').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Companies List */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
          <h3 className="font-bold text-slate-700">شركات التأمين</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-right border-b">اسم الشركة</th>
              <th className="px-4 py-2 text-right border-b">الهاتف</th>
              <th className="px-4 py-2 text-right border-b">البريد الإلكتروني</th>
              <th className="px-4 py-2 text-right border-b">عدد الحسابات</th>
              <th className="px-4 py-2 text-right border-b">عدد المرضى</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(company => {
              const companyAccounts = accounts.filter(a => a.insurance_company_id === company.id);
              const companyPatients = patientLinks.filter(p => p.insurance_company_id === company.id);
              return (
                <tr key={company.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 border-b">{company.name}</td>
                  <td className="px-4 py-2 border-b">{company.phone || '-'}</td>
                  <td className="px-4 py-2 border-b">{company.email || '-'}</td>
                  <td className="px-4 py-2 border-b text-center">{companyAccounts.length}</td>
                  <td className="px-4 py-2 border-b text-center">{companyPatients.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderClaimsReport = () => (
    <div className="space-y-6">
      {/* Claims Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
          <p className="text-sm text-slate-600 mb-1">إجمالي المطالبات</p>
          <p className="text-2xl font-bold text-slate-800">{filteredTreatmentLinks.length}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <p className="text-sm text-amber-600 mb-1">قيد الانتظار</p>
          <p className="text-2xl font-bold text-amber-800">{pendingClaims.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-sm text-green-600 mb-1">تم الدفع</p>
          <p className="text-2xl font-bold text-green-800">{paidClaims.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-600 mb-1">إجمالي المبالغ</p>
          <p className="text-2xl font-bold text-blue-800">{formatCurrency(totalClaims)}</p>
        </div>
      </div>

      {/* Claims Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-2 text-right border-b">المريض</th>
              <th className="px-4 py-2 text-right border-b">العلاج</th>
              <th className="px-4 py-2 text-right border-b">شركة التأمين</th>
              <th className="px-4 py-2 text-right border-b">مبلغ المطالبة</th>
              <th className="px-4 py-2 text-right border-b">الحالة</th>
              <th className="px-4 py-2 text-right border-b">تاريخ المطالبة</th>
              <th className="px-4 py-2 text-right border-b">تاريخ الدفع</th>
            </tr>
          </thead>
          <tbody>
            {filteredTreatmentLinks.map(link => (
              <tr key={link.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 border-b">{link.patient_name || '-'}</td>
                <td className="px-4 py-2 border-b">{link.treatment_name || '-'}</td>
                <td className="px-4 py-2 border-b">{link.insurance_company_name || '-'}</td>
                <td className="px-4 py-2 border-b">{formatCurrency(link.claim_amount)}</td>
                <td className="px-4 py-2 border-b">
                  <span 
                    className="px-2 py-1 rounded text-white text-xs"
                    style={{ backgroundColor: getStatusColor(link.claim_status) }}
                  >
                    {link.claim_status === 'PENDING' ? 'قيد الانتظار' :
                     link.claim_status === 'APPROVED' ? 'معتمدة' :
                     link.claim_status === 'PAID' ? 'مدفوعة' : 'مرفوضة'}
                  </span>
                </td>
                <td className="px-4 py-2 border-b">{formatDate(link.claim_date || '')}</td>
                <td className="px-4 py-2 border-b">{formatDate(link.payment_date || '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPatientsReport = () => (
    <div className="space-y-6">
      {/* Patients Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <p className="text-sm text-purple-600 mb-1">إجمالي المرضى المؤمن لهم</p>
          <p className="text-2xl font-bold text-purple-800">{filteredPatientLinks.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-sm text-green-600 mb-1">متوسط نسبة التغطية</p>
          <p className="text-2xl font-bold text-green-800">
            {filteredPatientLinks.length > 0 
              ? `${(filteredPatientLinks.reduce((sum, p) => sum + p.coverage_percentage, 0) / filteredPatientLinks.length).toFixed(1)}%`
              : '0%'}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-600 mb-1">شركات التأمين</p>
          <p className="text-2xl font-bold text-blue-800">
            {new Set(filteredPatientLinks.map(p => p.insurance_company_id)).size}
          </p>
        </div>
      </div>

      {/* Patients Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-2 text-right border-b">المريض</th>
              <th className="px-4 py-2 text-right border-b">شركة التأمين</th>
              <th className="px-4 py-2 text-right border-b">رقم البوليصة</th>
              <th className="px-4 py-2 text-right border-b">نسبة التغطية</th>
              <th className="px-4 py-2 text-right border-b">تاريخ البداية</th>
              <th className="px-4 py-2 text-right border-b">تاريخ الانتهاء</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatientLinks.map(link => (
              <tr key={link.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 border-b">{link.patient_name || '-'}</td>
                <td className="px-4 py-2 border-b">{link.insurance_company_name || '-'}</td>
                <td className="px-4 py-2 border-b">{link.policy_number || '-'}</td>
                <td className="px-4 py-2 border-b">{link.coverage_percentage}%</td>
                <td className="px-4 py-2 border-b">{formatDate(link.effective_date || '')}</td>
                <td className="px-4 py-2 border-b">{formatDate(link.expiry_date || '')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTransactionsReport = () => (
    <div className="space-y-6">
      {/* Transactions Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
          <p className="text-sm text-slate-600 mb-1">إجمالي المعاملات</p>
          <p className="text-2xl font-bold text-slate-800">{filteredTransactions.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-sm text-green-600 mb-1">إجمالي الإيداعات</p>
          <p className="text-2xl font-bold text-green-800">{formatCurrency(totalCredits)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-sm text-red-600 mb-1">إجمالي السحبات</p>
          <p className="text-2xl font-bold text-red-800">{formatCurrency(totalDebits)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-600 mb-1">صافي الرصيد</p>
          <p className="text-2xl font-bold text-blue-800">{formatCurrency(totalCredits - totalDebits)}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-2 text-right border-b">التاريخ</th>
              <th className="px-4 py-2 text-right border-b">الحساب</th>
              <th className="px-4 py-2 text-right border-b">النوع</th>
              <th className="px-4 py-2 text-right border-b">المبلغ</th>
              <th className="px-4 py-2 text-right border-b">الوصف</th>
              <th className="px-4 py-2 text-right border-b">رقم المرجع</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(txn => {
              const account = accounts.find(a => a.id === txn.insurance_account_id);
              return (
                <tr key={txn.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 border-b">{formatDate(txn.transaction_date)}</td>
                  <td className="px-4 py-2 border-b">{account?.account_name || '-'}</td>
                  <td className="px-4 py-2 border-b">
                    <span 
                      className="px-2 py-1 rounded text-white text-xs"
                      style={{ backgroundColor: getTransactionTypeColor(txn.transaction_type) }}
                    >
                      {txn.transaction_type === 'CREDIT' ? 'إيداع' : 'سحب'}
                    </span>
                  </td>
                  <td className="px-4 py-2 border-b font-semibold" style={{ color: getTransactionTypeColor(txn.transaction_type) }}>
                    {txn.transaction_type === 'CREDIT' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </td>
                  <td className="px-4 py-2 border-b">{txn.description || '-'}</td>
                  <td className="px-4 py-2 border-b">{txn.reference_number || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAccountStatement = () => {
    const selectedAccount = accounts.find(a => a.id === selectedAccountId);
    const selectedCompany = selectedAccount 
      ? companies.find(c => c.id === selectedAccount.insurance_company_id)
      : null;

    return (
      <div className="space-y-6">
        {/* Account Info */}
        {selectedAccount && (
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">اسم الحساب</p>
                <p className="font-bold text-slate-800">{selectedAccount.account_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">شركة التأمين</p>
                <p className="font-bold text-slate-800">{selectedCompany?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">حالة الحساب</p>
                <span 
                  className="px-2 py-1 rounded text-white text-xs"
                  style={{ backgroundColor: getStatusColor(selectedAccount.status) }}
                >
                  {selectedAccount.status === 'ACTIVE' ? 'نشط' :
                   selectedAccount.status === 'INACTIVE' ? 'غير نشط' : 'معلق'}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-500">الرصيد الحالي</p>
                <p className="font-bold text-lg text-blue-600">{formatCurrency(selectedAccount.balance)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statement Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-sm text-green-600 mb-1">إجمالي الإيداعات</p>
            <p className="text-2xl font-bold text-green-800">{formatCurrency(totalCredits)}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-sm text-red-600 mb-1">إجمالي السحبات</p>
            <p className="text-2xl font-bold text-red-800">{formatCurrency(totalDebits)}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-600 mb-1">صافي الحركة</p>
            <p className="text-2xl font-bold text-blue-800">{formatCurrency(totalCredits - totalDebits)}</p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
            <h3 className="font-bold text-slate-700">كشف الحركات</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-right border-b">التاريخ</th>
                <th className="px-4 py-2 text-right border-b">النوع</th>
                <th className="px-4 py-2 text-right border-b">الوصف</th>
                <th className="px-4 py-2 text-right border-b">رقم المرجع</th>
                <th className="px-4 py-2 text-right border-b">إيداع</th>
                <th className="px-4 py-2 text-right border-b">سحب</th>
                <th className="px-4 py-2 text-right border-b">الرصيد</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let runningBalance = 0;
                return filteredTransactions.map(txn => {
                  if (txn.transaction_type === 'CREDIT') {
                    runningBalance += txn.amount;
                  } else {
                    runningBalance -= txn.amount;
                  }
                  return (
                    <tr key={txn.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 border-b">{formatDate(txn.transaction_date)}</td>
                      <td className="px-4 py-2 border-b">
                        <span 
                          className="px-2 py-1 rounded text-white text-xs"
                          style={{ backgroundColor: getTransactionTypeColor(txn.transaction_type) }}
                        >
                          {txn.transaction_type === 'CREDIT' ? 'إيداع' : 'سحب'}
                        </span>
                      </td>
                      <td className="px-4 py-2 border-b">{txn.description || '-'}</td>
                      <td className="px-4 py-2 border-b">{txn.reference_number || '-'}</td>
                      <td className="px-4 py-2 border-b text-green-600">
                        {txn.transaction_type === 'CREDIT' ? formatCurrency(txn.amount) : '-'}
                      </td>
                      <td className="px-4 py-2 border-b text-red-600">
                        {txn.transaction_type === 'DEBIT' ? formatCurrency(txn.amount) : '-'}
                      </td>
                      <td className="px-4 py-2 border-b font-semibold">{formatCurrency(runningBalance)}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'summary':
        return 'تقرير ملخص التأمينات';
      case 'claims':
        return 'تقرير مطالبات التأمين';
      case 'patients':
        return 'تقرير المرضى المؤمن لهم';
      case 'transactions':
        return 'تقرير معاملات التأمين';
      case 'account-statement':
        return 'كشف حساب التأمين';
      default:
        return 'تقرير التأمين';
    }
  };

  return (
    <div className="bg-white p-8 print:p-4" dir="rtl">
      <style>{printStyles}</style>
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{clinicName}</h1>
            <h2 className="text-xl font-semibold text-slate-600 mt-1">{getReportTitle()}</h2>
          </div>
          <div className="text-left">
            <p className="text-sm text-slate-500">تاريخ التقرير</p>
            <p className="font-semibold text-slate-700">{new Date().toLocaleDateString('ar-EG')}</p>
          </div>
        </div>
        
        {/* Filters Info */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
          {selectedCompanyId && (
            <div>
              <span className="font-medium">شركة التأمين:</span> {companyName}
            </div>
          )}
          {selectedAccountId && (
            <div>
              <span className="font-medium">الحساب:</span> {accountName}
            </div>
          )}
          {dateFrom && (
            <div>
              <span className="font-medium">من:</span> {formatDate(dateFrom)}
            </div>
          )}
          {dateTo && (
            <div>
              <span className="font-medium">إلى:</span> {formatDate(dateTo)}
            </div>
          )}
        </div>
      </div>

      {/* Report Content */}
      {reportType === 'summary' && renderSummaryReport()}
      {reportType === 'claims' && renderClaimsReport()}
      {reportType === 'patients' && renderPatientsReport()}
      {reportType === 'transactions' && renderTransactionsReport()}
      {reportType === 'account-statement' && renderAccountStatement()}

      {/* Footer */}
      <div className="border-t border-slate-200 pt-4 mt-6 text-center text-sm text-slate-500">
        <p>تم إنشاء هذا التقرير تلقائياً من نظام إدارة العيادة</p>
        <p className="mt-1">جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
      </div>

      {/* Print Button */}
      <div className="mt-6 text-center no-print">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          طباعة التقرير
        </button>
      </div>
    </div>
  );
};

export default PrintableInsuranceReport;
