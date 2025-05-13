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
        console.log("Service de son initialisé dans NotificationHandler");
      } catch (error) {
        console.error("Erreur lors de l'initialisation du son:", error);
      }
    };
    
    initSound();

    // Configurer l'écouteur d'événements pour les nouveaux messages
    const handleNewMessage = async (data) => {
      console.log("📣 [NotificationHandler] Message reçu, déclenchement du son...", data);
      try {
        await SoundService.playNotificationSound();
      } catch (error) {
        console.error("❌ [NotificationHandler] Erreur lors de la lecture du son de notification:", error);
      }
    };

    // Écouter les événements de notification
    if (socket && socket.socket) {
      console.log("Configuration des écouteurs de socket pour les notifications");
      
      // Les événements standard
      socket.socket.on('newMessage', handleNewMessage);
      socket.socket.on('newPrivateMessage', handleNewMessage);
      socket.socket.on('notification', handleNewMessage);
      
      // Ajout des événements spécifiques qui apparaissent dans vos logs
      socket.socket.on('privateMessage', handleNewMessage);
      socket.socket.on('message', handleNewMessage);
      
      // Événement de debug pour voir tous les événements socket
      const originalOn = socket.socket.on;
      socket.socket.on = function(event, callback) {
        const wrappedCallback = function(...args) {
          console.log(`📡 [Socket Debug] Événement reçu: ${event}`);
          return callback.apply(this, args);
        };
        return originalOn.call(this, event, wrappedCallback);
      };

      // Écouteur spécifique pour les événements liés aux messages privés qui semblent être dans vos logs
      socket.socket.on('privateMessageReceived', (data) => {
        console.log("📣 [NotificationHandler] Message privé reçu via 'privateMessageReceived'", data);
        handleNewMessage(data);
      });

      // Cleanup: supprimer les écouteurs lorsque le composant est démonté
      return () => {
        console.log("Nettoyage des écouteurs de socket");
        socket.socket.off('newMessage', handleNewMessage);
        socket.socket.off('newPrivateMessage', handleNewMessage);
        socket.socket.off('notification', handleNewMessage);
        socket.socket.off('privateMessage', handleNewMessage);
        socket.socket.off('message', handleNewMessage);
        socket.socket.off('privateMessageReceived', handleNewMessage);
        
        // Restaurer la fonction on originale
        socket.socket.on = originalOn;
      };
    } else {
      console.log("Socket non disponible, impossible de configurer les écouteurs de notifications");
    }
  }, [socket]);

  // Ce composant ne rend rien visuellement
  return null;
};

export default NotificationHandler;