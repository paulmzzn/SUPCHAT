import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import MessageModel from '../models/Message.js';
import Reaction from '../models/Reaction.js';

// Charger les variables d'environnement
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || 'REDACTED';

const socketManager = (io) => {
  // Middleware pour authentifier les utilisateurs via socket.io
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.log('Socket.IO: Pas de token fourni');
        return next(new Error('Authentication error: Token required'));
      }
      
      jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
          console.error('Socket.IO: Token invalide', err);
          return next(new Error('Authentication error: Invalid token'));
        }
        console.log('Socket.IO: Utilisateur authentifié', decoded);
        socket.user = decoded;
        next();
      });
    } catch (error) {
      console.error('Socket.IO: Erreur d\'authentification', error);
      next(new Error('Authentication error: ' + error.message));
    }
  });

  // Événements de connexion
  io.on('connection', (socket) => {
    console.log(`Utilisateur connecté: ${socket.id}, User ID: ${socket.user?.id}`);
    
    // Joindre un canal
    socket.on('joinCanal', (data) => {
      const { canalId, workspaceId } = data;
      console.log(`Utilisateur ${socket.user?.id} rejoint le canal ${canalId} du workspace ${workspaceId}`);
      
      if (socket.currentRoom) {
        socket.leave(socket.currentRoom);
      }
      
      socket.currentRoom = `${canalId}`;
      socket.join(`${canalId}`);
      
      // Informer le client que le canal a été rejoint
      socket.emit('canalJoined', { canalId, status: 'success' });
    });
    
    // Recevoir un message
    socket.on('message', async (data) => {
      try {
        console.log('Socket.IO: Message reçu', data);
        const { canal_id, content, workspace_id } = data;
        
        if (!canal_id || !content) {
          console.error('Socket.IO: Données de message incomplètes');
          socket.emit('error', { message: 'Données de message incomplètes' });
          return;
        }
        
        // Enregistrer le message en base de données
        const message = await MessageModel.create({
          contenu: content,
          fk_canal: canal_id,
          fk_utilisateur: socket.user.id
        });
        
        // Récupérer le message complet avec infos utilisateur
        const fullMessage = await MessageModel.getById(message.id_message);
        
        if (fullMessage) {
          // Faire correspondre les champs avec ce qui est attendu par le frontend
          const formattedMessage = {
            ...fullMessage,
            // S'assurer que le champ date_creation est bien présent pour le front-end
            date_creation: fullMessage.date_creation || fullMessage.created_at || new Date().toISOString()
          };
          
          console.log(`Socket.IO: Émission du message formaté:`, formattedMessage);
          io.to(`${canal_id}`).emit('message', formattedMessage);
        } else {
          console.warn('Socket.IO: Message enregistré mais non émis (non trouvé)');
        }
      } catch (error) {
        console.error('Socket.IO: Erreur de traitement de message', error);
        socket.emit('error', { message: 'Erreur lors du traitement du message' });
      }
    });
    
    // Nouvel événement pour gérer les réactions aux messages
    socket.on('addReaction', async (data) => {
      try {
        console.log('Socket.IO: Réaction reçue', data);
        const { messageId, reaction_type, canalId } = data;
        
        if (!messageId || !reaction_type || !canalId) {
          console.error('Socket.IO: Données de réaction incomplètes');
          socket.emit('error', { message: 'Données de réaction incomplètes' });
          return;
        }
        
        // Ajouter la réaction en base de données
        await Reaction.create({
          fk_message: messageId,
          fk_utilisateur: socket.user.id,
          reaction_type
        });
        
        // Récupérer toutes les réactions mises à jour pour ce message
        const updatedReactions = await Reaction.getByMessage(messageId, socket.user.id);
        
        // Diffuser à tous les utilisateurs du canal
        io.to(`${canalId}`).emit('messageReaction', {
          messageId,
          reactions: updatedReactions
        });
        
      } catch (error) {
        console.error('Socket.IO: Erreur de traitement de réaction', error);
        socket.emit('error', { message: 'Erreur lors du traitement de la réaction' });
      }
    });
    
    // Nouvel événement pour gérer la suppression des réactions
    socket.on('removeReaction', async (data) => {
      try {
        console.log('Socket.IO: Suppression de réaction', data);
        const { messageId, reaction_type, canalId } = data;
        
        if (!messageId || !reaction_type || !canalId) {
          console.error('Socket.IO: Données de suppression de réaction incomplètes');
          socket.emit('error', { message: 'Données incomplètes' });
          return;
        }
        
        // Supprimer la réaction en base de données
        await Reaction.delete(messageId, socket.user.id, reaction_type);
        
        // Récupérer toutes les réactions mises à jour pour ce message
        const updatedReactions = await Reaction.getByMessage(messageId, socket.user.id);
        
        // Diffuser à tous les utilisateurs du canal
        io.to(`${canalId}`).emit('messageReaction', {
          messageId,
          reactions: updatedReactions
        });
        
      } catch (error) {
        console.error('Socket.IO: Erreur de suppression de réaction', error);
        socket.emit('error', { message: 'Erreur lors de la suppression de la réaction' });
      }
    });
    
    // Déconnexion
    socket.on('disconnect', () => {
      console.log(`Utilisateur déconnecté: ${socket.id}`);
    });
  });
  
  return io;
};

export default socketManager;
