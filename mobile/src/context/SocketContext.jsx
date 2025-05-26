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

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.83:3000';

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

  // Fonction pour récupérer les compteurs de messages privés - GARDÉE INTACTE
  const fetchUnreadCounts = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("Socket: Pas de token, impossible de récupérer les compteurs privés");
        return;
      }

      console.log("Socket: Fetching private message unread counts");

      const response = await fetch(
        `${API_URL}/api/private-messages/unread-counts`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const counts = await response.json();
        console.log("Socket: Private unread counts received:", Object.keys(counts).length);

        setUnreadMessages((prevCounts) => {
          const prevTotal = Object.values(prevCounts).reduce((sum, val) => sum + val, 0);
          const newTotal = Object.values(counts).reduce((sum, val) => sum + val, 0);

          if (prevTotal !== newTotal || JSON.stringify(prevCounts) !== JSON.stringify(counts)) {
            console.log(`Socket: Total messages privés non lus: ${prevTotal} → ${newTotal}`);
            return counts;
          }
          return prevCounts;
        });
      } else {
        console.error("Socket: Erreur lors de la récupération des compteurs privés:", response.status);
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
        console.log("Socket: Pas de token pour les compteurs workspace");
        return;
      }

      console.log("🏢 Socket: Fetching workspace/channel unread counts");

      const response = await fetch(
        `${API_URL}/api/messages/unread-by-workspace`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("🏢 Socket: Workspace unread data received:", data);

        // Structure attendue: { workspaceId: { totalUnread: number, channels: { channelId: count } } }
        setWorkspaceUnreadCounts(prevCounts => {
          const newCounts = data.workspaces || {};
          // Force un re-render même si les données sont similaires
          return { ...newCounts };
        });
        
        // Aplatir pour avoir channelId: count
        const flatChannelCounts = {};
        Object.values(data.workspaces || {}).forEach(workspace => {
          Object.assign(flatChannelCounts, workspace.channels || {});
        });
        setChannelUnreadCounts(prevCounts => {
          // Force un re-render même si les données sont similaires
          return { ...flatChannelCounts };
        });
        
        console.log("🏢 Socket: Workspace counts updated:", Object.keys(data.workspaces || {}).length, "workspaces");
        console.log("🏢 Socket: Channel counts updated:", Object.keys(flatChannelCounts).length, "channels");
      }
    } catch (error) {
      console.error("Socket: Erreur fetchWorkspaceUnreadCounts:", error);
    }
  }, []);

  // Fonction pour marquer un canal comme lu
  const markChannelAsRead = useCallback(async (workspaceId, channelId) => {
    try {
      console.log(`🏢 Socket: Marking channel ${channelId} in workspace ${workspaceId} as read`);
      
      const token = await AsyncStorage.getItem("token");
      if (token) {
        await fetch(`${API_URL}/api/messages/channels/${channelId}/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // Mettre à jour les compteurs localement
      setChannelUnreadCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[channelId];
        return newCounts;
      });

      setWorkspaceUnreadCounts(prev => {
        const newWorkspaceCounts = { ...prev };
        if (newWorkspaceCounts[workspaceId]) {
          const channelCount = newWorkspaceCounts[workspaceId].channels?.[channelId] || 0;
          newWorkspaceCounts[workspaceId] = {
            ...newWorkspaceCounts[workspaceId],
            totalUnread: Math.max(0, (newWorkspaceCounts[workspaceId].totalUnread || 0) - channelCount),
            channels: { ...newWorkspaceCounts[workspaceId].channels }
          };
          delete newWorkspaceCounts[workspaceId].channels[channelId];
        }
        return newWorkspaceCounts;
      });

    } catch (error) {
      console.error("Socket: Erreur markChannelAsRead:", error);
    }
  }, []);

  // Fonction combinée pour rafraîchir tous les compteurs
  const refreshUnreadCounts = useCallback(async () => {
    console.log("🔄 Socket: Refreshing all unread counts");
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
        console.log("[DEBUG] Token récupéré pour connexion socket:", !!token);
        if (!token) return;

        // Extraire l'ID utilisateur du token AVANT la connexion
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.id) {
              setCurrentUserId(payload.id);
              console.log("🔑 Socket: Current user ID set:", payload.id);
            }
          }
        } catch (e) {
          console.error("Error parsing token:", e);
        }

        console.log("Socket: Connecting to", API_URL);

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
          console.log("[DEBUG] Socket connecté! ID:", newSocket.id);
          setConnected(true);
          newSocket.emit("joinPrivate");
          
          // Délai court pour s'assurer que la connexion est stable
          setTimeout(() => {
            refreshUnreadCounts();
          }, 500);
        });

        newSocket.on("connect_error", (err) => {
          console.error("[DEBUG] Erreur de connexion socket:", err, err?.message, err?.data);
          setConnected(false);
        });

        newSocket.on("disconnect", (reason) => {
          console.log("Socket: Disconnected", reason);
          setConnected(false);
        });

        // Event pour forcer un refresh des compteurs
        newSocket.on("refreshUnreadCounts", () => {
          console.log("📢 Socket: Server requested unread counts refresh");
          refreshUnreadCounts();
        });

        setSocket(newSocket);

        return () => {
          if (newSocket) {
            console.log("Socket: Cleaning up connection");
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
      console.log("🔌 Socket: Waiting for socket and currentUserId", { 
        hasSocket: !!socket, 
        currentUserId 
      });
      return;
    }

    console.log("🔌 Socket: Setting up channel notification listeners");

    // Handler pour les messages privés - GARDÉ INTACT
    const handlePrivateMessage = (data) => {
      console.log("💬 Socket: PRIVATE MESSAGE RECEIVED");
      console.log("   📊 Raw data:", JSON.stringify(data, null, 2));
      console.log("   👤 Current user ID:", currentUserId);
      console.log("   📤 From user:", data.fk_expediteur);
      
      if (data && data.fk_expediteur !== currentUserId) {
        console.log("✅ Socket: Processing private message (not from current user)");
        
        setUnreadMessages(prev => {
          const newCounts = { ...prev };
          newCounts[data.fk_expediteur] = (newCounts[data.fk_expediteur] || 0) + 1;
          console.log("📱 Socket: Updated private message counts:", newCounts);
          return newCounts;
        });
      }
    };

    // NOUVEAU handler pour les messages de canal - AMÉLIORÉ
    const handleChannelMessage = (data) => {
      console.log("🏢 Socket: CHANNEL MESSAGE RECEIVED");
      console.log("   📊 Raw data:", JSON.stringify(data, null, 2));
      console.log("   👤 Current user ID:", currentUserId);
      console.log("   📝 Message from user:", data.fk_utilisateur || data.user_id);
      console.log("   🏷️ Channel ID:", data.fk_canal || data.canal_id);
      console.log("   🏢 Workspace ID:", data.fk_workspace || data.workspace_id);
      
      const messageUserId = data.fk_utilisateur || data.user_id;
      const channelId = data.fk_canal || data.canal_id;
      const workspaceId = data.fk_workspace || data.workspace_id;
      
      if (data && messageUserId !== currentUserId && channelId && workspaceId) {
        console.log("✅ Socket: Processing channel message (not from current user)");
        
        // Incrémenter le compteur du canal
        setChannelUnreadCounts(prev => {
          const newCounts = { ...prev };
          newCounts[channelId] = (newCounts[channelId] || 0) + 1;
          console.log(`📈 Socket: Channel ${channelId} count: ${newCounts[channelId]}`);
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
          
          console.log(`🏢 Socket: Workspace ${workspaceId} total: ${newCounts[workspaceId].totalUnread}`);
          console.log("📱 Socket: Updated workspace counts:", Object.keys(newCounts).length, "workspaces");
          return newCounts;
        });

        // Force un refresh après un court délai pour synchroniser avec le serveur
        setTimeout(() => {
          console.log("🔄 Socket: Auto-refreshing counts after new message");
          fetchWorkspaceUnreadCounts();
        }, 1000);
        
      } else {
        console.log("❌ Socket: Ignoring channel message - Reason:", {
          isOwnMessage: messageUserId === currentUserId,
          missingChannelId: !channelId,
          missingWorkspaceId: !workspaceId,
          missingData: !data,
          currentUserId,
          messageUserId
        });
      }
    };

    // *** NOUVEAU handler pour la mise à jour directe des compteurs depuis le serveur ***
    const handleUnreadChannelMessagesUpdated = (data) => {
      console.log("🔔 Socket: UNREAD CHANNEL MESSAGES UPDATED from server");
      console.log("   📊 Raw data:", JSON.stringify(data, null, 2));
      
      if (data && data.channels) {
        console.log("✅ Socket: Updating channel counts from server");
        
        // Mettre à jour les compteurs de canaux directement
        setChannelUnreadCounts(prev => {
          const newCounts = {};
          Object.keys(data.channels).forEach(channelId => {
            newCounts[channelId] = data.channels[channelId].count || 0;
          });
          console.log("📱 Socket: Channel counts updated from server:", Object.keys(newCounts).length, "channels");
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
          
          console.log("🏢 Socket: Workspace counts recalculated from server data");
          Object.keys(newWorkspaceCounts).forEach(wsId => {
            console.log(`🏢 Socket: Workspace ${wsId} - Total: ${newWorkspaceCounts[wsId].totalUnread}, Channels: ${Object.keys(newWorkspaceCounts[wsId].channels).length}`);
          });
          
          return newWorkspaceCounts;
        });
        
        console.log(`🔔 Socket: Total unread from server: ${data.total || 0}`);
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
      console.log("🔄 Socket: Initial fetch of unread counts");
      setTimeout(() => {
        refreshUnreadCounts();
        initialFetchDone.current = true;
      }, 1000);
    }

    return () => {
      console.log("🧹 Socket: Cleaning up notification listeners");
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
      console.log("Socket: Testing connection...");
      socket.emit('ping', { timestamp: Date.now() });
      
      socket.on('pong', (data) => {
        console.log("Socket: Pong received", data);
      });
    }
  }, [socket]);

  // Fonction pour forcer le refresh des compteurs
  const forceRefreshCounts = useCallback(() => {
    console.log("Socket: Force refreshing counts...");
    initialFetchDone.current = false;
    refreshUnreadCounts();
  }, [refreshUnreadCounts]);

  // Fonction pour s'abonner aux notifications
  const subscribeToNotifications = useCallback(() => {
    console.log("Socket: subscribeToNotifications called");
    return () => {
      console.log("Socket: unsubscribe called");
    };
  }, []);

  // NOUVEAU: Fonction pour obtenir le compteur d'un workspace
  const getWorkspaceUnreadCount = useCallback((workspaceId) => {
    return workspaceUnreadCounts[workspaceId]?.totalUnread || 0;
  }, [workspaceUnreadCounts]);

  // NOUVEAU: Fonction pour obtenir le compteur d'un canal
  const getChannelUnreadCount = useCallback((channelId) => {
    return channelUnreadCounts[channelId] || 0;
  }, [channelUnreadCounts]);

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
      )
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
    
    console.log(`🔢 Socket: Total calculation - Private: ${privateTotal}, Workspace: ${workspaceTotal}, Total: ${privateTotal + workspaceTotal}`);
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
    testSocketConnection,
    getDebugInfo, // Nouvelle fonction de debug
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
