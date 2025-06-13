import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import pool from "../config/dbConnection.js";
import { google } from "googleapis";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * @swagger
 * components:
 *   schemas:
 *     GoogleDriveFile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         size:
 *           type: string
 *         mimeType:
 *           type: string
 *         downloadUrl:
 *           type: string
 *
 * /google-drive/auth:
 *   get:
 *     summary: Démarre l'authentification Google Drive
 *     tags: [Google Drive]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: URL d'authentification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authUrl:
 *                   type: string
 *       401:
 *         description: Non autorisé
 *
 * /google-drive/callback:
 *   post:
 *     summary: Traite le callback d'authentification Google Drive
 *     tags: [Google Drive]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authentification réussie
 *       401:
 *         description: Non autorisé
 *       400:
 *         description: Code d'autorisation invalide
 *
 * /google-drive/files:
 *   get:
 *     summary: Liste les fichiers Google Drive de l'utilisateur
 *     tags: [Google Drive]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pageToken
 *         schema:
 *           type: string
 *         description: Token pour la pagination
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Requête de recherche
 *     responses:
 *       200:
 *         description: Liste des fichiers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GoogleDriveFile'
 *                 nextPageToken:
 *                   type: string
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès Google Drive non configuré
 *
 * /google-drive/upload:
 *   post:
 *     summary: Upload un fichier Google Drive dans SUPCHAT
 *     tags: [Google Drive]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileId:
 *                 type: string
 *               fileName:
 *                 type: string
 *               canalId:
 *                 type: integer
 *               workspaceId:
 *                 type: integer
 *               contenu:
 *                 type: string
 *     responses:
 *       200:
 *         description: Fichier uploadé avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès Google Drive non configuré
 *       500:
 *         description: Erreur lors de l'upload
 */

// Récupération du chemin du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const router = express.Router();

// Configuration OAuth Google
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  "https://supchat.fr/api/users/auth/google/callback";

// Logs pour le debugging
console.log("Google Drive Configuration:");
console.log("- Client ID:", GOOGLE_CLIENT_ID ? "Configuré" : "Non configuré");
console.log(
  "- Client Secret:",
  GOOGLE_CLIENT_SECRET ? "Configuré" : "Non configuré"
);
console.log("- Redirect URI:", REDIRECT_URI);

// Route pour initier la connexion Google Drive avec Client ID personnalisé
router.post("/connect", verifyToken, async (req, res) => {
  try {
    const { clientId, clientSecret } = req.body;
    const userId = req.user.id;

    console.log("🚀 Initiation de la connexion Google Drive:");
    console.log("   - User ID:", userId);
    console.log("   - Informations utilisateur:", req.user);
    console.log(
      "   - Client ID fourni:",
      clientId ? clientId.substring(0, 20) + "..." : "Absent"
    );
    console.log(
      "   - Client Secret fourni:",
      clientSecret ? "✅ Présent" : "❌ Absent"
    );

    // Validation des paramètres
    if (!clientId || !clientSecret) {
      console.error(
        "❌ Paramètres manquants - Client ID ou Client Secret absent"
      );
      return res.status(400).json({
        message: "Client ID et Client Secret requis",
        error: "missing_credentials",
      });
    }

    // Vérifier que l'utilisateur existe dans la base de données
    const userCheck = await pool.query(
      "SELECT nom, email FROM utilisateur WHERE id_utilisateur = $1",
      [userId]
    );

    if (userCheck.rows.length === 0) {
      console.error("❌ Utilisateur non trouvé dans la base de données");
      return res.status(404).json({
        message: "Utilisateur non trouvé",
        error: "user_not_found",
      });
    }

    const user = userCheck.rows[0];
    console.log("👤 Utilisateur trouvé:", user.nom, `(${user.email})`);

    // Créer l'instance OAuth2 avec les credentials personnalisés
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      REDIRECT_URI
    );

    // Générer l'URL d'autorisation avec les scopes Google Drive
    const scopes = [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ];

    const stateData = { userId, clientId, clientSecret };
    console.log("🔗 Génération de l'URL d'autorisation...");
    console.log("   - Scopes:", scopes);
    console.log("   - Redirect URI:", REDIRECT_URI);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
      state: JSON.stringify(stateData), // Passer les infos dans le state
    });

    console.log("✅ URL d'autorisation générée avec succès");

    res.status(200).json({
      authUrl,
      message: "Connectez-vous à Google Drive via cette URL",
    });
  } catch (error) {
    console.error("Erreur lors de la génération de l'URL Google Drive:", error);
    res.status(500).json({
      message: "Erreur lors de la connexion Google Drive",
      error: error.message,
    });
  }
});

