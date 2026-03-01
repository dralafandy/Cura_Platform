import React, { useState, ReactNode } from 'react';
import { useResponsiveContext } from '../contexts/ResponsiveContext';
import { View } from '../types';

// Icons
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showMenuButton?: boolean;
  onMenuClick?: () => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showSearchButton?: boolean;
  onSearchClick?: () => void;
  showNotificationButton?: boolean;
  onNotificationClick?: () => void;
  notificationCount?: number;
  actions?: ReactNode;
  transparent?: boolean;
  elevated?: boolean;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  showMenuButton = true,
  onMenuClick,
  showBackButton = false,
  onBackClick,
  showSearchButton = false,
  onSearchClick,
  showNotificationButton = false,
  onNotificationClick,
  notificationCount = 0,
  actions,
  transparent = false,
  elevated = true,
}) => {
  const { isMobile } = useResponsiveContext();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Only render on mobile
  if (!isMobile) {
    return null;
  }

  return (
    <header 
      className={`
        sticky top-0 z-40 transition-all duration-300
        ${transparent 
          ? 'bg-transparent' 
          : elevated 
            ? 'bg-white/90 dark:bg-slate-900/85 backdrop-blur-xl shadow-sm' 
            : 'bg-white/95 dark:bg-slate-900/95'
        }
        border-b border-slate-200/70 dark:border-slate-700/70
      `}
    >
      {/* Main Header Row */}
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Menu or Back */}
        <div className="flex items-center gap-2">
          {showBackButton && onBackClick && (
            <button
              onClick={onBackClick}
              className="p-2 -ml-2 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/25 active:scale-95 transition-all border border-transparent hover:border-violet-200 dark:hover:border-violet-700"
              aria-label="Back"
            >
              <BackIcon />
            </button>
          )}
          
          {showMenuButton && onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-2 -ml-2 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/25 active:scale-95 transition-all border border-transparent hover:border-violet-200 dark:hover:border-violet-700"
              aria-label="Menu"
            >
              <MenuIcon />
            </button>
          )}
        </div>

        {/* Center: Title */}
        <div className="flex-1 text-center px-2">
          <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[220px] mx-auto">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px] mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {showSearchButton && onSearchClick && (
            <button
              onClick={onSearchClick}
              className="p-2 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/25 active:scale-95 transition-all border border-transparent hover:border-violet-200 dark:hover:border-violet-700"
              aria-label="Search"
            >
              <SearchIcon />
            </button>
          )}

          {showNotificationButton && onNotificationClick && (
            <button
              onClick={onNotificationClick}
              className="p-2 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/25 active:scale-95 transition-all relative border border-transparent hover:border-violet-200 dark:hover:border-violet-700"
              aria-label="Notifications"
            >
              <BellIcon />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          )}

          {actions}
        </div>
      </div>

      {/* Optional Search Bar */}
      {isSearchOpen && (
        <div className="px-4 pb-4 animate-slide-down">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-4 py-2.5 pl-10 text-sm bg-slate-100 dark:bg-slate-700 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <SearchIcon />
          </div>
        </div>
      )}
    </header>
  );
};

export default MobileHeader;
