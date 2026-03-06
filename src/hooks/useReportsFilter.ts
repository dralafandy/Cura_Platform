import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface ReportFilter {
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  clinicId?: string;
  reportType: string;
}

export const useReportsFilter = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState<ReportFilter>({
    dateRange: {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate: new Date()
    },
    reportType: 'overview'
  });

  // Initialize filters from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const startDateParam = params.get('startDate');
    const endDateParam = params.get('endDate');
    const reportTypeParam = params.get('reportType');

    if (startDateParam || endDateParam || reportTypeParam) {
      setFilters(prev => ({
        ...prev,
        dateRange: {
          startDate: startDateParam ? new Date(startDateParam) : prev.dateRange.startDate,
          endDate: endDateParam ? new Date(endDateParam) : prev.dateRange.endDate
        },
        reportType: reportTypeParam || prev.reportType
      }));
    }
  }, [location.search]);

  const updateFilter = (newFilters: Partial<ReportFilter>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);

    // Update URL with new parameters
    const params = new URLSearchParams();
    
    if (updatedFilters.dateRange.startDate) {
      params.set('startDate', updatedFilters.dateRange.startDate.toISOString());
    }
    
    if (updatedFilters.dateRange.endDate) {
      params.set('endDate', updatedFilters.dateRange.endDate.toISOString());
    }
    
    if (updatedFilters.reportType) {
      params.set('reportType', updatedFilters.reportType);
    }

    navigate(`?${params.toString()}`, { replace: true });
  };

  const resetFilters = () => {
    const defaultFilters: ReportFilter = {
      dateRange: {
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date()
      },
      reportType: 'overview'
    };
    
    setFilters(defaultFilters);
    
    // Reset URL parameters
    navigate('', { replace: true });
  };

  return {
    filters,
    updateFilter,
    resetFilters
  };
};