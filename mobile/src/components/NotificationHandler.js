import React, { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import SoundService from '../utils/SoundService';

/**
 * Composant qui écoute les notifications et joue un son lorsqu'une notification est reçue
 */
const NotificationHandler = () => {
  const socket = useSocket();

  useEffect(() => {
    // Initialiser le son au chargement du composant (fonction asynchrone)
    const initSound = async () => {
      try {
        await SoundService.initializeSound();

      } catch (error) {
        console.error("Erreur lors de l'initialisation du son:", error);
      }
    };
    
    initSound();

    // Configurer l'écouteur d'événements pour les nouveaux messages
    const handleNewMessage = async (data) => {

      try {
        await SoundService.playNotificationSound();
      } catch (error) {
        console.error("❌ [NotificationHandler] Erreur lors de la lecture du son de notification:", error);
      }
    };

    // Écouter les événements de notification
    if (socket && socket.socket) {

      
      // Les événements standard
      socket.socket.on('newMessage', handleNewMessage);
      socket.socket.on('newPrivateMessage', handleNewMessage);
      socket.socket.on('notification', handleNewMessage);
      
      // Ajout des événements spécifiques qui apparaissent dans vos logs
      socket.socket.on('privateMessage', handleNewMessage);
      socket.socket.on('message', handleNewMessage);
        // Événement de debug pour voir tous les événements socket
      const originalOn = socket.socket.on;      // Écouteur spécifique pour les événements liés aux messages privés qui semblent être dans vos logs
      socket.socket.on('privateMessageReceived', (data) => {
        handleNewMessage(data);
      });      // Cleanup: supprimer les écouteurs lorsque le composant est démonté
      return () => {
        socket.socket.off('newMessage', handleNewMessage);
        socket.socket.off('newPrivateMessage', handleNewMessage);
        socket.socket.off('notification', handleNewMessage);
        socket.socket.off('privateMessage', handleNewMessage);
        socket.socket.off('message', handleNewMessage);
        socket.socket.off('privateMessageReceived', handleNewMessage);        
        // Restaurer la fonction on originale
        socket.socket.on = originalOn;
      };
    }
  }, [socket]);

  // Ce composant ne rend rien visuellement
  return null;
};

export default NotificationHandler;