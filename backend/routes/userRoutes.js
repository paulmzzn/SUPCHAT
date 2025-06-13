import express from "express";
import {
  registerUser,
  getAllUsers,
  loginUser,
  updateUser,
  deleteUser,
  sendInvitation,
  validateCode,
  validateUser,
  requestPasswordReset,
  resetPassword,
  resendValidationCode,
  getUserProfile,
  updateUserProfile,
  getUserById,
  exportRgpdData,
  changePassword,
  getUserActivityStats, // Import de la nouvelle fonction de contrôleur
} from "../controllers/userController.js";
import passport from "passport";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { verifyToken } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import pool from "../config/dbConnection.js"; // Ajout de l'import de pool
import { uploadToS3 } from "../config/s3Config.js"; // Import de la fonction d'upload S3
import { getJwtSecret } from "../config/secrets.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         nom:
 *           type: string
 *         email:
 *           type: string
 *         photo_de_profil:
 *           type: string
 *         statut:
 *           type: string
 *         date_creation:
 *           type: string
 *           format: date-time
 *     UserInput:
 *       type: object
 *       properties:
 *         nom:
 *           type: string
 *         email:
 *           type: string
 *         mot_de_passe:
 *           type: string
 *     LoginInput:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *         mot_de_passe:
 *           type: string
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 * 
 * /users/register:
 *   post:
 *     summary: Enregistre un nouvel utilisateur
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Utilisateur déjà existant
 *
 * /users:
 *   get:
 *     summary: Récupère tous les utilisateurs
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *
 * /users/login:
 *   post:
 *     summary: Connecte un utilisateur
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Identifiants invalides
 *
 * /users/update/{id}:
 *   put:
 *     summary: Met à jour un utilisateur
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Utilisateur non trouvé
 *
 * /users/delete/{id}:
 *   delete:
 *     summary: Supprime un utilisateur
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'utilisateur
 *     responses:
 *       204:
 *         description: Utilisateur supprimé
 *       404:
 *         description: Utilisateur non trouvé
 *
 * /users/send-invitation:
 *   post:
 *     summary: Envoie une invitation par email
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invitation envoyée
 *       400:
 *         description: Email invalide
 *
 * /users/validate-code:
 *   post:
 *     summary: Valide un code de vérification
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Code validé
 *       400:
 *         description: Code invalide
 *
 * /users/resend-validation:
 *   post:
 *     summary: Renvoie un code de validation
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Code renvoyé
 *       400:
 *         description: Email invalide
 *
 * /users/validate:
 *   get:
 *     summary: Valide un utilisateur via token
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Token de validation
 *     responses:
 *       200:
 *         description: Utilisateur validé
 *       400:
 *         description: Token invalide
 *
 * /users/request-reset:
 *   post:
 *     summary: Demande une réinitialisation de mot de passe
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email de réinitialisation envoyé
 *       404:
 *         description: Utilisateur non trouvé
 *
 * /users/reset-password:
 *   post:
 *     summary: Réinitialise le mot de passe
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé
 *       400:
 *         description: Token invalide
 *
 * /users/profile:
 *   get:
 *     summary: Récupère le profil de l'utilisateur connecté
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Non autorisé
 *
 * /users/profile/update:
 *   put:
 *     summary: Met à jour le profil utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profil mis à jour
 *       401:
 *         description: Non autorisé
 *
 * /users/verify-token:
 *   get:
 *     summary: Vérifie la validité du token
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valide
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: integer
 *                 email:
 *                   type: string
 *       401:
 *         description: Token invalide
 *
 * /users/{id}:
 *   get:
 *     summary: Récupère un utilisateur par ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Utilisateur non trouvé
 *
 * /users/auth/google:
 *   get:
 *     summary: Authentification Google OAuth
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirection vers Google
 *
 * /users/auth/google/callback:
 *   get:
 *     summary: Callback Google OAuth
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirection après authentification
 *
 * /users/auth/github:
 *   get:
 *     summary: Authentification GitHub OAuth
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirection vers GitHub
 *
 * /users/auth/github/callback:
 *   get:
 *     summary: Callback GitHub OAuth
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirection après authentification
 *
 * /users/export-rgpd:
 *   get:
 *     summary: Exporte les données RGPD de l'utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données RGPD exportées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Non autorisé
 *
 * /users/change-password:
 *   post:
 *     summary: Change le mot de passe de l'utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mot de passe changé
 *       400:
 *         description: Mot de passe actuel incorrect
 *       401:
 *         description: Non autorisé
 *
 * /users/activity-stats:
 *   get:
 *     summary: Récupère les statistiques d'activité de l'utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques d'activité
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Non autorisé
 */

