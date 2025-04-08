import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import MessageModel from '../models/Message.js';
import Reaction from '../models/Reaction.js';
// Assurez-vous que fetch est disponible (Node >= 18 ou import node-fetch)
// import fetch from 'node-fetch'; // Décommentez si Node < 18 et node-fetch est installé

// Charger les variables d'environnement
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || 'REDACTED';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY; // Charger la clé API Mistral
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions'; // URL de l'API Mistral

const MISTRAL_USER_ID = '00000000-0000-0000-0000-000000000001'; // <<< UTILISER L'UUID FIXE
const MISTRAL_USERNAME = 'Mistral AI';
const MISTRAL_AVATAR = 'https://www.servicesmobiles.fr/wp-content/uploads/2024/10/Mistral-AI-660x440.jpg.webp';

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
        const { canal_id, content, workspace_id, parent_id } = data; // Ajout de parent_id
        
        if (!canal_id || !content) {
          console.error('Socket.IO: Données de message incomplètes');
          socket.emit('error', { message: 'Données de message incomplètes' });
          return;
        }
        
        // Enregistrer le message de l'utilisateur en base de données
        const userMessage = await MessageModel.create({
          contenu: content,
          fk_canal: canal_id,
          fk_utilisateur: socket.user.id,
          parent_id: parent_id // Sauvegarder le parent_id si présent
        });
        
        // Récupérer le message complet avec infos utilisateur
        const fullUserMessage = await MessageModel.getById(userMessage.id_message);
        
        if (fullUserMessage) {
          const formattedUserMessage = {
            ...fullUserMessage,
            date_creation: fullUserMessage.date_creation || fullUserMessage.created_at || new Date().toISOString()
          };
          console.log(`Socket.IO: Émission du message utilisateur formaté:`, formattedUserMessage);
          io.to(`${canal_id}`).emit('message', formattedUserMessage); // Émettre le message de l'utilisateur
        } else {
          console.warn('Socket.IO: Message utilisateur enregistré mais non émis (non trouvé)');
        }
        
        // Vérifier si le message mentionne @mistral
        if (content.toLowerCase().startsWith('@mistral')) {
          if (!MISTRAL_API_KEY) {
            console.error('Clé API Mistral non configurée.');
            // Envoyer un message d'erreur dans le chat si la clé n'est pas configurée
            const errorMessage = {
              id_message: `error-${Date.now()}`, // ID unique pour le message d'erreur
              contenu: "Désolé, l'intégration Mistral AI n'est pas configurée correctement (clé API manquante).",
              fk_canal: canal_id,
              fk_utilisateur: MISTRAL_USER_ID, // Utiliser l'UUID du bot
              nom: MISTRAL_USERNAME,
              photo_de_profil: MISTRAL_AVATAR,
              date_creation: new Date().toISOString(),
              reactions: [],
              isBot: true // Indicateur pour le frontend
            };
            io.to(`${canal_id}`).emit('message', errorMessage);
            return;
          }

          const question = content.substring('@mistral'.length).trim();
          console.log(`Socket.IO: Question pour Mistral AI: "${question}"`);

          // Optionnel: Envoyer un indicateur "Mistral est en train d'écrire..."
          // io.to(`${canal_id}`).emit('typing', { userId: MISTRAL_USER_ID, username: MISTRAL_USERNAME });

          try {
            const mistralResponse = await fetch(MISTRAL_API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${MISTRAL_API_KEY}`
              },
              body: JSON.stringify({
                model: 'mistral-small-latest', // Ou un autre modèle Mistral
                messages: [{ role: 'user', content: question }],
                // temperature: 0.7, // Ajustez selon les besoins
                // max_tokens: 150 // Limitez la longueur de la réponse si nécessaire
              })
            });

            // Optionnel: Arrêter l'indicateur "Mistral est en train d'écrire..."
            // io.to(`${canal_id}`).emit('stopTyping', { userId: MISTRAL_USER_ID });

            if (!mistralResponse.ok) {
              const errorBody = await mistralResponse.text();
              console.error(`Erreur API Mistral (${mistralResponse.status}): ${errorBody}`);
              throw new Error(`Erreur de l'API Mistral: ${mistralResponse.statusText}`);
            }

            const mistralData = await mistralResponse.json();
            const mistralAnswer = mistralData.choices && mistralData.choices[0] ? mistralData.choices[0].message.content : "Désolé, je n'ai pas pu générer de réponse.";

            // *** Enregistrer la réponse de Mistral en base de données ***
            let savedMistralMessage;
            try {
              savedMistralMessage = await MessageModel.create({
                contenu: mistralAnswer,
                fk_canal: canal_id,
                fk_utilisateur: MISTRAL_USER_ID, // <<< Utiliser l'UUID ici aussi
                // parent_id: userMessage.id_message // Optionnel: Lier la réponse à la question
              });
              console.log('Socket.IO: Réponse de Mistral enregistrée en DB:', savedMistralMessage);

              // Créer l'objet message pour l'émission UNIQUEMENT si l'enregistrement a réussi
              const mistralMessageForEmit = {
                id_message: savedMistralMessage.id_message, // Utiliser l'ID réel de la DB
                contenu: mistralAnswer,
                fk_canal: canal_id,
                fk_utilisateur: MISTRAL_USER_ID, // <<< Utiliser l'UUID ici aussi
                nom: MISTRAL_USERNAME,
                photo_de_profil: MISTRAL_AVATAR,
                // Récupérer la date de création réelle de la DB si possible, sinon utiliser new Date()
                date_creation: savedMistralMessage.date_creation || savedMistralMessage.created_at || new Date().toISOString(),
                reactions: [], // Initialement vide
                isBot: true,
                // parent_id: userMessage.id_message // Optionnel
              };

              console.log(`Socket.IO: Émission de la réponse de Mistral enregistrée:`, mistralMessageForEmit);
              io.to(`${canal_id}`).emit('message', mistralMessageForEmit); // Émettre le message enregistré

            } catch (dbError) {
              console.error('Socket.IO: ERREUR FATALE lors de l\'enregistrement de la réponse Mistral en DB. Le message n\'a pas été envoyé.', dbError);
              // NE PAS envoyer de message au client si l'enregistrement échoue.
              // Optionnel : Envoyer un message d'erreur spécifique à l'utilisateur qui a posé la question ?
              // socket.emit('error', { message: 'Erreur interne: Impossible d\'enregistrer la réponse du bot.' });
            }

          } catch (apiError) {
            console.error('Socket.IO: Erreur lors de l\'appel à l\'API Mistral', apiError);
            // Envoyer un message d'erreur dans le chat
            const errorMessage = {
              id_message: `error-${Date.now()}`,
              contenu: `Désolé, une erreur est survenue lors de la communication avec Mistral AI: ${apiError.message}`,
              fk_canal: canal_id,
              fk_utilisateur: MISTRAL_USER_ID, // <<< Utiliser l'UUID ici aussi
              nom: MISTRAL_USERNAME,
              photo_de_profil: MISTRAL_AVATAR,
              date_creation: new Date().toISOString(),
              reactions: [],
              isBot: true
            };
            io.to(`${canal_id}`).emit('message', errorMessage);
          }
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
        // Gérer l'erreur si la réaction existe déjà (contrainte unique)
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation d'unicité
          console.log(`L'utilisateur ${socket.user.id} a déjà réagi avec ${reaction_type} au message ${messageId}`);
          // Optionnel: renvoyer les réactions actuelles pour synchroniser le client
          const currentReactions = await Reaction.getByMessage(messageId, socket.user.id);
          socket.emit('messageReaction', { messageId, reactions: currentReactions });
        } else {
          console.error('Socket.IO: Erreur de traitement de réaction', error);
          socket.emit('error', { message: 'Erreur lors du traitement de la réaction' });
        }
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
