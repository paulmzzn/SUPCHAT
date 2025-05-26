import React, { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import SoundService from '../utils/SoundService';

/**
 * Composant qui écoute les notifications et joue un son lorsqu'une notification est reçue
 */
const NotificationHandler = () => {
  const socketContext = useSocket();
  const socket = socketContext && socketContext.socket ? socketContext.socket : null;

  useEffect(() => {
    // Initialiser le son au chargement du composant (fonction asynchrone)
    const initSound = async () => {
      try {
        await SoundService.initializeSound();
        console.log('Service de son initialisé dans NotificationHandler');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du son:', error);
      }
    };
    initSound();

    // Handler pour jouer le son à la réception d'un message
    const handleNewMessage = async (data) => {
      console.log('📣 [NotificationHandler] Message reçu, déclenchement du son...', data);
      try {
        await SoundService.playNotificationSound();
      } catch (error) {
        console.error('❌ [NotificationHandler] Erreur lors de la lecture du son de notification:', error);
      }
    };

    if (socket) {
      console.log('NotificationHandler: Configuration des écouteurs de socket pour les notifications');
      // Écouter tous les événements pertinents
      socket.on('message', handleNewMessage);
      socket.on('newMessage', handleNewMessage);
      socket.on('channelMessage', handleNewMessage);
      socket.on('privateMessage', handleNewMessage);
      socket.on('newPrivateMessage', handleNewMessage);
      socket.on('notification', handleNewMessage);

      // Cleanup: supprimer les écouteurs lorsque le composant est démonté
      return () => {
        console.log('NotificationHandler: Nettoyage des écouteurs de socket');
        socket.off('message', handleNewMessage);
        socket.off('newMessage', handleNewMessage);
        socket.off('channelMessage', handleNewMessage);
        socket.off('privateMessage', handleNewMessage);
        socket.off('newPrivateMessage', handleNewMessage);
        socket.off('notification', handleNewMessage);
      };
    } else {
      console.log('NotificationHandler: Socket non disponible, impossible de configurer les écouteurs de notifications');
    }
  }, [socket]);

  // Ce composant ne rend rien visuellement
  return null;
};

export default NotificationHandler;