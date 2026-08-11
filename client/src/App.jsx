export default function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          padding: '3rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            margin: '0 auto 1.5rem',
            borderRadius: 20,
            background:
              'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'grid',
            placeItems: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '1.5rem',
          }}
        >
          DF
        </div>

        <h1 style={{ margin: 0, fontSize: '2.2rem' }}>
          DocFlow
        </h1>

        <p
          style={{
            color: 'var(--muted)',
            marginTop: '1rem',
            lineHeight: 1.6,
          }}
        >
          A collaborative engineering notebook with real-time editing
          and built-in AI assistance.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '2rem',
          }}
        >
          <button
            style={{
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              padding: '0.9rem 1.4rem',
              borderRadius: 14,
              cursor: 'pointer',
            }}
          >
            Get Started
          </button>

          <button
            style={{
              background: 'white',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              padding: '0.9rem 1.4rem',
              borderRadius: 14,
              cursor: 'pointer',
            }}
          >
            Live Demo
          </button>
        </div>

        <div
          style={{
            marginTop: '2rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          {['Real-time', 'AI Assist', 'Search', 'Collaboration'].map(
            item => (
              <span
                key={item}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 999,
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.9rem',
                  color: 'var(--muted)',
                  background: '#fff',
                }}
              >
                {item}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}