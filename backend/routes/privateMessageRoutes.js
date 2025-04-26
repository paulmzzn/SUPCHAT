import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  sendPrivateMessage,
  getPrivateConversation,
  updatePrivateMessage,
  deletePrivateMessage,
  markPrivateMessageAsRead,
  getUnreadCounts // <-- ajout de l'import manquant
} from '../controllers/privateMessageController.js';
import MessagePrive from '../models/MessagePrive.js';

const router = express.Router();

router.post('/', verifyToken, sendPrivateMessage);
// ATTENTION: place la route /conversations AVANT la route /:userId
router.get('/conversations', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await MessagePrive.getUserConversations(userId);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get('/:userId', verifyToken, getPrivateConversation);
router.put('/message/:id', verifyToken, updatePrivateMessage);
router.delete('/message/:id', verifyToken, deletePrivateMessage);
router.post('/message/:id/read', verifyToken, markPrivateMessageAsRead);
// Ajout de la route pour récupérer les messages non lus par conversation
router.get('/unread-counts', verifyToken, getUnreadCounts);

export default router;
