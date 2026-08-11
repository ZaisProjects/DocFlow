import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>DocFlow Home</h1>

      <p>
        <Link to="/login">Login</Link>
      </p>

      <p>
        <Link to="/register">Register</Link>
      </p>

      <p>
        <Link to="/dashboard">Dashboard</Link>
      </p>
    </div>
  );
}