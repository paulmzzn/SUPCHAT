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
import { io } from "socket.io-client";
import env from "../config/env";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.71.234:3000";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setConnected] = useState(false);

  // Messages privés - GARDÉ INTACT
  const [unreadMessages, setUnreadMessages] = useState({});
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [conversationTimestamps, setConversationTimestamps] = useState({});

  // Référence pour stocker les abonnements aux notifications
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
          const prevTotal = Object.values(prevCounts).reduce(
            (sum, val) => sum + val,
            0
          );
          const newTotal = Object.values(counts).reduce(
            (sum, val) => sum + val,
            0
          );

          if (
            prevTotal !== newTotal ||
            JSON.stringify(prevCounts) !== JSON.stringify(counts)
          ) {
            console.log("Socket: Setting total unread count to", newTotal);
            setTotalUnreadCount(newTotal);
            return counts;
          }
          return prevCounts;
        });
      }
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    }
  }, []);

  // Connexion au socket
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
    if (connected && !initialFetchDone.current) {
      console.log("Socket: Initial fetch of unread counts");
      fetchUnreadCounts();
      initialFetchDone.current = true;
    }
  }, [connected, fetchUnreadCounts]);

  // Fonction pour mettre à jour les timestamps des conversations
  const updateConversationTimestamp = useCallback(
    async (userId) => {
      try {
        const timestamp = Date.now();

        // Récupérer les timestamps existants
        const timestampsStr = await AsyncStorage.getItem(
          "conversationTimestamps"
        );
        let timestamps = {};

        if (timestampsStr) {
          try {
            timestamps = JSON.parse(timestampsStr);
          } catch (e) {
            console.error("Error parsing timestamps:", e);
          }
        }

        // Mettre à jour avec le nouveau timestamp
        const newTimestamps = {
          ...timestamps,
          [userId]: timestamp,
        };

        // Sauvegarder dans AsyncStorage
        await AsyncStorage.setItem(
          "conversationTimestamps",
          JSON.stringify(newTimestamps)
        );

        // Mettre à jour l'état local
        setConversationTimestamps(newTimestamps);

        // Notifier les écouteurs de l'événement
        notifyListeners({
          type: "timestampUpdated",
          userId,
          timestamp,
        });
      } catch (e) {
        console.error("Error updating conversation timestamp:", e);
      }
    },
    [notifyListeners]
  );

  // Handler de message privé avec debounce
  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handlePrivateMessage = (msg) => {
      console.log("Socket: New private message received", msg.id_message_prive);

      // Si le message vient de quelqu'un d'autre, incrémenter le compteur
      if (msg.fk_expediteur !== currentUserId) {
        // Mettre à jour le timestamp de cette conversation
        updateConversationTimestamp(msg.fk_expediteur);

        // Mettre à jour le compteur de messages non lus
        setUnreadMessages((prev) => {
          const senderId = msg.fk_expediteur;
          const newCount = { ...prev, [senderId]: (prev[senderId] || 0) + 1 };

          // Calculer nouveau total
          const newTotal = Object.values(newCount).reduce(
            (sum, val) => sum + val,
            0
          );

          // Mettre à jour le total de façon atomique
          setTotalUnreadCount(newTotal);

          // Utiliser debounce pour les notifications
          if (debounceTimer.current) clearTimeout(debounceTimer.current);
          debounceTimer.current = setTimeout(() => {
            notifyListeners({
              type: "newPrivateMessage",
              senderId,
              message: msg,
              unreadCount: newCount[senderId],
              totalUnreadCount: newTotal,
            });
          }, 300);

          return newCount;
        });
      }
    };

    socket.on("privateMessage", handlePrivateMessage);

    return () => {
      socket.off("privateMessage", handlePrivateMessage);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [socket, currentUserId, updateConversationTimestamp]);

  // Méthode pour marquer les messages comme lus
  const markMessagesAsRead = useCallback(
    (userId) => {
      if (!userId) return;

      setUnreadMessages((prev) => {
        const newCounts = { ...prev };

        // Si cette personne a des messages non lus, les supprimer
        if (newCounts[userId]) {
          const countRemoved = newCounts[userId];
          delete newCounts[userId];

          // Recalculer le total
          const newTotal = Math.max(0, totalUnreadCount - countRemoved);
          setTotalUnreadCount(newTotal);
        }

        return newCounts;
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

  // Chargement initial des timestamps
  useEffect(() => {
    const loadTimestamps = async () => {
      try {
        const timestampsStr = await AsyncStorage.getItem(
          "conversationTimestamps"
        );
        if (timestampsStr) {
          const timestamps = JSON.parse(timestampsStr);
          setConversationTimestamps(timestamps);
        }
      } catch (e) {
        console.error("Error loading conversation timestamps:", e);
      }
    };

    loadTimestamps();
  }, []);

  const value = {
    socket,
    connected,
    unreadMessages,
    totalUnreadCount,
    currentUserId,
    conversationTimestamps,
    markMessagesAsRead,
    subscribeToNotifications,
    forceRefreshCounts,
    forceFullRefresh, // Nouvelle fonction de refresh complet
    testSocketConnection,
    getDebugInfo, // Nouvelle fonction de debug
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
