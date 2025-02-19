import ReactionModel from '../models/Reaction.js';

export const addReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { userId, emoji } = req.body;

        if (!messageId || !userId || !emoji) {
            return res.status(400).json({ error: 'Tous les champs sont requis' });
        }

        const reaction = await ReactionModel.addReaction(messageId, userId, emoji);
        res.status(201).json(reaction);
    } catch (error) {
        console.error('Erreur lors de l\'ajout de la réaction:', error);
        res.status(500).json({ error: 'Erreur lors de l\'ajout de la réaction' });
    }
};

export const removeReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { userId, emoji } = req.body;

        const reaction = await ReactionModel.removeReaction(messageId, userId, emoji);
        if (!reaction) {
            return res.status(404).json({ error: 'Réaction non trouvée' });
        }
        res.json({ message: 'Réaction supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de la réaction:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression de la réaction' });
    }
};

export const getReactions = async (req, res) => {
    try {
        const { messageId } = req.params;
        const reactions = await ReactionModel.getReactions(messageId);
        res.json(reactions);
    } catch (error) {
        console.error('Erreur lors de la récupération des réactions:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des réactions' });
    }
};