// Configuration de multer pour le stockage en mémoire (pour S3)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // limite à 5 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Format de fichier non supporté. Utilisez JPG, PNG ou GIF.")
      );
    }
  },
});

// Charger les variables d'environnement
dotenv.config();

const router = express.Router();
// Utiliser le secret JWT depuis les secrets Docker
const SECRET_KEY = getJwtSecret();

router.post("/register", registerUser);
router.get("/", getAllUsers);
router.post("/login", loginUser);
router.put("/update/:id", updateUser);
router.delete("/delete/:id", deleteUser);
router.post("/send-invitation", sendInvitation);
router.post("/validate-code", validateCode);
router.post("/resend-validation", resendValidationCode); // Ajout de la nouvelle route
router.get("/validate", validateUser);

router.post("/request-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/auth/google/callback",

  passport.authenticate("google", {
    failureRedirect: "https://supchat.fr/login",
  }),

  async (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { id: user.id_utilisateur, email: user.email },
      SECRET_KEY, // Utiliser la même clé secrète que le middleware
      { expiresIn: "7d" } // Augmenté à 7 jours
    );

    // Redirection directe vers le direct-messages via AuthCallback
    res.redirect(
      `https://supchat.fr/auth/callback?token=${token}&email=${user.email}`
    );
  }
);

router.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/auth/github/callback",

  passport.authenticate("github", {
    failureRedirect: "https://supchat.fr/login",
  }),

  async (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { id: user.id_utilisateur, email: user.email },
      SECRET_KEY, // Utiliser la même clé secrète que le middleware
      { expiresIn: "7d" }
    );
    res.redirect(
      `https://supchat.fr/auth/callback?token=${token}&email=${user.email}`
    );
  }
);

// Route pour vérifier la validité du token
router.get("/verify-token", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    // Calculer l'expiration restante en heures
    const currentTime = Math.floor(Date.now() / 1000);
    const timeRemaining = decoded.exp - currentTime;
    const hoursRemaining = Math.floor(timeRemaining / 3600);

    res.status(200).json({
      message: "Token valid",
      expires_in: hoursRemaining + " hours",
      user_id: decoded.id,
      email: decoded.email,
    });
  } catch (error) {
    res.status(401).json({
      message: "Invalid token",
      error: error.message,
      error_type: error.name,
    });
  }
});

// Routes pour le profil utilisateur
router.get("/profile", verifyToken, getUserProfile);
router.put("/profile", verifyToken, upload.single("avatar"), updateUserProfile);

// Route d'export RGPD (données personnelles)
router.get("/rgpd-export", verifyToken, exportRgpdData);

// Route pour récupérer un utilisateur par ID (gère aussi l'alias "me")
router.get("/:id", verifyToken, getUserById);

// Route pour récupérer l'utilisateur courant (via token)
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await getUserById({ params: { id: req.user.id } }, res);
    // getUserById gère déjà la réponse
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération de l'utilisateur",
      error: error.message,
    });
  }
});

// Route pour récupérer les workspaces d'un utilisateur spécifique
router.get("/:id/workspaces", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Récupération des workspaces pour l'utilisateur: ${id}`);

    const result = await pool.query(
      `SELECT w.*, 
        r.nom_role as user_role,
        (SELECT COUNT(*) FROM membre_workspace mw2 WHERE mw2.fk_workspace = w.id_workspace) as total_members
       FROM workspace w
       JOIN membre_workspace mw ON w.id_workspace = mw.fk_workspace
       JOIN role r ON mw.fk_role = r.id_role
       WHERE mw.fk_utilisateur = $1
       ORDER BY w.date_creation DESC`,
      [id]
    );

    console.log(`Workspaces trouvés: ${result.rows.length}`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des workspaces de l'utilisateur:",
      error
    );
    res.status(500).json({
      message: "Erreur lors de la récupération des workspaces",
      error: error.message,
    });
  }
});

// Route pour supprimer un utilisateur (avec gestion en cascade)
router.delete("/:id", verifyToken, async (req, res) => {
  // Vérifier si l'utilisateur tente de supprimer son propre compte
  if (req.user.id !== req.params.id) {
    return res.status(403).json({
      message: "Vous ne pouvez supprimer que votre propre compte",
    });
  }

  await deleteUser(req, res);
});

// Route pour changer le mot de passe (utilisateur connecté)
router.post("/change-password", verifyToken, changePassword);

// Route pour les statistiques d'activité de l'utilisateur
router.get("/:id/activity-stats", verifyToken, getUserActivityStats);

export default router;
