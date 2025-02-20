import MessageModel from '../models/Message.js';

export const getMessagesByCanal = async (req, res) => {
    try {
        const { workspaceId, canalId } = req.params;
        if (!workspaceId || !canalId) {
            return res.status(400).json({ error: 'IDs du workspace et du canal requis' });
        }
        
        console.log('Récupération des messages pour le canal:', canalId, 'dans le workspace:', workspaceId);
        const messages = await MessageModel.getMessagesByCanal(canalId, workspaceId);
        console.log(`${messages.length} messages trouvés`);
        res.json(messages);
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
    }
};

export const createMessage = async (req, res) => {
    try {
        const { user_id, canal_id, content } = req.body;
        const message = await MessageModel.createMessage({ user_id, canal_id, content });
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la création du message' });
    }
};
