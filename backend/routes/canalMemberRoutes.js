import express from 'express';
import { verifyToken, checkWorkspaceMembership } from '../middleware/authMiddleware.js';
import {
  getCanalMembers,
  addCanalMember,
  updateCanalMember,
  removeCanalMember
} from '../controllers/canalMemberController.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     CanalMember:
 *       type: object
 *       properties:
 *         id_utilisateur:
 *           type: integer
 *         nom:
 *           type: string
 *         email:
 *           type: string
 *         can_read:
 *           type: boolean
 *         can_write:
 *           type: boolean
 *         photo_de_profil:
 *           type: string
 *
 * /workspace/{workspaceId}/canals/{canalId}/members:
 *   get:
 *     summary: Récupère tous les membres d'un canal
 *     tags: [Canal Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du workspace
 *       - in: path
 *         name: canalId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du canal
 *     responses:
 *       200:
 *         description: Liste des membres du canal
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CanalMember'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 *
 *   post:
 *     summary: Ajoute un membre à un canal privé
 *     tags: [Canal Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du workspace
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
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               can_read:
 *                 type: boolean
 *               can_write:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Membre ajouté au canal
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 *
 * /workspace/{workspaceId}/canals/{canalId}/members/{userId}:
 *   put:
 *     summary: Met à jour les permissions d'un membre du canal
 *     tags: [Canal Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du workspace
 *       - in: path
 *         name: canalId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du canal
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               can_read:
 *                 type: boolean
 *               can_write:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Permissions mises à jour
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Membre non trouvé
 *
 *   delete:
 *     summary: Retire un membre d'un canal privé
 *     tags: [Canal Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du workspace
 *       - in: path
 *         name: canalId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du canal
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'utilisateur
 *     responses:
 *       204:
 *         description: Membre retiré du canal
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Membre non trouvé
 */

const router = express.Router();

// Routes pour la gestion des membres des canaux privés
// Récupérer tous les membres d'un canal
router.get('/workspace/:workspaceId/canals/:canalId/members', verifyToken, checkWorkspaceMembership, getCanalMembers);

// Ajouter un membre à un canal privé
router.post('/workspace/:workspaceId/canals/:canalId/members', verifyToken, checkWorkspaceMembership, addCanalMember);

// Mettre à jour les droits d'un membre
router.put('/workspace/:workspaceId/canals/:canalId/members/:memberId', verifyToken, checkWorkspaceMembership, updateCanalMember);

// Supprimer un membre d'un canal privé
router.delete('/workspace/:workspaceId/canals/:canalId/members/:memberId', verifyToken, checkWorkspaceMembership, removeCanalMember);

export default router;