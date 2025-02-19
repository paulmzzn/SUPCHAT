import MessageModel from '../models/Message.js';

const socketManager = (io) => {
    const canals = new Map(); // Pour garder trace des utilisateurs dans chaque canal

    io.on('connection', (socket) => {
        console.log('Nouvelle connexion Socket.IO:', socket.id);

        socket.on('joinCanal', async ({ canalId, workspaceId }) => {
            console.log(`Socket ${socket.id} rejoint le canal ${canalId}`);
            
            // Quitter les canaux précédents
            if (socket.currentCanal) {
                socket.leave(socket.currentCanal);
            }
            
            // Rejoindre le nouveau canal
            socket.currentCanal = canalId;
            await socket.join(canalId);
            
            // Ajouter l'utilisateur à la liste du canal
            if (!canals.has(canalId)) {
                canals.set(canalId, new Set());
            }
            canals.get(canalId).add(socket.id);
            
            socket.emit('canalJoined', { 
                canalId, 
                message: `Canal ${canalId} rejoint avec succès`,
                usersCount: canals.get(canalId).size
            });
        });

        socket.on('message', async (messageData) => {
            try {
                console.log('Message reçu:', messageData);
                const { user_id, canal_id, content, workspace_id } = messageData;
                
                // Sauvegarder le message dans la base de données
                const savedMessage = await MessageModel.createMessage({ 
                    user_id, 
                    canal_id, 
                    content 
                });

                // Récupérer les détails complets du message avec le nom d'utilisateur
                const messageWithDetails = await MessageModel.getMessageById(savedMessage.id_message);
                
                if (messageWithDetails) {
                    // S'assurer que tous les champs requis sont présents
                    const formattedMessage = {
                        id: messageWithDetails.id,
                        content: messageWithDetails.content,
                        username: messageWithDetails.username,
                        created_at: messageWithDetails.created_at || new Date().toISOString()
                    };

                    console.log('Émission du message formaté:', formattedMessage);
                    // Émettre à tous les clients dans le canal
                    io.to(canal_id).emit('message', formattedMessage);
                }
            } catch (error) {
                console.error('Erreur lors du traitement du message:', error);
                socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
            }
        });

        // Ajout de la gestion des réactions
        socket.on('reaction', async (data) => {
            try {
                const { messageId, emoji, userId } = data;
                // Émettre la mise à jour à tous les clients dans le même canal
                io.emit('reactionUpdate', { messageId });
            } catch (error) {
                console.error('Erreur lors de la gestion de la réaction:', error);
            }
        });

        socket.on('disconnect', () => {
            // Nettoyer les canaux lors de la déconnexion
            if (socket.currentCanal && canals.has(socket.currentCanal)) {
                canals.get(socket.currentCanal).delete(socket.id);
                if (canals.get(socket.currentCanal).size === 0) {
                    canals.delete(socket.currentCanal);
                }
            }
            console.log('Client déconnecté:', socket.id);
        });
    });
};

export default socketManager;
