import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/secrets.js";
import pool from "../config/dbConnection.js";
import Canal from "../models/Canal.js";

// Clé secrète sécurisée
const SECRET_KEY = getJwtSecret();

console.log("🔐 Middleware d'authentification configuré avec succès");

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
      return res.status(401).json({
        message: "Format de token invalide. Format attendu: 'Bearer TOKEN'",
      });
    }

    const token = bearer[1];

    if (!token || token.trim() === "") {
      console.log("Token vide reçu");
      return res.status(401).json({ message: "Token vide ou invalide." });
    }

    // Vérification préliminaire du format JWT (doit avoir 2 points)
    if (!token.includes(".") || token.split(".").length !== 3) {
      console.log(
        "Format JWT invalide (ne contient pas 3 segments):",
        token.substring(0, 20)
      );
      return res.status(401).json({
        message: "Format JWT invalide. Le token doit contenir 3 segments.",
      });
    }

    // Vérification du token avec la clé constante
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    console.error(
      "Erreur de vérification du token:",
      error.name,
      error.message
    );
    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ message: "Token JWT malformé ou invalide." });
    } else if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expiré. Veuillez vous reconnecter." });
    }
    return res
      .status(401)
      .json({ message: "Erreur d'authentification: " + error.message });
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

    if (token && token.trim() !== "" && token.split(".").length === 3) {
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

// Middleware pour vérifier l'appartenance à un workspace
export const checkWorkspaceMembership = async (req, res, next) => {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentification requise." });
    }

    // Récupérer l'ID du workspace depuis les paramètres de route
    const workspaceId = req.params.workspaceId || req.params.id;

    if (!workspaceId) {
      return res.status(400).json({ message: "ID de workspace non fourni." });
    }

    // Vérifier si l'utilisateur est membre du workspace
    const query = `
      SELECT COUNT(*) AS count 
      FROM membre_workspace 
      WHERE fk_utilisateur = $1 AND fk_workspace = $2
    `;

    const { rows } = await pool.query(query, [req.user.id, workspaceId]);

    if (rows[0].count === "0") {
      console.log(
        `Accès refusé: L'utilisateur ${req.user.id} n'est pas membre du workspace ${workspaceId}`
      );
      return res.status(403).json({
        message: "Vous n'êtes pas membre de ce workspace.",
        error: "workspace_access_denied",
      });
    }

    // Si l'utilisateur est membre, poursuivre
    next();
  } catch (error) {
    console.error(
      "Erreur lors de la vérification d'appartenance au workspace:",
      error
    );
    return res.status(500).json({
      message: "Erreur lors de la vérification d'accès au workspace.",
      error: error.message,
    });
  }
};

// Middleware pour vérifier si l'utilisateur est admin ou propriétaire d'un workspace
export const checkWorkspaceAdmin = async (req, res, next) => {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentification requise." });
    }

    // Récupérer l'ID du workspace depuis les paramètres de route
    const workspaceId = req.params.workspaceId || req.params.id;

    if (!workspaceId) {
      return res.status(400).json({ message: "ID de workspace non fourni." });
    }

    // Vérifier si l'utilisateur est admin ou propriétaire du workspace
    const query = `
      SELECT fk_role 
      FROM membre_workspace 
      WHERE fk_utilisateur = $1 AND fk_workspace = $2
    `;

    const { rows } = await pool.query(query, [req.user.id, workspaceId]);

    if (rows.length === 0 || (rows[0].fk_role !== 1 && rows[0].fk_role !== 2)) {
      // 1 = propriétaire, 2 = admin
      console.log(
        `Accès refusé: L'utilisateur ${req.user.id} n'est pas admin du workspace ${workspaceId}`
      );
      return res.status(403).json({
        message:
          "Permissions insuffisantes. Vous devez être administrateur ou propriétaire.",
        error: "insufficient_permissions",
      });
    }

    // Ajouter le rôle à la requête pour y accéder dans le contrôleur si nécessaire
    req.userWorkspaceRole = rows[0].fk_role;

    // Si l'utilisateur est admin ou propriétaire, poursuivre
    next();
  } catch (error) {
    console.error("Erreur lors de la vérification des permissions:", error);
    return res.status(500).json({
      message: "Erreur lors de la vérification des permissions.",
      error: error.message,
    });
  }
};

