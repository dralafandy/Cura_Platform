import { useMemo } from 'react';
import {
  Payment,
  TreatmentRecord,
  Expense,
  DoctorPayment,
  SupplierInvoice,
} from '../types';

// Types for auditing
interface CalculationAuditEntry {
  timestamp: string;
  calculationType: string;
  parameters: Record<string, any>;
  results: Record<string, number>;
  dataCounts: Record<string, number>;
}

// Global audit log (in production, this would be persisted to a database)
let calculationAuditLog: CalculationAuditEntry[] = [];

// Audit logging function
const logCalculation = (
  calculationType: string,
  parameters: Record<string, any>,
  results: Record<string, number>,
  dataCounts: Record<string, number>
) => {
  const auditEntry: CalculationAuditEntry = {
    timestamp: new Date().toISOString(),
    calculationType,
    parameters,
    results,
    dataCounts,
  };

  // Keep only last 1000 entries to prevent memory issues
  calculationAuditLog.unshift(auditEntry);
  if (calculationAuditLog.length > 1000) {
    calculationAuditLog = calculationAuditLog.slice(0, 1000);
  }

  // In development, log to console for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Financial Calculation Audit:', auditEntry);
  }
};

// Export audit log for debugging purposes
export const getCalculationAuditLog = (): CalculationAuditEntry[] => {
  return [...calculationAuditLog];
};

// Clear audit log (useful for testing)
export const clearCalculationAuditLog = (): void => {
  calculationAuditLog = [];
};

export interface FinancialFilters {
  startDate?: string;
  endDate?: string;
}

export interface FinancialSummary {
  // Revenue calculations
  totalRevenue: number; // Total payments received from patients
  totalPayments: number; // Total payments received
  clinicRevenue: number; // Clinic's share from payments
  doctorRevenue: number; // Doctor's share from payments (for tracking)

  // Expense calculations
  totalExpenses: number; // Operating expenses only (no doctor payments)
  operatingExpenses: number; // Same as totalExpenses
  doctorPayments: number; // Doctor payments (tracked separately, not as expenses)
  totalSupplierInvoices: number; // Total supplier invoices

  // Balance calculations
  unpaidInvoices: number;
  paidInvoices: number;

  // Profit and cash flow
  netProfit: number; // totalRevenue - totalExpenses
  cashFlow: number; // totalPayments - totalExpenses

  // Balance sheet items
  cashAndEquivalents: number;
  accountsReceivable: number;
  totalAssets: number;
  accountsPayable: number;
  totalLiabilities: number;
  equity: number;
}

/**
 * Utility function to filter data arrays by date range
 */
function filterByDate<T extends { date?: string; treatmentDate?: string; invoiceDate?: string }>(
  data: T[],
  filters: FinancialFilters
): T[] {
  let filtered = data;

  if (filters.startDate) {
    const startDate = new Date(filters.startDate);
    filtered = filtered.filter(item => {
      const itemDate = item.date || item.treatmentDate || item.invoiceDate;
      return itemDate ? new Date(itemDate) >= startDate : true;
    });
  }

  if (filters.endDate) {
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter(item => {
      const itemDate = item.date || item.treatmentDate || item.invoiceDate;
      return itemDate ? new Date(itemDate) <= endDate : true;
    });
  }

  return filtered;
}

/**
 * Hook for centralized financial calculations
 * Consolidates all financial calculation logic from various components
 */
