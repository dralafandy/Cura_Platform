import React, { useState, useMemo } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useI18n } from '../hooks/useI18n';
import { View } from '../types';
import { ClinicData } from '../hooks/useClinicData';

interface NotificationBoxProps {
  clinicData: ClinicData;
  setCurrentView: (view: View) => void;
  isCollapsed: boolean;
}

const NotificationBox: React.FC<NotificationBoxProps> = ({ clinicData, setCurrentView, isCollapsed }) => {
  const { notifications } = useNotification();
  const { t, locale } = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  const { patients, appointments, inventoryItems, labCases } = clinicData;

  // Get recent notifications (last 5 for sidebar)
  const recentNotifications = useMemo(() => {
    return notifications.slice(-5).reverse();
  }, [notifications]);

  // Get alert notifications (appointments, inventory, lab cases)
  const alertNotifications = useMemo(() => {
    const allAlerts: any[] = [];
    const now = new Date();
    const lowStockThreshold = 10;
    const labCaseDueThresholdDays = 3;

    // Appointment Reminders
    appointments.forEach((apt: any) => {
      if (apt.reminderSent || apt.reminderTime === 'none' || apt.startTime < now) return;

      const aptTime = apt.startTime.getTime();
      let reminderThreshold = 0;
      if (apt.reminderTime === '1_hour_before') reminderThreshold = 60 * 60 * 1000;
      else if (apt.reminderTime === '2_hours_before') reminderThreshold = 2 * 60 * 60 * 1000;
      else if (apt.reminderTime === '1_day_before') reminderThreshold = 24 * 60 * 60 * 1000;

      if ((aptTime - now.getTime()) <= reminderThreshold) {
        const patient = patients.find((p: any) => p.id === apt.patientId);
        allAlerts.push({
          id: `apt_${apt.id}`,
          type: 'appointment',
          title: patient?.name || t('common.unknownPatient'),
          description: `${apt.reason} at ${new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(apt.startTime)}`,
          priority: 'high',
          timestamp: apt.startTime.toISOString()
        });
      }
    });

    // Low Inventory Alerts
    inventoryItems.forEach((item: any) => {
      if (item.currentStock <= lowStockThreshold) {
        allAlerts.push({
          id: `inv_${item.id}`,
          type: 'low_stock',
          title: t('notifications.lowStockAlert'),
          description: t('notifications.lowStockMessage', { itemName: item.name, count: item.currentStock }),
          priority: item.currentStock <= 5 ? 'high' : 'medium',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Lab Case Alerts
    labCases.forEach((labCase: any) => {
      if (labCase.status !== 'FITTED_TO_PATIENT' && labCase.status !== 'CANCELLED') {
        const dueDate = new Date(labCase.dueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue <= labCaseDueThresholdDays) {
          const patient = patients.find((p: any) => p.id === labCase.patientId);
          allAlerts.push({
            id: `lab_${labCase.id}`,
            type: 'lab_case',
            title: t('notifications.labCaseDue'),
            description: `${labCase.caseType} for ${patient?.name || 'Unknown'} - Due in ${daysUntilDue} days`,
            priority: daysUntilDue <= 0 ? 'high' : 'medium',
            timestamp: labCase.dueDate
          });
        }
      }
    });

    return allAlerts.sort((a, b) => {
      const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'low'] ?? 1;
      const bPriority = priorityOrder[b.priority || 'low'] ?? 1;
      return bPriority - aPriority;
    });
  }, [appointments, inventoryItems, labCases, patients, t, locale]);

  // Combine both types of notifications
  const allNotifications = useMemo(() => {
    const combined: any[] = [
      ...alertNotifications.map(alert => ({
        id: alert.id,
        type: alert.priority === 'high' ? 'error' : alert.priority === 'medium' ? 'warning' : 'info',
        message: `${alert.title}: ${alert.description}`,
        isAlert: true,
        alertData: alert
      })),
      ...recentNotifications.map(toast => ({
        ...toast,
        isAlert: false
      }))
    ];
    return combined; // Return all notifications
  }, [alertNotifications, recentNotifications]);

  // Display notifications based on showAllNotifications state
  const displayedNotifications = showAllNotifications ? allNotifications : allNotifications.slice(0, 8);

  const unreadCount = allNotifications.length;

  const handleNotificationClick = (notification: any) => {
    if (notification.isAlert && notification.alertData) {
      const alertType = notification.alertData.type;
      if (alertType === 'appointment') {
        setCurrentView('scheduler');
      } else if (alertType === 'low_stock') {
        setCurrentView('inventory');
      } else if (alertType === 'lab_case') {
        setCurrentView('labCases');
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatTime = (timestamp: string) => {
    let date: Date;

    if (timestamp.includes('.')) {
      date = new Date(timestamp.split('.')[0]);
    } else if (timestamp.includes('T')) {
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) {
      return t('notifications.unknownTime') || 'Unknown time';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notifications.justNow') || 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  };

  if (isCollapsed) {
    return (
      <div className="px-1 mb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-2 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-800/30 dark:hover:to-blue-800/30 transition-all duration-200 group relative"
          aria-label={t('notifications.title') || 'Notifications'}
        >
          <div className="flex flex-col items-center gap-1">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="mt-2 space-y-1">
            {allNotifications.slice(0, 3).map((notification) => (
              <div
                key={notification.id}
                className="p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors duration-200 cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formatTime(notification.alertData?.timestamp || notification.id)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-1 mb-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-800/30 dark:hover:to-blue-800/30 transition-all duration-200 group"
        aria-expanded={isExpanded}
        aria-label={t('notifications.title') || 'Notifications'}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="text-left">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t('notifications.title') || 'Notifications'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {unreadCount > 0
                  ? `${unreadCount} ${unreadCount === 1 ? (t('notifications.newNotification') || 'new') : (t('notifications.newNotifications') || 'new')}`
                  : t('notifications.noNewNotifications') || 'No new notifications'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-orange-500 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            <svg
              className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2 animate-in slide-in-from-top-1 duration-200">
          {displayedNotifications.length > 0 ? (
            displayedNotifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`p-2 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
                  index === 0
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatTime(notification.alertData?.timestamp || notification.id)}
                      </p>
                      {notification.isAlert && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          notification.alertData?.type === 'appointment'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                            : notification.alertData?.type === 'low_stock'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                        }`}>
                          {notification.alertData?.type === 'appointment' ? 'Appointment' :
                           notification.alertData?.type === 'low_stock' ? 'Inventory' : 'Lab Case'}
                        </span>
                      )}
                      {index === 0 && !notification.isAlert && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                          {t('notifications.new') || 'New'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
              <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 dark:bg-slate-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V6a2 2 0 00-2-2H9a2 2 0 00-2 2v1m6 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v1" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {t('notifications.noNotifications') || 'No notifications'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                {t('notifications.noNotificationsDesc') || 'You\'re all caught up!'}
              </p>
            </div>
          )}

          {allNotifications.length > 8 && (
            <button
              onClick={() => setShowAllNotifications(!showAllNotifications)}
              className="w-full mt-2 p-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors duration-200"
            >
              {showAllNotifications ? (t('notifications.showLess') || 'Show Less...') : (t('notifications.showMore') || 'Show More...')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBox;
