import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { arTranslations } from '../locales/ar';
import { enTranslations } from '../locales/en';

type Translations = Record<string, string>;

interface I18nContextType {
  locale: 'ar' | 'en';
  setLocale: (locale: 'ar' | 'en') => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  direction: 'rtl' | 'ltr';
}

// FIX: Export I18nContext so it can be imported by the hook
export const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Try to get locale from localStorage, default to 'ar'
  const [locale, setLocale] = useState<'ar' | 'en'>(() => {
    const storedLocale = localStorage.getItem('curasoft_locale');
    return (storedLocale === 'ar' || storedLocale === 'en') ? storedLocale : 'ar';
  });

  useEffect(() => {
    localStorage.setItem('curasoft_locale', locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  const translations: Translations = useMemo(() => {
    switch (locale) {
      case 'ar':
        return arTranslations;
      case 'en':
        return enTranslations;
      default:
        return arTranslations; // Fallback
    }
  }, [locale]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let translation = translations[key] || key; // Fallback to key if not found
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        translation = translation.replace(`{{${paramKey}}}`, String(paramValue));
      }
    }
    return translation;
  }, [translations]);

  // FIX: Explicitly type 'direction' to match I18nContextType
  const direction: 'rtl' | 'ltr' = locale === 'ar' ? 'rtl' : 'ltr';

  const contextValue = useMemo(() => ({ locale, setLocale, t, direction }), [locale, setLocale, t, direction]);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};