export function useFinancialCalculations(
  payments: Payment[],
  expenses: Expense[],
  treatmentRecords: TreatmentRecord[],
  doctorPayments: DoctorPayment[],
  supplierInvoices: SupplierInvoice[],
  filters: FinancialFilters = {}
): FinancialSummary {
  return useMemo(() => {
    // Apply date filtering to all data arrays
    const filteredTreatmentRecords = filterByDate(treatmentRecords, filters);
    const filteredPayments = filterByDate(payments, filters);
    const filteredExpenses = filterByDate(expenses, filters);
    const filteredDoctorPayments = filterByDate(doctorPayments, filters);
    const filteredSupplierInvoices = filterByDate(supplierInvoices, filters);

    // Revenue calculations - total payments from patients
    const totalPayments = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const doctorRevenue = filteredPayments.reduce((sum, payment) => sum + payment.doctorShare, 0);
    const clinicRevenue = totalPayments - doctorRevenue; // Clinic's share is total payments minus doctor's share

    // Expense calculations - operating expenses only (no doctor payments)
    const operatingExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const doctorPaymentsTotal = filteredDoctorPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalSupplierInvoices = filteredSupplierInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

    // Balance calculations
    const unpaidInvoices = filteredSupplierInvoices
      .filter(inv => inv.status === 'UNPAID')
      .reduce((sum, inv) => sum + inv.amount, 0);
    const paidInvoices = filteredSupplierInvoices
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.amount, 0);

    // Profit and cash flow calculations
    // Material costs are not added as expenses, so accountsReceivable is based on totalTreatmentCost
    const accountsReceivable = filteredTreatmentRecords.reduce((sum, rec) => sum + rec.totalTreatmentCost, 0) - totalPayments;
    // Net profit = total payments - doctor's share from payments - operating expenses
    const netProfit = totalPayments - doctorRevenue - operatingExpenses;
    // Cash flow = total payments received - operating expenses (doctor payments not subtracted)
    const cashFlow = totalPayments - operatingExpenses;

    // Balance sheet calculations
    const cashAndEquivalents = cashFlow;
    const totalAssets = cashAndEquivalents + accountsReceivable;
    const accountsPayable = unpaidInvoices;
    const totalLiabilities = accountsPayable;
    const equity = netProfit;

    // Audit the calculation
    logCalculation('useFinancialCalculations', {
      filters,
      dataCounts: {
        payments: payments.length,
        expenses: expenses.length,
        treatmentRecords: treatmentRecords.length,
        doctorPayments: doctorPayments.length,
        supplierInvoices: supplierInvoices.length,
      },
    }, {
      clinicRevenue,
      doctorRevenue,
      totalPayments,
      operatingExpenses,
      doctorPaymentsTotal,
      totalSupplierInvoices,
      netProfit,
      cashFlow,
      totalAssets,
      totalLiabilities,
      equity,
    }, {
      filteredPayments: filteredPayments.length,
      filteredExpenses: filteredExpenses.length,
      filteredTreatmentRecords: filteredTreatmentRecords.length,
      filteredDoctorPayments: filteredDoctorPayments.length,
      filteredSupplierInvoices: filteredSupplierInvoices.length,
    });

    return {
      // Revenue
      totalRevenue: totalPayments,
      totalPayments,
      clinicRevenue,
      doctorRevenue,

      // Expenses
      totalExpenses: operatingExpenses,
      operatingExpenses,
      doctorPayments: doctorPaymentsTotal,
      totalSupplierInvoices,

      // Balances
      unpaidInvoices,
      paidInvoices,

      // Profit and cash flow
      netProfit,
      cashFlow,

      // Balance sheet
      cashAndEquivalents,
      accountsReceivable,
      totalAssets,
      accountsPayable,
      totalLiabilities,
      equity,
    };
  }, [payments, expenses, treatmentRecords, doctorPayments, supplierInvoices, filters]);
}

/**
 * Individual calculation functions for specific use cases
 */
export const calculateRevenue = (treatmentRecords: TreatmentRecord[], payments: Payment[], filters?: FinancialFilters): number => {
  const filteredPayments = filterByDate(payments, filters || {});
  const result = filteredPayments.reduce((sum, payment) => sum + payment.clinicShare, 0);

  logCalculation('calculateRevenue', {
    filters,
    dataCounts: { treatmentRecords: treatmentRecords.length, payments: payments.length },
  }, { revenue: result }, { filteredPayments: filteredPayments.length });

  return result;
};

export const calculateExpenses = (expenses: Expense[], doctorPayments: DoctorPayment[], supplierInvoices: SupplierInvoice[], filters?: FinancialFilters): number => {
  const filteredExpenses = filterByDate(expenses, filters || {});
  const filteredDoctorPayments = filterByDate(doctorPayments, filters || {});
  const filteredSupplierInvoices = filterByDate(supplierInvoices, filters || {});
  const result = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0) +
                 filteredDoctorPayments.reduce((sum, payment) => sum + payment.amount, 0) +
                 filteredSupplierInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

  logCalculation('calculateExpenses', {
    filters,
    dataCounts: { expenses: expenses.length, doctorPayments: doctorPayments.length, supplierInvoices: supplierInvoices.length },
  }, { expenses: result }, {
    filteredExpenses: filteredExpenses.length,
    filteredDoctorPayments: filteredDoctorPayments.length,
    filteredSupplierInvoices: filteredSupplierInvoices.length,
  });

  return result;
};

export const calculateNetProfit = (revenue: number, expenses: number, doctorPayments: number): number => {
  const result = revenue - expenses - doctorPayments;

  logCalculation('calculateNetProfit', {
    revenue,
    expenses,
    doctorPayments,
  }, { netProfit: result }, {});

  return result;
};

export const calculateCashFlow = (payments: Payment[], expenses: Expense[], doctorPayments: DoctorPayment[], filters?: FinancialFilters): number => {
  const filteredPayments = filterByDate(payments, filters || {});
  const filteredExpenses = filterByDate(expenses, filters || {});
  const filteredDoctorPayments = filterByDate(doctorPayments, filters || {});
  const totalPayments = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0) +
                       filteredDoctorPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const result = totalPayments - totalExpenses;

  logCalculation('calculateCashFlow', {
    filters,
    dataCounts: { payments: payments.length, expenses: expenses.length, doctorPayments: doctorPayments.length },
  }, { cashFlow: result }, {
    filteredPayments: filteredPayments.length,
    filteredExpenses: filteredExpenses.length,
    filteredDoctorPayments: filteredDoctorPayments.length,
  });

  return result;
};

export const calculateBalanceSheet = (summary: FinancialSummary) => {
  return {
    assets: {
      cashAndEquivalents: summary.cashAndEquivalents,
      accountsReceivable: summary.accountsReceivable,
      totalAssets: summary.totalAssets,
    },
    liabilities: {
      accountsPayable: summary.accountsPayable,
      totalLiabilities: summary.totalLiabilities,
    },
    equity: summary.equity,
  };
};