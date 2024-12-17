import express from 'express';
import { registerUser, getAllUsers, loginUser } from '../controllers/userController.js';

const router = express.Router();

// Route pour l'enregistrement d'un utilisateur
router.post('/register', registerUser);

// Route pour lister tous les utilisateurs
router.get('/users', getAllUsers);

// Route pour la connexion
router.post('/login', loginUser);

export default router;