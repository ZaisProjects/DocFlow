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