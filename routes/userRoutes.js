import express from 'express';
import { registerUser, getAllUsers, loginUser, updateUser,deleteUser } from '../controllers/userController.js';

const router = express.Router();

// Route pour l'enregistrement d'un utilisateur
router.post('/register', registerUser);

// Route pour lister tous les utilisateurs
router.get('/', getAllUsers);

// Route pour la connexion
router.post('/login', loginUser);

router.put('/update/:id', updateUser);

router.delete('/delete/:id', deleteUser);

export default router;