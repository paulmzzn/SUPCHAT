import express from 'express';
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
  removeMember
} from '../controllers/workspaceController.js';

const router = express.Router();

router.post('/', createWorkspace);
router.get('/:id', getWorkspaceById);
router.get('/', getAllWorkspaces);
router.put('/:id', updateWorkspace);
router.delete('/:id', deleteWorkspace);
router.post('/:workspaceId/invite', sendWorkspaceInvitation);
router.get('/:workspaceId/members/:userId', checkWorkspaceMember);
router.get('/:workspaceId/members', getWorkspaceMembers);
router.post('/:workspaceId/join', joinWorkspace);
router.delete('/:workspaceId/members/:userId', removeMember);

export default router;