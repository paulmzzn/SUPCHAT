import express from "express";
import * as messageController from "../controllers/messageController.js";
import { verifyToken as authenticateToken } from "../middleware/authMiddleware.js";
import multer from "multer";

const router = express.Router();

// Configuration de multer pour la gestion des fichiers
const storage = multer.memoryStorage(); // Stockage en mémoire pour traiter le fichier
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB
});

// Routes existantes
router.post("/", authenticateToken, messageController.createMessage);
router.get("/canal/:channelId", authenticateToken, messageController.getMessagesByChannel);

// Routes pour les notifications - placer AVANT les routes avec paramètres dynamiques
router.get("/unread/counts", authenticateToken, messageController.getUnreadCounts);
router.get("/unread", authenticateToken, messageController.getUnreadMessages);
router.post("/channel/:channelId/read", authenticateToken, messageController.markChannelAsRead);

// Routes avec paramètres dynamiques - placer APRÈS les routes spécifiques
router.get("/:id", authenticateToken, messageController.getMessageById);
router.put("/:messageId", authenticateToken, messageController.updateMessage);
router.delete("/:id", authenticateToken, messageController.deleteMessage);
router.post("/upload", authenticateToken, upload.single("file"), messageController.uploadFile);

export default router;
