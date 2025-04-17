import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  sendPrivateMessage,
  getPrivateConversation,
  updatePrivateMessage,
  deletePrivateMessage,
  markPrivateMessageAsRead
} from '../controllers/privateMessageController.js';

const router = express.Router();

router.post('/', verifyToken, sendPrivateMessage);
router.get('/:userId', verifyToken, getPrivateConversation);
router.put('/message/:id', verifyToken, updatePrivateMessage);
router.delete('/message/:id', verifyToken, deletePrivateMessage);
router.post('/message/:id/read', verifyToken, markPrivateMessageAsRead);

export default router;
