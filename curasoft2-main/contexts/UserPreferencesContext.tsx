import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Types for user preferences
export type ViewMode = 'grid' | 'list' | 'table';
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type TimeFormat = '12h' | '24h';
export type CurrencyPosition = 'before' | 'after';
export type PageSize = 10 | 25 | 50 | 100;

// Page-specific view preferences
export interface PageViewPreferences {
  inventory: ViewMode;
  patients: ViewMode;
  doctors: ViewMode;
  suppliers: ViewMode;
  purchaseOrders: ViewMode;
  expenses: ViewMode;
  appointments: ViewMode;
  treatments: ViewMode;
  prescriptions: ViewMode;
  labCases: ViewMode;
  financialAccounts: ViewMode;
  reports: ViewMode;
}

// Notification preferences
export interface NotificationPreferences {
  enableSound: boolean;
  enableDesktop: boolean;
  enableEmail: boolean;
  appointmentReminders: boolean;
  lowStockAlerts: boolean;
  paymentReminders: boolean;
  treatmentReminders: boolean;
  labCaseUpdates: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string; // HH:mm format
}

// Print/Export preferences
export interface PrintExportPreferences {
  defaultPaperSize: 'A4' | 'Letter' | 'Legal';
  defaultOrientation: 'portrait' | 'landscape';
  includeLogo: boolean;
  includeClinicInfo: boolean;
  includeDate: boolean;
  includePageNumbers: boolean;
  defaultExportFormat: 'pdf' | 'excel' | 'csv';
  compressImages: boolean;
  imageQuality: 'low' | 'medium' | 'high';
}

// Dashboard preferences
export interface DashboardPreferences {
  showQuickStats: boolean;
  showRevenueChart: boolean;
  showAppointmentsToday: boolean;
  showLowStockAlerts: boolean;
  showRecentPatients: boolean;
  showPendingPayments: boolean;
  defaultDateRange: 'today' | 'week' | 'month' | 'year' | 'custom';
  refreshInterval: number; // in seconds, 0 = disabled
  layout: 'default' | 'compact' | 'expanded';
}

// Table preferences
export interface TablePreferences {
  pageSize: PageSize;
  enablePagination: boolean;
  enableSorting: boolean;
  enableFiltering: boolean;
  enableColumnResize: boolean;
  enableColumnReorder: boolean;
  stickyHeader: boolean;
  stripedRows: boolean;
  highlightOnHover: boolean;
}

// All user preferences combined
export interface UserPreferences {
  // Display settings
  pageViews: PageViewPreferences;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  currencyPosition: CurrencyPosition;
  currencySymbol: string;
  decimalPlaces: number;
  showCurrencySymbol: boolean;
  
  // Notification settings
  notifications: NotificationPreferences;
  
  // Print/Export settings
  printExport: PrintExportPreferences;
  
  // Dashboard settings
  dashboard: DashboardPreferences;
  
  // Table settings
  table: TablePreferences;
  
  // Accessibility settings
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reduceMotion: boolean;
  
  // Privacy settings
  autoLockTimeout: number; // in minutes, 0 = disabled
  clearClipboardAfter: number; // in seconds, 0 = disabled
  maskSensitiveData: boolean;
}

// Default preferences
const defaultPreferences: UserPreferences = {
  pageViews: {
    inventory: 'grid',
    patients: 'grid',
    doctors: 'grid',
    suppliers: 'grid',
    purchaseOrders: 'list',
    expenses: 'grid',
    appointments: 'list',
    treatments: 'list',
    prescriptions: 'list',
    labCases: 'list',
    financialAccounts: 'list',
    reports: 'list',
  },
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  currencyPosition: 'after',
  currencySymbol: 'EGP',
  decimalPlaces: 2,
  showCurrencySymbol: true,
  
  notifications: {
    enableSound: true,
    enableDesktop: true,
    enableEmail: false,
    appointmentReminders: true,
    lowStockAlerts: true,
    paymentReminders: true,
    treatmentReminders: true,
    labCaseUpdates: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  },
  
  printExport: {
    defaultPaperSize: 'A4',
    defaultOrientation: 'portrait',
    includeLogo: true,
    includeClinicInfo: true,
    includeDate: true,
    includePageNumbers: true,
    defaultExportFormat: 'pdf',
    compressImages: true,
    imageQuality: 'medium',
  },
  
  dashboard: {
    showQuickStats: true,
    showRevenueChart: true,
    showAppointmentsToday: true,
    showLowStockAlerts: true,
    showRecentPatients: true,
    showPendingPayments: true,
    defaultDateRange: 'month',
    refreshInterval: 0,
    layout: 'default',
  },
  
  table: {
    pageSize: 25,
    enablePagination: true,
    enableSorting: true,
    enableFiltering: true,
    enableColumnResize: true,
    enableColumnReorder: false,
    stickyHeader: true,
    stripedRows: false,
    highlightOnHover: true,
  },
  
  fontSize: 'medium',
  highContrast: false,
  reduceMotion: false,
  
  autoLockTimeout: 0,
  clearClipboardAfter: 60,
  maskSensitiveData: false,
};

