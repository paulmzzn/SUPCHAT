import express from 'express';
import { registerUser, getAllUsers, loginUser, updateUser, deleteUser, sendInvitation, validateCode, validateUser, requestPasswordReset, resetPassword, resendValidationCode, getUserProfile, updateUserProfile } from '../controllers/userController.js';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { verifyToken } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configuration de multer pour le stockage des avatars
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename: function(req, file, cb) {
    const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFileName);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // limite à 5 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Utilisez JPG, PNG ou GIF.'));
    }
  }
});

// Charger les variables d'environnement
dotenv.config();

const router = express.Router();
// Utiliser une variable d'environnement ou une valeur par défaut
const SECRET_KEY = process.env.JWT_SECRET || 'REDACTED';

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
  passport.authenticate('google', { failureRedirect: 'http://192.168.1.125:3001/login' }), 
  async (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { id: user.id_utilisateur, email: user.email },
      SECRET_KEY,
      { expiresIn: '7d' } // Augmenté à 7 jours
    );

    // Redirection directe vers le dashboard via AuthCallback
    res.redirect(
      `http://192.168.1.125:3001/auth/callback?token=${token}&email=${user.email}`
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

// Routes pour le profil utilisateur
router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, upload.single('avatar'), updateUserProfile);

export default router;