// Route de callback pour recevoir l'autorisation Google
router.get("/callback", async (req, res) => {
  try {
    const { code, state, error } = req.query;

    console.log("🔄 Callback Google Drive reçu:");
    console.log("   - Code:", code ? "✅ Présent" : "❌ Absent");
    console.log("   - State:", state ? "✅ Présent" : "❌ Absent");
    console.log("   - Error:", error || "Aucune");

    if (error) {
      console.error("❌ Erreur OAuth Google:", error);
      return res.redirect(
        `${
          process.env.FRONTEND_URL
        }/settings?error=oauth_error&message=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      console.error("❌ Paramètres manquants - Code ou State absent");
      return res.redirect(
        `${process.env.FRONTEND_URL}/settings?error=missing_parameters`
      );
    }

    // Décoder le state pour récupérer les informations utilisateur
    const stateData = JSON.parse(decodeURIComponent(state));
    const { userId, clientId, clientSecret } = stateData;

    console.log("🔓 Données du state décodées:");
    console.log("   - User ID:", userId);
    console.log(
      "   - Client ID:",
      clientId ? clientId.substring(0, 20) + "..." : "Absent"
    );
    console.log(
      "   - Client Secret:",
      clientSecret ? "✅ Présent" : "❌ Absent"
    );

    // Créer l'instance OAuth2 avec les credentials stockés
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      REDIRECT_URI
    );

    // Échanger le code contre les tokens
    console.log("🔄 Échange du code contre les tokens...");
    const { tokens } = await oauth2Client.getToken(code);

    console.log("🎫 Tokens reçus:");
    console.log(
      "   - Access Token:",
      tokens.access_token
        ? `✅ Présent (${tokens.access_token.substring(0, 20)}...)`
        : "❌ Absent"
    );
    console.log(
      "   - Refresh Token:",
      tokens.refresh_token
        ? `✅ Présent (${tokens.refresh_token.substring(0, 20)}...)`
        : "❌ Absent"
    );
    console.log("   - Expires in:", tokens.expires_in, "secondes");

    // Vérifier que nous avons les tokens nécessaires
    if (!tokens.access_token) {
      throw new Error("Aucun token d'accès reçu");
    }

    // Calculer la date d'expiration
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    console.log("⏰ Token expire le:", expiresAt);

    // Mettre à jour la base de données avec les tokens OAuth
    console.log("💾 Mise à jour de la base de données...");
    const updateResult = await pool.query(
      `
      UPDATE utilisateur 
      SET 
        google_drive_access_token = $1,
        google_drive_refresh_token = $2,
        google_drive_token_expires_at = $3,
        google_drive_connected_at = CURRENT_TIMESTAMP,
        google_drive_client_id = $4,
        google_drive_enabled = true
      WHERE id_utilisateur = $5
      RETURNING nom, email
    `,
      [
        tokens.access_token,
        tokens.refresh_token || null,
        expiresAt,
        clientId,
        userId,
      ]
    );

    if (updateResult.rows.length > 0) {
      const user = updateResult.rows[0];
      console.log("✅ Base de données mise à jour avec succès:");
      console.log("   - Utilisateur:", user.nom, `(${user.email})`);
      console.log("   - Google Drive connecté à:", new Date().toISOString());
    } else {
      console.error("❌ Aucun utilisateur trouvé avec l'ID:", userId);
    }

    console.log(
      `🎉 Google Drive connecté avec succès pour l'utilisateur ${userId}`
    );

    // Rediriger vers l'interface avec succès
    res.redirect(
      `${process.env.FRONTEND_URL}/settings?success=google_drive_connected`
    );
  } catch (error) {
    console.error("Erreur lors du callback Google Drive:", error);
    res.redirect(
      `${
        process.env.FRONTEND_URL
      }/settings?error=callback_error&message=${encodeURIComponent(
        error.message
      )}`
    );
  }
});

// Route pour vérifier le statut de la connexion Google Drive
router.get("/status", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(
      "🔍 Vérification du statut Google Drive pour l'utilisateur:",
      userId
    );
    console.log("🔍 Informations de l'utilisateur depuis le token:", req.user);

    // Vérifier d'abord si les colonnes Google Drive existent
    const checkColumns = await pool.query(`
      SELECT COUNT(*) as column_count
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'utilisateur' 
      AND column_name IN ('google_drive_enabled', 'google_drive_connected_at', 'google_drive_token_expires_at')
    `);

    console.log(
      "🔍 Nombre de colonnes Google Drive trouvées:",
      checkColumns.rows[0].column_count
    );

    // Si les colonnes n'existent pas encore, retourner un statut spécial
    if (checkColumns.rows[0].column_count < 3) {
      console.log(
        "⚠️ Les colonnes Google Drive n'existent pas encore dans la base de données"
      );
      return res.status(200).json({
        connected: false,
        connectedAt: null,
        tokenValid: false,
        expiresAt: null,
        hasClientId: false,
        needsDbSetup: true,
        message: "La base de données doit être configurée pour Google Drive",
      });
    } // Les colonnes existent, récupérer le statut normal
    const result = await pool.query(
      `
      SELECT 
        nom,
        email,
        google_drive_enabled,
        google_drive_connected_at,
        google_drive_token_expires_at,
        google_drive_client_id,
        google_drive_access_token,
        google_drive_refresh_token,
        CASE 
          WHEN google_drive_token_expires_at > CURRENT_TIMESTAMP THEN true
          ELSE false
        END as token_valid
      FROM utilisateur 
      WHERE id_utilisateur = $1
    `,
      [userId]
    );

    if (result.rows.length === 0) {
      console.log("❌ Utilisateur non trouvé dans la base de données");
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const status = result.rows[0];

    // Logs détaillés pour le débogage
    console.log("👤 Informations utilisateur récupérées:");
    console.log("   - Nom:", status.nom);
    console.log("   - Email:", status.email);
    console.log("   - Google Drive activé:", status.google_drive_enabled);
    console.log("   - Date de connexion:", status.google_drive_connected_at);
    console.log("   - Token expire le:", status.google_drive_token_expires_at);
    console.log(
      "   - Client ID:",
      status.google_drive_client_id ? "✅ Présent" : "❌ Absent"
    );
    console.log(
      "   - Access Token:",
      status.google_drive_access_token
        ? `✅ Présent (${status.google_drive_access_token.substring(0, 20)}...)`
        : "❌ Absent"
    );
    console.log(
      "   - Refresh Token:",
      status.google_drive_refresh_token
        ? `✅ Présent (${status.google_drive_refresh_token.substring(
            0,
            20
          )}...)`
        : "❌ Absent"
    );
    console.log("   - Token valide:", status.token_valid);

    res.status(200).json({
      connected: status.google_drive_enabled || false,
      connectedAt: status.google_drive_connected_at,
      tokenValid: status.token_valid || false,
      expiresAt: status.google_drive_token_expires_at,
      hasClientId: !!status.google_drive_client_id,
      needsDbSetup: false,
      // Informations de débogage (ne pas inclure les tokens complets pour la sécurité)
      debug: {
        userId: userId,
        userName: status.nom,
        userEmail: status.email,
        hasAccessToken: !!status.google_drive_access_token,
        hasRefreshToken: !!status.google_drive_refresh_token,
        clientIdPreview: status.google_drive_client_id
          ? status.google_drive_client_id.substring(0, 20) + "..."
          : null,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la vérification du statut Google Drive:",
      error
    );

    // Vérifier si l'erreur est due à une colonne manquante (erreur SQL)
    if (error.code === "42703") {
      // Code PostgreSQL pour "colonne non trouvée"
      return res.status(200).json({
        connected: false,
        connectedAt: null,
        tokenValid: false,
        expiresAt: null,
        hasClientId: false,
        needsDbSetup: true,
        message: "La base de données doit être configurée pour Google Drive",
      });
    }

    res.status(500).json({
      message: "Erreur lors de la vérification du statut",
      error: error.message,
    });
  }
});

// Route pour rafraîchir le token d'accès
router.post("/refresh-token", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer les informations OAuth de l'utilisateur
    const result = await pool.query(
      `
      SELECT 
        google_drive_refresh_token,
        google_drive_client_id
      FROM utilisateur 
      WHERE id_utilisateur = $1 AND google_drive_enabled = true
    `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Google Drive non configuré pour cet utilisateur",
      });
    }

    const { google_drive_refresh_token, google_drive_client_id } =
      result.rows[0];

    if (!google_drive_refresh_token) {
      return res.status(400).json({
        message: "Aucun refresh token disponible. Reconnexion requise.",
      });
    }

    // Créer l'instance OAuth2 et rafraîchir le token
    const oauth2Client = new google.auth.OAuth2(
      google_drive_client_id,
      null, // Client secret pas nécessaire pour le refresh
      REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: google_drive_refresh_token,
    });

    // Rafraîchir le token
    const { credentials } = await oauth2Client.refreshAccessToken();

    // Calculer la nouvelle date d'expiration
    const expiresAt = new Date(Date.now() + credentials.expires_in * 1000);

    // Mettre à jour la base de données
    await pool.query(
      `
      UPDATE utilisateur 
      SET 
        google_drive_access_token = $1,
        google_drive_token_expires_at = $2
      WHERE id_utilisateur = $3
    `,
      [credentials.access_token, expiresAt, userId]
    );

    res.status(200).json({
      message: "Token rafraîchi avec succès",
      expiresAt,
    });
  } catch (error) {
    console.error("Erreur lors du rafraîchissement du token:", error);
    res.status(500).json({
      message: "Erreur lors du rafraîchissement du token",
      error: error.message,
    });
  }
});

