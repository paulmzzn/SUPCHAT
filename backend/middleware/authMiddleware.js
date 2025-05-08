import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Charger les variables d'environnement
dotenv.config();

// Définition d'une clé secrète constante
const SECRET_KEY = process.env.JWT_SECRET || "REDACTED";

export const verifyToken = (req, res, next) => {
  // Autoriser l'accès aux fichiers statiques sans authentification
  if (req.path.startsWith("/api/files/")) {
    console.log("[Auth] Accès aux fichiers autorisé sans token");
    return next();
  }

  // Récupération du token depuis les en-têtes Authorization
  const bearerHeader = req.headers["authorization"];

  if (!bearerHeader) {
    console.log("Pas d'en-tête d'autorisation trouvé");
    console.log("Headers reçus:", JSON.stringify(req.headers, null, 2));
    return res.status(401).json({ message: "Accès refusé. Token non fourni." });
  }

  try {
    // Format attendu: "Bearer TOKEN"
    const bearer = bearerHeader.split(" ");
    
    // Vérifier que le format est correct (Bearer + token)
    if (bearer.length !== 2 || bearer[0] !== "Bearer") {
      return res.status(401).json({ message: "Format de token invalide. Format attendu: 'Bearer TOKEN'" });
    }
    
    const token = bearer[1];

    if (!token || token.trim() === "") {
      return res.status(401).json({ message: "Token vide ou invalide." });
    }

    // Vérification du token avec la clé constante
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Erreur de vérification du token:", error.name, error.message);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token JWT malformé ou invalide." });
    } else if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expiré. Veuillez vous reconnecter." });
    }
    return res.status(401).json({ message: "Erreur d'authentification: " + error.message });
  }
};

// Middleware pour la vérification du token sans bloquer l'accès
export const optionalAuth = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];

  if (!bearerHeader) {
    req.user = null;
    return next();
  }

  try {
    const bearer = bearerHeader.split(" ");
    const token = bearer[1];

    if (token) {
      const decoded = jwt.verify(token, SECRET_KEY);
      req.user = decoded;
    } else {
      req.user = null;
    }
  } catch (error) {
    console.error("Erreur optionalAuth:", error.name, error.message);
    req.user = null;
  }

  next();
};
