import React, { useState, useCallback, useMemo, ReactNode } from 'react';
import { useResponsiveContext } from '../contexts/ResponsiveContext';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileDrawer from './MobileDrawer';
import BottomNavBar from './BottomNavBar';
import { View, PatientDetailTab } from '../types';
import { ClinicData } from '../hooks/useClinicData';

// Icons
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

interface ResponsiveLayoutProps {
  children: ReactNode;
  currentView: View;
  setCurrentView: (view: View) => void;
  clinicData: ClinicData;
  selectedPatientId?: string | null;
  setSelectedPatientId?: (id: string | null) => void;
  selectedPatientInitialTab?: PatientDetailTab;
  setSelectedPatientInitialTab?: (tab: PatientDetailTab) => void;
  selectedDoctorId?: string | null;
  setSelectedDoctorId?: (id: string | null) => void;
  // RBAC
  hasPermission?: (permission: string) => boolean;
  // Loading states
  isLoading?: boolean;
  authLoading?: boolean;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  currentView,
  setCurrentView,
  clinicData,
  selectedPatientId,
  setSelectedPatientId,
  selectedPatientInitialTab,
  setSelectedPatientInitialTab,
  selectedDoctorId,
  setSelectedDoctorId,
  hasPermission,
  isLoading,
  authLoading
}) => {
  const { isMobile, isTablet, isDesktop, deviceType } = useResponsiveContext();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Handle navigation item click
  const handleNavItemClick = useCallback((view: View) => {
    setCurrentView(view);
    setIsMobileDrawerOpen(false);
  }, [setCurrentView]);

  // View titles
  const viewTitles: Record<View, string> = useMemo(() => ({
    dashboard: 'Dashboard',
    patients: 'Patients',
    scheduler: 'Appointments',
    doctors: 'Doctors',
    employees: 'Employees',
    suppliers: 'Suppliers',
    inventory: 'Inventory',
    labCases: 'Lab Cases',
    expenses: 'Expenses',
    treatmentDefinitions: 'Treatments',
    statistics: 'Statistics',
    databaseVerification: 'Database Verification',
    systemTesting: 'System Testing',
    settings: 'Settings',
    userManagement: 'User Management',
    accountSelection: 'Account Selection',
    'patient-details': 'Patient Details',
    'doctor-details': 'Doctor Details',
    'test-patient-cards': 'Test Patient Cards',
    'experimental-patient-reports': 'Experimental Patient Reports',
    accounting: 'Accounting',
    financialAccounts: 'Financial Accounts',
    doctorAccounts: 'Doctor Accounts',
    insuranceCompanies: 'Insurance Companies',
    insuranceAccounts: 'Insurance Accounts',
    insuranceTransactions: 'Insurance Transactions',
    patientInsuranceLink: 'Patient Insurance',
    treatmentInsuranceLink: 'Treatment Insurance',
    insuranceIntegration: 'Insurance Integration',
    insuranceUnified: 'Insurance Unified',
    reports: 'Reports',
    publicBooking: 'Public Booking',
    pendingReservations: 'Pending Reservations'
  }), []);

  // Get subtitle for current view
  const getSubtitle = (view: View): string => {
    const subtitles: Record<View, string> = {
      dashboard: 'Welcome back!',
      patients: 'Manage your patients',
      scheduler: 'View appointments',
      doctors: 'Team members',
      employees: 'Staff attendance and payroll',
      suppliers: 'Supplier contacts',
      inventory: 'Stock management',
      labCases: 'Laboratory cases',
      expenses: 'Track expenses',
      treatmentDefinitions: 'Treatment options',
      statistics: 'Analytics & reports',
      databaseVerification: 'System status',
      systemTesting: 'Developer tools',
      settings: 'App preferences',
      userManagement: 'Manage users',
      accountSelection: 'Choose account',
      'patient-details': 'Patient information',
      'doctor-details': 'Doctor profile',
      'test-patient-cards': 'Test view',
      'experimental-patient-reports': 'Reports',
      accounting: 'Financial overview',
      financialAccounts: 'Account management',
      doctorAccounts: 'Doctor payments',
      insuranceCompanies: 'Insurance providers',
      insuranceAccounts: 'Insurance accounts',
      insuranceTransactions: 'Transaction history',
      patientInsuranceLink: 'Patient coverage',
      treatmentInsuranceLink: 'Treatment coverage',
      insuranceIntegration: 'Insurance setup',
      insuranceUnified: 'Insurance unified',
      reports: 'Generate reports',
      publicBooking: 'Public booking',
      pendingReservations: 'Reservation requests'
    };
    return subtitles[view] || '';
  };

  // Render desktop layout
  const renderDesktopLayout = () => (
    <div className="md:flex">
      {/* Desktop Sidebar - always visible on desktop */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        clinicData={clinicData}
      />
      <div className="flex-1 flex flex-col w-full print:block">
        <Header 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          clinicData={clinicData}
          isMobileDrawerOpen={isMobileDrawerOpen}
          setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        />
        <main className="flex-1 bg-neutral dark:bg-slate-900 p-4 md:p-6 print:p-0 print:block">
          {children}
        </main>
      </div>
    </div>
  );

  // Render mobile layout with bottom navigation
  const renderMobileLayout = () => (
    <div className="flex flex-col min-h-screen bg-neutral-light dark:bg-slate-900">
      {/* Mobile Header - improved with quick actions */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <div className="flex items-center justify-between px-3 py-2.5">
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all touch-manipulation"
            aria-label="Menu"
          >
            <MenuIcon />
          </button>
          
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CuraSoft
            </span>
          </div>
          
          {/* Quick action: Add patient button for mobile */}
          {(currentView === 'patients' || currentView === 'dashboard') && (
            <button
              onClick={() => setCurrentView('patients')}
              className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 active:scale-95 transition-all touch-manipulation"
              aria-label="Add patient"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Page Title with subtitle */}
        <div className="px-4 pb-3">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            {viewTitles[currentView] || 'CuraSoft'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {getSubtitle(currentView)}
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 bg-neutral-light dark:bg-slate-900 p-3 pb-24 overflow-y-auto overscroll-y-contain">
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNavBar
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        currentView={currentView}
        setCurrentView={setCurrentView}
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        clinicData={clinicData}
      />
    </div>
  );

  // Main render - choose layout based on device
  if (isMobile || isTablet) {
    return renderMobileLayout();
  }

  return renderDesktopLayout();
};

export default ResponsiveLayout;
