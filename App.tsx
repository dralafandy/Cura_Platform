import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import PatientList from './components/PatientList';
import Dashboard from './components/Dashboard';
import Scheduler from './components/Scheduler';
import DoctorList from './components/DoctorList';
import DoctorDetailsPage from './components/DoctorDetailsPage';
import Header from './components/Header';

import UserManagement from './components/UserManagement';
import { useClinicData, ClinicData } from './hooks/useClinicData';
import MobileDrawer from './components/MobileDrawer';
import { View, Appointment, LabCaseStatus, PatientDetailTab } from './types';
import { useI18n } from './hooks/useI18n';
import { useAuth } from './contexts/AuthContext';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';

import LoadingScreen from './components/LoadingScreen';
import AccessDenied from './components/AccessDenied';

// Import newly separated finance components
import { SuppliersManagement } from './components/finance/SuppliersManagement';
import InventoryManagement from './components/finance/InventoryManagement';
import LabCaseManagement from './components/finance/LabCaseManagement';
import ExpensesManagement from './components/finance/ExpensesManagement';
import TreatmentDefinitionManagement from './components/finance/TreatmentDefinitionManagement';
import AccountSelectionPage from './components/finance/AccountSelectionPage';
import Settings from './components/Settings';
import { PatientDetailsPanel } from './components/patient/PatientDetailsPanel';
import TestPatientCards from './TestPatientCards';
import ReportsPage from './components/reports/ReportsPage';
import PublicBookingPage from './components/PublicBookingPage';

// Import RBAC for centralized permission management
import { RBACProvider, useRBAC } from './src/rbac/RBACContext';
import { Permission } from './types';






