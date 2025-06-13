import express from "express";
import { searchInWorkspace } from "../controllers/searchController.js";
import { verifyToken, checkWorkspaceMembership } from "../middleware/authMiddleware.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     SearchResult:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [message, user, channel]
 *         id:
 *           type: integer
 *         content:
 *           type: string
 *         relevance:
 *           type: number
 *         metadata:
 *           type: object
 *
 * /search/workspace/{workspaceId}:
 *   get:
 *     summary: Recherche dans un workspace
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du workspace
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Terme de recherche
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, messages, users, channels]
 *         description: Type de contenu à rechercher
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Nombre maximum de résultats
 *     responses:
 *       200:
 *         description: Résultats de recherche
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SearchResult'
 *                 total:
 *                   type: integer
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé au workspace
 */

const router = express.Router();

// Protéger la route de recherche avec la vérification d'appartenance au workspace
router.get("/workspace/:workspaceId", verifyToken, checkWorkspaceMembership, searchInWorkspace);

export default router;
