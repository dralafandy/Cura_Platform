import React, { useMemo, useState } from 'react';
import { useNotification, NotificationAlert } from '../contexts/NotificationContext';
import { useI18n } from '../hooks/useI18n';

interface NotificationManagerProps {
  clinicData: any;
  setCurrentView: (view: string) => void;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ clinicData, setCurrentView }) => {
  const { alerts, markAlertAsRead, markAllAlertsRead, removeAlert, getAlertStats, setPreferences, getPreferences } = useNotification();
  const { t, locale } = useI18n();
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'clinical' | 'inventory' | 'financial' | 'administrative'>('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'preferences'>('alerts');

  const stats = getAlertStats();
  const preferences = getPreferences();

  // Filter alerts based on selected filters
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (filterPriority !== 'all' && alert.priority !== filterPriority) return false;
      if (filterCategory !== 'all' && alert.category !== filterCategory) return false;
      return true;
    });
  }, [alerts, filterPriority, filterCategory]);

  const handleAlertClick = (alert: NotificationAlert) => {
    markAlertAsRead(alert.id);
    if (alert.actionUrl) {
      setCurrentView(alert.actionUrl);
    }
  };

  const priorityColors = {
    high: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-l-4 border-red-500', iconBg: 'bg-red-100 dark:bg-red-900/40' },
    medium: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-l-4 border-amber-500', iconBg: 'bg-amber-100 dark:bg-amber-900/40' },
    low: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-l-4 border-blue-500', iconBg: 'bg-blue-100 dark:bg-blue-900/40' },
  };

  const categoryIcons = {
    clinical: { icon: '🏥', label: t('notifications.categories.clinical') || 'Clinical' },
    inventory: { icon: '📦', label: t('notifications.categories.inventory') || 'Inventory' },
    financial: { icon: '💰', label: t('notifications.categories.financial') || 'Financial' },
    administrative: { icon: '⚙️', label: t('notifications.categories.administrative') || 'Administrative' },
  };

  const categoryLabels = {
    clinical: t('notifications.categories.clinical') || 'Clinical',
    inventory: t('notifications.categories.inventory') || 'Inventory',
    financial: t('notifications.categories.financial') || 'Financial',
    administrative: t('notifications.categories.administrative') || 'Administrative',
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      high: t('notifications.priority.high') || 'High',
      medium: t('notifications.priority.medium') || 'Medium',
      low: t('notifications.priority.low') || 'Low',
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('notifications.justNow') || 'Just now';
    if (minutes < 60) return `${minutes}m ${t('notifications.ago') || 'ago'}`;
    if (hours < 24) return `${hours}h ${t('notifications.ago') || 'ago'}`;
    if (days < 7) return `${days}d ${t('notifications.ago') || 'ago'}`;
    return new Intl.DateTimeFormat(locale).format(date);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {t('notifications.title') || 'Notification Center'}
        </h2>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{stats.totalCount}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">{t('notifications.total') || 'Total'}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.highPriority}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">{t('notifications.priority.high') || 'High'}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.mediumPriority}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">{t('notifications.priority.medium') || 'Medium'}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.unreadCount}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">{t('notifications.unread') || 'Unread'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex-1 py-3 px-4 font-medium text-sm transition-colors ${
            activeTab === 'alerts'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {t('notifications.alerts') || 'Alerts'} ({filteredAlerts.length})
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex-1 py-3 px-4 font-medium text-sm transition-colors ${
            activeTab === 'preferences'
              ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {t('notifications.preferences') || 'Preferences'}
        </button>
      </div>

      {/* Content */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {activeTab === 'alerts' ? (
          <div>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              {/* Priority Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                  {t('notifications.priority.label') || 'Priority'}
                </label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as any)}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm"
                >
                  <option value="all">{t('common.all') || 'All'}</option>
                  <option value="high">{t('notifications.priority.high') || 'High'}</option>
                  <option value="medium">{t('notifications.priority.medium') || 'Medium'}</option>
                  <option value="low">{t('notifications.priority.low') || 'Low'}</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                  {t('notifications.category.label') || 'Category'}
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as any)}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm"
                >
                  <option value="all">{t('common.all') || 'All'}</option>
                  <option value="clinical">{categoryLabels.clinical}</option>
                  <option value="inventory">{categoryLabels.inventory}</option>
                  <option value="financial">{categoryLabels.financial}</option>
                  <option value="administrative">{categoryLabels.administrative}</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="ms-auto flex gap-2">
                <button
                  onClick={() => markAllAlertsRead()}
                  className="px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-sm font-medium transition-colors"
                >
                  {t('notifications.markAllRead') || 'Mark All as Read'}
                </button>
              </div>
            </div>

            {/* Alerts List */}
            {filteredAlerts.length > 0 ? (
              <div className="space-y-3">
                {filteredAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${priorityColors[alert.priority].bg} ${priorityColors[alert.priority].border} hover:shadow-lg group ${!alert.read ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`p-2.5 rounded-lg ${priorityColors[alert.priority].iconBg} flex-shrink-0`}>
                        <span className="text-xl">{categoryIcons[alert.category]?.icon || '📢'}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className={`font-semibold text-sm ${priorityColors[alert.priority].text} mb-1`}>
                              {alert.title}
                            </h3>
                            <p className={`text-xs leading-relaxed ${priorityColors[alert.priority].text} opacity-80 whitespace-pre-line`}>
                              {alert.description}
                            </p>
                          </div>
                          {!alert.read && (
                            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0 mt-1 shadow-sm"></div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-current border-opacity-10">
                          <div className="flex items-center gap-2 text-xs opacity-75">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              alert.priority === 'high' ? 'bg-red-200 dark:bg-red-900/40 text-red-700 dark:text-red-300' :
                              alert.priority === 'medium' ? 'bg-amber-200 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
                              'bg-blue-200 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                            }`}>
                              {getPriorityLabel(alert.priority)}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">{formatTime(alert.timestamp)}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAlert(alert.id);
                            }}
                            className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            aria-label="Delete"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-1">
                  {t('notifications.noAlerts') || 'No alerts to display'}
                </p>
                <p className="text-slate-500 dark:text-slate-500 text-xs">
                  {filterPriority !== 'all' || filterCategory !== 'all'
                    ? (t('notifications.tryDifferentFilters') || 'Try adjusting your filters')
                    : (t('notifications.allCaughtUp') || 'You\'re all caught up!')
                  }
                </p>
              </div>
            )}
          </div>
        ) : (
          // Preferences Tab
          <div className="space-y-6">
            {/* Sound Notifications */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                    {t('notifications.soundNotifications') || 'Sound Notifications'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {t('notifications.soundNotificationsDesc') || 'Play sound when new alerts arrive'}
                  </p>
                </div>
                <button
                  onClick={() => setPreferences({ enableSoundNotifications: !preferences.enableSoundNotifications })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.enableSoundNotifications ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.enableSoundNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Toast Notifications */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                    {t('notifications.toastNotifications') || 'Toast Notifications'}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {t('notifications.toastNotificationsDesc') || 'Show floating notifications'}
                  </p>
                </div>
                <button
                  onClick={() => setPreferences({ enableNotificationToasts: !preferences.enableNotificationToasts })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences.enableNotificationToasts ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.enableNotificationToasts ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Category Preferences */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">
                {t('notifications.categoryPreferences') || 'Category Preferences'}
              </h3>
              <div className="space-y-3">
                {(Object.keys(preferences.categories) as Array<keyof typeof preferences.categories>).map(category => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{categoryIcons[category]?.icon || '📢'}</span>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {categoryIcons[category]?.label || categoryLabels[category]}
                      </span>
                    </div>
                    <button
                      onClick={() => setPreferences({
                        categories: {
                          ...preferences.categories,
                          [category]: !preferences.categories[category],
                        },
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        preferences.categories[category] ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.categories[category] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">
                {t('notifications.minimumPriority') || 'Minimum Priority Level'}
              </h3>
              <div className="space-y-2">
                {(['all', 'high_medium', 'high_only'] as const).map(level => (
                  <label key={level} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value={level}
                      checked={preferences.priorityFilter === level}
                      onChange={() => setPreferences({ priorityFilter: level })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {level === 'all' && (t('notifications.showAll') || 'Show all alerts')}
                      {level === 'high_medium' && (t('notifications.showHighMedium') || 'High and Medium priority')}
                      {level === 'high_only' && (t('notifications.showHighOnly') || 'High priority only')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationManager;
