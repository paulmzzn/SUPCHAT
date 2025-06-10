import express from 'express';
import { 
  askMistralInChannel,
  askMistralPrivate,
  getMistralHistory
} from '../controllers/mistralController.js';
import { verifyToken, checkCanalAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route pour poser une question à Mistral dans un canal
router.post('/channel/:canalId/ask', verifyToken, checkCanalAccess, askMistralInChannel);

// Route pour poser une question à Mistral en message privé
router.post('/private/ask', verifyToken, askMistralPrivate);

// Route pour récupérer l'historique des conversations avec Mistral
router.get('/history', verifyToken, getMistralHistory);

export default router;
