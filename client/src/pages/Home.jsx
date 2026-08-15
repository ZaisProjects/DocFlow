import { Link } from 'react-router-dom';
import '../styles/home.css';
import logo from "/logo.png";

export default function Home() {
  return (
    <div className="home-page">
      {/* Navbar */}
      <header className="home-navbar">
        <Link to="/" className="nav-brand-link">
          <div className="brand-logo">
            <img src={logo} alt="DocFlow" className="hero-image" />
          </div>

          <div className="brand-text">
            <h2>DocFlow</h2>
            <p>Collaborative workspace</p>
          </div>
        </Link>

        <nav className="nav-links">
          <Link to="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link to="/login" className="nav-link">
            Login
          </Link>

          <Link to="/register" className="nav-link">
            Register
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-badge">
            Real-time Collaboration
          </span>

          <h1>
            Write together with <span>DocFlow</span>
          </h1>

          <p className="hero-description">
            Create, edit, and share documents in real time.
            Collaborate with teammates, generate AI summaries, and
            download your work as PDF, DOCX, or TXT — all in one place.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="primary-btn">
              Get Started Free
            </Link>

            <Link to="/login" className="secondary-btn">
              Sign In
            </Link>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div className="hero-preview">
          <div className="preview-window">
            <div className="preview-header">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>

            <div className="preview-body">
              <div className="preview-toolbar">
                <div className="preview-search"></div>
                <div className="preview-button"></div>
              </div>

              <div className="preview-grid">
                <div className="preview-card">
                  <div className="preview-badge">Public</div>
                  <div className="preview-title">
                    Backend Engineering Notes
                  </div>
                  <div className="preview-line"></div>
                  <div className="preview-line short"></div>
                </div>

                <div className="preview-card">
                  <div className="preview-badge">Private</div>
                  <div className="preview-title">
                    ML Research Draft
                  </div>
                  <div className="preview-line"></div>
                  <div className="preview-line short"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <h2>Everything you need to collaborate</h2>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Real-time Editing</h3>
            <p>
              See changes instantly as your collaborators type.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI Summaries</h3>
            <p>
              Generate concise summaries and keywords automatically.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Role-based Access</h3>
            <p>
              Control who can view or edit each document.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>Export Anywhere</h3>
            <p>
              Download documents as PDF, DOCX, or TXT in one click.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Start collaborating today</h2>
        <p>Join DocFlow and build documents together in real time.</p>

        <Link to="/register" className="primary-btn large">
          Create Free Account
        </Link>
      </section>
    </div>
  );
}