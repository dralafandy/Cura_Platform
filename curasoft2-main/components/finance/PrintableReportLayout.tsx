import React from 'react';
import { useI18n } from '../../hooks/useI18n';
import { useClinicData } from '../../hooks/useClinicData';

interface PrintableReportLayoutProps {
  title: string;
  dateRange?: { startDate: string; endDate: string };
  children: React.ReactNode;
  accentColor?: string;
}

const PrintableReportLayout: React.FC<PrintableReportLayoutProps> = ({ title, dateRange, children, accentColor = 'blue' }) => {
  const { t } = useI18n();
  const { clinicInfo } = useClinicData();
  const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const accentColors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-700',
    green: 'from-green-500 to-green-700',
    purple: 'from-purple-500 to-purple-700',
    teal: 'from-teal-500 to-teal-700',
    orange: 'from-orange-500 to-orange-700',
    indigo: 'from-indigo-500 to-indigo-700',
  };

  const colorClasses: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    teal: 'text-teal-600',
    orange: 'text-orange-600',
    indigo: 'text-indigo-600',
  };

  return (
    <div className="p-4 bg-white text-slate-900" dir="rtl" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontSize: '12px', lineHeight: '1.4' }}>
      {/* Header with gradient accent */}
      <header className="text-center mb-6 break-inside-avoid">
        {/* Clinic Info Box */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 mb-4 border border-slate-200">
          <div className="flex items-center justify-center gap-4">
            {clinicInfo.logo ? (
              <img 
                src={clinicInfo.logo} 
                alt="شعار العيادة" 
                className="w-16 h-16 object-contain"
              />
            ) : null}
            <div className={clinicInfo.logo ? 'text-right' : 'text-center'}>
              <h1 className="text-xl font-bold text-slate-800 mb-1">{clinicInfo.name || t('appName')}</h1>
              <p className="text-sm text-slate-600">{clinicInfo.address}</p>
              <p className="text-sm text-slate-600">{clinicInfo.phone} | {clinicInfo.email}</p>
            </div>
          </div>
        </div>
        
        {/* Title with accent bar */}
        <div className="relative">
          <div className={`h-1.5 w-24 mx-auto rounded-full bg-gradient-to-r ${accentColors[accentColor] || accentColors.blue} mb-3`}></div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
        </div>
        
        {dateRange && (
          <p className="text-sm text-slate-600 bg-slate-50 inline-block px-4 py-1 rounded-full">
            {t('reports.dateRange')}: {dateRange.startDate ? dateFormatter.format(new Date(dateRange.startDate)) : t('common.na')} - {dateRange.endDate ? dateFormatter.format(new Date(dateRange.endDate)) : t('common.na')}
          </p>
        )}
      </header>

      <main className="space-y-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center mt-8 pt-4 border-t-2 border-slate-100 break-inside-avoid">
        <div className={`h-0.5 w-16 mx-auto rounded-full bg-gradient-to-r ${accentColors[accentColor] || accentColors.blue} mb-3`}></div>
        <p className="text-xs text-slate-500">{t('reports.generatedOn')} {new Date().toLocaleString()}</p>
        <p className="text-xs text-slate-400 mt-1">{t('reports.pageFooter')}</p>
      </footer>
    </div>
  );
};

export default PrintableReportLayout;
