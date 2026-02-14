import React, { useState, ReactNode, useMemo, useCallback } from 'react';
import { useResponsiveContext } from '../contexts/ResponsiveContext';

// Column definition
export interface ResponsiveColumn<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  mobileLabel?: string; // Label to show on mobile cards
  hideOnMobile?: boolean;
}

// Sort direction
export type SortDirection = 'asc' | 'desc' | null;

// Props
interface ResponsiveTableProps<T> {
  data: T[];
  columns: ResponsiveColumn<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  sortable?: boolean;
  defaultSort?: { key: string; direction: SortDirection };
  // Card customization
  cardTitle?: (item: T) => ReactNode;
  cardSubtitle?: (item: T) => ReactNode;
  cardImage?: (item: T) => ReactNode;
  cardActions?: (item: T) => ReactNode;
  // Styling
  striped?: boolean;
  hoverable?: boolean;
  dense?: boolean;
  className?: string;
}

function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  loading = false,
  emptyMessage = 'No data available',
  sortable = false,
  defaultSort?: { key: string; direction: SortDirection } | null;
  cardTitle,
  cardSubtitle,
  cardImage,
  cardActions,
  striped = false,
  hoverable = true,
  dense = false,
  className = ''
}: ResponsiveTableProps<T>) {
  const { isMobile, isTablet } = useResponsiveContext();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection } | null>(
    defaultSort || null
  );

  // Sort data if sort config is set
  const sortedData = useMemo(() => {
    if (!sortConfig || !sortable) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[sortConfig.key];
      const bValue = (b as Record<string, unknown>)[sortConfig.key];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig, sortable]);

  // Handle header click for sorting
  const handleSort = useCallback((key: string) => {
    if (!sortable) return;

    setSortConfig(prev => {
      if (!prev || prev.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  }, [sortable]);

  // Render desktop table
  const renderDesktopTable = () => (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            {columns.map(column => (
              <th
                key={column.key}
                className={`
                  px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 
                  uppercase tracking-wider
                  ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}
                  ${column.width ? column.width : ''}
                  ${sortable && column.sortable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 select-none' : ''}
                `}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-1">
                  {column.header}
                  {sortable && column.sortable && sortConfig?.key === column.key && (
                    <span className="text-primary">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`
          bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700
          ${striped ? 'divide-y' : ''}
        `}>
          {sortedData.map((item, index) => (
            <tr
              key={keyExtractor(item)}
              className={`
                ${hoverable ? 'hover:bg-slate-50 dark:hover:bg-slate-700/50' : ''}
                ${onRowClick ? 'cursor-pointer' : ''}
                ${striped && index % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-700/20' : ''}
                ${dense ? 'py-2' : ''}
                transition-colors duration-150
              `}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map(column => (
                <td
                  key={column.key}
                  className={`
                    px-4 py-3 text-sm text-slate-600 dark:text-slate-300
                    ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}
                    ${dense ? 'py-2' : ''}
                  `}
                >
                  {column.render 
                    ? column.render(item, index)
                    : String((item as Record<string, unknown>)[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Render mobile card view
  const renderMobileCards = () => (
    <div className={`space-y-3 ${className}`}>
      {sortedData.map((item, index) => (
        <div
          key={keyExtractor(item)}
          className={`
            bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700
            overflow-hidden
            ${onRowClick ? 'cursor-pointer' : ''}
            ${hoverable ? 'hover:shadow-md transition-shadow duration-200' : ''}
          `}
          onClick={() => onRowClick?.(item)}
        >
          {/* Card Header with optional image */}
          {(cardImage || cardTitle) && (
            <div className="flex items-start gap-3 p-4 border-b border-slate-100 dark:border-slate-700">
              {cardImage && (
                <div className="flex-shrink-0">
                  {cardImage(item)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                {cardTitle && (
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {cardTitle(item)}
                  </div>
                )}
                {cardSubtitle && (
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {cardSubtitle(item)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card Body - Data rows */}
          <div className="p-4">
            <dl className="space-y-2">
              {columns
                .filter(col => !col.hideOnMobile)
                .map(column => (
                  <div key={column.key} className="flex justify-between gap-2">
                    <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {column.mobileLabel || column.header}
                    </dt>
                    <dd className={`
                      text-sm font-medium text-slate-800 dark:text-slate-200
                      text-${column.align === 'right' ? 'right' : column.align === 'center' ? 'center' : 'left'}
                    `}>
                      {column.render 
                        ? column.render(item, index)
                        : String((item as Record<string, unknown>)[column.key] ?? '')}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>

          {/* Card Actions */}
          {cardActions && (
            <div className="px-4 pb-4">
              {cardActions(item)}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Empty state
  if (!data.length) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  // Render based on screen size
  if (isMobile || isTablet) {
    return renderMobileCards();
  }

  return renderDesktopTable();
}

export default ResponsiveTable;
