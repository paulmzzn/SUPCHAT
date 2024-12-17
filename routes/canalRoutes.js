import express from 'express';
import {
  createCanal,
  getCanalById,
  getAllCanals,
  updateCanal,
  deleteCanal
} from '../controllers/canalController.js';

const router = express.Router();

router.post('/canals', createCanal);
router.get('/canals/:id', getCanalById);
router.get('/canals', getAllCanals);
router.put('/canals/:id', updateCanal);
router.delete('/canals/:id', deleteCanal);

export default router;