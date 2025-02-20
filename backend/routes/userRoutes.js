import express from 'express';
import { registerUser, getAllUsers, loginUser, updateUser, deleteUser, sendInvitation, validateCode, validateUser, requestPasswordReset, resetPassword } from '../controllers/userController.js';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();
const SECRET_KEY = 'your_secret_key'; // Remplace avec une clé secrète plus sécurisée dans un environnement variable

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
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login.html' }), (req, res) => {
  const user = req.user;
  const token = jwt.sign(
    { id: user.id_utilisateur, email: user.email },
    SECRET_KEY,
    { expiresIn: '48h' }
  );
  
  // Envoyer une page HTML avec un script qui stocke le token et redirige
  const htmlResponse = `
    <html>
      <script>
        localStorage.setItem('userToken', '${token}');
        localStorage.setItem('userId', '${user.id_utilisateur}');
        window.location.href = '/index.html';
      </script>
    </html>
  `;
  res.send(htmlResponse);
});

// Route pour vérifier la validité du token
router.get('/verify-token', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        jwt.verify(token, SECRET_KEY);
        res.status(200).json({ message: 'Token valid' });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

export default router;