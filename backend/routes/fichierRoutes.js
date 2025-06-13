import express from "express";
import multer from "multer";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import {
  verifyToken,
  checkWorkspaceMembership,
} from "../middleware/authMiddleware.js";
import Fichier from "../models/Fichier.js";
import path from "path";

/**
 * @swagger
 * components:
 *   schemas:
 *     Fichier:
 *       type: object
 *       properties:
 *         id_fichier:
 *           type: integer
 *         nom_fichier:
 *           type: string
 *         taille:
 *           type: integer
 *         type_mime:
 *           type: string
 *         url_s3:
 *           type: string
 *         date_creation:
 *           type: string
 *           format: date-time
 *         fk_utilisateur:
 *           type: integer
 *         fk_workspace:
 *           type: integer
 *
 * /fichiers/upload:
 *   post:
 *     summary: Upload un fichier vers S3
 *     tags: [Fichiers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               workspaceId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Fichier uploadé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Fichier'
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur lors de l'upload
 */
import { getS3Config } from "../config/secrets.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     Fichier:
 *       type: object
 *       properties:
 *         id_fichier:
 *           type: integer
 *         nom_fichier:
 *           type: string
 *         taille:
 *           type: integer
 *         type_mime:
 *           type: string
 *         url_s3:
 *           type: string
 *         date_creation:
 *           type: string
 *           format: date-time
 *         fk_utilisateur:
 *           type: integer
 *         fk_workspace:
 *           type: integer
 *
 * /fichiers/upload:
 *   post:
 *     summary: Upload un fichier vers S3
 *     tags: [Fichiers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               workspaceId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Fichier uploadé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Fichier'
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur lors de l'upload
 *
 * /fichiers/{fileId}:
 *   get:
 *     summary: Récupère un fichier par son ID
 *     tags: [Fichiers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du fichier
 *     responses:
 *       200:
 *         description: Informations du fichier
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Fichier'
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Fichier non trouvé
 *
 *   delete:
 *     summary: Supprime un fichier
 *     tags: [Fichiers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du fichier
 *     responses:
 *       204:
 *         description: Fichier supprimé
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Fichier non trouvé
 *
 * /fichiers/user:
 *   get:
 *     summary: Récupère les fichiers de l'utilisateur connecté
 *     tags: [Fichiers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des fichiers de l'utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Fichier'
 *       401:
 *         description: Non autorisé
 *
 * /fichiers/workspace/{workspaceId}:
 *   get:
 *     summary: Récupère les fichiers d'un workspace
 *     tags: [Fichiers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du workspace
 *     responses:
 *       200:
 *         description: Liste des fichiers du workspace
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Fichier'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé au workspace
 *
 * /fichiers/{fileId}/download:
 *   get:
 *     summary: Génère une URL de téléchargement sécurisée pour un fichier
 *     tags: [Fichiers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du fichier
 *     responses:
 *       200:
 *         description: URL de téléchargement
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 downloadUrl:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Fichier non trouvé
 */

const router = express.Router();

// Configuration S3 sécurisée avec secrets Docker
const s3Config = getS3Config();
const s3Client = new S3Client({
  region: s3Config.region,
  endpoint: s3Config.endpoint,
  credentials: {
    accessKeyId: s3Config.accessKeyId,
    secretAccessKey: s3Config.secretAccessKey,
  },
  forcePathStyle: true, // Requis pour Scaleway
});

const BUCKET_NAME = s3Config.bucketName;

// Configuration de multer pour le stockage en mémoire (avant envoi vers S3)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limite
  fileFilter: (req, file, cb) => {
    // Accepter tous les types de fichiers
    cb(null, true);
  },
});

// Route pour uploader un fichier (avec support pour les différents dossiers)
router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier fourni" });
    }

    const file = req.file;
    const fileId = uuidv4();
    const fileName = file.originalname;
    const fileExt = path.extname(fileName).substring(1); // Extension sans le point

    // Utiliser le paramètre de destination ou "general" par défaut
    const destination = req.body.destination || "general";

    // Valider la destination pour éviter les injections de chemin
    const validFolders = ["general", "images", "documents", "videos", "audio"];
    const folder = validFolders.includes(destination) ? destination : "general";

    const fileKey = `${folder}/${fileId}-${fileName}`;

    // Upload du fichier vers S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Créer l'enregistrement dans la base de données
    const fichierData = {
      nom_fichier: fileName,
      url: fileKey,
      type: file.mimetype,
      taille_fichier: file.size,
      extension: fileExt,
      mime_type: file.mimetype,
      fk_utilisateur: req.user.id,
    };

    const newFichier = await Fichier.create(fichierData);

    // Générer une URL présignée pour accéder au fichier
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    const presignedUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: 3600,
    }); // 1 heure

    res.status(201).json({
      message: "Fichier uploadé avec succès",
      fichier: {
        ...newFichier,
        presignedUrl,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'upload du fichier:", error);
    res.status(500).json({
      message: "Erreur lors de l'upload du fichier",
      error: error.message,
    });
  }
});

// Route pour récupérer les fichiers d'un utilisateur
router.get("/user", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const fichiers = await Fichier.getByUserId(userId);

    // Générer des URLs S3 complètes pour chaque fichier
    const fichiersWithUrls = fichiers.map((fichier) => ({
      ...fichier,
      url: `${s3Config.endpoint.replace(/\/$/, "")}/${s3Config.bucketName}/${
        fichier.url
      }`,
    }));

    res.status(200).json(fichiersWithUrls);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des fichiers utilisateur:",
      error
    );
    res.status(500).json({
      message: "Erreur lors de la récupération des fichiers",
      error: error.message,
    });
  }
});

