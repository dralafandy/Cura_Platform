import React, { useState } from 'react';
import { View, Permission } from '../types';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePermissions } from '../hooks/usePermissions';
import { ClinicData } from '../hooks/useClinicData';
import NotificationBox from './NotificationBox';


// Modern, minimalist icon components with Gold + Purple theme
const DashboardIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const PatientsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SchedulerIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ReportsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const SettingsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ClinicIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" />
    <path d="M5 21V7l8-4v18" />
    <path d="M19 21V11l-6-4" />
    <path d="M9 9v.01" />
    <path d="M9 12v.01" />
    <path d="M9 15v.01" />
    <path d="M9 18v.01" />
  </svg>
);

const DoctorsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);

const EmployeesIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="M20 8v6" />
    <path d="M23 11h-6" />
  </svg>
);

const SuppliersIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const InventoryIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const LabCaseIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12h20" />
    <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
    <path d="M4 12V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6" />
  </svg>
);

const ExpensesIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const TreatmentDefinitionsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const LogoutIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const UserManagementIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const DarkModeIcon = ({ isDark }: { isDark: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

interface MobileDrawerProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isOpen: boolean;
  onClose: () => void;
  clinicData: ClinicData;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({ currentView, setCurrentView, isOpen, onClose, clinicData }) => {
  const { t } = useI18n();
  const { userProfile, isAdmin, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { checkPermission } = usePermissions(userProfile);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  // Navigation items for mobile drawer with permission requirements
  const navItems = [
    { id: 'dashboard', label: t('sidebar.dashboard'), icon: DashboardIcon, permission: null, adminOnly: false },
    { id: 'patients', label: t('sidebar.patients'), icon: PatientsIcon, permission: Permission.PATIENT_VIEW, adminOnly: false },
    { id: 'scheduler', label: t('sidebar.scheduler'), icon: SchedulerIcon, permission: Permission.APPOINTMENT_VIEW, adminOnly: false },
    { id: 'doctors', label: t('sidebar.doctors'), icon: DoctorsIcon, permission: null, adminOnly: true }, // Admin only
    { id: 'employees', label: t('sidebar.employees'), icon: EmployeesIcon, permission: Permission.FINANCE_VIEW, adminOnly: false },
    { id: 'suppliers', label: t('sidebar.suppliers'), icon: SuppliersIcon, permission: Permission.SUPPLIER_VIEW, adminOnly: false },
    { id: 'inventory', label: t('sidebar.inventory'), icon: InventoryIcon, permission: Permission.INVENTORY_VIEW, adminOnly: false },
    { id: 'labCases', label: t('sidebar.labCases'), icon: LabCaseIcon, permission: Permission.LAB_CASE_VIEW, adminOnly: false },
    { id: 'expenses', label: t('sidebar.expenses'), icon: ExpensesIcon, permission: Permission.FINANCE_EXPENSES_MANAGE, adminOnly: false },
    { id: 'insuranceUnified', label: t('sidebar.insuranceUnified'), icon: ReportsIcon, permission: Permission.FINANCE_ACCOUNTS_VIEW, adminOnly: false },
    { id: 'treatmentDefinitions', label: t('sidebar.treatmentDefinitions'), icon: TreatmentDefinitionsIcon, permission: Permission.TREATMENT_VIEW, adminOnly: false },
    { id: 'reports', label: t('sidebar.reports'), icon: ReportsIcon, permission: null, adminOnly: true }, // Admin only
    { id: 'settings', label: t('sidebar.settings'), icon: SettingsIcon, permission: null, adminOnly: true }, // Admin only
    { id: 'userManagement', label: t('sidebar.userManagement'), icon: UserManagementIcon, permission: Permission.USER_MANAGEMENT_VIEW, adminOnly: false },
    { id: 'clinicManagement', label: t('sidebar.clinicManagement') || 'Clinic & Branches', icon: ClinicIcon, permission: Permission.CLINIC_BRANCH_VIEW, adminOnly: false },
  ];

  // Filter items based on permissions and admin-only flag
  const filteredNavItems = navItems.filter(item => {
    // If admin only, check if user is admin
    if (item.adminOnly) {
      return isAdmin;
    }
    // If no permission required, show to all
    if (!item.permission) return true;
    // Otherwise check if user has the permission
    return checkPermission(item.permission);
  });

  // Group items for better organization
  const groups = [
    {
      label: t('sidebar.group.records'),
      items: filteredNavItems.filter(item => ['dashboard', 'patients', 'doctors', 'employees', 'treatmentDefinitions', 'suppliers'].includes(item.id)),
    },
    {
      label: t('sidebar.group.appointments'),
      items: filteredNavItems.filter(item => item.id === 'scheduler'),
    },
    {
      label: t('sidebar.group.materialsLabs'),
      items: filteredNavItems.filter(item => ['inventory', 'labCases'].includes(item.id)),
    },
    {
      label: t('sidebar.group.finance'),
      items: filteredNavItems.filter(item => ['expenses', 'insuranceUnified', 'reports'].includes(item.id)),
    },
    {
      label: t('sidebar.group.settings'),
      items: filteredNavItems.filter(item => ['settings', 'userManagement', 'clinicManagement'].includes(item.id)),
    },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer panel - slides from left - Enhanced with glassmorphism and better shadows */}
      <div className="fixed inset-y-0 left-0 w-80 max-w-[90vw] text-slate-800 dark:text-slate-100 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-r border-slate-200/70 dark:border-slate-700/60 backdrop-blur-xl z-50 md:hidden transform transition-transform duration-300 ease-out overflow-y-auto">

        {/* Header with enhanced gradient background */}
        <div className="relative overflow-hidden px-5 py-6 border-b border-violet-200/60 dark:border-violet-800/60 bg-gradient-to-br from-violet-400 via-fuchsia-400 to-indigo-500">
          <div className="absolute -top-16 -right-14 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 -left-12 w-32 h-32 rounded-full bg-violet-200/30 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.16),transparent_45%)]" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/20 text-white hover:bg-slate-900/30 transition-all duration-200 z-10 border border-white/30"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>

          {/* Logo and title */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/35 overflow-hidden shadow-lg">
              <img src="/logo.svg" alt="CuraSoft Logo" className="w-9 h-9 object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-white tracking-wide truncate">{t('appName')}</h1>
              <p className="text-sm text-white/90 font-medium">لإدارة عيادات الأسنان</p>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <div className="p-4">
          {groups.map((group, groupIndex) => (
            <div key={group.label} className="mb-6">
              {group.items.length > 0 && (
                <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] px-4 py-2 mb-2">
                  {group.label}
                </h3>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = currentView === item.id;
                  const IconComponent = item.icon;
                  
                  return (
                    <React.Fragment key={item.id}>
                      <li className="px-1">
                        <button
                          onClick={() => {
                            setCurrentView(item.id as View);
                            onClose();
                          }}
                          onMouseEnter={() => setHoveredItem(item.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className={`flex items-center w-full p-3 rounded-xl transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-violet-400/40 group relative overflow-hidden border ${
                            isActive
                              ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-700/30 border-violet-400/50'
                              : 'text-slate-700 dark:text-slate-300 bg-transparent hover:bg-violet-50/90 dark:hover:bg-violet-900/25 hover:text-violet-700 dark:hover:text-violet-200 border-transparent hover:border-violet-200/90 dark:hover:border-violet-700/70'
                          }`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          {/* Active indicator bar */}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-7 bg-amber-300 rounded-r-full"></div>
                          )}

                          <span className={`relative z-10 transition-all duration-300 p-1.5 rounded-lg ${
                            isActive ? 'bg-white/20' : 'bg-violet-100/80 dark:bg-violet-900/40'
                          } ${
                            hoveredItem === item.id && !isActive ? 'translate-x-0.5 scale-105' : ''
                          } ${isActive ? 'scale-105' : ''}`}>
                            <IconComponent isActive={isActive} />
                          </span>

                          <span className="ms-3 font-medium whitespace-nowrap relative z-10 text-base">
                            {item.label}
                          </span>

                          {isActive && (
                            <span className="ms-auto h-2 w-2 bg-amber-300 rounded-full shadow-sm"></span>
                          )}
                        </button>
                      </li>
                      {/* Add notification box directly after userManagement */}
                      {item.id === 'userManagement' && (
                        <li className="px-1 mt-2">
                          <NotificationBox clinicData={clinicData} setCurrentView={setCurrentView} isCollapsed={false} />
                        </li>
                      )}
                    </React.Fragment>
                  );
                })}
              </ul>
              {groupIndex < groups.length - 1 && group.items.length > 0 && (
                <div className="my-4 mx-4">
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer with theme toggle, logout, and user profile */}
        <div className="p-4 border-t border-violet-200/70 dark:border-violet-800/60 bg-violet-50/40 dark:bg-violet-950/20 backdrop-blur-md space-y-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center w-full p-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-violet-100/70 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-400/40 transition-all duration-200 group border border-transparent hover:border-violet-200 dark:hover:border-violet-700"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <DarkModeIcon isDark={isDark} />
            <span className="ms-3 font-medium text-base">{isDark ? 'وضع فاتح' : 'وضع داكن'}</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center w-full p-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all duration-200 group"
            aria-label={t('auth.logout.button')}
          >
            <LogoutIcon isActive={false} />
            <span className="ms-3 font-medium text-base">{t('auth.logout.button')}</span>
          </button>
          
          {/* User Profile Section */}
          <div className="flex items-center p-3 rounded-xl bg-gradient-to-r from-violet-100 to-fuchsia-50 dark:from-violet-900/35 dark:to-indigo-900/30 border border-violet-200/80 dark:border-violet-700/70">
            <div className="relative">
              <img src="https://picsum.photos/40/40" alt={t('sidebar.adminProfile')} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-700 shadow-sm" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-700"></div>
            </div>
            <div className="ms-3 flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{userProfile?.username || t('sidebar.drAdmin')}</p>
              <p className="text-xs text-violet-700 dark:text-violet-300 font-medium">{userProfile?.role || (isAdmin ? 'Admin' : 'User')}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileDrawer;
