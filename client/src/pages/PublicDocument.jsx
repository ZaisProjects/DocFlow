import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function PublicDocument() {
  const { shareLink } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `http://localhost:5000/api/public/${shareLink}`
        );

        const data = await res.json();
        setDoc(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [shareLink]);

  if (loading) return <p>Loading...</p>;

  if (!doc) return <p>Document not found</p>;

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 20 }}>
      <h1>{doc.title}</h1>
      <p><strong>Owner:</strong> {doc.owner.name}</p>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{doc.content}</pre>
    </div>
  );
}