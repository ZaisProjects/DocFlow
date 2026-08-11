import express from 'express';

import authMiddleware from '../middleware/authMiddleware.js';

import { 
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  toggleFavorite,
  deleteDocument,
  getTrashDocuments,
  restoreDocument,
  shareDocument,
  getCollaborators,
  removeCollaborator,
  generatePublicLink,
  generateDocumentSummary,

 } from '../controllers/documentController.js';

const router = express.Router();

// Protect all document routes
router.use(authMiddleware);

// CREATE DOCUMENT
router.post('/', createDocument);

// GET MY DOCUMENTS
router.get('/', getDocuments);

// TRASH
router.get('/trash', getTrashDocuments);

// RESTORE
router.patch('/:id/restore', restoreDocument);

// TOGGLE FAVORITE
router.patch('/:id/favorite', toggleFavorite);

// Share Routes
router.post('/:id/share', shareDocument);
router.get('/:id/collaborators', getCollaborators);
router.delete('/:id/collaborators/:userId', removeCollaborator);

// PUBLIC LINK
router.post('/:id/public-link', generatePublicLink);

// AI SUMMARY
router.post('/:id/summary', generateDocumentSummary);

// DELETE (SOFT DELETE)
router.delete('/:id', deleteDocument);



// GET DOCUMENTS BY ID
router.get('/:id', getDocumentById);

// UPDATE DOCUMENT
router.patch('/:id', updateDocument);

router.put('/:id', updateDocument);


export default router;