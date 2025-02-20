import express from 'express';
import { addReaction, removeReaction, getReactions } from '../controllers/reactionController.js';

const router = express.Router();

router.post('/messages/:messageId/reactions', addReaction);
router.delete('/messages/:messageId/reactions', removeReaction);
router.get('/messages/:messageId/reactions', getReactions);

export default router;
