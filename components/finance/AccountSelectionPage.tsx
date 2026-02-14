import React, { useState, useMemo } from 'react';
import { useClinicData } from '../../hooks/useClinicData';
import { useI18n } from '../../hooks/useI18n';
import { useAuth } from '../../contexts/AuthContext';
import { Patient, Dentist, Supplier } from '../../types';
import { View } from '../../types';


type AccountType = 'patient' | 'doctor' | 'supplier' | 'clinic';

interface AccountSelectionPageProps {
  setCurrentView: (view: View) => void;
}

const AccountSelectionPage: React.FC<AccountSelectionPageProps> = ({ setCurrentView }) => {
   const { t } = useI18n();
   const { userProfile } = useAuth();
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
    if (selectedEntityId) {
      // Store the selection in sessionStorage or context for the account details page
      sessionStorage.setItem('selectedAccountType', selectedAccountType);
      sessionStorage.setItem('selectedEntityId', selectedEntityId);
      setCurrentView('accountDetails');
    }
  };



  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          الحسابات
        </h1>
        <p className="text-slate-600">
          {t('financialAccounts.accountDetails.selectAccount')}
        </p>
      </div>

      {/* Account Selection Form */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Account Type Selection */}
        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            اختر نوع الحساب
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => {
                setSelectedAccountType('patient');
                setSelectedEntityId('');
              }}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                selectedAccountType === 'patient'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-2">👥</div>
              <div className="font-medium">{t('financialAccounts.accountDetails.accountTypes.patient')}s</div>
            </button>
            <button
              onClick={() => {
                setSelectedAccountType('doctor');
                setSelectedEntityId('');
              }}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                selectedAccountType === 'doctor'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-2">👨‍⚕️</div>
              <div className="font-medium">{t('financialAccounts.accountDetails.accountTypes.doctor')}s</div>
            </button>
            <button
              onClick={() => {
                setSelectedAccountType('supplier');
                setSelectedEntityId('');
              }}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                selectedAccountType === 'supplier'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-2">🏢</div>
              <div className="font-medium">{t('financialAccounts.accountDetails.accountTypes.supplier')}s</div>
            </button>
            <button
              onClick={() => {
                setSelectedAccountType('clinic');
                setSelectedEntityId('clinic');
              }}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                selectedAccountType === 'clinic'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-2xl mb-2">🏥</div>
              <div className="font-medium">{t('financialAccounts.accountDetails.accountTypes.clinic')}</div>
            </button>
          </div>
        </div>

        {/* Entity Selection */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            اختر {selectedAccountType === 'patient' ? 'المريض' : selectedAccountType === 'doctor' ? 'الطبيب' : selectedAccountType === 'supplier' ? 'المورد' : 'الحساب'}
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            اختر {selectedAccountType === 'patient' ? 'مريض محدد' : selectedAccountType === 'doctor' ? 'طبيب محدد' : selectedAccountType === 'supplier' ? 'مورد محدد' : 'حساب العيادة'} لعرض تفاصيل حسابه.
          </p>
          {entities.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {entities.map((entity) => (
                <label
                  key={entity.id}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedEntityId === entity.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 hover:border-slate-300'
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
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    selectedEntityId === entity.id
                      ? 'border-primary bg-primary'
                      : 'border-slate-300'
                  }`}>
                    {selectedEntityId === entity.id && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-lg font-medium">{entity.name}</span>
                    {(entity as Patient).phone && (
                      <p className="text-sm text-slate-500 mt-1">
                        {(entity as Patient).phone}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : selectedAccountType !== 'clinic' ? (
            <div className="text-center py-8 text-slate-500">
              لا توجد {selectedAccountType === 'patient' ? 'مرضى' : selectedAccountType === 'doctor' ? 'أطباء' : 'موردين'} متاحين. يرجى إضافة بعض {selectedAccountType === 'patient' ? 'المرضى' : selectedAccountType === 'doctor' ? 'الأطباء' : 'الموردين'} أولاً.
            </div>
          ) : null}
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleViewDetails}
            disabled={!selectedEntityId}
            className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${
              selectedEntityId
                ? 'bg-primary hover:bg-primary-dark shadow-lg hover:shadow-xl'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            عرض تفاصيل الحساب
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 text-center border border-slate-100">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-2xl font-bold text-primary mb-2">{patients.length}</div>
          <div className="text-slate-600">{t('financialAccounts.accountDetails.accountTypes.patient')}s</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center border border-slate-100">
          <div className="text-3xl mb-2">👨‍⚕️</div>
          <div className="text-2xl font-bold text-primary mb-2">{dentists.length}</div>
          <div className="text-slate-600">{t('financialAccounts.accountDetails.accountTypes.doctor')}s</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center border border-slate-100">
          <div className="text-3xl mb-2">🏢</div>
          <div className="text-2xl font-bold text-primary mb-2">{suppliers.length}</div>
          <div className="text-slate-600">{t('financialAccounts.accountDetails.accountTypes.supplier')}s</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center border border-slate-100">
          <div className="text-3xl mb-2">🏥</div>
          <div className="text-2xl font-bold text-primary mb-2">1</div>
          <div className="text-slate-600">{t('financialAccounts.accountDetails.accountTypes.clinic')}</div>
        </div>
      </div>
    </div>
  );
};

export default AccountSelectionPage;