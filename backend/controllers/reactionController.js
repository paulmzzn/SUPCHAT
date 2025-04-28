import MessageModel from '../models/Message.js';
import Reaction from '../models/Reaction.js';

// Ajouter une réaction à un message
export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reaction_type } = req.body;
    const userId = req.user.id;
    // On autorise désormais tous les emojis, donc pas de validation stricte
    if (!reaction_type || typeof reaction_type !== 'string' || reaction_type.length === 0) {
      return res.status(400).json({ message: 'Emoji/réaction manquant ou invalide' });
    }
    const message = await MessageModel.getById(messageId);
    if (!message) return res.status(404).json({ message: 'Message non trouvé' });

    await Reaction.create({
      fk_message: messageId,
      fk_utilisateur: userId,
      reaction_type
    });
    const updatedReactions = await Reaction.getByMessage(messageId, userId);
    const io = req.app.get('io');
    if (io) {
      io.to(`${message.fk_canal}`).emit('messageReaction', { messageId, reactions: updatedReactions });
    }
    res.status(201).json({ message: 'Réaction ajoutée', reactions: updatedReactions });
  } catch (error) {
    console.error('Erreur lors de l’ajout de la réaction:', error);
    res.status(500).json({ message: error.message });
  }
};

// Supprimer une réaction d'un message
export const removeReaction = async (req, res) => {
  try {
    const { messageId, reactionType } = req.params;
    const userId = req.user.id;
    const message = await MessageModel.getById(messageId);
    if (!message) return res.status(404).json({ message: 'Message non trouvé' });

    await Reaction.delete(messageId, userId, reactionType);
    const updatedReactions = await Reaction.getByMessage(messageId, userId);
    const io = req.app.get('io');
    if (io) {
      io.to(`${message.fk_canal}`).emit('messageReaction', { messageId, reactions: updatedReactions });
    }
    res.status(200).json({ message: 'Réaction supprimée', reactions: updatedReactions });
  } catch (error) {
    console.error('Erreur lors de la suppression de la réaction:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtenir toutes les réactions d'un message
export const getReactions = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await MessageModel.getById(messageId);
    if (!message) return res.status(404).json({ message: 'Message non trouvé' });
    const reactions = await Reaction.getByMessage(messageId);
    res.status(200).json(reactions);
  } catch (error) {
    console.error('Erreur lors de la récupération des réactions:', error);
    res.status(500).json({ message: error.message });
  }
};