// Route pour récupérer les fichiers d'un workspace
router.get(
  "/workspace/:workspaceId",
  verifyToken,
  checkWorkspaceMembership,
  async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const fichiers = await Fichier.getByWorkspaceId(workspaceId);

      // Générer des URLs S3 complètes pour chaque fichier
      const fichiersWithUrls = fichiers.map((fichier) => ({
        ...fichier,
        url: `${s3Config.endpoint.replace(/\/$/, "")}/${s3Config.bucketName}/${
          fichier.url
        }`,
      }));

      res.status(200).json(fichiersWithUrls);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des fichiers du workspace:",
        error
      );
      res.status(500).json({
        message: "Erreur lors de la récupération des fichiers",
        error: error.message,
      });
    }
  }
);

// Route pour récupérer un fichier spécifique
router.get("/:fichierIdOuNom", verifyToken, async (req, res) => {
  try {
    const { fichierIdOuNom } = req.params;

    // Essayer de récupérer par ID d'abord
    let fichier = null;
    if (!isNaN(fichierIdOuNom)) {
      fichier = await Fichier.findById(fichierIdOuNom);
    }

    if (!fichier) {
      return res.status(404).json({ message: "Fichier non trouvé" });
    }

    // Générer une URL présignée pour accéder au fichier
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fichier.url,
    });

    const presignedUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: 3600,
    });

    res.status(200).json({
      ...fichier,
      presignedUrl,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du fichier:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération du fichier",
      error: error.message,
    });
  }
});

// Route pour supprimer un fichier
router.delete("/:fichierId", verifyToken, async (req, res) => {
  try {
    const { fichierId } = req.params;
    const userId = req.user.id;

    // Supprimer de la base de données et récupérer les infos pour supprimer de S3
    const fichierDeleted = await Fichier.delete(fichierId, userId);

    if (!fichierDeleted) {
      return res.status(404).json({
        message:
          "Fichier non trouvé ou vous n'êtes pas autorisé à le supprimer",
      });
    }

    // Supprimer également de S3
    try {
      const deleteParams = {
        Bucket: BUCKET_NAME,
        Key: fichierDeleted.url,
      };

      await s3Client.send(new DeleteObjectCommand(deleteParams));

      res.status(200).json({ message: "Fichier supprimé avec succès" });
    } catch (s3Error) {
      console.error("Erreur lors de la suppression du fichier de S3:", s3Error);
      // On continue même si la suppression S3 échoue, car BD déjà nettoyée
      res.status(200).json({
        message:
          "Fichier supprimé de la base de données, mais erreur lors de la suppression du stockage",
        s3Error: s3Error.message,
      });
    }
  } catch (error) {
    console.error("Erreur lors de la suppression du fichier:", error);
    res.status(500).json({
      message: "Erreur lors de la suppression du fichier",
      error: error.message,
    });
  }
});

// Route pour associer un fichier à un message
router.post(
  "/link/message/:messageId/:fichierId",
  verifyToken,
  async (req, res) => {
    try {
      const { messageId, fichierId } = req.params;

      const association = await Fichier.addToMessage(messageId, fichierId);

      res.status(201).json({
        message: "Fichier associé au message avec succès",
        association,
      });
    } catch (error) {
      console.error(
        "Erreur lors de l'association du fichier au message:",
        error
      );
      res.status(500).json({
        message: "Erreur lors de l'association",
        error: error.message,
      });
    }
  }
);

// Route pour associer un fichier à un message privé
router.post(
  "/link/private-message/:messagePriveId/:fichierId",
  verifyToken,
  async (req, res) => {
    try {
      const { messagePriveId, fichierId } = req.params;

      const association = await Fichier.addToPrivateMessage(
        messagePriveId,
        fichierId
      );

      res.status(201).json({
        message: "Fichier associé au message privé avec succès",
        association,
      });
    } catch (error) {
      console.error(
        "Erreur lors de l'association du fichier au message privé:",
        error
      );
      res.status(500).json({
        message: "Erreur lors de l'association",
        error: error.message,
      });
    }
  }
);

export default router;
