import React, { useState, useEffect } from 'react';
import { useNotification, NotificationAlert } from '../contexts/NotificationContext';
import { useI18n } from '../hooks/useI18n';

const SmartNotificationWidget: React.FC = () => {
  const { alerts, markAlertAsRead, removeAlert } = useNotification();
  const { t, locale } = useI18n();
  const [displayedAlerts, setDisplayedAlerts] = useState<NotificationAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Show only the latest unread alerts (up to 3 at a time)
  useEffect(() => {
    const unreadAlerts = alerts
      .filter(a => !a.read && !dismissedAlerts.has(a.id) && a.priority === 'high')
      .slice(0, 3);
    setDisplayedAlerts(unreadAlerts);
  }, [alerts, dismissedAlerts]);

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    markAlertAsRead(alertId);
  };

  const handleAction = (alert: NotificationAlert) => {
    handleDismiss(alert.id);
    if (alert.actionUrl) {
      // Navigate to the action URL (this would need to be implemented based on routing)
      window.location.hash = alert.actionUrl;
    }
  };

  if (displayedAlerts.length === 0) return null;

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          border: 'border-red-500',
          bg: 'bg-gradient-to-r from-red-50 to-white dark:from-red-900/20 dark:to-slate-800',
          icon: '🚨',
          iconBg: 'bg-red-100 dark:bg-red-900/40',
          iconText: 'text-red-600 dark:text-red-400',
          button: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'medium':
        return {
          border: 'border-amber-500',
          bg: 'bg-gradient-to-r from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-800',
          icon: '⚠️',
          iconBg: 'bg-amber-100 dark:bg-amber-900/40',
          iconText: 'text-amber-600 dark:text-amber-400',
          button: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      default:
        return {
          border: 'border-blue-500',
          bg: 'bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-800',
          icon: 'ℹ️',
          iconBg: 'bg-blue-100 dark:bg-blue-900/40',
          iconText: 'text-blue-600 dark:text-blue-400',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-3 pointer-events-none max-w-sm w-full">
      {displayedAlerts.map((alert, index) => {
        const styles = getPriorityStyles(alert.priority);
        return (
          <div
            key={alert.id}
            className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-4 pointer-events-auto animate-slide-up transform transition-all duration-300 border-l-4 ${styles.border} ${styles.bg}`}
            role="alert"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`p-2 rounded-lg ${styles.iconBg} flex-shrink-0`}>
                <span className="text-xl">{styles.icon}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1">
                  {alert.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                  {alert.description}
                </p>

                {/* Action Button */}
                {alert.actionUrl && (
                  <button
                    onClick={() => handleAction(alert)}
                    className={`mt-3 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${styles.button}`}
                  >
                    {t('common.view') || 'View'}
                  </button>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => handleDismiss(alert.id)}
                className="flex-shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SmartNotificationWidget;
