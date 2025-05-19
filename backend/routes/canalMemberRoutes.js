import express from 'express';
import { verifyToken, checkWorkspaceMembership } from '../middleware/authMiddleware.js';
import {
  getCanalMembers,
  addCanalMember,
  updateCanalMember,
  removeCanalMember
} from '../controllers/canalMemberController.js';

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