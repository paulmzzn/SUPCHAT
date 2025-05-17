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
  getUserWorkspaces, // Ajout de la nouvelle fonction
  changeMemberRole, // Ajout de la fonction pour changer le rôle d'un membre
  deleteWorkspaceCascade, // Ajout de la fonction pour la suppression en cascade
  requestJoinWorkspace, // Ajout de la fonction pour demander à rejoindre un workspace
  getWorkspaceJoinRequests, // Ajout de la fonction pour récupérer les demandes d'adhésion
  respondToJoinRequest // Ajout de la fonction pour répondre à une demande d'adhésion
} from '../controllers/workspaceController.js';
import {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite
} from '../controllers/workspaceFavorisController.js';
import { verifyToken } from '../middleware/authMiddleware.js'; // Importer le middleware d'authentification

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

export default router;