import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import '../styles/editor.css';
import { 
  getDocumentById,
  updateDocument,

} from '../services/documentService';



export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [saveStatus, setSaveStatus] = useState('saved');
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDocument() {
      try {
        setLoading(true);

        const data = await getDocumentById(id);

        console.log('Editor API response:', data);

        setDocument(data);

      } catch (error) {
        console.error(error);
        setError('Unable to open document');
      } finally {
        setLoading(false);
      }
    }

    loadDocument();
  }, [id]);

    useEffect(() => {
  if (!document) return;

  setSaveStatus('saving');

  const timer = setTimeout(async () => {
    try {
      await updateDocument(id, {
        title: document.title,
        content: document.content,
      });

      setSaveStatus('saved');
    } catch (error) {
      console.error(error);
      setSaveStatus('error');
    }
  }, 800);

  return () => clearTimeout(timer);
}, [document?.title, document?.content, id]);

  if (loading) {
    return (
      <div className="editor-loading">
        <div className="spinner"></div>
        <p>Loading document...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="editor-error">
        <h2>Unable to open document</h2>
        <p>{error}</p>

        <button onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }


return (
  <div className="editor-page">
    <header className="editor-header">
      <button
        className="back-btn"
        onClick={() => navigate('/dashboard')}
      >
        ← Back
      </button>

      <div className="editor-status">
        {saveStatus === 'saving' && 'Saving...'}
        {saveStatus === 'saved' && 'Saved'}
        {saveStatus === 'error' && 'Save failed'}
      </div>
    </header>

    <main className="editor-container">
      <input
        className="editor-title"
        value={document.title}
        onChange={e =>
          setDocument({
            ...document,
            title: e.target.value,
          })
        }
        placeholder="Untitled document"
      />

      <textarea
        className="editor-textarea"
        value={document.content}
        onChange={e =>
          setDocument({
            ...document,
            content: e.target.value,
          })
        }
        placeholder="Start writing your notes..."
      />

      <div className="editor-meta">
        <span>Visibility: {document.visibility}</span>

        <span>
          Last updated:{' '}
          {new Date(document.updatedAt).toLocaleString()}
        </span>
      </div>
    </main>
  </div>
);
}