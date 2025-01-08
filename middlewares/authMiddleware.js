// middlewares/authMiddleware.js
export function authMiddleware(req, res, next) {
    // Par exemple, vérifier la présence d’un token valide
    const isAuthenticated = true; // Remplace par une vraie logique
    if (!isAuthenticated) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    next();
  }