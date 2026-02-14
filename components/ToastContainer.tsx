import React from 'react';
import Toast from './Toast';
import { useNotification } from '../contexts/NotificationContext';

const ToastContainer: React.FC = () => {
    const { notifications } = useNotification();

    return (
        <div className="fixed top-4 end-4 z-[100] w-full max-w-xs space-y-2" dir="rtl">
            {notifications.map(notification => (
                <Toast key={notification.id} notification={notification} />
            ))}
        </div>
    );
};

export default ToastContainer;
