import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../hooks/useI18n';

interface PatientInsuranceLink {
  id: string;
  patient_id: string;
  insurance_company_id: string;
  policy_number: string;
  coverage_percentage: number;
  effective_date: string;
  expiry_date: string;
  notes: string;
  created_at: string;
  patient_name: string;
  insurance_company_name: string;
}

const PatientInsuranceLinkPage: React.FC = () => {
  const { t } = useI18n();
  const { user, currentClinic, accessibleClinics } = useAuth();
  const activeClinicId = useMemo(
    () => currentClinic?.id || accessibleClinics.find((c) => c.isDefault)?.clinicId || accessibleClinics[0]?.clinicId || null,
    [currentClinic, accessibleClinics]
  );
  const [patientInsuranceLinks, setPatientInsuranceLinks] = useState<PatientInsuranceLink[]>([]);
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [insuranceCompanies, setInsuranceCompanies] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentLink, setCurrentLink] = useState<Partial<PatientInsuranceLink>>({
    patient_id: '',
    insurance_company_id: '',
    policy_number: '',
    coverage_percentage: 100,
    effective_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchPatients();
    fetchInsuranceCompanies();
    fetchPatientInsuranceLinks();
  }, [user?.id, activeClinicId]);

  const fetchPatients = async () => {
    try {
      if (!supabase || !user?.id || !activeClinicId) return;
      const { data, error } = await supabase
        .from('patients')
        .select('id, name')
        .eq('clinic_id', activeClinicId);

      if (error) throw error;
      setPatients(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patients');
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

  const fetchPatientInsuranceLinks = async () => {
    try {
      if (!supabase || !user?.id || !activeClinicId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('patient_insurance_link')
        .select('*, patients(name), insurance_companies(name)')
        .eq('clinic_id', activeClinicId);

      if (error) throw error;

      const linksWithNames = data.map(link => ({
        ...link,
        patient_name: link.patients?.name || 'Unknown',
        insurance_company_name: link.insurance_companies?.name || 'Unknown'
      }));

      setPatientInsuranceLinks(linksWithNames);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patient insurance links');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = () => {
    setCurrentLink({
      patient_id: '',
      insurance_company_id: '',
      policy_number: '',
      coverage_percentage: 100,
      effective_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleEditLink = (link: PatientInsuranceLink) => {
    setCurrentLink(link);
    setShowModal(true);
  };

  const handleDeleteLink = async (id: string) => {
    if (window.confirm(t('confirm_delete_patient_insurance_link'))) {
      try {
        if (!supabase) return;
        const { error } = await supabase
          .from('patient_insurance_link')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchPatientInsuranceLinks();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete patient insurance link');
      }
    }
  };

  const handleSaveLink = async () => {
    if (!currentLink || !supabase || !user?.id || !activeClinicId) return;

    try {
      const linkToSave = {
        ...currentLink,
        user_id: user.id,
        clinic_id: activeClinicId,
        expiry_date: currentLink.expiry_date === '' ? null : currentLink.expiry_date
      };

      if (currentLink.id) {
        // Update existing link
        const { error } = await supabase
          .from('patient_insurance_link')
          .update(linkToSave)
          .eq('id', currentLink.id);
        if (error) throw error;
      } else {
        // Add new link
        const { error } = await supabase
          .from('patient_insurance_link')
          .insert([linkToSave]);
        if (error) throw error;
      }
      setShowModal(false);
      fetchPatientInsuranceLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save patient insurance link');
    }
  };

  return (
    <div className="p-4 text-slate-800 dark:text-slate-200">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">{t('patient_insurance_links')}</h1>

      {error && <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">{error}</div>}

      <button
        onClick={handleAddLink}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        {t('add_patient_insurance_link')}
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
                <th className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{t('patient')}</th>
                <th className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{t('insurance_company')}</th>
                <th className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{t('policy_number')}</th>
                <th className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{t('coverage_percentage')}</th>
                <th className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{t('effective_date')}</th>
                <th className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{t('expiry_date')}</th>
                <th className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {patientInsuranceLinks.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/60">
                  <td className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{link.patient_name}</td>
                  <td className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{link.insurance_company_name}</td>
                  <td className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{link.policy_number}</td>
                  <td className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{link.coverage_percentage}%</td>
                  <td className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{link.effective_date}</td>
                  <td className="py-2 px-4 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">{link.expiry_date}</td>
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
              {currentLink?.id ? t('edit_patient_insurance_link') : t('add_patient_insurance_link')}
            </h3>

            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="patient_id">
                {t('patient')}
              </label>
              <select
                id="patient_id"
                value={currentLink.patient_id || ''}
                onChange={(e) => setCurrentLink({ ...currentLink, patient_id: e.target.value })}
                className="shadow appearance-none border border-slate-300 dark:border-slate-600 rounded w-full py-2 px-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">{t('select_patient')}</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>{patient.name}</option>
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
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="policy_number">
                {t('policy_number')}
              </label>
              <input
                id="policy_number"
                type="text"
                value={currentLink.policy_number || ''}
                onChange={(e) => setCurrentLink({ ...currentLink, policy_number: e.target.value })}
                className="shadow appearance-none border border-slate-300 dark:border-slate-600 rounded w-full py-2 px-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="coverage_percentage">
                {t('coverage_percentage')}
              </label>
              <input
                id="coverage_percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={currentLink.coverage_percentage || 100}
                onChange={(e) => setCurrentLink({ ...currentLink, coverage_percentage: parseFloat(e.target.value) })}
                className="shadow appearance-none border border-slate-300 dark:border-slate-600 rounded w-full py-2 px-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="effective_date">
                {t('effective_date')}
              </label>
              <input
                id="effective_date"
                type="date"
                value={currentLink.effective_date || ''}
                onChange={(e) => setCurrentLink({ ...currentLink, effective_date: e.target.value })}
                className="shadow appearance-none border border-slate-300 dark:border-slate-600 rounded w-full py-2 px-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="expiry_date">
                {t('expiry_date')}
              </label>
              <input
                id="expiry_date"
                type="date"
                value={currentLink.expiry_date || ''}
                onChange={(e) => setCurrentLink({ ...currentLink, expiry_date: e.target.value })}
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

export default PatientInsuranceLinkPage;
