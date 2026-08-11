import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard</h1>

      <p>Welcome, {user?.name}!</p>
      <p>Email: {user?.email}</p>

      <button
        onClick={handleLogout}
        style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          borderRadius: '12px',
          border: 'none',
          background: '#4338ca',
          color: 'white',
          cursor: 'pointer',
        }}
      >
        Logout
      </button>
    </div>
  );
}