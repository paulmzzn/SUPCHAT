import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  sendPrivateMessage,
  getPrivateConversation,
  updatePrivateMessage,
  deletePrivateMessage,
  markPrivateMessageAsRead,
  getUnreadCounts, // <-- Ajout ici
  deleteConversation, // <-- Ajout ici
  markAllMessagesAsRead, // <-- Ajout ici
  uploadGoogleDriveFile, // <-- Nouveau import
} from "../controllers/privateMessageController.js";
import { getPrivateMessageAttachments } from "../controllers/attachmentController.js";
import MessagePrive from "../models/MessagePrive.js";
import multer from "multer";
import { uploadToS3 } from "../config/s3Config.js";
import Fichier from "../models/Fichier.js";
import pool from "../config/dbConnection.js";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Multer config pour stockage en mémoire
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

// Route d'upload de fichier pour les messages privés
router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  try {
    console.log("Début de la route d'upload de fichier pour message privé");

    if (!req.file) {
      console.error("Aucun fichier fourni");
      return res.status(400).json({ message: "Aucun fichier fourni" });
    }

    console.log("Fichier reçu:", req.file.originalname);

    const { recipientId } = req.body;
    const expediteurId = req.user.id;

    console.log("Expéditeur ID:", expediteurId);
    console.log("Destinataire ID:", recipientId);

    if (!recipientId) {
      console.error("recipientId manquant");
      return res.status(400).json({ message: "recipientId requis" });
    }

    // Vérification des colonnes de la table fichier
    try {
      const tableInfo = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'fichier'
      `);

      console.log("Structure de la table fichier:", tableInfo.rows);

      // Vérifier si la colonne fk_utilisateur existe
      const hasUserColumn = tableInfo.rows.some(
        (col) => col.column_name === "fk_utilisateur"
      );
      if (!hasUserColumn) {
        console.error(
          "ATTENTION: La colonne fk_utilisateur n'existe pas dans la table fichier!"
        );
      }
    } catch (dbError) {
      console.error(
        "Erreur lors de la vérification de la structure de la table fichier:",
        dbError
      );
    } // Upload vers S3
    const s3Result = await uploadToS3(req.file, "private-messages/files");
    console.log("Fichier uploadé sur S3:", s3Result);

    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const fileType = req.file.mimetype;

    // Extraire l'extension du fichier
    const fileExtension = fileName.split(".").pop();

    // Créer l'entrée fichier en BDD - utiliser l'URL complète au lieu de seulement la clé
    const fichierData = {
      nom_fichier: fileName,
      url: s3Result.url, // URL complète S3 au lieu de seulement la clé
      type: fileType,
      taille_fichier: fileSize,
      extension: fileExtension,
      mime_type: fileType,
      fk_utilisateur: expediteurId,
    };

    console.log("Données fichier à insérer:", fichierData);

    // Créer le fichier en DB
    console.log("Tentative de création du fichier en DB");
    const newFichier = await Fichier.create(fichierData);
    console.log("Fichier créé en DB:", newFichier);

    // Créer le message privé avec le fichier
    const messageData = {
      contenu: req.body.message || "",
      fk_expediteur: expediteurId,
      fk_destinataire: recipientId,
      pieces_jointes: JSON.stringify([{ id: newFichier.id_fichier }]),
    };

    console.log("Création du message privé avec les données:", messageData);
    const newMessage = await MessagePrive.create(messageData);
    console.log("Message privé créé:", newMessage);

    // Associer le fichier au message privé
    console.log("Association du fichier au message privé");
    await Fichier.addToPrivateMessage(
      newMessage.id_message_prive,
      newFichier.id_fichier
    );
    console.log("Association réussie");    // Récupérer le message complet avec pièces jointes pour l'émission WebSocket
    const completeMessage = await MessagePrive.getById(newMessage.id_message_prive);
    
    // Récupérer explicitement les pièces jointes
    const attachments = await Fichier.getPrivateMessageAttachments(newMessage.id_message_prive);
    
    // Ajouter les pièces jointes au message
    completeMessage.attachments = attachments;
    
    // Enrichir le message avec les informations utilisateur pour le frontend
    const enrichedMessage = {
      ...completeMessage,
      nom: completeMessage.expediteur_nom,
      photo_de_profil: completeMessage.expediteur_photo,
    };

    // Envoyer une notification en temps réel via WebSocket (utiliser le bon format)
    const io = req.app.get("io");
    if (io) {
      io.to(`dm:${expediteurId}`)
        .to(`dm:${recipientId}`)
        .emit("privateMessage", enrichedMessage);
      console.log(`[PrivateMessage] Notification WebSocket envoyée avec ${attachments.length} pièces jointes`);
    }

    res.status(201).json({
      message: "Fichier uploadé et message privé créé",
      fichier: newFichier,
      message_prive: newMessage,
    });
  } catch (error) {
    console.error("Erreur détaillée upload fichier MP:", error);
    console.error("Stack trace:", error.stack);

    // Vérifier si l'erreur est liée à la base de données
    if (error.code) {
      console.error("Code d'erreur PostgreSQL:", error.code);
      console.error("Contrainte:", error.constraint);
      console.error("Detail:", error.detail);
      console.error("Schema:", error.schema);
      console.error("Table:", error.table);
      console.error("Colonne:", error.column);
    }

    res.status(500).json({
      message: "Erreur upload fichier MP",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

router.post("/", verifyToken, sendPrivateMessage);
// ATTENTION: place la route /conversations AVANT la route /:userId
router.get("/conversations", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await MessagePrive.getUserConversations(userId);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route optimisée qui retourne les conversations avec les infos utilisateur et derniers messages
router.get("/conversations-extended", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await MessagePrive.getUserConversationsExtended(
      userId
    );
    res.json(conversations);
  } catch (error) {
    console.error("Error in conversations-extended:", error);
    res.status(500).json({ message: error.message });
  }
});

// Route pour récupérer le nombre de messages privés non lus (doit être AVANT /:userId !)
router.get("/unread-counts", verifyToken, getUnreadCounts);

// Ajouter cette route pour supprimer une conversation entière
router.delete("/conversations/:userId", verifyToken, deleteConversation);

// Ajouter cette route pour marquer tous les messages d'une conversation comme lus
router.post("/:userId/read-all", verifyToken, markAllMessagesAsRead);

router.get("/:userId", verifyToken, getPrivateConversation);
router.put("/message/:id", verifyToken, updatePrivateMessage);
router.delete("/message/:id", verifyToken, deletePrivateMessage);
router.post("/message/:id/read", verifyToken, markPrivateMessageAsRead);

// Route pour récupérer les pièces jointes d'un message privé
router.get("/:messageId/attachments", verifyToken, getPrivateMessageAttachments);

// Route d'upload de fichier Google Drive pour les messages privés
router.post("/upload-google-drive", verifyToken, async (req, res) => {
  try {
    await uploadGoogleDriveFile(req, res);
  } catch (error) {
    console.error("Erreur route upload Google Drive MP:", error);
    res.status(500).json({
      message: "Erreur lors de l'upload Google Drive",
      error: error.message,
    });
  }
});

export default router;
