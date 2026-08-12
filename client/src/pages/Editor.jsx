import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaEdit } from "react-icons/fa";

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
} from '../services/documentService';

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { showToast } = useToast();

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
        showToast(error.message, 'error');
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
      <header className="editor-header">
        <button
          className="back-btn"
          onClick={() => navigate('/dashboard')}
        >
          ← Back
        </button>

        <div className="editor-header-right">
          {typingUsers.length > 0 && (
            <p className="typing-indicator-inline">
              {typingUsers.join(', ')} typing...
            </p>
          )}

          <div className="editor-status">
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && 'Saved'}
            {saveStatus === 'error' && 'Save failed'}
          </div>
        </div>
      </header>

      <main className="editor-container">
        <input
          className="editor-title"
          value={document.title}
          readOnly={isReadOnly}
          onChange={e =>
            setDocument({
              ...document,
              title: e.target.value,
            })
          }
        />
        <FaEdit
          size={20}
          onClick={() => setIsReadOnly(false)}
          style={{ cursor: "pointer" }}
        />
        <div className="public-link-card">
          <div className="public-link-header">
            <div>
              <h3>Public sharing</h3>
              <p>Create a read-only link that anyone can open.</p>
            </div>

            <button
              className="primary-btn"
              onClick={handleGeneratePublicLink}
            >
              Generate Link
            </button>
          </div>

          {publicLink && (
            <div className="public-link-row">
              <input
                className="public-link-input"
                readOnly
                value={`${window.location.origin}/public/${publicLink}`}
              />

              <button
                className="copy-btn"
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
          )}
        </div>

        <div className="editor-presence">
          <strong>Online: {onlineUsers.length}</strong>

          <div className="presence-list">
            {onlineUsers.map((u, index) => (
              <span key={index} className="presence-chip">
                {u.name}
              </span>
            ))}
          </div>
        </div>

        {document.owner?._id === user.id && (
          <section className="share-panel">
            <h3>Share document</h3>

              <form onSubmit={handleShare} className="share-form">
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

                <button type="submit">Share</button>
              </form>

                {shareMessage && (
                  <p className="share-message">{shareMessage}</p>
                )}

                <div className="collaborator-list">
                  <h3>Collaborators</h3>

                  <div className="collaborators-list">
                    {collaborators.length === 0 ? (
                      <p>No collaborators yet</p>
                    ) : (
                      collaborators.map(c => (
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

                            <button onClick={() => askRemove(c.user._id)}>
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            )}

        {isReadOnly && (
          <div className="readonly-banner">
            You have <strong>view-only access</strong> to this document.
          </div>
        )}

        <div className="ai-summary-card">
          <div className="ai-summary-header">
            <div>
              <h3>AI Summary</h3>
              <p>Generate a concise summary and keywords for this document.</p>
            </div>

            <button
              className="primary-btn"
              onClick={handleGenerateSummary}
              disabled={summaryLoading}
            >
              {summaryLoading ? 'Generating...' : 'Generate Summary'}
            </button>
          </div>

          {summary && (
            <div className="summary-content">
              <p>{summary}</p>
            </div>
          )}
        </div>

        <textarea
          className="editor-textarea"
          value={document.content}
          readOnly={isReadOnly}
          onChange={e => {
            if (isReadOnly) return;
            const value = e.target.value;

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
          }}
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