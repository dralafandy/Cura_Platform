import React, { useEffect, useState } from 'react';
import { Notification, NotificationType } from '../types';
import { useNotification } from '../contexts/NotificationContext';

const typeClasses: Record<NotificationType, { bg: string; text: string; icon: string; }> = {
  [NotificationType.SUCCESS]: { bg: 'bg-green-100', text: 'text-green-800', icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' },
  [NotificationType.ERROR]:   { bg: 'bg-red-100', text: 'text-red-800', icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' },
  [NotificationType.INFO]:    { bg: 'bg-sky-100', text: 'text-sky-800', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  [NotificationType.WARNING]: { bg: 'bg-amber-100', text: 'text-amber-800', icon: 'M10 18a8 8 0 100-16 8 8 0 000 16zM11 7v4m0 4h.01' },
};

const Toast: React.FC<{ notification: Notification }> = ({ notification }) => {
  const { removeNotification } = useNotification();
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => removeNotification(notification.id), 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, removeNotification]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => removeNotification(notification.id), 300);
  };
  
  const { bg, text, icon } = typeClasses[notification.type];

  return (
    <div
      className={`relative rounded-xl shadow-lg p-4 flex items-start gap-3 transition-all duration-300 transform ${bg} ${text} ${exiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}
      role="alert"
    >
      <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d={icon} clipRule="evenodd" /></svg>
      <p className="flex-1 text-sm font-semibold">{notification.message}</p>
      <button onClick={handleClose} className={`ms-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg inline-flex h-8 w-8 ${bg} ${text} hover:bg-opacity-50`} aria-label="Close">
        <span className="sr-only">Close</span>
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
      </button>
    </div>
  );
};

export default Toast;
