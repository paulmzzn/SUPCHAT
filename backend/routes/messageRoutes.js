import express from 'express';
import { 
  createMessage, 
  getMessagesByChannel,
  deleteMessage, 
  updateMessage 
} from '../controllers/messageController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Toutes les routes sont protégées par l'authentification
router.post('/', verifyToken, createMessage);
router.get('/canal/:channelId', verifyToken, getMessagesByChannel);
router.put('/:messageId', verifyToken, updateMessage);
router.delete('/:messageId', verifyToken, deleteMessage);

export default router;
