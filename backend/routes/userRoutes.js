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
// Utiliser une variable d'environnement ou une valeur par défaut

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

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

    failureRedirect: "http://192.168.1.83:3001/login",

  }),

  async (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { id: user.id_utilisateur, email: user.email },
      SECRET_KEY,
      { expiresIn: "7d" } // Augmenté à 7 jours
    );

    // Redirection directe vers le direct-messages via AuthCallback
    res.redirect(
      `http://192.168.1.83:3001/auth/callback?token=${token}&email=${user.email}`
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

    failureRedirect: "http://192.168.1.83:3001/login",

  }),

  async (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { id: user.id_utilisateur, email: user.email },
      process.env.JWT_SECRET || "your_secret_key",
      { expiresIn: "7d" }
    );
    res.redirect(
      `http://192.168.1.83:3001/auth/callback?token=${token}&email=${user.email}`
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
