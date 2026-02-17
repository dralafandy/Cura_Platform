import React, { useState, useMemo } from 'react';
import { View, UserRole, Permission } from '../types';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ClinicData } from '../hooks/useClinicData';
import { usePermissions } from '../hooks/usePermissions';

import NotificationBox from './NotificationBox';
import NotificationBell from './NotificationBell';
import SearchBar from './SearchBar';


// Modern, minimalist icon components with Gold + Purple theme
const UserManagementIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const DashboardIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const PatientsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SchedulerIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const DoctorsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const InventoryIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const LabCaseIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12h20" />
    <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
    <path d="M4 12V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6" />
  </svg>
);

const ExpensesIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const TreatmentDefinitionsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const StatisticsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const SettingsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const LogoutIcon = ({ className = "h-6 w-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

// Theme toggle icons
const SunIcon = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  clinicData: ClinicData;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, clinicData }) => {
  const { t } = useI18n();
  const { user, logout, isAdmin: authIsAdmin, userProfile } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { checkPermission, isAdmin: permIsAdmin } = usePermissions(userProfile);
  
  // Use isAdmin from usePermissions for consistency, fallback to AuthContext isAdmin
  const isAdmin = permIsAdmin || authIsAdmin;
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [pinnedItems, setPinnedItems] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('sidebar-pinned-items');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [recentItems, setRecentItems] = useState<string[]>(() => {
    const saved = localStorage.getItem('sidebar-recent-items');
    return saved ? JSON.parse(saved) : [];
  });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['records', 'appointments', 'materialsLabs', 'finance', 'settings']));

  const toggleGroup = (groupLabel: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupLabel)) {
        newSet.delete(groupLabel);
      } else {
        newSet.add(groupLabel);
      }
      return newSet;
    });
  };

  const togglePinItem = (itemId: string) => {
    setPinnedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      localStorage.setItem('sidebar-pinned-items', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const updateRecentItems = (itemId: string) => {
    setRecentItems(prev => {
      const filtered = prev.filter(id => id !== itemId);
      const newRecent = [itemId, ...filtered].slice(0, 5); // Keep only 5 recent items
      localStorage.setItem('sidebar-recent-items', JSON.stringify(newRecent));
      return newRecent;
    });
  };

  const handleNavItemClick = (itemId: string) => {
    setCurrentView(itemId as View);
    updateRecentItems(itemId);
  };

  const getNavItems = () => {
    const baseItems = [
      { id: 'dashboard', label: t('sidebar.dashboard'), icon: DashboardIcon, permission: null, adminOnly: false },
      { id: 'patients', label: t('sidebar.patients'), icon: PatientsIcon, permission: Permission.PATIENT_VIEW, adminOnly: false },
      { id: 'scheduler', label: t('sidebar.scheduler'), icon: SchedulerIcon, permission: Permission.APPOINTMENT_VIEW, adminOnly: false },
      { id: 'doctors', label: t('sidebar.doctors'), icon: DoctorsIcon, permission: Permission.DOCTOR_VIEW, adminOnly: false },
      { id: 'suppliers', label: t('sidebar.suppliers'), icon: SuppliersIcon, permission: Permission.SUPPLIER_VIEW, adminOnly: false },
      { id: 'inventory', label: t('sidebar.inventory'), icon: InventoryIcon, permission: Permission.INVENTORY_VIEW, adminOnly: false },
      { id: 'labCases', label: t('sidebar.labCases'), icon: LabCaseIcon, permission: Permission.LAB_CASE_VIEW, adminOnly: false },
      { id: 'expenses', label: t('sidebar.expenses'), icon: ExpensesIcon, permission: Permission.FINANCE_EXPENSES_MANAGE, adminOnly: false },
      { id: 'treatmentDefinitions', label: t('sidebar.treatmentDefinitions'), icon: TreatmentDefinitionsIcon, permission: Permission.TREATMENT_VIEW, adminOnly: false },
      { id: 'reports', label: t('sidebar.reports'), icon: StatisticsIcon, permission: Permission.REPORTS_VIEW, adminOnly: false },
      { id: 'settings', label: t('sidebar.settings'), icon: SettingsIcon, permission: Permission.SETTINGS_VIEW, adminOnly: false },
      { id: 'userManagement', label: t('sidebar.userManagement'), icon: UserManagementIcon, permission: Permission.USER_MANAGEMENT_VIEW, adminOnly: false },
    ];

    // Filter items based on permissions and admin-only flag
    return baseItems.filter(item => {
      // If admin only, check if user is admin
      if (item.adminOnly) {
        return isAdmin;
      }
      // If no permission required, show to all
      if (!item.permission) return true;
      // Otherwise check if user has the permission
      return checkPermission(item.permission);
    });
  };


  const navItems = useMemo(() => getNavItems(), [isAdmin, userProfile, checkPermission, t]);

  const groups = [
    {
      label: t('sidebar.group.records'),
      items: navItems.filter(item => ['dashboard', 'patients', 'doctors', 'treatmentDefinitions', 'suppliers'].includes(item.id)),
    },
    {
      label: t('sidebar.group.appointments'),
      items: navItems.filter(item => item.id === 'scheduler'),
    },
    {
      label: t('sidebar.group.materialsLabs'),
      items: navItems.filter(item => ['inventory', 'labCases'].includes(item.id)),
    },
    {
      label: t('sidebar.group.finance'),
      items: navItems.filter(item => ['expenses', 'reports'].includes(item.id)),
    },
    {
      label: t('sidebar.group.settings'),
      items: navItems.filter(item => ['settings', 'userManagement'].includes(item.id)),
    },
  ];



  return (
<nav className={`hidden md:flex bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex-col transition-all duration-500 ease-out print:hidden shadow-2xl shadow-purple-500/10 border-r border-slate-200 dark:border-slate-700 backdrop-blur-sm ${
      isCollapsed ? 'w-20' : 'w-auto min-w-[280px]'
    }`}>

      {/* Logo and App Info Section - Enhanced Gold + Purple Theme with Glassmorphism */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 via-purple-500 to-purple-700 p-8 h-32 border-b border-purple-800/50 flex flex-col items-center justify-center backdrop-blur-xl bg-opacity-95">
        {/* Enhanced Decorative elements */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-white/8 rounded-full blur-2xl"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-purple-900/10"></div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/15 backdrop-blur-md text-white hover:bg-white/25 hover:scale-110 transition-all duration-300 z-10 shadow-lg border border-white/20"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isCollapsed ? (
              <path d="M15 19l-7-7 7-7" />
            ) : (
              <path d="M9 5l7 7-7 7" />
            )}
          </svg>
        </button>

        <div className="flex items-center gap-4 z-10">
          <div className="w-12 h-12 bg-white/25 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl border border-white/30 overflow-hidden hover:scale-105 transition-transform duration-300">
            <img src="/logo.svg" alt="CuraSoft Logo" className="w-9 h-9 object-contain" />
          </div>
          {!isCollapsed && (
            <div className="text-center animate-fadeIn">
              <h1 className="text-xl font-bold text-white drop-shadow-lg">{t('appName')}</h1>
              <p className="text-sm text-white/90 font-medium">لإدارة عيادات الأسنان</p>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 mt-6">
        <SearchBar
          navItems={navItems}
          currentView={currentView}
          setCurrentView={setCurrentView}
          isCollapsed={isCollapsed}
        />
      </div>

      {/* Navigation Groups */}
      <ul className="flex-1 mt-4 px-3 overflow-y-auto">
        {groups.map((group, groupIndex) => (
          <li key={group.label} className="mb-6">
            {!isCollapsed && group.items.length > 0 && (
              <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 py-2 mb-2">
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
                        onClick={() => setCurrentView(item.id as View)}
                        onMouseEnter={() => setHoveredItem(item.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={`flex items-center w-full p-4 rounded-2xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-purple-500/40 group relative overflow-hidden ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white shadow-xl shadow-purple-500/30 transform scale-105 border border-purple-500/20'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/30 dark:hover:from-purple-900/30 dark:hover:to-purple-800/20 hover:text-purple-700 dark:hover:text-purple-300 hover:scale-105 hover:shadow-md hover:shadow-purple-500/10 border border-transparent hover:border-purple-200/50 dark:hover:border-purple-700/50'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                        title={isCollapsed ? item.label : undefined}
                        aria-label={item.label}
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-amber-400 to-amber-500 rounded-r-full"></div>
                        )}

                        <span className={`relative z-10 transition-all duration-300 ${
                          hoveredItem === item.id && !isActive ? 'translate-x-1 scale-110' : ''
                        } ${isActive ? 'scale-110' : ''}`}>
                          <IconComponent isActive={isActive} />
                        </span>

                        {!isCollapsed && (
                          <span className="ms-3 font-medium whitespace-nowrap relative z-10 dark:text-slate-200">
                            {item.label}
                          </span>
                        )}

                        {!isCollapsed && isActive && (
                          <span className="ms-auto h-2 w-2 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full animate-pulse shadow-sm"></span>
                        )}
                      </button>
                    </li>
                    {/* Add notification box directly after userManagement */}
                    {item.id === 'userManagement' && (
                      <li className="px-1 mt-2">
                        <NotificationBox clinicData={clinicData} setCurrentView={setCurrentView} isCollapsed={isCollapsed} />
                      </li>
                    )}
                  </React.Fragment>
                );
              })}


            </ul>
            {groupIndex < groups.length - 1 && group.items.length > 0 && (
              <div className="my-4 mx-4">
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-600 to-transparent"></div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* User Profile and Logout Section - Enhanced with better spacing and effects */}
      <div className="p-6 border-t border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-800/80 dark:to-slate-900 backdrop-blur-sm space-y-4">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex items-center w-full p-4 rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/50 dark:hover:from-purple-900/40 dark:hover:to-purple-800/30 hover:text-purple-700 dark:hover:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all duration-300 group shadow-sm hover:shadow-md hover:shadow-purple-500/10 border border-transparent hover:border-purple-200/50 dark:hover:border-purple-700/50"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isCollapsed ? (isDark ? "Light mode" : "Dark mode") : undefined}
        >
          {isDark ? (
            <SunIcon className="transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" />
          ) : (
            <MoonIcon className="transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
          )}
          {!isCollapsed && (
            <span className="ms-4 font-semibold text-base">{isDark ? 'وضع فاتح' : 'وضع داكن'}</span>
          )}
        </button>

        <button
          onClick={logout}
          className="flex items-center w-full p-4 rounded-2xl text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100/50 dark:hover:from-red-900/40 dark:hover:to-red-800/30 focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all duration-300 group shadow-sm hover:shadow-md hover:shadow-red-500/10 border border-transparent hover:border-red-200/50 dark:hover:border-red-700/50"
          aria-label={t('auth.logout.button')}
          title={isCollapsed ? t('auth.logout.button') : undefined}
        >
          <LogoutIcon className="transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110" />
          {!isCollapsed && (
            <span className="ms-4 font-semibold text-base">{t('auth.logout.button')}</span>
          )}
        </button>

        <div className="flex items-center p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-purple-100/30 to-amber-50/50 dark:from-purple-900/40 dark:via-purple-800/30 dark:to-amber-900/30 border border-purple-200/60 dark:border-purple-700/60 shadow-sm hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 backdrop-blur-sm">
          <div className="relative">
            <img src="https://picsum.photos/40/40" alt={t('sidebar.adminProfile')} className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-600 shadow-md hover:scale-105 transition-transform duration-300" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-3 border-white dark:border-slate-800 shadow-lg animate-pulse"></div>
          </div>
          {!isCollapsed && (
            <div className="ms-4 flex-1 min-w-0">
              <p className="font-bold text-base text-slate-800 dark:text-slate-200 truncate">{userProfile?.username || user?.email || t('sidebar.drAdmin')}</p>
              <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">{userProfile?.role || (isAdmin ? 'Admin' : 'User')}</p>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
