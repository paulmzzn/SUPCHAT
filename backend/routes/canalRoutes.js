import express from 'express';
import {
  createCanal,
  getCanalById,
  getAllWorkspaceCanals,
  updateCanal,
  deleteCanal
} from '../controllers/canalController.js';

const router = express.Router();

// Routes pour les canaux dans un workspace
router.post('/workspace/:workspaceId/canals', createCanal);
router.get('/workspace/:workspaceId/canals', getAllWorkspaceCanals);
router.get('/workspace/:workspaceId/canals/:canalId', getCanalById);
router.put('/workspace/:workspaceId/canals/:canalId', updateCanal);
router.delete('/workspace/:workspaceId/canals/:canalId', deleteCanal);

export default router;