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
      console.log("Format de token invalide:", bearerHeader);
      return res.status(401).json({ message: "Format de token invalide. Format attendu: 'Bearer TOKEN'" });
    }
    
    const token = bearer[1];

    if (!token || token.trim() === "") {
      console.log("Token vide reçu");
      return res.status(401).json({ message: "Token vide ou invalide." });
    }

    // Vérification préliminaire du format JWT (doit avoir 2 points)
    if (!token.includes('.') || token.split('.').length !== 3) {
      console.log("Format JWT invalide (ne contient pas 3 segments):", token.substring(0, 20));
      return res.status(401).json({ message: "Format JWT invalide. Le token doit contenir 3 segments." });
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
    
    // Vérifier le format mais sans bloquer l'accès
    if (bearer.length !== 2 || bearer[0] !== "Bearer") {
      console.log("Format de token invalide dans optionalAuth:", bearerHeader);
      req.user = null;
      return next();
    }
    
    const token = bearer[1];

    if (token && token.trim() !== "" && token.split('.').length === 3) {
      const decoded = jwt.verify(token, SECRET_KEY);
      req.user = decoded;
    } else {
      console.log("Token vide ou malformé dans optionalAuth");
      req.user = null;
    }
  } catch (error) {
    console.error("Erreur optionalAuth:", error.name, error.message);
    req.user = null;
  }

  next();
};
