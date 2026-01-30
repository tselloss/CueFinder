import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

const Toast = ({ id, message, type = 'error', duration = 5000, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = React.useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  }, [id, onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="toast-icon" />;
      case 'error':
        return <AlertCircle className="toast-icon" />;
      case 'info':
      default:
        return <Info className="toast-icon" />;
    }
  };

  return (
    <div 
      className={`toast toast-${type} ${isExiting ? 'toast-exit' : ''}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="toast-content">
        <div className="toast-icon-wrapper">
          {getIcon()}
        </div>
        <div className="toast-message">
          {message}
        </div>
        <button
          className="toast-close"
          onClick={handleClose}
          aria-label="Close notification"
        >
          <X size={18} />
        </button>
      </div>
      <div className="toast-progress">
        <div 
          className="toast-progress-bar" 
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
};

export default Toast;
