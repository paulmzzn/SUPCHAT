import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { promises as fsPromises } from "fs";
import { v4 as uuidv4 } from "uuid";
import { verifyToken } from "../middleware/authMiddleware.js";
import Fichier from "../models/Fichier.js";
import { uploadToS3, deleteFromS3 } from "../config/s3Config.js";
import dotenv from "dotenv";
import { getPrivateMessageAttachments } from "../controllers/attachmentController.js";

dotenv.config();

const router = express.Router();

// Configuration de stockage temporaire pour multer
const uploadsDir = path.join(process.cwd(), "uploads", "temp");

// S'assurer que le répertoire de destination existe
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueFileName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFileName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limite
  fileFilter: (req, file, cb) => {
    // Accepter tous les types de fichiers
    cb(null, true);
  },
});

// Route pour uploader une pièce jointe
router.post(
  "/attachments/upload",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier fourni" });
      }

      const file = req.file;
      const fileExt = path.extname(file.originalname).substring(1); // Extension sans le point

      // Uploader le fichier vers Scaleway S3
      const fileUrl = await uploadToS3(
        {
          buffer: fs.readFileSync(file.path),
          originalname: file.originalname,
          mimetype: file.mimetype,
        },
        "attachments"
      );

      // Supprimer le fichier temporaire
      try {
        await fsPromises.unlink(file.path);
      } catch (err) {
        console.warn("Impossible de supprimer le fichier temporaire:", err);
      }

      // Enregistrer le fichier dans la base de données
      const fichierData = {
        nom_fichier: file.originalname,
        url: fileUrl,
        type: file.mimetype,
        taille_fichier: file.size,
        extension: fileExt,
        mime_type: file.mimetype,
        fk_utilisateur: req.user.id,
      };

      const newFichier = await Fichier.create(fichierData);

      res.status(201).json({
        message: "Fichier uploadé avec succès",
        attachment: {
          ...newFichier,
          presignedUrl: fileUrl,
        },
      });
    } catch (error) {
      console.error("Erreur lors de l'upload du fichier:", error);
      res.status(500).json({
        message: "Erreur lors de l'upload du fichier",
        error: error.message,
      });
    }
  }
);

// Route pour récupérer les pièces jointes d'un message
router.get(
  "/messages/:messageId/attachments",
  verifyToken,
  async (req, res) => {
    try {
      const { messageId } = req.params;

      const fichiers = await Fichier.getByMessageId(messageId);

      // Générer des URLs S3 complètes pour chaque pièce jointe
      const endpoint =
        process.env.SCW_ENDPOINT || "https://s3.fr-par.scw.cloud";
      const bucket = process.env.S3_BUCKET_NAME || "s3-supchat";
      const fichiersWithUrls = fichiers.map((fichier) => ({
        ...fichier,
        url: `${endpoint.replace(/\/$/, "")}/${bucket}/${fichier.url}`,
      }));

      res.status(200).json(fichiersWithUrls);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des pièces jointes:",
        error
      );
      res.status(500).json({
        message: "Erreur lors de la récupération des pièces jointes",
        error: error.message,
      });
    }
  }
);

// Route pour récupérer les pièces jointes d'un message privé
router.get(
  "/private-messages/:messagePriveId/attachments",
  verifyToken,
  async (req, res) => {
    try {
      const { messagePriveId } = req.params;

      const fichiers = await Fichier.getByPrivateMessageId(messagePriveId);

      // Générer des URLs S3 complètes pour chaque pièce jointe
      const endpoint =
        process.env.SCW_ENDPOINT || "https://s3.fr-par.scw.cloud";
      const bucket = process.env.S3_BUCKET_NAME || "s3-supchat";
      const fichiersWithUrls = fichiers.map((fichier) => ({
        ...fichier,
        url: `${endpoint.replace(/\/$/, "")}/${bucket}/${fichier.url}`,
      }));

      res.status(200).json(fichiersWithUrls);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des pièces jointes du message privé:",
        error
      );
      res.status(500).json({
        message: "Erreur lors de la récupération des pièces jointes",
        error: error.message,
      });
    }
  }
);

// Route pour récupérer les pièces jointes d'un message privé (nouvelle route)
router.get(
  "/attachments/private-messages/:messageId/attachments",
  verifyToken,
  getPrivateMessageAttachments
);

// Route pour supprimer une pièce jointe
router.delete("/attachments/:attachmentId", verifyToken, async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const userId = req.user.id;

    // Récupérer d'abord le fichier pour avoir l'URL S3
    const fichier = await Fichier.delete(attachmentId, userId);

    if (!fichier) {
      return res
        .status(404)
        .json({ message: "Pièce jointe non trouvée ou non autorisée" });
    }

    // Supprimer le fichier de S3
    try {
      await deleteFromS3(fichier.url);
    } catch (s3Error) {
      console.error("Erreur lors de la suppression du fichier S3:", s3Error);
      // Continuer même si la suppression S3 échoue
    }

    res.status(200).json({ message: "Pièce jointe supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la pièce jointe:", error);
    res.status(500).json({
      message: "Erreur lors de la suppression de la pièce jointe",
      error: error.message,
    });
  }
});

// Routes pour la gestion des fichiers depuis la barre de messages
router.post(
  "/message-attachment",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier fourni" });
      }

      const file = req.file;
      const { messageId } = req.body; // Si disponible
      const fileExt = path.extname(file.originalname).substring(1);

      // Uploader vers Scaleway S3
      const fileUrl = await uploadToS3(
        {
          buffer: fs.readFileSync(file.path),
          originalname: file.originalname,
          mimetype: file.mimetype,
        },
        "message-attachments"
      );

      // Supprimer le fichier temporaire
      try {
        await fsPromises.unlink(file.path);
      } catch (err) {
        console.warn("Impossible de supprimer le fichier temporaire:", err);
      }

      // Créer l'entrée fichier dans la BDD
      const fichierData = {
        nom_fichier: file.originalname,
        url: fileUrl,
        type: file.mimetype,
        taille_fichier: file.size,
        extension: fileExt,
        mime_type: file.mimetype,
        fk_utilisateur: req.user.id,
      };

      const newFichier = await Fichier.create(fichierData);

      // Si messageId est fourni, associer directement le fichier au message
      if (messageId) {
        await Fichier.addToMessage(messageId, newFichier.id_fichier);
      }

      res.status(201).json({
        message: "Fichier uploadé avec succès",
        fichier: {
          ...newFichier,
          presignedUrl: fileUrl,
        },
      });
    } catch (error) {
      console.error(
        "Erreur lors de l'upload du fichier depuis le message:",
        error
      );
      res.status(500).json({
        message: "Erreur lors de l'upload du fichier",
        error: error.message,
      });
    }
  }
);

export default router;
