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
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

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

const OnlineReservationsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4" />
    <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L13 19" />
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

const StatisticsIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const PrintIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

const AboutIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
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

const SubscriptionIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <path d="M2.5 10h19" />
    <path d="M7 14h4" />
  </svg>
);

const LogoutIcon = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
  pendingReservationsCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, clinicData, pendingReservationsCount = 0 }) => {
  const { t, locale } = useI18n();
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
      { id: 'pendingReservations', label: t('sidebar.onlineReservations'), icon: OnlineReservationsIcon, permission: Permission.APPOINTMENT_VIEW, adminOnly: false },
      { id: 'doctors', label: t('sidebar.doctors'), icon: DoctorsIcon, permission: Permission.DOCTOR_VIEW, adminOnly: false },
      { id: 'employees', label: t('sidebar.employees'), icon: EmployeesIcon, permission: Permission.FINANCE_VIEW, adminOnly: false },
      { id: 'suppliers', label: t('sidebar.suppliers'), icon: SuppliersIcon, permission: Permission.SUPPLIER_VIEW, adminOnly: false },
      { id: 'inventory', label: t('sidebar.inventory'), icon: InventoryIcon, permission: Permission.INVENTORY_VIEW, adminOnly: false },
      { id: 'labCases', label: t('sidebar.labCases'), icon: LabCaseIcon, permission: Permission.LAB_CASE_VIEW, adminOnly: false },
      { id: 'expenses', label: t('sidebar.expenses'), icon: ExpensesIcon, permission: Permission.FINANCE_EXPENSES_MANAGE, adminOnly: false },
      { id: 'insuranceUnified', label: t('sidebar.insuranceUnified'), icon: StatisticsIcon, permission: Permission.FINANCE_ACCOUNTS_VIEW, adminOnly: false },
      { id: 'treatmentDefinitions', label: t('sidebar.treatmentDefinitions'), icon: TreatmentDefinitionsIcon, permission: Permission.TREATMENT_VIEW, adminOnly: false },
      { id: 'reports', label: t('sidebar.reports'), icon: StatisticsIcon, permission: Permission.REPORTS_VIEW, adminOnly: false },
      { id: 'settings', label: t('sidebar.settings'), icon: SettingsIcon, permission: Permission.SETTINGS_VIEW, adminOnly: false },
      { id: 'about', label: 'عن البرنامج', icon: AboutIcon, permission: null, adminOnly: false },
      { id: 'userManagement', label: t('sidebar.userManagement'), icon: UserManagementIcon, permission: null, adminOnly: true },
      { id: 'clinicManagement', label: 'Clinic & Branches', icon: ClinicIcon, permission: Permission.CLINIC_BRANCH_VIEW, adminOnly: false },
      { id: 'subscriptionOverview', label: locale === 'ar' ? 'الاشتراك والباقات' : 'Subscription', icon: SubscriptionIcon, permission: null, adminOnly: true },
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


  const navItems = useMemo(() => getNavItems(), [isAdmin, userProfile, checkPermission, t, locale]);
  const pendingReservationsBadgeLabel = pendingReservationsCount > 99 ? '99+' : String(pendingReservationsCount);

  const groups = [
    {
      label: t('sidebar.group.records'),
      items: navItems.filter(item => ['dashboard', 'patients', 'doctors', 'employees', 'treatmentDefinitions', 'suppliers'].includes(item.id)),
    },
    {
      label: t('sidebar.group.appointments'),
      items: navItems.filter(item => ['scheduler', 'pendingReservations'].includes(item.id)),
    },
    {
      label: t('sidebar.group.materialsLabs'),
      items: navItems.filter(item => ['inventory', 'labCases'].includes(item.id)),
    },
    {
      label: t('sidebar.group.finance'),
      items: navItems.filter(item => ['expenses', 'insuranceUnified', 'reports'].includes(item.id)),
    },
    {
      label: t('sidebar.group.settings'),
      items: navItems.filter(item => ['settings', 'userManagement', 'about', 'clinicManagement', 'subscriptionOverview'].includes(item.id)),
    },
  ];



  return (
<nav className={`hidden md:flex text-slate-800 dark:text-slate-100 flex-col transition-all duration-300 ease-out print:hidden border-r border-slate-200/70 dark:border-slate-700/60 backdrop-blur-xl bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 ${
      isCollapsed ? 'w-20' : 'w-auto min-w-[292px]'
    }`}>

      {/* Logo and App Info Section */}
      <div className="relative overflow-hidden px-5 py-5 border-b border-violet-200/60 dark:border-violet-800/60 bg-gradient-to-br from-violet-400 via-fuchsia-400 to-indigo-500">
        <div className="absolute -top-16 -right-14 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -left-12 w-32 h-32 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.16),transparent_45%)]" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center border border-white/35 overflow-hidden shadow-lg">
            <img src="/logo.svg" alt="CuraSoft Logo" className="w-8 h-8 object-contain" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-white tracking-wide truncate">{t('appName')}</h1>
              <p className="text-sm text-white/90 font-medium">لإدارة عيادات الأسنان</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ms-auto p-2 rounded-xl bg-slate-900/20 text-white hover:bg-slate-900/30 transition-all duration-200 border border-white/30"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              {isCollapsed ? (
                <path d="M15 19l-7-7 7-7" />
              ) : (
                <path d="M9 5l7 7-7 7" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 mt-4">
        <SearchBar
          navItems={navItems}
          currentView={currentView}
          setCurrentView={setCurrentView}
          isCollapsed={isCollapsed}
        />
      </div>

      {/* Navigation Groups */}
      <ul className="flex-1 mt-3 px-3 pb-2 overflow-y-auto">
        {groups.map((group, groupIndex) => (
          <li key={group.label} className="mb-5">
            {!isCollapsed && group.items.length > 0 && (
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
                        onClick={() => setCurrentView(item.id as View)}
                        onMouseEnter={() => setHoveredItem(item.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={`flex items-center w-full p-3 rounded-xl transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-violet-400/40 group relative overflow-hidden border ${
                          isActive
                            ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-700/30 border-violet-400/50'
                            : 'text-slate-700 dark:text-slate-300 bg-transparent hover:bg-violet-50/90 dark:hover:bg-violet-900/25 hover:text-violet-700 dark:hover:text-violet-200 border-transparent hover:border-violet-200/90 dark:hover:border-violet-700/70'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                        title={isCollapsed ? item.label : undefined}
                        aria-label={item.label}
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
                          {isCollapsed && item.id === 'pendingReservations' && pendingReservationsCount > 0 && (
                            <span className={`absolute -top-1 -right-1 min-w-[1.1rem] rounded-full px-1 text-center text-[10px] font-bold leading-5 ${
                              isActive ? 'bg-amber-300 text-violet-950' : 'bg-rose-500 text-white'
                            }`}>
                              {pendingReservationsBadgeLabel}
                            </span>
                          )}
                        </span>

                        {!isCollapsed && (
                          <span className="ms-3 font-medium whitespace-nowrap relative z-10 flex items-center gap-2">
                            <span>{item.label}</span>
                            {item.id === 'pendingReservations' && pendingReservationsCount > 0 && (
                              <span className={`inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                isActive ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'
                              }`}>
                                {pendingReservationsBadgeLabel}
                              </span>
                            )}
                          </span>
                        )}

                        {!isCollapsed && isActive && (
                          <span className="ms-auto h-2 w-2 bg-amber-300 rounded-full shadow-sm"></span>
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
                <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent"></div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* User Profile and Logout Section */}
      <div className="p-4 border-t border-violet-200/70 dark:border-violet-800/60 bg-violet-50/40 dark:bg-violet-950/20 backdrop-blur-md space-y-3">
        <button
          onClick={toggleTheme}
          className="flex items-center w-full p-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-violet-100/70 dark:hover:bg-violet-900/30 focus:outline-none focus:ring-2 focus:ring-violet-400/40 transition-all duration-200 group border border-transparent hover:border-violet-200 dark:hover:border-violet-700"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isCollapsed ? (isDark ? "Light mode" : "Dark mode") : undefined}
        >
          {isDark ? (
            <SunIcon className="transition-transform duration-300 group-hover:rotate-90 group-hover:scale-105" />
          ) : (
            <MoonIcon className="transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-105" />
          )}
          {!isCollapsed && (
            <span className="ms-4 font-semibold text-base">{isDark ? 'وضع فاتح' : 'وضع داكن'}</span>
          )}
        </button>

        <button
          onClick={logout}
          className="flex items-center w-full p-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/25 focus:outline-none focus:ring-2 focus:ring-red-400/40 transition-all duration-200 group border border-transparent hover:border-red-200/70 dark:hover:border-red-700/60"
          aria-label={t('auth.logout.button')}
          title={isCollapsed ? t('auth.logout.button') : undefined}
        >
          <LogoutIcon className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:scale-105" />
          {!isCollapsed && (
            <span className="ms-3 font-semibold text-sm">{t('auth.logout.button')}</span>
          )}
        </button>

        <div className="flex items-center p-3 rounded-2xl bg-gradient-to-r from-violet-100 to-fuchsia-50 dark:from-violet-900/35 dark:to-indigo-900/30 border border-violet-200/80 dark:border-violet-700/70 shadow-sm">
          <div className="relative">
            <img src="https://picsum.photos/40/40" alt={t('sidebar.adminProfile')} className="w-11 h-11 rounded-full border-2 border-white dark:border-slate-600 shadow-md" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800"></div>
          </div>
          {!isCollapsed && (
            <div className="ms-4 flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{userProfile?.username || user?.email || t('sidebar.drAdmin')}</p>
              <p className="text-xs text-violet-700 dark:text-violet-300 font-semibold uppercase tracking-wide">{userProfile?.role || (isAdmin ? 'Admin' : 'User')}</p>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
