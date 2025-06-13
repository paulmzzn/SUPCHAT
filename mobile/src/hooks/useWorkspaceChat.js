import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import env from '../config/env';

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000003";
const SYSTEM_USERNAME = "Système";

export const useWorkspaceChat = (workspaceId, channelId, socket, markChannelAsRead) => {
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const LIMIT = 30;
  const MAX_RETRY_ATTEMPTS = 3;
  const loadingTimeoutRef = useRef(null);
  const isInitializedRef = useRef(false);

  const getCurrentUser = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${env.API_URL}/api/users/verify-token`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        setCurrentUserId(userData.user_id);
      }
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
    }
  }, []);

  const fetchChannelMessages = useCallback(async (isInitial = false, retryAttempt = 0) => {
    if (!isInitial && (loadingMore || !hasMoreMessages)) return;

    try {
      if (!isInitial) {
        setLoadingMore(true);
      }

      const token = await AsyncStorage.getItem('token');
      const currentOffset = isInitial ? 0 : offset;

      const response = await fetch(`${env.API_URL}/api/messages/canal/${channelId}?limit=${LIMIT}&offset=${currentOffset}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      if (response.ok) {
        const data = await response.json();

        if (data.length === 0) {
          setHasMoreMessages(false);
          return;
        }

        const sortedData = data.sort((a, b) =>
          new Date(b.date_creation) - new Date(a.date_creation)
        );

        if (isInitial) {
          setMessages(sortedData);
        } else {
          setMessages(prev => [...prev, ...sortedData]);
        }

        setOffset(currentOffset + data.length);
        setHasMoreMessages(data.length >= LIMIT);
        setConnectionError(false);
        setRetryCount(0);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur messages:', error);

      if (retryAttempt < MAX_RETRY_ATTEMPTS) {
        setTimeout(() => {
          fetchChannelMessages(isInitial, retryAttempt + 1);
        }, Math.pow(2, retryAttempt) * 1000);
        setRetryCount(retryAttempt + 1);
      } else {
        setConnectionError(true);
        Toast.show({
          type: 'error',
          text1: 'Erreur de connexion',
          text2: 'Impossible de charger les messages. Vérifiez votre connexion.'
        });
      }
    } finally {
      if (!isInitial) {
        loadingTimeoutRef.current = setTimeout(() => {
          setLoadingMore(false);
        }, 300);
      }
    }
  }, [channelId, offset, loadingMore, hasMoreMessages]);

  const initializeChat = useCallback(async () => {
    try {
      setLoading(true);
      setMessages([]);
      setOffset(0);
      setHasMoreMessages(true);
      await fetchChannelMessages(true);
    } catch (error) {
      console.error('Erreur initialisation chat:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les messages'
      });
    } finally {
      setLoading(false);
    }
  }, [fetchChannelMessages]);

  const handleNewMessage = useCallback((message) => {
    if (message.fk_canal === channelId) {
      setMessages(prev => [message, ...prev]);

      // Marquer automatiquement le canal comme lu quand un nouveau message arrive
      // (l'utilisateur est dans le canal donc il "voit" le message)
      if (workspaceId && channelId && markChannelAsRead) {
        setTimeout(() => {
          console.log("📖 [useWorkspaceChat] Marquage automatique du canal comme lu après réception de message");
          markChannelAsRead(workspaceId, channelId);
        }, 100); // Petit délai pour s'assurer que le message est affiché
      }
    }
  }, [channelId, workspaceId, markChannelAsRead]);

  const handleReconnect = useCallback(() => {
    setConnectionError(false);
    setRetryCount(0);
    if (!loading) {
      initializeChat();
    }
  }, [loading, initializeChat]);

  const handleDisconnect = useCallback(() => {
    setConnectionError(true);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMoreMessages && messages.length > 0) {
      fetchChannelMessages(false);
    }
  }, [loadingMore, hasMoreMessages, messages.length, fetchChannelMessages]);

  // Marquer le canal comme lu - optimisé pour éviter les boucles
  useEffect(() => {
    if (workspaceId && channelId && currentUserId && !isInitializedRef.current) {
      console.log(`🔔 Marquage du canal ${channelId} comme lu dans le workspace ${workspaceId}`);
      
      markChannelAsRead(workspaceId, channelId);
      
      // Timer unique pour marquer comme lu après chargement
      const timer = setTimeout(() => {
        markChannelAsRead(workspaceId, channelId);
        
        // Émettre l'événement global UNE SEULE FOIS
        if (global.AppEvents) {
          global.AppEvents.emit('forceUnreadCountsUpdate', {
            timestamp: Date.now(),
            source: 'WorkspaceDetailScreen',
            channelId,
            workspaceId
          });
          
          console.log("🔔 Événement global émis pour mise à jour TabBar");
        }
        
        isInitializedRef.current = true;
      }, 1500);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [workspaceId, channelId, currentUserId]); // Supprimer markChannelAsRead des dépendances

  // Initialisation - séparée du marquage comme lu
  useEffect(() => {
    initializeChat();
    getCurrentUser();
  }, [workspaceId, channelId]); // Garder seulement les IDs dans les dépendances

  return {
    messages,
    setMessages,
    currentUserId,
    loading,
    loadingMore,
    hasMoreMessages,
    connectionError,
    retryCount,
    MAX_RETRY_ATTEMPTS,
    handleNewMessage,
    handleReconnect,
    handleDisconnect,
    handleLoadMore,
    initializeChat,
  };
};
