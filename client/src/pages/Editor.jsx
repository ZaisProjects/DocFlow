import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaEdit } from "react-icons/fa";
import RichTextEditor from '../components/editor/TextEditorToolbar';
import { useToast } from '../contexts/ToastContext';
import ConfirmDialog from '../components/common/ConfirmDialog';
import '../styles/editor.css';

import socket from '../services/socket';
import {
  getDocumentById,
  updateDocument,
  shareDocument,
  getCollaborators,
  removeCollaborator,
  updateCollaboratorRole,
  generateDocumentSummary,
  downloadDocument,
} from '../services/documentService';

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { showToast, confirm } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [saveStatus, setSaveStatus] = useState('saved');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('editor');
  const [collaborators, setCollaborators] = useState([]);
  const [shareMessage, setShareMessage] = useState('');

  const [isReadOnly, setIsReadOnly] = useState(false);

  const [publicLink, setPublicLink] = useState('');

  const typingTimeoutRef = useRef(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [keywords, setKeywords] = useState([]);

  function askRemove(userId) {
    setSelectedUserId(userId);
    setDialogOpen(true);
  }

  // Current logged-in user
  const user = JSON.parse(localStorage.getItem('user'));

  // Load document from backend
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

  // Connect socket once
  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  // Join document room
  useEffect(() => {
    if (!document || !user) return;

    socket.emit('join-document', {
      documentId: id,
      user: {
        id: user.id,
        name: user.name,
      },
    });
  }, [document, id, user]);

  // Presence updates
  useEffect(() => {
    function handlePresence(users) {
      setOnlineUsers(users);
    }

    socket.on('presence-update', handlePresence);

    return () => {
      socket.off('presence-update', handlePresence);
    };
  }, []);

  // Realtime content updates
  useEffect(() => {
    function handleRemoteChange({ content }) {
      setDocument(prev => ({
        ...prev,
        content,
      }));
    }

    socket.on('receive-document-change', handleRemoteChange);

    return () => {
      socket.off('receive-document-change', handleRemoteChange);
    };
  }, []);

  // Typing indicators
  useEffect(() => {
    function handleTyping({ socketId, name }) {
      // Ignore events from this browser tab only
      if (socketId === socket.id) return;

      setTypingUsers(prev => {
        if (prev.includes(name)) return prev;
        return [...prev, name];
      });
    }

    function handleStopTyping({ socketId }) {
      // Remove all typing indicators when stop arrives
      setTypingUsers([]);
    }

    socket.on('user-typing', handleTyping);
    socket.on('user-stop-typing', handleStopTyping);

    return () => {
      socket.off('user-typing', handleTyping);
      socket.off('user-stop-typing', handleStopTyping);
    };
  }, []);

  useEffect(() => {
    if (!document) return;

    async function loadCollaborators() {
      try {
        const data = await getCollaborators(id);
        setCollaborators(data);
      } catch (error) {
        console.log(error.msg);
      }
    }

    loadCollaborators();
  }, [document, id]);


  async function handleShare(e) {
  e.preventDefault();

  try {
    setShareMessage('');

    const result = await shareDocument(
      id,
      shareEmail,
      shareRole
    );

    // setShareMessage(result.message);
    showToast(result.message, "success");
    setShareEmail('');

    const updated = await getCollaborators(id);
    setCollaborators(updated);
  } catch (error) {
    setShareMessage(
      error.response?.data?.message || 'Share failed'
    );
  }
}

async function handleGeneratePublicLink() {
  const token = localStorage.getItem('token');

  const res = await fetch(
    `http://localhost:5000/api/documents/${id}/public-link`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();

  setPublicLink(data.shareLink);
}
async function handleRemove(userId) {
  try {
    await removeCollaborator(id, userId);

    // Update UI immediately
    setCollaborators(prev =>
      prev.filter(c => c.user._id !== userId)
    );
  } 
  catch (error) {
    console.error(error);
  }
}

  useEffect(() => {
    if (!document) return;

    const storedUser = JSON.parse(
      localStorage.getItem('user')
    );

    const isOwner =
      document.owner?._id === storedUser.id ;

    const collaborator = document.collaborators?.find(
      c => c.user._id === storedUser.id
    );

    const canEdit =
      isOwner || collaborator?.role === 'editor';

    setIsReadOnly(!canEdit);
  }, [document]);

    useEffect(() => {
    function handleEditDenied(data) {
      showToast(data.message, 'error');
    }

    socket.on('edit-denied', handleEditDenied);

    return () => {
      socket.off('edit-denied', handleEditDenied);
    };
    }, []);

    async function handleTitleChange() {
      if (isReadOnly) return;

      try {
        await updateDocument(id, {
          title: document.title,
          content: document.content,
        });

        setSaveStatus('saved');
        showToast('Title updated', 'success');
      } catch (error) {
        console.error(error);
        showToast('Failed to update title', 'error');
      }
    }

    async function handleRoleChange(userId, role) {
      try {
        await updateCollaboratorRole(id, userId, role);

        setCollaborators(prev =>
          prev.map(c =>
            c.user._id === userId
              ? { ...c, role }
              : c
          )
        );
        showToast('Role Update Successful', 'success');
      } catch (error) {
          showToast(error.message, 'error');
      }
    }

  async function handleGenerateSummary() {
    try {
      setSummaryLoading(true);

      const data = await generateDocumentSummary(id);

      setSummary(data.summary);
      setKeywords(data.keywords || []);

      showToast('AI summary generated', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSummaryLoading(false);
    }
  }

function handleEditorChange(value) {
  if (isReadOnly) return;

  // Update local UI immediately
  setDocument(prev => ({
    ...prev,
    content: value,
  }));

  setSaveStatus('saving');

  // Send typing start
  socket.emit('typing-start', {
    documentId: id,
    userId: user.id,
    name: user.name,
  });

  // Debounced typing stop
  clearTimeout(typingTimeoutRef.current);

  typingTimeoutRef.current = setTimeout(() => {
    socket.emit('typing-stop', {
      documentId: id,
    });

    setSaveStatus('saved');
  }, 800);

  // Send realtime document change
  socket.emit('document-change', {
    documentId: id,
    content: value,
    userId: user.id,
  });
}

async function handleDownload(type) {
  try {
    await downloadDocument(id, type);

    showToast(
      `${type.toUpperCase()} downloaded successfully`,
      'success'
    );
  } catch (error) {
    showToast(error.message, 'error');
  }
}

  // Loading state
  if (loading) {
    return (
      <div className="editor-loading">
        <div className="spinner"></div>
        <p>Loading document...</p>
      </div>
    );
  }

  // Error state
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
      <header className="editor-topbar">
        <div className="topbar-left">
          <button
            className="back-btn"
            onClick={() => navigate('/dashboard')}
          >
            ← Dashboard
          </button>

          <div className="save-status">
            <span className="save-dot"></span>

            <span>
              {saveStatus === 'saving'
                ? 'Saving changes...'
                : 'Changes saved'}
            </span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="online-chip">
            <span className="online-dot"></span>
            {onlineUsers.length} online
          </div>

          <button
            className="panel-toggle-btn"
            onClick={() => setSidebarOpen(prev => !prev)}
          >
            {sidebarOpen ? 'Hide panel' : 'Show panel'}
          </button>
        </div>
      </header>

<main className={`editor-layout ${
    sidebarOpen ? 'with-sidebar' : 'without-sidebar'
  }`}>

  {/* Main editor area */}
  <section className="editor-main">
    <div className="title-section">
      <input
        className="editor-title"
        value={document.title}
        readOnly={isReadOnly}
        onChange={e => {
          setDocument(prev => ({
            ...prev,
            title: e.target.value,
          }));

          setSaveStatus('saving');
        }}
        onBlur={handleTitleChange}
      />
    </div>

    {typingUsers.length > 0 && (
      <div className="typing-banner">
        ✍ {typingUsers.join(', ')} typing...
      </div>
    )}

    {isReadOnly && (
      <div className="readonly-banner">
        You have <strong>view-only access</strong> to this document.
      </div>
    )}

    <section className="editor-surface">
      <RichTextEditor
        content={document.content}
        onChange={handleEditorChange}
        editable={!isReadOnly}
        placeholder="Start writing your notes..."
      />
    </section>

    <div className="editor-meta">
      <span>Visibility: {document.visibility}</span>
      <span>
        Last updated: {new Date(document.updatedAt).toLocaleString()}
      </span>
    </div>
  </section>

  {/* Collapsible sidebar */}
  {sidebarOpen && (
    <aside className="editor-sidebar">
      <h2>Document settings</h2>
      {/* Document settings */}
      <div className="sidebar-card">

        <label className="sidebar-label"><h3>Document title</h3></label>
        <input
          className="sidebar-input"
          value={document.title}
          readOnly={isReadOnly}
          onChange={e => {
            setDocument(prev => ({
              ...prev,
              title: e.target.value,
            }));

            setSaveStatus('saving');
          }}
          onBlur={handleTitleChange}
        />
      </div>
      {document.owner?._id === user.id && (
      <div className="sidebar-card">
        <label className='settings-label'><h3>Visibility</h3></label>
        <select className="visibility-select"
          value={document.visibility}
          onChange={async e => {
            const newVisibility = e.target.value;

            setDocument(prev => ({
              ...prev,
              visibility: newVisibility,
            }));

            try {
              await updateDocument(id, {
                title: document.title,
                content: document.content,
                visibility: newVisibility,
              });

              // Clear public link if document becomes private
              if (newVisibility === 'private') {
                setPublicLink('');
              }

              showToast('Visibility updated', 'success');
            } catch (error) {
              showToast('Failed to update visibility', 'error');
            }
          }}
        >
          <option value='private'>Private</option>
          <option value='public'>Public</option>
        </select>  
      </div>
      )}

      {/* AI Summary */}
      <div className="sidebar-card">
        <div className="sidebar-card-header">
          <h3>AI Summary(Mock Version)</h3>
          <button
            className="primary-btn small"
            onClick={handleGenerateSummary}
            disabled={summaryLoading}
          >
            {summaryLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {summary ? (
          <div className="summary-content compact">
            <p>{summary.replace(/<[^>]*>/g,"")}</p>
          </div>
        ) : (
          <p className="sidebar-muted">
            Generate a concise summary and keywords for this document.
          </p>
        )}
      </div>


      {/* Export */}
      <div className="sidebar-card">
        <h3>Export</h3>

        <div className="sidebar-actions">
          <button onClick={() => handleDownload('pdf')}>PDF</button>
          <button onClick={() => handleDownload('docx')}>DOCX</button>
          <button onClick={() => handleDownload('txt')}>TXT</button>
        </div>
      </div>

      {/* Online users */}
      <div className="sidebar-card">
        <div className="sidebar-card-header">
          <h3>Online now</h3>
          <span>{onlineUsers.length}</span>
        </div>

        <div className="presence-list">
          {onlineUsers.map((u, index) => (
            <div key={index} className="presence-item">
              <div className="presence-avatar">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <span>{u.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Share */}
      {document.owner?._id === user.id && (
        <div className="sidebar-card">
          <h3>Share document</h3>

          <form onSubmit={handleShare} className="sidebar-share-form">
            <input
              type="email"
              placeholder="Enter user email"
              value={shareEmail}
              onChange={e => setShareEmail(e.target.value)}
              required
            />

            <select
              value={shareRole}
              onChange={e => setShareRole(e.target.value)}
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>

            <button type="submit" className="primary-btn">
              Share
            </button>
          </form>

          {shareMessage && (
            <p className="share-message">{shareMessage}</p>
          )}
        </div>
      )}

      {/* Public sharing */}
      {document.owner?._id === user.id && (
      <div className="sidebar-card">
        <div className="sidebar-card-header">
          <h3>Public sharing</h3>
          <button
            className="primary-btn small"
            onClick={handleGeneratePublicLink}
          >
            Generate
          </button>
        </div>


        {publicLink ? (
          <div className="public-link-column">
            <input
              className="public-link-input"
              readOnly
              value={`${window.location.origin}/public/${publicLink}`}
            />

            <div className="sidebar-actions">
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${window.location.origin}/public/${publicLink}`
                  )
                }
              >
                Copy
              </button>

              <a
                className="open-link-btn"
                href={`/public/${publicLink}`}
                target="_blank"
                rel="noreferrer"
              >
                Open
              </a>
            </div>
          </div>
          ) : (
            <p className="sidebar-muted">
              Create a read-only link anyone can open.
            </p>
        )}
      </div>
      )}

      {/* Collaborators */}
      {document.owner?._id === user.id && (
        <div className="sidebar-card">
          <div className="sidebar-card-header">
            <h3>Collaborators</h3>
            <span>{collaborators.length}</span>
          </div>

          {collaborators.length === 0 ? (
            <p className="sidebar-muted">No collaborators yet</p>
          ) : (
            <div className="collaborators-list compact">
              {collaborators.map(c => (
                <div key={c.user._id} className="collaborator-item">
                  <div className="collaborator-info">
                    <strong>{c.user.name}</strong>
                    <p>{c.user.email}</p>
                  </div>

                  <div className="collaborator-actions">
                    <select
                      value={c.role}
                      onChange={e =>
                        handleRoleChange(c.user._id, e.target.value)
                      }
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                    </select>

                    <button
                      className="remove-collab-btn"
                      onClick={() => askRemove(c.user._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  )}
</main>

      <ConfirmDialog
        open={dialogOpen}
        title="Remove collaborator"
        message="This user will lose access to the document immediately."
        confirmText="Remove"
        cancelText="Cancel"
        danger
        onCancel={() => setDialogOpen(false)}
        onConfirm={async () => {
          try {
            await handleRemove(selectedUserId);
            showToast('Collaborator removed', 'success');
          } catch (error) {
            showToast('Failed to remove collaborator', 'error');
          } finally {
            setDialogOpen(false);
          }
        }}
      />
    </div>
  );
}