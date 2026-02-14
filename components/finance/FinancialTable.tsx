import React from 'react';
import { useI18n } from '../../hooks/useI18n';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render: (item: T) => React.ReactNode;
}

interface FinancialTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title: string;
  emptyMessage: string;
}

function FinancialTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  emptyMessage,
}: FinancialTableProps<T>) {
  const { t } = useI18n();

  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-slate-800 mb-4">{title}</h3>
        <div className="text-center py-8 text-slate-500">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.map((item, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50 transition-colors">
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right"
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
        <div className="text-sm text-slate-600 text-right">
          {t('financialTable.showing')} {data.length} {t('financialTable.entries')}
        </div>
      </div>
    </div>
  );
}

export default FinancialTable;