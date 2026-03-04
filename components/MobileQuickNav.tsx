import React, { useMemo } from 'react';
import { Permission, View } from '../types';
import { useI18n } from '../hooks/useI18n';
import { useTheme } from '../contexts/ThemeContext';

interface MobileQuickNavProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  onOpenMenu: () => void;
  hasPermission: (permission: Permission) => boolean;
}

const DashboardIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.9}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    {active ? <path d="M3 12h7M14 12h7" strokeLinecap="round" opacity="0.45" /> : null}
  </svg>
);

const PatientsIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.9}>
    <circle cx="12" cy="7.5" r="3.5" />
    <path d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6" strokeLinecap="round" />
    {active ? <circle cx="18.2" cy="6.2" r="1.1" fill="currentColor" /> : null}
  </svg>
);

const SchedulerIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.9}>
    <rect x="3" y="4" width="18" height="17" rx="2.5" />
    <path d="M8 2.8v3.4M16 2.8v3.4M3 10.5h18" strokeLinecap="round" />
    {active ? <circle cx="16.8" cy="15.8" r="1.2" fill="currentColor" /> : null}
  </svg>
);

const ReportsIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.9}>
    <path d="M7 3h7l5 5v13H7z" />
    <path d="M14 3v5h5M10 13h6M10 17h4" strokeLinecap="round" />
    {active ? <path d="M10 9.5h2.5" strokeLinecap="round" /> : null}
  </svg>
);

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.9}>
    <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.9}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2.3M12 19.2v2.3M4.8 4.8l1.6 1.6M17.6 17.6l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.8 19.2l1.6-1.6M17.6 6.4l1.6-1.6" strokeLinecap="round" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.9}>
    <path d="M20.4 14.2a8.2 8.2 0 1 1-10.6-10.6 7 7 0 0 0 10.6 10.6z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MobileQuickNav: React.FC<MobileQuickNavProps> = ({
  currentView,
  setCurrentView,
  onOpenMenu,
  hasPermission,
}) => {
  const { t, locale } = useI18n();
  const { toggleTheme, isDark } = useTheme();
  const translatedMenuLabel = t('common.menu');
  const menuLabel = translatedMenuLabel && translatedMenuLabel !== 'common.menu'
    ? translatedMenuLabel
    : (locale === 'ar' ? 'القائمة' : 'Menu');
  const darkModeLabel = isDark ? (locale === 'ar' ? 'فاتح' : 'Light') : (locale === 'ar' ? 'داكن' : 'Dark');

  const candidateItems = useMemo(
    () => [
      {
        id: 'dashboard' as View,
        label: t('sidebar.dashboard'),
        icon: DashboardIcon,
      },
      {
        id: 'patients' as View,
        label: t('sidebar.patients'),
        icon: PatientsIcon,
        permission: Permission.PATIENT_VIEW,
      },
      {
        id: 'scheduler' as View,
        label: t('sidebar.scheduler'),
        icon: SchedulerIcon,
        permission: Permission.APPOINTMENT_VIEW,
      },
      {
        id: 'reports' as View,
        label: t('sidebar.reports'),
        icon: ReportsIcon,
        permission: Permission.REPORTS_VIEW,
      },
    ],
    [t]
  );

  const visibleItems = useMemo(() => {
    const filtered = candidateItems.filter(item => (item.permission ? hasPermission(item.permission) : true));
    return filtered.slice(0, 4);
  }, [candidateItems, hasPermission]);

  return (
    <nav className="mobile-quick-nav fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 shadow-[0_-10px_28px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/90 dark:shadow-[0_-12px_30px_rgba(2,6,23,0.62)] md:hidden">
      <div className="mx-auto flex w-full max-w-xl items-center justify-between px-1.5 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {visibleItems.map(item => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`mobile-quick-nav-item group flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-1.5 py-1 transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-800/20'
                  : 'text-slate-600 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-slate-800/60'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <Icon active={isActive} />
              <span className={`mt-1 max-w-full truncate text-[11px] font-medium ${isActive ? 'text-white' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}

        <button
          onClick={toggleTheme}
          className={`mobile-quick-nav-item group ms-1 flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center rounded-xl border transition-all duration-200 ${
            isDark
              ? 'border-cyan-700/70 bg-slate-800 text-cyan-300 hover:bg-slate-700'
              : 'border-slate-200/90 bg-white text-slate-700 hover:border-cyan-200 hover:text-cyan-600'
          }`}
          aria-label={isDark ? (locale === 'ar' ? 'الوضع الفاتح' : 'Light mode') : (locale === 'ar' ? 'الوضع الداكن' : 'Dark mode')}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
          <span className="mt-1 text-[11px] font-medium">{darkModeLabel}</span>
        </button>

        <button
          onClick={onOpenMenu}
          className="mobile-quick-nav-item group ms-1 flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 transition-all duration-200 hover:border-cyan-200 hover:text-cyan-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-700 dark:hover:text-cyan-300"
          aria-label={menuLabel}
        >
          <MenuIcon />
          <span className="mt-1 text-[11px] font-medium">{menuLabel}</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileQuickNav;
