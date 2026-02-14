import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface ReportsFilters {
  startDate: string;
  endDate: string;
  selectedDentist: string;
  selectedPatient: string;
  selectedSupplier: string;
  selectedPaymentMethod: string;
  selectedExpenseCategory: string;
  selectedTreatment: string;
}

interface ReportsFilterContextType {
  filters: ReportsFilters;
  setFilters: (filters: ReportsFilters) => void;
  updateFilter: (key: keyof ReportsFilters, value: string) => void;
  resetFilters: () => void;
  hasActiveFilters: () => boolean;
  getPreviousPeriod: (startDate: string, endDate: string) => { startDate: string; endDate: string };
}

const defaultFilters: ReportsFilters = {
  startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  selectedDentist: '',
  selectedPatient: '',
  selectedSupplier: '',
  selectedPaymentMethod: '',
  selectedExpenseCategory: '',
  selectedTreatment: '',
};

const ReportsFilterContext = createContext<ReportsFilterContextType | undefined>(undefined);

export const ReportsFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFiltersState] = useState<ReportsFilters>(defaultFilters);

  const setFilters = useCallback((newFilters: ReportsFilters) => {
    setFiltersState(newFilters);
  }, []);

  const updateFilter = useCallback((key: keyof ReportsFilters, value: string) => {
    setFiltersState(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.selectedDentist !== '' ||
      filters.selectedPatient !== '' ||
      filters.selectedSupplier !== '' ||
      filters.selectedPaymentMethod !== '' ||
      filters.selectedExpenseCategory !== '' ||
      filters.selectedTreatment !== ''
    );
  }, [filters]);

  const getPreviousPeriod = useCallback((startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - diffDays);
    
    return {
      startDate: prevStart.toISOString().split('T')[0],
      endDate: prevEnd.toISOString().split('T')[0]
    };
  }, []);

  const value: ReportsFilterContextType = {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    getPreviousPeriod,
  };

  return (
    <ReportsFilterContext.Provider value={value}>
      {children}
    </ReportsFilterContext.Provider>
  );
};

export const useReportsFilters = () => {
  const context = useContext(ReportsFilterContext);
  if (context === undefined) {
    throw new Error('useReportsFilters must be used within a ReportsFilterProvider');
  }
  return context;
};
