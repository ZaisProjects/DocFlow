import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { API_BASE_URL } from '../config/api';

export default function PublicDocument() {
  const { shareLink } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/public/${shareLink}`
        );

        if (res.status === 403) {
          setError('private');
          return;
        }

        if (res.status === 404) {
          setError('notfound');
          return;
        }

        const data = await res.json();
        setDoc(data);
      } 
      catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [shareLink]);

  if (loading) return <p>Loading...</p>;

  if (error === 'private') {
    return (
      <div className="public-error">
        <h2>🔒 Private document</h2>
        <p>This document is no longer publicly accessible.</p>
      </div>
    );
  }

  if (error === 'notfound') {
    return (
      <div className="public-error">
        <h2>Document not found</h2>
        <p>The link is invalid or has been removed.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 20 }}>
      <h1>{doc.title}</h1>
      <p><strong>Owner:</strong> {doc.owner.name}</p>
      <div
        className='public-document-content'
        dangerouslySetInnerHTML={{ __html: doc.content }}
      />
    </div>
  );
}