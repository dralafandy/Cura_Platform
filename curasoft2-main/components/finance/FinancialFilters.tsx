import React from 'react';
import { useI18n } from '../../hooks/useI18n';

interface FinancialFiltersProps {
  filters: {
    startDate: string;
    endDate: string;
  };
  onFiltersChange: (filters: FinancialFiltersProps['filters']) => void;
}

const FinancialFilters: React.FC<FinancialFiltersProps> = ({ filters, onFiltersChange }) => {
  const { t } = useI18n();

  const handleFilterChange = (key: keyof FinancialFiltersProps['filters'], value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      startDate: '',
      endDate: '',
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('financialFilters.title')}</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline"
        >
          {t('financialFilters.clearAll')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label htmlFor="date-preset" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('financialFilters.dateRange')}
          </label>
          <select
            id="date-preset"
            onChange={(e) => {
              const today = new Date();
              let startDate = '';
              let endDate = '';

              switch (e.target.value) {
                case 'today':
                  startDate = endDate = today.toISOString().split('T')[0];
                  break;
                case 'thisWeek': {
                  const weekStart = new Date(today);
                  weekStart.setDate(today.getDate() - today.getDay());
                  startDate = weekStart.toISOString().split('T')[0];
                  endDate = today.toISOString().split('T')[0];
                  break;
                }
                case 'thisMonth':
                  startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                  endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
                  break;
                case 'thisYear':
                  startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
                  endDate = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
                  break;
                case 'custom':
                default:
                  break;
              }

              onFiltersChange({
                startDate,
                endDate,
              });
            }}
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          >
            <option value="">{t('financialFilters.selectPreset')}</option>
            <option value="today">{t('financialFilters.today')}</option>
            <option value="thisWeek">{t('financialFilters.thisWeek')}</option>
            <option value="thisMonth">{t('financialFilters.thisMonth')}</option>
            <option value="thisYear">{t('financialFilters.thisYear')}</option>
            <option value="custom">{t('financialFilters.custom')}</option>
          </select>
        </div>

        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('financialFilters.startDate')}
          </label>
          <input
            type="date"
            id="start-date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('financialFilters.endDate')}
          </label>
          <input
            type="date"
            id="end-date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.startDate && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            {t('financialFilters.startDate')}: {new Date(filters.startDate).toLocaleDateString()}
            <button
              onClick={() => handleFilterChange('startDate', '')}
              className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200"
            >
              x
            </button>
          </span>
        )}
        {filters.endDate && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            {t('financialFilters.endDate')}: {new Date(filters.endDate).toLocaleDateString()}
            <button
              onClick={() => handleFilterChange('endDate', '')}
              className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200"
            >
              x
            </button>
          </span>
        )}
      </div>
    </div>
  );
};

export default FinancialFilters;