const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientInitialTab, setSelectedPatientInitialTab] = useState<PatientDetailTab>('details');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const clinicData = useClinicData();
  const { t, direction, locale } = useI18n();
  const { loading: authLoading } = useAuth();
  
  // Use new RBAC system for permission checking
  const { hasPermission, isReady } = useRBAC();

  console.log('App rendering - auth loading:', authLoading);
  console.log('App rendering - clinic data available:', !!clinicData);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [direction, locale]);

  // Scroll to top when changing views
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  // Ensure bell is always visible by default
  useEffect(() => {
    if (!localStorage.getItem('notificationBellPosition')) {
      localStorage.setItem('notificationBellPosition', 'floating');
    }
  }, []);

  const renderView = useCallback(() => {
    console.log('Rendering view:', currentView);
    console.log('Clinic data available:', !!clinicData);

    switch (currentView) {
      case 'dashboard':
        return <Dashboard clinicData={clinicData} setCurrentView={setCurrentView} />;
      case 'patients':
        return hasPermission(Permission.PATIENT_VIEW) ? (
          <PatientList clinicData={clinicData} setCurrentView={setCurrentView} setSelectedPatientId={setSelectedPatientId} />
        ) : <AccessDenied />;
      case 'scheduler':
        return hasPermission(Permission.APPOINTMENT_VIEW) ? (
          <Scheduler clinicData={clinicData} />
        ) : <AccessDenied />;
      case 'doctors':
        return hasPermission(Permission.PATIENT_VIEW) ? (
          <DoctorList clinicData={clinicData} setCurrentView={setCurrentView} setSelectedDoctorId={setSelectedDoctorId} />
        ) : <AccessDenied />;
      case 'suppliers':
        return hasPermission(Permission.SUPPLIER_VIEW) ? (
          <SuppliersManagement clinicData={clinicData} />
        ) : <AccessDenied />;
      case 'inventory':
        return hasPermission(Permission.INVENTORY_VIEW) ? (
          <InventoryManagement clinicData={clinicData} />
        ) : <AccessDenied />;
      case 'labCases':
        return hasPermission(Permission.LAB_CASE_VIEW) ? (
          <LabCaseManagement clinicData={clinicData} />
        ) : <AccessDenied />;
      case 'expenses':
        return hasPermission(Permission.FINANCE_EXPENSES_MANAGE) ? (
          <ExpensesManagement clinicData={clinicData} />
        ) : <AccessDenied />;
      case 'treatmentDefinitions':
        return hasPermission(Permission.TREATMENT_VIEW) ? (
          <TreatmentDefinitionManagement clinicData={clinicData} />
        ) : <AccessDenied />;
      case 'doctorAccounts':
        return hasPermission(Permission.FINANCE_ACCOUNTS_VIEW) ? (
          <AccountSelectionPage setCurrentView={setCurrentView} />
        ) : <AccessDenied />;
      case 'financialAccounts':
        return hasPermission(Permission.FINANCE_ACCOUNTS_VIEW) ? (
          <AccountSelectionPage setCurrentView={setCurrentView} />
        ) : <AccessDenied />;

      case 'patient-details':
        if (!hasPermission(Permission.PATIENT_VIEW)) return <AccessDenied />;
        const patient = clinicData.patients.find(p => p.id === selectedPatientId);
        if (!patient) return <div className="text-center py-8">Patient not found.</div>;
        return <PatientDetailsPanel patient={patient} onBack={() => setCurrentView('patients')} onEdit={() => setCurrentView('patients')} clinicData={clinicData} />;

      case 'doctor-details':
        if (!hasPermission(Permission.PATIENT_VIEW)) return <AccessDenied />;
        if (!selectedDoctorId) return <div className="text-center py-8">Doctor not found.</div>;
        return <DoctorDetailsPage clinicData={clinicData} doctorId={selectedDoctorId} onBack={() => setCurrentView('doctors')} />;

      case 'settings':
        return hasPermission(Permission.SETTINGS_VIEW) ? (
          <Settings clinicData={clinicData} />
        ) : <AccessDenied />;
      case 'userManagement':
        return hasPermission(Permission.USER_MANAGEMENT_VIEW) ? (
          <UserManagement />
        ) : <AccessDenied />;
      case 'test-patient-cards':
        return <TestPatientCards />;
      case 'reports':
        return hasPermission(Permission.REPORTS_VIEW) ? (
          <ReportsPage />
        ) : <AccessDenied />;
      case 'publicBooking':
        return <PublicBookingPage />;

      default:
        return <Dashboard clinicData={clinicData} setCurrentView={setCurrentView} />;
    }
  }, [currentView, clinicData, setCurrentView, selectedPatientId, selectedDoctorId, hasPermission]);
  
  const viewTitles: Record<View, string> = {
      dashboard: t('sidebar.dashboard'),
      patients: t('patientManagement.title'),
      scheduler: t('appointmentScheduler.title'),
      doctors: t('doctorManagement.title'),
      suppliers: t('suppliersManagement.title'),
      inventory: t('inventoryManagement.title'),
      labCases: t('labCasesManagement.title'),
      expenses: t('expensesManagement.title'),
      treatmentDefinitions: t('treatmentDefinitionsManagement.title'),
      statistics: 'Statistics',
      databaseVerification: 'Database Verification',
      systemTesting: 'System Testing',

      settings: t('sidebar.settings'),
      userManagement: 'User Management',
      accountSelection: 'Account Selection',
      'patient-details': t('patientDetails.title'),
      'doctor-details': 'Doctor Details',
      'test-patient-cards': 'Test Patient Cards',
      'experimental-patient-reports': 'Experimental Patient Reports',
      accounting: 'Accounting',
      financialAccounts: 'Financial Accounts',
      doctorAccounts: 'Doctor Accounts',
      'insuranceCompanies': t('sidebar.insuranceCompanies'),
      'insuranceAccounts': t('sidebar.insuranceAccounts'),
      'insuranceTransactions': t('sidebar.insuranceTransactions'),
      'patientInsuranceLink': t('sidebar.patientInsuranceLink'),
      'treatmentInsuranceLink': t('sidebar.treatmentInsuranceLink'),
      'insuranceIntegration': t('sidebar.insuranceIntegration'),
      'insuranceUnified': t('sidebar.insuranceUnified'),
      'reports': 'Reports',
      'publicBooking': t('publicBooking.title') || 'Book Appointment',
      'pendingReservations': t('adminReservations.title') || 'Pending Reservations'
  }

  // Show loading state while auth is loading
  if (authLoading) {
    console.log('Showing loading state - auth still loading');
    return (
      <div className="bg-neutral-light dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading state while clinic data is loading
  if (clinicData.isLoading) {
    console.log('Showing loading state - clinic data still loading');
    return <LoadingScreen />;
  }

  console.log('Rendering main app content');

  return (
    <div className="bg-neutral-light dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-screen">
      <div className="md:flex">
        <Sidebar currentView={currentView} setCurrentView={setCurrentView} clinicData={clinicData} />
        <div className="flex-1 flex flex-col w-full print:block">
            {/* Header - Modern with user profile, notifications, and page context */}
            <Header 
              currentView={currentView} 
              setCurrentView={setCurrentView} 
              clinicData={clinicData}
              isMobileDrawerOpen={isMobileDrawerOpen}
              setIsMobileDrawerOpen={setIsMobileDrawerOpen}
            />
            <main className="flex-1 bg-neutral dark:bg-slate-900 p-4 md:p-6 print:p-0 print:block">
              {renderView()}
            </main>
        </div>
      </div>

      {/* Mobile Drawer - replaces BottomNavBar */}
      <MobileDrawer
        currentView={currentView}
        setCurrentView={setCurrentView}
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        clinicData={clinicData}
      />
    </div>

  );
};

// Main App component with RBAC and UserPreferences provider wrappers
const App: React.FC = () => {
  return (
    <RBACProvider>
      <UserPreferencesProvider>
        <AppContent />
      </UserPreferencesProvider>
    </RBACProvider>
  );
};

export default App;