// Middleware pour vérifier l'accès à un canal selon les droits
export const checkCanalAccess = async (req, res, next) => {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentification requise." });
    }

    // Récupérer l'ID du canal depuis les paramètres de route
    const canalId = req.params.canalId || req.params.channelId;

    if (!canalId) {
      console.error(
        "checkCanalAccess: ID de canal manquant dans les paramètres",
        {
          params: req.params,
          url: req.originalUrl,
        }
      );
      return res.status(400).json({
        message: "ID de canal non fourni.",
        error: "canal_id_missing",
        params: req.params,
      });
    }

    // Utiliser la méthode du modèle Canal pour vérifier l'accès
    const accessCheck = await Canal.checkUserAccess(canalId, req.user.id);

    if (!accessCheck.hasAccess) {
      return res.status(403).json({
        message: accessCheck.message || "Accès refusé à ce canal privé.",
        error: "canal_access_denied",
      });
    }

    // Ajouter le type d'accès à la requête pour y accéder dans le contrôleur
    req.canalAccessType = accessCheck.accessType;
    req.isAdmin = accessCheck.isAdmin || false;

    // Si l'accès est autorisé, poursuivre
    next();
  } catch (error) {
    console.error("Erreur lors de la vérification d'accès au canal:", error);
    return res.status(500).json({
      message: "Erreur lors de la vérification d'accès au canal.",
      error: error.message,
    });
  }
};

// Middleware pour vérifier les droits d'écriture dans un canal
export const checkCanalWriteAccess = async (req, res, next) => {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentification requise." });
    }

    // Récupérer l'ID du canal depuis les paramètres de route
    const canalId = req.params.canalId;

    // Si pas trouvé dans les paramètres, chercher dans le body (pour POST /api/messages)
    if (!canalId && req.body && req.body.fk_canal) {
      canalId = req.body.fk_canal;
    }

    if (!canalId) {
      console.error("checkCanalWriteAccess: ID de canal manquant", {
        params: req.params,
        body: req.body,
        url: req.originalUrl,
        method: req.method,
      });
      return res.status(400).json({
        message: "ID de canal non fourni.",
        error: "canal_id_missing",
        debug: {
          params: req.params,
          hasBodyFkCanal: !!(req.body && req.body.fk_canal),
        },
      });
    }

    // Utiliser la méthode du modèle Canal pour vérifier l'accès
    const accessCheck = await Canal.checkUserAccess(canalId, req.user.id);

    if (!accessCheck.hasAccess) {
      return res.status(403).json({
        message: accessCheck.message || "Accès refusé à ce canal privé.",
        error: "canal_access_denied",
      });
    }

    // Vérifier que l'utilisateur a des droits d'écriture (lecture_ecriture)
    if (accessCheck.accessType !== "lecture_ecriture") {
      return res.status(403).json({
        message: "Vous n'avez pas les droits d'écriture dans ce canal.",
        error: "canal_write_access_denied",
        accessType: accessCheck.accessType,
      });
    }

    // Ajouter le type d'accès à la requête pour y accéder dans le contrôleur
    req.canalAccessType = accessCheck.accessType;
    req.isAdmin = accessCheck.isAdmin || false;

    // Si l'utilisateur a des droits d'écriture, poursuivre
    next();
  } catch (error) {
    console.error(
      "Erreur lors de la vérification des droits d'écriture au canal:",
      error
    );
    return res.status(500).json({
      message: "Erreur lors de la vérification des droits d'écriture au canal.",
      error: error.message,
    });
  }
};
