import api from '../api/axios';

// Create a new document
export async function createDocument(data) {
  const response = await api.post('/documents', data);
  console.log(response.data)
  return response.data.document;
}

// Get current user's documents
export async function getDocuments() {
  const response = await api.get('/documents');
  return response.data.documents;
}

// Get document by ID
export async function getDocumentById(id) {
  const response = await api.get(`/documents/${id}`);
  return response.data.document;
}

export async function updateDocument(id, data) {
  const response = await api.put(`/documents/${id}`, data);
  return response.data;
}

// Sharing of Docs.
export async function shareDocument(documentId, email, role = 'editor') {
  const response = await api.post(
    `/documents/${documentId}/share`,
    { email, role }
  );
  return response.data;
}

export async function getCollaborators(documentId) {
  const response = await api.get(
    `/documents/${documentId}/collaborators`
  );
  return response.data;
}

export async function removeCollaborator(documentId, userId) {
  const response = await api.delete(
    `/documents/${documentId}/collaborators/${userId}`
  );
  return response.data;
}

export async function updateCollaboratorRole(
  documentId,
  userId,
  role
) {
  const response = await api.patch(
    `/documents/${documentId}/collaborators/${userId}`,
    { role }
  );

  return response.data;
}

export async function generateDocumentSummary(documentId) {
  const token = localStorage.getItem('token');

  const response = await fetch(
    `http://localhost:5000/api/documents/${documentId}/summary`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to generate summary');
  }

  return data;
}

export async function searchDocuments(query) {
  const token = localStorage.getItem('token');

  const response = await fetch(
    `http://localhost:5000/api/search?q=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Search failed');
  }

  return response.json();
}
// Toggle Favorite
export async function toggleFavorite(id) {
  const token = localStorage.getItem('token');

  const response = await fetch(
    `http://localhost:5000/api/documents/${id}/favorite`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update favorite');
  }

  return data;
}

// Get trashed documents
export async function getTrashDocuments() {
  const token = localStorage.getItem('token');

  const res = await fetch(
    'http://localhost:5000/api/documents/trash',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to load trash');
  }

  return res.json();
}

// Restore document
export async function restoreDocument(id) {
  const token = localStorage.getItem('token');

  const res = await fetch(
    `http://localhost:5000/api/documents/${id}/restore`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to restore document');
  }

  return res.json();
}

// Move document to trash
export async function deleteDocument(id) {
  const token = localStorage.getItem('token');

  const res = await fetch(
    `http://localhost:5000/api/documents/${id}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to delete document');
  }

  return res.json();
}

// Permanently delete document
export async function permanentlyDeleteDocument(id) {
  const token = localStorage.getItem('token');

  const res = await fetch(
    `http://localhost:5000/api/documents/${id}/delete`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to permanently delete document');
  }

  return res.json();
}