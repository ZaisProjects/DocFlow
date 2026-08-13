import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

import '../styles/dashboard.css';

import {
  getDocuments,
  createDocument,
  searchDocuments,
} from '../services/documentService';

import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // -------------------------------
  // STATE
  // -------------------------------

  // Documents currently displayed on screen
  const [documents, setDocuments] = useState([]);

  // Original documents loaded from server
  // Used to restore list when search is cleared
  const [allDocuments, setAllDocuments] = useState([]);

  // Loading state for initial page load
  const [loading, setLoading] = useState(true);

  // Loading state while creating a document
  const [creating, setCreating] = useState(false);

  // Error message
  const [error, setError] = useState('');

  // Search input value
  const [searchQuery, setSearchQuery] = useState('');

  // Loading state for search
  const [searching, setSearching] = useState(false);

  // -------------------------------
  // LOAD DOCUMENTS ON PAGE OPEN
  // -------------------------------
  useEffect(() => {
    async function loadDocuments() {
      try {
        setLoading(true);

        const docs = await getDocuments();

        // Show documents on dashboard
        setDocuments(docs);

        // Keep backup copy for search reset
        setAllDocuments(docs);
      } catch (err) {
        console.error(err);
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, []);

  // -------------------------------
  // CREATE NEW DOCUMENT
  // -------------------------------
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
      console.error(err);
      setError('Failed to create document');
    } finally {
      setCreating(false);
    }
  }
  
  // SEARCH DOCUMENTS

  useEffect(() => {
    const timer = setTimeout(async () => {
      // Empty search -> restore original documents
      if (!searchQuery.trim()) {
        setDocuments(allDocuments);
        return;
      }

      try {
        setSearching(true);

        const data = await searchDocuments(searchQuery);

        // Backend returns { results: [...] }
        setDocuments(data.results || []);
      } catch (err) {
        console.error(err);
        setError('Search failed');
      } finally {
        setSearching(false);
      }
    }, 400);

    // Cleanup debounce timer
    return () => clearTimeout(timer);
  }, [searchQuery, allDocuments]);

  // -------------------------------
  // OPEN DOCUMENT
  // -------------------------------
  function openDocument(id) {
    navigate(`/editor/${id}`);
  }

  // -------------------------------
  // LOADING UI
  // -------------------------------
  if (loading) {
    return (
      <div className='dashboard-loading'>
        <div className='spinner'></div>
        <p>Loading your workspace...</p>
      </div>
    );
  }

  // -------------------------------
  // MAIN UI
  // -------------------------------
  return (
    <div className='dashboard-page'>
      <header className='dashboard-header'>
        {/* Welcome section */}
        <div>
          <p className='dashboard-welcome'>Welcome back</p>
          <h1>{user?.name}'s Workspace</h1>
        </div>

        {/* Search bar */}
        <div className='dashboard-search'>
          <Search size={18} className='search-icon' />

          <input
            type='text'
            placeholder='Search title, content, or AI keywords...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='search-input'
          />

          {searching && (
            <span className='search-loading'>Searching...</span>
          )}
        </div>

        {/* Action buttons */}
        <div className='dashboard-actions'>
          <button
            className='create-btn'
            onClick={handleCreateDocument}
            disabled={creating}
          >
            {creating ? 'Creating...' : '+ New Document'}
          </button>

          <button className='logout-btn' onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {/* Error message */}
      {error && <p className='dashboard-error'>{error}</p>}

      {/* Empty state */}
      {documents.length === 0 ? (
        <div className='empty-state'>
          <h2>No documents found</h2>

          <p>
            {searchQuery
              ? 'No document matches your search.'
              : 'Create your first collaborative document to get started.'}
          </p>

          {!searchQuery && (
            <button
              className='create-btn'
              onClick={handleCreateDocument}
            >
              Create First Document
            </button>
          )}
        </div>
      ) : (
        // Documents grid
        <div className='documents-grid'>
          {documents.map(doc => (
            <article
              key={doc._id}
              className='document-card'
              onClick={() => openDocument(doc._id)}
            >
              {/* Card header */}
              <div className='document-card-header'>
                <span className='document-badge'>
                  {doc.visibility}
                </span>

                {doc.isFavorite && (
                  <span className='favorite-badge'>★</span>
                )}
              </div>

              {/* Title */}
              <h3>{doc.title}</h3>

              {/* Content preview */}
              <p className='document-preview'>
                {doc.content?.slice(0, 120) || 'Empty document'}
              </p>

              {/* Meta information */}
              <div className='document-meta'>
                <span>
                  Updated{' '}
                  {new Date(doc.updatedAt).toLocaleDateString()}
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