import React from 'react';
import { Prescription, PrescriptionItem, Patient, Dentist } from '../../types';
import { useI18n } from '../../hooks/useI18n';

const PrintStyles = () => (
  <style>{`
    @media print {
      @page {
        size: A4;
        margin: 1.5cm;
      }
      body {
        font-size: 11pt;
        line-height: 1.5;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      .print-prescription {
        max-width: 100%;
      }
      .print-header {
        margin-bottom: 1rem;
        page-break-after: avoid;
        border-bottom: 2px solid #1e40af;
        padding-bottom: 0.75rem;
      }
      .print-section {
        margin-bottom: 0.75rem;
        page-break-inside: avoid;
      }
      .medications-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10pt;
        margin-top: 0.5rem;
      }
      .medications-table th {
        background-color: #1e40af !important;
        color: white !important;
        padding: 8px 6px;
        text-align: right;
        font-weight: 600;
        border: 1px solid #1e40af;
      }
      .medications-table td {
        padding: 8px 6px;
        border: 1px solid #d1d5db;
        vertical-align: top;
      }
      .medications-table tr:nth-child(even) {
        background-color: #f8fafc;
      }
      .medications-table tr {
        page-break-inside: avoid;
      }
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .info-box {
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 0.75rem;
        background-color: #fafafa;
      }
      .info-label {
        font-size: 9pt;
        color: #6b7280;
        margin-bottom: 2px;
      }
      .info-value {
        font-weight: 600;
        color: #111827;
      }
      .prescription-title {
        font-size: 16pt;
        font-weight: 700;
        color: #1e40af;
        text-align: center;
        margin-bottom: 0.5rem;
      }
      .prescription-number {
        text-align: center;
        font-size: 10pt;
        color: #6b7280;
        margin-bottom: 1rem;
      }
      .footer-section {
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
        page-break-inside: avoid;
      }
      .signature-area {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-top: 1.5rem;
      }
      .signature-box {
        text-align: center;
      }
      .signature-line {
        border-top: 1px solid #374151;
        margin-top: 2rem;
        padding-top: 0.5rem;
        width: 80%;
        margin-left: auto;
        margin-right: auto;
      }
      .notes-box {
        border: 1px solid #f59e0b;
        background-color: #fffbeb;
        border-radius: 6px;
        padding: 0.75rem;
        margin-top: 1rem;
      }
      .notes-label {
        font-weight: 600;
        color: #92400e;
        font-size: 9pt;
        margin-bottom: 4px;
      }
      .notes-content {
        color: #78350f;
        font-size: 10pt;
      }
      .clinic-header {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .clinic-logo {
        width: 60px;
        height: 60px;
        object-fit: contain;
      }
      .clinic-info h1 {
        font-size: 14pt;
        margin: 0;
        color: #1e40af;
      }
      .clinic-info p {
        font-size: 9pt;
        margin: 2px 0;
        color: #4b5563;
      }
      h1 { font-size: 16pt; }
      h2 { font-size: 13pt; }
      h3 { font-size: 11pt; }
    }
  `}</style>
);


interface PrintablePrescriptionProps {
  prescription: Prescription;
  patient: Patient;
  prescriptionItems: PrescriptionItem[];
  dentist: Dentist;
  clinicInfo: any;
}