// Route pour déconnecter Google Drive
router.post("/disconnect", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Révoquer les tokens dans la base de données
    await pool.query(
      `
      UPDATE utilisateur 
      SET 
        google_drive_access_token = NULL,
        google_drive_refresh_token = NULL,
        google_drive_token_expires_at = NULL,
        google_drive_client_id = NULL,
        google_drive_enabled = false
      WHERE id_utilisateur = $1
    `,
      [userId]
    );

    res.status(200).json({
      message: "Google Drive déconnecté avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la déconnexion Google Drive:", error);
    res.status(500).json({
      message: "Erreur lors de la déconnexion",
      error: error.message,
    });
  }
});

// Route pour configurer la base de données (ajouter les colonnes Google Drive)
router.post("/setup-database", verifyToken, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est administrateur
    const userResult = await pool.query(
      `
      SELECT * FROM membre_workspace 
      JOIN role ON membre_workspace.fk_role = role.id_role 
      WHERE fk_utilisateur = $1 AND role.nom_role = 'admin'
      LIMIT 1
    `,
      [req.user.id]
    );

    // Si l'utilisateur n'est pas administrateur, refuser l'accès
    if (userResult.rows.length === 0) {
      return res.status(403).json({
        message:
          "Permission refusée. Seuls les administrateurs peuvent configurer la base de données.",
      });
    }

    // Chemin vers le fichier de migration
    const migrationFilePath = path.join(
      __dirname,
      "..",
      "db",
      "google_drive_migrations.sql"
    );

    // Lire le contenu du fichier SQL
    const sqlScript = fs.readFileSync(migrationFilePath, "utf8");

    // Exécuter le script SQL
    await pool.query(sqlScript);

    console.log("Migration Google Drive exécutée avec succès");

    res.status(200).json({
      success: true,
      message: "Base de données configurée pour Google Drive avec succès",
    });
  } catch (error) {
    console.error(
      "Erreur lors de la configuration de la base de données:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Erreur lors de la configuration de la base de données",
      error: error.message,
    });
  }
});

