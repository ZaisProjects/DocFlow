import express from 'express';
import { getPublicDocument } from '../controllers/documentController.js';

const router = express.Router();

// Public document access (no auth middleware)
router.get('/:shareLink', getPublicDocument);

export default router;