const PrintablePrescription: React.FC<PrintablePrescriptionProps> = ({
  prescription,
  patient,
  prescriptionItems,
  dentist,
  clinicInfo
}) => {
  const { t, locale } = useI18n();

  const dateFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });

  // Medication table columns configuration
  const tableColumns = [
    { key: 'index', label: '#', width: '5%' },
    { key: 'medication', label: t('prescriptionPrint.medication') || 'الدواء', width: '25%' },
    { key: 'dosage', label: t('prescriptionPrint.dosage') || 'الجرعة', width: '20%' },
    { key: 'quantity', label: t('prescriptionPrint.quantity') || 'الكمية', width: '10%' },
    { key: 'instructions', label: t('prescriptionPrint.instructions') || 'تعليمات الاستخدام', width: '40%' },
  ];


  return (
    <>
      <PrintStyles />
      <div className="print-prescription p-6 bg-white text-slate-900 min-h-screen" dir="rtl">
        {/* Professional Header */}
        <header className="print-header">
          <div className="clinic-header">
            {clinicInfo.logo ? (
              <img 
                src={clinicInfo.logo} 
                alt="شعار العيادة" 
                className="clinic-logo"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
            )}
            <div className="clinic-info flex-1">
              <h1>{clinicInfo.name || t('appName')}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 mt-1">
                {clinicInfo.address && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {clinicInfo.address}
                  </span>
                )}
                {clinicInfo.phone && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {clinicInfo.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Prescription Title */}
        <div className="prescription-title">
          {t('prescriptionDetails.title')}
        </div>
        <div className="prescription-number">
          {t('prescriptionDetails.prescriptionId')}: {prescription.id.slice(-8).toUpperCase()}
        </div>


        <main>
          <div className="print-section">
            {/* Patient and Prescription Info - Compact Grid Layout */}
            <div className="info-grid">
              <div className="info-box">
                <div className="info-label">{t('prescriptionDetails.patientName')}</div>
                <div className="info-value">{patient.name}</div>
                <div className="mt-2 text-sm text-slate-600">
                  <span className="info-label">{t('prescriptionDetails.patientPhone')}: </span>
                  {patient.phone}
                </div>
              </div>
              
              <div className="info-box">
                <div className="info-label">{t('prescriptionDetails.dentist')}</div>
                <div className="info-value">{dentist?.name || t('common.unknownDentist')}</div>
                <div className="mt-2 text-sm text-slate-600">
                  <span className="info-label">{t('prescriptionDetails.date')}: </span>
                  {dateFormatter.format(new Date(prescription.prescriptionDate))}
                </div>
              </div>
            </div>


            {/* Notes */}
            {prescription.notes && (
              <div className="notes-box">
                <div className="notes-label">{t('prescriptionDetails.notes')}</div>
                <div className="notes-content whitespace-pre-wrap">{prescription.notes}</div>
              </div>
            )}

            {/* Medications - Professional Table Layout */}
            <div className="print-section mt-6">
              <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                {t('prescriptionDetails.medications')}
              </h3>

              {prescriptionItems.length === 0 ? (
                <p className="text-center text-slate-500 py-4 bg-slate-50 rounded-lg border border-slate-200">
                  {t('prescriptionDetails.noMedications')}
                </p>
              ) : (
                <table className="medications-table">
                  <thead>
                    <tr>
                      <th style={{ width: tableColumns[0].width }}>#</th>
                      <th style={{ width: tableColumns[1].width }}>{tableColumns[1].label}</th>
                      <th style={{ width: tableColumns[2].width }}>{tableColumns[2].label}</th>
                      <th style={{ width: tableColumns[3].width }}>{tableColumns[3].label}</th>
                      <th style={{ width: tableColumns[4].width }}>{tableColumns[4].label}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptionItems.map((item, index) => (
                      <tr key={item.id}>
                        <td className="text-center font-medium text-slate-600">{index + 1}</td>
                        <td className="font-semibold text-slate-800">{item.medicationName}</td>
                        <td className="text-slate-700">{item.dosage || '-'}</td>
                        <td className="text-center font-medium text-slate-700">{item.quantity}</td>
                        <td className="text-slate-700">{item.instructions || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer with Signature Area */}
            <div className="footer-section">
              <div className="text-center text-sm text-slate-500 mb-4">
                {t('prescriptionDetails.footerNote') || 'يرجى اتباع تعليمات الاستخدام بدقة. للاستفسارات، يرجى التواصل مع العيادة.'}
              </div>
              
              <div className="signature-area">
                <div className="signature-box">
                  <div className="signature-line">
                    {t('prescriptionPrint.doctorSignature') || 'توقيع الطبيب'}
                  </div>
                  <div className="text-sm text-slate-600 mt-1">
                    {dentist?.name || t('common.unknownDentist')}
                  </div>
                </div>
                <div className="signature-box">
                  <div className="signature-line">
                    {t('prescriptionPrint.clinicStamp') || 'ختم العيادة'}
                  </div>
                  <div className="text-sm text-slate-600 mt-1">
                    {clinicInfo.name || t('appName')}
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-slate-400 mt-6 pt-4 border-t border-slate-200">
                {t('reports.generatedOn')} {new Date().toLocaleString(locale)}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>

  );
};

export default PrintablePrescription;
