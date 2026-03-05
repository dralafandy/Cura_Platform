import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../hooks/useI18n';

interface TreatmentInsuranceLink {
  id: string;
  treatment_record_id: string;
  insurance_company_id: string;
  claim_amount: number;
  claim_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  claim_date: string;
  payment_date: string;
  notes: string;
  created_at: string;
  treatment_record_details: string;
  insurance_company_name: string;
}

const TreatmentInsuranceLinkPage: React.FC = () => {
  const { t } = useI18n();
  const { user, currentClinic, accessibleClinics } = useAuth();
  const activeClinicId = useMemo(
    () => currentClinic?.id || accessibleClinics.find((c) => c.isDefault)?.clinicId || accessibleClinics[0]?.clinicId || null,
    [currentClinic, accessibleClinics]
  );
  const [treatmentInsuranceLinks, setTreatmentInsuranceLinks] = useState<TreatmentInsuranceLink[]>([]);
  const [treatmentRecords, setTreatmentRecords] = useState<{ id: string; details: string }[]>([]);
  const [insuranceCompanies, setInsuranceCompanies] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentLink, setCurrentLink] = useState<Partial<TreatmentInsuranceLink>>({
    treatment_record_id: '',
    insurance_company_id: '',
    claim_amount: 0,
    claim_status: 'PENDING',
    claim_date: new Date().toISOString().split('T')[0],
    payment_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchTreatmentRecords();
    fetchInsuranceCompanies();
    fetchTreatmentInsuranceLinks();
  }, [user?.id, activeClinicId]);

  const fetchTreatmentRecords = async () => {
    try {
      if (!supabase || !user?.id || !activeClinicId) return;
      const { data, error } = await supabase
        .from('treatment_records')
        .select('id, notes')
        .eq('clinic_id', activeClinicId);

      if (error) throw error;

      const formattedRecords = data.map(record => ({
        id: record.id,
        details: record.notes || 'No details'
      }));

      setTreatmentRecords(formattedRecords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch treatment records');
    }
  };

  const fetchInsuranceCompanies = async () => {
    try {
      if (!supabase || !user?.id || !activeClinicId) return;
      const { data, error } = await supabase
        .from('insurance_companies')
        .select('id, name')
        .eq('clinic_id', activeClinicId);

      if (error) throw error;
      setInsuranceCompanies(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insurance companies');
    }
  };

  const fetchTreatmentInsuranceLinks = async () => {
    try {
      if (!supabase || !user?.id || !activeClinicId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('treatment_insurance_link')
        .select('*, treatment_records(notes), insurance_companies(name)')
        .eq('clinic_id', activeClinicId);

      if (error) throw error;

      const linksWithNames = data.map(link => ({
        ...link,
        treatment_record_details: link.treatment_records?.notes || 'No details',
        insurance_company_name: link.insurance_companies?.name || 'Unknown'
      }));

      setTreatmentInsuranceLinks(linksWithNames);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch treatment insurance links');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = () => {
    setCurrentLink({
      treatment_record_id: '',
      insurance_company_id: '',
      claim_amount: 0,
      claim_status: 'PENDING',
      claim_date: new Date().toISOString().split('T')[0],
      payment_date: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleEditLink = (link: TreatmentInsuranceLink) => {
    setCurrentLink(link);
    setShowModal(true);
  };

  const handleDeleteLink = async (id: string) => {
    if (window.confirm(t('confirm_delete_treatment_insurance_link'))) {
      try {
        if (!supabase) return;
        const { error } = await supabase
          .from('treatment_insurance_link')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchTreatmentInsuranceLinks();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete treatment insurance link');
      }
    }
  };

  const handleSaveLink = async () => {
    if (!currentLink || !supabase || !user?.id || !activeClinicId) return;

    try {
      if (currentLink.id) {
        // Update existing link
        const { error } = await supabase
          .from('treatment_insurance_link')
          .update({ ...currentLink, clinic_id: activeClinicId })
          .eq('id', currentLink.id);
        if (error) throw error;
      } else {
        // Add new link
        const { error } = await supabase
          .from('treatment_insurance_link')
          .insert([{ ...currentLink, user_id: user.id, clinic_id: activeClinicId }]);
        if (error) throw error;
      }
      setShowModal(false);
      fetchTreatmentInsuranceLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save treatment insurance link');
    }
  };

  return (
    <div className="p-4 text-slate-800 dark:text-slate-200">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">{t('treatment_insurance_links')}</h1>

      {error && <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">{error}</div>}

      <button
        onClick={handleAddLink}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        {t('add_treatment_insurance_link')}
      </button>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <table className="min-w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{t('treatment_record')}</th>
                <th className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{t('insurance_company')}</th>
                <th className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{t('claim_amount')}</th>
                <th className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{t('claim_status')}</th>
                <th className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{t('claim_date')}</th>
                <th className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{t('payment_date')}</th>
                <th className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {treatmentInsuranceLinks.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/60">
                  <td className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{link.treatment_record_details}</td>
                  <td className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{link.insurance_company_name}</td>
                  <td className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{link.claim_amount}</td>
                  <td className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{link.claim_status}</td>
                  <td className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{link.claim_date}</td>
                  <td className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{link.payment_date}</td>
                  <td className="py-2 px-4 border-b border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => handleEditLink(link)}
                      className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded mr-2"
                    >
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                    >
                      {t('delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-600/50 dark:bg-black/60 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border border-slate-200 dark:border-slate-700 w-96 shadow-lg rounded-md bg-white dark:bg-slate-800">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
              {currentLink?.id ? t('edit_treatment_insurance_link') : t('add_treatment_insurance_link')}
            </h3>

            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="treatment_record_id">
                {t('treatment_record')}
              </label>
              <select
                id="treatment_record_id"
                value={currentLink.treatment_record_id || ''}
                onChange={(e) => setCurrentLink({ ...currentLink, treatment_record_id: e.target.value })}
                className="shadow appearance-none border border-slate-300 dark:border-slate-600 rounded w-full py-2 px-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">{t('select_treatment_record')}</option>
                {treatmentRecords.map((record) => (
                  <option key={record.id} value={record.id}>{record.details}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="insurance_company_id">
                {t('insurance_company')}
              </label>
              <select
                id="insurance_company_id"
                value={currentLink.insurance_company_id || ''}
                onChange={(e) => setCurrentLink({ ...currentLink, insurance_company_id: e.target.value })}
                className="shadow appearance-none border border-slate-300 dark:border-slate-600 rounded w-full py-2 px-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">{t('select_insurance_company')}</option>
                {insuranceCompanies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="claim_amount">
                {t('claim_amount')}
              </label>
              <input
                id="claim_amount"
                type="number"
                step="0.01"
                value={currentLink.claim_amount || 0}
                onChange={(e) => setCurrentLink({ ...currentLink, claim_amount: parseFloat(e.target.value) })}
                className="shadow appearance-none border border-slate-300 dark:border-slate-600 rounded w-full py-2 px-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="claim_status">
                {t('claim_status')}
              </label>
              <select
                id="claim_status"
                value={currentLink.claim_status || 'PENDING'}
                onChange={(e) => setCurrentLink({ ...currentLink, claim_status: e.target.value as 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' })}
                className="shadow appearance-none border border-slate-300 dark:border-slate-600 rounded w-full py-2 px-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="PENDING">{t('pending')}</option>
                <option value="APPROVED">{t('approved')}</option>
                <option value="REJECTED">{t('rejected')}</option>
                <option value="PAID">{t('paid')}</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="claim_date">
                {t('claim_date')}
              </label>
              <input
                id="claim_date"
                type="date"
                value={currentLink.claim_date || ''}
                onChange={(e) => setCurrentLink({ ...currentLink, claim_date: e.target.value })}
                className="shadow appearance-none border border-slate-300 dark:border-slate-600 rounded w-full py-2 px-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="payment_date">
                {t('payment_date')}
              </label>
              <input
                id="payment_date"
                type="date"
                value={currentLink.payment_date || ''}
                onChange={(e) => setCurrentLink({ ...currentLink, payment_date: e.target.value })}
                className="shadow appearance-none border border-slate-300 dark:border-slate-600 rounded w-full py-2 px-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="notes">
                {t('notes')}
              </label>
              <textarea
                id="notes"
                value={currentLink.notes || ''}
                onChange={(e) => setCurrentLink({ ...currentLink, notes: e.target.value })}
                className="shadow appearance-none border border-slate-300 dark:border-slate-600 rounded w-full py-2 px-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-500 hover:bg-gray-700 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-bold py-2 px-4 rounded mr-2"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSaveLink}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatmentInsuranceLinkPage;
