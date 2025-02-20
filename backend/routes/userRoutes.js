import express from 'express';
import { registerUser, getAllUsers, loginUser, updateUser, deleteUser, sendInvitation, validateCode, validateUser, requestPasswordReset, resetPassword } from '../controllers/userController.js';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();
const SECRET_KEY = 'REDACTED'; // Remplace avec une clé secrète plus sécurisée dans un environnement variable

router.post('/register', registerUser);
router.get('/', getAllUsers);
router.post('/login', loginUser);
router.put('/update/:id', updateUser);
router.delete('/delete/:id', deleteUser);
router.post('/send-invitation', sendInvitation);
router.post('/validate-code', validateCode); // Add validate code route
router.get('/validate', validateUser);

router.post('/request-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  const user = req.user;
  const token = jwt.sign(
    { id: user.id_utilisateur, email: user.email },
    SECRET_KEY,
    { expiresIn: '1h' }
  );
  res.redirect(`http://localhost:3001/account?user=${encodeURIComponent(JSON.stringify(user))}&token=${token}`); // Redirect to the desired route after successful authentication
});

export default router;