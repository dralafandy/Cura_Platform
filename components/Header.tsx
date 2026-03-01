import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../contexts/AuthContext';
import { useClinicData, ClinicData } from '../hooks/useClinicData';
import { useTheme } from '../contexts/ThemeContext';
import { View, UserRole } from '../types';
import NotificationBell from './NotificationBell';
import { ClinicSelector } from './clinic/ClinicSelector';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  clinicData: ClinicData;
  title?: string;
  subtitle?: string;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (isOpen: boolean) => void;
}

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const LogoutIcon = ({ className = "h-4 w-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const SettingsIcon = ({ className = "h-4 w-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CalendarIcon = ({ className = "h-3 w-3" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChevronDownIcon = ({ className = "h-3 w-3" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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

const GlobeIcon = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const UserIcon = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);


const Header: React.FC<HeaderProps> = ({ 
  currentView, 
  setCurrentView, 
  clinicData,
  title,
  subtitle,
  isMobileDrawerOpen,
  setIsMobileDrawerOpen
}) => {
  const { t, locale, setLocale } = useI18n();
  const { userProfile, logout, isAdmin } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Handle scroll effect with smooth transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key to close menus
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsMobileDrawerOpen(false);
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Page descriptions in Arabic
  const pageDescriptions: Partial<Record<View, { title: string; description: string; icon: string }>> = {
    dashboard: { 
      title: 'الرئيسية', 
      description: 'نظرة عامة على عيادتك',
      icon: '📊'
    },
    patients: { 
      title: 'المرضى', 
      description: 'إدارة سجلات المرضى',
      icon: '👥'
    },
    scheduler: { 
      title: 'المواعيد', 
      description: 'جدولة وإدارة المواعيد',
      icon: '📅'
    },
    doctors: { 
      title: 'الأطباء', 
      description: 'إدارة فريق الأطباء',
      icon: '👨‍⚕️'
    },
    employees: {
      title: locale === 'ar' ? 'قائمة الموظفين' : 'Employees List',
      description: locale === 'ar' ? 'عرض وإدارة بيانات الموظفين' : 'View and manage employee records',
      icon: '👥'
    },
    reports: { 
      title: 'التقارير', 
      description: 'التقارير والإحصائيات',
      icon: '📈'
    },
    settings: { 
      title: 'الإعدادات', 
      description: 'إعدادات النظام',
      icon: '⚙️'
    },
    suppliers: { 
      title: 'الموردين', 
      description: 'إدارة الموردين',
      icon: '🏢'
    },
    inventory: { 
      title: 'المخزون', 
      description: 'إدارة المخزون والمواد',
      icon: '📦'
    },
    labCases: { 
      title: 'معمل الأسنان', 
      description: 'متابعة حالات المعمل',
      icon: '🔬'
    },
    expenses: { 
      title: 'المصروفات', 
      description: 'تتبع المصروفات',
      icon: '💰'
    },
    treatmentDefinitions: { 
      title: 'العلاجات', 
      description: 'تعريفات العلاجات',
      icon: '🦷'
    },
    financialAccounts: { 
      title: 'الحسابات', 
      description: 'الحسابات المالية',
      icon: '💳'
    },
    'patient-details': { 
      title: 'تفاصيل المريض', 
      description: 'سجل المريض الكامل',
      icon: '📋'
    },
    userManagement: { 
      title: 'المستخدمين', 
      description: 'إدارة المستخدمين',
      icon: '👤'
    }
  };

  const currentPage = pageDescriptions[currentView] || { title: title || '', description: subtitle || '', icon: '📄' };

  // Get user initials
  const getUserInitials = () => {
    if (userProfile?.username) {
      return userProfile.username.charAt(0).toUpperCase();
    }
    return locale === 'ar' ? 'م' : 'U';
  };

  // Get user display name
  const getUserDisplayName = () => {
    return userProfile?.username || (locale === 'ar' ? 'مستخدم' : 'User');
  };

  // Avatar component with image support
  const Avatar = ({ size = 'md', showStatus = true }: { size?: 'sm' | 'md' | 'lg' | 'xl', showStatus?: boolean }) => {
    const sizeClasses = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
      xl: 'w-14 h-14 text-xl'
    };

    const statusSizeClasses = {
      sm: 'w-2.5 h-2.5 border-2',
      md: 'w-3 h-3 border-2',
      lg: 'w-3.5 h-3.5 border-2',
      xl: 'w-4 h-4 border-2'
    };

    const hasAvatar = userProfile?.avatar_url && userProfile.avatar_url.trim() !== '';

    return (
      <div className="relative">
        <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-slate-800 transition-all duration-300 group-hover:shadow-xl group-hover:scale-105`}>
          {hasAvatar ? (
            <img 
              src={userProfile.avatar_url} 
              alt={getUserDisplayName()}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to initials on image error
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${getRoleColor()} flex items-center justify-center text-white font-bold`}>
              {getUserInitials()}
            </div>
          )}
        </div>
        
        {/* Animated border effect */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${getRoleColor()} opacity-0 group-hover:opacity-30 blur-sm transition-opacity duration-300 scale-110`}></div>
        
        {/* Online status indicator */}
        {showStatus && (
          <div className={`absolute -bottom-0.5 -right-0.5 ${statusSizeClasses[size]} bg-green-500 rounded-full border-white dark:border-slate-800`}>
            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
          </div>
        )}
      </div>
    );
  };


  // Get role color with enhanced gradients
  const getRoleColor = () => {
    if (isAdmin) return 'from-purple-500 via-pink-500 to-rose-500';
    if (userProfile?.role === UserRole.DOCTOR) return 'from-blue-500 via-cyan-500 to-teal-500';
    return 'from-emerald-500 via-green-500 to-lime-500';
  };

  // Get role name in Arabic
  const getRoleName = () => {
    if (isAdmin) return 'مدير';
    if (userProfile?.role === UserRole.DOCTOR) return 'طبيب';
    return 'موظف';
  };

  // Navigation items for mobile menu
  const navItems = useMemo(() => [
    { id: 'dashboard', label: 'الرئيسية', icon: '📊' },
    { id: 'patients', label: 'المرضى', icon: '👥' },
    { id: 'scheduler', label: 'المواعيد', icon: '📅' },
    { id: 'doctors', label: 'الأطباء', icon: '👨‍⚕️' },
    { id: 'reports', label: 'التقارير', icon: '📈' },
    { id: 'inventory', label: 'المخزون', icon: '📦' },
    { id: 'labCases', label: 'المعمل', icon: '🔬' },
    { id: 'expenses', label: 'المصروفات', icon: '💰' },
    { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
  ], []);

  const filteredNavItems = useMemo(() => {
    return navItems.filter(item => {
      if (item.id === 'settings') return true;
      if (item.id === 'inventory' || item.id === 'labCases' || item.id === 'expenses') return true;
      return true;
    });
  }, [navItems]);

  // Format date in Arabic with enhanced formatting
  const formatDate = () => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('ar-SA', options);
  };

  // Format time
  const formatTime = () => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return date.toLocaleTimeString('ar-SA', options);
  };

  return (
    <>
      {/* Main Header - Unified Design */}
      <header 
        className={`sticky top-0 z-50 transition-all duration-300 ease-out ${
          isScrolled 
            ? 'bg-white/90 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-700/70 shadow-lg shadow-slate-200/40 dark:shadow-slate-900/50' 
            : 'bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-700'
        }`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="px-4 py-2.5">
          <div className="flex items-center justify-between">
            {/* Left: Logo & Mobile Menu */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileDrawerOpen(true)}
                className="md:hidden p-2 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/25 active:scale-95 transition-all duration-200 group border border-transparent hover:border-violet-200 dark:hover:border-violet-700"
                aria-label="القائمة"
              >
                <MenuIcon />
              </button>
              
              <div className="flex items-center gap-2.5 group cursor-pointer">
                <div className="relative p-1.5 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100/80 dark:from-violet-900/40 dark:to-indigo-900/30 border border-violet-200/70 dark:border-violet-700/70">
                  <img 
                    src="/logo.svg" 
                    alt={t('appName')} 
                    className="h-7 w-7 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105" 
                  />
                </div>
                <div className="hidden sm:block">
                  <span className="text-base font-bold bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                    كيوراسوفت
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                    نظام إدارة العيادات
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Page Context */}
            <div className="hidden lg:flex flex-1 mx-6">
              <div className="w-full max-w-xl mx-auto px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-50/80 via-violet-50/90 to-fuchsia-50/80 dark:from-blue-900/20 dark:via-violet-900/25 dark:to-purple-900/20 border border-violet-200/70 dark:border-violet-700/60">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{currentPage.title || title || t('appName')}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentPage.description || subtitle || ''}</p>
              </div>
            </div>

            {/* Right: Theme, Language, Notifications & User - Enhanced */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/25 active:scale-95 transition-all duration-200 group relative overflow-hidden border border-transparent hover:border-violet-200 dark:hover:border-violet-700"
                aria-label={isDark ? (locale === 'ar' ? 'الوضع الفاتح' : 'Light mode') : (locale === 'ar' ? 'الوضع الداكن' : 'Dark mode')}
              >
                <div className="relative z-10">
                  {isDark ? (
                    <SunIcon className="h-5 w-5 text-amber-500 group-hover:text-amber-400 group-hover:rotate-12 transition-all duration-300" />
                  ) : (
                    <MoonIcon className="h-5 w-5 text-slate-600 group-hover:text-blue-500 group-hover:-rotate-12 transition-all duration-300" />
                  )}
                </div>
                <div className={`absolute inset-0 rounded-xl ${isDark ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10' : 'bg-gradient-to-br from-blue-500/10 to-violet-500/10'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              </button>

              {/* Language Switcher */}
              <div className="relative" ref={langMenuRef}>
                <button
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="p-2 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/25 active:scale-95 transition-all duration-200 group border border-transparent hover:border-violet-200 dark:hover:border-violet-700"
                  aria-label={locale === 'ar' ? 'تغيير اللغة' : 'Change language'}
                  aria-expanded={isLangMenuOpen}
                >
                  <GlobeIcon className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                </button>
                
                {isLangMenuOpen && (
                  <div className="absolute left-0 mt-2 w-36 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={() => {
                        setLocale('ar');
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-right ${
                        locale === 'ar' 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="text-lg">🇸🇦</span>
                      <span className="font-medium">العربية</span>
                      {locale === 'ar' && <span className="mr-auto text-blue-500">✓</span>}
                    </button>
                    <button
                      onClick={() => {
                        setLocale('en');
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-right ${
                        locale === 'en' 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="text-lg">🇺🇸</span>
                      <span className="font-medium">English</span>
                      {locale === 'en' && <span className="mr-auto text-blue-500">✓</span>}
                    </button>
                  </div>
                )}
              </div>

              {/* Clinic Selector */}
              <ClinicSelector variant="compact" />

              {/* Notification Bell - Enhanced */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300"></div>
                <NotificationBell 
                  clinicData={clinicData} 
                  setCurrentView={setCurrentView} 
                  isFloating={false} 
                />
              </div>

               {/* User Profile Card - identical to sidebar */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="group relative flex items-center w-full sm:w-auto p-2.5 rounded-2xl bg-gradient-to-r from-violet-100 to-fuchsia-50 dark:from-violet-900/35 dark:to-indigo-900/30 border border-violet-200/80 dark:border-violet-700/70 hover:from-violet-200 hover:to-fuchsia-100 dark:hover:from-violet-800/45 dark:hover:to-indigo-800/40 transition-all duration-200"
                  aria-label={locale === 'ar' ? 'قائمة المستخدم' : 'User menu'}
                  aria-expanded={isUserMenuOpen}
                >
                  <div className="relative">
                    <img src="https://picsum.photos/40/40" alt={t('sidebar.adminProfile')} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-700 shadow-sm" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-700"></div>
                  </div>
                  
                  {/* User info - identical to sidebar */}
                  <div className="ms-3 flex-1 min-w-0">
                    <div className="flex flex-col">
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{userProfile?.username || t('sidebar.drAdmin')}</p>
                      <p className="text-xs text-violet-700 dark:text-violet-300 font-medium">{userProfile?.role || (isAdmin ? 'Admin' : 'User')}</p>
                    </div>
                  </div>
                  
                  {/* Chevron for dropdown - smaller size */}
                  <div className={`ms-2 p-1 rounded-full transition-all duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`}>
                    <ChevronDownIcon className="h-2.5 w-2.5 text-slate-500 dark:text-slate-400" />
                  </div>
                </button>

                {/* User Dropdown - Modern Glassmorphism Card */}
                {isUserMenuOpen && (
                  <div className="absolute left-0 mt-3 w-72 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-400/20 dark:shadow-slate-900/50 border border-white/50 dark:border-slate-700/50 z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 overflow-hidden">

                    {/* Decorative top gradient bar */}
                    <div className={`h-1.5 w-full bg-gradient-to-r ${getRoleColor()}`}></div>
                    
                    {/* User info header - Modern card style */}
                    <div className="p-5 bg-gradient-to-br from-slate-50/80 to-white/80 dark:from-slate-700/30 dark:to-slate-800/30">
                      <div className="flex items-center gap-4">
                        {/* Large avatar with ring */}
                        <div className="relative">
                          <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${getRoleColor()} blur-md opacity-50 scale-110`}></div>
                          <div className="relative rounded-full p-0.5 bg-gradient-to-br from-white to-slate-100 dark:from-slate-600 dark:to-slate-700">
                            <Avatar size="lg" />
                          </div>
                          {/* Status badge */}
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-slate-900 dark:text-white truncate">
                            {getUserDisplayName()}
                          </p>
                          {/* Role badge */}
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${
                            isAdmin 
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' 
                              : userProfile?.role === UserRole.DOCTOR
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-purple-500' : userProfile?.role === UserRole.DOCTOR ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                            {getRoleName()}
                          </div>
                          {userProfile?.avatar_url && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {locale === 'ar' ? 'تم التحقق' : 'Verified'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Menu items - Modern styling */}
                    <div className="p-2 space-y-1">
                      {/* My Profile Link */}
                      <button
                        onClick={() => {
                          setCurrentView('userManagement');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 text-sm rounded-xl transition-all duration-200 text-right group hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent dark:hover:from-purple-900/20 dark:hover:to-transparent"
                      >
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-200">
                          <UserIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-right">
                          <span className="font-semibold text-slate-700 dark:text-slate-200 block">{locale === 'ar' ? 'الملف الشخصي' : 'My Profile'}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{locale === 'ar' ? 'إدارة حسابك' : 'Manage your account'}</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setCurrentView('settings');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 text-sm rounded-xl transition-all duration-200 text-right group hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent dark:hover:from-blue-900/20 dark:hover:to-transparent"
                      >
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200">
                          <SettingsIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-right">
                          <span className="font-semibold text-slate-700 dark:text-slate-200 block">{locale === 'ar' ? 'الإعدادات' : 'Settings'}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{locale === 'ar' ? 'تخصيص النظام' : 'Customize system'}</span>
                        </div>
                      </button>
                      
                      {/* Divider with gradient */}
                      <div className="my-2 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent"></div>
                      
                      {/* Logout - Destructive style */}
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 text-sm rounded-xl transition-all duration-200 text-right group hover:bg-gradient-to-r hover:from-red-50 hover:to-transparent dark:hover:from-red-900/20 dark:hover:to-transparent"
                      >
                        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform duration-200">
                          <LogoutIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-right">
                          <span className="font-semibold text-red-600 dark:text-red-400 block">{locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{locale === 'ar' ? 'انهاء الجلسة' : 'End session'}</span>
                        </div>
                      </button>
                    </div>
                    
                    {/* Bottom decorative element */}
                    <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-700/20 border-t border-slate-100 dark:border-slate-700/50">
                      <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
                        {locale === 'ar' ? 'نظام إدارة العيادات v2.0' : 'Clinic Management System v2.0'}
                      </p>
                    </div>
                  </div>
                )}
              </div>


            </div>
          </div>
        </div>
      </header>


    </>
  );
};

export default Header;
