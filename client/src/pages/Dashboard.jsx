import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

import '../styles/dashboard.css';

import { useToast } from '../contexts/ToastContext';

import {
  getDocuments,
  createDocument,
  searchDocuments,
  getTrashDocuments,
  restoreDocument,
  deleteDocument,
  permanentlyDeleteDocument
} from '../services/documentService';

import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();


  //----------------- STATE----------------------

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

  // active tab: all | trash
  const [activeTab, setActiveTab] = useState('all');

  // trash documents
  const [trashDocuments, setTrashDocuments] = useState([]);

  // Custom confirmation dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    const { confirm, showToast } = useToast();

  // LOAD DOCUMENTS ON PAGE OPEN

  useEffect(() => {
    async function loadDocuments() {
      try {
        setLoading(true);

        const docs = await getDocuments();
        setDocuments(docs);
        setAllDocuments(docs);

        const trash = await getTrashDocuments();
        setTrashDocuments(trash);
      } catch (err) {
        console.error(err);
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, []);

  // CREATE NEW DOCUMENT
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

async function handleDeleteDocument(id) {
  const ok = await confirm({
    title: 'Move to trash',
    message: 'Move this document to trash?',
    confirmText: 'Move',
    cancelText: 'Cancel',
    type: 'warning',
  });

  if (!ok) return;

  try {
    await deleteDocument(id);

    const updated = documents.filter(d => d._id !== id);
    setDocuments(updated);
    setAllDocuments(updated);

    const trash = await getTrashDocuments();
    setTrashDocuments(trash);

    showMessage({
      title: 'Moved',
      message: 'Document moved to trash.',
      type: 'success',
    });
  } catch (err) {
    console.error(err);

    showMessage({
      title: 'Error',
      message: 'Failed to move document to trash.',
      type: 'error',
    });
  }
}

// Open custom confirmation dialog
function handleDeleteDocument(id) {
  setPendingDeleteId(id);
  setConfirmOpen(true);
}

// User confirmed delete
async function confirmDelete() {
  try {
    await deleteDocument(pendingDeleteId);

    // Remove from active list
    const updated = documents.filter(
      d => d._id !== pendingDeleteId
    );

    setDocuments(updated);
    setAllDocuments(updated);

    // Reload trash
    const trash = await getTrashDocuments();
    setTrashDocuments(trash);
  } catch (err) {
    console.error(err);
    setError('Failed to delete document');
  } finally {
    setConfirmOpen(false);
    setPendingDeleteId(null);
  }
}

// Restore document from trash
async function handleRestoreDocument(id) {
  try {
    await restoreDocument(id);

    setTrashDocuments(prev =>
      prev.filter(d => d._id !== id)
    );

    const docs = await getDocuments();
    setDocuments(docs);
    setAllDocuments(docs);

    showMessage({
      title: 'Restored',
      message: 'Document restored successfully.',
      type: 'success',
    });
  } catch (err) {
    console.error(err);

    showMessage({
      title: 'Error',
      message: 'Failed to restore document.',
      type: 'error',
    });
  }
}

// User cancelled delete
function cancelDelete() {
  setConfirmOpen(false);
  setPendingDeleteId(null);
}

// Permanently delete document from database
async function handlePermanentDelete(id) {
  const ok = await confirm({
    title: 'Delete permanently',
    message:
      'Delete this document permanently? This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
  });

  if (!ok) return;

  try {
    await permanentlyDeleteDocument(id);

    setTrashDocuments(prev =>
      prev.filter(d => d._id !== id)
    );

    showMessage({
      title: 'Deleted',
      message: 'Document deleted permanently.',
      type: 'success',
    });
  } catch (err) {
    console.error(err);

    showMessage({
      title: 'Error',
      message: 'Failed to delete document permanently.',
      type: 'error',
    });
  }
}

  // OPEN DOCUMENT
  function openDocument(id) {
    navigate(`/editor/${id}`);
  }

  // LOADING UI
  if (loading) {
    return (
      <div className='dashboard-loading'>
        <div className='spinner'></div>
        <p>Loading your workspace...</p>
      </div>
    );
  }

  // Documents to display based on selected tab
  const visibleDocuments =
    activeTab === 'trash'
      ? trashDocuments
      : documents;

  // MAIN UI
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

      <div className='dashboard-tabs'>
        <button
          className={activeTab === 'all' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('all')}
        >
          All Documents
        </button>

        <button
          className={activeTab === 'trash' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('trash')}
        >
          Trash ({trashDocuments.length})
        </button>
      </div>

      {/* Error message */}
      {error && <p className='dashboard-error'>{error}</p>}

      {/* Empty state */}
{visibleDocuments.length === 0 ? (
  <div className='empty-state'>
    <h2>
      {activeTab === 'trash'
        ? 'Trash is empty'
        : 'No documents found'}
    </h2>

    <p>
      {searchQuery
        ? 'No document matches your search.'
        : activeTab === 'trash'
        ? 'Deleted documents will appear here.'
        : 'Create your first collaborative document to get started.'}
    </p>

    {activeTab === 'all' && !searchQuery && (
      <button
        className='create-btn'
        onClick={handleCreateDocument}
      >
        Create First Document
      </button>
    )}
  </div>
) : (
  <div className='documents-grid'>
    {visibleDocuments.map(doc => (
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

        {/* Action buttons */}
        <div className='document-actions'>
          {activeTab === 'trash' ? (
            <div className='trash-actions'>
              <button
                className='restore-btn'
                onClick={e => {
                  e.stopPropagation();
                  handleRestoreDocument(doc._id);
                }}
              >
                Restore
              </button>

              <button
                className='delete-btn'
                onClick={e => {
                  e.stopPropagation();
                  handlePermanentDelete(doc._id);
                }}
              >
                Delete Permanently
              </button>
            </div>
          ) : (
            <button
              className='delete-btn'
              onClick={e => {
                e.stopPropagation();
                handleDeleteDocument(doc._id);
              }}
            >
              Move to Trash
            </button>
          )}
        </div>
      </article>
    ))}
  </div>
)}

{confirmOpen && (
  <div className='modal-overlay'>
    <div className='confirm-modal'>
      <h3>Move document to trash?</h3>

      <p>
        The document will be moved to Trash. You can restore it later.
      </p>

      <div className='confirm-actions'>
        <button
          className='confirm-cancel'
          onClick={cancelDelete}
        >
          Cancel
        </button>

        <button
          className='confirm-delete'
          onClick={confirmDelete}
        >
          Move to Trash
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}