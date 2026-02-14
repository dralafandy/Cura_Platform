import React, { useState, useEffect, useRef } from 'react';
import { Dentist, DoctorPayment, TreatmentRecord, PaymentMethod, Payment } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { ClinicData } from '../../hooks/useClinicData';

interface PrintableDoctorDetailedReportProps {
    doctor: Dentist;
    payments: DoctorPayment[] | Payment[];
    treatmentRecords: TreatmentRecord[];
    clinicData: ClinicData;
    onClose: () => void;
}

const PrintableDoctorDetailedReport: React.FC<PrintableDoctorDetailedReportProps> = ({
    doctor,
    payments,
    treatmentRecords,
    clinicData,
    onClose,
}) => {
    const { t } = useI18n();
    const reportRef = useRef<HTMLDivElement>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    
    const calculateTotalAmount = (payments: DoctorPayment[] | Payment[]) => {
        return payments.reduce((total, payment) => total + payment.amount, 0);
    };
    
    const calculateTotalTreatmentCost = (treatmentRecords: TreatmentRecord[]) => {
        return treatmentRecords.reduce((total, record) => total + record.totalTreatmentCost, 0);
    };
    
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };
    
    const handlePrint = () => {
        setIsPrinting(true);
        window.print();
        setIsPrinting(false);
    };
    
    useEffect(() => {
        const handleAfterPrint = () => {
            if (!isPrinting) {
                onClose();
            }
        };
        
        window.addEventListener('afterprint', handleAfterPrint);
        
        return () => {
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, [isPrinting, onClose]);
    
    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50" ref={reportRef}>
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Print Preview Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{t('doctorDetailedReport.title')}</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            {t('common.print')}
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {t('common.close')}
                        </button>
                    </div>
                </div>
                
                {/* Print Content */}
                <div className="print-content" dir={t('locale') === 'ar' ? 'rtl' : 'ltr'}>
                    <style>{`
                        @media print {
                            @page {
                                size: A4;
                                margin: 1.5cm 1cm 2cm 1cm;
                                @bottom-right {
                                    content: "Page " counter(page) " of " counter(pages);
                                    font-size: 9pt;
                                    color: #666;
                                }
                            }
                            
                            body {
                                counter-reset: page;
                            }
                            
                            .fixed,
                            .no-print {
                                display: none !important;
                            }
                            
                            .bg-white {
                                background: white !important;
                                box-shadow: none !important;
                                max-height: none !important;
                                overflow: visible !important;
                            }
                            
                            .print-content {
                                width: 100%;
                                max-width: 210mm;
                                margin: 0 auto;
                                font-family: 'Segoe UI', Arial, sans-serif;
                                font-size: 12pt;
                                line-height: 1.4;
                                color: #000;
                            }
                            
                            /* Header */
                            .print-header {
                                position: running(header);
                                text-align: center;
                                margin-bottom: 1cm;
                            }
                            
                            .clinic-info {
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 1rem;
                                margin-bottom: 0.5rem;
                            }
                            
                            .clinic-info img {
                                max-width: 80px;
                                max-height: 80px;
                                object-contain;
                            }
                            
                            .clinic-details {
                                text-align: center;
                            }
                            
                            .clinic-details h1 {
                                font-size: 18pt;
                                font-weight: bold;
                                margin: 0 0 0.25rem 0;
                                color: #1f2937;
                            }
                            
                            .clinic-details p {
                                font-size: 10pt;
                                margin: 0.125rem 0;
                                color: #6b7280;
                            }
                            
                            /* Report Title */
                            .report-title {
                                text-align: center;
                                margin: 1.5rem 0 1rem 0;
                                padding-bottom: 0.75rem;
                                border-bottom: 2px solid #3b82f6;
                            }
                            
                            .report-title h2 {
                                font-size: 20pt;
                                font-weight: bold;
                                margin: 0 0 0.5rem 0;
                                color: #1f2937;
                            }
                            
                            .report-meta {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                font-size: 10pt;
                                color: #6b7280;
                                margin-bottom: 0.5rem;
                            }
                            
                            /* Doctor Info */
                            .doctor-info {
                                margin: 1.5rem 0;
                                padding: 1rem;
                                background: #f3f4f6;
                                border-radius: 8px;
                            }
                            
                            .doctor-info h3 {
                                font-size: 14pt;
                                font-weight: bold;
                                margin: 0 0 1rem 0;
                                color: #1f2937;
                                border-bottom: 1px solid #d1d5db;
                                padding-bottom: 0.5rem;
                            }
                            
                            .doctor-details {
                                display: grid;
                                grid-template-columns: repeat(2, 1fr);
                                gap: 1rem;
                            }
                            
                            .detail-item {
                                display: flex;
                                flex-direction: column;
                            }
                            
                            .detail-item .label {
                                font-weight: bold;
                                font-size: 10pt;
                                color: #4b5563;
                                margin-bottom: 0.25rem;
                            }
                            
                            .detail-item .value {
                                font-size: 11pt;
                                color: #111827;
                            }
                            
                            /* Financial Summary */
                            .financial-summary {
                                margin: 1.5rem 0;
                            }
                            
                            .financial-summary h3 {
                                font-size: 14pt;
                                font-weight: bold;
                                margin: 0 0 1rem 0;
                                color: #1f2937;
                                border-bottom: 1px solid #d1d5db;
                                padding-bottom: 0.5rem;
                            }
                            
                            .summary-grid {
                                display: grid;
                                grid-template-columns: repeat(2, 1fr);
                                gap: 1rem;
                            }
                            
                            .summary-card {
                                padding: 1rem;
                                background: #f8fafc;
                                border-radius: 8px;
                                border: 1px solid #e2e8f0;
                            }
                            
                            .summary-card .label {
                                font-size: 10pt;
                                color: #64748b;
                                margin-bottom: 0.25rem;
                            }
                            
                            .summary-card .value {
                                font-size: 16pt;
                                font-weight: bold;
                                color: #059669;
                            }
                            
                            /* Tables */
                            .report-section {
                                margin: 1.5rem 0;
                            }
                            
                            .report-section h3 {
                                font-size: 14pt;
                                font-weight: bold;
                                margin: 0 0 1rem 0;
                                color: #1f2937;
                                border-bottom: 1px solid #d1d5db;
                                padding-bottom: 0.5rem;
                            }
                            
                            .report-table {
                                width: 100%;
                                border-collapse: collapse;
                                margin-bottom: 1rem;
                                font-size: 10pt;
                            }
                            
                            .report-table thead {
                                display: table-header-group;
                            }
                            
                            .report-table thead th {
                                background: #f1f5f9;
                                color: #1e293b;
                                font-weight: bold;
                                padding: 0.5rem;
                                text-align: left;
                                border: 1px solid #e2e8f0;
                                font-size: 9pt;
                            }
                            
                            .report-table tbody tr {
                                page-break-inside: avoid;
                                background: white;
                            }
                            
                            .report-table tbody tr:nth-child(even) {
                                background: #f8fafc;
                            }
                            
                            .report-table tbody td {
                                padding: 0.5rem;
                                border: 1px solid #e2e8f0;
                                color: #334155;
                            }
                            
                            /* Footer */
                            .print-footer {
                                position: running(footer);
                                text-align: center;
                                margin-top: 1cm;
                                padding-top: 0.5cm;
                                border-top: 1px solid #e2e8f0;
                            }
                            
                            .print-footer p {
                                font-size: 8pt;
                                color: #6b7280;
                                margin: 0.25rem 0;
                            }
                            
                            /* RTL Support */
                            [dir="rtl"] {
                                text-align: right;
                            }
                            
                            [dir="rtl"] .report-table thead th {
                                text-align: right;
                            }
                            
                            [dir="rtl"] .report-table tbody td {
                                text-align: right;
                            }
                            
                            [dir="rtl"] .clinic-info {
                                flex-direction: row-reverse;
                            }
                            
                            [dir="rtl"] .report-meta {
                                flex-direction: row-reverse;
                            }
                        }
                    `}</style>
                    
                    {/* Running Header (appears on every page) */}
                    <div className="print-header">
                        <div className="clinic-info">
                            {clinicData.clinicInfo.logo ? (
                                <img 
                                    src={clinicData.clinicInfo.logo} 
                                    alt={clinicData.clinicInfo.name || t('appName')} 
                                    className="clinic-logo"
                                />
                            ) : null}
                            <div className="clinic-details">
                                <h1>{clinicData.clinicInfo.name || t('appName')}</h1>
                                <p>{clinicData.clinicInfo.address}</p>
                                <p>{clinicData.clinicInfo.phone} | {clinicData.clinicInfo.email}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Report Content */}
                    <div className="report-content">
                        {/* Report Title */}
                        <div className="report-title">
                            <h2>{t('doctorDetailedReport.title')}</h2>
                            <div className="report-meta">
                                <span>{t('doctorDetailedReport.generatedOn')}: {new Date().toLocaleString()}</span>
                                <span>{t('doctorDetailedReport.reportId')}: DR-{Date.now()}</span>
                            </div>
                        </div>
                        
                        {/* Doctor Information */}
                        <div className="doctor-info">
                            <h3>{t('doctorDetailedReport.doctorInfo')}</h3>
                            <div className="doctor-details">
                                <div className="detail-item">
                                    <span className="label">{t('doctors.name')}:</span>
                                    <span className="value">{doctor.name}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">{t('doctorDetails.specialty')}:</span>
                                    <span className="value">{doctor.specialty}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">{t('id')}:</span>
                                    <span className="value">{doctor.id}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">{t('doctorDetails.colorTag')}:</span>
                                    <span className="value">
                                        <span className="inline-block w-4 h-4 rounded-full mr-2" style={{ backgroundColor: doctor.color }}></span>
                                        {doctor.color}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Financial Summary */}
                        <div className="financial-summary">
                            <h3>{t('doctorDetails.financialSummary')}</h3>
                            <div className="summary-grid">
                                <div className="summary-card">
                                    <span className="label">{t('financialSummary.totalPayments')}:</span>
                                    <span className="value">{calculateTotalAmount(payments).toFixed(2)} USD</span>
                                </div>
                                <div className="summary-card">
                                    <span className="label">{t('doctorDetailedReport.totalEarnings')}:</span>
                                    <span className="value">{calculateTotalTreatmentCost(treatmentRecords).toFixed(2)} USD</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Payments Detail */}
                        <div className="report-section">
                            <h3>{t('doctorDetailedReport.paymentsDetail')}</h3>
                            <div className="overflow-x-auto">
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>{t('header.date')}</th>
                                            <th>{t('invoices.amount')}</th>
                                            <th>{t('addPaymentModal.notes')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {payments.map((payment) => (
                                            <tr key={payment.id}>
                                                <td>{formatDate(payment.date)}</td>
                                                <td>{payment.amount.toFixed(2)} USD</td>
                                                <td>{payment.notes || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        {/* Treatments Detail */}
                        <div className="report-section">
                            <h3>{t('doctorDetailedReport.treatmentsDetail')}</h3>
                            <div className="overflow-x-auto">
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>{t('header.date')}</th>
                                            <th>{t('patientId')}</th>
                                            <th>{t('treatmentDefinitionId')}</th>
                                            <th>{t('patientReport.treatmentHistory.cost')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {treatmentRecords.map((record) => (
                                            <tr key={record.id}>
                                                <td>{formatDate(record.treatmentDate)}</td>
                                                <td>{record.patientId}</td>
                                                <td>{record.treatmentDefinitionId}</td>
                                                <td>{record.totalTreatmentCost.toFixed(2)} USD</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    {/* Running Footer (appears on every page) */}
                    <div className="print-footer">
                        <p>{t('reports.generatedOn')} {new Date().toLocaleString()}</p>
                        <p>{t('reports.pageFooter')}</p>
                        <p className="text-xs text-gray-400 mt-1">{t('reports.confidential')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintableDoctorDetailedReport;
