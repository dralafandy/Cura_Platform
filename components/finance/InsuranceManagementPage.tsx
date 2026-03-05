import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../hooks/useI18n';
import { supabase } from '../../supabaseClient';
import { useClinicData } from '../../hooks/useClinicData';

type Tab = 'companies' | 'accounts' | 'transactions' | 'patient_links' | 'treatment_links' | 'reports';

type Company = { id: string; name: string; phone: string | null; email: string | null; user_id: string };
type Account = { id: string; insurance_company_id: string; account_name: string; balance: number; status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'; user_id: string };
type Txn = { id: string; insurance_account_id: string; transaction_type: 'CREDIT' | 'DEBIT'; amount: number; transaction_date: string; user_id: string; description?: string; reference_number?: string };
type PatientLink = { id: string; patient_id: string; insurance_company_id: string; policy_number?: string; coverage_percentage: number; effective_date?: string; expiry_date?: string; user_id: string };
type TreatmentLink = { id: string; treatment_record_id: string; insurance_company_id: string; claim_amount: number; claim_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'; claim_date?: string; payment_date?: string; user_id: string };

// Icons
const CompanyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const AccountIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const TransactionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const PatientIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const ClaimIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ReportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PrintIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const InsuranceManagementPage: React.FC = () => {
  const { user, currentClinic, accessibleClinics } = useAuth();
  const { t } = useI18n();
  const { clinicInfo } = useClinicData();
  const activeClinicId = useMemo(
    () => currentClinic?.id || accessibleClinics.find((c) => c.isDefault)?.clinicId || accessibleClinics[0]?.clinicId || null,
    [currentClinic, accessibleClinics]
  );
  const [tab, setTab] = useState<Tab>('companies');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [patientLinks, setPatientLinks] = useState<PatientLink[]>([]);
  const [treatmentLinks, setTreatmentLinks] = useState<TreatmentLink[]>([]);
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [treatments, setTreatments] = useState<{ id: string; notes: string | null; treatment_name: string | null; patient_id: string; patient_name?: string }[]>([]);

  const [companyForm, setCompanyForm] = useState<Partial<Company>>({ name: '' });
  const [accountForm, setAccountForm] = useState<Partial<Account>>({ insurance_company_id: '', account_name: '', balance: 0, status: 'ACTIVE' });
  const [txnForm, setTxnForm] = useState<Partial<Txn>>({ insurance_account_id: '', transaction_type: 'DEBIT', amount: 0, transaction_date: new Date().toISOString().split('T')[0], description: '', reference_number: '' });
  const [patientLinkForm, setPatientLinkForm] = useState<Partial<PatientLink>>({ patient_id: '', insurance_company_id: '', coverage_percentage: 100, policy_number: '', effective_date: '', expiry_date: '' });
  const [treatmentLinkForm, setTreatmentLinkForm] = useState<Partial<TreatmentLink>>({ treatment_record_id: '', insurance_company_id: '', claim_amount: 0, claim_status: 'PENDING', claim_date: new Date().toISOString().split('T')[0], payment_date: '' });
  
  // Search states
  const [patientSearch, setPatientSearch] = useState('');
  const [treatmentSearch, setTreatmentSearch] = useState('');
  
  // Report states
  const [reportType, setReportType] = useState<'summary' | 'claims' | 'patients' | 'transactions' | 'account-statement'>('summary');
  const [reportFilters, setReportFilters] = useState({
    companyId: '',
    accountId: '',
    dateFrom: '',
    dateTo: ''
  });

  const companyName = useMemo(() => Object.fromEntries(companies.map(c => [c.id, c.name])), [companies]);
  const accountName = useMemo(() => Object.fromEntries(accounts.map(a => [a.id, a.account_name])), [accounts]);
  const patientName = useMemo(() => Object.fromEntries(patients.map(p => [p.id, p.name])), [patients]);
  const treatmentName = useMemo(() => Object.fromEntries(treatments.map(r => [r.id, (r.treatment_name || r.notes || r.id).slice(0, 40)])), [treatments]);
  
  // Filtered patient links based on search
  const filteredPatientLinks = useMemo(() => {
    if (!patientSearch.trim()) return patientLinks;
    const search = patientSearch.toLowerCase();
    return patientLinks.filter(link => {
      const pName = patientName[link.patient_id]?.toLowerCase() || '';
      const cName = companyName[link.insurance_company_id]?.toLowerCase() || '';
      return pName.includes(search) || cName.includes(search);
    });
  }, [patientLinks, patientSearch, patientName, companyName]);
  
// Filtered treatment links based on search
  const filteredTreatmentLinks = useMemo(() => {
    if (!treatmentSearch.trim()) return treatmentLinks;
    const search = treatmentSearch.toLowerCase();
    return treatmentLinks.filter(link => {
      const tName = treatmentName[link.treatment_record_id]?.toLowerCase() || '';
      const cName = companyName[link.insurance_company_id]?.toLowerCase() || '';
      return tName.includes(search) || cName.includes(search);
    });
  }, [treatmentLinks, treatmentSearch, treatmentName, companyName]);

// Filter treatments for new claims - only show treatments for patients linked to insurance AND NOT already claimed
  const availableTreatmentsForClaim = useMemo(() => {
    // Get patient IDs that are already linked to insurance
    const insuredPatientIds = new Set(patientLinks.map(pl => pl.patient_id));
    
    // Get treatment record IDs that are already claimed
    const claimedTreatmentIds = new Set(treatmentLinks.map(tl => tl.treatment_record_id));
    
    // Filter treatments: patient IS insured AND treatment not already claimed
    return treatments.filter(t => 
      insuredPatientIds.has(t.patient_id) && 
      !claimedTreatmentIds.has(t.id)
    );
  }, [treatments, patientLinks, treatmentLinks]);
  
  // Statistics
  const stats = useMemo(() => {
    const totalCredits = transactions.filter(t => t.transaction_type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = transactions.filter(t => t.transaction_type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0);
    const pendingClaims = treatmentLinks.filter(t => t.claim_status === 'PENDING');
    const totalClaimAmount = treatmentLinks.reduce((sum, t) => sum + t.claim_amount, 0);
    
    return {
      totalCompanies: companies.length,
      activeAccounts: accounts.filter(a => a.status === 'ACTIVE').length,
      totalTransactions: transactions.length,
      totalPatientLinks: patientLinks.length,
      totalClaims: treatmentLinks.length,
      pendingClaims: pendingClaims.length,
      totalClaimAmount,
      totalCredits,
      totalDebits,
      netBalance: totalCredits - totalDebits
    };
  }, [companies, accounts, transactions, patientLinks, treatmentLinks]);

  const load = async () => {
    if (!supabase || !user?.id || !activeClinicId) return;
    try {
      setLoading(true);
      setError(null);
      const [co, ac, tx, pl, tl, pa, tr] = await Promise.all([
        supabase.from('insurance_companies').select('id,name,phone,email,user_id').order('created_at', { ascending: false }),
        supabase.from('insurance_accounts').select('id,insurance_company_id,account_name,balance,status,user_id').order('created_at', { ascending: false }),
        supabase.from('insurance_transactions').select('id,insurance_account_id,transaction_type,amount,transaction_date,user_id,description,reference_number').order('transaction_date', { ascending: false }),
        supabase.from('patient_insurance_link').select('id,patient_id,insurance_company_id,coverage_percentage,user_id,policy_number,effective_date,expiry_date').order('created_at', { ascending: false }),
        supabase.from('treatment_insurance_link').select('id,treatment_record_id,insurance_company_id,claim_amount,claim_status,user_id,claim_date,payment_date').order('created_at', { ascending: false }),
        supabase.from('patients').select('id,name').order('name'),
        supabase.from('treatment_records').select('id,notes,treatment_definitions(name),patient_id,patients(name)').eq('clinic_id', activeClinicId).order('created_at', { ascending: false }),
      ]);
      const firstErr = co.error || ac.error || tx.error || pl.error || tl.error || pa.error || tr.error;
      if (firstErr) throw firstErr;
      setCompanies((co.data || []) as Company[]);
      setAccounts((ac.data || []) as Account[]);
      setTransactions((tx.data || []) as Txn[]);
      setPatientLinks((pl.data || []) as PatientLink[]);
      setTreatmentLinks((tl.data || []) as TreatmentLink[]);
      setPatients((pa.data || []) as { id: string; name: string }[]);
      setTreatments((tr.data || []).map((r: any) => ({
        ...r,
        treatment_name: r.treatment_definitions?.name || r.notes || null,
        patient_name: r.patients?.name || ''
      })) as { id: string; notes: string | null; treatment_name: string | null; patient_id: string; patient_name?: string }[]);
    } catch (e) {
      console.error('Insurance module loading error:', e);
      const errorMessage = e instanceof Error ? e.message : 
        (typeof e === 'object' && e !== null && 'message' in e ? (e as any).message : 'Failed loading insurance module');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [user?.id, activeClinicId]);

  const del = async (table: string, id: string) => {
    if (!supabase) return;
    if (!window.confirm(t('insurance.confirmDelete'))) return;
    const { error: deleteError } = await supabase.from(table).delete().eq('id', id);
    if (deleteError) { setError(deleteError.message); return; }
    await load();
  };

  const saveCompany = async () => {
    if (!supabase || !user?.id || !activeClinicId || !companyForm.name?.trim()) return;
    const payload = { user_id: user.id, clinic_id: activeClinicId, name: companyForm.name.trim(), phone: companyForm.phone || null, email: companyForm.email || null };
    const q = companyForm.id ? supabase.from('insurance_companies').update(payload).eq('id', companyForm.id) : supabase.from('insurance_companies').insert([payload]);
    const { error: saveError } = await q; if (saveError) { setError(saveError.message); return; }
    setCompanyForm({ name: '' }); await load();
  };
  
  const saveAccount = async () => {
    if (!supabase || !user?.id || !activeClinicId || !accountForm.account_name?.trim() || !accountForm.insurance_company_id) return;
    const payload = { user_id: user.id, clinic_id: activeClinicId, insurance_company_id: accountForm.insurance_company_id, account_name: accountForm.account_name.trim(), balance: Number(accountForm.balance || 0), status: accountForm.status || 'ACTIVE' };
    const q = accountForm.id ? supabase.from('insurance_accounts').update(payload).eq('id', accountForm.id) : supabase.from('insurance_accounts').insert([payload]);
    const { error: saveError } = await q; if (saveError) { setError(saveError.message); return; }
    setAccountForm({ insurance_company_id: '', account_name: '', balance: 0, status: 'ACTIVE' }); await load();
  };
  
  const saveTxn = async () => {
    if (!supabase || !user?.id || !activeClinicId || !txnForm.insurance_account_id || !txnForm.transaction_date) return;
    const payload = { 
      user_id: user.id, 
      clinic_id: activeClinicId,
      insurance_account_id: txnForm.insurance_account_id, 
      transaction_type: txnForm.transaction_type || 'DEBIT', 
      amount: Number(txnForm.amount || 0), 
      transaction_date: txnForm.transaction_date,
      description: txnForm.description || null,
      reference_number: txnForm.reference_number || null
    };
    const q = txnForm.id ? supabase.from('insurance_transactions').update(payload).eq('id', txnForm.id) : supabase.from('insurance_transactions').insert([payload]);
    const { error: saveError } = await q; if (saveError) { setError(saveError.message); return; }
    setTxnForm({ insurance_account_id: '', transaction_type: 'DEBIT', amount: 0, transaction_date: new Date().toISOString().split('T')[0], description: '', reference_number: '' }); await load();
  };
  
  const savePatientLink = async () => {
    if (!supabase || !user?.id || !activeClinicId || !patientLinkForm.patient_id || !patientLinkForm.insurance_company_id) return;
    const payload = { 
      user_id: user.id, 
      clinic_id: activeClinicId,
      patient_id: patientLinkForm.patient_id, 
      insurance_company_id: patientLinkForm.insurance_company_id, 
      coverage_percentage: Number(patientLinkForm.coverage_percentage || 0),
      policy_number: patientLinkForm.policy_number || null,
      effective_date: patientLinkForm.effective_date || null,
      expiry_date: patientLinkForm.expiry_date || null
    };
    const q = patientLinkForm.id ? supabase.from('patient_insurance_link').update(payload).eq('id', patientLinkForm.id) : supabase.from('patient_insurance_link').insert([payload]);
    const { error: saveError } = await q; if (saveError) { setError(saveError.message); return; }
    setPatientLinkForm({ patient_id: '', insurance_company_id: '', coverage_percentage: 100, policy_number: '', effective_date: '', expiry_date: '' }); await load();
  };
  
  const saveTreatmentLink = async () => {
    if (!supabase || !user?.id || !activeClinicId || !treatmentLinkForm.treatment_record_id || !treatmentLinkForm.insurance_company_id) return;
    const payload = { 
      user_id: user.id, 
      clinic_id: activeClinicId,
      treatment_record_id: treatmentLinkForm.treatment_record_id, 
      insurance_company_id: treatmentLinkForm.insurance_company_id, 
      claim_amount: Number(treatmentLinkForm.claim_amount || 0), 
      claim_status: treatmentLinkForm.claim_status || 'PENDING',
      claim_date: treatmentLinkForm.claim_date || null,
      payment_date: treatmentLinkForm.payment_date || null
    };
    const q = treatmentLinkForm.id ? supabase.from('treatment_insurance_link').update(payload).eq('id', treatmentLinkForm.id) : supabase.from('treatment_insurance_link').insert([payload]);
    const { error: saveError } = await q; if (saveError) { setError(saveError.message); return; }
    setTreatmentLinkForm({ treatment_record_id: '', insurance_company_id: '', claim_amount: 0, claim_status: 'PENDING', claim_date: new Date().toISOString().split('T')[0], payment_date: '' }); await load();
  };

  const handlePrintReport = useCallback(() => {
    // Prepare data for the report
    const patientLinksData = patientLinks.map(p => ({
      ...p,
      patient_name: patientName[p.patient_id],
      insurance_company_name: companyName[p.insurance_company_id]
    }));
    
    const treatmentLinksData = treatmentLinks.map(t => {
      const treatment = treatments.find(tr => tr.id === t.treatment_record_id);
      return {
        ...t,
        treatment_name: treatment?.treatment_name || treatment?.notes,
        patient_name: treatment?.patient_name,
        insurance_company_name: companyName[t.insurance_company_id]
      };
    });
    
    // Create report data object
    const reportData = {
      reportType,
      companies,
      accounts,
      transactions,
      patientLinks: patientLinksData,
      treatmentLinks: treatmentLinksData,
      selectedCompanyId: reportFilters.companyId,
      selectedAccountId: reportFilters.accountId,
      dateFrom: reportFilters.dateFrom,
      dateTo: reportFilters.dateTo,
      isPrintWindow: true
    };
    
    // Open new window for printing
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert(t('insurance.pleaseAllowPopup'));
      return;
    }
    
    // Generate HTML content for the print window
    const htmlContent = generatePrintWindowHTML(reportData);
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }, [reportType, reportFilters, companies, accounts, transactions, patientLinks, treatmentLinks, patientName, companyName, treatments]);

  // Print single claim as official document
  const printClaim = useCallback((claim: TreatmentLink) => {
    const treatment = treatments.find(t => t.id === claim.treatment_record_id);
    const company = companies.find(c => c.id === claim.insurance_company_id);
    // Cast to any to access additional properties
    const patient = patients.find(p => p.id === treatment?.patient_id) as any;
    const treatmentData = treatment as any;
    
    const clinicName = clinicInfo?.name || 'مركز طبي';
    const clinicAddress = clinicInfo?.address || '';
    const clinicPhone = clinicInfo?.phone || '';
    const clinicEmail = clinicInfo?.email || '';
    
    const claimHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>مطالبة تأمين - ${patient?.name || 'مريض'}</title>
  <style>
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    @page { size: A4; margin: 2cm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 12pt; line-height: 1.6; padding: 20px; }
    .header { text-align: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 24pt; color: #1e3a5f; margin-bottom: 10px; }
    .header h2 { font-size: 16pt; color: #4a5568; }
    .clinic-info { font-size: 11pt; color: #718096; margin-top: 5px; }
    .clinic-info span { margin: 0 5px; }
    .claim-number { background: #1e3a5f; color: white; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-top: 10px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 14pt; color: #1e3a5f; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .info-item { padding: 10px; background: #f7fafc; border-radius: 5px; }
    .info-label { font-size: 10pt; color: #718096; margin-bottom: 3px; }
    .info-value { font-size: 12pt; font-weight: bold; color: #2d3748; }
    .amount-box { background: #ebf8ff; border: 2px solid #1e3a5f; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0; }
    .amount-label { font-size: 14pt; color: #4a5568; }
    .amount-value { font-size: 28pt; font-weight: bold; color: #1e3a5f; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10pt; color: #718096; }
    .signature-box { display: flex; justify-content: space-between; margin-top: 50px; }
    .signature { text-align: center; width: 45%; }
    .signature-line { border-top: 1px solid #2d3748; padding-top: 5px; margin-top: 40px; }
    .print-btn { position: fixed; top: 20px; right: 20px; background: #1e3a5f; color: white; border: none; padding: 12px 25px; border-radius: 5px; cursor: pointer; font-size: 14px; }
    .print-btn:hover { background: #2d4a6f; }
    .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 11pt; color: white; }
    .status-pending { background: #d69e2e; }
    .status-approved { background: #38a169; }
    .status-paid { background: #3182ce; }
    .status-rejected { background: #e53e3e; }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ طباعة</button>
  
  <div class="header">
    <h1>${clinicName}</h1>
    <div class="clinic-info">
      ${clinicAddress ? `<span>📍 ${clinicAddress}</span>` : ''}
      ${clinicPhone ? `<span>📞 ${clinicPhone}</span>` : ''}
      ${clinicEmail ? `<span>✉️ ${clinicEmail}</span>` : ''}
    </div>
    <h2>نموذج مطالبة تأمين</h2>
    <div class="claim-number">رقم المطالبة: ${claim.id.slice(0, 8).toUpperCase()}</div>
  </div>
  
  <div class="section">
    <div class="section-title">معلومات المريض</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">اسم المريض</div>
        <div class="info-value">${patient?.name || '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">رقم الهاتف</div>
        <div class="info-value">${patient?.phone || '-'}</div>
      </div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">معلومات شركة التأمين</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">اسم الشركة</div>
        <div class="info-value">${company?.name || '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">رقم البوليصة</div>
        <div class="info-value">${patientLinks.find(p => p.patient_id === treatment?.patient_id && p.insurance_company_id === claim.insurance_company_id)?.policy_number || '-'}</div>
      </div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">تفاصيل العلاج</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">نوع العلاج</div>
        <div class="info-value">${treatment?.treatment_name || treatment?.notes || '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">تاريخ العلاج</div>
        <div class="info-value">${treatmentData?.created_at ? new Date(treatmentData.created_at).toLocaleDateString('ar-EG') : '-'}</div>
      </div>
    </div>
  </div>
  
  <div class="amount-box">
    <div class="amount-label">مبلغ المطالبة</div>
    <div class="amount-value">${Number(claim.claim_amount || 0).toFixed(2)} ج.م</div>
  </div>
  
  <div class="section">
    <div class="section-title">معلومات المطالبة</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">تاريخ تقديم المطالبة</div>
        <div class="info-value">${claim.claim_date ? new Date(claim.claim_date).toLocaleDateString('ar-EG') : '-'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">حالة المطالبة</div>
        <div class="info-value"><span class="status-badge status-${claim.claim_status.toLowerCase()}">${claim.claim_status === 'PENDING' ? 'قيد الانتظار' : claim.claim_status === 'APPROVED' ? 'معتمدة' : claim.claim_status === 'PAID' ? 'مدفوعة' : 'مرفوضة'}</span></div>
      </div>
    </div>
  </div>
  
  <div class="signature-box">
    <div class="signature">
      <div class="signature-line">توقيع المريض</div>
    </div>
    <div class="signature">
      <div class="signature-line">توقيع الطبيب المعالج</div>
    </div>
    <div class="signature">
      <div class="signature-line">ختم العيادة</div>
    </div>
  </div>
  
  <div class="footer">
    <p>تم إنشاء هذا المستند إلكترونياً من نظام إدارة العيادة</p>
    <p>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')} | الوقت: ${new Date().toLocaleTimeString('ar-EG')}</p>
  </div>
</body>
</html>`;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(claimHtml);
      printWindow.document.close();
    }
  }, [treatments, companies, patients, patientLinks]);

  const title = t('sidebar.insuranceUnified') !== 'sidebar.insuranceUnified' ? t('sidebar.insuranceUnified') : t('insurance_unified_page');

  // Generate HTML for print window
  const generatePrintWindowHTML = (data: any): string => {
    const { reportType, companies, accounts, transactions, patientLinks, treatmentLinks, selectedCompanyId, selectedAccountId, dateFrom, dateTo } = data;
    
    const clinicName = clinicInfo?.name || 'مركز طبي';
    const clinicAddress = clinicInfo?.address || '';
    const clinicPhone = clinicInfo?.phone || '';
    const clinicEmail = clinicInfo?.email || '';
    
    const companyNameMap = Object.fromEntries(companies.map((c: any) => [c.id, c.name]));
    const accountNameMap = Object.fromEntries(accounts.map((a: any) => [a.id, a.account_name]));
    
    const formatCurrency = (amount: number) => `${(amount || 0).toFixed(2)} ج.م`;
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '-';
      try { return new Date(dateStr).toLocaleDateString('ar-EG'); } catch { return dateStr; }
    };
    
    const getStatusLabel = (status: string) => {
      const labels: Record<string, string> = {
        'ACTIVE': 'نشط', 'INACTIVE': 'غير نشط', 'SUSPENDED': 'معلق',
        'PENDING': 'قيد الانتظار', 'APPROVED': 'معتمد', 'REJECTED': 'مرفوض', 'PAID': 'مدفوع',
        'CREDIT': 'إيداع', 'DEBIT': 'سحب'
      };
      return labels[status] || status;
    };
    
    const getStatusClass = (status: string) => {
      if (['ACTIVE', 'APPROVED', 'PAID'].includes(status)) return 'status-active';
      if (status === 'PENDING') return 'status-pending';
      if (['REJECTED', 'SUSPENDED'].includes(status)) return 'status-rejected';
      if (status === 'INACTIVE') return 'status-inactive';
      return '';
    };
    
    const getReportTitle = () => {
      const titles: Record<string, string> = {
        'summary': 'تقرير ملخص التأمينات',
        'claims': 'تقرير مطالبات التأمين',
        'patients': 'تقرير المرضى المؤمن لهم',
        'transactions': 'تقرير معاملات التأمين',
        'account-statement': 'كشف حساب التأمين'
      };
      return titles[reportType] || 'تقرير التأمين';
    };
    
    // Filter data based on selection
    const filteredTransactions = transactions.filter((t: any) => {
      if (selectedAccountId && t.insurance_account_id !== selectedAccountId) return false;
      if (dateFrom && t.transaction_date < dateFrom) return false;
      if (dateTo && t.transaction_date > dateTo) return false;
      return true;
    });
    
    const filteredPatientLinks = patientLinks.filter((p: any) => {
      if (selectedCompanyId && p.insurance_company_id !== selectedCompanyId) return false;
      return true;
    });
    
    const filteredTreatmentLinks = treatmentLinks.filter((t: any) => {
      if (selectedCompanyId && t.insurance_company_id !== selectedCompanyId) return false;
      return true;
    });
    
    const totalCredits = filteredTransactions.filter((t: any) => t.transaction_type === 'CREDIT').reduce((sum: number, t: any) => sum + t.amount, 0);
    const totalDebits = filteredTransactions.filter((t: any) => t.transaction_type === 'DEBIT').reduce((sum: number, t: any) => sum + t.amount, 0);
    const totalClaims = filteredTreatmentLinks.reduce((sum: number, t: any) => sum + t.claim_amount, 0);
    
    const pendingClaims = filteredTreatmentLinks.filter((t: any) => t.claim_status === 'PENDING').length;
    const approvedClaims = filteredTreatmentLinks.filter((t: any) => t.claim_status === 'APPROVED').length;
    const paidClaims = filteredTreatmentLinks.filter((t: any) => t.claim_status === 'PAID').length;
    
    // Generate companies table
    const companiesTable = companies.map((c: any) => {
      const companyAccounts = accounts.filter((a: any) => a.insurance_company_id === c.id);
      const companyPatients = patientLinks.filter((p: any) => p.insurance_company_id === c.id);
      return `<tr>
        <td>${c.name}</td>
        <td>${c.phone || '-'}</td>
        <td>${c.email || '-'}</td>
        <td class="text-center">${companyAccounts.length}</td>
        <td class="text-center">${companyPatients.length}</td>
      </tr>`;
    }).join('');
    
    // Generate claims table
    const claimsTable = filteredTreatmentLinks.map((t: any) => `<tr>
      <td>${t.patient_name || '-'}</td>
      <td>${t.treatment_name || '-'}</td>
      <td>${t.insurance_company_name || '-'}</td>
      <td>${formatCurrency(t.claim_amount)}</td>
      <td><span class="status-badge ${getStatusClass(t.claim_status)}">${getStatusLabel(t.claim_status)}</span></td>
      <td>${formatDate(t.claim_date)}</td>
      <td>${formatDate(t.payment_date)}</td>
    </tr>`).join('');
    
    // Generate patients table
    const patientsTable = filteredPatientLinks.map((p: any) => `<tr>
      <td>${p.patient_name || '-'}</td>
      <td>${p.insurance_company_name || '-'}</td>
      <td>${p.policy_number || '-'}</td>
      <td class="text-center">${p.coverage_percentage}%</td>
      <td>${formatDate(p.effective_date)}</td>
      <td>${formatDate(p.expiry_date)}</td>
    </tr>`).join('');
    
    // Generate transactions table
    const transactionsTable = filteredTransactions.map((t: any) => {
      const account = accounts.find((a: any) => a.id === t.insurance_account_id);
      return `<tr>
        <td>${formatDate(t.transaction_date)}</td>
        <td>${account?.account_name || '-'}</td>
        <td><span class="status-badge ${getStatusClass(t.transaction_type)}">${getStatusLabel(t.transaction_type)}</span></td>
        <td class="${t.transaction_type === 'CREDIT' ? 'credit' : 'debit'}">${t.transaction_type === 'CREDIT' ? '+' : '-'}${formatCurrency(t.amount)}</td>
        <td>${t.description || '-'}</td>
        <td>${t.reference_number || '-'}</td>
      </tr>`;
    }).join('');
    
    // Account statement table with running balance
    let runningBalance = 0;
    const statementTable = filteredTransactions.map((t: any) => {
      const account = accounts.find((a: any) => a.id === t.insurance_account_id);
      if (t.transaction_type === 'CREDIT') runningBalance += t.amount;
      else runningBalance -= t.amount;
      return `<tr>
        <td>${formatDate(t.transaction_date)}</td>
        <td>${getStatusLabel(t.transaction_type)}</td>
        <td>${t.description || '-'}</td>
        <td>${t.reference_number || '-'}</td>
        <td class="credit">${t.transaction_type === 'CREDIT' ? formatCurrency(t.amount) : '-'}</td>
        <td class="debit">${t.transaction_type === 'DEBIT' ? formatCurrency(t.amount) : '-'}</td>
        <td class="font-bold">${formatCurrency(runningBalance)}</td>
      </tr>`;
    }).join('');
    
    // Get selected account info for statement
    let accountInfo = '';
    if (reportType === 'account-statement' && selectedAccountId) {
      const selectedAccount = accounts.find((a: any) => a.id === selectedAccountId);
      const selectedCompany = selectedAccount ? companies.find((c: any) => c.id === selectedAccount.insurance_company_id) : null;
      if (selectedAccount) {
        accountInfo = `<div class="account-info">
          <div class="info-row"><span>اسم الحساب:</span><strong>${selectedAccount.account_name}</strong></div>
          <div class="info-row"><span>شركة التأمين:</span><strong>${selectedCompany?.name || '-'}</strong></div>
          <div class="info-row"><span>الحالة:</span><span class="status-badge ${getStatusClass(selectedAccount.status)}">${getStatusLabel(selectedAccount.status)}</span></div>
          <div class="info-row"><span>الرصيد:</span><strong class="text-blue">${formatCurrency(selectedAccount.balance)}</strong></div>
        </div>`;
      }
    }
    
    // Filter info
    const filterInfo = [];
    if (selectedCompanyId) filterInfo.push(`شركة التأمين: ${companyNameMap[selectedCompanyId] || selectedCompanyId}`);
    if (selectedAccountId) filterInfo.push(`الحساب: ${accountNameMap[selectedAccountId] || selectedAccountId}`);
    if (dateFrom) filterInfo.push(`من: ${formatDate(dateFrom)}`);
    if (dateTo) filterInfo.push(`إلى: ${formatDate(dateTo)}`);
    
    // Build report content based on type
    let reportContent = '';
    
    if (reportType === 'summary') {
      reportContent = `
        <div class="summary-cards">
          <div class="summary-card blue"><div class="print-card-title">شركات التأمين</div><div class="print-card-value">${companies.length}</div></div>
          <div class="summary-card green"><div class="print-card-title">الحسابات النشطة</div><div class="print-card-value">${accounts.filter((a: any) => a.status === 'ACTIVE').length}</div></div>
          <div class="summary-card purple"><div class="print-card-title">المرضى المؤمن لهم</div><div class="print-card-value">${patientLinks.length}</div></div>
          <div class="summary-card amber"><div class="print-card-title">إجمالي المطالبات</div><div class="print-card-value">${formatCurrency(totalClaims)}</div></div>
        </div>
        
        <div class="summary-section">
          <div class="print-section-title">الملخص المالي</div>
          <div class="summary-cards">
            <div class="summary-card green"><div class="print-card-title">إجمالي الإيداعات</div><div class="print-card-value">${formatCurrency(totalCredits)}</div></div>
            <div class="summary-card red"><div class="print-card-title">إجمالي السحبات</div><div class="print-card-value">${formatCurrency(totalDebits)}</div></div>
            <div class="summary-card blue"><div class="print-card-title">صافي الرصيد</div><div class="print-card-value">${formatCurrency(totalCredits - totalDebits)}</div></div>
          </div>
        </div>
        
        <div class="summary-section">
          <div class="print-section-title">حالة المطالبات</div>
          <div class="summary-cards">
            <div class="summary-card amber"><div class="print-card-title">قيد الانتظار</div><div class="print-card-value">${pendingClaims}</div></div>
            <div class="summary-card green"><div class="print-card-title">معتمدة</div><div class="print-card-value">${approvedClaims}</div></div>
            <div class="summary-card blue"><div class="print-card-title">مدفوعة</div><div class="print-card-value">${paidClaims}</div></div>
            <div class="summary-card red"><div class="print-card-title">مرفوضة</div><div class="print-card-value">${filteredTreatmentLinks.filter((t: any) => t.claim_status === 'REJECTED').length}</div></div>
          </div>
        </div>
        
        <div class="print-section-title">شركات التأمين</div>
        <table class="print-table"><thead><tr><th>اسم الشركة</th><th>الهاتف</th><th>البريد الإلكتروني</th><th>الحسابات</th><th>المرضى</th></tr></thead><tbody>${companiesTable}</tbody></table>
      `;
    } else if (reportType === 'claims') {
      reportContent = `
        <div class="summary-cards">
          <div class="summary-card slate"><div class="print-card-title">إجمالي المطالبات</div><div class="print-card-value">${filteredTreatmentLinks.length}</div></div>
          <div class="summary-card amber"><div class="print-card-title">قيد الانتظار</div><div class="print-card-value">${pendingClaims}</div></div>
          <div class="summary-card green"><div class="print-card-title">تم الدفع</div><div class="print-card-value">${paidClaims}</div></div>
          <div class="summary-card blue"><div class="print-card-title">إجمالي المبالغ</div><div class="print-card-value">${formatCurrency(totalClaims)}</div></div>
        </div>
        <div class="print-section-title">تفاصيل المطالبات</div>
        <table class="print-table"><thead><tr><th>المريض</th><th>العلاج</th><th>شركة التأمين</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th><th>تاريخ الدفع</th></tr></thead><tbody>${claimsTable}</tbody></table>
      `;
    } else if (reportType === 'patients') {
      reportContent = `
        <div class="summary-cards">
          <div class="summary-card purple"><div class="print-card-title">إجمالي المرضى</div><div class="print-card-value">${filteredPatientLinks.length}</div></div>
          <div class="summary-card green"><div class="print-card-title">متوسط التغطية</div><div class="print-card-value">${filteredPatientLinks.length > 0 ? (filteredPatientLinks.reduce((s: number, p: any) => s + p.coverage_percentage, 0) / filteredPatientLinks.length).toFixed(1) + '%' : '0%'}</div></div>
          <div class="summary-card blue"><div class="print-card-title">الشركات</div><div class="print-card-value">${new Set(filteredPatientLinks.map((p: any) => p.insurance_company_id)).size}</div></div>
        </div>
        <div class="print-section-title">المرضى المؤمن لهم</div>
        <table class="print-table"><thead><tr><th>المريض</th><th>شركة التأمين</th><th>رقم البوليصة</th><th>التغطية</th><th>البداية</th><th>الانتهاء</th></tr></thead><tbody>${patientsTable}</tbody></table>
      `;
    } else if (reportType === 'transactions') {
      reportContent = `
        <div class="summary-cards">
          <div class="summary-card slate"><div class="print-card-title">إجمالي المعاملات</div><div class="print-card-value">${filteredTransactions.length}</div></div>
          <div class="summary-card green"><div class="print-card-title">الإيداعات</div><div class="print-card-value">${formatCurrency(totalCredits)}</div></div>
          <div class="summary-card red"><div class="print-card-title">السحبات</div><div class="print-card-value">${formatCurrency(totalDebits)}</div></div>
          <div class="summary-card blue"><div class="print-card-title">صافي الرصيد</div><div class="print-card-value">${formatCurrency(totalCredits - totalDebits)}</div></div>
        </div>
        <div class="print-section-title">المعاملات</div>
        <table class="print-table"><thead><tr><th>التاريخ</th><th>الحساب</th><th>النوع</th><th>المبلغ</th><th>الوصف</th><th>المرجع</th></tr></thead><tbody>${transactionsTable}</tbody></table>
      `;
    } else if (reportType === 'account-statement') {
      reportContent = `
        ${accountInfo}
        <div class="summary-cards">
          <div class="summary-card green"><div class="print-card-title">إجمالي الإيداعات</div><div class="print-card-value">${formatCurrency(totalCredits)}</div></div>
          <div class="summary-card red"><div class="print-card-title">إجمالي السحبات</div><div class="print-card-value">${formatCurrency(totalDebits)}</div></div>
          <div class="summary-card blue"><div class="print-card-title">صافي الحركة</div><div class="print-card-value">${formatCurrency(totalCredits - totalDebits)}</div></div>
        </div>
        <div class="print-section-title">كشف الحساب</div>
        <table class="print-table"><thead><tr><th>التاريخ</th><th>النوع</th><th>الوصف</th><th>المرجع</th><th>إيداع</th><th>سحب</th><th>الرصيد</th></tr></thead><tbody>${statementTable}</tbody></table>
      `;
    }
    
    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${getReportTitle()}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    @page { size: A4 portrait; margin: 1cm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; line-height: 1.4; color: #333; background: white; padding: 10px; }
    .report-container { max-width: 100%; }
    .print-header { text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 15px; margin-bottom: 20px; }
    .print-header h1 { font-size: 20pt; color: #1e3a5f; margin-bottom: 5px; }
    .print-header h2 { font-size: 14pt; color: #4a5568; }
    .print-clinic-info { font-size: 10pt; color: #718096; margin-top: 5px; }
    .print-clinic-info span { margin: 0 8px; }
    .print-meta { display: flex; justify-content: space-between; padding: 10px; background: #f7fafc; border-radius: 4px; margin-bottom: 15px; font-size: 10pt; }
    .print-meta-item { color: #4a5568; }
    .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
    .summary-card { padding: 10px; border-radius: 4px; text-align: center; border: 1px solid #e2e8f0; }
    .summary-card.blue { background: #ebf8ff; }
    .summary-card.green { background: #f0fff4; }
    .summary-card.purple { background: #faf5ff; }
    .summary-card.amber { background: #fffbeb; }
    .summary-card.slate { background: #f7fafc; }
    .summary-card.red { background: #fff5f5; }
    .print-card-title { font-size: 9pt; margin-bottom: 3px; color: #4a5568; }
    .print-card-value { font-size: 14pt; font-weight: bold; }
    .print-section-title { font-size: 12pt; color: #1e3a5f; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin: 15px 0 10px 0; }
    .print-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 20px; }
    .print-table th { background: #1e3a5f; color: white; padding: 6px 4px; text-align: right; }
    .print-table td { padding: 5px 4px; border-bottom: 1px solid #e2e8f0; }
    .print-table tr:nth-child(even) { background: #f7fafc; }
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 8pt; color: white; }
    .status-active, .status-approved, .status-paid { background: #38a169; }
    .status-pending { background: #d69e2e; }
    .status-rejected, .status-suspended { background: #e53e3e; }
    .status-inactive { background: #718096; }
    .credit { color: #38a169; font-weight: 600; }
    .debit { color: #e53e3e; font-weight: 600; }
    .text-center { text-align: center; }
    .text-blue { color: #3182ce; }
    .font-bold { font-weight: bold; }
    .print-footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 9pt; color: #718096; }
    .print-button-container { text-align: center; margin: 20px 0; }
    .print-button { background: #1e3a5f; color: white; border: none; padding: 12px 30px; font-size: 14px; border-radius: 5px; cursor: pointer; }
    .print-button:hover { background: #2d4a6f; }
    .account-info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 15px; background: #f7fafc; border-radius: 4px; margin-bottom: 20px; }
    .info-row { display: flex; justify-content: space-between; padding: 5px 0; }
    .info-row span { color: #4a5568; }
    .summary-section { margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="print-header">
      <h1>${clinicName}</h1>
      ${(clinicAddress || clinicPhone || clinicEmail) ? `
      <div class="print-clinic-info">
        ${clinicAddress ? `<span>${clinicAddress}</span>` : ''}
        ${clinicPhone ? `<span>${clinicPhone}</span>` : ''}
        ${clinicEmail ? `<span>${clinicEmail}</span>` : ''}
      </div>` : ''}
      <h2>${getReportTitle()}</h2>
    </div>
    
    <div class="print-meta">
      <div class="print-meta-item">تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</div>
      ${filterInfo.length > 0 ? `<div class="print-meta-item">${filterInfo.join(' | ')}</div>` : ''}
    </div>
    
    ${reportContent}
    
    <div class="print-footer">
      <p>تم إنشاء هذا التقرير تلقائياً من نظام إدارة العيادة</p>
      <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
    </div>
    
    <div class="print-button-container no-print">
      <button class="print-button" onclick="window.print()">طباعة التقرير</button>
    </div>
  </div>
</body>
</html>`;
  };

  const tabConfig = [
    { id: 'companies' as Tab, label: t('insurance.tabCompanies'), icon: <CompanyIcon /> },
    { id: 'accounts' as Tab, label: t('insurance.tabAccounts'), icon: <AccountIcon /> },
    { id: 'transactions' as Tab, label: t('insurance.tabTransactions'), icon: <TransactionIcon /> },
    { id: 'patient_links' as Tab, label: t('insurance.tabPatientCoverage'), icon: <PatientIcon /> },
    { id: 'treatment_links' as Tab, label: t('insurance.tabTreatmentClaims'), icon: <ClaimIcon /> },
    { id: 'reports' as Tab, label: t('insurance.tabReports'), icon: <ReportIcon /> },
  ];

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'ACTIVE': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'INACTIVE': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      'SUSPENDED': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'PENDING': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      'APPROVED': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'REJECTED': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'PAID': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
    const labels: Record<string, string> = {
      'ACTIVE': t('insurance.active'),
      'INACTIVE': t('insurance.inactive'),
      'SUSPENDED': t('insurance.suspended'),
      'PENDING': t('insurance.pending'),
      'APPROVED': t('insurance.approved'),
      'REJECTED': t('insurance.rejected'),
      'PAID': t('insurance.paid'),
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-l from-emerald-50 to-white p-4 dark:border-slate-700 dark:from-emerald-900/20 dark:to-slate-900">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('insurance.description')}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePrintReport} 
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white flex items-center gap-2 hover:bg-emerald-700 transition-colors"
            >
              <PrintIcon />
              {t('insurance.printReport')}
            </button>
            <button 
              onClick={load} 
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white flex items-center gap-2 hover:bg-slate-800 transition-colors dark:bg-slate-100 dark:text-slate-900"
            >
              <RefreshIcon />
              {t('insurance.refresh')}
            </button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-lg bg-white/80 dark:bg-slate-800/80 p-3 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('insurance.companies')}</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.totalCompanies}</p>
          </div>
          <div className="rounded-lg bg-white/80 dark:bg-slate-800/80 p-3 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('insurance.activeAccounts')}</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.activeAccounts}</p>
          </div>
          <div className="rounded-lg bg-white/80 dark:bg-slate-800/80 p-3 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('insurance.transactions')}</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.totalTransactions}</p>
          </div>
          <div className="rounded-lg bg-white/80 dark:bg-slate-800/80 p-3 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('insurance.insuredPatients')}</p>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.totalPatientLinks}</p>
          </div>
          <div className="rounded-lg bg-white/80 dark:bg-slate-800/80 p-3 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('insurance.claims')}</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.totalClaims}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ms-2 text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        {tabConfig.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400">{t('insurance.loading')}</p>
        </div>
      )}

      {/* Companies Tab */}
      {!loading && tab === 'companies' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">{companyForm.id ? t('insurance.editCompany') : t('insurance.addNewCompany')}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <input 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                placeholder={t('insurance.companyName') + ' *'} 
                value={companyForm.name || ''} 
                onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} 
              />
              <input 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                placeholder={t('insurance.phone')} 
                value={companyForm.phone || ''} 
                onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} 
              />
              <input 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                placeholder={t('insurance.email')} 
                value={companyForm.email || ''} 
                onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} 
              />
              <div className="flex gap-2">
                <button 
                  onClick={saveCompany} 
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 text-white font-medium hover:bg-emerald-700 transition-colors"
                >
                  {companyForm.id ? t('insurance.update') : t('insurance.add')}
                </button>
                {companyForm.id && (
                  <button 
                    onClick={() => setCompanyForm({ name: '' })} 
                    className="rounded-lg bg-slate-200 px-4 py-3 text-slate-700 hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-300"
                  >
                    {t('insurance.cancel')}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.companyName')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.phone')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.email')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.numberOfAccounts')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(x => {
                  const companyAccounts = accounts.filter(a => a.insurance_company_id === x.id);
                  return (
                    <tr key={x.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{x.name}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{x.phone || '-'}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{x.email || '-'}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs dark:bg-blue-900/30 dark:text-blue-400">
                          {companyAccounts.length} {t('insurance.accounts')}
                        </span>
                      </td>
                      <td className="p-3 space-x-2 rtl:space-x-reverse">
                        <button 
                          className="rounded-lg bg-amber-500 px-3 py-1.5 text-white text-xs font-medium hover:bg-amber-600 transition-colors" 
                          onClick={() => setCompanyForm(x)}
                        >
                          {t('common.edit')}
                        </button>
                        <button 
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-white text-xs font-medium hover:bg-red-700 transition-colors" 
                          onClick={() => void del('insurance_companies', x.id)}
                        >
                          {t('common.delete')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {companies.length === 0 && (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('insurance.noCompanies')}</div>
            )}
          </div>
        </div>
      )}

      {/* Accounts Tab */}
      {!loading && tab === 'accounts' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">{accountForm.id ? t('insurance.editAccount') : t('insurance.addNewAccount')}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <select 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500" 
                value={accountForm.insurance_company_id || ''} 
                onChange={e => setAccountForm({ ...accountForm, insurance_company_id: e.target.value })}
              >
                <option value="">{t('insurance.selectCompany')}</option>
                {companies.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
              <input 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500" 
                placeholder={t('insurance.accountName') + ' *'} 
                value={accountForm.account_name || ''} 
                onChange={e => setAccountForm({ ...accountForm, account_name: e.target.value })} 
              />
              <input 
                type="number" 
                step="0.01" 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500" 
                placeholder={t('insurance.balance')} 
                value={accountForm.balance || 0} 
                onChange={e => setAccountForm({ ...accountForm, balance: Number(e.target.value) })} 
              />
              <select 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500" 
                value={accountForm.status || 'ACTIVE'} 
                onChange={e => setAccountForm({ ...accountForm, status: e.target.value as Account['status'] })}
              >
                <option value="ACTIVE">{t('insurance.active')}</option>
                <option value="INACTIVE">{t('insurance.inactive')}</option>
                <option value="SUSPENDED">{t('insurance.suspended')}</option>
              </select>
              <div className="flex gap-2">
                <button 
                  onClick={saveAccount} 
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 text-white font-medium hover:bg-emerald-700 transition-colors"
                >
                  {accountForm.id ? t('insurance.update') : t('insurance.add')}
                </button>
                {accountForm.id && (
                  <button 
                    onClick={() => setAccountForm({ insurance_company_id: '', account_name: '', balance: 0, status: 'ACTIVE' })} 
                    className="rounded-lg bg-slate-200 px-4 py-3 text-slate-700 hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-300"
                  >
                    {t('insurance.cancel')}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.company')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.accountName')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.balance')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.status')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(x => (
                  <tr key={x.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{companyName[x.insurance_company_id] || '-'}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{x.account_name}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{Number(x.balance || 0).toFixed(2)} EGP</td>
                    <td className="p-3">{getStatusBadge(x.status)}</td>
                    <td className="p-3 space-x-2 rtl:space-x-reverse">
                      <button 
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-white text-xs font-medium hover:bg-amber-600 transition-colors" 
                        onClick={() => setAccountForm(x)}
                      >
                        {t('common.edit')}
                      </button>
                      <button 
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-white text-xs font-medium hover:bg-red-700 transition-colors" 
                        onClick={() => void del('insurance_accounts', x.id)}
                      >
                        {t('common.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {accounts.length === 0 && (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('insurance.noAccounts')}</div>
            )}
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {!loading && tab === 'transactions' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">{txnForm.id ? t('insurance.editTransaction') : t('insurance.addNewTransaction')}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
              <select 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500" 
                value={txnForm.insurance_account_id || ''} 
                onChange={e => setTxnForm({ ...txnForm, insurance_account_id: e.target.value })}
              >
                <option value="">{t('insurance.selectAccount')}</option>
                {accounts.map(x => <option key={x.id} value={x.id}>{x.account_name}</option>)}
              </select>
              <select 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500" 
                value={txnForm.transaction_type || 'DEBIT'} 
                onChange={e => setTxnForm({ ...txnForm, transaction_type: e.target.value as Txn['transaction_type'] })}
              >
                <option value="DEBIT">{t('insurance.debit')}</option>
                <option value="CREDIT">{t('insurance.credit')}</option>
              </select>
              <input 
                type="number" 
                step="0.01" 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500" 
                placeholder={t('insurance.amount')} 
                value={txnForm.amount || 0} 
                onChange={e => setTxnForm({ ...txnForm, amount: Number(e.target.value) })} 
              />
              <input 
                type="date" 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500" 
                value={txnForm.transaction_date || ''} 
                onChange={e => setTxnForm({ ...txnForm, transaction_date: e.target.value })} 
              />
              <input 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500" 
                placeholder={t('insurance.descriptionText')} 
                value={txnForm.description || ''} 
                onChange={e => setTxnForm({ ...txnForm, description: e.target.value })} 
              />
              <div className="flex gap-2">
                <button 
                  onClick={saveTxn} 
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 text-white font-medium hover:bg-emerald-700 transition-colors"
                >
                  {txnForm.id ? t('insurance.update') : t('insurance.add')}
                </button>
                {txnForm.id && (
                  <button 
                    onClick={() => setTxnForm({ insurance_account_id: '', transaction_type: 'DEBIT', amount: 0, transaction_date: new Date().toISOString().split('T')[0], description: '', reference_number: '' })} 
                    className="rounded-lg bg-slate-200 px-4 py-3 text-slate-700 hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-300"
                  >
                    {t('insurance.cancel')}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.date')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.account')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('transaction_type')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.amount')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.descriptionText')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(x => (
                  <tr key={x.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 text-slate-600 dark:text-slate-400">{x.transaction_date}</td>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{accountName[x.insurance_account_id] || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${x.transaction_type === 'CREDIT' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {x.transaction_type === 'CREDIT' ? 'إيداع' : 'سحب'}
                      </span>
                    </td>
                    <td className={`p-3 font-semibold ${x.transaction_type === 'CREDIT' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {x.transaction_type === 'CREDIT' ? '+' : '-'}{Number(x.amount || 0).toFixed(2)} ج.م
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{x.description || '-'}</td>
                    <td className="p-3 space-x-2 rtl:space-x-reverse">
                      <button 
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-white text-xs font-medium hover:bg-amber-600 transition-colors" 
                        onClick={() => setTxnForm(x)}
                      >
                        تعديل
                      </button>
                      <button 
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-white text-xs font-medium hover:bg-red-700 transition-colors" 
                        onClick={() => void del('insurance_transactions', x.id)}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('insurance.noTransactions')}</div>
            )}
          </div>
        </div>
      )}

      {/* Patient Links Tab */}
      {!loading && tab === 'patient_links' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">{patientLinkForm.id ? t('insurance.editPatientCoverage') : t('insurance.addNewPatientCoverage')}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
              <div className="relative">
                <input 
                  type="text" 
                  list="patient-list"
                  placeholder={t('insurance.searchPatient')} 
                  value={patientSearch}
                  onChange={e => {
                    setPatientSearch(e.target.value);
                    const matched = patients.find(p => p.name.toLowerCase() === e.target.value.toLowerCase());
                    if (matched) {
                      setPatientLinkForm({ ...patientLinkForm, patient_id: matched.id });
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500"
                />
                <datalist id="patient-list">
                  {patients.map(x => <option key={x.id} value={x.name} />)}
                </datalist>
              </div>
              <select 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500" 
                value={patientLinkForm.insurance_company_id || ''} 
                onChange={e => setPatientLinkForm({ ...patientLinkForm, insurance_company_id: e.target.value })}
              >
                <option value="">{t('insurance.selectCompanyRequired')}</option>
                {companies.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
              <input 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500" 
                placeholder={t('insurance.policyNumber')} 
                value={patientLinkForm.policy_number || ''} 
                onChange={e => setPatientLinkForm({ ...patientLinkForm, policy_number: e.target.value })} 
              />
              <input 
                type="number" 
                min="0" 
                max="100" 
                step="0.01" 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500" 
                placeholder={t('insurance.coveragePercentage')} 
                value={patientLinkForm.coverage_percentage ?? 100} 
                onChange={e => setPatientLinkForm({ ...patientLinkForm, coverage_percentage: Number(e.target.value) })} 
              />
              <input 
                type="date" 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500" 
                placeholder={t('insurance.startDate')} 
                value={patientLinkForm.effective_date || ''} 
                onChange={e => setPatientLinkForm({ ...patientLinkForm, effective_date: e.target.value })} 
              />
              <div className="flex gap-2">
                <button 
                  onClick={savePatientLink} 
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 text-white font-medium hover:bg-emerald-700 transition-colors"
                >
                  {patientLinkForm.id ? t('insurance.update') : t('insurance.add')}
                </button>
                {patientLinkForm.id && (
                  <button 
                    onClick={() => setPatientLinkForm({ patient_id: '', insurance_company_id: '', coverage_percentage: 100, policy_number: '', effective_date: '', expiry_date: '' })} 
                    className="rounded-lg bg-slate-200 px-4 py-3 text-slate-700 hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-300"
                  >
                    {t('insurance.cancel')}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.patient')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.company')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.policyNumber')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.coveragePercentage')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.startDate')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.endDate')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatientLinks.map(x => (
                  <tr key={x.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{patientName[x.patient_id] || '-'}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{companyName[x.insurance_company_id] || '-'}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{x.policy_number || '-'}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium dark:bg-blue-900/30 dark:text-blue-400">
                        {Number(x.coverage_percentage || 0)}%
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{x.effective_date || '-'}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{x.expiry_date || '-'}</td>
                    <td className="p-3 space-x-2 rtl:space-x-reverse">
                      <button 
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-white text-xs font-medium hover:bg-amber-600 transition-colors" 
                        onClick={() => setPatientLinkForm(x)}
                      >
                        {t('common.edit')}
                      </button>
                      <button 
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-white text-xs font-medium hover:bg-red-700 transition-colors" 
                        onClick={() => void del('patient_insurance_link', x.id)}
                      >
                        {t('common.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPatientLinks.length === 0 && (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('insurance.noPatientCoverage')}</div>
            )}
          </div>
        </div>
      )}

      {/* Treatment Links Tab */}
      {!loading && tab === 'treatment_links' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">{treatmentLinkForm.id ? 'تعديل مطالبة' : 'إضافة مطالبة جديدة'}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
<select 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500" 
                value={treatmentLinkForm.treatment_record_id || ''} 
                onChange={e => setTreatmentLinkForm({ ...treatmentLinkForm, treatment_record_id: e.target.value })}
              >
                <option value="">اختر العلاج *</option>
                {availableTreatmentsForClaim.map(x => (
                  <option key={x.id} value={x.id}>
                    {x.patient_name} - {(x.treatment_name || x.notes || x.id).slice(0, 30)}
                  </option>
                ))}
              </select>
              <select 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500" 
                value={treatmentLinkForm.insurance_company_id || ''} 
                onChange={e => setTreatmentLinkForm({ ...treatmentLinkForm, insurance_company_id: e.target.value })}
              >
                <option value="">اختر الشركة *</option>
                {companies.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
              <input 
                type="number" 
                step="0.01" 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500" 
                placeholder="مبلغ المطالبة" 
                value={treatmentLinkForm.claim_amount || 0} 
                onChange={e => setTreatmentLinkForm({ ...treatmentLinkForm, claim_amount: Number(e.target.value) })} 
              />
              <select 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500" 
                value={treatmentLinkForm.claim_status || 'PENDING'} 
                onChange={e => setTreatmentLinkForm({ ...treatmentLinkForm, claim_status: e.target.value as TreatmentLink['claim_status'] })}
              >
                <option value="PENDING">قيد الانتظار</option>
                <option value="APPROVED">معتمد</option>
                <option value="REJECTED">مرفوض</option>
                <option value="PAID">مدفوع</option>
              </select>
              <input 
                type="date" 
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500" 
                value={treatmentLinkForm.claim_date || ''} 
                onChange={e => setTreatmentLinkForm({ ...treatmentLinkForm, claim_date: e.target.value })} 
              />
              <div className="flex gap-2">
                <button 
                  onClick={saveTreatmentLink} 
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 text-white font-medium hover:bg-emerald-700 transition-colors"
                >
                  {treatmentLinkForm.id ? 'تحديث' : 'إضافة'}
                </button>
                {treatmentLinkForm.id && (
                  <button 
                    onClick={() => setTreatmentLinkForm({ treatment_record_id: '', insurance_company_id: '', claim_amount: 0, claim_status: 'PENDING', claim_date: new Date().toISOString().split('T')[0], payment_date: '' })} 
                    className="rounded-lg bg-slate-200 px-4 py-3 text-slate-700 hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-300"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.patient')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.treatment')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.company')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.amount')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.status')}</th>
                  <th className="p-3 text-start font-semibold text-slate-700 dark:text-slate-300">{t('insurance.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTreatmentLinks.map(x => {
                  const treatment = treatments.find(t => t.id === x.treatment_record_id);
                  return (
                    <tr key={x.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{treatment?.patient_name || '-'}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{treatmentName[x.treatment_record_id] || '-'}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{companyName[x.insurance_company_id] || '-'}</td>
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{Number(x.claim_amount || 0).toFixed(2)} EGP</td>
                      <td className="p-3">{getStatusBadge(x.claim_status)}</td>
                      <td className="p-3 space-x-2 rtl:space-x-reverse">
                        <button 
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white text-xs font-medium hover:bg-emerald-700 transition-colors" 
                          onClick={() => printClaim(x)}
                        >
                          {t('common.print')}
                        </button>
                        <button 
                          className="rounded-lg bg-amber-500 px-3 py-1.5 text-white text-xs font-medium hover:bg-amber-600 transition-colors" 
                          onClick={() => setTreatmentLinkForm(x)}
                        >
                          {t('common.edit')}
                        </button>
                        <button 
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-white text-xs font-medium hover:bg-red-700 transition-colors" 
                          onClick={() => void del('treatment_insurance_link', x.id)}
                        >
                          {t('common.delete')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredTreatmentLinks.length === 0 && (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('insurance.noTreatmentClaims')}</div>
            )}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {!loading && tab === 'reports' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">{t('insurance.reports')}</h3>
            
            {/* Report Type Selection */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              {[
                { id: 'summary', label: t('insurance.summaryReport'), icon: '📊' },
                { id: 'claims', label: t('insurance.claimsReport'), icon: '📋' },
                { id: 'patients', label: t('insurance.patientsReport'), icon: '👥' },
                { id: 'transactions', label: t('insurance.transactionsReport'), icon: '💰' },
                { id: 'account-statement', label: t('insurance.accountStatement'), icon: '📄' },
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setReportType(r.id as typeof reportType)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    reportType === r.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <span className="text-2xl">{r.icon}</span>
                  <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">{r.label}</p>
                </button>
              ))}
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <select
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700"
                value={reportFilters.companyId}
                onChange={e => setReportFilters({ ...reportFilters, companyId: e.target.value })}
              >
                <option value="">{t('insurance.allCompanies')}</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700"
                value={reportFilters.accountId}
                onChange={e => setReportFilters({ ...reportFilters, accountId: e.target.value })}
              >
                <option value="">{t('insurance.allAccounts')}</option>
                {accounts.filter(a => !reportFilters.companyId || a.insurance_company_id === reportFilters.companyId).map(a => (
                  <option key={a.id} value={a.id}>{a.account_name}</option>
                ))}
              </select>
              <input
                type="date"
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700"
                value={reportFilters.dateFrom}
                onChange={e => setReportFilters({ ...reportFilters, dateFrom: e.target.value })}
                placeholder={t('insurance.fromDate')}
              />
              <input
                type="date"
                className="rounded-lg border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700"
                value={reportFilters.dateTo}
                onChange={e => setReportFilters({ ...reportFilters, dateTo: e.target.value })}
                placeholder={t('insurance.toDate')}
              />
            </div>
            
            <button
              onClick={handlePrintReport}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-white font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <PrintIcon />
              {t('insurance.viewAndPrintReport')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceManagementPage;
