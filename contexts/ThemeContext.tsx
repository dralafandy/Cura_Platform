import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Try to get theme from localStorage, default to 'dark'
  const [theme, setThemeState] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('curasoft_theme');
    return (storedTheme === 'light' || storedTheme === 'dark') ? storedTheme : 'dark';
  });

  // Apply theme to document
  useEffect(() => {
    localStorage.setItem('curasoft_theme', theme);
    
    // Apply data-theme attribute to document for CSS variable switching
    document.documentElement.setAttribute('data-theme', theme);
    
    // Also add/remove dark class for Tailwind dark mode support
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const isDark = theme === 'dark';

  const contextValue = useMemo(() => ({ 
    theme, 
    setTheme, 
    toggleTheme, 
    isDark 
  }), [theme, isDark]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
