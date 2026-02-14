import { useEffect, useCallback } from 'react';
import { useNotification, NotificationAlert } from '../contexts/NotificationContext';
import { useI18n } from './useI18n';

export interface AutoAlertConfig {
  enableAppointmentReminders: boolean;
  enableInventoryAlerts: boolean;
  enablePaymentAlerts: boolean;
  enableExpiryAlerts: boolean;
  appointmentReminderMinutes: number;
  lowStockThreshold: number;
  expiryWarningDays: number;
}

const DEFAULT_CONFIG: AutoAlertConfig = {
  enableAppointmentReminders: true,
  enableInventoryAlerts: true,
  enablePaymentAlerts: false, // Disabled by default to reduce noise
  enableExpiryAlerts: true,
  appointmentReminderMinutes: 30, // Remind 30 minutes before (was 60)
  lowStockThreshold: 5, // Lower threshold (was 10) - only alert when very low
  expiryWarningDays: 14, // Warn 14 days before (was 7) - more advance warning
};

export const useAutoAlerts = (clinicData: any, config: Partial<AutoAlertConfig> = {}) => {
  const { addAlert } = useNotification();
  const { t } = useI18n();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Track which alerts have been shown to avoid duplicates
  const shownAlertIds = new Set<string>();

  const checkAppointmentReminders = useCallback(() => {
    if (!finalConfig.enableAppointmentReminders || !clinicData.appointments) return;

    const now = new Date();
    const reminderTime = finalConfig.appointmentReminderMinutes * 60 * 1000;

    // Collect all appointments that need reminders
    const appointmentsNeedingReminder = clinicData.appointments.filter((apt: any) => {
      const aptTime = new Date(apt.startTime).getTime();
      const timeUntilApt = aptTime - now.getTime();
      return timeUntilApt > 0 && timeUntilApt <= reminderTime;
    });

    // Create one grouped alert for all upcoming appointments
    if (appointmentsNeedingReminder.length > 0) {
      const alertId = 'appointment_reminders_grouped';
      if (!shownAlertIds.has(alertId)) {
        // Group by time urgency (only very soon appointments are marked urgent)
        const urgentAppts = appointmentsNeedingReminder.filter((apt: any) => {
          const timeUntilApt = new Date(apt.startTime).getTime() - now.getTime();
          return timeUntilApt <= 15 * 60 * 1000; // Within 15 minutes (only very urgent)
        });

        const soonAppts = appointmentsNeedingReminder.filter((apt: any) => {
          const timeUntilApt = new Date(apt.startTime).getTime() - now.getTime();
          return timeUntilApt > 15 * 60 * 1000; // More than 15 minutes
        });

        let description = '';

        if (urgentAppts.length > 0) {
          description += `🚨 ${t('alerts.appointmentStarting') || 'Starting Soon'} (${urgentAppts.length}):\n`;
          urgentAppts.forEach((apt: any) => {
            const patient = clinicData.patients?.find((p: any) => p.id === apt.patientId);
            const timeUntilApt = new Date(apt.startTime).getTime() - now.getTime();
            const minutesLeft = Math.ceil(timeUntilApt / 60000);
            description += `• ${patient?.name || t('alerts.patient') || 'Patient'} - ${apt.reason} (${minutesLeft} ${t('alerts.minutes') || 'min'})\n`;
          });
        }

        if (soonAppts.length > 0) {
          description += `ℹ️ ${t('alerts.appointmentUpcoming') || 'Upcoming'} (${soonAppts.length}):\n`;
          soonAppts.slice(0, 5).forEach((apt: any) => {
            const patient = clinicData.patients?.find((p: any) => p.id === apt.patientId);
            const timeUntilApt = new Date(apt.startTime).getTime() - now.getTime();
            const minutesLeft = Math.ceil(timeUntilApt / 60000);
            description += `• ${patient?.name || t('alerts.patient') || 'Patient'} - ${apt.reason} (${minutesLeft} ${t('alerts.minutes') || 'min'})\n`;
          });
          if (soonAppts.length > 5) {
            description += `• +${soonAppts.length - 5} ${t('alerts.moreAppointments') || 'more appointments'}`;
          }
        }

        addAlert({
          type: 'appointment',
          title: t('alerts.appointmentReminder') || `Appointment Reminders (${appointmentsNeedingReminder.length})`,
          description: description.trim(),
          priority: urgentAppts.length > 0 ? 'high' : 'medium',
          timestamp: new Date().toISOString(),
          category: 'clinical',
          actionUrl: 'scheduler',
          metadata: { 
            appointmentCount: appointmentsNeedingReminder.length,
            urgentCount: urgentAppts.length,
          },
        });
        shownAlertIds.add(alertId);
      }
    }
  }, [finalConfig.enableAppointmentReminders, finalConfig.appointmentReminderMinutes, clinicData, addAlert, t]);

  const checkInventoryLevels = useCallback(() => {
    if (!finalConfig.enableInventoryAlerts || !clinicData.inventoryItems) return;

    // Collect all low stock items
    const lowStockItems = clinicData.inventoryItems.filter((item: any) => 
      item.currentStock <= finalConfig.lowStockThreshold
    );

    // If there are low stock items, create one grouped alert
    if (lowStockItems.length > 0) {
      const alertId = 'inventory_low_stock_grouped';
      if (!shownAlertIds.has(alertId)) {
        // Separate by severity (only alert when very low)
        const criticalItems = lowStockItems.filter((i: any) => i.currentStock === 0);
        const severeItems = lowStockItems.filter((i: any) => i.currentStock > 0 && i.currentStock <= 2); // Only 1-2 units
        const normalItems = lowStockItems.filter((i: any) => i.currentStock > 2); // Skip 3+ units to reduce noise

        // Build description
        let description = '';
        if (criticalItems.length > 0) {
          description += `🚨 ${t('alerts.outOfStock') || 'Out of Stock'} (${criticalItems.length}): ${criticalItems.map((i: any) => i.name).join(', ')}\n`;
        }
        if (severeItems.length > 0) {
          description += `⚠️ ${t('alerts.criticalStock') || 'Critical'} (${severeItems.length}): ${severeItems.map((i: any) => `${i.name} (${i.currentStock})`).join(', ')}\n`;
        }
        if (normalItems.length > 0) {
          description += `ℹ️ ${t('alerts.lowStock') || 'Low Stock'} (${normalItems.length}): ${normalItems.map((i: any) => `${i.name} (${i.currentStock})`).join(', ')}`;
        }

        // Determine priority based on critical items
        const priority = criticalItems.length > 0 ? 'high' : severeItems.length > 0 ? 'high' : 'medium';

        addAlert({
          type: 'low_stock',
          title: t('alerts.lowInventory') || 'Low Inventory Alert',
          description: description.trim(),
          priority: priority,
          timestamp: new Date().toISOString(),
          category: 'inventory',
          actionUrl: 'inventory',
          metadata: { 
            itemCount: lowStockItems.length,
            criticalCount: criticalItems.length,
            severeCount: severeItems.length,
          },
        });
        shownAlertIds.add(alertId);
      }
    }
  }, [finalConfig.enableInventoryAlerts, finalConfig.lowStockThreshold, clinicData, addAlert, t]);

  const checkExpiringItems = useCallback(() => {
    if (!finalConfig.enableExpiryAlerts || !clinicData.inventoryItems) return;

    const now = new Date();
    const warningTime = finalConfig.expiryWarningDays * 24 * 60 * 60 * 1000;

    // Collect expiring and expired items
    const expiringItems: any[] = [];
    const expiredItems: any[] = [];

    clinicData.inventoryItems.forEach((item: any) => {
      if (item.expiryDate) {
        const expiryDate = new Date(item.expiryDate).getTime();
        const timeUntilExpiry = expiryDate - now.getTime();

        if (timeUntilExpiry > 0 && timeUntilExpiry <= warningTime) {
          const daysUntilExpiry = Math.ceil(timeUntilExpiry / (24 * 60 * 60 * 1000));
          expiringItems.push({ ...item, daysUntilExpiry });
        } else if (expiryDate <= now.getTime()) {
          expiredItems.push(item);
        }
      }
    });

    // Create grouped alert for expiry issues
    if (expiredItems.length > 0 || expiringItems.length > 0) {
      const alertId = 'inventory_expiry_grouped';
      if (!shownAlertIds.has(alertId)) {
        let description = '';

        if (expiredItems.length > 0) {
          description += `❌ ${t('alerts.expiredItems') || 'Expired Items'} (${expiredItems.length}): ${expiredItems.map((i: any) => i.name).join(', ')}\n`;
        }

        if (expiringItems.length > 0) {
          const urgentExpiring = expiringItems.filter((i: any) => i.daysUntilExpiry <= 3); // Only 3 days or less
          const soonExpiring = expiringItems.filter((i: any) => i.daysUntilExpiry > 3); // More than 3 days

          if (urgentExpiring.length > 0) {
            description += `🔴 ${t('alerts.expiringSoon') || 'Expiring Soon'} (${urgentExpiring.length}): ${urgentExpiring.map((i: any) => `${i.name} (${i.daysUntilExpiry}d)`).join(', ')}\n`;
          }
          if (soonExpiring.length > 0) {
            description += `🟡 ${t('alerts.expiring') || 'Expiring'} (${soonExpiring.length}): ${soonExpiring.map((i: any) => `${i.name} (${i.daysUntilExpiry}d)`).join(', ')}`;
          }
        }

        // Priority based on expired items
        const priority = expiredItems.length > 0 ? 'high' : expiringItems.some((i: any) => i.daysUntilExpiry <= 1) ? 'high' : 'medium';

        addAlert({
          type: 'expiry',
          title: t('alerts.itemExpiry') || 'Item Expiry Alert',
          description: description.trim(),
          priority: priority,
          timestamp: new Date().toISOString(),
          category: 'inventory',
          actionUrl: 'inventory',
          metadata: {
            expiredCount: expiredItems.length,
            expiringCount: expiringItems.length,
          },
        });
        shownAlertIds.add(alertId);
      }
    }
  }, [finalConfig.enableExpiryAlerts, finalConfig.expiryWarningDays, clinicData, addAlert, t]);

  const checkOutstandingPayments = useCallback(() => {
    if (!finalConfig.enablePaymentAlerts || !clinicData.treatmentRecords || !clinicData.payments) return;

    const unpaidTreatments = clinicData.treatmentRecords.filter((tr: any) => {
      const treatmentDef = clinicData.treatmentDefinitions?.find((td: any) => td.id === tr.treatmentDefinitionId);
      const treatmentCost = treatmentDef?.basePrice || 0;
      const paidAmount = clinicData.payments
        ?.filter((p: any) => p.treatmentRecordId === tr.id)
        .reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
      return treatmentCost > paidAmount;
    });

    // Create one grouped alert for all outstanding payments
    if (unpaidTreatments.length > 0) {
      const alertId = 'payments_outstanding_grouped';
      if (!shownAlertIds.has(alertId)) {
        let description = '';
        let totalOutstanding = 0;

        // Show top 10 outstanding payments
        const topOutstanding = unpaidTreatments
          .map((tr: any) => {
            const patient = clinicData.patients?.find((p: any) => p.id === tr.patientId);
            const treatmentDef = clinicData.treatmentDefinitions?.find((td: any) => td.id === tr.treatmentDefinitionId);
            const treatmentCost = treatmentDef?.basePrice || 0;
            const paidAmount = clinicData.payments
              ?.filter((p: any) => p.treatmentRecordId === tr.id)
              .reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
            const outstanding = treatmentCost - paidAmount;
            return { patient, treatment: treatmentDef?.name, outstanding, id: tr.id };
          })
          .sort((a: any, b: any) => b.outstanding - a.outstanding)
          .slice(0, 10);

        topOutstanding.forEach((item: any) => {
          description += `• ${item.patient?.name || t('alerts.patient') || 'Patient'} - ${item.treatment || t('alerts.treatment') || 'Treatment'}: ${item.outstanding.toFixed(2)} EGP\n`;
          totalOutstanding += item.outstanding;
        });

        if (unpaidTreatments.length > 10) {
          const remaining = unpaidTreatments.length - 10;
          const remainingAmount = unpaidTreatments
            .slice(10)
            .reduce((sum: number, tr: any) => {
              const treatmentDef = clinicData.treatmentDefinitions?.find((td: any) => td.id === tr.treatmentDefinitionId);
              const treatmentCost = treatmentDef?.basePrice || 0;
              const paidAmount = clinicData.payments
                ?.filter((p: any) => p.treatmentRecordId === tr.id)
                .reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
              return sum + (treatmentCost - paidAmount);
            }, 0);
          description += `\n💰 +${remaining} ${t('alerts.moreOutstanding') || 'more outstanding payments'} (${remainingAmount.toFixed(2)} EGP)`;
          totalOutstanding += remainingAmount;
        }

        addAlert({
          type: 'payment',
          title: t('alerts.outstandingPayment') || `Outstanding Payments (${unpaidTreatments.length})`,
          description: description.trim(),
          priority: totalOutstanding > 10000 ? 'high' : 'medium',
          timestamp: new Date().toISOString(),
          category: 'financial',
          actionUrl: 'finance',
          metadata: { 
            paymentCount: unpaidTreatments.length,
            totalOutstanding: totalOutstanding,
          },
        });
        shownAlertIds.add(alertId);
      }
    }
  }, [finalConfig.enablePaymentAlerts, clinicData, addAlert, t]);

  // Run checks periodically
  useEffect(() => {
    checkAppointmentReminders();
    checkInventoryLevels();
    checkExpiringItems();
    checkOutstandingPayments();

    // Re-check every 5 minutes (reduced frequency to reduce noise)
    const interval = setInterval(() => {
      checkAppointmentReminders();
      checkInventoryLevels();
      checkExpiringItems();
      checkOutstandingPayments();
    }, 300000); // 5 minutes = 300000ms

    return () => clearInterval(interval);
  }, [checkAppointmentReminders, checkInventoryLevels, checkExpiringItems, checkOutstandingPayments]);

  return {
    manualCheck: () => {
      checkAppointmentReminders();
      checkInventoryLevels();
      checkExpiringItems();
      checkOutstandingPayments();
    },
  };
};
