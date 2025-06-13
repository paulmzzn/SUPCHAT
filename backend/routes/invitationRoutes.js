import express from "express";
import { checkPendingInvitation } from "../controllers/userController.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     PendingInvitation:
 *       type: object
 *       properties:
 *         hasPendingInvitation:
 *           type: boolean
 *         workspaceId:
 *           type: integer
 *         workspaceName:
 *           type: string
 *         inviterName:
 *           type: string
 *         role:
 *           type: string
 *         token:
 *           type: string
 *
 * /invitations/pending:
 *   get:
 *     summary: Vérifie s'il y a une invitation en attente pour un email
 *     tags: [Invitations]
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: Adresse email à vérifier
 *     responses:
 *       200:
 *         description: Statut de l'invitation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PendingInvitation'
 *       400:
 *         description: Email manquant
 *       404:
 *         description: Aucune invitation en attente
 */

const router = express.Router();

// GET /api/invitations/pending?email=xxx
router.get("/pending", checkPendingInvitation);

export default router;
