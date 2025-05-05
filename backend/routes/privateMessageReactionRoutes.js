import express from 'express';
import { 
  addReaction,
  removeReaction,
  getReactions
} from '../controllers/privateMessageReactionController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Toutes les routes sont protégées par l'authentification
router.post('/private-messages/:messageId/reactions', verifyToken, addReaction);
router.delete('/private-messages/:messageId/reactions/:reactionType', verifyToken, removeReaction);
router.get('/private-messages/:messageId/reactions', verifyToken, getReactions);

export default router;