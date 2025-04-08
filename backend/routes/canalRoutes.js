import express from 'express';
import { 
  createCanal, 
  getCanals, 
  getCanal, 
  updateCanal, 
  deleteCanal 
} from '../controllers/canalController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes pour les canaux
// Toutes les routes nécessitent une authentification
router.post('/workspace/:workspaceId/canals', verifyToken, createCanal);
router.get('/workspace/:workspaceId/canals', verifyToken, getCanals);
router.get('/workspace/:workspaceId/canals/:canalId', verifyToken, getCanal);
router.put('/workspace/:workspaceId/canals/:canalId', verifyToken, updateCanal);
router.delete('/workspace/:workspaceId/canals/:canalId', verifyToken, deleteCanal);

export default router;