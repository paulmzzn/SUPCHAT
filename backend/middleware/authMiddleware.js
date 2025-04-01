import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Utiliser la même clé que dans tous les autres fichiers
const SECRET_KEY = process.env.JWT_SECRET || 'REDACTED';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  console.log("Headers reçus:", req.headers);
  
  if (!authHeader) {
    console.log("Pas d'en-tête d'autorisation trouvé");
    return res.status(401).json({ message: 'Accès refusé. Token non fourni.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    console.log("Token reçu:", token ? token.substring(0, 20) + "..." : "null");
    
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log("Token décodé:", decoded);
    
    // IMPORTANT: S'assurer que l'ID de l'utilisateur est bien dans req.user.id
    // Ce qui correspond à la structure attendue par getUserWorkspaces
    req.user = {
      id: decoded.id,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    console.error("Erreur de vérification du token:", error);
    return res.status(401).json({ 
      message: 'Token invalide.', 
      details: error.message 
    });
  }
};
