import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClinic } from '../contexts/ClinicContext';
import { useI18n } from '../contexts/I18nContext';
import { calculateDoctorStats } from '../utils/doctorCalculations';
import { formatCurrency } from '../utils/formatters';
import { usePermissions } from '../hooks/usePermissions'; // Add this import for checkPermission

// Keep all the existing code as is...
function DoctorDetailsPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const { user } = useAuth();
  const { clinicData } = useClinic();
  const { t, currentLang } = useI18n();
  const [doctor, setDoctor] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Add the usePermissions hook to get checkPermission
  const { checkPermission } = usePermissions();

  useEffect(() => {
    // Keep existing code as is...
  }, [doctorId, clinicData]);

  // Keep all other functions unchanged...
  
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Keep existing JSX unchanged */}
      
      {/* Example of where checkPermission would be used */}
      {checkPermission('doctor_payments_view') && (
        <button 
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-t-lg mr-2 ${
            activeTab === 'payments' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {t('doctor_payments')}
        </button>
      )}
    </div>
  );
}

export default DoctorDetailsPage;