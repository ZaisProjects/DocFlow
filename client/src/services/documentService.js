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