import React, { useState } from 'react';
import { useClinicData } from '../../hooks/useClinicData';
import { useI18n } from '../../hooks/useI18n';
import { Patient } from '../../types';
import { View } from '../../types';

type AccountType = 'patient' | 'doctor' | 'supplier' | 'clinic';

interface AccountSelectionPageProps {
  setCurrentView: (view: View) => void;
}

const AccountSelectionPage: React.FC<AccountSelectionPageProps> = ({ setCurrentView }) => {
  const { t } = useI18n();
  const { patients, dentists, suppliers } = useClinicData();

  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>('patient');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  const getEntities = () => {
    switch (selectedAccountType) {
      case 'patient':
        return patients;
      case 'doctor':
        return dentists;
      case 'supplier':
        return suppliers;
      case 'clinic':
        return [{ id: 'clinic', name: t('financialAccounts.accountDetails.clinicAccount') }];
      default:
        return [];
    }
  };

  const entities = getEntities();

  const handleViewDetails = () => {
    if (!selectedEntityId) return;
    sessionStorage.setItem('selectedAccountType', selectedAccountType);
    sessionStorage.setItem('selectedEntityId', selectedEntityId);
    setCurrentView('accountDetails');
  };

  const inactiveTypeClass = 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          {t('financialAccounts.accountDetails.title')}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {t('financialAccounts.accountDetails.selectAccount')}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 border border-slate-200 dark:border-slate-700">
        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
            {t('financialAccounts.accountDetails.accountType')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => {
                setSelectedAccountType('patient');
                setSelectedEntityId('');
              }}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                selectedAccountType === 'patient' ? 'border-primary bg-primary/5 text-primary' : inactiveTypeClass
              }`}
            >
              <div className="text-2xl mb-2">P</div>
              <div className="font-medium">{t('financialAccounts.accountDetails.accountTypes.patient')}s</div>
            </button>
            <button
              onClick={() => {
                setSelectedAccountType('doctor');
                setSelectedEntityId('');
              }}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                selectedAccountType === 'doctor' ? 'border-primary bg-primary/5 text-primary' : inactiveTypeClass
              }`}
            >
              <div className="text-2xl mb-2">D</div>
              <div className="font-medium">{t('financialAccounts.accountDetails.accountTypes.doctor')}s</div>
            </button>
            <button
              onClick={() => {
                setSelectedAccountType('supplier');
                setSelectedEntityId('');
              }}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                selectedAccountType === 'supplier' ? 'border-primary bg-primary/5 text-primary' : inactiveTypeClass
              }`}
            >
              <div className="text-2xl mb-2">S</div>
              <div className="font-medium">{t('financialAccounts.accountDetails.accountTypes.supplier')}s</div>
            </button>
            <button
              onClick={() => {
                setSelectedAccountType('clinic');
                setSelectedEntityId('clinic');
              }}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                selectedAccountType === 'clinic' ? 'border-primary bg-primary/5 text-primary' : inactiveTypeClass
              }`}
            >
              <div className="text-2xl mb-2">C</div>
              <div className="font-medium">{t('financialAccounts.accountDetails.accountTypes.clinic')}</div>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
            {t('financialAccounts.accountDetails.selectEntity')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {t('financialAccounts.accountDetails.selectAccount')}
          </p>
          {entities.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {entities.map((entity) => (
                <label
                  key={entity.id}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedEntityId === entity.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="entity"
                    value={entity.id}
                    checked={selectedEntityId === entity.id}
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      selectedEntityId === entity.id ? 'border-primary bg-primary' : 'border-slate-300 dark:border-slate-500'
                    }`}
                  >
                    {selectedEntityId === entity.id && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                  </div>
                  <div className="flex-1">
                    <span className="text-lg font-medium text-slate-800 dark:text-slate-100">{entity.name}</span>
                    {(entity as Patient).phone && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{(entity as Patient).phone}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : selectedAccountType !== 'clinic' ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">No data available</div>
          ) : null}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleViewDetails}
            disabled={!selectedEntityId}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${
              selectedEntityId ? 'bg-primary hover:bg-primary-dark shadow-lg hover:shadow-xl' : 'bg-slate-300 dark:bg-slate-600 cursor-not-allowed'
            }`}
          >
            {t('financialAccounts.accountDetails.title')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 text-center border border-slate-100 dark:border-slate-700">
          <div className="text-3xl mb-2">P</div>
          <div className="text-2xl font-bold text-primary mb-2">{patients.length}</div>
          <div className="text-slate-600 dark:text-slate-400">{t('financialAccounts.accountDetails.accountTypes.patient')}s</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 text-center border border-slate-100 dark:border-slate-700">
          <div className="text-3xl mb-2">D</div>
          <div className="text-2xl font-bold text-primary mb-2">{dentists.length}</div>
          <div className="text-slate-600 dark:text-slate-400">{t('financialAccounts.accountDetails.accountTypes.doctor')}s</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 text-center border border-slate-100 dark:border-slate-700">
          <div className="text-3xl mb-2">S</div>
          <div className="text-2xl font-bold text-primary mb-2">{suppliers.length}</div>
          <div className="text-slate-600 dark:text-slate-400">{t('financialAccounts.accountDetails.accountTypes.supplier')}s</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 text-center border border-slate-100 dark:border-slate-700">
          <div className="text-3xl mb-2">C</div>
          <div className="text-2xl font-bold text-primary mb-2">1</div>
          <div className="text-slate-600 dark:text-slate-400">{t('financialAccounts.accountDetails.accountTypes.clinic')}</div>
        </div>
      </div>
    </div>
  );
};

export default AccountSelectionPage;
