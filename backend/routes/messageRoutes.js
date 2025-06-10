import express from "express";
import * as messageController from "../controllers/messageController.js";
import {
  verifyToken,
  checkCanalAccess,
  checkCanalWriteAccess,
} from "../middleware/authMiddleware.js";
import multer from "multer";

const router = express.Router();

// Configuration de multer pour la gestion des fichiers
const storage = multer.memoryStorage(); // Stockage en mémoire pour traiter le fichier
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB
});

// Routes existantes - avec middleware de vérification des droits
router.post(
  "/",
  verifyToken,
  checkCanalWriteAccess,
  messageController.createMessage
);
router.get(
  "/canal/:channelId",
  verifyToken,
  checkCanalAccess,
  messageController.getMessagesByChannel
);

// Routes pour les notifications - placer AVANT les routes avec paramètres dynamiques
router.get("/unread/counts", verifyToken, messageController.getUnreadCounts);
router.get("/unread", verifyToken, messageController.getUnreadMessages);
router.get("/unread-by-workspace", verifyToken, messageController.getUnreadMessagesByWorkspace);
router.post("/channel/:channelId/read", verifyToken, checkCanalAccess, messageController.markChannelAsRead);

// Routes avec paramètres dynamiques - placer APRÈS les routes spécifiques
router.get("/:id", verifyToken, messageController.getMessageById);
router.put("/:messageId", verifyToken, messageController.updateMessage);
router.delete("/:id", verifyToken, messageController.deleteMessage);
router.post(
  "/upload",
  verifyToken,
  upload.single("file"),
  messageController.uploadFile
);

// Route pour l'upload de fichiers Google Drive
router.post(
  "/upload-google-drive",
  verifyToken,
  checkCanalWriteAccess,
  async (req, res) => {
    try {
      await messageController.uploadGoogleDriveFile(req, res);
    } catch (error) {
      console.error("Erreur route upload Google Drive:", error);
      res.status(500).json({
        message: "Erreur lors de l'upload Google Drive",
        error: error.message,
      });
    }
  }
);

export default router;
