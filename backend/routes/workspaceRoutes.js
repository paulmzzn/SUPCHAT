import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  createWorkspace,
  getWorkspaceById,
  getAllWorkspaces,
  updateWorkspace,
  deleteWorkspace,
  sendWorkspaceInvitation,
  checkWorkspaceMember,
  getWorkspaceMembers,
  joinWorkspace,
  removeMember,
  uploadWorkspaceImages,
  getUserWorkspaces,
  changeMemberRole,
  deleteWorkspaceCascade,
  requestJoinWorkspace,
  getWorkspaceJoinRequests,
  respondToJoinRequest,
  getUserJoinRequests
} from '../controllers/workspaceController.js';
import {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite
} from '../controllers/workspaceFavorisController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     Workspace:
 *       type: object
 *       properties:
 *         id_workspace:
 *           type: integer
 *         nom:
 *           type: string
 *         description:
 *           type: string
 *         is_private:
 *           type: boolean
 *         banner_url:
 *           type: string
 *         icon_url:
 *           type: string
 *         date_creation:
 *           type: string
 *           format: date-time
 *     WorkspaceInput:
 *       type: object
 *       properties:
 *         nom:
 *           type: string
 *         description:
 *           type: string
 *         is_private:
 *           type: boolean
 *
 * /workspaces:
 *   get:
 *     summary: Récupère tous les workspaces publics
 *     tags: [Workspaces]
 *     responses:
 *       200:
 *         description: Liste des workspaces
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Workspace'
 *       500:
 *         description: Erreur serveur
 *
 *   post:
 *     summary: Crée un nouveau workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkspaceInput'
 *     responses:
 *       201:
 *         description: Workspace créé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workspace'
 *       401:
 *         description: Non autorisé
 *
 * /workspaces/{id}:
 *   get:
 *     summary: Récupère un workspace par son ID
 *     tags: [Workspaces]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du workspace
 *     responses:
 *       200:
 *         description: Détails du workspace
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workspace'
 *       404:
 *         description: Workspace non trouvé
 *
 *   put:
 *     summary: Met à jour un workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du workspace
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkspaceInput'
 *     responses:
 *       200:
 *         description: Workspace mis à jour
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Workspace non trouvé
 *
 *   delete:
 *     summary: Supprime un workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du workspace
 *     responses:
 *       204:
 *         description: Workspace supprimé
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Workspace non trouvé
 */

const router = express.Router();

