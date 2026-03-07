import React from 'react';
import type { ClinicInfo } from '../../hooks/useClinicData';

export interface PrintableMetric {
  label: string;
  value: string;
  helper?: string;
  tone?: 'slate' | 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan';
}

export interface PrintableTable {
  title: string;
  columns: string[];
  rows: string[][];
  compact?: boolean;
}

export interface PrintableSection {
  title: string;
  description?: string;
  accent: string;
  metrics?: PrintableMetric[];
  tables?: PrintableTable[];
}

interface PrintableClinicReportProps {
  clinicInfo: ClinicInfo;
  reportTitle: string;
  reportSubtitle: string;
  generatedAt: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  highlights: PrintableMetric[];
  sections: PrintableSection[];
  isPrintWindow?: boolean;
}

type AccentKey = 'slate' | 'teal' | 'blue' | 'violet' | 'amber' | 'rose' | 'indigo';

const tonePalette: Record<NonNullable<PrintableMetric['tone']>, { soft: string; line: string; text: string }> = {
  slate: { soft: '#eef2f7', line: '#334155', text: '#0f172a' },
  blue: { soft: '#e0f2fe', line: '#0284c7', text: '#0c4a6e' },
  green: { soft: '#dcfce7', line: '#16a34a', text: '#14532d' },
  amber: { soft: '#fef3c7', line: '#d97706', text: '#78350f' },
  red: { soft: '#ffe4e6', line: '#e11d48', text: '#881337' },
  purple: { soft: '#ede9fe', line: '#7c3aed', text: '#4c1d95' },
  cyan: { soft: '#cffafe', line: '#0891b2', text: '#164e63' },
};

const sectionPalette: Record<AccentKey, { solid: string; soft: string; deep: string; border: string }> = {
  slate: { solid: '#334155', soft: '#f8fafc', deep: '#0f172a', border: '#cbd5e1' },
  teal: { solid: '#0f766e', soft: '#ecfdf5', deep: '#134e4a', border: '#99f6e4' },
  blue: { solid: '#2563eb', soft: '#eff6ff', deep: '#1e3a8a', border: '#bfdbfe' },
  violet: { solid: '#7c3aed', soft: '#f5f3ff', deep: '#4c1d95', border: '#ddd6fe' },
  amber: { solid: '#d97706', soft: '#fff7ed', deep: '#7c2d12', border: '#fed7aa' },
  rose: { solid: '#e11d48', soft: '#fff1f2', deep: '#881337', border: '#fecdd3' },
  indigo: { solid: '#4f46e5', soft: '#eef2ff', deep: '#312e81', border: '#c7d2fe' },
};

const resolveAccent = (accent: string): AccentKey => {
  if (accent.includes('emerald') || accent.includes('teal')) return 'teal';
  if (accent.includes('cyan') || accent.includes('blue') || accent.includes('sky')) return 'blue';
  if (accent.includes('violet') || accent.includes('purple') || accent.includes('fuchsia')) return 'violet';
  if (accent.includes('amber') || accent.includes('orange')) return 'amber';
  if (accent.includes('rose') || accent.includes('red')) return 'rose';
  if (accent.includes('indigo')) return 'indigo';
  return 'slate';
};

const cssVariables = (palette: { solid: string; soft: string; deep: string; border: string }) =>
  ({
    '--section-solid': palette.solid,
    '--section-soft': palette.soft,
    '--section-deep': palette.deep,
    '--section-border': palette.border,
  } as React.CSSProperties);

const toneVariables = (tone: NonNullable<PrintableMetric['tone']>) =>
  ({
    '--tone-soft': tonePalette[tone].soft,
    '--tone-line': tonePalette[tone].line,
    '--tone-text': tonePalette[tone].text,
  } as React.CSSProperties);

