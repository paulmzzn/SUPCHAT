import MessageModel from '../models/Message.js';
import Canal from '../models/Canal.js';

// Créer un nouveau message
export const createMessage = async (req, res) => {
  try {
    const { fk_canal, contenu, parent_id } = req.body;
    const userId = req.user.id; // Récupéré du middleware auth
    
    console.log('Création de message:', { userId, fk_canal, contenu, parent_id });
    
    // Vérifier que le canal existe
    const canal = await Canal.findById(fk_canal);
    if (!canal) {
      return res.status(404).json({ message: 'Canal non trouvé' });
    }
    
    // Si parent_id est spécifié, vérifier que le message parent existe
    if (parent_id) {
      const parentMessage = await MessageModel.getById(parent_id);
      if (!parentMessage) {
        return res.status(404).json({ message: 'Message parent non trouvé' });
      }
    }

    const message = await MessageModel.create({
      contenu,
      fk_canal,
      fk_utilisateur: userId,
      parent_id
    });

    // Récupérer les informations complètes pour socket.io
    const fullMessage = await MessageModel.getById(message.id_message);
    console.log('Message créé avec succès:', fullMessage);
    
    // Émettre le message via socket.io
    const io = req.app.get('io');
    if (io) {
      console.log(`Émission du message vers canal ${fk_canal}`);
      io.to(`${fk_canal}`).emit('message', fullMessage);
    } else {
      console.warn('Instance Socket.IO non disponible');
    }

    res.status(201).json(fullMessage);
  } catch (error) {
    console.error('Erreur lors de la création du message:', error);
    res.status(500).json({ message: error.message || 'Erreur lors de la création du message' });
  }
};

// Récupérer les messages d'un canal
export const getMessagesByChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    console.log(`Récupération des messages pour canal ${channelId}`);
    
    // Vérifier que le canal existe
    const canal = await Canal.findById(channelId);
    if (!canal) {
      console.log('Canal non trouvé:', channelId);
      return res.status(404).json({ message: 'Canal non trouvé' });
    }
    
    const messages = await MessageModel.findByChannel(channelId);
    console.log(`${messages.length} messages trouvés`);
    
    // Normaliser les dates pour assurer la compatibilité avec le front-end
    const transformedMessages = messages.map(msg => {
      // Si le front-end s'attend à date_creation mais la BD utilise created_at
      if (msg.created_at && !msg.date_creation) {
        msg.date_creation = msg.created_at;
      }
      return msg;
    });
    
    res.status(200).json(transformedMessages || []);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ message: error.message || 'Erreur lors de la récupération des messages' });
  }
};

// Mettre à jour un message
export const updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { contenu } = req.body;
    const userId = req.user.id;
    
    // Vérifier que le message existe et appartient à l'utilisateur
    const message = await MessageModel.getById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }
    
    if (message.fk_utilisateur !== userId) {
      return res.status(403).json({ message: 'Vous ne pouvez pas modifier ce message' });
    }
    
    const updatedMessage = await MessageModel.update(messageId, { contenu });
    
    const io = req.app.get('io');
    if (io) {
      io.to(`canal:${message.fk_canal}`).emit('updateMessage', updatedMessage);
    }
    
    res.status(200).json(updatedMessage);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du message:', error);
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    
    // Vérifier que le message existe et appartient à l'utilisateur
    const message = await MessageModel.getById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message non trouvé' });
    }
    
    if (message.fk_utilisateur !== userId) {
      return res.status(403).json({ message: 'Vous ne pouvez pas supprimer ce message' });
    }
    
    await MessageModel.delete(messageId);
    
    const io = req.app.get('io');
    if (io) {
      io.to(`canal:${message.fk_canal}`).emit('deleteMessage', { id: messageId });
    }
    
    res.status(200).json({ message: 'Message supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du message:', error);
    res.status(500).json({ message: error.message });
  }
};
