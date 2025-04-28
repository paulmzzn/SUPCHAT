import express from 'express';
import { 
  addReaction,
  removeReaction,
  getReactions
} from '../controllers/reactionController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Toutes les routes sont protégées par l'authentification
router.post('/messages/:messageId/reactions', verifyToken, addReaction);
router.delete('/messages/:messageId/reactions/:reactionType', verifyToken, removeReaction);
router.get('/messages/:messageId/reactions', verifyToken, getReactions);

export default router;
