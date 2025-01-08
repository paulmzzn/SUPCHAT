// middlewares/roleMiddleware.js
export function roleMiddleware(allowedRoles) {
    return (req, res, next) => {
      // Ex: récupérer le rôle de l’utilisateur depuis req.user
      const userRole = 'admin'; // Remplace par la vraie logique
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: 'Accès interdit : rôle insuffisant' });
      }
      next();
    };
  }