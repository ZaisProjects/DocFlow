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

// DELETE (SOFT DELETE)
router.delete('/:id', deleteDocument);

// TOGGLE FAVORITE
router.patch('/:id/favorite', toggleFavorite);

// GET DOCUMENTS BY ID
router.get('/:id', getDocumentById);

// UPDATE DOCUMENT
router.patch('/:id', updateDocument);



export default router;