const PrintableClinicReport: React.FC<PrintableClinicReportProps> = ({
  clinicInfo,
  reportTitle,
  reportSubtitle,
  generatedAt,
  dateRange,
  highlights,
  sections,
  isPrintWindow = false,
}) => {
  return (
    <div className={`self-styled-report${isPrintWindow ? ' self-styled-report--print' : ''}`} dir="rtl">
      <style>{`
        .self-styled-report {
          background: #e9eef5;
          color: #172554;
          font-family: "Cairo", Tahoma, Arial, sans-serif;
          padding: 24px;
        }

        .self-styled-report *,
        .self-styled-report *::before,
        .self-styled-report *::after {
          box-sizing: border-box;
        }

        .report-shell {
          max-width: 1360px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #dbe4f0;
          border-radius: 30px;
          overflow: hidden;
          box-shadow: 0 24px 55px rgba(15, 23, 42, 0.12);
        }

        .report-hero {
          position: relative;
          overflow: hidden;
          padding: 34px 38px 30px;
          background:
            radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 28%),
            linear-gradient(135deg, #0f3d56 0%, #0f766e 44%, #1d4ed8 100%);
        }

        .report-hero::after {
          content: "";
          position: absolute;
          inset: auto -8% -42px auto;
          width: 260px;
          height: 260px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          transform: rotate(18deg);
        }

        .hero-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: minmax(0, 1.9fr) minmax(300px, 0.9fr);
          gap: 24px;
          align-items: start;
        }

        .hero-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          color: #dff7f8;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        .hero-title {
          margin: 16px 0 10px;
          color: #ffffff;
          font-size: 33px;
          font-weight: 900;
          line-height: 1.2;
        }

        .hero-subtitle {
          margin: 0;
          max-width: 860px;
          color: rgba(255, 255, 255, 0.92);
          font-size: 14px;
          line-height: 1.9;
        }

        .hero-panel {
          position: relative;
          z-index: 1;
          padding: 18px 18px 16px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 22px;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.08));
          backdrop-filter: blur(12px);
        }

        .hero-panel-title {
          margin: 0 0 12px;
          color: #ffffff;
          font-size: 18px;
          font-weight: 800;
        }

        .hero-list {
          display: grid;
          gap: 8px;
        }

        .hero-row {
          display: grid;
          grid-template-columns: 108px minmax(0, 1fr);
          gap: 10px;
          align-items: start;
          color: rgba(255, 255, 255, 0.95);
          font-size: 13px;
        }

        .hero-row-label {
          color: rgba(224, 242, 254, 0.88);
          font-weight: 700;
        }

        .summary-strip {
          padding: 24px 38px;
          background: linear-gradient(180deg, #f8fbff 0%, #f4f7fb 100%);
          border-bottom: 1px solid #dbe4f0;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .summary-card {
          padding: 16px 18px;
          border-radius: 20px;
          border: 1px solid rgba(15, 23, 42, 0.04);
          background: var(--tone-soft);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45);
          border-inline-start: 6px solid var(--tone-line);
        }

        .summary-label {
          margin: 0;
          color: var(--tone-text);
          font-size: 12px;
          font-weight: 800;
        }

        .summary-value {
          margin: 8px 0 0;
          color: #0f172a;
          font-size: 24px;
          font-weight: 900;
          line-height: 1.3;
        }

        .summary-helper {
          margin: 8px 0 0;
          color: #475569;
          font-size: 11px;
          line-height: 1.7;
        }

        .report-body {
          padding: 28px 38px 34px;
          background: #ffffff;
        }

        .report-section + .report-section {
          margin-top: 24px;
        }

        .section-head {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          justify-content: space-between;
          padding: 18px 20px;
          border: 1px solid var(--section-border);
          border-radius: 24px;
          background: linear-gradient(135deg, var(--section-soft) 0%, #ffffff 100%);
        }

        .section-badge {
          flex: 0 0 auto;
          width: 14px;
          height: 52px;
          border-radius: 999px;
          background: linear-gradient(180deg, var(--section-solid) 0%, var(--section-deep) 100%);
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.12);
        }

        .section-copy {
          flex: 1 1 auto;
        }

        .section-title {
          margin: 0;
          color: var(--section-deep);
          font-size: 22px;
          font-weight: 900;
        }

        .section-description {
          margin: 6px 0 0;
          color: #475569;
          font-size: 13px;
          line-height: 1.8;
        }

        .section-body {
          margin-top: 14px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }

        .metric-card {
          min-height: 118px;
          padding: 14px 14px 12px;
          border: 1px solid var(--section-border);
          border-radius: 20px;
          background: #ffffff;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
        }

        .metric-label {
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          line-height: 1.8;
        }

        .metric-value {
          margin-top: 8px;
          color: #0f172a;
          font-size: 22px;
          font-weight: 900;
          line-height: 1.3;
          word-break: break-word;
        }

        .metric-helper {
          margin-top: 7px;
          color: #64748b;
          font-size: 11px;
          line-height: 1.6;
        }

        .tables-grid {
          display: grid;
          gap: 14px;
        }

        .table-card {
          overflow: hidden;
          border: 1px solid var(--section-border);
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 12px 26px rgba(15, 23, 42, 0.05);
          page-break-inside: avoid;
          break-inside: avoid-page;
        }

        .table-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 18px;
          background: linear-gradient(135deg, var(--section-solid) 0%, var(--section-deep) 100%);
        }

        .table-title {
          margin: 0;
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
        }

        .table-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 38px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.16);
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
        }

        .table-wrap {
          overflow-x: auto;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .report-table thead th {
          padding: 12px 12px;
          border-bottom: 1px solid #dbe4f0;
          background: var(--section-soft);
          color: var(--section-deep);
          text-align: right;
          font-size: 11px;
          font-weight: 900;
          line-height: 1.8;
        }

        .report-table tbody td {
          padding: 11px 12px;
          border-bottom: 1px solid #edf2f7;
          color: #1e293b;
          text-align: right;
          font-size: 12px;
          line-height: 1.85;
          vertical-align: top;
          word-break: break-word;
        }

        .report-table--compact tbody td {
          font-size: 11px;
          line-height: 1.75;
        }

        .report-table tbody tr:nth-child(even) {
          background: #fbfdff;
        }

        .report-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .empty-state {
          padding: 24px 16px;
          text-align: center;
          color: #64748b;
          font-size: 13px;
          background: #ffffff;
        }

        .report-footer {
          display: flex;
          gap: 18px;
          align-items: center;
          justify-content: space-between;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px dashed #cbd5e1;
          color: #64748b;
          font-size: 12px;
        }

        .report-footer strong {
          color: #0f172a;
        }

        @media (max-width: 1200px) {
          .summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .metrics-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 820px) {
          .self-styled-report {
            padding: 12px;
          }

          .report-shell {
            border-radius: 18px;
          }

          .report-hero,
          .summary-strip,
          .report-body {
            padding-right: 18px;
            padding-left: 18px;
          }

          .hero-grid {
            grid-template-columns: 1fr;
          }

          .summary-grid,
          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .section-head,
          .table-head,
          .report-footer {
            display: block;
          }

          .section-badge {
            width: 100%;
            height: 10px;
            margin-bottom: 12px;
          }

          .table-count {
            margin-top: 10px;
          }
        }

        @page {
          size: A4 landscape;
          margin: 10mm;
        }

        @media print {
          html,
          body {
            background: #ffffff !important;
          }

          .self-styled-report {
            padding: 0 !important;
            background: #ffffff !important;
          }

          .self-styled-report,
          .self-styled-report * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .self-styled-report .report-shell {
            max-width: none;
            border: 0;
            border-radius: 0;
            box-shadow: none;
          }

          .self-styled-report .report-hero {
            padding: 20px 22px 18px;
          }

          .self-styled-report .hero-grid {
            grid-template-columns: minmax(0, 1.55fr) minmax(255px, 0.85fr);
            gap: 14px;
          }

          .self-styled-report .hero-kicker {
            padding: 5px 10px;
            font-size: 10px;
          }

          .self-styled-report .hero-title {
            margin: 10px 0 6px;
            font-size: 24px;
          }

          .self-styled-report .hero-subtitle {
            font-size: 11px;
            line-height: 1.7;
          }

          .self-styled-report .hero-panel {
            padding: 12px 14px;
            border-radius: 16px;
          }

          .self-styled-report .hero-panel-title {
            margin-bottom: 8px;
            font-size: 15px;
          }

          .self-styled-report .hero-row {
            grid-template-columns: 84px minmax(0, 1fr);
            gap: 8px;
            font-size: 10px;
          }

          .self-styled-report .report-shell,
          .self-styled-report .report-body,
          .self-styled-report .summary-strip,
          .self-styled-report .metric-card,
          .self-styled-report .table-card,
          .self-styled-report .empty-state {
            background: inherit;
          }

          .self-styled-report .report-hero,
          .self-styled-report .report-hero * {
            color: #ffffff !important;
          }

          .self-styled-report .hero-row-label {
            color: #dff7f8 !important;
          }

          .self-styled-report .summary-card,
          .self-styled-report .summary-card * {
            color: inherit !important;
          }

          .self-styled-report .summary-value,
          .self-styled-report .metric-value,
          .self-styled-report .section-title,
          .self-styled-report .table-title {
            color: inherit !important;
          }

          .self-styled-report .report-table thead {
            display: table-header-group;
          }

          .self-styled-report .summary-strip {
            padding: 14px 22px;
          }

          .self-styled-report .summary-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 8px;
          }

          .self-styled-report .summary-card {
            padding: 10px 12px;
            border-radius: 14px;
            border-inline-start-width: 4px;
          }

          .self-styled-report .summary-label {
            font-size: 10px;
          }

          .self-styled-report .summary-value {
            margin-top: 5px;
            font-size: 18px;
          }

          .self-styled-report .summary-helper {
            margin-top: 5px;
            font-size: 9px;
            line-height: 1.5;
          }

          .self-styled-report .report-table tr,
          .self-styled-report .table-card,
          .self-styled-report .metric-card,
          .self-styled-report .section-head {
            break-inside: avoid-page;
            page-break-inside: avoid;
          }

          .self-styled-report .report-body {
            padding: 16px 20px 18px;
          }

          .self-styled-report .report-section + .report-section {
            margin-top: 14px;
          }

          .self-styled-report .section-head {
            gap: 12px;
            padding: 12px 14px;
            border-radius: 16px;
          }

          .self-styled-report .section-badge {
            width: 10px;
            height: 38px;
          }

          .self-styled-report .section-title {
            font-size: 17px;
          }

          .self-styled-report .section-description {
            margin-top: 4px;
            font-size: 10px;
            line-height: 1.65;
          }

          .self-styled-report .section-body {
            margin-top: 10px;
          }

          .self-styled-report .metrics-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
            margin-bottom: 10px;
          }

          .self-styled-report .metric-card {
            min-height: 84px;
            padding: 10px 11px;
            border-radius: 14px;
            box-shadow: none;
          }

          .self-styled-report .metric-label {
            font-size: 9px;
            line-height: 1.6;
          }

          .self-styled-report .metric-value {
            margin-top: 5px;
            font-size: 17px;
          }

          .self-styled-report .metric-helper {
            margin-top: 4px;
            font-size: 9px;
          }

          .self-styled-report .tables-grid {
            gap: 10px;
          }

          .self-styled-report .table-card {
            border-radius: 16px;
            box-shadow: none;
          }

          .self-styled-report .table-head {
            padding: 9px 12px;
          }

          .self-styled-report .table-title {
            font-size: 12px;
          }

          .self-styled-report .table-count {
            min-width: 30px;
            padding: 4px 8px;
            font-size: 10px;
          }

          .self-styled-report .report-table thead th {
            padding: 7px 8px;
            font-size: 9px;
            line-height: 1.5;
          }

          .self-styled-report .report-table tbody td {
            padding: 7px 8px;
            font-size: 9.5px;
            line-height: 1.55;
          }

          .self-styled-report .report-table--compact tbody td {
            font-size: 8.8px;
          }

          .self-styled-report .empty-state {
            padding: 16px 12px;
            font-size: 10px;
          }

          .self-styled-report .report-footer {
            margin-top: 14px;
            padding-top: 10px;
            font-size: 9px;
          }
        }
      `}</style>

      <div className="report-shell">
        <header className="report-hero">
          <div className="hero-grid">
            <div>
              <span className="hero-kicker">التقارير الشاملة للعيادة</span>
              <h1 className="hero-title">{reportTitle}</h1>
              <p className="hero-subtitle">{reportSubtitle}</p>
            </div>

            <aside className="hero-panel">
              <h2 className="hero-panel-title">{clinicInfo.name || 'اسم العيادة'}</h2>
              <div className="hero-list">
                <div className="hero-row">
                  <span className="hero-row-label">الفترة</span>
                  <span>{dateRange.startDate} - {dateRange.endDate}</span>
                </div>
                <div className="hero-row">
                  <span className="hero-row-label">تاريخ الإنشاء</span>
                  <span>{generatedAt}</span>
                </div>
                <div className="hero-row">
                  <span className="hero-row-label">العنوان</span>
                  <span>{clinicInfo.address || '-'}</span>
                </div>
                <div className="hero-row">
                  <span className="hero-row-label">الهاتف</span>
                  <span>{clinicInfo.phone || '-'}</span>
                </div>
                <div className="hero-row">
                  <span className="hero-row-label">البريد</span>
                  <span>{clinicInfo.email || '-'}</span>
                </div>
              </div>
            </aside>
          </div>
        </header>

        <div className="summary-strip">
          <div className="summary-grid">
            {highlights.map((metric) => {
              const tone = metric.tone || 'slate';
              return (
                <div key={`${metric.label}-${metric.value}`} className="summary-card" style={toneVariables(tone)}>
                  <p className="summary-label">{metric.label}</p>
                  <p className="summary-value">{metric.value}</p>
                  {metric.helper ? <p className="summary-helper">{metric.helper}</p> : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="report-body">
          {sections.map((section, sectionIndex) => {
            const palette = sectionPalette[resolveAccent(section.accent)];
            return (
              <section
                key={section.title}
                className="report-section"
                style={cssVariables(palette)}
              >
                <div className="section-head">
                  <span className="section-badge" />
                  <div className="section-copy">
                    <h2 className="section-title">{section.title}</h2>
                    {section.description ? <p className="section-description">{section.description}</p> : null}
                  </div>
                </div>

                <div className="section-body">
                  {section.metrics && section.metrics.length > 0 ? (
                    <div className="metrics-grid">
                      {section.metrics.map((metric) => (
                        <div key={`${section.title}-${metric.label}`} className="metric-card">
                          <div className="metric-label">{metric.label}</div>
                          <div className="metric-value">{metric.value}</div>
                          {metric.helper ? <div className="metric-helper">{metric.helper}</div> : null}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="tables-grid">
                    {section.tables?.map((table) => (
                      <article key={`${section.title}-${table.title}`} className="table-card">
                        <div className="table-head">
                          <h3 className="table-title">{table.title}</h3>
                          <span className="table-count">{table.rows.length}</span>
                        </div>

                        {table.rows.length > 0 ? (
                          <div className="table-wrap">
                            <table className={`report-table${table.compact ? ' report-table--compact' : ''}`}>
                              <thead>
                                <tr>
                                  {table.columns.map((column) => (
                                    <th key={column}>{column}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {table.rows.map((row, rowIndex) => (
                                  <tr key={`${table.title}-${rowIndex}`}>
                                    {row.map((cell, cellIndex) => (
                                      <td key={`${table.title}-${rowIndex}-${cellIndex}`}>{cell}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="empty-state">لا توجد بيانات ضمن الفترة المحددة.</div>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}

          <footer className="report-footer">
            <span>تم إعداد هذا التقرير للطباعة الاحترافية مع تقسيم واضح للأقسام والجداول.</span>
            <span>
              <strong>{clinicInfo.name || 'العيادة'}</strong> | {generatedAt}
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default PrintableClinicReport;
