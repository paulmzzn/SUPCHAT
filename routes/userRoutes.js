import express from 'express';
import { registerUser, getAllUsers, loginUser, updateUser, deleteUser, sendInvitation } from '../controllers/userController.js';
import passport from 'passport';

const router = express.Router();

router.post('/register', registerUser);
router.get('/', getAllUsers);
router.post('/login', loginUser);
router.put('/update/:id', updateUser);
router.delete('/delete/:id', deleteUser);
router.post('/send-invitation', sendInvitation);

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  res.redirect('/'); // Redirect to the desired route after successful authentication
});

export default router;