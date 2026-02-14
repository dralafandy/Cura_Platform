import React from 'react';
import { useI18n } from '../../hooks/useI18n';

interface ChartData {
  label: string;
  value: number;
}

interface FinancialChartsProps {
  data: ChartData[];
  title: string;
  colorClass: string;
}

const FinancialCharts: React.FC<FinancialChartsProps> = ({ data, title, colorClass }) => {
  const { t } = useI18n();

  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-slate-800 mb-4">{title}</h3>
        <div className="text-center py-8 text-slate-500">
          {t('financialCharts.noData')}
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold text-slate-800 mb-6">{title}</h3>

      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

          return (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-32 text-sm font-medium text-slate-700 truncate">
                {item.label}
              </div>
              <div className="flex-1">
                <div className="w-full bg-slate-200 rounded-full h-6 relative">
                  <div
                    className={`h-6 rounded-full ${colorClass} transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                  >
                    <div className="absolute inset-0 flex items-center justify-end pr-2">
                      <span className="text-xs font-semibold text-white">
                        {item.value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="text-sm text-slate-600 text-center">
          {t('financialCharts.total')}: {data.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default FinancialCharts;