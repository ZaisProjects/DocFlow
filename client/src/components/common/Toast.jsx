import '../../styles/dialog.css';

export default function Toast({ message, type = 'success' }) {
  return (
    <div className={`toast toast-${type}`} role="alert">
      {message}
    </div>
  );
}