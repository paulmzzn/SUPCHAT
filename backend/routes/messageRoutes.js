import express from "express";
import * as messageController from "../controllers/messageController.js";
import {
  verifyToken,
  checkCanalAccess,
  checkCanalWriteAccess,
} from "../middleware/authMiddleware.js";
import multer from "multer";

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         id_message:
 *           type: integer
 *         contenu:
 *           type: string
 *         date_creation:
 *           type: string
 *           format: date-time
 *         fk_utilisateur:
 *           type: integer
 *         fk_canal:
 *           type: integer
 *         parent_id:
 *           type: integer
 *         reactions:
 *           type: array
 *           items:
 *             type: object
 *     MessageInput:
 *       type: object
 *       properties:
 *         contenu:
 *           type: string
 *         canalId:
 *           type: integer
 *         workspaceId:
 *           type: integer
 *         parent_id:
 *           type: integer
 *         attachments:
 *           type: array
 *           items:
 *             type: integer
 * 
 * /messages:
 *   post:
 *     summary: Crée un nouveau message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageInput'
 *     responses:
 *       201:
 *         description: Message créé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé au canal
 *
 * /messages/canal/{channelId}:
 *   get:
 *     summary: Récupère les messages d'un canal
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du canal
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Nombre de messages à récupérer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Décalage pour la pagination
 *     responses:
 *       200:
 *         description: Messages du canal
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé au canal
 *
 * /messages/{id}:
 *   put:
 *     summary: Met à jour un message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du message
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contenu:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Message non trouvé
 *
 *   delete:
 *     summary: Supprime un message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID du message
 *     responses:
 *       204:
 *         description: Message supprimé
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Message non trouvé
 *
 * /messages/upload:
 *   post:
 *     summary: Upload un fichier avec un message
 *     tags: [Messages]
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
 *               canalId:
 *                 type: integer
 *               workspaceId:
 *                 type: integer
 *               contenu:
 *                 type: string
 *     responses:
 *       201:
 *         description: Fichier uploadé et message créé
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé au canal
 *
 * /messages/unread:
 *   get:
 *     summary: Récupère le nombre de messages non lus
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de messages non lus par canal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 channels:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Non autorisé
 *
 * /messages/mark-read:
 *   post:
 *     summary: Marque les messages comme lus
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               canalId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Messages marqués comme lus
 *       401:
 *         description: Non autorisé
 */

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
