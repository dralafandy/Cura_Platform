import React, { useMemo } from 'react';
import { useNotification, NotificationAlert } from '../contexts/NotificationContext';
import { useI18n } from '../hooks/useI18n';

interface AlertAnalytics {
  totalAlerts: number;
  alertsByPriority: { high: number; medium: number; low: number };
  alertsByCategory: Record<string, number>;
  alertsTrend: { date: string; count: number }[];
  mostFrequentType: string;
  averageResolutionTime: number;
}

interface NotificationAnalyticsProps {
  clinicData: any;
}

const NotificationAnalytics: React.FC<NotificationAnalyticsProps> = ({ clinicData }) => {
  const { alerts } = useNotification();
  const { t, locale } = useI18n();

  const analytics = useMemo((): AlertAnalytics => {
    const stats: AlertAnalytics = {
      totalAlerts: alerts.length,
      alertsByPriority: { high: 0, medium: 0, low: 0 },
      alertsByCategory: {
        clinical: 0,
        inventory: 0,
        financial: 0,
        administrative: 0,
      },
      alertsTrend: [],
      mostFrequentType: '',
      averageResolutionTime: 0,
    };

    // Count by priority
    alerts.forEach(alert => {
      stats.alertsByPriority[alert.priority]++;
      stats.alertsByCategory[alert.category]++;
    });

    // Calculate trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    stats.alertsTrend = last7Days.map(date => ({
      date: date.toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
      count: alerts.filter(a => {
        const alertDate = new Date(a.timestamp);
        return alertDate.toDateString() === date.toDateString();
      }).length,
    }));

    // Find most frequent type
    const typeCount: Record<string, number> = {};
    alerts.forEach(alert => {
      typeCount[alert.type] = (typeCount[alert.type] || 0) + 1;
    });
    stats.mostFrequentType = Object.entries(typeCount).reduce((prev, curr) =>
      curr[1] > prev[1] ? curr : prev,
      ['', 0] as [string, number]
    )[0];

    return stats;
  }, [alerts, locale]);

  return {
    analytics,
    stats: {
      totalAlerts: analytics.totalAlerts,
      alertsByPriority: analytics.alertsByPriority,
      alertsByCategory: analytics.alertsByCategory,
    },
  };
};

export default NotificationAnalytics;
