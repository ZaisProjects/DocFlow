import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import '../styles/editor.css';
import socket from '../services/socket';
import { getDocumentById } from '../services/documentService';

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [saveStatus, setSaveStatus] = useState('saved');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  const typingTimeoutRef = useRef(null);

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
          onChange={e =>
            setDocument(prev => ({
              ...prev,
              title: e.target.value,
            }))
          }
          placeholder="Untitled document"
        />

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

        <textarea
          className="editor-textarea"
          value={document.content}
          onChange={e => {
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
    </div>
  );
}