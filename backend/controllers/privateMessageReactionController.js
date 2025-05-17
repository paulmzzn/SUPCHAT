import MessagePrive from '../models/MessagePrive.js';
import ReactionPrive from '../models/ReactionPrive.js';

// Ajouter une réaction à un message privé
export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    // Accepter à la fois reaction_type et reaction pour la compatibilité mobile/web
    const { reaction_type, reaction } = req.body;
    const finalReactionType = reaction_type || reaction;
    const userId = req.user.id;
    
    if (!finalReactionType || typeof finalReactionType !== 'string' || finalReactionType.length === 0) {
      return res.status(400).json({ message: 'Emoji/réaction manquant ou invalide' });
    }
    
    const message = await MessagePrive.getById(messageId);
    if (!message) return res.status(404).json({ message: 'Message non trouvé' });

    // Vérifier que l'utilisateur est soit l'expéditeur soit le destinataire du message
    if (message.fk_expediteur !== userId && message.fk_destinataire !== userId) {
      return res.status(403).json({ message: 'Non autorisé à réagir à ce message' });
    }

    await ReactionPrive.create({
      fk_message_prive: messageId,
      fk_utilisateur: userId,
      reaction_type: finalReactionType
    });
    
    const updatedReactions = await ReactionPrive.getByMessage(messageId, userId);
    
    // Notification en temps réel via socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`dm:${message.fk_expediteur}`)
        .to(`dm:${message.fk_destinataire}`)
        .emit('privateMessageReaction', { messageId, reactions: updatedReactions });
    }
    
    res.status(201).json({ message: 'Réaction ajoutée', reactions: updatedReactions });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la réaction au message privé:', error);
    res.status(500).json({ message: error.message });
  }
};

// Supprimer une réaction d'un message privé
export const removeReaction = async (req, res) => {
  try {
    const { messageId, reactionType } = req.params;
    // Récupérer aussi le paramètre 'reaction' du corps si présent (compatibilité mobile)
    const { reaction } = req.body;
    const finalReactionType = reactionType || reaction;
    const userId = req.user.id;
    
    if (!finalReactionType) {
      return res.status(400).json({ message: 'Type de réaction manquant' });
    }
    
    const message = await MessagePrive.getById(messageId);
    if (!message) return res.status(404).json({ message: 'Message non trouvé' });

    await ReactionPrive.delete(messageId, userId, finalReactionType);
    const updatedReactions = await ReactionPrive.getByMessage(messageId, userId);
    
    // Notification en temps réel via socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`dm:${message.fk_expediteur}`)
        .to(`dm:${message.fk_destinataire}`)
        .emit('privateMessageReaction', { messageId, reactions: updatedReactions });
    }
    
    res.status(200).json({ message: 'Réaction supprimée', reactions: updatedReactions });
  } catch (error) {
    console.error('Erreur lors de la suppression de la réaction au message privé:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtenir toutes les réactions d'un message privé
export const getReactions = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    
    const message = await MessagePrive.getById(messageId);
    if (!message) return res.status(404).json({ message: 'Message non trouvé' });

    // Vérifier que l'utilisateur est soit l'expéditeur soit le destinataire du message
    if (message.fk_expediteur !== userId && message.fk_destinataire !== userId) {
      return res.status(403).json({ message: 'Non autorisé à voir les réactions de ce message' });
    }
    
    const reactions = await ReactionPrive.getByMessage(messageId, userId);
    res.status(200).json(reactions);
  } catch (error) {
    console.error('Erreur lors de la récupération des réactions du message privé:', error);
    res.status(500).json({ message: error.message });
  }
};