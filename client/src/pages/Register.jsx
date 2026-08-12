import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import '../styles/auth.css';

export default function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function validateName(name) {
    return name.trim().length >= 3;
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePassword(password) {
    return password.length >= 6;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError('');

    // Name validation
    if (!validateName(form.name)) {
        setError('Name must be at least 3 characters');
        return;
    }

    // Email validation
    if (!validateEmail(form.email)) {
        setError('Please enter a valid email address');
        return;
    }

    // Password validation
    if (!validatePassword(form.password)) {
        setError('Password must be at least 6 characters');
        return;
    }

    // Confirm password
    if (form.password !== form.confirmPassword) {
        setError('Passwords do not match');
        return;
    }

    setLoading(true);

    try {
        await registerUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        });

        navigate('/login');
        showToast("User Registered Successful", "success");
    } catch (err) {
        setError(
        err.response?.data?.message || 'Registration failed'
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
          <h2>Start building with DocFlow</h2>
          <p>
            Create a collaborative workspace for study notes,
            projects, research, and AI-powered writing.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h1>Create account</h1>
          <p className="auth-subtitle">
            It only takes a minute
          </p>

          {error && (
            <p style={{ color: '#dc2626' }}>{error}</p>
          )}

          <div className="form-group">
            <label className="form-label">Full name</label>
            <input
              className="form-input"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              minLength={3}
              placeholder="Enter name min. 3 characters"
              required
            />
          </div>

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
              minLength={6}
              placeholder="Create a Strong Password, min. 6 characters"
              required
            />    
          </div>

          <div className="form-group">
            <label className="form-label">Confirm password</label>
            <input
              className="form-input"
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </div>

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="auth-footer">
            Already have an account?{' '}
            <Link className="auth-link" to="/login">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}