// routes/messageRoutes.js
import express from 'express';
import {
  getAllMessages,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
} from '../controllers/messageController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';
import { validateSchemaMiddleware } from '../middlewares/validateSchemaMiddleware.js';
import { messageSchema } from '../schemas/messageSchema.js';

const router = express.Router();

// Routes publiques (exemple)
router.get('/', getAllMessages);
router.get('/:id', getMessageById);

// Middleware d’authentification
router.use(authMiddleware);

// Middleware de rôle, ex. seulement ‘admin’ peut créer/éditer/supprimer
router.use(roleMiddleware(['admin']));

// Routes protégées
router.post('/', validateSchemaMiddleware(messageSchema), createMessage);
router.put('/:id', validateSchemaMiddleware(messageSchema), updateMessage);
router.delete('/:id', deleteMessage);

export default router;