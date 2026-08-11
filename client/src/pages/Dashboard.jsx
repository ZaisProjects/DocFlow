import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, createDocument } from '../services/documentService';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Load documents when page opens
  useEffect(() => {
    async function loadDocuments() {
      try {
        const docs = await getDocuments();
        setDocuments(docs);
      } catch (err) {
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, []);

  async function handleCreateDocument() {
    try {
      setCreating(true);

      const newDoc = await createDocument({
        title: 'Untitled Document',
        content: '',
      });
console.log('Created document:', newDoc);
      // Open editor immediately
      navigate(`/editor/${newDoc._id}`);
    } catch (err) {
      alert('Failed to create document');
    } finally {
      setCreating(false);
    }
  }

  function openDocument(id) {
    navigate(`/editor/${id}`);
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your workspace...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-welcome">Welcome back</p>
          <h1>{user?.name}'s Workspace</h1>
        </div>

        <div className="dashboard-actions">
          <button
            className="create-btn"
            onClick={handleCreateDocument}
            disabled={creating}
          >
            {creating ? 'Creating...' : '+ New Document'}
          </button>

          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {error && <p className="dashboard-error">{error}</p>}

      {documents.length === 0 ? (
        <div className="empty-state">
          <h2>No documents yet</h2>
          <p>Create your first collaborative document to get started.</p>

          <button
            className="create-btn"
            onClick={handleCreateDocument}
          >
            Create First Document
          </button>
        </div>
      ) : (
        <div className="documents-grid">
          {documents.map(doc => (
            <article
              key={doc._id}
              className="document-card"
              onClick={() => openDocument(doc._id)}
            >
              <div className="document-card-header">
                <span className="document-badge">
                  {doc.visibility}
                </span>

                {doc.isFavorite && (
                  <span className="favorite-badge">★</span>
                )}
              </div>

              <h3>{doc.title}</h3>

              <p className="document-preview">
                {doc.content?.slice(0, 120) || 'Empty document'}
              </p>

              <div className="document-meta">
                <span>
                  Updated {new Date(doc.updatedAt).toLocaleDateString()}
                </span>

                <span>Views {doc.viewCount || 0}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}