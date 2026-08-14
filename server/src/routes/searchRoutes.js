import express from 'express';
import { searchDocuments } from '../controllers/searchController.js';
import authenticate from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected search route
router.get('/', authenticate, searchDocuments);

export default router;