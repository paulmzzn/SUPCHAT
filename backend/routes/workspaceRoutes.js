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
  getUserWorkspaces // Ajout de la nouvelle fonction
} from '../controllers/workspaceController.js';
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

// Route for image uploads, now using S3
router.post('/:workspaceId/images', upload.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'icon', maxCount: 1 }
]), uploadWorkspaceImages);

export default router;