import { ReportData } from '../components/reports/ReportTypes';

const mockFinancialData = {
  id: '1',
  title: 'التقرير المالي للشهر الحالي',
  revenue: 50000,
  expenses: 20000,
  profit: 30000,
  dateRange: { start: new Date('2023-01-01'), end: new Date('2023-01-31') },
};

const mockPatientData = {
  id: '1',
  title: 'تقرير المرضى للشهر الحالي',
  totalPatients: 150,
  newPatients: 30,
  ageGroups: [
    { group: '0-18', count: 20 },
    { group: '19-35', count: 50 },
    { group: '36-50', count: 40 },
    { group: '51+', count: 40 },
  ],
  newPatientsTrend: [
    { month: 'يناير', count: 25 },
    { month: 'فبراير', count: 20 },
    { month: 'مارس', count: 35 },
    { month: 'أبريل', count: 30 },
    { month: 'مايو', count: 28 },
    { month: 'يونيو', count: 30 },
  ],
  dateRange: { start: new Date('2023-01-01'), end: new Date('2023-01-31') },
};

export const fetchMockReportData = (startDate?: string, endDate?: string): Promise<ReportData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        financial: mockFinancialData,
        patient: mockPatientData,
      });
    }, 1000);
  });
};