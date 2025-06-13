import express from 'express';
import { 
  addReaction,
  removeReaction,
  getReactions
} from '../controllers/privateMessageReactionController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     PrivateMessageReaction:
 *       type: object
 *       properties:
 *         id_reaction:
 *           type: integer
 *         type_reaction:
 *           type: string
 *         fk_utilisateur:
 *           type: integer
 *         fk_message_prive:
 *           type: integer
 *         date_creation:
 *           type: string
 *           format: date-time
 *
 * /private-messages/{messageId}/reactions:
 *   post:
 *     summary: Ajoute une réaction à un message privé
 *     tags: [Private Message Reactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du message privé
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type_reaction:
 *                 type: string
 *     responses:
 *       201:
 *         description: Réaction ajoutée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PrivateMessageReaction'
 *       401:
 *         description: Non autorisé
 *
 *   get:
 *     summary: Récupère les réactions d'un message privé
 *     tags: [Private Message Reactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du message privé
 *     responses:
 *       200:
 *         description: Liste des réactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PrivateMessageReaction'
 *       401:
 *         description: Non autorisé
 *
 * /private-messages/{messageId}/reactions/{reactionType}:
 *   delete:
 *     summary: Supprime une réaction d'un message privé
 *     tags: [Private Message Reactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du message privé
 *       - in: path
 *         name: reactionType
 *         schema:
 *           type: string
 *         required: true
 *         description: Type de réaction
 *     responses:
 *       204:
 *         description: Réaction supprimée
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Réaction non trouvée
 */

const router = express.Router();

// Toutes les routes sont protégées par l'authentification
router.post('/private-messages/:messageId/reactions', verifyToken, addReaction);
router.delete('/private-messages/:messageId/reactions/:reactionType', verifyToken, removeReaction);
router.get('/private-messages/:messageId/reactions', verifyToken, getReactions);

export default router;