import React, { useMemo, useState } from 'react';
import { useClinicData } from '../../hooks/useClinicData';
import PrintableClinicReport, {
  type PrintableMetric,
  type PrintableSection,
} from './PrintableClinicReport';
import { openPrintWindow } from '../../utils/print';

interface ClinicReportPageProps {
  isPrintWindow?: boolean;
  initialDateRange?: {
    startDate: string;
    endDate: string;
  };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const formatNumber = (value: number) =>
  new Intl.NumberFormat('ar-EG').format(Number.isFinite(value) ? value : 0);

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const safeRows = (rows: string[][], limit = 10) => rows.slice(0, limit);

const ComprehensiveClinicReportPage: React.FC<ClinicReportPageProps> = ({
  isPrintWindow = false,
  initialDateRange,
}) => {
  const clinicData = useClinicData();
  const [dateRange, setDateRange] = useState({
    startDate: initialDateRange?.startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: initialDateRange?.endDate || new Date().toISOString().split('T')[0],
  });

  const reportModel = useMemo(() => {
    const {
      clinicInfo,
      patients,
      dentists,
      appointments,
      suppliers,
      inventoryItems,
      expenses,
      treatmentDefinitions,
      treatmentRecords,
      labCases,
      payments,
      supplierInvoices,
      doctorPayments,
      prescriptions,
      prescriptionItems,
      attachments,
    } = clinicData;

    const start = new Date(`${dateRange.startDate}T00:00:00`);
    const end = new Date(`${dateRange.endDate}T23:59:59`);

    const isWithinRange = (value?: string | Date | null) => {
      if (!value) return false;
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return false;
      return date >= start && date <= end;
    };

    const filteredPayments = payments.filter((item) => isWithinRange(item.date));
    const filteredExpenses = expenses.filter((item) => isWithinRange(item.date));
    const filteredDoctorPayments = doctorPayments.filter((item) => isWithinRange(item.date));
    const filteredSupplierInvoices = supplierInvoices.filter((item) => isWithinRange(item.invoiceDate));
    const filteredTreatments = treatmentRecords.filter((item) => isWithinRange(item.treatmentDate));
    const filteredAppointments = appointments.filter((item) => isWithinRange(item.startTime));
    const filteredLabCases = labCases.filter((item) => isWithinRange(item.sentDate || item.dueDate || item.returnDate));
    const filteredPrescriptions = prescriptions.filter((item) => isWithinRange(item.prescriptionDate));

    const patientMap = new Map(patients.map((item) => [item.id, item]));
    const dentistMap = new Map(dentists.map((item) => [item.id, item]));
    const supplierMap = new Map(suppliers.map((item) => [item.id, item]));
    const treatmentMap = new Map(treatmentDefinitions.map((item) => [item.id, item]));
    const inventoryMap = new Map(inventoryItems.map((item) => [item.id, item]));

    const totalPayments = filteredPayments.reduce((sum, item) => sum + item.amount, 0);
    const totalClinicShare = filteredPayments.reduce((sum, item) => sum + item.clinicShare, 0);
    const totalDoctorShare = filteredPayments.reduce((sum, item) => sum + item.doctorShare, 0);
    const totalExpenses = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
    const totalDoctorPayouts = filteredDoctorPayments.reduce((sum, item) => sum + item.amount, 0);
    const totalTreatmentValue = filteredTreatments.reduce((sum, item) => sum + item.totalTreatmentCost, 0);
    const totalSupplierInvoices = filteredSupplierInvoices.reduce((sum, item) => sum + item.amount, 0);
    const outstandingAmount = Math.max(totalTreatmentValue - totalPayments, 0);
    const operatingResult = totalClinicShare - totalExpenses - totalDoctorPayouts;

    const paymentMethodStats = Array.from(
      filteredPayments.reduce((acc, item) => {
        const key = item.method || 'غير محدد';
        const current = acc.get(key) || { count: 0, amount: 0 };
        current.count += 1;
        current.amount += item.amount;
        acc.set(key, current);
        return acc;
      }, new Map<string, { count: number; amount: number }>())
    ).map(([method, stats]) => [method, formatNumber(stats.count), formatCurrency(stats.amount)]);

    const patientSummaries = patients.map((patient) => {
      const patientTreatments = filteredTreatments.filter((item) => item.patientId === patient.id);
      const patientPayments = filteredPayments.filter((item) => item.patientId === patient.id);
      const patientAppointments = filteredAppointments.filter((item) => item.patientId === patient.id);
      const patientTreatmentValue = patientTreatments.reduce((sum, item) => sum + item.totalTreatmentCost, 0);
      const patientPaymentsValue = patientPayments.reduce((sum, item) => sum + item.amount, 0);

      return {
        name: patient.name,
        phone: patient.phone || '-',
        treatments: patientTreatments.length,
        appointments: patientAppointments.length,
        paid: patientPaymentsValue,
        due: Math.max(patientTreatmentValue - patientPaymentsValue, 0),
        lastVisit: patientTreatments
          .map((item) => item.treatmentDate)
          .sort()
          .slice(-1)[0] || patient.lastVisit || '',
      };
    });

    const activePatientsCount = patientSummaries.filter((item) => item.treatments > 0 || item.appointments > 0).length;
    const patientsWithDues = patientSummaries.filter((item) => item.due > 0).length;
    const topPatientsRows = safeRows(
      patientSummaries
        .filter((item) => item.treatments > 0 || item.paid > 0 || item.due > 0)
        .sort((a, b) => b.paid + b.due - (a.paid + a.due))
        .map((item) => [
          item.name,
          item.phone,
          formatNumber(item.treatments),
          formatNumber(item.appointments),
          formatCurrency(item.paid),
          formatCurrency(item.due),
          formatDate(item.lastVisit),
        ])
    );

    const doctorSummaries = dentists.map((dentist) => {
      const doctorTreatments = filteredTreatments.filter((item) => item.dentistId === dentist.id);
      const doctorAppointments = filteredAppointments.filter((item) => item.dentistId === dentist.id);
      const doctorPaymentsForTreatments = filteredPayments.filter((item) =>
        doctorTreatments.some((treatment) => treatment.id === item.treatmentRecordId)
      );
      const doctorPaidOut = filteredDoctorPayments
        .filter((item) => item.dentistId === dentist.id)
        .reduce((sum, item) => sum + item.amount, 0);
      const doctorRevenue = doctorPaymentsForTreatments.reduce((sum, item) => sum + item.amount, 0);

      return {
        name: dentist.name,
        specialty: dentist.specialty || '-',
        treatments: doctorTreatments.length,
        appointments: doctorAppointments.length,
        patients: new Set(doctorTreatments.map((item) => item.patientId)).size,
        revenue: doctorRevenue,
        payout: doctorPaidOut,
      };
    });

    const activeDoctorsCount = doctorSummaries.filter((item) => item.treatments > 0 || item.appointments > 0).length;
    const topDoctorsRows = safeRows(
      doctorSummaries
        .filter((item) => item.treatments > 0 || item.appointments > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .map((item) => [
          item.name,
          item.specialty,
          formatNumber(item.treatments),
          formatNumber(item.appointments),
          formatNumber(item.patients),
          formatCurrency(item.revenue),
          formatCurrency(item.payout),
        ])
    );

    const appointmentStatusRows = [
      ['إجمالي المواعيد', formatNumber(filteredAppointments.length)],
      ['مكتمل', formatNumber(filteredAppointments.filter((item) => item.status === 'COMPLETED').length)],
      ['مؤكد', formatNumber(filteredAppointments.filter((item) => item.status === 'CONFIRMED').length)],
      ['مجدول', formatNumber(filteredAppointments.filter((item) => item.status === 'SCHEDULED').length)],
      ['ملغي', formatNumber(filteredAppointments.filter((item) => item.status === 'CANCELLED').length)],
    ];
    const completedAppointments = filteredAppointments.filter((item) => item.status === 'COMPLETED').length;
    const cancelledAppointments = filteredAppointments.filter((item) => item.status === 'CANCELLED').length;
    const appointmentCompletionRate = filteredAppointments.length > 0
      ? (completedAppointments / filteredAppointments.length) * 100
      : 0;

    const busiestDaysRows = safeRows(
      Array.from(
        filteredAppointments.reduce((acc, item) => {
          const key = item.startTime.toISOString().split('T')[0];
          acc.set(key, (acc.get(key) || 0) + 1);
          return acc;
        }, new Map<string, number>())
      )
        .sort((a, b) => b[1] - a[1])
        .map(([day, count]) => [formatDate(day), formatNumber(count)])
    );

    const supplierSummaries = suppliers.map((supplier) => {
      const invoices = filteredSupplierInvoices.filter((item) => item.supplierId === supplier.id);
      const supplierExpenses = filteredExpenses.filter((item) => item.supplierId === supplier.id);
      const supplierLabCases = filteredLabCases.filter((item) => item.labId === supplier.id);
      const invoicesAmount = invoices.reduce((sum, item) => sum + item.amount, 0);
      const expenseAmount = supplierExpenses.reduce((sum, item) => sum + item.amount, 0);

      return {
        name: supplier.name,
        type: supplier.type || '-',
        invoices: invoices.length,
        labCases: supplierLabCases.length,
        invoiceAmount: invoicesAmount,
        paidAmount: expenseAmount,
        outstanding: Math.max(invoicesAmount - expenseAmount, 0),
      };
    });

    const activeSuppliersCount = supplierSummaries.filter((item) => item.invoices > 0 || item.labCases > 0).length;
    const topSuppliersRows = safeRows(
      supplierSummaries
        .filter((item) => item.invoices > 0 || item.labCases > 0)
        .sort((a, b) => b.invoiceAmount - a.invoiceAmount)
        .map((item) => [
          item.name,
          item.type,
          formatNumber(item.invoices),
          formatNumber(item.labCases),
          formatCurrency(item.invoiceAmount),
          formatCurrency(item.paidAmount),
          formatCurrency(item.outstanding),
        ])
    );

    const labStatusRows = [
      ['إجمالي الحالات', formatNumber(filteredLabCases.length)],
      ['مسودة', formatNumber(filteredLabCases.filter((item) => item.status === 'DRAFT').length)],
      ['مرسلة للمعمل', formatNumber(filteredLabCases.filter((item) => item.status === 'SENT_TO_LAB').length)],
      ['مستلمة من المعمل', formatNumber(filteredLabCases.filter((item) => item.status === 'RECEIVED_FROM_LAB').length)],
      ['تم تركيبها', formatNumber(filteredLabCases.filter((item) => item.status === 'FITTED_TO_PATIENT').length)],
      ['ملغاة', formatNumber(filteredLabCases.filter((item) => item.status === 'CANCELLED').length)],
    ];

    const totalInventoryValue = inventoryItems.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
    const lowStockCount = inventoryItems.filter((item) => item.currentStock <= item.minStockLevel && item.currentStock > 0).length;
    const outOfStockCount = inventoryItems.filter((item) => item.currentStock <= 0).length;
    const expiringSoonCount = inventoryItems.filter((item) => {
      if (!item.expiryDate) return false;
      const expiry = new Date(item.expiryDate);
      const days = (expiry.getTime() - end.getTime()) / (1000 * 60 * 60 * 24);
      return days >= 0 && days <= 60;
    }).length;

    const criticalInventoryRows = safeRows(
      inventoryItems
        .filter((item) => item.currentStock <= item.minStockLevel)
        .sort((a, b) => (a.currentStock - a.minStockLevel) - (b.currentStock - b.minStockLevel))
        .map((item) => [
          item.name,
          supplierMap.get(item.supplierId)?.name || '-',
          formatNumber(item.currentStock),
          formatNumber(item.minStockLevel),
          formatCurrency(item.unitCost),
          item.expiryDate ? formatDate(item.expiryDate) : '-',
        ])
    );

    const materialUsageRows = safeRows(
      Array.from(
        filteredTreatments.reduce((acc, treatment) => {
          (treatment.inventoryItemsUsed || []).forEach((usedItem) => {
            const current = acc.get(usedItem.inventoryItemId) || { quantity: 0, cost: 0 };
            current.quantity += Number(usedItem.quantity) || 0;
            current.cost += Number(usedItem.cost) || 0;
            acc.set(usedItem.inventoryItemId, current);
          });
          return acc;
        }, new Map<string, { quantity: number; cost: number }>())
      )
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .map(([inventoryItemId, stats]) => [
          inventoryMap.get(inventoryItemId)?.name || 'خامة غير معروفة',
          formatNumber(stats.quantity),
          formatCurrency(stats.cost),
          inventoryMap.get(inventoryItemId)?.expiryDate ? formatDate(inventoryMap.get(inventoryItemId)?.expiryDate || '') : '-',
        ])
    );

    const expenseCategoryRows = safeRows(
      Array.from(
        filteredExpenses.reduce((acc, item) => {
          const key = item.category || 'أخرى';
          acc.set(key, (acc.get(key) || 0) + item.amount);
          return acc;
        }, new Map<string, number>())
      )
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => [
          category,
          formatCurrency(amount),
          `${((amount / Math.max(totalExpenses, 1)) * 100).toFixed(1)}%`,
        ])
    );

    const topExpensesRows = safeRows(
      filteredExpenses
        .slice()
        .sort((a, b) => b.amount - a.amount)
        .map((item) => [
          item.description || '-',
          item.category || '-',
          supplierMap.get(item.supplierId || '')?.name || '-',
          formatCurrency(item.amount),
          formatDate(item.date),
        ])
    );

    const treatmentRows = safeRows(
      Array.from(
        filteredTreatments.reduce((acc, item) => {
          const key = item.treatmentDefinitionId || 'unknown';
          const current = acc.get(key) || { count: 0, value: 0 };
          current.count += 1;
          current.value += item.totalTreatmentCost;
          acc.set(key, current);
          return acc;
        }, new Map<string, { count: number; value: number }>())
      )
        .sort((a, b) => b[1].value - a[1].value)
        .map(([treatmentDefinitionId, stats]) => [
          treatmentMap.get(treatmentDefinitionId)?.name || 'علاج غير معرف',
          formatNumber(stats.count),
          formatCurrency(stats.value),
          formatCurrency(stats.value / Math.max(stats.count, 1)),
        ])
    );

    const filteredPrescriptionIds = new Set(filteredPrescriptions.map((item) => item.id));
    const relatedPrescriptionItems = prescriptionItems.filter((item) => filteredPrescriptionIds.has(item.prescriptionId));
    const medicationRows = safeRows(
      Array.from(
        relatedPrescriptionItems.reduce((acc, item) => {
          const key = item.medicationName || 'دواء غير مسمى';
          const current = acc.get(key) || { count: 0, quantity: 0 };
          current.count += 1;
          current.quantity += Number(item.quantity) || 0;
          acc.set(key, current);
          return acc;
        }, new Map<string, { count: number; quantity: number }>())
      )
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .map(([name, stats]) => [name, formatNumber(stats.count), formatNumber(stats.quantity)])
    );

    const prescriptionRows = safeRows(
      filteredPrescriptions.map((item) => [
        patientMap.get(item.patientId)?.name || '-',
        dentistMap.get(item.dentistId)?.name || '-',
        formatNumber(relatedPrescriptionItems.filter((entry) => entry.prescriptionId === item.id).length),
        formatDate(item.prescriptionDate),
      ])
    );

    const highlights: PrintableMetric[] = [
      { label: 'تحصيلات المرضى', value: formatCurrency(totalPayments), helper: 'إجمالي المدفوعات خلال الفترة', tone: 'green' },
      { label: 'قيمة العلاجات', value: formatCurrency(totalTreatmentValue), helper: 'القيمة الإجمالية للعلاج المسجل', tone: 'blue' },
      { label: 'صافي التشغيل', value: formatCurrency(operatingResult), helper: 'حصة العيادة - المصروفات - مدفوعات الأطباء', tone: operatingResult >= 0 ? 'cyan' : 'red' },
      { label: 'المرضى النشطون', value: formatNumber(activePatientsCount), helper: `من أصل ${formatNumber(patients.length)} مريض`, tone: 'purple' },
    ];

    const sections: PrintableSection[] = [
      {
        title: 'المالية والتحصيل',
        description: 'ملخص مالي واضح للطباعة يغطي التحصيلات والمصروفات وحركة العيادة النقدية.',
        accent: 'from-emerald-600 via-teal-600 to-cyan-700',
        metrics: [
          { label: 'إجمالي التحصيلات', value: formatCurrency(totalPayments) },
          { label: 'حصة العيادة', value: formatCurrency(totalClinicShare) },
          { label: 'حصة الأطباء', value: formatCurrency(totalDoctorShare) },
          { label: 'مصروفات التشغيل', value: formatCurrency(totalExpenses) },
          { label: 'مدفوعات الأطباء', value: formatCurrency(totalDoctorPayouts) },
          { label: 'المتبقي على المرضى', value: formatCurrency(outstandingAmount) },
        ],
        tables: [
          {
            title: 'وسائل الدفع',
            columns: ['الطريقة', 'عدد العمليات', 'الإجمالي'],
            rows: paymentMethodStats,
          },
          {
            title: 'مؤشرات مالية إضافية',
            columns: ['البند', 'القيمة'],
            rows: [
              ['إجمالي قيمة العلاج', formatCurrency(totalTreatmentValue)],
              ['إجمالي فواتير الموردين', formatCurrency(totalSupplierInvoices)],
              ['صافي التشغيل', formatCurrency(operatingResult)],
            ],
          },
        ],
      },
      {
        title: 'المرضى',
        description: 'حصر للمرضى الأكثر نشاطا وحركة السداد والزيارات داخل الفترة المحددة.',
        accent: 'from-violet-600 via-purple-600 to-fuchsia-700',
        metrics: [
          { label: 'إجمالي المرضى', value: formatNumber(patients.length) },
          { label: 'مرضى نشطون', value: formatNumber(activePatientsCount) },
          { label: 'مرضى عليهم مستحقات', value: formatNumber(patientsWithDues) },
          { label: 'مرضى لهم تحصيلات', value: formatNumber(patientSummaries.filter((item) => item.paid > 0).length) },
          { label: 'إجمالي الزيارات العلاجية', value: formatNumber(filteredTreatments.length) },
          { label: 'ملفات المرضى المرفقة', value: formatNumber(attachments.length) },
        ],
        tables: [
          {
            title: 'أعلى المرضى من حيث التعامل المالي',
            columns: ['المريض', 'الهاتف', 'العلاجات', 'المواعيد', 'المدفوع', 'المتبقي', 'آخر زيارة'],
            rows: topPatientsRows,
          },
        ],
      },
      {
        title: 'الأطباء',
        description: 'قياس نشاط الأطباء حسب العلاجات والمواعيد والإيراد والمدفوعات.',
        accent: 'from-sky-600 via-blue-600 to-indigo-700',
        metrics: [
          { label: 'إجمالي الأطباء', value: formatNumber(dentists.length) },
          { label: 'أطباء نشطون', value: formatNumber(activeDoctorsCount) },
          { label: 'العلاجات المنفذة', value: formatNumber(filteredTreatments.length) },
          { label: 'المواعيد الطبية', value: formatNumber(filteredAppointments.length) },
          { label: 'مدفوعات الأطباء', value: formatCurrency(totalDoctorPayouts) },
          { label: 'متوسط العائد للطبيب', value: formatCurrency(totalPayments / Math.max(activeDoctorsCount, 1)) },
        ],
        tables: [
          {
            title: 'أداء الأطباء',
            columns: ['الطبيب', 'التخصص', 'العلاجات', 'المواعيد', 'المرضى', 'الإيراد', 'المقبوض للطبيب'],
            rows: topDoctorsRows,
          },
        ],
      },
      {
        title: 'المواعيد والتشغيل',
        description: 'صورة تشغيلية للحجوزات ونسب الإنجاز والأيام الأكثر ازدحاما.',
        accent: 'from-cyan-600 via-sky-600 to-blue-700',
        metrics: [
          { label: 'إجمالي المواعيد', value: formatNumber(filteredAppointments.length) },
          { label: 'مواعيد مكتملة', value: formatNumber(completedAppointments) },
          { label: 'مواعيد ملغاة', value: formatNumber(cancelledAppointments) },
          { label: 'نسبة الإنجاز', value: `${appointmentCompletionRate.toFixed(1)}%` },
          { label: 'مرضى لديهم مواعيد', value: formatNumber(new Set(filteredAppointments.map((item) => item.patientId)).size) },
          { label: 'أطباء لديهم مواعيد', value: formatNumber(new Set(filteredAppointments.map((item) => item.dentistId)).size) },
        ],
        tables: [
          {
            title: 'حالة المواعيد',
            columns: ['الحالة', 'العدد'],
            rows: appointmentStatusRows,
          },
          {
            title: 'الأيام الأكثر ازدحاما',
            columns: ['اليوم', 'عدد المواعيد'],
            rows: busiestDaysRows,
          },
        ],
      },
      {
        title: 'الموردون وحالات المعمل',
        description: 'متابعة الموردين الماليين وحالات المعمل ضمن نفس التقرير المطبوع.',
        accent: 'from-amber-500 via-orange-500 to-red-600',
        metrics: [
          { label: 'إجمالي الموردين', value: formatNumber(suppliers.length) },
          { label: 'موردون نشطون', value: formatNumber(activeSuppliersCount) },
          { label: 'فواتير الموردين', value: formatNumber(filteredSupplierInvoices.length) },
          { label: 'قيمة الفواتير', value: formatCurrency(totalSupplierInvoices) },
          { label: 'حالات المعمل', value: formatNumber(filteredLabCases.length) },
          { label: 'تكلفة المعمل', value: formatCurrency(filteredLabCases.reduce((sum, item) => sum + item.labCost, 0)) },
        ],
        tables: [
          {
            title: 'أفضل الموردين',
            columns: ['المورد', 'النوع', 'الفواتير', 'حالات المعمل', 'قيمة الفواتير', 'المدفوع', 'المتبقي'],
            rows: topSuppliersRows,
          },
          {
            title: 'ملخص حالات المعمل',
            columns: ['الحالة', 'العدد'],
            rows: labStatusRows,
          },
        ],
      },
      {
        title: 'الخامات والمخزن',
        description: 'تقرير واضح للخامات المستخدمة وحالة المخزون والأصناف الحرجة.',
        accent: 'from-indigo-600 via-violet-600 to-purple-700',
        metrics: [
          { label: 'إجمالي أصناف المخزن', value: formatNumber(inventoryItems.length) },
          { label: 'قيمة المخزون', value: formatCurrency(totalInventoryValue) },
          { label: 'منخفض المخزون', value: formatNumber(lowStockCount) },
          { label: 'نافد من المخزون', value: formatNumber(outOfStockCount) },
          { label: 'ينتهي قريبا', value: formatNumber(expiringSoonCount) },
          { label: 'أصناف مستخدمة بالعلاج', value: formatNumber(materialUsageRows.length) },
        ],
        tables: [
          {
            title: 'الأصناف الحرجة بالمخزن',
            columns: ['الصنف', 'المورد', 'الكمية الحالية', 'الحد الأدنى', 'تكلفة الوحدة', 'تاريخ الانتهاء'],
            rows: criticalInventoryRows,
          },
          {
            title: 'الخامات المستخدمة في العلاجات',
            columns: ['الخامة', 'إجمالي الكمية', 'إجمالي التكلفة', 'الصلاحية'],
            rows: materialUsageRows,
          },
        ],
      },
      {
        title: 'المصروفات',
        description: 'عرض ملون وواضح للمصروفات حسب الفئة وأكبر البنود داخل الفترة.',
        accent: 'from-rose-600 via-red-600 to-orange-600',
        metrics: [
          { label: 'إجمالي المصروفات', value: formatCurrency(totalExpenses) },
          { label: 'عدد قيود المصروف', value: formatNumber(filteredExpenses.length) },
          { label: 'متوسط القيد', value: formatCurrency(totalExpenses / Math.max(filteredExpenses.length, 1)) },
          { label: 'موردون مرتبطون بالمصروف', value: formatNumber(new Set(filteredExpenses.map((item) => item.supplierId).filter(Boolean)).size) },
          { label: 'أعلى فئة مصروف', value: expenseCategoryRows[0]?.[0] || '-' },
          { label: 'نسبة التشغيل للمصروف', value: `${((totalExpenses / Math.max(totalPayments, 1)) * 100).toFixed(1)}%` },
        ],
        tables: [
          {
            title: 'المصروفات حسب الفئة',
            columns: ['الفئة', 'الإجمالي', 'النسبة'],
            rows: expenseCategoryRows,
          },
          {
            title: 'أكبر المصروفات',
            columns: ['الوصف', 'الفئة', 'المورد', 'القيمة', 'التاريخ'],
            rows: topExpensesRows,
          },
        ],
      },
      {
        title: 'العلاجات والوصفات وبيانات إضافية',
        description: 'يغطي هذا الجزء العلاجات المسجلة والوصفات الطبية وباقي البيانات المهمة داخل البرنامج.',
        accent: 'from-slate-700 via-slate-800 to-slate-900',
        metrics: [
          { label: 'العلاجات المسجلة', value: formatNumber(filteredTreatments.length) },
          { label: 'تعريفات العلاج', value: formatNumber(treatmentDefinitions.length) },
          { label: 'الوصفات الطبية', value: formatNumber(filteredPrescriptions.length) },
          { label: 'بنود الوصفات', value: formatNumber(relatedPrescriptionItems.length) },
          { label: 'متوسط قيمة العلاج', value: formatCurrency(totalTreatmentValue / Math.max(filteredTreatments.length, 1)) },
          { label: 'أكثر علاج تكرارا', value: treatmentRows[0]?.[0] || '-' },
        ],
        tables: [
          {
            title: 'أكثر العلاجات',
            columns: ['العلاج', 'عدد المرات', 'القيمة', 'متوسط العملية'],
            rows: treatmentRows,
          },
          {
            title: 'الوصفات الطبية',
            columns: ['المريض', 'الطبيب', 'عدد البنود', 'التاريخ'],
            rows: prescriptionRows,
          },
          {
            title: 'الأدوية الأكثر تكرارا',
            columns: ['الدواء', 'عدد مرات الورود', 'إجمالي الكمية'],
            rows: medicationRows,
          },
        ],
      },
    ];

    return {
      clinicInfo,
      reportTitle: 'التقرير الشامل للعيادة',
      reportSubtitle:
        'نموذج مطبوع جديد بالكامل مصمم كجداول واضحة وملونة ويغطي المالية والمرضى والأطباء والموردين وحالات المعمل والخامات والمخزن والمصروفات وبقية بيانات التشغيل.',
      generatedAt: formatDate(new Date()),
      dateRange,
      highlights,
      sections,
    };
  }, [clinicData, dateRange]);

  if (clinicData.isLoading && !isPrintWindow) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white px-8 py-6 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600" />
          <p className="text-sm font-medium text-slate-600">جاري تجهيز التقرير الشامل للعيادة...</p>
        </div>
      </div>
    );
  }

  const printableNode = (
    <PrintableClinicReport
      clinicInfo={reportModel.clinicInfo}
      reportTitle={reportModel.reportTitle}
      reportSubtitle={reportModel.reportSubtitle}
      generatedAt={reportModel.generatedAt}
      dateRange={reportModel.dateRange}
      highlights={reportModel.highlights}
      sections={reportModel.sections}
      isPrintWindow={true}
    />
  );

  if (isPrintWindow) {
    return printableNode;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#0f766e_0%,#0f172a_60%,#1d4ed8_100%)] text-white shadow-xl">
          <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 text-sm font-semibold text-cyan-100">التقارير</p>
              <h1 className="mb-3 text-3xl font-black">تقارير شاملة للعيادة</h1>
              <p className="text-sm leading-7 text-slate-100">
                تم استبدال التقرير المطبوع بالكامل بنموذج مصمم للطباعة كجداول ملونة وواضحة ويغطي كل أقسام البرنامج.
              </p>
            </div>

            <button
              onClick={() => openPrintWindow(reportModel.reportTitle, printableNode, {
                pageSize: 'A4 landscape',
                mode: 'minimal',
                width: 1440,
                height: 1020,
              })}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-base font-black text-slate-900 transition hover:bg-slate-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              طباعة
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">من تاريخ</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(event) => setDateRange((prev) => ({ ...prev, startDate: event.target.value }))}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">إلى تاريخ</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(event) => setDateRange((prev) => ({ ...prev, endDate: event.target.value }))}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-teal-500"
              />
            </div>
            <div className="text-sm text-slate-500">
              نطاق التقرير الحالي: <span className="font-bold text-slate-800">{formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}</span>
            </div>
          </div>
        </div>

        <PrintableClinicReport
          clinicInfo={reportModel.clinicInfo}
          reportTitle={reportModel.reportTitle}
          reportSubtitle={reportModel.reportSubtitle}
          generatedAt={reportModel.generatedAt}
          dateRange={reportModel.dateRange}
          highlights={reportModel.highlights}
          sections={reportModel.sections}
        />
      </div>
    </div>
  );
};

export default ComprehensiveClinicReportPage;
