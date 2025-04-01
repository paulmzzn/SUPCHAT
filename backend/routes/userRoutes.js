import express from 'express';
import { registerUser, getAllUsers, loginUser, updateUser, deleteUser, sendInvitation, validateCode, validateUser, requestPasswordReset, resetPassword, resendValidationCode } from '../controllers/userController.js';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const router = express.Router();
// Utiliser une variable d'environnement ou une valeur par défaut
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

router.post('/register', registerUser);
router.get('/', getAllUsers);
router.post('/login', loginUser);
router.put('/update/:id', updateUser);
router.delete('/delete/:id', deleteUser);
router.post('/send-invitation', sendInvitation);
router.post('/validate-code', validateCode);
router.post('/resend-validation', resendValidationCode); // Ajout de la nouvelle route
router.get('/validate', validateUser);

router.post('/request-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:3001/login' }), 
  async (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { id: user.id_utilisateur, email: user.email },
      SECRET_KEY,
      { expiresIn: '7d' } // Augmenté à 7 jours
    );

    // Redirection directe vers le dashboard via AuthCallback
    res.redirect(
      `http://localhost:3001/auth/callback?token=${token}&email=${user.email}`
    );
  }
);

// Route pour vérifier la validité du token
router.get('/verify-token', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        
        // Calculer l'expiration restante en heures
        const currentTime = Math.floor(Date.now() / 1000);
        const timeRemaining = decoded.exp - currentTime;
        const hoursRemaining = Math.floor(timeRemaining / 3600);
        
        res.status(200).json({ 
            message: 'Token valid', 
            expires_in: hoursRemaining + ' hours',
            user_id: decoded.id,
            email: decoded.email
        });
    } catch (error) {
        res.status(401).json({ 
            message: 'Invalid token',
            error: error.message,
            error_type: error.name
        });
    }
});

export default router;