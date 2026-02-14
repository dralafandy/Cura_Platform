import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Notification, NotificationType, NotificationPriority, NotificationFilter } from '../types';

interface LegacyNotificationInput {
  message: string;
  type?: NotificationType;
  title?: string;
  priority?: NotificationPriority;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'> | LegacyNotificationInput) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  getFilteredNotifications: (filter: NotificationFilter) => Notification[];
  clearAllNotifications: () => void;
  archiveNotification: (id: string) => void;
  archivedNotifications: Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [archivedNotifications, setArchivedNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp'> | LegacyNotificationInput) => {
    let newNotification: Notification;
    
    // Handle legacy format (string message + type)
    if (typeof notificationData === 'string') {
      newNotification = {
        id: new Date().toISOString() + Math.random().toString(),
        timestamp: new Date(),
        read: false,
        message: notificationData,
        type: NotificationType.INFO,
        priority: NotificationPriority.LOW,
        title: 'Notification',
        actions: [],
        metadata: {}
      };
    } else {
      // Handle legacy object format
      const legacy = notificationData as LegacyNotificationInput;
      newNotification = {
        ...notificationData,
        id: new Date().toISOString() + Math.random().toString(),
        timestamp: new Date(),
        read: false,
        type: legacy.type || NotificationType.INFO,
        priority: legacy.priority || NotificationPriority.LOW,
        title: legacy.title || 'Notification',
        actions: notificationData.actions || [],
        metadata: notificationData.metadata || {}
      };
    }
    
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const archiveNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setArchivedNotifications(prev => [
      ...prev,
      ...prev.filter(n => n.id === id)
    ]);
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const getFilteredNotifications = useCallback((filter: NotificationFilter) => {
    return notifications.filter(notification => {
      if (filter.type && notification.type !== filter.type) return false;
      if (filter.priority && notification.priority !== filter.priority) return false;
      if (filter.read !== undefined && notification.read !== filter.read) return false;
      if (filter.dateRange) {
        const notificationDate = new Date(notification.timestamp).getTime();
        const startDate = filter.dateRange.start.getTime();
        const endDate = filter.dateRange.end.getTime();
        if (notificationDate < startDate || notificationDate > endDate) return false;
      }
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        if (!notification.title.toLowerCase().includes(searchLower) && 
            !notification.message.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
  }, [notifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      markAsRead,
      markAllAsRead,
      dismissNotification,
      getFilteredNotifications,
      clearAllNotifications,
      archiveNotification,
      archivedNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
