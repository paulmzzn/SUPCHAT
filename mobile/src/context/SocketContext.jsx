import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.49:3000';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setConnected] = useState(false);

  // Messages privés - GARDÉ INTACT
  const [unreadMessages, setUnreadMessages] = useState({});
  
  // NOUVEAU SYSTÈME pour les canaux/workspaces
  const [workspaceUnreadCounts, setWorkspaceUnreadCounts] = useState({});
  const [channelUnreadCounts, setChannelUnreadCounts] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Refs pour éviter les doubles appels
  const notificationListeners = useRef([]);
  const debounceTimer = useRef(null);
  const initialFetchDone = useRef(false);
  const socketRef = useRef(null); // Ajout d'une ref pour le socket
  const [forceUpdate, setForceUpdate] = useState(0); // Ajout pour forcer les re-renders

  // Fonction pour récupérer les compteurs de messages privés - GARDÉE INTACTE
  const fetchUnreadCounts = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_URL}/api/private-messages/unread-counts`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const counts = await response.json();

        setUnreadMessages((prevCounts) => {
          const prevTotal = Object.values(prevCounts).reduce((sum, val) => sum + val, 0);
          const newTotal = Object.values(counts).reduce((sum, val) => sum + val, 0);

          if (prevTotal !== newTotal || JSON.stringify(prevCounts) !== JSON.stringify(counts)) {
            return counts;
          }
          return prevCounts;
        });
      }
    } catch (error) {
      console.error("Socket: Erreur fetchUnreadCounts:", error);
    }
  }, []);

  // NOUVELLE fonction pour récupérer les compteurs workspace/canaux
  const fetchWorkspaceUnreadCounts = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        return;
      }

      const response = await fetch(
        `${API_URL}/api/messages/unread-by-workspace`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Structure attendue: { workspaceId: { totalUnread: number, channels: { channelId: count } } }
        setWorkspaceUnreadCounts(prevCounts => {
          const newCounts = data.workspaces || {};
          return { ...newCounts };
        });
        
        // Aplatir pour avoir channelId: count
        const flatChannelCounts = {};
        Object.values(data.workspaces || {}).forEach(workspace => {
          Object.assign(flatChannelCounts, workspace.channels || {});
        });
        setChannelUnreadCounts(prevCounts => {
          return { ...flatChannelCounts };
        });
      }
    } catch (error) {
      console.error("Socket: Erreur fetchWorkspaceUnreadCounts:", error);
    }
  }, []);

  // Fonction pour marquer un canal comme lu
  const markChannelAsRead = useCallback(async (workspaceId, channelId) => {
    try {
      // D'abord, récupérer le nombre de messages non lus de ce canal AVANT de faire l'appel API
      const channelUnreadCount = channelUnreadCounts[channelId] || 0;
      console.log(`🔔 Marquage canal ${channelId} comme lu. Compteur actuel: ${channelUnreadCount}`);

      const token = await AsyncStorage.getItem("token");
      if (token) {
        // Appel API pour marquer comme lu côté serveur
        const response = await fetch(`${API_URL}/api/messages/channel/${channelId}/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!response.ok) {
          console.error('Erreur lors du marquage du canal comme lu:', response.status);
          return; // Ne pas mettre à jour les compteurs locaux si l'API échoue
        }
      }

      // Mettre à jour les compteurs localement SEULEMENT si l'API a réussi
      setChannelUnreadCounts(prev => {
        const newCounts = { ...prev };
        if (newCounts[channelId]) {
          delete newCounts[channelId]; // Supprimer complètement le canal des non lus
        }
        return newCounts;
      });

      setWorkspaceUnreadCounts(prev => {
        const newWorkspaceCounts = { ...prev };
        if (newWorkspaceCounts[workspaceId] && channelUnreadCount > 0) {
          // Créer une copie des canaux du workspace
          const updatedChannels = { ...newWorkspaceCounts[workspaceId].channels };
          
          // Supprimer le canal des non lus
          if (updatedChannels[channelId]) {
            delete updatedChannels[channelId];
          }
          
          // Mettre à jour le workspace avec le nouveau total et la liste des canaux
          newWorkspaceCounts[workspaceId] = {
            ...newWorkspaceCounts[workspaceId],
            totalUnread: Math.max(0, (newWorkspaceCounts[workspaceId].totalUnread || 0) - channelUnreadCount),
            channels: updatedChannels
          };
          
          console.log(`📊 Workspace ${workspaceId} mis à jour. Nouveau total: ${newWorkspaceCounts[workspaceId].totalUnread}`);
        }
        return newWorkspaceCounts;
      });

    } catch (error) {
      console.error("Socket: Erreur markChannelAsRead:", error);
    }
  }, [channelUnreadCounts, API_URL]); // Ajouter channelUnreadCounts comme dépendance

  // Fonction combinée pour rafraîchir tous les compteurs
  const refreshUnreadCounts = useCallback(async () => {
    await Promise.all([
      fetchUnreadCounts(),      // Messages privés
      fetchWorkspaceUnreadCounts() // Workspaces/canaux
    ]);
  }, [fetchUnreadCounts, fetchWorkspaceUnreadCounts]);

  // Connexion socket - AMÉLIORÉE
  useEffect(() => {
    const connectSocket = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        // Extraire l'ID utilisateur du token AVANT la connexion
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.id) {
              setCurrentUserId(payload.id);
            }
          }
        } catch (e) {
          console.error("Error parsing token:", e);
        }

        const newSocket = io(API_URL, {
          auth: { token },
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
        });

        // Stocker la référence du socket
        socketRef.current = newSocket;

        newSocket.on("connect", () => {
          setConnected(true);
          
          // Rejoindre automatiquement la room privée
          newSocket.emit("joinPrivate");
          
          // Délai court pour s'assurer que la connexion est stable
          setTimeout(() => {
            refreshUnreadCounts();
          }, 500);
        });

        newSocket.on("connect_error", (err) => {
          console.error("Erreur de connexion socket:", err);
          setConnected(false);
        });

        newSocket.on("disconnect", (reason) => {
          setConnected(false);
        });

        // Event pour forcer un refresh des compteurs
        newSocket.on("refreshUnreadCounts", () => {
          refreshUnreadCounts();
        });

        setSocket(newSocket);

        return () => {
          if (newSocket) {
            newSocket.disconnect();
            socketRef.current = null;
          }
        };
      } catch (error) {
        console.error("Socket: Error initializing", error);
      }
    };

    connectSocket();
  }, []); // Removed refreshUnreadCounts dependency to prevent reconnection loops

  // NOUVEAU système d'écoute des messages pour les canaux - AMÉLIORÉ
  useEffect(() => {
    if (!socket || !currentUserId) {
      return;
    }

    // Handler pour les messages privés - GARDÉ INTACT
    const handlePrivateMessage = (data) => {
      if (data && data.fk_expediteur !== currentUserId) {
        setUnreadMessages(prev => {
          const newCounts = { ...prev };
          newCounts[data.fk_expediteur] = (newCounts[data.fk_expediteur] || 0) + 1;
          return newCounts;
        });
      }
    };

    // NOUVEAU handler pour les messages de canal - AMÉLIORÉ
    const handleChannelMessage = (data) => {
      const messageUserId = data.fk_utilisateur || data.user_id;
      const channelId = data.fk_canal || data.canal_id;
      const workspaceId = data.fk_workspace || data.workspace_id;
      
      if (data && messageUserId !== currentUserId && channelId && workspaceId) {
        // Incrémenter le compteur du canal
        setChannelUnreadCounts(prev => {
          const newCounts = { ...prev };
          newCounts[channelId] = (newCounts[channelId] || 0) + 1;
          return newCounts;
        });

        // Incrémenter le compteur du workspace
        setWorkspaceUnreadCounts(prev => {
          const newCounts = { ...prev };
          if (!newCounts[workspaceId]) {
            newCounts[workspaceId] = { totalUnread: 0, channels: {}, name: "" };
          }
          
          newCounts[workspaceId] = {
            ...newCounts[workspaceId],
            totalUnread: (newCounts[workspaceId].totalUnread || 0) + 1,
            channels: {
              ...newCounts[workspaceId].channels,
              [channelId]: (newCounts[workspaceId].channels?.[channelId] || 0) + 1
            }
          };
          
          return newCounts;
        });

        // Force un refresh après un court délai pour synchroniser avec le serveur
        setTimeout(() => {
          fetchWorkspaceUnreadCounts();
        }, 1000);
      }
    };

    // *** NOUVEAU handler pour la mise à jour directe des compteurs depuis le serveur ***
    const handleUnreadChannelMessagesUpdated = (data) => {
      if (data && data.channels) {
        // Mettre à jour les compteurs de canaux directement
        setChannelUnreadCounts(prev => {
          const newCounts = {};
          Object.keys(data.channels).forEach(channelId => {
            newCounts[channelId] = data.channels[channelId].count || 0;
          });
          return newCounts;
        });

        // Reconstruire les compteurs de workspaces à partir des données de canaux
        setWorkspaceUnreadCounts(prev => {
          const newWorkspaceCounts = {};
          
          // Grouper les canaux par workspace
          Object.keys(data.channels).forEach(channelId => {
            const channelData = data.channels[channelId];
            const workspaceId = channelData.workspaceId;
            const count = channelData.count || 0;
            
            if (workspaceId) {
              if (!newWorkspaceCounts[workspaceId]) {
                newWorkspaceCounts[workspaceId] = {
                  totalUnread: 0,
                  channels: {},
                  name: channelData.workspaceName || prev[workspaceId]?.name || ""
                };
              }
              
              // Ajouter le canal et son compteur
              newWorkspaceCounts[workspaceId].channels[channelId] = count;
              newWorkspaceCounts[workspaceId].totalUnread += count;
            }
          });
          
          // Préserver les workspaces existants qui n'ont pas de canaux avec des messages non lus
          Object.keys(prev).forEach(workspaceId => {
            if (!newWorkspaceCounts[workspaceId]) {
              newWorkspaceCounts[workspaceId] = {
                totalUnread: 0,
                channels: {},
                name: prev[workspaceId].name || ""
              };
            }
          });
          
          return newWorkspaceCounts;
        });
      }
    };

    // Attacher les listeners
    socket.on('privateMessage', handlePrivateMessage);
    socket.on('message', handleChannelMessage);
    socket.on('newMessage', handleChannelMessage);
    socket.on('channelMessage', handleChannelMessage);
    socket.on('workspaceMessage', handleChannelMessage);
    socket.on('unreadChannelMessagesUpdated', handleUnreadChannelMessagesUpdated);

    // Récupérer les compteurs initialement
    if (!initialFetchDone.current) {
      setTimeout(() => {
        refreshUnreadCounts();
        initialFetchDone.current = true;
      }, 1000);
    }

    return () => {
      socket.off('privateMessage', handlePrivateMessage);
      socket.off('message', handleChannelMessage);
      socket.off('newMessage', handleChannelMessage);
      socket.off('channelMessage', handleChannelMessage);
      socket.off('workspaceMessage', handleChannelMessage);
      socket.off('unreadChannelMessagesUpdated', handleUnreadChannelMessagesUpdated);
    };
  }, [socket, currentUserId, fetchWorkspaceUnreadCounts]);

  // Fonction de test pour vérifier la connectivité
  const testSocketConnection = useCallback(() => {
    if (socket) {
      socket.emit('ping', { timestamp: Date.now() });
      
      socket.on('pong', (data) => {
        // Réponse reçue
      });
    }
  }, [socket]);

  // Fonction pour forcer le refresh des compteurs
  const forceRefreshCounts = useCallback(() => {
    initialFetchDone.current = false;
    refreshUnreadCounts();
  }, [refreshUnreadCounts]);

  // Fonction pour s'abonner aux notifications
  const subscribeToNotifications = useCallback(() => {
    return () => {
      // Cleanup
    };
  }, []);

  // NOUVEAU: Fonction pour obtenir le compteur d'un workspace
  const getWorkspaceUnreadCount = useCallback((workspaceId) => {
    return workspaceUnreadCounts[workspaceId]?.totalUnread || 0;
  }, [workspaceUnreadCounts]);

  // NOUVEAU: Fonction pour obtenir le compteur d'un canal
  const getChannelUnreadCount = useCallback((channelId) => {
    const channelData = channelUnreadCounts[channelId];
    if (channelData && typeof channelData === 'object') {
      return channelData.count || 0;
    }
    return channelData || 0;
  }, [channelUnreadCounts]);

  // NOUVEAU: Fonction pour forcer un refresh complet des compteurs
  const forceFullRefresh = useCallback(async () => {
    console.log("🔄 SocketContext: Refresh complet forcé");
    initialFetchDone.current = false;
    await refreshUnreadCounts();
    
    // Forcer une mise à jour des états pour déclencher les re-renders
    setForceUpdate(prev => prev + 1);
    
    // Émettre un événement global pour notifier tous les composants
    const event = new CustomEvent('forceUnreadCountsUpdate', {
      detail: { 
        timestamp: Date.now(),
        workspaceUnreadCounts,
        channelUnreadCounts,
        unreadMessages 
      }
    });
    window.dispatchEvent(event);
  }, [refreshUnreadCounts, workspaceUnreadCounts, channelUnreadCounts, unreadMessages]);

  // Debug function pour vérifier l'état
  const getDebugInfo = useCallback(() => {
    return {
      socketConnected: isConnected,
      socketId: socket?.id,
      currentUserId,
      workspaceCount: Object.keys(workspaceUnreadCounts).length,
      channelCount: Object.keys(channelUnreadCounts).length,
      privateMessageCount: Object.keys(unreadMessages).length,
      totalWorkspaceUnread: Object.values(workspaceUnreadCounts).reduce(
        (sum, workspace) => sum + (workspace.totalUnread || 0), 0
      ),
      totalPrivateUnread: Object.values(unreadMessages).reduce((sum, count) => sum + count, 0),
      lastUpdate: new Date().toLocaleTimeString()
    };
  }, [isConnected, socket, currentUserId, workspaceUnreadCounts, channelUnreadCounts, unreadMessages]);

  // Total des messages non lus (privés + canaux) - CORRIGÉ
  const totalUnreadCount = useMemo(() => {
    // Calculer le total des messages privés
    const privateTotal = Object.values(unreadMessages).reduce((sum, count) => {
      const numericCount = typeof count === 'number' ? count : 0;
      return sum + numericCount;
    }, 0);
    
    // Calculer le total des workspaces - CORRECTION ICI
    const workspaceTotal = Object.values(workspaceUnreadCounts).reduce((sum, workspace) => {
      // S'assurer que workspace est un objet et a une propriété totalUnread numérique
      if (workspace && typeof workspace === 'object' && typeof workspace.totalUnread === 'number') {
        return sum + workspace.totalUnread;
      }
      return sum;
    }, 0);
    
    return privateTotal + workspaceTotal;
  }, [unreadMessages, workspaceUnreadCounts]);

  const value = {
    socket,
    isConnected,
    currentUserId,
    
    // Messages privés - GARDÉ INTACT
    unreadMessages,
    
    // NOUVEAU système pour workspaces/canaux
    workspaceUnreadCounts,
    channelUnreadCounts,
    getWorkspaceUnreadCount,
    getChannelUnreadCount,
    
    // Compteur total
    totalUnreadCount,
    
    // Fonctions
    refreshUnreadCounts,
    markChannelAsRead,
    subscribeToNotifications,
    forceRefreshCounts,
    forceFullRefresh, // Nouvelle fonction de refresh complet
    testSocketConnection,
    getDebugInfo, // Nouvelle fonction de debug
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
