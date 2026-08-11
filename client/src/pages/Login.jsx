import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/authService';
import '../styles/auth.css';



export default function Login() {

  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

  async function handleSubmit(e) {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
        if (!validateEmail(form.email)) {
                setError('Please enter a valid email address');
            return;
        }

        const data = await loginUser(form);

        // Save to context + localStorage
        login(data.token, data.user);

        navigate('/dashboard');
    } 
    catch (err) {
      setError(
        err.response?.data?.message || 'Login failed'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">DF</div>
          <h2>Welcome back</h2>
          <p>
            Continue your collaborative engineering notes,
            research documents, and AI-assisted writing.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Sign in</h1>
          <p className="auth-subtitle">
            Access your DocFlow workspace
          </p>

          {error && (
            <p style={{ color: '#dc2626' }}>{error}</p>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="auth-footer">
            Don't have an account?{' '}
            <Link className="auth-link" to="/register">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}