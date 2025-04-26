import MessagePrive from "../models/MessagePrive.js";
import Fichier from "../models/Fichier.js";

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
