import express from 'express';
import {
  createWorkspace,
  getWorkspaceById,
  getAllWorkspaces,
  updateWorkspace,
  deleteWorkspace
} from '../controllers/workspaceController.js';

const router = express.Router();

router.post('/', createWorkspace);
router.get('/:id', getWorkspaceById);
router.get('/', getAllWorkspaces);
router.put('/:id', updateWorkspace);
router.delete('/:id', deleteWorkspace);

export default router;