// Configure multer for memory storage (for S3 upload)
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Workspace:
 *       type: object
 *       properties:
 *         id_workspace:
 *           type: integer
 *         nom:
 *           type: string
 *         description:
 *           type: string
 *         is_private:
 *           type: boolean
 *         banner_url:
 *           type: string
 *         icon_url:
 *           type: string
 *         date_creation:
 *           type: string
 *           format: date-time
 *     WorkspaceInput:
 *       type: object
 *       properties:
 *         nom:
 *           type: string
 *         description:
 *           type: string
 *         is_private:
 *           type: boolean
 *     WorkspaceMember:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         nom:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [owner, admin, member]
 *         photo_de_profil:
 *           type: string
 *
 * /workspaces/user/workspaces:
 *   get:
 *     summary: Récupère les workspaces de l'utilisateur connecté
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des workspaces de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Workspace'
 *       401:
 *         description: Non autorisé
 *
 * /workspaces/{workspaceId}/favorites:
 *   post:
 *     summary: Ajoute un workspace aux favoris
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du workspace
 *     responses:
 *       201:
 *         description: Workspace ajouté aux favoris
 *       401:
 *         description: Non autorisé
 *
 *   delete:
 *     summary: Retire un workspace des favoris
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du workspace
 *     responses:
 *       204:
 *         description: Workspace retiré des favoris
 *       401:
 *         description: Non autorisé
 *
 * /workspaces/favorites:
 *   get:
 *     summary: Récupère les workspaces favoris de l'utilisateur
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des workspaces favoris
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Workspace'
 *       401:
 *         description: Non autorisé
 *
 * /workspaces:
 *   post:
 *     summary: Crée un nouveau workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkspaceInput'
 *     responses:
 *       201:
 *         description: Workspace créé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workspace'
 *       401:
 *         description: Non autorisé
 *
 *   get:
 *     summary: Récupère la liste de tous les workspaces publics
 *     tags: [Workspaces]
 *     responses:
 *       200:
 *         description: Liste des workspaces
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Workspace'
 *       500:
 *         description: Erreur serveur
 *
 * /workspaces/{id}:
 *   get:
 *     summary: Récupère un workspace par son ID
 *     tags: [Workspaces]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du workspace
 *     responses:
 *       200:
 *         description: Détails du workspace
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workspace'
 *       404:
 *         description: Workspace non trouvé
 *
 *   put:
 *     summary: Met à jour un workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du workspace
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkspaceInput'
 *     responses:
 *       200:
 *         description: Workspace mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workspace'
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Workspace non trouvé
 *
 *   delete:
 *     summary: Supprime un workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du workspace
 *     responses:
 *       204:
 *         description: Workspace supprimé
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Workspace non trouvé
 *
 * /workspaces/{workspaceId}/invite:
 *   post:
 *     summary: Invite un utilisateur dans un workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du workspace
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, member]
 *     responses:
 *       200:
 *         description: Invitation envoyée
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 *
 * /workspaces/{workspaceId}/members:
 *   get:
 *     summary: Récupère les membres d'un workspace
 *     tags: [Workspaces]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du workspace
 *     responses:
 *       200:
 *         description: Liste des membres
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WorkspaceMember'
 *       404:
 *         description: Workspace non trouvé
 *
 * /workspaces/{workspaceId}/members/{userId}:
 *   get:
 *     summary: Vérifie si un utilisateur est membre d'un workspace
 *     tags: [Workspaces]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du workspace
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Statut de membre
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isMember:
 *                   type: boolean
 *       404:
 *         description: Workspace ou utilisateur non trouvé
 *
 *   delete:
 *     summary: Retire un membre d'un workspace
 *     tags: [Workspaces]
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
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'utilisateur
 *     responses:
 *       204:
 *         description: Membre retiré
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 *
 * /workspaces/{workspaceId}/join:
 *   post:
 *     summary: Rejoint un workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du workspace
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token d'invitation (pour workspaces privés)
 *     responses:
 *       200:
 *         description: Workspace rejoint avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Workspace privé sans invitation valide
 */

// Route pour récupérer les workspaces d'un utilisateur authentifié
router.get('/user/workspaces', verifyToken, getUserWorkspaces);

// Routes pour les favoris
router.post('/:workspaceId/favorites', verifyToken, addFavorite);
router.delete('/:workspaceId/favorites', verifyToken, removeFavorite);
router.get('/favorites', verifyToken, getFavorites);
router.get('/:workspaceId/favorites/check', verifyToken, checkFavorite);

// Existing routes
router.post('/', verifyToken, createWorkspace); // Ajout de verifyToken
router.get('/:id', getWorkspaceById);
router.get('/', getAllWorkspaces);
router.put('/:id', verifyToken, updateWorkspace); // Ajout de verifyToken
router.delete('/:id', verifyToken, deleteWorkspace); // Ajout de verifyToken
router.post('/:workspaceId/invite', verifyToken, sendWorkspaceInvitation); // Ajout de verifyToken
router.get('/:workspaceId/members/:userId', checkWorkspaceMember);
router.get('/:workspaceId/members', getWorkspaceMembers);
router.post('/:workspaceId/join', verifyToken, joinWorkspace); // Ajout de verifyToken
router.delete('/:workspaceId/members/:userId', verifyToken, removeMember); // Ajout de verifyToken

// Changer le rôle d'un membre (owner only)
router.put('/:workspaceId/members/:userId/role', verifyToken, changeMemberRole);

// Suppression en cascade d'un workspace
router.delete('/:id/cascade', verifyToken, deleteWorkspaceCascade);

// Route for image uploads, now using S3
router.post('/:workspaceId/images', upload.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'icon', maxCount: 1 }
]), uploadWorkspaceImages);

// Route pour demander à rejoindre un workspace privé
router.post('/:workspaceId/request-join', verifyToken, requestJoinWorkspace);

// Route pour récupérer les demandes d'adhésion en attente
router.get('/:workspaceId/requests', verifyToken, getWorkspaceJoinRequests);

// Route pour répondre à une demande d'adhésion
router.put('/:workspaceId/requests/:requestId', verifyToken, respondToJoinRequest);

// Route pour récupérer les demandes d'adhésion d'un utilisateur
router.get('/user/requests', verifyToken, getUserJoinRequests);

export default router;