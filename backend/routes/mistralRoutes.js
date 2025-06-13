import express from 'express';
import { 
  askMistralInChannel,
  askMistralPrivate,
  getMistralHistory
} from '../controllers/mistralController.js';
import { verifyToken, checkCanalAccess } from '../middleware/authMiddleware.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     MistralQuery:
 *       type: object
 *       properties:
 *         question:
 *           type: string
 *         workspaceId:
 *           type: integer
 *     MistralResponse:
 *       type: object
 *       properties:
 *         response:
 *           type: string
 *         messageId:
 *           type: integer
 *         timestamp:
 *           type: string
 *           format: date-time
 *
 * /mistral/channel/{canalId}/ask:
 *   post:
 *     summary: Pose une question à Mistral dans un canal
 *     tags: [Mistral AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: canalId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du canal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MistralQuery'
 *     responses:
 *       200:
 *         description: Réponse de Mistral
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MistralResponse'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé au canal
 *
 * /mistral/private/ask:
 *   post:
 *     summary: Pose une question à Mistral en message privé
 *     tags: [Mistral AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *     responses:
 *       200:
 *         description: Réponse de Mistral
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MistralResponse'
 *       401:
 *         description: Non autorisé
 *
 * /mistral/history:
 *   get:
 *     summary: Récupère l'historique des conversations avec Mistral
 *     tags: [Mistral AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historique des conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   question:
 *                     type: string
 *                   response:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Non autorisé
 */

const router = express.Router();

// Route pour poser une question à Mistral dans un canal
router.post('/channel/:canalId/ask', verifyToken, checkCanalAccess, askMistralInChannel);

// Route pour poser une question à Mistral en message privé
router.post('/private/ask', verifyToken, askMistralPrivate);

// Route pour récupérer l'historique des conversations avec Mistral
router.get('/history', verifyToken, getMistralHistory);

export default router;
