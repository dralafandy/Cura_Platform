import React, { createContext, useContext, ReactNode } from 'react';
import { useReportsFilter } from '../hooks/useReportsFilter';
import { ReportFilter } from '../types/reportTypes'; // Assuming this type exists

interface ReportsFilterContextProps {
  filters: ReportFilter;
  updateFilter: (newFilters: Partial<ReportFilter>) => void;
  resetFilters: () => void;
}

const ReportsFilterContext = createContext<ReportsFilterContextProps | undefined>(undefined);

export const ReportsFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { filters, updateFilter, resetFilters } = useReportsFilter();

  return (
    <ReportsFilterContext.Provider value={{ filters, updateFilter, resetFilters }}>
      {children}
    </ReportsFilterContext.Provider>
  );
};

export const useReportsFilterContext = () => {
  const context = useContext(ReportsFilterContext);
  if (!context) {
    throw new Error('useReportsFilterContext must be used within a ReportsFilterProvider');
  }
  return context;
};