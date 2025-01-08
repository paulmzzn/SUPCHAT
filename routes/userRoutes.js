import express from 'express';
import { registerUser, getAllUsers, loginUser, updateUser,deleteUser, sendInvitation } from '../controllers/userController.js';

const router = express.Router();

router.post('/register', registerUser);

router.get('/', getAllUsers);

router.post('/login', loginUser);

router.put('/update/:id', updateUser);

router.delete('/delete/:id', deleteUser);

router.post('/send-invitation', sendInvitation);

export default router;