import MessagePrive from "../models/MessagePrive.js";
import Fichier from "../models/Fichier.js";
import { uploadToS3, deleteFromS3 } from "../config/s3Config.js";
import path from "path";

export const sendPrivateMessage = async (req, res) => {
  try {
    const expediteurId = req.user.id;
    const { destinataireId, contenu, attachments } = req.body;
    if (!destinataireId) {
      return res.status(400).json({ message: "destinataireId requis" });
    }

    // Créer le message
    const message = await MessagePrive.create({
      contenu: contenu || "", // Permettre des messages vides si des pièces jointes sont présentes
      fk_expediteur: expediteurId,
      fk_destinataire: destinataireId,
    });

    // Associer les pièces jointes si elles sont fournies
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      for (const attachmentId of attachments) {
        try {
          await Fichier.addToPrivateMessage(
            message.id_message_prive,
            attachmentId
          );
        } catch (error) {
          console.error(
            `Erreur lors de l'association de la pièce jointe ${attachmentId}:`,
            error
          );
        }
      }

      // Récupérer le message avec ses pièces jointes
      const fullMessage = await MessagePrive.getById(message.id_message_prive);

      // Émission WebSocket (si besoin)
      const io = req.app.get("io");
      if (io) {
        io.to(`dm:${expediteurId}`)
          .to(`dm:${destinataireId}`)
          .emit("privateMessage", fullMessage);
      }

      res.status(201).json(fullMessage);
    } else {
      // Émission WebSocket (si besoin)
      const io = req.app.get("io");
      if (io) {
        io.to(`dm:${expediteurId}`)
          .to(`dm:${destinataireId}`)
          .emit("privateMessage", message);
      }

      res.status(201).json(message);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPrivateConversation = async (req, res) => {
  try {
    const userA = req.user.id;
    const userB = req.params.userId;
    const messages = await MessagePrive.getConversation(userA, userB);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePrivateMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { contenu } = req.body;
    const updated = await MessagePrive.updateMessage(id, userId, contenu);
    if (!updated)
      return res.status(403).json({ message: "Modification refusée" });
    // Notifier l'autre utilisateur via socket.io
    const io = req.app.get("io");
    if (io) {
      io.to(`dm:${updated.fk_expediteur}`)
        .to(`dm:${updated.fk_destinataire}`)
        .emit("privateMessageUpdated", updated);
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePrivateMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const deleted = await MessagePrive.deleteMessage(id, userId);
    if (!deleted)
      return res.status(403).json({ message: "Suppression refusée" });
    // Notifier l'autre utilisateur via socket.io
    const io = req.app.get("io");
    if (io) {
      io.to(`dm:${deleted.fk_expediteur}`)
        .to(`dm:${deleted.fk_destinataire}`)
        .emit("privateMessageDeleted", { id });
    }
    res.json({ message: "Message supprimé", id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markPrivateMessageAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updated = await MessagePrive.markAsRead(id, userId);
    if (!updated) return res.status(403).json({ message: "Non autorisé" });
    // Notifier l'expéditeur via socket.io
    const io = req.app.get("io");
    if (io) {
      io.to(`dm:${updated.fk_expediteur}`).emit("privateMessageRead", {
        id,
        date_lecture: updated.date_lecture,
      });
    }
    res.json({ id, date_lecture: updated.date_lecture });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadAttachment = async (req, res) => {
  try {
    console.log("[PrivateMessage] Début de l'upload d'un fichier"); // Vérifier si nous avons un fichier et le destinataire    if (!req.file) {      return res.status(400).json({ message: "Aucun fichier fourni" });    }    const { recipientId, message } = req.body;    const expediteurId = req.user.id;    if (!recipientId) {      return res.status(400).json({ message: "recipientId requis" });    }    console.log("[PrivateMessage] Données reçues:", {      file: req.file.originalname,      recipientId,      expediteurId,      message: message || "(vide)"    });
    // Préparer les informations du fichier
    const file = req.file;
    const fileExt = path.extname(file.originalname).substring(1);

    // Upload vers S3 ou un autre service de stockage
    console.log("[PrivateMessage] Upload vers S3 en cours...");
    const fileKey = await uploadToS3(file, "private-messages/files");
    console.log("[PrivateMessage] Fichier uploadé avec succès:", fileKey);

    // Construire l'URL complète pour le front-end
    const baseUrl =
      process.env.BASE_URL || req.protocol + "://" + req.get("host");
    const fullUrl = fileKey; // Ou construisez une URL complète si nécessaire

    // Créer l'entrée fichier dans la base de données
    const fichierData = {
      nom_fichier: file.originalname,
      url: fileKey,
      type: file.mimetype,
      taille_fichier: file.size,
      extension: fileExt,
      mime_type: file.mimetype,
      fk_utilisateur: expediteurId,
    };

    console.log(
      "[PrivateMessage] Création de l'entrée fichier dans la BDD:",
      fichierData
    );
    const newFichier = await Fichier.create(fichierData);
    console.log("[PrivateMessage] Fichier créé en BDD:", newFichier);

    // Créer le message privé contenant le fichier
    const messageData = {
      contenu: message || "",
      fk_expediteur: expediteurId,
      fk_destinataire: recipientId,
    };

    console.log("[PrivateMessage] Création du message privé:", messageData);
    const newMessage = await MessagePrive.create(messageData);
    console.log("[PrivateMessage] Message créé:", newMessage);

    // Associer le fichier au message privé
    console.log("[PrivateMessage] Association du fichier au message");
    await Fichier.addToPrivateMessage(
      newMessage.id_message_prive,
      newFichier.id_fichier
    );
    console.log("[PrivateMessage] Association réussie");

    // Récupérer le message complet avec pièces jointes
    const completeMessage = await MessagePrive.getById(
      newMessage.id_message_prive
    );

    // Envoyer une notification en temps réel via WebSocket
    const io = req.app.get("io");
    if (io) {
      io.to(`dm:${recipientId}`).emit("privateMessage", {
        ...completeMessage,
        sender: {
          id: req.user.id,
          nom: req.user.nom,
          photo_de_profil: req.user.photo_de_profil,
        },
      });
      console.log("[PrivateMessage] Notification WebSocket envoyée");
    }

    res.status(201).json({
      message: "Fichier uploadé et message privé créé",
      fichier: {
        ...newFichier,
        presignedUrl: fullUrl, // URL complète pour accéder au fichier
      },
      message_prive: newMessage,
    });
  } catch (error) {
    console.error("[PrivateMessage] Erreur durant l'upload:", error);
    console.error("[PrivateMessage] Stack trace:", error.stack);

    // Log des détails supplémentaires pour les erreurs de base de données
    if (error.code) {
      console.error("[PrivateMessage] Code d'erreur DB:", error.code);
      console.error("[PrivateMessage] Détail:", error.detail);
    }

    res.status(500).json({
      message: "Erreur upload fichier MP",
      error: error.message,
    });
  }
};

// Récupérer le nombre de messages non lus par expéditeur
export const getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user.id;
    const counts = await MessagePrive.getUnreadCounts(userId);
    res.json(counts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer les conversations récentes d'un utilisateur
export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await MessagePrive.getUserConversations(userId);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Supprimer toute une conversation avec un utilisateur
 */
export const deleteConversation = async (req, res) => {
  try {
    const userId = req.user.id; // L'utilisateur qui fait la demande
    const otherUserId = req.params.userId; // L'autre utilisateur dans la conversation
    
    // Vérifier si les IDs sont valides
    if (!userId || !otherUserId) {
      return res.status(400).json({ message: "IDs utilisateurs requis" });
    }

    // Appeler le modèle pour effectuer la suppression
    const result = await MessagePrive.deleteConversation(userId, otherUserId);
    
    // Notifier les deux utilisateurs via socket.io si disponible
    const io = req.app.get("io");
    if (io) {
      io.to(`dm:${userId}`).to(`dm:${otherUserId}`)
        .emit("conversationDeleted", { 
          participants: [userId, otherUserId],
          deletedBy: userId
        });
    }
    
    res.json({ 
      message: "Conversation supprimée", 
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la conversation:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Marquer tous les messages d'un utilisateur comme lus
 */
export const markAllMessagesAsRead = async (req, res) => {
  try {
    const destinataireId = req.user.id; // L'utilisateur qui marque comme lu
    const expediteurId = req.params.userId; // L'expéditeur des messages
    
    // Vérifier si les IDs sont valides
    if (!destinataireId || !expediteurId) {
      return res.status(400).json({ message: "IDs utilisateurs requis" });
    }

    // Appeler le modèle pour marquer les messages comme lus
    const result = await MessagePrive.markAllAsRead(expediteurId, destinataireId);
    
    // Notifier l'expéditeur via socket.io si disponible
    const io = req.app.get("io");
    if (io && result.messages.length > 0) {
      io.to(`dm:${expediteurId}`).emit("allMessagesRead", {
        readBy: destinataireId,
        count: result.markedCount,
        timestamp: new Date()
      });
    }
    
    res.json({ 
      message: "Messages marqués comme lus", 
      count: result.markedCount,
      messageIds: result.messages.map(m => m.id_message_prive)
    });
  } catch (error) {
    console.error('Erreur lors du marquage des messages comme lus:', error);
    res.status(500).json({ message: error.message });
  }
}
