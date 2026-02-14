import React, { useState } from 'react';
import { View } from '../types';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Modern, minimalist icon components with Gold + Purple theme
const DashboardIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const PatientsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SchedulerIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ReportsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const SettingsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const DoctorsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M9 21v-2a4 4 0 0 1 3-3.87" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    <path d="M12 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M12 21v-2a4 4 0 0 1 3-3.87" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SuppliersIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const InventoryIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const LabCaseIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12h20" />
    <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
    <path d="M4 12V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6" />
  </svg>
);

const ExpensesIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const TreatmentDefinitionsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const DoctorAccountsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const FinancialAccountsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const UserManagementIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const DarkModeIcon = ({ isDark }: { isDark: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {isDark ? (
      <>
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </>
    ) : (
      <>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </>
    )}
  </svg>
);

interface BottomNavBarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentView, setCurrentView }) => {
  const { t } = useI18n();
  const { userProfile, isAdmin } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [pressedItem, setPressedItem] = useState<string | null>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Primary navigation items for mobile (most frequently used) - Main icons per user request
  const primaryNavItems = [
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: DashboardIcon, permissions: ['view_dashboard'] },
    { id: 'patients', label: t('sidebar.patients'), icon: PatientsIcon, permissions: ['view_patients'] },
    { id: 'scheduler', label: t('sidebar.scheduler'), icon: SchedulerIcon, permissions: ['view_scheduler'] },
    { id: 'suppliers', label: t('sidebar.suppliers'), icon: SuppliersIcon, permissions: ['view_finance'] },
    { id: 'expenses', label: t('sidebar.expenses'), icon: ExpensesIcon, permissions: ['view_finance'] },
  ];

  // Secondary navigation items (accessible via more menu)
  const secondaryNavItems = [
    { id: 'doctors', label: t('sidebar.doctors'), icon: DoctorsIcon, permissions: ['view_patients'] },
    { id: 'reports', label: t('sidebar.reports'), icon: ReportsIcon, permissions: ['view_finance'] },
    { id: 'inventory', label: t('sidebar.inventory'), icon: InventoryIcon, permissions: ['view_finance'] },
    { id: 'labCases', label: t('sidebar.labCases'), icon: LabCaseIcon, permissions: ['view_finance'] },
    { id: 'treatmentDefinitions', label: t('sidebar.treatmentDefinitions'), icon: TreatmentDefinitionsIcon, permissions: ['view_finance'] },
    { id: 'doctorAccounts', label: t('sidebar.doctorAccounts'), icon: DoctorAccountsIcon, permissions: ['view_finance'] },
    { id: 'financialAccounts', label: t('sidebar.financialAccounts'), icon: FinancialAccountsIcon, permissions: ['view_finance'] },
    { id: 'settings', label: t('sidebar.settings'), icon: SettingsIcon, permissions: ['view_dashboard'] },
  ];

  // Add User Management only for admins
  if (isAdmin) {
    secondaryNavItems.push({ 
      id: 'userManagement', 
      label: t('sidebar.userManagement'), 
      icon: UserManagementIcon, 
      permissions: ['manage_users'] 
    });
  }

  // Filter items based on permissions
  const filteredPrimaryItems = primaryNavItems.filter(item =>
    !item.permissions || item.permissions.some(permission =>
      userProfile?.permissions?.includes(permission)
    )
  );

  const filteredSecondaryItems = secondaryNavItems.filter(item =>
    !item.permissions || item.permissions.some(permission =>
      userProfile?.permissions?.includes(permission)
    )
  );

  const handlePressStart = (itemId: string) => {
    setPressedItem(itemId);
  };

  const handlePressEnd = () => {
    setPressedItem(null);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden print:hidden">
      {/* Main navigation bar - matching Sidebar colors */}
      <div className="bg-white dark:bg-slate-800 backdrop-blur-lg border-t border-purple-100/50 dark:border-slate-700 shadow-[0_-4px_20px_rgba(147,51,234,0.1)]">
        <div className="flex items-center justify-around h-[70px] px-2 pb-safe">
          {filteredPrimaryItems.map((item) => {
            const isActive = currentView === item.id;
            const isPressed = pressedItem === item.id;
            const IconComponent = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as View)}
                onTouchStart={() => handlePressStart(item.id)}
                onTouchEnd={handlePressEnd}
                onMouseDown={() => handlePressStart(item.id)}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                className={`flex flex-col items-center justify-center flex-1 h-full min-w-[60px] max-w-[80px] transition-all duration-200 focus:outline-none relative group ${
                  isActive
                    ? 'text-purple-600'
                    : 'text-slate-400 hover:text-purple-600'
                } ${isPressed ? 'scale-95' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                {/* Active indicator bar - Gold accent like Sidebar */}
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full shadow-[0_2px_8px_rgba(251,191,36,0.4)]"></div>
                )}
                
                {/* Icon container with background - matching Sidebar */}
                <div className={`relative mb-1 p-2.5 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25' 
                    : 'group-hover:bg-purple-50'
                }`}>
                  <span className={`transition-transform duration-300 ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  }`}>
                    <IconComponent isActive={isActive} />
                  </span>
                  
                  {/* Active dot indicator - Gold like Sidebar */}
                  {isActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full border-2 border-white shadow-sm animate-pulse"></span>
                  )}
                </div>
                
                {/* Label */}
                <span className={`text-[10px] font-medium transition-all duration-200 ${
                  isActive 
                    ? 'text-purple-600 font-semibold' 
                    : 'text-slate-500 group-hover:text-purple-600'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
          
          {/* Dark mode toggle button */}
          <button
            onClick={toggleTheme}
            onTouchStart={() => handlePressStart('darkmode')}
            onTouchEnd={handlePressEnd}
            onMouseDown={() => handlePressStart('darkmode')}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            className={`flex flex-col items-center justify-center flex-1 h-full min-w-[60px] max-w-[80px] transition-all duration-200 focus:outline-none relative group ${
              isDark ? 'text-purple-600' : 'text-slate-400 hover:text-purple-600'
            } ${pressedItem === 'darkmode' ? 'scale-95' : ''}`}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <div className={`relative mb-1 p-2.5 rounded-xl transition-all duration-300 ${
              isDark 
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25' 
                : 'group-hover:bg-purple-50'
            }`}>
              <span className={`transition-transform duration-300 ${
                isDark ? 'scale-110' : 'group-hover:scale-105'
              }`}>
                <DarkModeIcon isDark={isDark} />
              </span>
              
              {isDark && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full border-2 border-white shadow-sm animate-pulse"></span>
              )}
            </div>
            
            <span className={`text-[10px] font-medium transition-all duration-200 ${
              isDark 
                ? 'text-purple-600 font-semibold' 
                : 'text-slate-500 group-hover:text-purple-600'
            }`}>
              {isDark ? 'Light' : 'Dark'}
            </span>
          </button>
          
          {/* More menu button */}
          {filteredSecondaryItems.length > 0 && (
            <button
              onClick={() => setIsMoreMenuOpen(true)}
              className="flex flex-col items-center justify-center flex-1 h-full min-w-[60px] max-w-[80px] transition-all duration-200 focus:outline-none relative group text-slate-400 hover:text-purple-600"
              aria-label="More options"
              aria-expanded={isMoreMenuOpen}
            >
              <div className="relative mb-1 p-2.5 rounded-xl transition-all duration-300 group-hover:bg-purple-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </div>
              <span className="text-[10px] font-medium text-slate-500 group-hover:text-purple-600">
                More
              </span>
            </button>
          )}
        </div>
        
        {/* Safe area padding for devices with home indicator */}
        <div className="h-[env(safe-area-inset-bottom)] bg-white dark:bg-slate-800"></div>
      </div>

      {/* More menu modal */}
      {isMoreMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
            onClick={() => setIsMoreMenuOpen(false)}
            aria-hidden="true"
          />
          
          {/* Menu panel */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-out">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gradient-to-r from-purple-200 to-amber-200 rounded-full" />
            </div>
            
            {/* Menu header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">More Options</h3>
            </div>
            
            {/* Menu items */}
            <div className="max-h-[60vh] overflow-y-auto pb-safe">
              <div className="grid grid-cols-2 gap-3 p-4">
                {filteredSecondaryItems.map((item) => {
                  const isActive = currentView === item.id;
                  const IconComponent = item.icon;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id as View);
                        setIsMoreMenuOpen(false);
                      }}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 focus:outline-none relative group ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25'
                          : 'bg-slate-50 text-slate-600 hover:bg-purple-50 hover:text-purple-600'
                      }`}
                      aria-label={item.label}
                    >
                      <div className={`mb-2 p-3 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? 'bg-white/20' 
                          : 'bg-white shadow-sm group-hover:shadow-md'
                      }`}>
                        <IconComponent isActive={isActive} />
                      </div>
                      <span className={`text-xs font-medium text-center leading-tight ${
                        isActive
                          ? 'text-white font-semibold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {item.label}
                      </span>
                      {isActive && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Close button */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="w-full py-3 px-4 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl hover:from-slate-200 hover:to-slate-100 dark:hover:from-slate-600 dark:hover:to-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                Close
              </button>
            </div>

            {/* Safe area padding */}
            <div className="h-[env(safe-area-inset-bottom)] bg-white dark:bg-slate-800"></div>
          </div>
        </>
      )}
    </nav>
  );
};

export default BottomNavBar;
