import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Notification = ({ 
  type = 'info', 
  message, 
  onClose, 
  autoClose = true,
  duration = 5000 
}) => {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const configs = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-500',
      textColor: 'text-white',
      borderColor: 'border-green-600'
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-500',
      textColor: 'text-white',
      borderColor: 'border-red-600'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-500',
      textColor: 'text-white',
      borderColor: 'border-yellow-600'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
      borderColor: 'border-blue-600'
    }
  };

  const config = configs[type] || configs.info;
  const Icon = config.icon;

  return (
    <div 
      className={`${config.bgColor} ${config.textColor} px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl flex items-center border-2 ${config.borderColor}`}
      role="alert"
      aria-live="polite"
    >
      <Icon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" />
      <div className="flex-1 text-sm sm:text-base">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 sm:ml-3 p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
          aria-label="Close notification"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}
    </div>
  );
};

export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { ...notification, id }]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const NotificationContainer = () => (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 pointer-events-none">
      {notifications.map(notification => (
        <div key={notification.id} className="pointer-events-auto animate-slideIn">
          <Notification
            {...notification}
            onClose={() => removeNotification(notification.id)}
          />
        </div>
      ))}
    </div>
  );

  return {
    addNotification,
    removeNotification,
    NotificationContainer,
    showSuccess: (message) => addNotification({ type: 'success', message }),
    showError: (message) => addNotification({ type: 'error', message }),
    showWarning: (message) => addNotification({ type: 'warning', message }),
    showInfo: (message) => addNotification({ type: 'info', message })
  };
};

export default Notification;