// Route pour uploader un fichier vers Google Drive
router.post("/upload", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileName, fileContent, mimeType, parentFolderId } = req.body;

    // Récupérer les tokens de l'utilisateur
    const result = await pool.query(
      `
      SELECT 
        google_drive_access_token,
        google_drive_refresh_token,
        google_drive_client_id,
        google_drive_token_expires_at
      FROM utilisateur 
      WHERE id_utilisateur = $1 AND google_drive_enabled = true
    `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Google Drive non configuré",
      });
    }

    const {
      google_drive_access_token,
      google_drive_client_id,
      google_drive_token_expires_at,
    } = result.rows[0];

    // Vérifier si le token est expiré
    if (new Date() >= new Date(google_drive_token_expires_at)) {
      return res.status(401).json({
        message: "Token expiré. Veuillez rafraîchir le token.",
      });
    }

    // Configurer l'API Google Drive
    const oauth2Client = new google.auth.OAuth2(google_drive_client_id);
    oauth2Client.setCredentials({ access_token: google_drive_access_token });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Créer le fichier sur Google Drive
    const fileMetadata = {
      name: fileName,
      parents: parentFolderId ? [parentFolderId] : undefined,
    };

    const media = {
      mimeType: mimeType,
      body: Buffer.from(fileContent, "base64"),
    };

    const driveResponse = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id,name,webViewLink,webContentLink",
    });

    res.status(200).json({
      message: "Fichier uploadé vers Google Drive avec succès",
      file: driveResponse.data,
    });
  } catch (error) {
    console.error("Erreur lors de l'upload vers Google Drive:", error);
    res.status(500).json({
      message: "Erreur lors de l'upload",
      error: error.message,
    });
  }
});

export default router;