// Context type
interface UserPreferencesContextType {
  preferences: UserPreferences;
  updatePreferences: <K extends keyof UserPreferences>(
    category: K,
    updates: UserPreferences[K] extends object ? Partial<UserPreferences[K]> : UserPreferences[K]
  ) => void;
  updatePageView: (page: keyof PageViewPreferences, view: ViewMode) => void;
  resetPreferences: () => void;
  resetCategory: <K extends keyof UserPreferences>(category: K) => void;
  exportPreferences: () => string;
  importPreferences: (json: string) => boolean;
}

// Create context
const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

// Storage key
const STORAGE_KEY = 'curasoft_user_preferences';

// Provider component
interface UserPreferencesProviderProps {
  children: ReactNode;
}

export const UserPreferencesProvider: React.FC<UserPreferencesProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all fields exist
        return {
          ...defaultPreferences,
          ...parsed,
          pageViews: { ...defaultPreferences.pageViews, ...(parsed.pageViews || {}) },
          notifications: { ...defaultPreferences.notifications, ...(parsed.notifications || {}) },
          printExport: { ...defaultPreferences.printExport, ...(parsed.printExport || {}) },
          dashboard: { ...defaultPreferences.dashboard, ...(parsed.dashboard || {}) },
          table: { ...defaultPreferences.table, ...(parsed.table || {}) },
          // Explicitly handle primitive accessibility and privacy fields
          fontSize: parsed.fontSize || defaultPreferences.fontSize,
          highContrast: parsed.highContrast ?? defaultPreferences.highContrast,
          reduceMotion: parsed.reduceMotion ?? defaultPreferences.reduceMotion,
          autoLockTimeout: parsed.autoLockTimeout ?? defaultPreferences.autoLockTimeout,
          clearClipboardAfter: parsed.clearClipboardAfter ?? defaultPreferences.clearClipboardAfter,
          maskSensitiveData: parsed.maskSensitiveData ?? defaultPreferences.maskSensitiveData,
        };
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
    return defaultPreferences;
  });

  // Save to localStorage whenever preferences change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }, [preferences]);

  // Apply font size to document
  useEffect(() => {
    const fontSizes = {
      'small': '14px',
      'medium': '16px',
      'large': '18px',
      'extra-large': '20px',
    };
    document.documentElement.style.fontSize = fontSizes[preferences.fontSize];
  }, [preferences.fontSize]);

  // Apply high contrast mode
  useEffect(() => {
    if (preferences.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [preferences.highContrast]);

  // Apply reduced motion
  useEffect(() => {
    if (preferences.reduceMotion) {
      document.documentElement.style.setProperty('--transition-duration', '0ms');
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.style.removeProperty('--transition-duration');
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [preferences.reduceMotion]);

  // Update a specific category of preferences
  const updatePreferences = useCallback(<K extends keyof UserPreferences>(
    category: K,
    updates: UserPreferences[K] extends object ? Partial<UserPreferences[K]> : UserPreferences[K]
  ) => {
    setPreferences(prev => {
      const currentValue = prev[category];
      // Handle primitive values (fontSize, highContrast, reduceMotion, etc.)
      if (typeof currentValue !== 'object' || currentValue === null) {
        return {
          ...prev,
          [category]: updates as UserPreferences[K],
        };
      }
      // Handle object values (dashboard, notifications, etc.)
      return {
        ...prev,
        [category]: {
          ...currentValue,
          ...(updates as object),
        },
      };
    });
  }, []);

  // Update page view preference
  const updatePageView = useCallback((page: keyof PageViewPreferences, view: ViewMode) => {
    setPreferences(prev => ({
      ...prev,
      pageViews: {
        ...prev.pageViews,
        [page]: view,
      },
    }));
  }, []);

  // Reset all preferences to defaults
  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
  }, []);

  // Reset a specific category to defaults
  const resetCategory = useCallback(<K extends keyof UserPreferences>(category: K) => {
    setPreferences(prev => ({
      ...prev,
      [category]: defaultPreferences[category],
    }));
  }, []);

  // Export preferences as JSON string
  const exportPreferences = useCallback(() => {
    return JSON.stringify(preferences, null, 2);
  }, [preferences]);

  // Import preferences from JSON string
  const importPreferences = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json);
      // Validate that it's a valid preferences object
      if (typeof parsed === 'object' && parsed !== null) {
        setPreferences({
          ...defaultPreferences,
          ...parsed,
          pageViews: { ...defaultPreferences.pageViews, ...parsed.pageViews },
          notifications: { ...defaultPreferences.notifications, ...parsed.notifications },
          printExport: { ...defaultPreferences.printExport, ...parsed.printExport },
          dashboard: { ...defaultPreferences.dashboard, ...parsed.dashboard },
          table: { ...defaultPreferences.table, ...parsed.table },
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import preferences:', error);
      return false;
    }
  }, []);

  const value: UserPreferencesContextType = {
    preferences,
    updatePreferences,
    updatePageView,
    resetPreferences,
    resetCategory,
    exportPreferences,
    importPreferences,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

// Custom hook to use user preferences
export const useUserPreferences = (): UserPreferencesContextType => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};

// Hook for getting/setting a specific page view
export const usePageView = (page: keyof PageViewPreferences): [ViewMode, (view: ViewMode) => void] => {
  const { preferences, updatePageView } = useUserPreferences();
  const view = preferences.pageViews[page];
  const setView = useCallback((newView: ViewMode) => {
    updatePageView(page, newView);
  }, [page, updatePageView]);
  return [view, setView];
};

export default UserPreferencesContext;
