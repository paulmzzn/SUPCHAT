import React, { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import SoundService from '../utils/SoundService';

/**
 * Composant qui écoute les notifications et joue un son lorsqu'une notification est reçue
 */
const NotificationHandler = () => {
  const socketContext = useSocket();
  const socket = socketContext && socketContext.socket ? socketContext.socket : null;
  const { userToken } = useAuth();
  const navigation = useNavigation();

  // Fonction pour obtenir l'état de navigation actuel
  const getActiveRoute = () => {
    const state = navigation.getState();
    if (!state) return null;

    const findActiveRoute = (routes, index) => {
      if (!routes || routes.length === 0) return null;
      const route = routes[index];
      if (route.state) {
        return findActiveRoute(route.state.routes, route.state.index);
      }
      return route;
    };

    return findActiveRoute(state.routes, state.index);
  };

  // Extraire l'ID utilisateur du token
  const getCurrentUserId = () => {
    if (!userToken) return null;
    try {
      const parts = userToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        return payload.id;
      }
    } catch (e) {
      console.error('Erreur lors du parsing du token:', e);
    }
    return null;
  };

  const currentUserId = getCurrentUserId();

  useEffect(() => {
    // Initialiser le son au chargement du composant (fonction asynchrone)
    const initSound = async () => {
      try {
        await SoundService.initializeSound();
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du son:', error);
      }
    };
    initSound();

    // Handler pour jouer le son à la réception d'un message
    const handleNewMessage = async (data) => {
      try {
        // Vérifier que le message ne vient pas de l'utilisateur actuel
        const messageUserId = data.fk_utilisateur || data.fk_expediteur || data.user_id;
        
        if (messageUserId && messageUserId === currentUserId) {
          console.log('🔇 [NotificationHandler] Pas de son - message envoyé par l\'utilisateur actuel');
          return;
        }

        // Vérifier si l'utilisateur est dans la conversation active
        const activeRoute = getActiveRoute();
        let shouldPlaySound = true;

        if (activeRoute) {
          // Pour les messages de canal (WorkspaceDetailScreen)
          if (activeRoute.name === 'WorkspaceDetailScreen' && data.fk_canal) {
            const activeChannelId = activeRoute.params?.channelId;
            if (activeChannelId === data.fk_canal) {
              console.log('🔇 [NotificationHandler] Pas de son - utilisateur dans le canal actif:', activeChannelId);
              shouldPlaySound = false;
            }
          }
          
          // Pour les messages privés (MessagesScreen ou Conversation)
          if ((activeRoute.name === 'MessagesScreen' || activeRoute.name === 'Conversation') && (data.fk_expediteur || data.fk_destinataire)) {
            const activeUserId = activeRoute.params?.userId;
            const messageFromUser = data.fk_expediteur;
            
            // Si on est dans la conversation avec l'expéditeur du message
            if (activeUserId === messageFromUser) {
              console.log('🔇 [NotificationHandler] Pas de son - utilisateur dans la conversation active avec:', activeUserId);
              shouldPlaySound = false;
            }
          }
        }

        if (shouldPlaySound) {
          console.log('🔔 [NotificationHandler] Lecture du son pour message reçu de:', messageUserId);
          await SoundService.playNotificationSound();
        }
      } catch (error) {
        console.error('❌ [NotificationHandler] Erreur lors de la lecture du son de notification:', error);
      }
    };

    if (socket && currentUserId) {
      // Écouter tous les événements pertinents
      socket.on('message', handleNewMessage);
      socket.on('newMessage', handleNewMessage);
      socket.on('channelMessage', handleNewMessage);
      socket.on('privateMessage', handleNewMessage);
      socket.on('newPrivateMessage', handleNewMessage);
      socket.on('notification', handleNewMessage);

      // Cleanup: supprimer les écouteurs lorsque le composant est démonté
      return () => {
        socket.off('message', handleNewMessage);
        socket.off('newMessage', handleNewMessage);
        socket.off('channelMessage', handleNewMessage);
        socket.off('privateMessage', handleNewMessage);
        socket.off('newPrivateMessage', handleNewMessage);
        socket.off('notification', handleNewMessage);
      };
    }
  }, [socket, currentUserId]);

  // Ce composant ne rend rien visuellement
  return null;
};

export default NotificationHandler;