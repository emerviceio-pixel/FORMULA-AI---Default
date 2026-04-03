// client/src/hooks/useToast.js
import toast from 'react-hot-toast';

export const useToast = () => {
  const baseStyle = {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: '#111827',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 20px -6px rgba(0, 0, 0, 0.15), 0 4px 12px -4px rgba(0, 0, 0, 0.1)',
    borderRadius: '12px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    maxWidth: '320px',
    width: 'auto',
    margin: '0.5rem',
    lineHeight: '1.4',
  };

  const showSuccess = (message) => {
    toast.success(message, {
      duration: 3000,
      style: baseStyle,
      iconTheme: {
        primary: '#10b981',
        secondary: '#ffffff',
      },
    });
  };

  const showError = (message) => {
    toast.error(message, {
      duration: 4000,
      style: baseStyle,
      iconTheme: {
        primary: '#ef4444',
        secondary: '#ffffff',
      },
    });
  };

  const showInfo = (message, options = {}) => {
    toast(message, {
      duration: options.duration || 5000,
      style: {
        ...baseStyle,
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        color: '#3b82f6',
      },
      icon: 'ℹ️',
    });
  };

  const showWarning = (message) => {
    toast(message, {
      duration: 3500,
      style: baseStyle,
      icon: '⚠️',
    });
  };

  const showLoading = (message) => {
    return toast.loading(message, {
      duration: 3000,
      style: baseStyle,
    });
  };

  const showPromise = (promise, messages) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Error occurred',
      },
      {
        style: baseStyle,
        success: {
          icon: '✅',
        },
        error: {
          icon: '❌',
        },
      }
    );
  };

  const dismissToast = (toastId) => {
    toast.dismiss(toastId);
  };

  const dismissAll = () => {
    toast.dismiss();
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    showPromise,
    dismissToast,
    dismissAll,
  };
};