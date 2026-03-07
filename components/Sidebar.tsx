import React, { useMemo, useState } from 'react';
import { View, Permission } from '../types';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ClinicData } from '../hooks/useClinicData';
import { usePermissions } from '../hooks/usePermissions';
import {
  buildSidebarGroups,
  SIDEBAR_RECENT_LIMIT,
  SIDEBAR_STORAGE_KEYS,
  SidebarGroupId,
} from './sidebarNavigation';
import NotificationBox from './NotificationBox';
import SearchBar from './SearchBar';

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

const LinkIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4" />
    <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L13 19" />
  </svg>
);

const GroupIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    <circle cx="10" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const BoxIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const MoneyIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const DocumentIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
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

const BuildingIcon = ({ isActive }: { isActive: boolean }) => (
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

const CardIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <path d="M2.5 10h19" />
    <path d="M7 14h4" />
  </svg>
);

const PinIcon = ({ isPinned }: { isPinned: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 17v5" />
    <path d="M8 3h8l-1.5 6 3 3H6.5l3-3L8 3z" />
  </svg>
);

const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const LogoutIcon = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

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

type NavItem = {
  id: View;
  label: string;
  icon: React.ComponentType<{ isActive: boolean }>;
  permission: Permission | null;
  adminOnly: boolean;
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, clinicData, pendingReservationsCount = 0 }) => {
  const { t, locale } = useI18n();
  const { user, logout, isAdmin: authIsAdmin, userProfile } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { checkPermission, isAdmin: permIsAdmin } = usePermissions(userProfile);
  const isAdmin = permIsAdmin || authIsAdmin;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<SidebarGroupId>>(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEYS.collapsedGroups);

    if (!saved) {
      return new Set<SidebarGroupId>();
    }

    try {
      return new Set<SidebarGroupId>(JSON.parse(saved));
    } catch {
      return new Set<SidebarGroupId>();
    }
  });
  const [pinnedItems, setPinnedItems] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEYS.pinned);

    if (!saved) {
      return new Set<string>();
    }

    try {
      return new Set<string>(JSON.parse(saved));
    } catch {
      return new Set<string>();
    }
  });
  const [recentItems, setRecentItems] = useState<string[]>(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEYS.recent);

    if (!saved) {
      return [];
    }

    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  const navItems = useMemo<NavItem[]>(() => {
    const baseItems: NavItem[] = [
      { id: 'dashboard', label: t('sidebar.dashboard'), icon: DashboardIcon, permission: null, adminOnly: false },
      { id: 'patients', label: t('sidebar.patients'), icon: PatientsIcon, permission: Permission.PATIENT_VIEW, adminOnly: false },
      { id: 'scheduler', label: t('sidebar.scheduler'), icon: SchedulerIcon, permission: Permission.APPOINTMENT_VIEW, adminOnly: false },
      { id: 'pendingReservations', label: t('sidebar.onlineReservations'), icon: LinkIcon, permission: Permission.APPOINTMENT_VIEW, adminOnly: false },
      { id: 'doctors', label: t('sidebar.doctors'), icon: GroupIcon, permission: Permission.DOCTOR_VIEW, adminOnly: false },
      { id: 'employees', label: t('sidebar.employees'), icon: GroupIcon, permission: Permission.FINANCE_VIEW, adminOnly: false },
      { id: 'suppliers', label: t('sidebar.suppliers'), icon: BoxIcon, permission: Permission.SUPPLIER_VIEW, adminOnly: false },
      { id: 'inventory', label: t('sidebar.inventory'), icon: BoxIcon, permission: Permission.INVENTORY_VIEW, adminOnly: false },
      { id: 'labCases', label: t('sidebar.labCases'), icon: BoxIcon, permission: Permission.LAB_CASE_VIEW, adminOnly: false },
      { id: 'expenses', label: t('sidebar.expenses'), icon: MoneyIcon, permission: Permission.FINANCE_EXPENSES_MANAGE, adminOnly: false },
      { id: 'insuranceUnified', label: t('sidebar.insuranceUnified'), icon: DocumentIcon, permission: Permission.FINANCE_ACCOUNTS_VIEW, adminOnly: false },
      { id: 'treatmentDefinitions', label: t('sidebar.treatmentDefinitions'), icon: DocumentIcon, permission: Permission.TREATMENT_VIEW, adminOnly: false },
      { id: 'reports', label: t('sidebar.reports'), icon: DocumentIcon, permission: Permission.REPORTS_VIEW, adminOnly: false },
      { id: 'settings', label: t('sidebar.settings'), icon: SettingsIcon, permission: Permission.SETTINGS_VIEW, adminOnly: false },
      { id: 'about', label: t('sidebar.about'), icon: AboutIcon, permission: null, adminOnly: false },
      { id: 'userManagement', label: t('sidebar.userManagement'), icon: UserManagementIcon, permission: Permission.USER_MANAGEMENT_VIEW, adminOnly: false },
      { id: 'clinicManagement', label: t('sidebar.clinicManagement'), icon: BuildingIcon, permission: Permission.SETTINGS_EDIT, adminOnly: false },
      { id: 'subscriptionOverview', label: t('sidebar.subscriptionOverview'), icon: CardIcon, permission: null, adminOnly: true },
    ];

    return baseItems.filter((item) => {
      if (item.adminOnly) {
        return isAdmin;
      }

      if (!item.permission) {
        return true;
      }

      return checkPermission(item.permission);
    });
  }, [checkPermission, isAdmin, t]);

  const groups = useMemo(() => buildSidebarGroups(navItems, t), [navItems, t]);
  const pendingReservationsBadgeLabel = pendingReservationsCount > 99 ? '99+' : String(pendingReservationsCount);
  const pinnedNavItems = useMemo(() => navItems.filter((item) => pinnedItems.has(item.id)), [navItems, pinnedItems]);
  const recentNavItems = useMemo(() => {
    const navItemsById = new Map(navItems.map((item) => [item.id, item]));

    return recentItems
      .map((itemId) => navItemsById.get(itemId as View))
      .filter((item): item is NavItem => Boolean(item) && !pinnedItems.has(item!.id));
  }, [navItems, pinnedItems, recentItems]);

  const persistCollapsedGroups = (nextGroups: Set<SidebarGroupId>) => {
    localStorage.setItem(SIDEBAR_STORAGE_KEYS.collapsedGroups, JSON.stringify([...nextGroups]));
  };

  const toggleGroup = (groupId: SidebarGroupId) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      persistCollapsedGroups(next);
      return next;
    });
  };

  const togglePinItem = (itemId: View) => {
    setPinnedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      localStorage.setItem(SIDEBAR_STORAGE_KEYS.pinned, JSON.stringify([...next]));
      return next;
    });
  };

  const updateRecentItems = (itemId: View) => {
    setRecentItems((prev) => {
      const next = [itemId, ...prev.filter((id) => id !== itemId)].slice(0, SIDEBAR_RECENT_LIMIT);
      localStorage.setItem(SIDEBAR_STORAGE_KEYS.recent, JSON.stringify(next));
      return next;
    });
  };

  const handleNavItemClick = (itemId: View) => {
    setCurrentView(itemId);
    updateRecentItems(itemId);

    const targetGroup = groups.find((group) => group.items.some((item) => item.id === itemId));
    if (!targetGroup || !collapsedGroups.has(targetGroup.id)) {
      return;
    }

    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.delete(targetGroup.id);
      persistCollapsedGroups(next);
      return next;
    });
  };

  const renderNavItem = (item: NavItem, compact = false) => {
    const isActive = currentView === item.id;
    const isPinned = pinnedItems.has(item.id);
    const IconComponent = item.icon;
    const indicatorSideClass = locale === 'ar' ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full';
    const pinSideClass = locale === 'ar' ? 'left-3' : 'right-3';

    return (
      <div key={item.id} className={compact ? '' : 'px-1'}>
        <div className="group relative">
          <button
            onClick={() => handleNavItemClick(item.id)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            className={`relative flex w-full items-center overflow-hidden rounded-xl border transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-violet-400/40 ${
              compact ? 'px-3 py-3 pe-12' : isCollapsed ? 'justify-center p-3' : 'p-3 pe-12'
            } ${
              isActive
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-700/30 border-violet-400/50'
                : 'text-slate-700 dark:text-slate-300 bg-transparent hover:bg-violet-50/90 dark:hover:bg-violet-900/25 hover:text-violet-700 dark:hover:text-violet-200 border-transparent hover:border-violet-200/90 dark:hover:border-violet-700/70'
            }`}
            aria-current={isActive ? 'page' : undefined}
            title={isCollapsed ? item.label : undefined}
            aria-label={item.label}
          >
            {isActive && <div className={`absolute top-1/2 h-7 w-1 -translate-y-1/2 bg-amber-300 ${indicatorSideClass}`} />}
            <span className={`relative z-10 rounded-lg p-1.5 transition-all duration-300 ${isActive ? 'bg-white/20' : 'bg-violet-100/80 dark:bg-violet-900/40'} ${hoveredItem === item.id && !isActive ? 'translate-x-0.5 scale-105' : ''} ${isActive ? 'scale-105' : ''}`}>
              <IconComponent isActive={isActive} />
              {isCollapsed && item.id === 'pendingReservations' && pendingReservationsCount > 0 && (
                <span className={`absolute -top-1 -right-1 min-w-[1.1rem] rounded-full px-1 text-center text-[10px] font-bold leading-5 ${isActive ? 'bg-amber-300 text-violet-950' : 'bg-rose-500 text-white'}`}>
                  {pendingReservationsBadgeLabel}
                </span>
              )}
            </span>
            {!isCollapsed && (
              <span className="ms-3 relative z-10 flex min-w-0 items-center gap-2 font-medium">
                <span className="truncate">{item.label}</span>
                {item.id === 'pendingReservations' && pendingReservationsCount > 0 && (
                  <span className={`inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'}`}>
                    {pendingReservationsBadgeLabel}
                  </span>
                )}
              </span>
            )}
            {!isCollapsed && isActive && <span className="ms-auto h-2 w-2 rounded-full bg-amber-300 shadow-sm" />}
          </button>

          {!isCollapsed && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                togglePinItem(item.id);
              }}
              className={`absolute top-1/2 ${pinSideClass} z-20 -translate-y-1/2 rounded-lg p-1.5 transition-all duration-200 ${isPinned ? 'text-amber-400 opacity-100 bg-amber-50/90 dark:bg-amber-500/10' : 'text-slate-400 opacity-0 hover:text-violet-600 dark:hover:text-violet-300 group-hover:opacity-100'}`}
              aria-label={isPinned ? t('sidebar.unpinItem') : t('sidebar.pinItem')}
              title={isPinned ? t('sidebar.unpinItem') : t('sidebar.pinItem')}
            >
              <PinIcon isPinned={isPinned} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderQuickSection = (title: string, items: NavItem[]) => {
    if (!items.length) {
      return null;
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{title}</p>
          <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{items.length}</span>
        </div>
        <div className="space-y-2">{items.map((item) => renderNavItem(item, true))}</div>
      </div>
    );
  };

  return (
    <nav className={`hidden md:flex text-slate-800 dark:text-slate-100 flex-col transition-all duration-300 ease-out print:hidden border-r border-slate-200/70 dark:border-slate-700/60 backdrop-blur-xl bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 ${isCollapsed ? 'w-20' : 'w-auto min-w-[292px]'}`}>
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
              <p className="text-sm text-white/90 font-medium">{t('sidebar.subtitle')}</p>
            </div>
          )}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="ms-auto p-2 rounded-xl bg-slate-900/20 text-white hover:bg-slate-900/30 transition-all duration-200 border border-white/30" aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              {isCollapsed ? <path d="M15 19l-7-7 7-7" /> : <path d="M9 5l7 7-7 7" />}
            </svg>
          </button>
        </div>
      </div>

      <div className="px-3 mt-4">
        <SearchBar navItems={navItems} currentView={currentView} setCurrentView={handleNavItemClick} isCollapsed={isCollapsed} />
      </div>

      {!isCollapsed && (pinnedNavItems.length > 0 || recentNavItems.length > 0) && (
        <div className="px-3 mt-1">
          <section className="rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-sm backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/50">
            <div className="mb-3 flex items-center justify-between px-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('sidebar.quickAccess')}</p>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">{pinnedNavItems.length + recentNavItems.length}</span>
            </div>
            <div className="space-y-4">
              {renderQuickSection(t('sidebar.pinned'), pinnedNavItems)}
              {renderQuickSection(t('sidebar.recent'), recentNavItems)}
            </div>
          </section>
        </div>
      )}

      <div className="flex-1 mt-3 px-3 pb-2 overflow-y-auto space-y-4">
        {groups.map((group) => {
          const isGroupOpen = isCollapsed || !collapsedGroups.has(group.id);
          const groupHasActiveItem = group.items.some((item) => item.id === currentView);
          const groupHasPinnedItem = group.items.some((item) => pinnedItems.has(item.id));

          return (
            <section key={group.id} className={`rounded-2xl border shadow-sm backdrop-blur-sm transition-all duration-200 ${groupHasActiveItem ? 'border-violet-300/80 bg-white/85 dark:border-violet-700/70 dark:bg-slate-900/60 shadow-violet-100/60 dark:shadow-none' : 'border-slate-200/80 bg-white/70 dark:border-slate-800/80 dark:bg-slate-900/45'}`}>
              {!isCollapsed ? (
                <>
                  <button type="button" onClick={() => toggleGroup(group.id)} className="flex w-full items-center gap-3 px-4 py-3 text-start" aria-expanded={isGroupOpen} aria-label={isGroupOpen ? t('sidebar.group.collapse') : t('sidebar.group.expand')} title={isGroupOpen ? t('sidebar.group.collapse') : t('sidebar.group.expand')}>
                    <span className={`h-2.5 w-2.5 rounded-full ${groupHasActiveItem ? 'bg-violet-500' : groupHasPinnedItem ? 'bg-amber-400' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <span className="flex-1 min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{group.label}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">{group.items.length} {t('common.items')}</span>
                    </span>
                    <span className="rounded-full bg-slate-200/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">{group.items.length}</span>
                    <ChevronIcon isOpen={isGroupOpen} />
                  </button>

                  <div className={`overflow-hidden transition-all duration-300 ${isGroupOpen ? 'max-h-[640px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-2 pb-3 space-y-1">
                      {group.items.map((item) => (
                        <React.Fragment key={item.id}>
                          {renderNavItem(item)}
                          {item.id === 'userManagement' && (
                            <div className="px-1 pt-1">
                              <NotificationBox clinicData={clinicData} setCurrentView={handleNavItemClick} isCollapsed={false} />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1 py-2">
                  {group.items.map((item) => renderNavItem(item))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="p-4 border-t border-violet-200/70 dark:border-violet-800/60 bg-violet-50/40 dark:bg-violet-950/20 backdrop-blur-md space-y-3">
        <button onClick={toggleTheme} className="flex items-center w-full p-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-violet-100/70 dark:hover:bg-violet-900/30 focus:outline-none focus:ring-2 focus:ring-violet-400/40 transition-all duration-200 group border border-transparent hover:border-violet-200 dark:hover:border-violet-700" aria-label={isDark ? t('header.lightMode') : t('header.darkMode')} title={isCollapsed ? (isDark ? t('header.lightMode') : t('header.darkMode')) : undefined}>
          {isDark ? <SunIcon className="transition-transform duration-300 group-hover:rotate-90 group-hover:scale-105" /> : <MoonIcon className="transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-105" />}
          {!isCollapsed && <span className="ms-4 font-semibold text-base">{isDark ? t('header.lightMode') : t('header.darkMode')}</span>}
        </button>

        <button onClick={logout} className="flex items-center w-full p-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/25 focus:outline-none focus:ring-2 focus:ring-red-400/40 transition-all duration-200 group border border-transparent hover:border-red-200/70 dark:hover:border-red-700/60" aria-label={t('auth.logout.button')} title={isCollapsed ? t('auth.logout.button') : undefined}>
          <LogoutIcon className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:scale-105" />
          {!isCollapsed && <span className="ms-3 font-semibold text-sm">{t('auth.logout.button')}</span>}
        </button>

        <div className="flex items-center p-3 rounded-2xl bg-gradient-to-r from-violet-100 to-fuchsia-50 dark:from-violet-900/35 dark:to-indigo-900/30 border border-violet-200/80 dark:border-violet-700/70 shadow-sm">
          <div className="relative">
            <img src="https://picsum.photos/40/40" alt={t('sidebar.adminProfile')} className="w-11 h-11 rounded-full border-2 border-white dark:border-slate-600 shadow-md" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" />
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
