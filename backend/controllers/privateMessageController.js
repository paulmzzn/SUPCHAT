import MessagePrive from '../models/MessagePrive.js';

export const sendPrivateMessage = async (req, res) => {
  try {
    const expediteurId = req.user.id;
    const { destinataireId, contenu, replyToId } = req.body;
    if (!destinataireId || !contenu) {
      return res.status(400).json({ message: 'destinataireId et contenu requis' });
    }
    const message = await MessagePrive.create({
      contenu,
      fk_expediteur: expediteurId,
      fk_destinataire: destinataireId,
      parent_id: replyToId || null // Ajout du support pour les réponses
    });
    // Émission WebSocket (si besoin)
    const io = req.app.get('io');
    if (io) {
      io.to(`dm:${expediteurId}`).to(`dm:${destinataireId}`).emit('privateMessage', message);
    }
    res.status(201).json(message);
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
    if (!updated) return res.status(403).json({ message: "Modification refusée" });
    // Notifier l'autre utilisateur via socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`dm:${updated.fk_expediteur}`).to(`dm:${updated.fk_destinataire}`).emit('privateMessageUpdated', updated);
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
    if (!deleted) return res.status(403).json({ message: "Suppression refusée" });
    // Notifier l'autre utilisateur via socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`dm:${deleted.fk_expediteur}`).to(`dm:${deleted.fk_destinataire}`).emit('privateMessageDeleted', { id });
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
    const io = req.app.get('io');
    if (io) {
      io.to(`dm:${updated.fk_expediteur}`).emit('privateMessageRead', { id, date_lecture: updated.date_lecture });
    }
    res.json({ id, date_lecture: updated.date_lecture });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user.id;
    const counts = await MessagePrive.getUnreadCounts(userId);
    res.json(counts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
