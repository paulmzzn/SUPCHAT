import express from 'express';
import {
  createCanal,
  getCanalById,
  getAllCanals,
  updateCanal,
  deleteCanal
} from '../controllers/canalController.js';

const router = express.Router();

router.post('/workspace/:id/canals', createCanal); // Mise à jour de la route de création
router.get('/canals/:id', getCanalById);
router.get('/canals', getAllCanals);
router.put('/workspace/:id/canals/:canalId', updateCanal); // Mise à jour de la route de modification
router.delete('/workspace/:id/canals/:canalId', deleteCanal); // Mise à jour de la route de suppression

export default router;