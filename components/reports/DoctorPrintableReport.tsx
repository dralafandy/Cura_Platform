import React, { useMemo, useRef, useState } from 'react';
import {
  Appointment,
  Dentist,
  DoctorPayment,
  Patient,
  TreatmentDefinition,
  TreatmentRecord,
} from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { CloseIcon, PrintIcon } from '../icons';

interface DoctorPrintableReportProps {
  doctor: Dentist;
  dateRangeLabel: string;
  treatmentRecords: TreatmentRecord[];
  payments: DoctorPayment[];
  appointments: Appointment[];
  patients: Patient[];
  treatmentDefinitions: TreatmentDefinition[];
  onClose: () => void;
}

const DoctorPrintableReport: React.FC<DoctorPrintableReportProps> = ({
  doctor,
  dateRangeLabel,
  treatmentRecords,
  payments,
  appointments,
  patients,
  treatmentDefinitions,
  onClose,
}) => {
  const { t, locale } = useI18n();
  const reportContentRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const isArabic = locale === 'ar';

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }),
    [locale]
  );

  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [locale]
  );

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP' }),
    [locale]
  );

  const getPatientName = (patientId: string) =>
    patients.find((p) => p.id === patientId)?.name || (t('common.unknownPatient') || 'Unknown Patient');

  const getTreatmentName = (treatmentDefinitionId: string) =>
    treatmentDefinitions.find((td) => td.id === treatmentDefinitionId)?.name ||
    (t('common.unknownTreatment') || 'Unknown Treatment');

  const treatmentRows = useMemo(
    () =>
      [...treatmentRecords].sort(
        (a, b) => new Date(b.treatmentDate).getTime() - new Date(a.treatmentDate).getTime()
      ),
    [treatmentRecords]
  );

  const paymentRows = useMemo(
    () => [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [payments]
  );

  const appointmentRows = useMemo(
    () =>
      [...appointments].sort((a, b) => {
        const aTime = a.startTime instanceof Date ? a.startTime.getTime() : new Date(a.startTime).getTime();
        const bTime = b.startTime instanceof Date ? b.startTime.getTime() : new Date(b.startTime).getTime();
        return bTime - aTime;
      }),
    [appointments]
  );

  const todayAppointments = useMemo(() => {
    const now = new Date();
    return appointmentRows.filter((a) => {
      const d = a.startTime instanceof Date ? a.startTime : new Date(a.startTime);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    });
  }, [appointmentRows]);

  const totals = useMemo(() => {
    const doctorShare = treatmentRows.reduce((sum, tr) => sum + tr.doctorShare, 0);
    const clinicShare = treatmentRows.reduce((sum, tr) => sum + tr.clinicShare, 0);
    const paid = paymentRows.reduce((sum, p) => sum + p.amount, 0);
    return {
      doctorShare,
      clinicShare,
      paid,
      balance: doctorShare - paid,
    };
  }, [treatmentRows, paymentRows]);

  const appointmentSummary = useMemo(() => {
    return appointmentRows.reduce(
      (acc, a) => {
        const key = String(a.status || '').toUpperCase();
        if (key === 'SCHEDULED') acc.scheduled += 1;
        if (key === 'CONFIRMED') acc.confirmed += 1;
        if (key === 'COMPLETED') acc.completed += 1;
        if (key === 'CANCELLED') acc.cancelled += 1;
        return acc;
      },
      { scheduled: 0, confirmed: 0, completed: 0, cancelled: 0 }
    );
  }, [appointmentRows]);

  const getStatusBadgeClass = (status: string) => {
    const key = String(status || '').toUpperCase();
    if (key === 'SCHEDULED') return 'status-badge status-scheduled';
    if (key === 'CONFIRMED') return 'status-badge status-confirmed';
    if (key === 'COMPLETED') return 'status-badge status-completed';
    if (key === 'CANCELLED') return 'status-badge status-cancelled';
    return 'status-badge status-default';
  };

  const reportStyles = `
    body {
      margin: 0;
      font-family: var(--report-print-font, "Segoe UI", Tahoma, Arial, sans-serif);
      color: #0f172a;
      background: #fff;
    }
    .doctor-report-sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 14mm 12mm 18mm 12mm;
      color: #0f172a;
      box-sizing: border-box;
    }
    .report-head {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .report-title {
      font-size: 22px;
      font-weight: 800;
      line-height: 1.15;
      margin: 0;
      color: #0f172a;
    }
    .report-sub {
      margin-top: 4px;
      font-size: 12px;
      color: #334155;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      margin-top: 10px;
    }
    .meta-item {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 6px 8px;
      background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
    }
    .meta-label {
      font-size: 10px;
      color: #475569;
    }
    .meta-value {
      margin-top: 2px;
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .section {
      margin-top: 12px;
    }
    .section-title {
      margin: 0 0 6px 0;
      padding-inline-start: 8px;
      border-inline-start: 4px solid #0f172a;
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }
    .section-title.today { border-inline-start-color: #2563eb; }
    .section-title.treatments { border-inline-start-color: #7c3aed; }
    .section-title.payments { border-inline-start-color: #059669; }
    .section-title.appointments { border-inline-start-color: #ea580c; }
    .section-title.summary { border-inline-start-color: #0f172a; }
    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      color: #0f172a;
    }
    .report-table th,
    .report-table td {
      border: 1px solid #94a3b8;
      padding: 6px 7px;
      text-align: start;
      vertical-align: top;
    }
    .report-table th {
      background: #e2e8f0;
      font-weight: 800;
      white-space: nowrap;
    }
    .report-table tbody tr:nth-child(even) { background: #f8fafc; }
    .table-today th { background: #dbeafe; border-color: #93c5fd; }
    .table-treatments th { background: #ede9fe; border-color: #c4b5fd; }
    .table-payments th { background: #d1fae5; border-color: #86efac; }
    .table-appointments th { background: #ffedd5; border-color: #fdba74; }
    .table-summary th { background: #e2e8f0; border-color: #cbd5e1; }
    .report-table tfoot td { background: #e2e8f0; font-weight: 800; }
    .num { text-align: end; white-space: nowrap; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 8px;
    }
    .summary-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px;
      background: #f8fafc;
    }
    .summary-card.kpi-1 { background: linear-gradient(135deg, #eef2ff 0%, #dbeafe 100%); border-color: #bfdbfe; }
    .summary-card.kpi-2 { background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-color: #c4b5fd; }
    .summary-card.kpi-3 { background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%); border-color: #a5f3fc; }
    .summary-card.kpi-4 { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-color: #86efac; }
    .summary-card.kpi-5 { background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-color: #fdba74; }
    .summary-label { font-size: 10px; color: #475569; }
    .summary-value { margin-top: 2px; font-size: 13px; font-weight: 800; color: #0f172a; }
    .mini-cards {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      margin-top: 8px;
    }
    .mini-card {
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 7px 8px;
      background: #ffffff;
    }
    .mini-card .mini-label { font-size: 10px; color: #475569; }
    .mini-card .mini-value { margin-top: 2px; font-size: 12px; font-weight: 800; color: #0f172a; }
    .report-footer { margin-top: 10px; font-size: 10px; text-align: center; color: #64748b; }
    .status-badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      line-height: 1.2;
      border: 1px solid transparent;
    }
    .status-scheduled { background: #dbeafe; color: #1e3a8a; border-color: #93c5fd; }
    .status-confirmed { background: #ccfbf1; color: #115e59; border-color: #5eead4; }
    .status-completed { background: #dcfce7; color: #166534; border-color: #86efac; }
    .status-cancelled { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }
    .status-default { background: #e2e8f0; color: #334155; border-color: #cbd5e1; }
    @media print {
      @page { size: A4; margin: 14mm 12mm 16mm 12mm; }
      .doctor-report-sheet {
        width: auto;
        min-height: auto;
        padding: 0;
      }
      .report-table thead { display: table-header-group; }
      .report-table tfoot { display: table-footer-group; }
      .report-table tr { page-break-inside: avoid; break-inside: avoid; }
    }
  `;

  const collectHeadStyles = () => {
    return Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('\n');
  };

  const buildPrintHtml = (html: string, fontFamily: string) => {
    const inheritedHeadStyles = collectHeadStyles();
    return `
      <!doctype html>
      <html lang="${isArabic ? 'ar' : 'en'}" dir="${isArabic ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${t('doctorDetailedReport.title') || 'Doctor Detailed Report'}</title>
        ${inheritedHeadStyles}
        <style>
          :root { --report-print-font: ${fontFamily}; }
          ${reportStyles}
        </style>
      </head>
      <body>
        <article class="doctor-report-sheet">${html}</article>
      </body>
      </html>
    `;
  };

  const printViaNewWindow = (html: string, fontFamily: string) => {
    const printWindow = window.open('', '_blank', 'width=1100,height=900');
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(buildPrintHtml(html, fontFamily));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
        setIsPrinting(false);
      };
      setTimeout(() => setIsPrinting(false), 3000);
    }, 350);
  };

  const handlePrint = () => {
    if (isPrinting) return;
    if (!reportContentRef.current) return;
    setIsPrinting(true);

    const html = reportContentRef.current.innerHTML;
    const computed = window.getComputedStyle(reportContentRef.current);
    const fontFamily = computed.fontFamily || '"Segoe UI", Tahoma, Arial, sans-serif';
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentWindow?.document;
      const frameWin = iframe.contentWindow;
      if (!frameDoc || !frameWin) {
        document.body.removeChild(iframe);
        printViaNewWindow(html, fontFamily);
        return;
      }

      frameDoc.open();
      frameDoc.write(buildPrintHtml(html, fontFamily));
      frameDoc.close();

      setTimeout(() => {
        frameWin.focus();
        frameWin.print();
        const cleanup = () => {
          try {
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
          } catch {}
          setIsPrinting(false);
        };
        frameWin.onafterprint = cleanup;
        setTimeout(cleanup, 3500);
      }, 350);
    } catch {
      printViaNewWindow(html, fontFamily);
    }
  };

  return (
    <div className="doctor-report-overlay fixed inset-0 z-[90] overflow-auto bg-slate-900/55 print:bg-white">
      <style>{`
        .doctor-report-overlay {
          color: #0f172a;
        }
        .doctor-report-toolbar {
          position: sticky;
          top: 0;
          z-index: 5;
          backdrop-filter: blur(6px);
          background: rgba(255, 255, 255, 0.94);
          border-bottom: 1px solid #e2e8f0;
        }
        .doctor-report-sheet {
          width: 210mm;
          min-height: 297mm;
          margin: 12px auto 24px auto;
          background: #ffffff;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18);
          border-radius: 14px;
          padding: 14mm 12mm 18mm 12mm;
          color: #0f172a;
        }
        .report-head {
          border-bottom: 2px solid #0f172a;
          padding-bottom: 8px;
          margin-bottom: 10px;
        }
        .report-title {
          font-size: 22px;
          font-weight: 800;
          line-height: 1.15;
          margin: 0;
          color: #0f172a;
        }
        .report-sub {
          margin-top: 4px;
          font-size: 12px;
          color: #334155;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          margin-top: 10px;
        }
        .meta-item {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 6px 8px;
          background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
        }
        .meta-label {
          font-size: 10px;
          color: #475569;
        }
        .meta-value {
          margin-top: 2px;
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
        }
        .section {
          margin-top: 12px;
        }
        .section-title {
          margin: 0 0 6px 0;
          padding-inline-start: 8px;
          border-inline-start: 4px solid #0f172a;
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
        }
        .section-title.today {
          border-inline-start-color: #2563eb;
        }
        .section-title.treatments {
          border-inline-start-color: #7c3aed;
        }
        .section-title.payments {
          border-inline-start-color: #059669;
        }
        .section-title.appointments {
          border-inline-start-color: #ea580c;
        }
        .section-title.summary {
          border-inline-start-color: #0f172a;
        }
        .report-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5px;
          color: #0f172a;
        }
        .report-table th,
        .report-table td {
          border: 1px solid #94a3b8;
          padding: 6px 7px;
          text-align: start;
          vertical-align: top;
        }
        .report-table th {
          background: #e2e8f0;
          font-weight: 800;
          white-space: nowrap;
        }
        .report-table tbody tr:nth-child(even) {
          background: #f8fafc;
        }
        .table-today th {
          background: #dbeafe;
          border-color: #93c5fd;
        }
        .table-treatments th {
          background: #ede9fe;
          border-color: #c4b5fd;
        }
        .table-payments th {
          background: #d1fae5;
          border-color: #86efac;
        }
        .table-appointments th {
          background: #ffedd5;
          border-color: #fdba74;
        }
        .table-summary th {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }
        .report-table tfoot td {
          background: #e2e8f0;
          font-weight: 800;
        }
        .num {
          text-align: end;
          white-space: nowrap;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
        }
        .summary-card {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 8px;
          background: #f8fafc;
        }
        .summary-card.kpi-1 { background: linear-gradient(135deg, #eef2ff 0%, #dbeafe 100%); border-color: #bfdbfe; }
        .summary-card.kpi-2 { background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-color: #c4b5fd; }
        .summary-card.kpi-3 { background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%); border-color: #a5f3fc; }
        .summary-card.kpi-4 { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-color: #86efac; }
        .summary-card.kpi-5 { background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-color: #fdba74; }
        .summary-label {
          font-size: 10px;
          color: #475569;
        }
        .summary-value {
          margin-top: 2px;
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
        }
        .mini-cards {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-top: 8px;
        }
        .mini-card {
          border: 1px dashed #cbd5e1;
          border-radius: 8px;
          padding: 7px 8px;
          background: #ffffff;
        }
        .mini-card .mini-label {
          font-size: 10px;
          color: #475569;
        }
        .mini-card .mini-value {
          margin-top: 2px;
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
        }
        .report-footer {
          margin-top: 10px;
          font-size: 10px;
          text-align: center;
          color: #64748b;
        }
        .status-badge {
          display: inline-block;
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          line-height: 1.2;
          border: 1px solid transparent;
        }
        .status-scheduled { background: #dbeafe; color: #1e3a8a; border-color: #93c5fd; }
        .status-confirmed { background: #ccfbf1; color: #115e59; border-color: #5eead4; }
        .status-completed { background: #dcfce7; color: #166534; border-color: #86efac; }
        .status-cancelled { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }
        .status-default { background: #e2e8f0; color: #334155; border-color: #cbd5e1; }
        @media print {
          .doctor-report-overlay {
            display: none !important;
          }
        }
      `}</style>

      <div className="doctor-report-toolbar print:hidden">
        <div className="max-w-6xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
          <h2 className="text-sm md:text-base font-semibold text-slate-800">
            {t('doctorDetailedReport.title') || 'Doctor Detailed Report'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <PrintIcon className="h-4 w-4" />
              <span className="text-sm">
                {isPrinting ? (t('common.loading') || 'Preparing...') : (t('common.print') || 'Print')}
              </span>
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <CloseIcon className="h-4 w-4" />
              <span className="text-sm">{t('common.close') || 'Close'}</span>
            </button>
          </div>
        </div>
      </div>

      <article className="doctor-report-sheet" dir={isArabic ? 'rtl' : 'ltr'} ref={reportContentRef}>
        <header className="report-head">
          <h1 className="report-title">{t('doctorDetailedReport.title') || 'Doctor Detailed Report'}</h1>
          <div className="report-sub">{t('reports.generatedOn') || 'Generated on'}: {dateTimeFormatter.format(new Date())}</div>

          <div className="meta-grid">
            <div className="meta-item">
              <div className="meta-label">{t('doctorDetailedReport.name') || 'Doctor'}</div>
              <div className="meta-value">{doctor.name}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">{t('doctorDetailedReport.specialty') || 'Specialty'}</div>
              <div className="meta-value">{doctor.specialty || '-'}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">{t('doctorDetailedReport.id') || 'Doctor ID'}</div>
              <div className="meta-value">{doctor.id}</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">{t('reports.dateRange') || 'Date Range'}</div>
              <div className="meta-value">{dateRangeLabel}</div>
            </div>
          </div>
        </header>

        <section className="section">
          <div className="summary-grid">
            <div className="summary-card kpi-1">
              <div className="summary-label">{t('doctorDetailedReport.treatments') || 'Treatments'}</div>
              <div className="summary-value">{treatmentRows.length}</div>
            </div>
            <div className="summary-card kpi-2">
              <div className="summary-label">{t('doctorDetailedReport.appointments') || 'Appointments'}</div>
              <div className="summary-value">{appointmentRows.length}</div>
            </div>
            <div className="summary-card kpi-3">
              <div className="summary-label">{t('doctorDetailedReport.totalEarnings') || 'Total Earnings'}</div>
              <div className="summary-value">{currencyFormatter.format(totals.doctorShare)}</div>
            </div>
            <div className="summary-card kpi-4">
              <div className="summary-label">{t('doctorDetailedReport.paymentsReceived') || 'Payments Received'}</div>
              <div className="summary-value">{currencyFormatter.format(totals.paid)}</div>
            </div>
            <div className="summary-card kpi-5">
              <div className="summary-label">{t('doctorDetailedReport.netBalance') || 'Net Balance'}</div>
              <div className="summary-value">{currencyFormatter.format(totals.balance)}</div>
            </div>
          </div>
          <div className="mini-cards">
            <div className="mini-card">
              <div className="mini-label">{t('dashboard.todaysSchedule') || "Today's Schedule"}</div>
              <div className="mini-value">{todayAppointments.length}</div>
            </div>
            <div className="mini-card">
              <div className="mini-label">{t('reports.paymentRatio') || 'Payment Ratio'}</div>
              <div className="mini-value">
                {totals.doctorShare > 0 ? `${((totals.paid / totals.doctorShare) * 100).toFixed(1)}%` : '0%'}
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title today">{t('dashboard.todaysSchedule') || "Today's Schedule"}</h2>
          <table className="report-table table-today">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('patients.name') || 'Patient'}</th>
                <th>{t('common.date') || 'Date & Time'}</th>
                <th>{t('common.status') || 'Status'}</th>
                <th>{t('common.notes') || 'Reason'}</th>
              </tr>
            </thead>
            <tbody>
              {todayAppointments.length > 0 ? (
                todayAppointments.map((a, i) => (
                  <tr key={a.id}>
                    <td>{i + 1}</td>
                    <td>{getPatientName(a.patientId)}</td>
                    <td>{dateTimeFormatter.format(a.startTime instanceof Date ? a.startTime : new Date(a.startTime))}</td>
                    <td><span className={getStatusBadgeClass(String(a.status))}>{String(a.status)}</span></td>
                    <td>{a.reason || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>{t('dashboard.noAppointmentsToday') || 'No appointments today'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="section">
          <h2 className="section-title treatments">{t('doctorDetailedReport.treatmentRecords') || 'Treatment Records'}</h2>
          <table className="report-table table-treatments">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('patients.name') || 'Patient'}</th>
                <th>{t('treatments.treatment') || 'Treatment'}</th>
                <th>{t('treatments.date') || 'Date'}</th>
                <th>{t('doctorDetailedReport.doctorShare') || 'Doctor Share'}</th>
                <th>{t('doctorDetailedReport.clinicShare') || 'Clinic Share'}</th>
              </tr>
            </thead>
            <tbody>
              {treatmentRows.length > 0 ? (
                treatmentRows.map((tr, i) => (
                  <tr key={tr.id}>
                    <td>{i + 1}</td>
                    <td>{getPatientName(tr.patientId)}</td>
                    <td>{getTreatmentName(tr.treatmentDefinitionId)}</td>
                    <td>{dateFormatter.format(new Date(tr.treatmentDate))}</td>
                    <td className="num">{currencyFormatter.format(tr.doctorShare)}</td>
                    <td className="num">{currencyFormatter.format(tr.clinicShare)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>{t('doctorDetailedReport.noTreatments') || 'No treatment records found'}</td>
                </tr>
              )}
            </tbody>
            {treatmentRows.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={4}>{t('common.total') || 'Total'}</td>
                  <td className="num">{currencyFormatter.format(totals.doctorShare)}</td>
                  <td className="num">{currencyFormatter.format(totals.clinicShare)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </section>

        <section className="section">
          <h2 className="section-title payments">{t('doctorDetailedReport.paymentHistory') || 'Payment History'}</h2>
          <table className="report-table table-payments">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('common.date') || 'Date'}</th>
                <th>{t('common.amount') || 'Amount'}</th>
                <th>{t('common.notes') || 'Notes'}</th>
              </tr>
            </thead>
            <tbody>
              {paymentRows.length > 0 ? (
                paymentRows.map((p, i) => (
                  <tr key={p.id}>
                    <td>{i + 1}</td>
                    <td>{dateFormatter.format(new Date(p.date))}</td>
                    <td className="num">{currencyFormatter.format(p.amount)}</td>
                    <td>{p.notes || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>{t('doctorDetailedReport.noPayments') || 'No payments recorded'}</td>
                </tr>
              )}
            </tbody>
            {paymentRows.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={2}>{t('common.total') || 'Total'}</td>
                  <td className="num">{currencyFormatter.format(totals.paid)}</td>
                  <td>-</td>
                </tr>
              </tfoot>
            )}
          </table>
        </section>

        <section className="section">
          <h2 className="section-title appointments">{t('doctorDetailedReport.appointments') || 'Appointments'}</h2>
          <table className="report-table table-appointments">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('patients.name') || 'Patient'}</th>
                <th>{t('common.date') || 'Date & Time'}</th>
                <th>{t('common.status') || 'Status'}</th>
                <th>{t('common.notes') || 'Reason'}</th>
              </tr>
            </thead>
            <tbody>
              {appointmentRows.length > 0 ? (
                appointmentRows.map((a, i) => (
                  <tr key={a.id}>
                    <td>{i + 1}</td>
                    <td>{getPatientName(a.patientId)}</td>
                    <td>{dateTimeFormatter.format(a.startTime instanceof Date ? a.startTime : new Date(a.startTime))}</td>
                    <td><span className={getStatusBadgeClass(String(a.status))}>{String(a.status)}</span></td>
                    <td>{a.reason || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>{t('doctorDetailedReport.noAppointments') || 'No appointments found'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="section">
          <h2 className="section-title summary">{t('reports.summary') || 'Appointments Summary'}</h2>
          <table className="report-table table-summary">
            <thead>
              <tr>
                <th>{t('common.status') || 'Status'}</th>
                <th>{t('common.total') || 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>SCHEDULED</td>
                <td className="num">{appointmentSummary.scheduled}</td>
              </tr>
              <tr>
                <td>CONFIRMED</td>
                <td className="num">{appointmentSummary.confirmed}</td>
              </tr>
              <tr>
                <td>COMPLETED</td>
                <td className="num">{appointmentSummary.completed}</td>
              </tr>
              <tr>
                <td>CANCELLED</td>
                <td className="num">{appointmentSummary.cancelled}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <footer className="report-footer">{t('common.fullReport') || 'Full Report'}</footer>
      </article>
    </div>
  );
};

export default DoctorPrintableReport;
