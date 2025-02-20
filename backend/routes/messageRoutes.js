import express from 'express';
import { getMessagesByCanal, createMessage } from '../controllers/messageController.js';

const router = express.Router();

router.get('/workspace/:workspaceId/canal/:canalId', getMessagesByCanal);
router.post('/', createMessage);

export default router;
