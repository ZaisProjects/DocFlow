import { createContext, useContext, useState } from 'react';
import Toast from '../components/common/Toast';
import ConfirmDialog from '../components/common/ConfirmDialog';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    type: 'warning',
    resolve: null,
  });

  // Toast message
  function showToast(message, type = 'success') {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  // Confirm dialog
  function confirm(options) {
    return new Promise(resolve => {
      setConfirmState({
        open: true,
        title: options.title || 'Confirm',
        message: options.message || '',
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || 'Cancel',
        type: options.type || 'warning',
        resolve,
      });
    });
  }

  function handleConfirm() {
    confirmState.resolve(true);

    setConfirmState(prev => ({
      ...prev,
      open: false,
    }));
  }

  function handleCancel() {
    confirmState.resolve(false);

    setConfirmState(prev => ({
      ...prev,
      open: false,
    }));
  }

  return (
    <ToastContext.Provider value={{ showToast, confirm }}>
      {children}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background:
              toast.type === 'error'
                ? '#dc2626'
                : toast.type === 'warning'
                ? '#d97706'
                : '#16a34a',
            color: 'white',
            padding: '14px 18px',
            borderRadius: '14px',
            zIndex: 2147483647,
            fontWeight: '600',
            boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
          }}
        >
          {toast.message}
        </div>
      )}

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}