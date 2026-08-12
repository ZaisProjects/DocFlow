import '../../styles/dialog.css';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
}) {
  if (!open) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-box">
        <h3>{title}</h3>
        <p>{message}</p>

        <div className="dialog-actions">
          <button className="dialog-cancel" onClick={onCancel}>
            {cancelText}
          </button>

          <button
            className={danger ? 'dialog-confirm danger' : 'dialog-confirm'}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}